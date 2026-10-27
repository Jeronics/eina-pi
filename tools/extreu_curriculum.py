"""Extreu competències específiques i criteris d'avaluació del Decret 175/2022.

Entrada: el PDF ja reparat amb tools/repara_pdf.py.
Ús: python3 tools/extreu_curriculum.py fonts/decret-reparat.pdf site/dades/curriculum.json

Les taules de criteris tenen una columna per bloc de cursos i les línies de
columnes diferents s'entrellacen, per això cada paraula s'assigna a una columna
segons la seva coordenada x (pdftotext -bbox).
"""
import html
import json
import re
import subprocess
import sys

BLOCS = {
    'ESO_1-2': 'ESO (1r i 2n)',
    'ESO_3-4': 'ESO (3r i 4t)',
    'ESO_1-3': 'ESO (1r, 2n i 3r)',
    'ESO_4': 'ESO (4t)',
    'ESO_1-4': 'ESO (1r, 2n, 3r o 4t)',
    'PRI_C1': 'Primària, cicle inicial (1r i 2n)',
    'PRI_C2': 'Primària, cicle mitjà (3r i 4t)',
    'PRI_C3': 'Primària, cicle superior (5è i 6è)',
}

# (primera pàgina, pàgina següent a l'última, etapa, [(id, nom), ...]).
# Les llengües catalana i castellana comparteixen secció al decret.
SECCIONS = [
    (48, 68, 'Primària', [('pri.cat', 'Llengua Catalana i Literatura'), ('pri.cas', 'Llengua Castellana i Literatura')]),
    (68, 90, 'Primària', [('pri.est', 'Llengua Estrangera')]),
    (104, 127, 'Primària', [('pri.medi', 'Coneixement del Medi Natural, Social i Cultural')]),
    (127, 144, 'Primària', [('pri.art', 'Educació Artística')]),
    (144, 154, 'Primària', [('pri.val', 'Educació en Valors Cívics i Ètics')]),
    (154, 175, 'Primària', [('pri.ef', 'Educació Física')]),
    (175, 197, 'Primària', [('pri.mat', 'Matemàtiques')]),
    (197, 215, 'ESO', [('eso.cat', 'Llengua Catalana i Literatura'), ('eso.cas', 'Llengua Castellana i Literatura')]),
    (215, 232, 'ESO', [('eso.est', 'Llengua Estrangera')]),
    (253, 268, 'ESO', [('eso.bio', 'Biologia i Geologia')]),
    (268, 289, 'ESO', [('eso.cs', 'Ciències Socials: Geografia i Història')]),
    (312, 321, 'ESO', [('eso.val', 'Educació en Valors Cívics i Ètics')]),
    (321, 334, 'ESO', [('eso.ef', 'Educació Física')]),
    (334, 345, 'ESO', [('eso.epva', 'Educació Plàstica, Visual i Audiovisual')]),
    (372, 386, 'ESO', [('eso.fiq', 'Física i Química')]),
    (406, 424, 'ESO', [('eso.mat', 'Matemàtiques')]),
    (424, 431, 'ESO', [('eso.mus', 'Música')]),
    (446, 460, 'ESO', [('eso.tec', 'Tecnologia i Digitalització')]),
]

# Seccions amb taules d'una sola columna sense capçalera.
BLOC_SENSE_CAPCALERA = {446: 'ESO_1-3'}

# Text de capçalera de columna -> bloc. None = columna que no és de la matèria (optatives de 4t).
CAPCALERES = {
    'Primària': {'1r i 2n': 'PRI_C1', '1r-2n': 'PRI_C1', '1r -2n': 'PRI_C1', '3r i 4t': 'PRI_C2', '3r-4t': 'PRI_C2',
                 '5è i 6è': 'PRI_C3', '5è-6è': 'PRI_C3', '5è o 6è': 'PRI_C3'},
    'ESO': {'1r i 2n': 'ESO_1-2', '3r i 4t': 'ESO_3-4', '1r, 2n i 3r': 'ESO_1-3', '4t': 'ESO_4',
            '1r o 2n o 3r o 4t': 'ESO_1-4', 'Educació Plàstica, Visual i Audiovisual (1r a 3r)': 'ESO_1-3',
            'Expressió Artística (4t)': None, 'Cursos de 1r a 3r': 'ESO_1-3', 'Optativa de 4t': None},
}

