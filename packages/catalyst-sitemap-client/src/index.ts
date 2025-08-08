import { getBackendUserAgent } from './utils/user-agent';

export interface SitemapClientConfig {
  storeHash: string;
  channelId: string;
  graphqlApiDomain?: string;
  trustedProxySecret?: string;
  platform?: string;
  backendUserAgentExtensions?: string;
}

function buildCanonicalUrl({ storeHash, channelId, graphqlApiDomain }: SitemapClientConfig) {
  const domain = graphqlApiDomain ?? 'mybigcommerce.com';

  return `https://store-${storeHash}-${channelId}.${domain}`;
}

function buildHeaders({
  trustedProxySecret,
  platform,
  backendUserAgentExtensions,
}: SitemapClientConfig) {
  const headers = new Headers();

  headers.set('Accept', 'application/xml');
  headers.set('Content-Type', 'application/xml');
  headers.set('User-Agent', getBackendUserAgent(platform, backendUserAgentExtensions));
  if (trustedProxySecret) headers.set('X-BC-Trusted-Proxy-Secret', trustedProxySecret);

  return headers;
}

export async function getSitemapIndex(config: SitemapClientConfig): Promise<string | null> {
  const base = buildCanonicalUrl(config);
  const url = `${base}/xmlsitemap.php`;
  const response = await fetch(url, { method: 'GET', headers: buildHeaders(config) });

  if (!response.ok) return null;

  return response.text();
}

export async function getSitemap(
  config: SitemapClientConfig,
  params: { type: string; page: string | number },
): Promise<string | null> {
  const base = buildCanonicalUrl(config);
  const url = new URL(`${base}/xmlsitemap.php`);

  url.searchParams.set('type', String(params.type));
  url.searchParams.set('page', String(params.page));

  const response = await fetch(url.toString(), { method: 'GET', headers: buildHeaders(config) });

  if (!response.ok) return null;

  return response.text();
}


