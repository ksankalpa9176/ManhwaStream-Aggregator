import pathlib

p = pathlib.Path('scraper/full_scan.py')
src = p.read_text(encoding='utf-8')

old = '''        url = f"{base}/manga/" if page == 1 else f"{base}/manga/page/{page}/"'''
new = '''        url = f"{base}/" if page == 1 else f"{base}/page/{page}/"'''

if old in src:
    src = src.replace(old, new, 1)
    p.write_text(src, encoding='utf-8')
    print("OK - ArenaScan pagination fixed (/page/N/ not /manga/page/N/)")
else:
    print("WARN - pattern not found, checking actual content")
    idx = src.find('url = f"{base}')
    if idx > 0:
        print(src[idx:idx + 200])
