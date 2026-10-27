// Lògica pura de la selecció de criteris. Cap funció modifica els seus arguments.

const CURSOS_BLOC = {
  'ESO_1-2': [1, 2], 'ESO_3-4': [3, 4], 'ESO_1-3': [1, 2, 3], 'ESO_4': [4], 'ESO_1-4': [1, 2, 3, 4],
};

const materia = (curriculum, materiaId) => curriculum.materies.find(m => m.id === materiaId);

export function blocPerCurs(curriculum, materiaId, curs) {
  const blocs = materia(curriculum, materiaId).blocs;
  return blocs.find(b => CURSOS_BLOC[b]?.includes(curs)) ?? blocs.at(-1);
}

export function areaPrimaria(mapatge, materiaId) {
  return mapatge[materiaId] ?? null;
}

export function novaSeleccio(curriculum, materiaId, curs) {
  return afegeixBloc({ blocs: [], items: {} }, curriculum, materiaId, blocPerCurs(curriculum, materiaId, curs));
}

export function afegeixBloc(sel, curriculum, materiaId, bloc) {
  if (sel.blocs.some(b => b.materiaId === materiaId && b.bloc === bloc)) return sel;
  const items = { ...sel.items };
  for (const cr of materia(curriculum, materiaId).criteris) {
    if (cr.bloc === bloc && !(cr.id in items)) items[cr.id] = { marcat: true, versio: 'oficial' };
  }
  return { blocs: [...sel.blocs, { materiaId, bloc }], items };
}

export function treuBloc(sel, materiaId, bloc) {
  const prefix = `${materiaId}.${bloc}.`;
  const items = Object.fromEntries(Object.entries(sel.items).filter(([id]) => !id.startsWith(prefix)));
  return { blocs: sel.blocs.filter(b => !(b.materiaId === materiaId && b.bloc === bloc)), items };
}

function canvia(sel, ids, canvi) {
  const items = { ...sel.items };
  for (const id of ids) if (id in items) items[id] = { ...items[id], ...canvi(items[id]) };
  return { ...sel, items };
}

export function commuta(sel, criteriId) {
  return canvia(sel, [criteriId], it => ({ marcat: !it.marcat }));
}

export function marcaBloc(sel, materiaId, bloc, marcat) {
  const prefix = `${materiaId}.${bloc}.`;
  return canvia(sel, Object.keys(sel.items).filter(id => id.startsWith(prefix)), () => ({ marcat }));
}

export function posaVersio(sel, criteriId, versio, textLliure) {
  return canvia(sel, [criteriId], () => (versio === 'lliure' ? { versio, textLliure } : { versio }));
}

// Canvia oficial/simplificada a tots els criteris, excepte els que tenen text lliure.
export function posaVersioTots(sel, versio) {
  const ids = Object.keys(sel.items).filter(id => sel.items[id].versio !== 'lliure');
  return canvia(sel, ids, () => ({ versio }));
}

function textResolt(item, criteri, simplificades) {
  if (item.versio === 'lliure' && item.textLliure?.trim()) return item.textLliure.trim();
  if (item.versio === 'simplificada' && simplificades[criteri.id]) return simplificades[criteri.id].text;
  return criteri.text;
}

// Criteris marcats amb el text ja resolt (sense codi): ESO abans que primària,
// els blocs en l'ordre de curriculum.blocs i, dins de cada bloc, en l'ordre del currículum.
export function criterisMarcats(sel, curriculum, simplificades) {
  const ordreBlocs = Object.keys(curriculum.blocs);
  const blocs = [...sel.blocs].sort((a, b) => {
    const ea = materia(curriculum, a.materiaId).etapa === 'ESO' ? 0 : 1;
    const eb = materia(curriculum, b.materiaId).etapa === 'ESO' ? 0 : 1;
    return ea - eb || ordreBlocs.indexOf(a.bloc) - ordreBlocs.indexOf(b.bloc);
  });
  const resultat = [];
  for (const { materiaId, bloc } of blocs) {
    const m = materia(curriculum, materiaId);
    for (const criteri of m.criteris) {
      const item = sel.items[criteri.id];
      if (criteri.bloc === bloc && item?.marcat) {
        resultat.push({ criteri, materia: m, text: textResolt(item, criteri, simplificades) });
      }
    }
  }
  return resultat;
}
