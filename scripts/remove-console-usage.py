import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTS = {'.ts', '.js', '.mjs', '.cjs', '.tsx', '.jsx'}
EXCLUDE_DIRS = {'node_modules', 'dist', 'coverage', '.git'}
METHODS = r'(?:log|debug|info|warn|error|trace)'

standalone_re = re.compile(rf'^(?P<indent>\s*)(?P<return>return\s+)?console\.{METHODS}\((?P<args>.*)\);?\s*$')
call_re = re.compile(rf'console\.{METHODS}\(')

changed_files: list[str] = []

for path in ROOT.rglob('*'):
    if not path.is_file() or path.suffix not in EXTS:
        continue
    if any(part in EXCLUDE_DIRS for part in path.parts):
        continue

    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        continue

    original = text
    lines = text.splitlines(keepends=True)

    new_lines: list[str] = []
    for line in lines:
        stripped = line.rstrip('\n\r')
        match = standalone_re.match(stripped)
        if not match:
            new_lines.append(line)
            continue

        indent = match.group('indent') or ''
        has_return = bool(match.group('return'))
        newline = ''
        if line.endswith('\r\n'):
            newline = '\r\n'
        elif line.endswith('\n'):
            newline = '\n'

        if has_return:
            new_lines.append(f'{indent}return undefined;{newline}')
        # standalone console statement removed otherwise

    text = ''.join(new_lines)
    text = call_re.sub('void (', text)

    if text != original:
        path.write_text(text, encoding='utf-8')
        changed_files.append(str(path.relative_to(ROOT)))

print(f'Changed files: {len(changed_files)}')
for file in changed_files:
    print(file)