MARGE_SUPERIOR = 90    # capçalera del DOGC a sobre
MARGE_INFERIOR = 735   # número de pàgina i peu a sota
SAGNAT_TAULA = 3       # les cel·les de taula comencen ~5 punts a la dreta del marge del text
MARGE_PEU_NUMERO = 650  # per sota d'aquí, una línia que només és un número és el número de pàgina
SALT_PARAGRAF = 18     # en taules d'una columna, un salt vertical més gran tanca la taula
TOLERANCIA_Y = 3      # diferència vertical màxima dins d'una mateixa línia
SALT_COLUMNA = 15      # separació mínima entre grups de la línia de capçalera

INICI_CRITERI = re.compile(r'^(\d+)\.\s?(\d+)\.?$')


def paraules(pdf, primera, ultima):
    """Retorna {pàgina: [(y, línia)]}, on cada línia és una llista de (x0, x1, text) ordenada per x."""
    sortida = subprocess.run(['pdftotext', '-bbox', '-f', str(primera), '-l', str(ultima), pdf, '-'],
                             capture_output=True, text=True, check=True).stdout
    pagines = {}
    for n, pagina in enumerate(sortida.split('<page ')[1:], start=primera):
        mots = []
        for x0, y0, x1, y1, text in re.findall(
                r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', pagina):
            y = float(y0)
            if MARGE_SUPERIOR < y < MARGE_INFERIOR:
                mots.append((y, float(x0), float(x1), html.unescape(text)))
        # Paraules a menys de TOLERANCIA_Y punts de la primera de la línia són de la mateixa línia.
        linies = []
        for y, x0, x1, t in sorted(mots):
            if linies and y - linies[-1][0] <= TOLERANCIA_Y:
                linies[-1][1].append((x0, x1, t))
            else:
                linies.append((y, [(x0, x1, t)]))
        # El número de pàgina intern de l'annex és una línia d'un sol número a la part baixa.
        pagines[n] = [(y, sorted(ps)) for y, ps in linies
                      if not (y > MARGE_PEU_NUMERO and len(ps) == 1 and ps[0][2].isdigit())]
    return pagines


def text_linia(linia):
    return ' '.join(t for _, _, t in linia)


def grups_capcalera(linia):
    """Agrupa les paraules d'una línia de capçalera en columnes: [(centre, text)]."""
    grups = []
    for x0, x1, t in linia:
        if grups and x0 - grups[-1][1] < SALT_COLUMNA:
            grups[-1] = (grups[-1][0], x1, grups[-1][2] + ' ' + t)
        else:
            grups.append((x0, x1, t))
    return [((a + b) / 2, t) for a, b, t in grups]


def fusiona_capcalera(linies):
    """Una capçalera pot ocupar diverses línies: s'uneixen els grups amb el centre a prop."""
    grups = []
    for linia in linies:
        for centre, text in grups_capcalera(linia):
            proper = next((g for g in grups if abs(g[0] - centre) < 40), None)
            if proper:
                proper[1] += ' ' + text
            else:
                grups.append([centre, text])
    return [(c, t) for c, t in grups]


def uneix(linies):
    text = ''
    for l in linies:
        l = l.strip()
        if not l:
            continue
        if text.endswith('-'):
            text += l
        elif text:
            text += ' ' + l
        else:
            text = l
    return re.sub(r'\s+', ' ', text).strip()


def parteix_criteris(linies_columna):
    """Separa les línies d'una columna en criteris: [(num_ce, num, text)]."""
    criteris = []
    for linia in linies_columna:
        primer = linia[0][2] if linia else ''
        resta = [t for _, _, t in linia]
        m = INICI_CRITERI.match(primer)
        if m:
            criteris.append([int(m.group(1)), int(m.group(2)), [' '.join(resta[1:])]])
        elif criteris:
            criteris[-1][2].append(' '.join(resta))
    return [(ce, n, uneix(ls)) for ce, n, ls in criteris]


class Taula:
    def __init__(self, columnes):
        self.columnes = columnes          # [(centre, bloc)]
        self.linies = [[] for _ in columnes]

    def fronteres(self):
        return [(a[0] + b[0]) / 2 for a, b in zip(self.columnes, self.columnes[1:])]

    def travessa(self, linia):
        """Una paraula que travessa una frontera de columna és text a tota amplada (fi de taula)."""
        return any(x0 < f < x1 for x0, x1, _ in linia for f in self.fronteres())

    def afegeix(self, linia):
        fronteres = self.fronteres()
        per_columna = [[] for _ in self.columnes]
        for p in linia:
            k = sum(1 for f in fronteres if p[0] >= f)
            per_columna[k].append(p)
        for k, ps in enumerate(per_columna):
            if ps:
                self.linies[k].append(ps)


def extreu_seccio(pdf, primera, seguent, etapa):
    """Retorna (ces, criteris) d'una secció: ces={num: text}, criteris=[(bloc, num_ce, num, text)]."""
    pagines = paraules(pdf, primera, seguent - 1)
    ces, criteris = {}, []
    estat, ce_actual, linies_ce, capcalera, taula = None, None, [], [], None
    marge = None

    def tanca_taula():
        nonlocal taula
        if taula:
            for (_, bloc), linies in zip(taula.columnes, taula.linies):
                if bloc is None:
                    continue
                for num_ce, num, text in parteix_criteris(linies):
                    criteris.append((bloc, num_ce, num, text))
        taula = None

    y_anterior = None
    for n in sorted(pagines):
        y_anterior = None
        for y, linia in pagines[n]:
            salt = y - y_anterior if y_anterior is not None else 0
            y_anterior = y
            text = text_linia(linia)
            m_ce = re.match(r'^Competència (?:específica )?(\d+)$', text)
            if m_ce:
                tanca_taula()
                estat, ce_actual, linies_ce = 'ce', int(m_ce.group(1)), []
                continue
            if text == 'Sabers' and (marge is None or linia[0][0] < marge + SAGNAT_TAULA):
                tanca_taula()
                return ces, criteris
            if estat == 'ce':
                if re.match(r'^Criteris (?:d.)?avaluació$', text):
                    marge = linia[0][0]
                    ces[ce_actual] = uneix(linies_ce)
                    estat, capcalera = 'capcalera', []
                else:
                    linies_ce.append(text)
                continue
            if estat == 'capcalera':
                if INICI_CRITERI.match(linia[0][2]):
                    grups = fusiona_capcalera(capcalera)
                    if not grups:
                        if primera not in BLOC_SENSE_CAPCALERA:
                            raise ValueError(f'pàgina {n}: taula sense capçalera')
                        grups = [(0, None)]
                        CAPCALERES[etapa][None] = BLOC_SENSE_CAPCALERA[primera]
                    desconeguts = [t for _, t in grups if t not in CAPCALERES[etapa]]
                    if desconeguts:
                        raise ValueError(f'pàgina {n}: capçalera desconeguda {desconeguts}')
                    columnes = [(c, CAPCALERES[etapa][t]) for c, t in grups]
                    taula = Taula(sorted(columnes))
                    estat = 'taula'
                    salt = 0  # la distància des de la capçalera no compta
                else:
                    capcalera.append(linia)
                    continue
            if estat == 'taula':
                una_columna = len(taula.columnes) == 1
                if una_columna:
                    fi = salt > SALT_PARAGRAF
                else:
                    fi = linia[0][0] < marge + SAGNAT_TAULA or taula.travessa(linia)
                if fi:
                    tanca_taula()
                    estat = None
                else:
                    taula.afegeix(linia)
    tanca_taula()
    return ces, criteris


def construeix(pdf):
    materies = []
    for primera, seguent, etapa, ids in SECCIONS:
        ces, criteris = extreu_seccio(pdf, primera, seguent, etapa)
        ordre_blocs = [b for b in BLOCS if any(c[0] == b for c in criteris)]
        for mid, nom in ids:
            materies.append({
                'id': mid, 'etapa': etapa, 'nom': nom, 'blocs': ordre_blocs,
                'ces': [{'id': f'{mid}.CE{k}', 'codi': f'CE{k}', 'text': ces[k]} for k in sorted(ces)],
                'criteris': [{'id': f'{mid}.{b}.{ce}.{n}', 'ce': f'{mid}.CE{ce}', 'codi': f'CE{ce}.{n}',
                              'bloc': b, 'text': t} for b, ce, n, t in criteris],
            })
    return {'blocs': BLOCS, 'materies': materies}


if __name__ == '__main__':
    dades = construeix(sys.argv[1])
    with open(sys.argv[2], 'w', encoding='utf-8') as fh:
        json.dump(dades, fh, ensure_ascii=False, indent=1)
        fh.write('\n')
    print(f"{len(dades['materies'])} matèries, "
          f"{sum(len(m['criteris']) for m in dades['materies'])} criteris")
