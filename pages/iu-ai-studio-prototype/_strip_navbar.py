import re, sys

files = [
    'AI Studio MVP Prototype.html',
    'AI Studio KB Prototype.html',
    'AI Studio Advisor.html',
]

SCRIPT_TAG = '    <!-- ══ SHARED NAVBAR ════════════════════════════════════ -->\n    <script src="./_navbar.js"></script>\n\n'

for fname in files:
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove: everything from first <header class="topbar" to </header>
    content = re.sub(
        r'\s*<!--[^>]*(?:ZONE A|TOPBAR|SHARED NAVBAR)[^>]*-->\s*(<script[^>]*_navbar\.js[^>]*></script>\s*)?',
        '',
        content, flags=re.DOTALL
    )
    content = re.sub(
        r'\s*<header class="topbar"[^>]*>.*?</header>\s*',
        '\n',
        content, flags=re.DOTALL
    )

    # 2. Remove: everything from <nav class="sidebar" to </nav>
    content = re.sub(
        r'\s*<!--[^>]*(?:ZONE B|SIDEBAR)[^>]*-->\s*',
        '',
        content, flags=re.DOTALL
    )
    content = re.sub(
        r'\s*<nav class="sidebar"[^>]*>.*?</nav>\s*',
        '\n',
        content, flags=re.DOTALL
    )

    # 3. Insert script tag right after <div class="app-shell">
    content = content.replace(
        '<div class="app-shell">',
        '<div class="app-shell">\n\n' + SCRIPT_TAG,
        1
    )

    with open(fname, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f'Done: {fname}')

print('All files updated.')
