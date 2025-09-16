#!/usr/bin/env python3
"""
Small repo-wide emoji replacer. Scans files (text files) and replaces emoji glyphs with bracketed labels.
It will create a .bak backup for each file changed.
Usage: python scripts/replace_emojis.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(__file__))
# file extensions to scan
EXTS = {'.md', '.py', '.js', '.mjs', '.ts', '.tsx', '.json', '.txt', '.sh', '.bat'}

# mapping regex -> replacement
REPLACEMENTS = [
    (re.compile(r'[Done]'), '[Done]'),
    (re.compile(r'[Error]'), '[Error]'),
    (re.compile(r'[Warning]|[Warning]'), '[Warning]'),
    (re.compile(r'[Feature]|[Feature]'), '[Feature]'),
    (re.compile(r'[Goal]'), '[Goal]'),
    (re.compile(r'[Progressing]|[Progressing]|[Progressing]'), '[Progressing]'),
    (re.compile(r'[Secure]|[Secure]'), '[Secure]'),
    (re.compile(r'[Maintenance]|[Maintenance]|[Maintenance]'), '[Maintenance]'),
    (re.compile(r'[Note]|[Note]'), '[Note]'),
    (re.compile(r'[Info]'), '[Info]'),
    (re.compile(r'[Key]'), '[Key]'),
    (re.compile(r'[Done]|[Done]'), '[Done]'),
    (re.compile(r'[Package]'), '[Package]'),
    (re.compile(r'[Info]'), '[Info]'),
    (re.compile(r'[Done]'), '[Done]'),
    (re.compile(r'[Info]'), '[Info]'),
    (re.compile(r'[Files]'), '[Files]'),
]

changed_files = []

for dirpath, dirnames, filenames in os.walk(ROOT):
    # skip .git and node_modules and __pycache__ and public/local-solver-package (we still want public changes though)
    if any(p in dirpath for p in ['.git', 'node_modules', '__pycache__']):
        continue
    for fn in filenames:
        _, ext = os.path.splitext(fn)
        if ext.lower() not in EXTS:
            continue
        full = os.path.join(dirpath, fn)
        try:
            with open(full, 'r', encoding='utf-8') as f:
                s = f.read()
        except Exception:
            continue
        original = s
        for pat, repl in REPLACEMENTS:
            s = pat.sub(repl, s)
        if s != original:
            bak = full + '.bak'
            with open(bak, 'w', encoding='utf-8') as f:
                f.write(original)
            with open(full, 'w', encoding='utf-8') as f:
                f.write(s)
            changed_files.append(full)

print('Changed files:')
for p in changed_files:
    print(p)
print('Total changed:', len(changed_files))
