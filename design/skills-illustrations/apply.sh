#!/usr/bin/env bash
# Renders svg/*.svg and writes each picture over its target in public/ (same name, same format) — see targets.json
set -e
cd "$(dirname "$0")"; TMP=$(mktemp -d); node render.cjs "$TMP"
python3 - "$TMP" <<'PY'
import json,sys,subprocess,os
tmp=sys.argv[1]; root=os.path.abspath('../../public')
for k,rel in json.load(open('targets.json')).items():
    dst=os.path.join(root,rel); src=os.path.join(tmp,k+'.png'); ext=dst.rsplit('.',1)[1].lower()
    if ext=='png': subprocess.run(['convert',src,'-strip',dst],check=True)
    elif ext=='webp': subprocess.run(['convert',src,'-quality','90',dst],check=True)
    else: subprocess.run(['convert',src,'-background','white','-flatten','-quality','92',dst],check=True)
    print('wrote',rel)
PY
