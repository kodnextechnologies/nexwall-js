// NexWall: tiny, zero-dependency client for the NexWall free wallpaper API.
// Works in Node 18+, Deno, Bun, Cloudflare Workers and (behind your own proxy) browsers.

export const DEFAULT_BASE_URL = "https://nexwall.kodnextech.com/api/developer/v1";

export class NexWallError extends Error {
  constructor(message, { status, retryAfter, body } = {}) {
    super(message);
    this.name = "NexWallError";
    this.status = status;
    this.retryAfter = retryAfter;
    this.body = body;
  }
}

export class NexWall {
  /**
   * @param {{ apiKey?: string, baseUrl?: string, fetch?: typeof fetch }} [options]
   *   apiKey  – your NexWall API key (falls back to process.env.NEXWALL_API_KEY).
   *             Not required when baseUrl points at your own proxy that adds the key.
   *   baseUrl – override to call your backend proxy instead of NexWall directly.
   */
  constructor(options = {}) {
    const env = typeof process !== "undefined" && process.env ? process.env : {};
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.apiKey = options.apiKey ?? env.NEXWALL_API_KEY;
    this.fetch = options.fetch || globalThis.fetch;
    this.rateLimit = null;

    if (!this.fetch) throw new NexWallError("No fetch implementation found. Use Node 18+ or pass { fetch }.");
  }

  /**
   * Keyless demo: up to 10 free wallpapers, no API key needed (limited per IP).
   * @param {{ perPage?: number, categoryId?: number, search?: string, sort?: "newest"|"popular"|"random" }} [params]
   */
  demo(params = {}) {
    return this.#get("/demo/wallpapers", {
      per_page: params.perPage,
      category_id: params.categoryId,
      search: params.search,
      sort: params.sort,
    }, { keyless: true });
  }

  /** List categories available on your plan. */
  categories() {
    return this.#get("/categories");
  }

  /**
   * Paginated wallpaper feed.
   * @param {{ page?: number, perPage?: number, categoryId?: number, type?: "image"|"live",
   *           search?: string, sort?: "newest"|"oldest"|"popular"|"random" }} [params]
   */
  wallpapers(params = {}) {
    return this.#get("/wallpapers", {
      page: params.page,
      per_page: params.perPage,
      category_id: params.categoryId,
      type: params.type,
      search: params.search,
      sort: params.sort,
    });
  }

  /** Wallpapers in a single category. */
  categoryWallpapers(categoryId, params = {}) {
    return this.#get(`/categories/${encodeURIComponent(categoryId)}/wallpapers`, {
      page: params.page,
      per_page: params.perPage,
    });
  }

  /** One wallpaper by id. */
  async wallpaper(id) {
    const res = await this.#get(`/wallpapers/${encodeURIComponent(id)}`);
    return res && res.data && !Array.isArray(res.data) ? res.data : res;
  }

  /** Convenience: one random wallpaper (optionally from a category). */
  async random(params = {}) {
    const res = await this.wallpapers({ ...params, sort: "random", perPage: 1 });
    return res.data?.[0] ?? null;
  }

  async #get(path, query = {}, { keyless = false } = {}) {
    if (!keyless && !this.apiKey && this.baseUrl === DEFAULT_BASE_URL) {
      throw new NexWallError("Missing API key. Get a free key at https://nexwall.kodnextech.com/developers/register (or try demo() without a key)");
    }

    const url = new URL(this.baseUrl + path);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    }

    const headers = { Accept: "application/json" };
    if (this.apiKey && !keyless) headers.Authorization = `Bearer ${this.apiKey}`;

    const res = await this.fetch(url, { headers });
    this.rateLimit = {
      limit: toInt(res.headers.get("x-ratelimit-limit")),
      remaining: toInt(res.headers.get("x-ratelimit-remaining")),
      reset: toInt(res.headers.get("x-ratelimit-reset")),
      plan: res.headers.get("x-developer-api-plan"),
    };

    const text = await res.text();
    let body;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    if (!res.ok) {
      const message = (body && typeof body === "object" && body.message) || `NexWall API error ${res.status}`;
      throw new NexWallError(message, { status: res.status, retryAfter: toInt(res.headers.get("retry-after")), body });
    }
    return body;
  }
}

function toInt(value) {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) ? n : null;
}

export default NexWall;
