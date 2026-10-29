#!/usr/bin/env python3
"""Final QA for public/clinical-cases: BP orientation, source-mentions, image paths, ar/en parity, empty sections."""
import json, glob, re, os, sys
P = 'public/clinical-cases'
def strip(h): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h or ''))
SRC = re.compile(r'(in the source|the source|as printed|printed value|المصدر|في الأصل|كما ورد|كما طُبع|كما هو مطبوع|الكتاب)', re.I)
BP = re.compile(r'(?<![\d.])(\d{2,3})\s*/\s*(\d{2,3})(?![\d/])')
bad = []
for f in sorted(glob.glob(f'{P}/cases/case-*.json')):
    n = f[-8:-5]
    raw = open(f, encoding='utf-8').read()
    d = json.loads(raw)
    txt = strip(raw.replace('\\n', ' '))
    for m in BP.finditer(txt):
        s, d2 = int(m.group(1)), int(m.group(2))
        ctx = txt[max(0, m.start()-25):m.start()].lower()
        if (('bp' in ctx or 'ضغط' in ctx or 'mmhg' in txt[m.end():m.end()+8].lower()) and s < d2):
            bad.append((n, 'BP reversed', m.group(0)))
    for m in SRC.finditer(txt):
        bad.append((n, 'source-mention', txt[max(0, m.start()-30):m.end()+30]))
    for m in re.finditer(r'/clinical-cases/img/[^"\'\\\s)<>]+', raw):
        if not os.path.exists('public' + m.group(0)): bad.append((n, 'missing image', m.group(0)))
    if re.search(r'-fig\d', raw): bad.append((n, 'book-image reference', ''))
    for k in ('story', 'questions', 'diagnosis', 'answer'):
        if not d.get(k): bad.append((n, 'empty', k))
    for lang in ('ar', 'en'):
        for k in ('story', 'answer'):
            if len(strip(d[k].get(lang, ''))) < 300: bad.append((n, 'short', f'{k}.{lang}'))
    a = json.dumps(d, ensure_ascii=False)
    if len(d['questions']) == 0: bad.append((n, 'no questions', ''))
for b in bad: print(*b)
print('issues:', len(bad))
