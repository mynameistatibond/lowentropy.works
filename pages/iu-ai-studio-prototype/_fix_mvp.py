"""
Remove the orphaned topbar/sidebar HTML from AI Studio MVP Prototype.html.
Keeps everything up to and including the _navbar.js script tag,
then skips all lines until the real <main class="main" ... > tag.
"""

fname = "AI Studio MVP Prototype.html"

with open(fname, "r", encoding="utf-8") as f:
    lines = f.readlines()

out = []
skipping = False

for i, line in enumerate(lines):
    stripped = line.strip()

    # Start skipping right after the _navbar.js script tag
    if '_navbar.js' in line and '<script' in line:
        out.append(line)
        skipping = True
        continue

    # Stop skipping when we hit the real <main class="main"
    if skipping and '<main' in line and 'class="main"' in line:
        # Insert a blank line + the comment before <main>
        out.append('\n')
        out.append('    <!-- ══ ZONE C — MAIN CONTENT ═════════════════════════ -->\n')
        skipping = False

    if not skipping:
        out.append(line)

with open(fname, "w", encoding="utf-8") as f:
    f.writelines(out)

# Verify
with open(fname, "r", encoding="utf-8") as f:
    content = f.read()

import re
main_idx = content.find('<main class="main"')
script_idx = content.find('_navbar.js')
print(f"_navbar.js script at char: {script_idx}")
print(f"<main class='main'> at char: {main_idx}")
gap = content[script_idx:main_idx]
print(f"Gap between them ({len(gap)} chars):")
print(repr(gap[:300]))
print("Done.")
