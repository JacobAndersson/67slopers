import re, sys, urllib.request, urllib.parse, pathlib
out = pathlib.Path(sys.argv[1])
fams = sys.argv[2:]
for fam in fams:
    css = None
    for spec in (":wght@400;500;600;700;800", ":wght@400;700", ""):
        try:
            css = urllib.request.urlopen("https://fonts.googleapis.com/css2?family=" + urllib.parse.quote_plus(fam) + spec).read().decode(); break
        except Exception: pass
    if not css: print("MISS", fam); continue
    got = []
    for w, url in re.findall(r"font-weight: (\d+);.*?url\((\S+?)\)", css, re.S):
        p = out / f"{fam.replace(' ','')}-{w}.ttf"
        p.write_bytes(urllib.request.urlopen(url).read()); got.append(w)
    print(fam, got)
