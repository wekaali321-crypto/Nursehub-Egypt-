// NurseHub avatar: geometry in the component matches the generated assets; viseme choice from audio frames; assets are small and static.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, loadTs } from './helpers.mjs';

const m = await loadTs('src/components/avatar/NurseHubAvatar.tsx');
const meta = JSON.parse(readFileSync(join(ROOT, 'public/avatar/avatar.json'), 'utf8'));

test('component geometry = generated avatar.json (mouth / eyes boxes, face position in gesture poses)', () => {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-3, `${a} vs ${b}`);
  m.GEOMETRY.mouthBox.forEach((v, i) => close(v, meta.mouthBox[i]));
  m.GEOMETRY.eyesBox.forEach((v, i) => close(v, meta.eyesBox[i]));
  for (const [pose, { face }] of Object.entries(meta.poses)) {
    const f = m.GEOMETRY.face[pose];
    close(f.scale, face.scale); close(f.x, face.x); close(f.y, face.y);
  }
});

test('mouth shape from real audio: silence closed, quiet slight, bright vowels wide, dark vowels round', () => {
  assert.equal(m.visemeFor(0.02, 0.5), 'closed');
  assert.equal(m.visemeFor(0.2, 0.5), 'slight');
  assert.equal(m.visemeFor(0.7, 0.5), 'open');
  assert.equal(m.visemeFor(0.7, 0.9), 'wide');
  assert.equal(m.visemeFor(0.7, 0.1), 'round');
});

test('assets: every pose / mouth / eyes / icon file exists, total under 300 KB, served statically', () => {
  const dir = join(ROOT, 'public/avatar');
  const files = readdirSync(dir);
  for (const n of ['base', 'listening', 'happy', 'sad', 'thinking', 'gesture_explain', 'gesture_welcome']) assert.ok(files.includes(`pose_${n}.webp`), n);
  for (const n of ['slight', 'open', 'wide', 'round', 'smile']) assert.ok(files.includes(`mouth_${n}.webp`), n);
  assert.ok(files.includes('eyes_closed.webp') && files.includes('icon.webp'));
  const total = files.reduce((s, f) => s + statSync(join(dir, f)).size, 0);
  assert.ok(total < 300 * 1024, `${Math.round(total / 1024)} KB`);
  const routes = JSON.parse(readFileSync(join(ROOT, 'public/_routes.json'), 'utf8'));
  assert.ok(routes.exclude.includes('/avatar/*'), 'never through a Pages Function');
});
