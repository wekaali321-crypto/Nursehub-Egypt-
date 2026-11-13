# Image inventory (AdSense pre-submission review)

Scope reviewed: `public/skills-img/` (131 files) and `public/course-img/` (332 files) — visual review of every file on contact sheets.
Full per-file list: [`image-inventory.csv`](image-inventory.csv).

## Replaced (17 files)
Pictures with a visible watermark, another site's credit, a stock-agency image number, patient identifiers or branded packaging
were replaced **in place** (same path, same format and same pixel size, so no page needed to change) by original drawings
created for NurseHub Egypt. Sources of the drawings: `design/skills-illustrations/` (`build.py` → `svg/*.svg`, `apply.sh` re-renders them).
These drawings are original work (no third-party material); they are schematic and use standard teaching landmarks only.

| File (under `public/skills-img/`) | Why it was replaced |
|---|---|
| drug-administration-routes-injection-guide/im-injection-layers.png | Alamy watermark |
| drug-administration-routes-injection-guide/intradermal-reaction-photos.webp | patient identifiers on the photos |
| drug-administration-routes-injection-guide/intradermal-wheal.webp | stock image number |
| medical-injections-syringes-guide/intradermal-wheal-closeup.jpg | stock watermark + number |
| drug-administration-routes-injection-guide/oral-liquid-medication-child.jpg, oral-liquid-medication-infant.jpg | stock watermarks |
| drug-administration-routes-injection-guide/saline-enema.jpg | branded product (Fleet) |
| drug-administration-routes-injection-guide/sc-90-degree-angle.jpg | AboutKidsHealth.ca credit |
| drug-administration-routes-injection-guide/sc-injection-sites-diagram.png, medical-injections-syringes-guide/subcutaneous-sites-map.jpg | publisher copyright text / blogspot watermark |
| drug-administration-routes-injection-guide/vial-draw-up-4.webp | wikiHow watermark |
| im-injection-sites-methods/ampoule.jpg | stock watermark |
| insulin-pen-lantus-glargine-guide/cover.jpg | branded product (Lantus SoloStar) |
| medical-injections-syringes-guide/gluteal-injection-sitting.jpg | theWeightLossShot.com credit |
| medical-injections-syringes-guide/iv-tourniquet-diagram.jpg | A.D.A.M. logo |
| medical-injections-syringes-guide/vastus-lateralis-infant-photo.jpg, drug-administration-routes-injection-guide/im-infant-vastus-lateralis-photo.webp | @doctordconline watermark / real infant photo |

The previous (third-party) files remain only in git history.

## Still NEEDS REVIEW (not changed, nothing was invented about them)
* **`skills-img/` — 114 other files**: photos and diagrams with no visible watermark, but **the repository has no record of where they came from or under which licence**.
  Some are clinical close-ups of real patients/infants (no identifiers visible), a few show commercial products or third-party slides (see the CSV notes).
* **`course-img/` — 332 files (ACLS, BLS, PALS, paediatrics/gynaecology)**: algorithms, figures and drug tables that look like they come from published
  ACLS/BLS/PALS manuals and reference cards. **No licence/permission record exists.** There are no separate "course cover" images (`courses.image_url` is empty).
  They are the body of the course chapters, so removing them would break those courses: this needs an owner decision
  (get written permission, replace with original drawings, or unpublish those courses).

Rule for anything added in future: record **source + licence + date** here before publishing; never use search-engine or other websites' images.
