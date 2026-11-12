// Supabase Storage-compatible subset on R2 (public reads, admin writes).
import { respond, perr, CORS, identify, isAdmin } from './sb.js';

const keyOf = (bucket, path) => `${bucket}/${path}`;
const MAX_D1_FILE = 2 * 1024 * 1024; // D1 returns BLOBs as JS arrays, so keep files small (images are ~100-200KB)
const CHUNK = 700 * 1024;

/** workerd's formData() rejects supabase-js' unnamed part (append('', file)), so parse multipart by hand. */
function parseMultipart(buf, ct) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/.exec(ct);
  if (!m) return null;
  const te = new TextEncoder(), td = new TextDecoder('latin1');
  const bytes = new Uint8Array(buf), bnd = te.encode('--' + (m[1] || m[2]));
  const find = (needle, from) => {
    outer: for (let i = from; i <= bytes.length - needle.length; i++) {
      for (let j = 0; j < needle.length; j++) if (bytes[i + j] !== needle[j]) continue outer;
      return i;
    }
    return -1;
  };
  const sep = te.encode('\r\n\r\n');
  let best = null, pos = find(bnd, 0);
  while (pos >= 0) {
    const start = pos + bnd.length;
    if (bytes[start] === 45 && bytes[start + 1] === 45) break; // closing --
    const hEnd = find(sep, start);
    const next = find(bnd, hEnd + 4);
    if (hEnd < 0 || next < 0) break;
    const head = td.decode(bytes.slice(start, hEnd));
    const body = bytes.slice(hEnd + 4, next - 2); // drop trailing CRLF
    const type = /content-type:\s*([^\r\n]+)/i.exec(head)?.[1]?.trim();
    if (type || /filename=/i.test(head)) best = { body, type: type || 'application/octet-stream' };
    pos = next;
  }
  return best;
}
const dec = (p) => p.map((x) => { try { return decodeURIComponent(x); } catch { return x; } });

