import pathlib

p = pathlib.Path('src/utils/chapterUrl.ts')
src = p.read_text(encoding='utf-8')

# The variable is declared like: "const isSeriesPageDirect = targetSourceId === 'roliascan';"
old = "const isSeriesPageDirect = targetSourceId === 'roliascan';"
new = "const isSeriesPageDirect = true; // All sources now open series URL"

if old in src:
    src = src.replace(old, new, 1)
    p.write_text(src, encoding='utf-8')
    print("OK - isSeriesPageDirect now always true")
else:
    print("WARN - pattern not found")
    idx = src.find('isSeriesPageDirect')
    if idx > 0:
        print("   Context:")
        print(src[max(0, idx - 150):idx + 200])
