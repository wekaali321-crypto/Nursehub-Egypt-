// Renders svg/*.svg to PNG (exact size of each SVG). Usage: node render.cjs <outDir>
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const dir = path.join(__dirname, 'svg'); const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); 
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.svg'))) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8'); const m = /width="(\d+)" height="(\d+)"/.exec(s);
    const p = await b.newPage({ viewport: { width: +m[1], height: +m[2] }, deviceScaleFactor: 1 });
    await p.goto('file://' + path.join(dir, f)); await p.screenshot({ path: path.join(out, f.replace('.svg', '.png')) }); await p.close();
  }
  await b.close();
})();
