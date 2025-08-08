import { getSitemap, getSitemapIndex } from '@bigcommerce/catalyst-sitemap-client';
import type { MetadataRoute } from 'next';

import { getChannelIdFromLocale } from '~/channels.config';
import { defaultLocale } from '~/i18n/locales';
import { backendUserAgent } from '~/userAgent';

const SITE_URL = (
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  'http://localhost:3000'
).replace(/\/$/, '');

function buildClientConfig() {
  const channelId = getChannelIdFromLocale(defaultLocale) ?? '';

  return {
    storeHash: process.env.BIGCOMMERCE_STORE_HASH ?? '',
    channelId,
    graphqlApiDomain: process.env.BIGCOMMERCE_GRAPHQL_API_DOMAIN ?? 'mybigcommerce.com',
    trustedProxySecret: process.env.BIGCOMMERCE_TRUSTED_PROXY_SECRET,
    backendUserAgentExtensions: backendUserAgent,
  } as const;
}

function parseIndexXmlToIds(xml: string): Array<{ id: string }> {
  const ids: Array<{ id: string }> = [];

  xml.replace(/<loc>([^<]+)<\/loc>/g, (_match: string, locUrlStr: string) => {
    try {
      const decoded: string = locUrlStr.replace(/&amp;/g, '&');
      const original = new URL(decoded);

      if (!original.pathname.endsWith('/xmlsitemap.php')) return _match;

      const type = original.searchParams.get('type');
      const page = original.searchParams.get('page');

      if (!type || !page) return _match;

      ids.push({ id: `${type}-${page}` });

      return _match;
    } catch {
      return _match;
    }
  });

  return ids;
}

function extractUrlsFromSitemapXml(xml: string): string[] {
  const urls: string[] = [];

  xml.replace(/<loc>([^<]+)<\/loc>/g, (_match: string, locUrlStr: string) => {
    try {
      const decoded: string = locUrlStr.replace(/&amp;/g, '&');
      const absolute = new URL(decoded);

      urls.push(`${SITE_URL}${absolute.pathname}${absolute.search}`);

      return _match;
    } catch {
      return _match;
    }
  });

  return urls;
}

export async function generateSitemaps() {
  const config = buildClientConfig();
  const indexXml = await getSitemapIndex(config);

  if (!indexXml) return [] as Array<{ id: string }>;

  return parseIndexXmlToIds(indexXml);
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const [type, page] = id.split('-', 2);

  if (!type || !page) {
    return [];
  }

  const config = buildClientConfig();
  const xml = await getSitemap(config, { type, page });

  if (!xml) return [];

  const urls = extractUrlsFromSitemapXml(xml);

  return urls.map((url) => ({ url }));
}
