#!/usr/bin/env python3
import os
import re
ROOT = os.path.dirname(os.path.dirname(__file__))
EXTS = {'.md', '.py', '.js', '.mjs', '.ts', '.tsx', '.json', '.txt', '.sh', '.bat'}
EMOJI_PATTERN = re.compile(r'✅|❌|⚠️|⚠|🚀|✨|🎯|⏳|⏰|⏱|🔐|🔒|🔧|🛠️|🛠|📝|💡|🔍|🔑|🗑️|🗑|📦|📋|🎉|⚡|📁')

matches = {}
for dirpath, dirnames, filenames in os.walk(ROOT):
    if any(ignored in dirpath for ignored in ['.git', 'node_modules', '__pycache__']):
        continue
    for fn in filenames:
        _, ext = os.path.splitext(fn)
        if ext.lower() not in EXTS:
            continue
        full = os.path.join(dirpath, fn)
        if full.endswith('.bak'):
            continue
        try:
            with open(full, 'r', encoding='utf-8') as f:
                for i, line in enumerate(f, 1):
                    if EMOJI_PATTERN.search(line):
                        matches.setdefault(full, []).append((i, line.strip()))
        except Exception:
            pass

for k, v in matches.items():
    print(k)
    for ln, txt in v:
        print(f"  {ln}: {txt}")
print('Total files with emojis:', len(matches))
