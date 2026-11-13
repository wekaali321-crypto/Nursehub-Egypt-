#!/usr/bin/env python3
"""Original NurseHub Egypt teaching illustrations (SVG sources), drawn from scratch.
They replace third-party/watermarked pictures in public/skills-img/. Run:  python3 build.py  -> svg/*.svg
Then render with render.cjs (Playwright) to the target PNG/WebP/JPG files listed in targets.json."""
import json, os, math
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'svg'); os.makedirs(OUT, exist_ok=True)
F = 'font-family="Arial, Helvetica, sans-serif"'
INK = '#1f2d3d'; SKIN = '#f1c9a5'; EPI = '#e8b48c'; DERM = '#f2b3aa'; FAT = '#f9df8f'; MUSC = '#c75a52'; GLASS = '#e3f2fd'; STEEL = '#b0bec5'; GREEN = '#43a047'

def svg(w, h, body, bg='#ffffff'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><rect width="{w}" height="{h}" fill="{bg}"/>{body}</svg>'
def text(x, y, s, size=34, anchor='start', weight='400', fill=INK):
    return f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" font-weight="{weight}" fill="{fill}" {F}>{s}</text>'
def leader(x1, y1, x2, y2):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{INK}" stroke-width="3"/><circle cx="{x1}" cy="{y1}" r="6" fill="{INK}"/>'
def syringe(x, y, rot=0, needle=140, barrel=230, plunger=90, w=44, drawn=0.0, liquid='#9ad0f5'):
    """Needle TIP at (x,y); the syringe extends 'up' (negative y) then is rotated clockwise by rot degrees around the tip."""
    n = needle; b0 = -(n + 18); b1 = b0 - barrel; hw = w / 2
    liq_h = barrel * (0.55 - drawn * 0.35)
    g = f'<g transform="translate({x},{y}) rotate({rot})">'
    g += f'<line x1="0" y1="0" x2="0" y2="{-n}" stroke="#78909c" stroke-width="5" stroke-linecap="round"/>'
    g += f'<path d="M{-9},{-n} L{9},{-n} L{14},{b0} L{-14},{b0} Z" fill="#4fc3f7" stroke="{INK}" stroke-width="2"/>'
    g += f'<rect x="{-hw}" y="{b1}" width="{w}" height="{barrel}" rx="5" fill="{GLASS}" stroke="{INK}" stroke-width="3"/>'
    g += f'<rect x="{-hw+4}" y="{b0-liq_h}" width="{w-8}" height="{liq_h}" fill="{liquid}" opacity="0.85"/>'
    for i in range(1, 9):
        yy = b0 - i * barrel / 9; g += f'<line x1="{-hw}" y1="{yy}" x2="{-hw+(14 if i%2 else 22)}" y2="{yy}" stroke="{INK}" stroke-width="2"/>'
    g += f'<rect x="{-hw-14}" y="{b1-8}" width="{w+28}" height="12" rx="5" fill="#cfd8dc" stroke="{INK}" stroke-width="2"/>'
    pl_top = b1 - plunger - 10
    g += f'<rect x="-6" y="{pl_top}" width="12" height="{plunger+2}" fill="#90a4ae" stroke="{INK}" stroke-width="2"/>'
    g += f'<rect x="-28" y="{pl_top-12}" width="56" height="14" rx="7" fill="#90a4ae" stroke="{INK}" stroke-width="2"/></g>'
    return g
def layers(x0, x1, ys, extra=''):
    """ys = [surface, dermis_top, fat_top, muscle_top, bottom]"""
    s, d, f, m, bt = ys; w = x1 - x0
    o = f'<rect x="{x0}" y="{s}" width="{w}" height="{d-s}" fill="{EPI}"/><rect x="{x0}" y="{d}" width="{w}" height="{f-d}" fill="{DERM}"/>'
    o += f'<rect x="{x0}" y="{f}" width="{w}" height="{m-f}" fill="{FAT}"/><rect x="{x0}" y="{m}" width="{w}" height="{bt-m}" fill="{MUSC}"/>'
    for i, cx in enumerate(range(x0 + 40, x1 - 20, 70)):
        for j, cy in enumerate(range(int(f + 30), int(m - 15), 52)):
            o += f'<circle cx="{cx + (35 if j%2 else 0)}" cy="{cy}" r="19" fill="none" stroke="#e0b64c" stroke-width="3"/>'
    for k in range(int(m + 30), int(bt - 10), 44):
        o += f'<path d="M{x0},{k} Q{(x0+x1)//2},{k-16} {x1},{k}" fill="none" stroke="#a8403c" stroke-width="4"/>'
    return o + extra
files = {}

# 1) IM injection - skin layers
w, h = 1600, 1271
b = text(800, 90, 'Intramuscular (IM) injection &#8211; needle at 90&#176;', 54, 'middle', '700')
b += layers(250, 1250, [600, 636, 760, 900, 1200])
b += f'<path d="M250,600 H1250" stroke="#b9855d" stroke-width="4"/>'
b += syringe(750, 1020, 0, needle=470, barrel=280, plunger=100, w=60)
b += '<ellipse cx="750" cy="1030" rx="34" ry="20" fill="#4fc3f7" opacity="0.9"/>'
for (lab, y, ly) in [('Epidermis', 618, 618), ('Dermis', 700, 700), ('Subcutaneous tissue', 830, 830), ('Muscle', 1050, 1050)]:
    b += leader(1250, ly, 1330, ly) + text(1345, ly + 12, lab, 40)
b += text(800, 1250, 'The needle passes through skin and fat and deposits the medication deep in the muscle', 30, 'middle', '400', '#455a64')
files['im-injection-layers'] = svg(w, h, b)

# 2) intradermal reaction (two schematic forearms)
w, h = 872, 942
def forearm(x, y, label, kind):
    g = f'<g transform="translate({x},{y})"><path d="M20,70 C120,30 420,20 560,60 C640,80 700,100 760,90 C780,130 770,190 700,200 C560,220 300,200 120,200 C40,190 10,130 20,70 Z" fill="{SKIN}" stroke="#c99a73" stroke-width="4"/>'
    if kind == 'fresh':
        g += '<circle cx="330" cy="125" r="34" fill="#fbf1e6" stroke="#d9b99a" stroke-width="4"/><circle cx="330" cy="125" r="18" fill="#fffaf3" opacity="0.8"/>'
    else:
        g += '<circle cx="330" cy="125" r="62" fill="#ef9a9a" opacity="0.55"/><circle cx="330" cy="125" r="40" fill="#e57373" stroke="#c62828" stroke-width="4"/><ellipse cx="318" cy="112" rx="14" ry="9" fill="#ffcdd2" opacity="0.8"/>'
    return g + f'</g>' + text(x + 390, y + 270, label, 34, 'middle', '700')
b = text(436, 70, 'Intradermal injection site', 46, 'middle', '700')
b += forearm(40, 150, 'Immediately after injection: pale wheal (bleb)', 'fresh')
b += forearm(40, 520, 'Later: skin reaction at the site (redness / induration)', 'react')
b += text(436, 900, 'Schematic drawing', 26, 'middle', '400', '#78909c')
files['intradermal-reaction'] = svg(w, h, b)

# 3) intradermal wheal (side view)
for name, (w, h) in {'intradermal-wheal': (1223, 701), 'intradermal-wheal-small': (700, 477)}.items():
    sx, sy = w / 1223.0, h / 701.0
    b = f'<g transform="scale({sx},{sy})">'
    b += text(60, 80, 'Intradermal injection', 52, 'start', '700')
    b += f'<rect x="330" y="380" width="840" height="60" fill="{EPI}"/><rect x="330" y="440" width="840" height="200" fill="{DERM}"/>'
    b += '<path d="M600,380 C640,310 760,310 800,380 Z" fill="#fbf1e6" stroke="#d9b99a" stroke-width="4"/>'
    b += syringe(700, 398, 75, needle=190, barrel=210, plunger=80, w=46)
    b += leader(420, 410, 300, 410) + text(40, 424, 'Epidermis', 38)
    b += leader(420, 540, 300, 540) + text(40, 554, 'Dermis', 38)
    b += leader(700, 346, 760, 270) + text(780, 262, 'Wheal (bleb)', 42, 'start', '700')
    b += text(40, 680, 'Needle bevel up, 10&#8211;15&#176; to the skin', 34, 'start', '400', '#37474f') + '</g>'
    files[name] = svg(w, h, b)

# 4) oral liquid medication (icons)
for name, (w, h) in {'oral-liquid-child': (275, 183), 'oral-liquid-infant': (295, 320)}.items():
    cap = 34 if h < 200 else 62
    s_ = min(w / 300.0, (h - cap) / 270.0); tx = (w - 300 * s_) / 2 + 20 * s_
    b = f'<g transform="translate({tx},{8}) scale({s_})">'
    b += '<path d="M40,150 L55,235 Q56,250 70,250 L110,250 Q124,250 125,235 L140,150 Z" fill="#e3f2fd" stroke="#1f2d3d" stroke-width="5"/>'
    b += '<path d="M48,190 L134,190 L128,235 Q127,246 116,246 L66,246 Q55,246 54,235 Z" fill="#9ad0f5"/>'
    for yy in (170, 190, 210): b += f'<line x1="{40+(yy-150)*0.2}" y1="{yy}" x2="{40+(yy-150)*0.2+22}" y2="{yy}" stroke="#1f2d3d" stroke-width="4"/>'
    b += '<g transform="translate(205,70) rotate(24)"><rect x="-18" y="0" width="36" height="150" rx="6" fill="#e3f2fd" stroke="#1f2d3d" stroke-width="5"/><rect x="-14" y="70" width="28" height="76" fill="#9ad0f5"/><rect x="-6" y="-50" width="12" height="54" fill="#90a4ae"/><rect x="-26" y="-60" width="52" height="12" rx="6" fill="#90a4ae"/><path d="M-9,150 L9,150 L5,178 L-5,178 Z" fill="#4fc3f7" stroke="#1f2d3d" stroke-width="3"/></g>'
    b += '</g>'
    b += text(w / 2, h - (10 if h < 200 else 14), 'Oral liquid medicine', 15 if h < 200 else 22, 'middle', '700')
    if h > 200: b += text(w / 2, h - 40, 'Measure with a cup or oral syringe', 15, 'middle', '400', '#455a64')
    files[name] = svg(w, h, b)

# 5) enema squeeze bottle (generic, no brand)
w, h = 348, 679
b = '<path d="M174,40 L174,150" stroke="#1f2d3d" stroke-width="10" stroke-linecap="round"/><rect x="158" y="140" width="32" height="34" rx="6" fill="#ffffff" stroke="#1f2d3d" stroke-width="4"/>'
b += '<path d="M104,190 Q104,170 124,170 L224,170 Q244,170 244,190 L262,560 Q264,620 214,626 L134,626 Q84,620 86,560 Z" fill="#eaf4fb" stroke="#1f2d3d" stroke-width="5"/>'
b += '<path d="M92,380 L256,380 L262,560 Q264,616 214,620 L134,620 Q86,616 88,560 Z" fill="#bfe3f5" opacity="0.9"/>'
b += '<rect x="112" y="250" width="124" height="90" rx="10" fill="#ffffff" stroke="#90a4ae" stroke-width="3"/>' + text(174, 308, 'ENEMA', 30, 'middle', '700', '#546e7a')
b += text(174, 665, 'Enema bottle', 26, 'middle', '400', '#455a64')
files['enema-bottle'] = svg(w, h, b)

# 6) SC 90 degree
w, h = 356, 267
b = f'<path d="M0,175 H80 C110,95 246,95 276,175 H356 V267 H0 Z" fill="{FAT}"/>'
b += f'<path d="M0,140 H80 C110,60 246,60 276,140 H356 V175 H276 C246,95 110,95 80,175 H0 Z" fill="{DERM}" stroke="#c98a80" stroke-width="3"/>'
b += syringe(178, 112, 0, needle=62, barrel=84, plunger=30, w=24)
b += '<path d="M178,86 L198,86 L198,62" fill="none" stroke="#c62828" stroke-width="3"/>' + text(206, 84, '90&#176;', 24, 'start', '700', '#c62828')
b += text(8, 258, 'Skin pinched up, needle straight in', 17, 'start', '400', '#37474f')
files['sc-90-degree'] = svg(w, h, b)

# 7) SC injection sites (body front/back)
def body(cx, front=True):
    c = '#f1c9a5'; o = f'<g stroke="#b9855d" stroke-width="4" fill="{c}">'
    o += f'<circle cx="{cx}" cy="150" r="52"/><rect x="{cx-18}" y="195" width="36" height="34"/>'
    o += f'<path d="M{cx-92},235 Q{cx-100},330 {cx-70},520 L{cx+70},520 Q{cx+100},330 {cx+92},235 Q{cx},212 {cx-92},235 Z"/>'
    o += f'<path d="M{cx-96},240 Q{cx-150},330 {cx-138},470 L{cx-100},470 Q{cx-104},340 {cx-72},270 Z"/><path d="M{cx+96},240 Q{cx+150},330 {cx+138},470 L{cx+100},470 Q{cx+104},340 {cx+72},270 Z"/>'
    o += f'<path d="M{cx-70},510 L{cx-76},860 L{cx-28},860 L{cx-4},560 L{cx+4},560 L{cx+28},860 L{cx+76},860 L{cx+70},510 Z"/></g>'
    return o
def sites(front=True, cx=300):
    g = '<g fill="#43a047" opacity="0.65">'
    if front:
        g += f'<ellipse cx="{cx-118}" cy="330" rx="22" ry="52"/><ellipse cx="{cx+118}" cy="330" rx="22" ry="52"/><ellipse cx="{cx}" cy="430" rx="62" ry="46"/><ellipse cx="{cx-40}" cy="640" rx="26" ry="78"/><ellipse cx="{cx+40}" cy="640" rx="26" ry="78"/>'
    else:
        g += f'<ellipse cx="{cx-118}" cy="330" rx="22" ry="52"/><ellipse cx="{cx+118}" cy="330" rx="22" ry="52"/><ellipse cx="{cx}" cy="300" rx="62" ry="34"/><ellipse cx="{cx-40}" cy="520" rx="30" ry="22"/><ellipse cx="{cx+40}" cy="520" rx="30" ry="22"/>'
    return g + '</g>'
for name, (w, h) in {'sc-sites-large': (1089, 992), 'sc-sites-small': (320, 273)}.items():
    s = min(w / 1089.0, h / 992.0) * 1.0
    b = f'<g transform="scale({w/1089.0},{h/992.0})">' + text(544, 60, 'Subcutaneous injection sites', 50, 'middle', '700')
    b += text(300, 100, 'Front', 30, 'middle', '400', '#546e7a') + text(790, 100, 'Back', 30, 'middle', '400', '#546e7a')
    b += '<g transform="translate(0,40) scale(1.0)">' + body(300) + sites(True, 300) + body(790) + sites(False, 790) + '</g>'
    b += text(544, 985, 'Green: upper arms, abdomen, thighs, upper back, upper buttocks', 30, 'middle', '400', '#37474f') + '</g>'
    files[name] = svg(w, h, b)

# 8) vial draw-up
w, h = 1048, 601
b = text(524, 56, 'Drawing up medication from a vial', 44, 'middle', '700')
b += f'<rect x="170" y="90" width="190" height="210" rx="22" fill="#e3f2fd" stroke="{INK}" stroke-width="5"/><rect x="170" y="160" width="190" height="140" fill="#9ad0f5" opacity="0.85"/>'
b += f'<rect x="192" y="298" width="146" height="40" rx="6" fill="#43a047" stroke="{INK}" stroke-width="4"/><rect x="198" y="90" width="134" height="26" fill="#cfd8dc" stroke="{INK}" stroke-width="4"/>'
b += syringe(265, 250, 180, needle=130, barrel=120, plunger=40, w=44, drawn=0.5)
b += leader(362, 200, 470, 170) + text(485, 182, 'Vial upside down', 34)
b += leader(268, 262, 470, 250) + text(485, 262, 'Needle tip below the fluid level', 34)
b += leader(272, 480, 470, 450) + text(485, 462, 'Pull the plunger back', 34) + text(485, 504, 'slowly to draw the dose', 34)
files['vial-draw-up'] = svg(w, h, b)

# 9) ampoule
w, h = 333, 450
b = f'<path d="M166,40 Q150,40 150,60 L150,170 Q110,200 104,250 L104,390 Q104,410 126,410 L206,410 Q228,410 228,390 L228,250 Q222,200 182,170 L182,60 Q182,40 166,40 Z" fill="#e3f2fd" stroke="{INK}" stroke-width="5"/>'
b += '<path d="M108,290 L224,290 L224,390 Q224,406 206,406 L126,406 Q108,406 108,390 Z" fill="#9ad0f5" opacity="0.85"/><path d="M148,176 L184,176" stroke="#c62828" stroke-width="6"/>'
b += '<rect x="122" y="320" width="88" height="46" rx="6" fill="#ffffff" stroke="#90a4ae" stroke-width="3"/>' + text(166, 352, 'AMPOULE', 17, 'middle', '700', '#546e7a')
b += text(166, 434, 'Neck: break line (red)', 20, 'middle', '400', '#455a64')
files['ampoule'] = svg(w, h, b)

# 10) insulin pen (generic)
w, h = 522, 217
b = f'<rect x="40" y="76" width="150" height="66" rx="14" fill="#b0bec5" stroke="{INK}" stroke-width="4"/><rect x="190" y="82" width="236" height="54" rx="8" fill="#eceff1" stroke="{INK}" stroke-width="4"/>'
b += f'<rect x="228" y="92" width="86" height="34" rx="4" fill="#ffffff" stroke="{INK}" stroke-width="3"/>' + text(271, 117, '30', 24, 'middle', '700')
b += f'<rect x="426" y="86" width="52" height="46" rx="8" fill="#4fc3f7" stroke="{INK}" stroke-width="4"/><rect x="478" y="96" width="30" height="26" rx="6" fill="#0288d1" stroke="{INK}" stroke-width="4"/>'
b += f'<path d="M40,109 L10,109" stroke="{INK}" stroke-width="4"/>' + text(261, 178, 'Insulin pen', 34, 'middle', '700') + text(110, 62, 'Cap', 24, 'middle', '400', '#455a64') + text(271, 62, 'Dose window', 24, 'middle', '400', '#455a64') + text(452, 62, 'Needle', 24, 'middle', '400', '#455a64')
files['insulin-pen'] = svg(w, h, b)

# 11) gluteal landmarks
w, h = 619, 339
shape = 'M110,310 C80,200 120,90 250,64 C340,46 470,64 520,150 C560,222 540,290 500,320 Z'
b = f'<defs><clipPath id="g"><path d="{shape}"/></clipPath></defs><path d="{shape}" fill="{SKIN}" stroke="#b9855d" stroke-width="4"/>'
b += '<g clip-path="url(#g)"><rect x="315" y="40" width="260" height="130" fill="#43a047" opacity="0.4"/></g>'
b += '<path d="M90,170 H570 M315,50 V330" stroke="#546e7a" stroke-width="3" stroke-dasharray="10 8"/>'
b += text(16, 34, 'Gluteal injection (dorsogluteal)', 28, 'start', '700') + text(425, 112, 'Upper outer', 22, 'middle', '700', '#1b5e20') + text(425, 138, 'quadrant', 22, 'middle', '700', '#1b5e20')
b += text(322, 160, 'Iliac crest level', 18, 'start', '400', '#37474f') + text(128, 300, 'Gluteal fold', 20, 'start', '400', '#37474f')
files['gluteal-landmarks'] = svg(w, h, b)

# 12) IV tourniquet
w, h = 400, 320
b = f'<path d="M20,150 C100,100 260,90 380,120 L380,240 C260,260 100,260 20,220 Z" fill="{SKIN}" stroke="#b9855d" stroke-width="4"/>'
b += '<path d="M40,185 C140,165 250,165 350,190" fill="none" stroke="#1565c0" stroke-width="12" stroke-linecap="round" opacity="0.75"/>'
b += '<rect x="86" y="92" width="34" height="168" rx="8" fill="#ff8f00" stroke="#1f2d3d" stroke-width="3"/>' + syringe(238, 178, 58, needle=44, barrel=62, plunger=26, w=20)
b += text(103, 80, 'Tourniquet', 22, 'middle', '700') + text(320, 226, 'Vein', 22, 'middle', '700', '#0d47a1') + text(14, 300, 'Venipuncture (schematic)', 18, 'start', '400', '#546e7a')
files['iv-tourniquet'] = svg(w, h, b)

# 13) vastus lateralis thigh
for name, (w, h) in {'vl-thigh-large': (1054, 989), 'vl-thigh-small': (702, 658)}.items():
    sx, sy = w / 700.0, h / 650.0
    b = f'<g transform="scale({sx},{sy})">' + text(350, 50, 'Vastus lateralis injection site (thigh)', 34, 'middle', '700')
    b += f'<g transform="translate(-40,0)"><path d="M230,90 C330,70 430,80 480,120 C520,200 500,420 470,520 C440,590 360,600 330,560 C290,470 260,260 230,90 Z" fill="{SKIN}" stroke="#b9855d" stroke-width="4"/>'
    b += '<path d="M232,236 L486,236 M262,404 L484,404" stroke="#546e7a" stroke-width="3" stroke-dasharray="10 8"/>'
    b += '<path d="M246,236 C330,226 430,226 488,236 L482,404 C420,410 330,410 262,404 Z" fill="#43a047" opacity="0.4"/>'
    b += '</g>' + leader(196, 100, 130, 100) + text(122, 90, 'Greater', 24, 'end', '700') + text(122, 118, 'trochanter', 24, 'end', '700')
    b += leader(304, 580, 170, 590) + text(160, 600, 'Knee', 24, 'end', '700')
    b += text(500, 310, 'Injection site:', 24, 'start', '700', '#1b5e20') + text(500, 342, 'middle third', 24, 'start', '700', '#1b5e20') + text(500, 374, 'of the outer thigh', 24, 'start', '700', '#1b5e20')
    b += '</g>'
    files[name] = svg(w, h, b)

for k, v in files.items():
    open(os.path.join(OUT, k + '.svg'), 'w').write(v)
print(len(files), 'svg written to', OUT)
