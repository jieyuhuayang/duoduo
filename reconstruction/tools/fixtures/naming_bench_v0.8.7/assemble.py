# Builds the two task files the 2026-11 A/B on v0.8.7 was measured on, and the
# halves, from the two tool outputs kept here (VERIFICATION.md §10):
#   old/toplevel.md   name_toplevel.mjs tasks as it was BEFORE the rebuild (git
#                     show ffca158:reconstruction/tools/name_toplevel.mjs), run on
#                     the benchmark's derived maps: 51 candidates, 47 of the 60
#                     hidden symbols (it lists an uninitialised constant only
#                     through its initialiser and skips a candidate with no
#                     named user)
#   B.md              the rebuilt tool's toplevel.md as it was when measured
#                     (the pre-final revision of 2026-11-05 02:50: groups in
#                     alphabetical order, `calls candidates` without positions,
#                     CHANGELOG entries of `main` and the initialisers still
#                     printed; the committed tool orders groups by depth and
#                     drops those entries), with the five leaked "CHANGELOG
#                     words" (see §10) still in it
# Setting A = the 47 old-format sections for the hidden symbols, then the 13
# missing ones (10 constants, 2 initialisers, 1 function) emulated from B.md
# by stripping every line the new format adds and restoring the old heading;
# two of those (tl, sC) therefore show a body with known names applied.
# The halves alternate over the hidden short names in sorted order (H1 =
# positions 0, 2, 4, ...; H2 = 1, 3, 5, ...).
#
# Usage: python3 -I assemble.py [<fixture dir>] [<out dir>]
# Writes A.md, A_H1.md, A_H2.md, B_H1.md, B_H2.md, halves.json,
# answers_H1.json, answers_H2.json into <out dir> (default: the fixture dir).
# halves.json, B_H1.md and B_H2.md come out byte-identical to the measured
# files; the committed A.md (and the measured A_H1/A_H2) carry the 13 emulated
# sections in the set order of the Python run that built them, this script in
# answers.json order, with every section's text the same.
import json, re, collections, os, sys
B = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.abspath(__file__))
O = sys.argv[2] if len(sys.argv) > 2 else B
ans = json.load(open(f'{B}/answers.json'))
hidden = set(ans)
old = open(f'{B}/old/toplevel.md').read()
new = open(f'{B}/B.md').read()
parts = re.split(r'(?m)^(?=## \S+ \()', old)
head_old = parts[0]
secs_old = {re.match(r'## (\S+)', p).group(1): p for p in parts[1:]}
print('old sections', len(secs_old), 'hidden in old', len(hidden & set(secs_old)), 'extra', sorted(set(secs_old) - hidden))
missing = [s for s in ans if s not in secs_old]  # answers.json order; the measured A.md had these 13 in the set order of that Python run
print('hidden missing from old', len(missing), [(s, ans[s]['kind']) for s in missing])
nparts = re.split(r'(?m)^(?=### )', new)
secs_new = {}
for p in nparts[1:]:
    m = re.match(r'### (\S+)', p)
    if m.group(1) == 'vocabulary':
        continue
    secs_new[m.group(1)] = p
print('new sections', len(secs_new))

def emulate(short):
    out = []
    for l in secs_new[short].split('\n'):
        if l.startswith('### '):
            l = re.sub(r', (leaf|calls \d+ candidates?)\)', ')', l).replace('### ', '## ')
        if re.match(r'(calls candidates|assigned in|related registered names|protocol|changelog):', l):
            continue
        if l.startswith('## group'):
            continue
        out.append(l)
    return '\n'.join(out)

order = [s for s in secs_old if s in hidden] + missing
A = head_old
for s in order:
    A += secs_old[s] if s in secs_old else emulate(s)
A = A.replace(f'{len(secs_old)} candidate(s)', f'{len(order)} candidate(s)')
os.makedirs(O, exist_ok=True)
open(f'{O}/A.md', 'w').write(A)
shorts = sorted(hidden)
H1 = set(shorts[0::2]); H2 = set(shorts[1::2])
json.dump({'H1': sorted(H1), 'H2': sorted(H2)}, open(f'{O}/halves.json', 'w'), indent=1)

def filt_A(H):
    t = head_old
    for s in order:
        if s in H:
            t += secs_old[s] if s in secs_old else emulate(s)
    return t

def filt_B(H):
    t = ''
    for p in nparts:
        m = re.match(r'### (\S+)', p)
        if not m or m.group(1) == 'vocabulary' or m.group(1) in H:
            t += p
    return t

for nm, H in (('H1', H1), ('H2', H2)):
    open(f'{O}/A_{nm}.md', 'w').write(filt_A(H))
    open(f'{O}/B_{nm}.md', 'w').write(filt_B(H))
    json.dump({s: ans[s] for s in sorted(H)}, open(f'{O}/answers_{nm}.json', 'w'), indent=2)
print({k: dict(collections.Counter(ans[s]['kind'] for s in v)) for k, v in (('H1', H1), ('H2', H2))})
