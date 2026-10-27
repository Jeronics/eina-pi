// Validador de les dades de l'eina PI (currículum, simplificades, mapatge).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BLOCS_ESO = ['ESO_1-3', 'ESO_4'];
const BLOCS_PRI = ['PRI_C1', 'PRI_C2', 'PRI_C3'];

const BROSSA = [/ISSN/, /CVE-DOGC/, /Núm\. 8762/, /Diari Oficial/, /https?:\/\/www\.gencat\.cat/];

// Tokens que apareixen quan el PDF perd glifs (V, N, ò, À...).
const MUTILATS = [/\bisual\b/, /\bAudio isual\b/, /\batural\b/, /obligat ria/, /\brees\b/];

function problemesText(text, on) {
  const errors = [];
  if (typeof text !== 'string' || !text.trim()) return [`${on}: text buit`];
  if (BROSSA.some(r => r.test(text))) errors.push(`${on}: brossa de pàgina`);
  if (MUTILATS.some(r => r.test(text))) errors.push(`${on}: lletra perduda`);
  if (/\p{L}-$/u.test(text.trim()) || /\p{L}- \p{Ll}/u.test(text)) errors.push(`${on}: guió de partició`);
  return errors;
}

export function validaCurriculum(c) {
  const errors = [];
  for (const m of c.materies) {
    errors.push(...problemesText(m.nom, `${m.id} (nom)`));
    const ces = new Set(m.ces.map(ce => ce.id));
    for (const ce of m.ces) errors.push(...problemesText(ce.text, ce.id));
    for (const cr of m.criteris) {
      if (!ces.has(cr.ce)) errors.push(`${cr.id}: la CE ${cr.ce} no existeix`);
      if (!(cr.bloc in c.blocs)) errors.push(`${cr.id}: bloc desconegut ${cr.bloc}`);
      errors.push(...problemesText(cr.text, cr.id));
    }
    const blocs = new Set(m.criteris.map(cr => cr.bloc));
    for (const b of m.etapa === 'ESO' ? BLOCS_ESO : BLOCS_PRI) {
      if (!blocs.has(b)) errors.push(`${m.id}: no té criteris del bloc ${b}`);
    }
  }
  return errors;
}

function idsCriteris(c) {
  return new Set(c.materies.flatMap(m => m.criteris.map(cr => cr.id)));
}

export function validaSimplificades(s, c) {
  const ids = idsCriteris(c);
  const errors = [];
  for (const [id, v] of Object.entries(s)) {
    if (!ids.has(id)) errors.push(`${id}: no és cap criteri del currículum`);
    if (v.estat !== 'pendent' && v.estat !== 'validada') errors.push(`${id}: estat desconegut ${v.estat}`);
    if (/^CE\d/.test(v.text ?? '')) errors.push(`${id}: el text ha d'anar sense codi`);
    errors.push(...problemesText(v.text, `${id} (simplificada)`));
  }
  return errors;
}

export function validaMapatge(mapa, c) {
  const pri = new Set(c.materies.filter(m => m.etapa !== 'ESO').map(m => m.id));
  const eso = new Set(c.materies.filter(m => m.etapa === 'ESO').map(m => m.id));
  const errors = [];
  for (const [de, a] of Object.entries(mapa)) {
    if (!eso.has(de)) errors.push(`${de}: no és cap matèria d'ESO`);
    if (!pri.has(a)) errors.push(`${de} -> ${a}: no és cap àrea de primària`);
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = new URL('../site/dades/', import.meta.url);
  const llegeix = f => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));
  const c = llegeix('curriculum.json');
  const errors = [
    ...validaCurriculum(c),
    ...validaSimplificades(llegeix('simplificades.json'), c),
    ...validaMapatge(llegeix('mapatge.json'), c),
  ];
  for (const e of errors) console.log(e);
  console.log(`${errors.length} errors`);
  process.exit(errors.length ? 1 : 0);
}
