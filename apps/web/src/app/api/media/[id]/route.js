import sql from "@/app/api/utils/sql";
import { mediaPath } from "@/app/api/utils/media";

export async function GET(request, { params }) {
  if (!mediaPath.test(`/api/media/${params.id}`))
    return new Response(null, { status: 404 });
  try {
    const rows =
      await sql`SELECT mime_type, encode(content, 'base64') AS base64 FROM media_assets WHERE id = ${params.id}`;
    if (!rows.length) return new Response(null, { status: 404 });
    const etag = `"${params.id}"`;
    const headers = {
      "Content-Type": rows[0].mime_type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      ETag: etag,
    };
    if (request.headers.get("if-none-match") === etag)
      return new Response(null, { status: 304, headers });
    return new Response(Buffer.from(rows[0].base64, "base64"), { headers });
  } catch {
    return new Response(null, { status: 503 });
  }
}
