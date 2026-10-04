import pathlib
import re

p = pathlib.Path('src/components/ManhwaRowItem.tsx')
src = p.read_text(encoding='utf-8')

# Remove the RoliaScan badge block entirely
pattern = re.compile(
    r"\{catchUp\.isSeriesPageDirect && \(\s*<span[\s\S]*?</span>\s*\)\}",
    re.MULTILINE
)

new_src, count = pattern.subn("", src, count=1)

if count == 0:
    print("FAIL - badge block not found. Showing context:")
    idx = src.find('isSeriesPageDirect')
    if idx > 0:
        print(src[max(0, idx - 200):idx + 500])
    exit(1)

p.write_text(new_src, encoding='utf-8')
print("OK - Removed RoliaScan badge")
