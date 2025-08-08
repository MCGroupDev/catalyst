/* eslint-disable check-file/folder-naming-convention */
/*
 * Proxy to the existing BigCommerce sitemap index on the canonical URL
 */

import { getSitemap, getSitemapIndex } from '@bigcommerce/catalyst-sitemap-client';

import { getChannelIdFromLocale } from '~/channels.config';
import { defaultLocale } from '~/i18n/locales';
import { backendUserAgent } from '~/userAgent';

export const GET = async (request: Request) => {
  const url = new URL(request.url);
  const incomingHost = request.headers.get('host') ?? url.host;
  const incomingProto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');

  const channelId = getChannelIdFromLocale(defaultLocale) ?? '';
  const config = {
    storeHash: process.env.BIGCOMMERCE_STORE_HASH ?? '',
    channelId,
    graphqlApiDomain: process.env.BIGCOMMERCE_GRAPHQL_API_DOMAIN ?? 'mybigcommerce.com',
    trustedProxySecret: process.env.BIGCOMMERCE_TRUSTED_PROXY_SECRET,
    backendUserAgentExtensions: backendUserAgent,
  };

  const type = url.searchParams.get('type');
  const page = url.searchParams.get('page');

  if (type !== null || page !== null) {
    if (!type || !page) {
      return new Response('Both "type" and "page" query params are required', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const xml = await getSitemap(config, { type, page });

    return new Response(xml ?? '', {
      status: xml ? 200 : 502,
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  const sitemapIndex = await getSitemapIndex(config);

  if (!sitemapIndex) {
    return new Response('Failed to fetch sitemap index', { status: 502 });
  }

  const rewritten = sitemapIndex.replace(
    /<loc>([^<]+)<\/loc>/g,
    (match: string, locUrlStr: string) => {
      try {
        const decoded: string = locUrlStr.replace(/&amp;/g, '&');
        const original = new URL(decoded);

        if (!original.pathname.endsWith('/xmlsitemap.php')) return match;

        const normalized = new URL(`${incomingProto}://${incomingHost}/sitemap.xml`);
        const t = original.searchParams.get('type');
        const p = original.searchParams.get('page');

        if (!t || !p) return match;
        normalized.searchParams.set('type', t);
        normalized.searchParams.set('page', p);

        const normalizedXml: string = normalized.toString().replace(/&/g, '&amp;');

        return `<loc>${normalizedXml}</loc>`;
      } catch {
        return match;
      }
    },
  );

  return new Response(rewritten, { headers: { 'Content-Type': 'application/xml' } });
};
