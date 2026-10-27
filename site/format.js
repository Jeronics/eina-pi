// Text pla per copiar a les cel·les del PI. Entrada: el resultat de criterisMarcats (estat.js).

function agrupa(marcats, clau) {
  const grups = new Map();
  for (const m of marcats) {
    const k = clau(m);
    if (!grups.has(k)) grups.set(k, []);
    grups.get(k).push(m);
  }
  return [...grups.values()];
}

// Nom de referència: el de la matèria d'ESO (o el del primer grup si no n'hi ha).
function nomReferencia(marcats) {
  return (marcats.find(m => m.materia.etapa === 'ESO') ?? marcats[0]).materia.nom;
}

const ambNom = (materia, referencia) => materia.etapa !== 'ESO' && materia.nom !== referencia;

export function textCE(marcats) {
  if (!marcats.length) return '';
  const referencia = nomReferencia(marcats);
  const grups = agrupa(marcats, m => m.materia.id).map(grup => {
    const materia = grup[0].materia;
    const usades = new Set(grup.map(m => m.criteri.ce));
    const linies = materia.ces.filter(ce => usades.has(ce.id)).map(ce => `${ce.codi}. ${ce.text}`);
    const etapa = materia.etapa === 'ESO' ? 'ESO' : 'Primària';
    return { titol: ambNom(materia, referencia) ? `${etapa} (${materia.nom})` : etapa, linies };
  });
  return uneixGrups(grups);
}

export function textCriteris(marcats, curriculum) {
  if (!marcats.length) return '';
  const referencia = nomReferencia(marcats);
  const grups = agrupa(marcats, m => `${m.materia.id}|${m.criteri.bloc}`).map(grup => {
    const { materia, criteri } = grup[0];
    const etiqueta = curriculum.blocs[criteri.bloc];
    return {
      titol: ambNom(materia, referencia) ? `${etiqueta} · ${materia.nom}` : etiqueta,
      linies: grup.map(m => `${m.criteri.codi} ${m.text}`),
    };
  });
  return uneixGrups(grups);
}

export function textEtapa(marcats, curriculum) {
  const etiquetes = [...new Set(marcats.map(m => curriculum.blocs[m.criteri.bloc]))];
  if (etiquetes.length <= 1) return etiquetes[0] ?? '';
  return `${etiquetes.slice(0, -1).join(', ')} i ${etiquetes.at(-1)}`;
}

// Amb un sol grup no cal encapçalament; amb més d'un, cada grup porta el seu títol.
function uneixGrups(grups) {
  if (grups.length === 1) return grups[0].linies.join('\n');
  return grups.map(g => [g.titol, ...g.linies].join('\n')).join('\n\n');
}
