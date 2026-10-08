import { test } from "node:test";
import assert from "node:assert/strict";
import { NexWall, NexWallError } from "../index.js";

function fakeFetch(status, body, headers = {}) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
  };
  fn.calls = calls;
  return fn;
}

test("sends bearer key, maps query params and reads rate-limit headers", async () => {
  const fetch = fakeFetch(200, { data: [{ id: 1 }], plan: "free" }, { "x-ratelimit-remaining": "99", "x-ratelimit-limit": "100" });
  const client = new NexWall({ apiKey: "k", fetch });

  const res = await client.wallpapers({ categoryId: 5, perPage: 20, sort: "popular" });

  assert.equal(res.data[0].id, 1);
  const url = new URL(fetch.calls[0].url);
  assert.equal(url.pathname, "/api/developer/v1/wallpapers");
  assert.equal(url.searchParams.get("category_id"), "5");
  assert.equal(url.searchParams.get("per_page"), "20");
  assert.equal(url.searchParams.get("sort"), "popular");
  assert.equal(fetch.calls[0].init.headers.Authorization, "Bearer k");
  assert.equal(client.rateLimit.remaining, 99);
});

test("throws NexWallError with retryAfter on 429", async () => {
  const client = new NexWall({ apiKey: "k", fetch: fakeFetch(429, { message: "Daily quota exceeded" }, { "retry-after": "120" }) });
  await assert.rejects(client.categories(), (err) => {
    assert.ok(err instanceof NexWallError);
    assert.equal(err.status, 429);
    assert.equal(err.retryAfter, 120);
    assert.equal(err.message, "Daily quota exceeded");
    return true;
  });
});

test("requires a key for the public API but not for a custom proxy", async () => {
  const saved = process.env.NEXWALL_API_KEY;
  delete process.env.NEXWALL_API_KEY;
  try {
    await assert.rejects(new NexWall({ fetch: fakeFetch(200, {}) }).categories(), NexWallError);
    const proxied = new NexWall({ baseUrl: "https://my-app.example/api/nexwall", fetch: fakeFetch(200, { data: [] }) });
    assert.equal(proxied.apiKey, undefined);
    await proxied.categories();
  } finally {
    if (saved !== undefined) process.env.NEXWALL_API_KEY = saved;
  }
});

test("demo() works without a key and never sends one", async () => {
  const saved = process.env.NEXWALL_API_KEY;
  delete process.env.NEXWALL_API_KEY;
  try {
    const fetch = fakeFetch(200, { demo: true, data: [{ id: 9 }] });
    const res = await new NexWall({ fetch }).demo({ perPage: 5, sort: "random" });
    assert.equal(res.data[0].id, 9);
    const url = new URL(fetch.calls[0].url);
    assert.equal(url.pathname, "/api/developer/v1/demo/wallpapers");
    assert.equal(url.searchParams.get("per_page"), "5");
    assert.equal(fetch.calls[0].init.headers.Authorization, undefined);

    const keyed = fakeFetch(200, { data: [] });
    await new NexWall({ apiKey: "k", fetch: keyed }).demo();
    assert.equal(keyed.calls[0].init.headers.Authorization, undefined);
  } finally {
    if (saved !== undefined) process.env.NEXWALL_API_KEY = saved;
  }
});

test("random() returns a single wallpaper", async () => {
  const fetch = fakeFetch(200, { data: [{ id: 7 }] });
  const wp = await new NexWall({ apiKey: "k", fetch }).random({ categoryId: 3 });
  assert.equal(wp.id, 7);
  assert.equal(new URL(fetch.calls[0].url).searchParams.get("sort"), "random");
});