export async function handleStorage(request, env, path) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  // /storage/v1/object/public/<bucket>/<path...>  (also /render/image/public for images → same file)
  if (path[0] === 'object' && (path[1] === 'public' || path[1] === 'authenticated') && ['GET', 'HEAD'].includes(request.method)) {
    const [bucket, ...rest] = dec(path.slice(2));
    const file = rest.join('/');
    if (env.MEDIA) {
      const obj = await env.MEDIA.get(keyOf(bucket, file));
      if (obj) {
        const h = new Headers({ ...CORS, 'cache-control': 'public, max-age=31536000, immutable', etag: obj.httpEtag });
        obj.writeHttpMetadata(h);
        return new Response(request.method === 'HEAD' ? null : obj.body, { headers: h });
      }
    }
    // files uploaded from the admin panel are stored in D1 (see below) when R2 is not enabled
    if (env.DB) {
      const key = keyOf(bucket, file);
      const meta = await env.DB.prepare('SELECT content_type, size FROM media_objects WHERE path = ?').bind(key).first();
      if (meta) {
        const rows = (await env.DB.prepare('SELECT data FROM media_chunks WHERE key = ? ORDER BY idx').bind(key).all()).results;
        const out = new Uint8Array(meta.size);
        let off = 0;
        for (const r of rows) { const u = new Uint8Array(r.data); out.set(u, off); off += u.length; }
        return new Response(request.method === 'HEAD' ? null : out, { headers: { ...CORS, 'content-type': meta.content_type || 'application/octet-stream', 'content-length': String(meta.size), 'cache-control': 'public, max-age=31536000, immutable' } });
      }
    }
    // files copied from the old Supabase bucket live as static assets under /media/<bucket>/
    if (env.ASSETS) {
      const a = await env.ASSETS.fetch(new Request(new URL(`/media/${bucket}/${file.split('/').map(encodeURIComponent).join('/')}`, request.url)));
      // the SPA fallback answers missing files with index.html → treat as not found
      if (a.ok && !/text\/html/.test(a.headers.get('content-type') || '')) return a;
    }
    return perr(404, 'not_found', 'Object not found');
  }

  const who = await identify(request, env);
  if (!who.uid || !(await isAdmin(env, who))) return perr(401, 'unauthorized', 'Admin only');
  if (!env.MEDIA && !env.DB) return perr(503, 'unavailable', 'No storage binding (MEDIA or DB)');

  // upload: POST/PUT /storage/v1/object/<bucket>/<path...>
  if (path[0] === 'object' && ['POST', 'PUT'].includes(request.method) && path[1] !== 'list') {
    const [bucket, ...rest] = dec(path.slice(1));
    const file = rest.join('/');
    const upsert = request.headers.get('x-upsert') === 'true';
    const key = keyOf(bucket, file);
    const exists = (await env.DB.prepare('SELECT 1 FROM media_objects WHERE path = ?').bind(key).first()) || (env.MEDIA && (await env.MEDIA.head(key)));
    if (!upsert && exists) return perr(409, 'Duplicate', 'The resource already exists');
    const ct = request.headers.get('content-type') || '';
    let blob, type = 'application/octet-stream';
    if (ct.includes('multipart/form-data')) {
      const part = parseMultipart(await request.arrayBuffer(), ct);
      if (part) { blob = part.body; type = part.type; }
    } else { blob = await request.arrayBuffer(); type = ct || type; }
    if (!blob) return perr(400, 'invalid', 'No file');
    // D1 storage (no card needed): images are already compressed to ~100-200KB by the admin panel
    const bytes = new Uint8Array(blob instanceof ArrayBuffer ? blob : blob.buffer ? blob.buffer : await blob.arrayBuffer());
    if (bytes.length > MAX_D1_FILE) {
      // large files (PDF, big images) go to R2 when it is enabled
      if (env.MEDIA) {
        const put = await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: type } });
        await env.DB.batch([env.DB.prepare('DELETE FROM media_chunks WHERE key = ?').bind(key), env.DB.prepare('INSERT INTO media_objects (path,bucket,content_type,size) VALUES (?,?,?,?) ON CONFLICT(path) DO UPDATE SET size=excluded.size, content_type=excluded.content_type').bind(key, bucket, type, put.size)]);
        return respond({ Key: key, Id: put.etag });
      }
      return perr(413, 'Payload too large', `الملف أكبر من ${MAX_D1_FILE / 1048576}MB. الملفات الكبيرة (PDF) تُضاف عبر المستودع أو يتم تفعيل R2.`);
    }
    if (env.MEDIA) await env.MEDIA.delete(key); // small file now lives in D1; drop any older R2 copy
    const stmts = [env.DB.prepare('DELETE FROM media_chunks WHERE key = ?').bind(key)];
    for (let i = 0, n = 0; i < bytes.length; i += CHUNK, n++) stmts.push(env.DB.prepare('INSERT INTO media_chunks (key, idx, data) VALUES (?,?,?)').bind(key, n, bytes.slice(i, i + CHUNK).buffer));
    stmts.push(env.DB.prepare('INSERT INTO media_objects (path,bucket,content_type,size) VALUES (?,?,?,?) ON CONFLICT(path) DO UPDATE SET size=excluded.size, content_type=excluded.content_type').bind(key, bucket, type, bytes.length));
    await env.DB.batch(stmts);
    return respond({ Key: key, Id: String(bytes.length) });
  }
  // remove: DELETE /storage/v1/object/<bucket>  body {prefixes:[...]}
  if (path[0] === 'object' && request.method === 'DELETE') {
    const [bucket, ...rest] = dec(path.slice(1));
    const body = await request.json().catch(() => ({}));
    const list = body.prefixes || (rest.length ? [rest.join('/')] : []);
    for (const p of list) {
      const key = keyOf(bucket, p);
      if (env.MEDIA) await env.MEDIA.delete(key);
      await env.DB.batch([env.DB.prepare('DELETE FROM media_chunks WHERE key = ?').bind(key), env.DB.prepare('DELETE FROM media_objects WHERE path = ?').bind(key)]);
    }
    return respond(list.map((name) => ({ name })));
  }
  // list: POST /storage/v1/object/list/<bucket>
  if (path[0] === 'object' && path[1] === 'list') {
    const bucket = dec(path.slice(2))[0];
    const body = await request.json().catch(() => ({}));
    const rows = (await env.DB.prepare('SELECT path, size, created_at FROM media_objects WHERE bucket = ? AND path LIKE ? LIMIT ?').bind(bucket, `${bucket}/${body.prefix || ''}%`, body.limit || 100).all()).results;
    return respond(rows.map((r) => ({ name: r.path.slice(bucket.length + 1), metadata: { size: r.size }, created_at: r.created_at })));
  }
  return perr(404, 'not_found', 'Unknown storage route');
}
