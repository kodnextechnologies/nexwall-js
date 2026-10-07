# nexwall: JavaScript client for the free NexWall wallpaper API

Zero-dependency JavaScript / TypeScript client for **[NexWall](https://nexwall.kodnextech.com/wallpaper-api/free-wallpaper-api)**, a free wallpaper API built for wallpaper apps: curated **4K portrait wallpapers** (up to 2160×3840) in **50+ categories**, plus looping **live MP4 wallpapers**.

- Free plan: **100 requests/day**, no credit card. [Get a free API key](https://nexwall.kodnextech.com/developers/register)
- Works in Node 18+, Bun, Deno and Cloudflare Workers. TypeScript types included.

```bash
npm install nexwall
```

## Usage

```js
import { NexWall } from "nexwall";

const nexwall = new NexWall({ apiKey: process.env.NEXWALL_API_KEY });

const { data: categories } = await nexwall.categories();
const { data: wallpapers } = await nexwall.wallpapers({ categoryId: categories[0].id, sort: "popular", perPage: 20 });
const random = await nexwall.random();

console.log(wallpapers.map((w) => w.image_url), random?.image_url);
console.log(nexwall.rateLimit); // { limit, remaining, reset, plan }
```

| Method | API endpoint |
|---|---|
| `categories()` | `GET /categories` |
| `wallpapers({ page, perPage, categoryId, type, search, sort })` | `GET /wallpapers` |
| `categoryWallpapers(categoryId, { page, perPage })` | `GET /categories/{id}/wallpapers` |
| `wallpaper(id)` | `GET /wallpapers/{id}` |
| `random({ categoryId, type, search })` | `GET /wallpapers?sort=random&per_page=1` |

`sort` is one of `newest`, `oldest`, `popular`, `random`. `type: "live"` requires the Ultra plan.

## Errors and rate limits

Failed requests throw `NexWallError` with `status`, `retryAfter` (seconds, on `429`) and the response `body`:

```js
import { NexWall, NexWallError } from "nexwall";

try {
  await nexwall.wallpapers();
} catch (err) {
  if (err instanceof NexWallError && err.status === 429) {
    console.log(`Quota reached, retry in ${err.retryAfter}s`);
  }
}
```

## Keep your key on the server

Don't put your API key in browser or mobile bundles. Call NexWall from your backend, or point the client at your own proxy (no key needed client-side):

```js
const nexwall = new NexWall({ baseUrl: "https://your-app.example/api/nexwall" });
```

Complete proxy examples for Next.js, Laravel and plain Node are in [nexwall-web-starter](https://github.com/kodnextechnologies/nexwall-web-starter).

## Plans

| Plan | Price | Requests/day |
|---|---|---|
| Free | $0 | 100 |
| Pro | $4.99/mo · ₹399/mo | 10,000 (all categories, commercial use) |
| Ultra | $10.99/mo · ₹899/mo | 50,000 (+ live MP4 wallpapers) |

## Links

[API reference & examples](https://github.com/kodnextechnologies/free-wallpaper-api) · [Docs](https://nexwall.kodnextech.com/wallpaper-api/docs) · [OpenAPI](https://nexwall.kodnextech.com/openapi.json) · [Flutter starter](https://github.com/kodnextechnologies/nexwall-flutter-wallpaper-app) · [Android starter](https://github.com/kodnextechnologies/nexwall-android-kotlin-wallpaper-app) · [React Native starter](https://github.com/kodnextechnologies/nexwall-react-native-expo-wallpaper-app) · [Python client](https://github.com/kodnextechnologies/nexwall-python)

## License

MIT for this client. Wallpapers returned by the API are governed by the [NexWall Developer API License](https://nexwall.kodnextech.com/wallpaper-api/license).
