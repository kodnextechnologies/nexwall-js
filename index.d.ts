export declare const DEFAULT_BASE_URL: string;

export interface Category {
  id: number;
  name: string;
  slug: string;
  cover_image_url: string | null;
  wallpaper_count: number;
  is_premium: boolean;
}

export interface Wallpaper {
  id: number;
  category_id: number;
  image_url: string | null;
  thumbnail_url: string | null;
  is_premium: boolean;
  type: "image" | "live";
  video_url: string | null;
  video_thumbnail_url: string | null;
  duration_seconds: number | null;
  tags: string | null;
  resolution: string | null;
  file_size: number | null;
  category?: { id: number; name: string; slug: string; is_premium: boolean };
  categories?: Array<{ id: number; name: string; slug: string; is_premium: boolean }>;
}

export interface ListResponse<T> {
  data: T[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  plan?: string;
  remaining_requests_today?: number;
}

export interface WallpaperQuery {
  page?: number;
  perPage?: number;
  categoryId?: number;
  type?: "image" | "live";
  search?: string;
  sort?: "newest" | "oldest" | "popular" | "random";
}

export interface RateLimit {
  limit: number | null;
  remaining: number | null;
  reset: number | null;
  plan: string | null;
}

export declare class NexWallError extends Error {
  status?: number;
  retryAfter?: number | null;
  body?: unknown;
}

export declare class NexWall {
  constructor(options?: { apiKey?: string; baseUrl?: string; fetch?: typeof fetch });
  readonly baseUrl: string;
  rateLimit: RateLimit | null;
  categories(): Promise<ListResponse<Category>>;
  wallpapers(params?: WallpaperQuery): Promise<ListResponse<Wallpaper>>;
  categoryWallpapers(categoryId: number, params?: { page?: number; perPage?: number }): Promise<ListResponse<Wallpaper>>;
  wallpaper(id: number): Promise<Wallpaper>;
  random(params?: Omit<WallpaperQuery, "sort" | "perPage" | "page">): Promise<Wallpaper | null>;
}

export default NexWall;
