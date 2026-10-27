"""Repara les taules ToUnicode del PDF del Decret 175/2022.

Algunes còpies parcials (subsets) d'Arial Bold i Arial Italic del PDF no declaren
el caràcter d'alguns glifs (v, V, G, N...), i qualsevol extractor de text els perd.
Totes les variants d'Arial comparteixen l'ordre de glifs, així que la unió de les
taules de totes les còpies permet completar les que estan incompletes.

Ús: python3 tools/repara_pdf.py entrada.pdf sortida.pdf
"""
import re
import sys

import pypdf
from pypdf.generic import NameObject, StreamObject

FAMILIES = {'Arial': ['Arial', 'Arial,Bold', 'Arial,Italic', 'Arial,BoldItalic']}


def llegeix_tounicode(text):
    mapa = {}
    for bloc in re.findall(r'beginbfchar(.*?)endbfchar', text, re.S):
        for a, b in re.findall(r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', bloc):
            mapa[int(a, 16)] = bytes.fromhex(b).decode('utf-16-be')
    for bloc in re.findall(r'beginbfrange(.*?)endbfrange', text, re.S):
        for a, b, c in re.findall(r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', bloc):
            a, b, u = int(a, 16), int(b, 16), int(c, 16)
            for i in range(a, b + 1):
                mapa[i] = chr(u + i - a)
    return mapa


def escriu_tounicode(mapa):
    linies = []
    items = sorted(mapa.items())
    for i in range(0, len(items), 100):
        tros = items[i:i + 100]
        linies.append(f'{len(tros)} beginbfchar')
        linies += [f'<{g:04X}> <{u.encode("utf-16-be").hex().upper()}>' for g, u in tros]
        linies.append('endbfchar')
    return ('/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n'
            '/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n'
            '/CMapName /Adobe-Identity-UCS def\n/CMapType 2 def\n'
            '1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n'
            + '\n'.join(linies) + '\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend\n')


def fonts_type0(reader):
    vistes = {}
    for pagina in reader.pages:
        recursos = pagina.get('/Resources')
        fonts = recursos.get_object().get('/Font') if recursos else None
        if not fonts:
            continue
        for ref in fonts.get_object().values():
            font = ref.get_object()
            if font.get('/Subtype') == '/Type0' and '/ToUnicode' in font:
                vistes[ref.idnum] = font
    return vistes


def familia(font):
    nom = str(font['/BaseFont']).split('+')[-1]
    for fam, noms in FAMILIES.items():
        if nom in noms:
            return fam
    return None


def repara(entrada, sortida):
    reader = pypdf.PdfReader(entrada)
    fonts = fonts_type0(reader)
    taules = {i: llegeix_tounicode(f['/ToUnicode'].get_object().get_data().decode('latin1'))
              for i, f in fonts.items()}
    unio = {}
    for i, f in fonts.items():
        fam = familia(f)
        if fam:
            for g, u in taules[i].items():
                unio.setdefault(fam, {}).setdefault(g, u)
    afegits = 0
    for i, f in fonts.items():
        fam = familia(f)
        if not fam:
            continue
        nova = {**unio[fam], **taules[i]}
        afegits += len(nova) - len(taules[i])
        stream = StreamObject()
        stream.set_data(escriu_tounicode(nova).encode('latin1'))
        f[NameObject('/ToUnicode')] = reader._add_object(stream) if hasattr(reader, '_add_object') else stream
    writer = pypdf.PdfWriter(clone_from=reader)
    with open(sortida, 'wb') as fh:
        writer.write(fh)
    return afegits


if __name__ == '__main__':
    print(f'{repara(sys.argv[1], sys.argv[2])} correspondències afegides')
