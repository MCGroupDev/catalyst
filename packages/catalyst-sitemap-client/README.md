## @bigcommerce/catalyst-sitemap-client

A small helper to handle Catalyst's `/sitemap.xml` route with:
- Sitemap index rewriting to the incoming host and normalized path `/sitemap.xml`, only when both `type` and `page` are present
- Proxying of specific sitemap pages when `type` and `page` are provided on the query string

### Usage

```ts
// core/app/sitemap.xml/route.ts
import { handleSitemapRoute } from '@bigcommerce/catalyst-sitemap-client';
import { client } from '~/client';
import { defaultLocale } from '~/i18n/locales';
import { getChannelIdFromLocale } from '~/channels.config';

export const GET = async (request: Request) =>
  handleSitemapRoute(request, {
    getSitemapIndex: () => client.fetchSitemapIndex(getChannelIdFromLocale(defaultLocale)),
    fetchSitemapResponse: ({ type, page }) =>
      client.fetchSitemapResponse({ type, page }, getChannelIdFromLocale(defaultLocale)),
  });
```


