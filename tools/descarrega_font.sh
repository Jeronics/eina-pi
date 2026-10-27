#!/bin/sh
# Baixa el PDF del Decret 175/2022 (DOGC 8762, amb annexos), el repara i n'extreu el currículum.
set -eu
cd "$(dirname "$0")/.."
mkdir -p fonts
URL="https://www.sindicat.net/wp-content/uploads/2024/04/DECRET-DORDENACIO-DELS-ENSENYAMENTS-DE-LEDUCACIO-BASICA.pdf"
[ -f fonts/decret-175-2022.pdf ] || curl -sSL -o fonts/decret-175-2022.pdf "$URL"
PAGINES=$(pdfinfo fonts/decret-175-2022.pdf | awk '/^Pages:/ {print $2}')
[ "$PAGINES" = "491" ] || { echo "S'esperaven 491 pàgines i n'hi ha $PAGINES" >&2; exit 1; }
python3 tools/repara_pdf.py fonts/decret-175-2022.pdf fonts/decret-reparat.pdf
python3 tools/extreu_curriculum.py fonts/decret-reparat.pdf site/dades/curriculum.json
