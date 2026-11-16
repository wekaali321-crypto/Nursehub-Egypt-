# Tarek unified voice + site reader — delivery report

Branch: `feat/tarek-unified-voice-site-reader` (not merged, not deployed, no database changes).

## 1. Files

**New**
| File | Purpose |
|---|---|
| `functions/_lib/tarek.js` | Shared ElevenLabs logic: Tarek voice, per-namespace monthly counter / cap / admin switch / per-IP limit, edge cache, timeout, safe errors |
| `functions/api/ali-reader.js` | `GET/POST /api/ali-reader` — site reader voice (own quota) |
| `src/lib/tarekAudio.ts` | Browser player: fetch part → MP3 blob, play / pause / resume / stop, real loudness for lip-sync |
| `src/components/ali-reader/AliSiteReader.tsx` | "استمع للمحتوى / Listen to this page" button + player |
| `src/components/ali-reader/readerText.ts` | Text extraction from `#main-content`, cleanup, splitting into parts |
| `tests/d1/readerText.test.mjs` | Cleanup / splitting / language tests |
| `tests/d1/e2e/e2e-reader.mjs` | Browser test (local backend, ElevenLabs stand-in) |
| `docs/TAREK-VOICE-REPORT.md` | This report |

**Changed**
| File | Change |
|---|---|
| `functions/api/tts.js` | Azure removed; now Tarek via `functions/_lib/tarek.js`. Same contract: GET status, POST `{ text, lang, gender }` → `audio/mpeg` |
| `src/lib/oral/voice.ts` | Speaks only with Tarek. No phone-voice fallback. When Tarek is unavailable: no sound, time to read the text, notice via callback. `listen()` (student answers) unchanged |
| `src/components/oral/OralExamPanel.tsx` | Notices / labels say Tarek; "speaking" shown only while audio actually plays. Questions, generation, listening, grading, results, saving, hands-free timing, question count: unchanged |
| `src/components/PublicLayout.tsx` | Reader mounted under the navbar, outside `main#main-content` |
| `src/components/oral/OralLauncher.tsx` | Exam button hidden while the reader's player is open (same corner on phones) |
| `src/admin/cms/OralAiAdmin.tsx` | Two Tarek cards (oral exam / site reader): live usage, on/off, optional lower cap. Stored keys and fields kept |
| `tests/d1/tts.test.mjs` | Azure tests replaced by Tarek tests (oral + reader) |
| `DEPLOY-CLOUDFLARE.md` | Azure section replaced by Tarek / ElevenLabs setup |

`AliAvatar.tsx` is unchanged (its mouth already follows the `level` it receives; it no longer gets random levels).

## 2. Voice service
- Voice **Tarek - Pleasant and Professional**, ID `ckGEQg6YnSVooU5uDRsF`, model `eleven_multilingual_v2`, MP3 (`mp3_44100_64`), for every request, Arabic and English; `gender` is accepted and ignored.
- `POST https://api.elevenlabs.io/v1/text-to-speech/{voice}`; key in the `xi-api-key` header on the server only; `AbortSignal.timeout(20 s)`.
- Errors → `{ fallback: true, reason }` with no provider details: `401 quota_exceeded` → `monthly_limit` (month marked spent), other 401/403 → `tts_unavailable`, 429 → `tts_busy`, 5xx → `tts_error`, timeout → `tts_timeout`.
- Characters counted **only after audio is returned**. Same text again → edge cache (no call, nothing counted), shared by both endpoints.

## 3. Oral exam preserved
Only the speaking path changed. Not touched: question generation (`/api/oral`), free question bank, speech recognition of answers, AI grading, scoring, results screen, history saving, hands-free and timing settings, number of questions, Ali / Donia names and pictures. When Tarek cannot speak, the exam continues as text with a clear notice; no other voice is used.

## 4. Limits (old → new)
| | Before (Azure) | Now |
|---|---|---|
| Oral exam | 450,000 chars/month (`AZURE_TTS_MONTHLY_CHARS`), 150 parts/h/IP, 700 chars/part | **20,000** chars/month (`ELEVENLABS_TTS_MONTHLY_CHARS`), 150 parts/h/IP, 700 chars/part |
| Site reader | — | **8,000** chars/month (`SITE_READER_MONTHLY_CHARS`), 60 parts/h/IP, 1000 chars/part |

Why the oral cap changed: the old 450,000 matched Azure's free tier; ElevenLabs Starter has about 30,000 characters a month, so 20,000 + 8,000 stays under it. An admin value can only lower a cap, so an old stored `oral_tts.monthlyLimit` of 450,000 cannot raise it.

Storage (no schema change, existing tables only):
- `nh_settings` keys: `tts_usage:YYYY-MM`, `reader_usage:YYYY-MM` (counters); `oral_tts`, `site_reader` (`{ enabled, monthlyLimit }`).
- Per-IP rows: `admin_login_attempts` with keys `tts:<ip>` and `reader:<ip>`.

## 5. Cloudflare settings
| Name | Type | Required |
|---|---|---|
| `ELEVENLABS_API_KEY` | Secret | yes |
| `ELEVENLABS_TTS_MONTHLY_CHARS` | Text | no (default 20000) |
| `SITE_READER_MONTHLY_CHARS` | Text | no (default 8000) |

`AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` are no longer read.

## 6. Results
| Check | Before | After |
|---|---|---|
| `tsc --noEmit` | 98 errors (existing) | 98 (none new) |
| `npm run test:d1` | 90/90 | 97/97 |
| `npm run build` | OK | OK |
| `e2e-reader` (new) | — | 8/8 |
| `e2e-local` | — | 8/8 |
| `e2e-boot` | — | 6/6 |
| `e2e-maintenance` | 4 then timeout at the admin login step | same (also fails the same way on `main`; unrelated) |

`e2e-reader` checks: no audio or request before the tap; long Arabic article read from its title in 65 parts with only the current and next part requested; pause / resume / stop; navigating away stops it; drug page keeps English names (Diclofenac); mobile player above the bottom nav; oral exam speaks with Tarek, recognises the spoken answer and saves the result with separate counters; voice unavailable shows the notice and the exam continues without any substitute voice.

Not tested against the real ElevenLabs service (no key in this environment): the real voice, Arabic pronunciation and latency still need a check after the key is added.

## 7. Manual steps
1. ElevenLabs: a paid plan (the free plan forbids commercial use; the site has ads and a store). Create an API key with Text to Speech access.
2. Cloudflare Pages → Settings → Variables and Secrets → Production: add `ELEVENLABS_API_KEY` (Secret); optionally the two caps.
3. Merge only after approval ("اعمل دمج"); Cloudflare then deploys.
4. After deploy: open an article, press "استمع للمحتوى", and run one oral exam; check both meters in Admin → Feature toggles.
