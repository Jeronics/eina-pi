# Eina PI

Eina per omplir la **secció 5 del Pla de suport individualitzat (PI)**: tries matèria i curs de l'alumne, marques o desmarques competències específiques i criteris d'avaluació del currículum (Decret 175/2022), i els copies cel·la a cel·la al PI de Google Docs.

**Obre l'eina:** https://jeronics.github.io/eina-pi/

## Privacitat

- L'eina **no rep ni desa cap dada de l'alumne**. No té camps per a noms ni diagnòstics.
- **No accedeix a Google Docs ni a Drive.** Només posa text al porta-retalls quan prems un botó de còpia.
- No fa servir IA ni cap servidor: és una pàgina estàtica amb les dades del currículum.

## Com es fa servir

1. Obre l'eina (enllaç web o panell lateral de l'extensió) al costat del PI.
2. Tria **Matèria** i **Curs de l'alumne**. Surten tots els criteris del bloc oficial d'aquell curs, marcats.
3. Desmarca els que no toquen. Per a cada criteri pots triar **Oficial**, **Simplificada** o **Edita** (text propi). Els botons «Tots: Oficial / Simplificada» canvien tots els criteris alhora (excepte els editats).
4. Si cal, **Afegeix criteris d'un altre nivell**: l'altre bloc d'ESO o un cicle de primària (l'eina proposa l'àrea equivalent; la pots canviar).
5. Posa el cursor a la cel·la del PI i prem **Copia CE**, **Copia criteris** o **Copia etapa i curs**, i enganxa. El text va sense format, per això pren l'estil de la cel·la.

## Versions simplificades

Són a `site/dades/simplificades.json`. Cada entrada té la forma:

```json
"eso.mat.ESO_1-3.1.1": { "text": "Entendre un problema: ordenar les dades i saber què es pregunta.", "estat": "pendent" }
```

- El `text` va **sense codi** (l'eina hi afegeix `CE1.1`).
- Quan un departament la revisa, canvia `"estat": "pendent"` per `"estat": "validada"` i desapareix la marca «pendent revisar».
- Abans de publicar, comprova-ho amb `npm run valida`.

## Blocs del currículum

El decret no agrupa igual tots els criteris d'ESO. Segons la matèria, els blocs són «1r i 2n / 3r i 4t», «1r, 2n i 3r / 4t» o un de sol. L'eina tria el bloc que inclou el curs de l'alumne.

## Desenvolupament

- Proves: `npm test` (Node ≥ 20) i `python3 -m unittest tools/test_extreu.py`.
- Servidor local: `python3 -m http.server -d site 8765` i obre http://localhost:8765/.
- Regenerar el currículum des del PDF del DOGC: `./tools/descarrega_font.sh` (cal `pdftotext`/`pdfinfo` de poppler i el paquet Python `pypdf`). El PDF perd alguns caràcters en negreta; `tools/repara_pdf.py` els recupera abans d'extreure.

## Extensió de Chrome (opcional)

A `extensio/`. Només obre l'eina al panell lateral; no té permisos per llegir ni modificar pàgines. Per provar-la: `chrome://extensions` → activa **Mode de desenvolupador** → **Carrega descomprimida** → tria la carpeta `extensio`. L'adreça de l'eina és a `extensio/panel.html`.
