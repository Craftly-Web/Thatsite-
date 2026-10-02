"""Packt den EPUB-Ordner (mimetype unkomprimiert als erste Datei) und prüft alle XML-Dateien auf Wohlgeformtheit."""
import os, sys, zipfile
from xml.dom import minidom

quelle, ziel = sys.argv[1], sys.argv[2]
fehler = 0
for wurzel, _, dateien in os.walk(quelle):
    for d in dateien:
        if d.endswith(('.xhtml', '.opf', '.ncx', '.xml')):
            try:
                minidom.parse(os.path.join(wurzel, d))
            except Exception as e:
                fehler += 1
                print(f'XML-Fehler in {d}: {e}')
if fehler:
    sys.exit(1)

if os.path.exists(ziel):
    os.remove(ziel)
with zipfile.ZipFile(ziel, 'w') as z:
    z.write(os.path.join(quelle, 'mimetype'), 'mimetype', compress_type=zipfile.ZIP_STORED)
    for wurzel, _, dateien in os.walk(quelle):
        for d in sorted(dateien):
            pfad = os.path.join(wurzel, d)
            rel = os.path.relpath(pfad, quelle).replace(os.sep, '/')
            if rel != 'mimetype':
                z.write(pfad, rel, compress_type=zipfile.ZIP_DEFLATED)
print(f'EPUB: {os.path.getsize(ziel) // 1024} KB')
