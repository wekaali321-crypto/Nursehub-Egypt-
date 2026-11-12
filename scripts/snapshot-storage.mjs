// Copies the PUBLIC Supabase storage objects (buckets: media, pdf-store) into public/media/<bucket>/<path>
// so Cloudflare serves them (egress rule: large files must not be served from Supabase).
// Usage: node scripts/snapshot-storage.mjs <objects.json>   (objects.json = [{bucket_id,name}, ...])
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
const BASE = process.env.SUPABASE_URL;
const objs = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const files = [];
for (const o of objs) {
  const out = `public/media/${o.bucket_id}/${o.name}`;
  if (!existsSync(out)) {
    const url = `${BASE}/storage/v1/object/public/${o.bucket_id}/${o.name.split('/').map(encodeURIComponent).join('/')}`;
    const r = await fetch(url);
    if (!r.ok) { console.error('FAIL', r.status, o.name); continue; }
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, Buffer.from(await r.arrayBuffer()));
  }
  files.push(`${o.bucket_id}/${o.name}`);
}
mkdirSync('public/media', { recursive: true });
writeFileSync('public/media/manifest.json', JSON.stringify(files));
console.log(files.length, 'files');
