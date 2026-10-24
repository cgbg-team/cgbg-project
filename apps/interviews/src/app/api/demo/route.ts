import cache from "@/data/demo/gio-interview.json";

export function GET() {
  return Response.json({ events: cache.events, country: cache.country, generatedAt: cache.generatedAt });
}
