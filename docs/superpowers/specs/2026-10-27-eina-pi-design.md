# Eina d'ajuda per omplir PI (secció 5) — Disseny

Data: 2026-10-27

## Intenció

Omplir els Plans de Suport Individualitzat (PI) de l'Institut Santa Eulàlia és lent: per a cada matèria cal copiar del decret les competències específiques (CE) i els criteris d'avaluació, retallar-los i, sovint, simplificar-los o agafar-los d'un curs inferior (fins i tot de primària). L'eina fa que triar i enganxar aquest contingut sigui ràpid i coherent, sense tocar mai les dades de l'alumne.

Els PI viuen en Google Docs al Drive del centre (domini xtec), a partir d'una plantilla amb una taula per matèria a la secció 5 (cel·les: *Competències específiques*, *Criteris d'avaluació*, *Etapa i Curs dels criteris d'avaluació*). Exemple de referència: `~/Desktop/PI ALumne exemple.pages`.

## Principi rector: no trencar res

- L'eina **no accedeix mai** als Google Docs ni al Drive. No té permisos, no fa crides a Google, no escriu enlloc.
- L'únic punt de contacte és el **porta-retalls**: el docent copia i enganxa a la cel·la. El document només canvia quan el docent enganxa.
- El text copiat ha d'adoptar l'estil de la cel·la de destí: format mínim (paràgrafs i, com a molt, negreta pels codis), sense fonts, mides, colors ni taules incrustades.
- Cap dada d'alumne entra a l'eina. No hi ha camps de nom, diagnòstic, etc.
- Sense IA en temps d'execució. Sense servidor. Sense comptes.

## Objectius

1. Triar **matèria** i **curs de l'alumne** → apareixen totes les CE i criteris oficials d'aquell curs, **marcats per defecte**; el docent desmarca.
2. Afegir criteris d'**altres cursos**, incloent **primària**. Per primària, l'eina proposa l'**àrea equivalent** (p. ex. Física i Química → Coneixement del medi natural, social i cultural), editable.
3. Per a cada criteri, escollir **versió oficial** o **versió simplificada**, o editar-ne el text lliurement. Interruptor global oficial/simplificada (decisió de l'agent).
4. Les CE es **deriven** dels criteris marcats (no se seleccionen a part).
5. Tres botons de còpia: **Copia CE**, **Copia criteris**, **Copia etapa i curs**.
6. La cel·la *Etapa i curs* es genera sola amb el bloc oficial i reflecteix la barreja de blocs (p. ex. "ESO (1r, 2n i 3r) i Primària, cicle superior (5è i 6è)").
7. Els codis oficials es mantenen sempre, també a la versió simplificada (p. ex. "CE2.2 …").

## No-objectius (v1)

- Seccions 1–4 i 6–9 del PI (dades personals, escolars, mesures, reunions…).
- Taula de mesures i suports per matèria.
- Optatives i projectes.
- Batxillerat.
- Generar documents o fitxers.

## Anti-objectius

- Que l'eina modifiqui, sobreescrigui o desformati un PI.
- Que qualsevol dada d'alumne surti de l'ordinador del docent.
- Que calgui instal·lar res per fer-la servir (l'extensió és opcional).

## Contingut

- **Font oficial**: Decret 175/2022, d'ordenació dels ensenyaments de l'educació bàsica (DOGC 8762, 29/09/2022), text íntegre amb annexos: annex 2 = àrees de primària, annex 3 = matèries d'ESO. Segons la memòria d'impacte del Decret 480/2024, la modificació no afecta competències específiques ni criteris d'avaluació. Referència de contrast: fitxes per matèria de projectes.xtec.cat/nou-curriculum (primària i ESO costat per costat).
- **Agrupació dels criteris (verificat)**: ESO en dos blocs, **"1r, 2n i 3r"** i **"4t"**; primària per cicles, **1r i 2n**, **3r i 4t**, **5è i 6è**. No hi ha criteris per curs individual a l'ESO: "baixar de nivell" dins l'ESO només és possible des de 4t; per sota del bloc 1r–3r cal anar a primària.
- **Cel·la "Etapa i curs"**: mostra el **bloc oficial**, p. ex. "ESO (1r, 2n i 3r)" o "Primària, cicle superior (5è i 6è)"; si es barregen blocs, s'enumeren tots.
- **Cobertura**: totes les matèries comunes d'ESO 1r–4t i totes les àrees de primària per cicles.
- **Versions simplificades**: un sol nivell per criteri, generades ara (fora de l'eina) i desades com a dades estàtiques. Cada una porta l'estat `pendent revisar` fins que un departament la valida. L'estat es mostra a l'eina amb una marca discreta. Les correccions es fan editant un fitxer de dades.
- **Mapatge ESO → primària**: taula editable a les dades.

## Distribució

- **Web estàtica** a GitHub Pages (decisió de l'agent: gratuït, sense dades sensibles, s'actualitza per a tothom alhora). Ha de funcionar en ordinadors del centre i portàtils propis.
- **Extensió de Chrome opcional** que només obre la web en el **panell lateral** de Chrome. No llegeix ni modifica pàgines. Distribució prevista: Chrome Web Store no llistada; alternativa, càrrega manual.

## Decisions preses per l'agent

- Allotjament a GitHub Pages.
- Interruptor oficial/simplificada per criteri + global.

## Deixat al constructor

- Format intern de les dades del currículum, estructura del codi, estil visual.
- Mecanisme exacte de còpia (text/plain + text/html mínim), verificat enganxant a Google Docs.
- Recordar l'última matèria/curs triats al navegador (comoditat, opcional).
