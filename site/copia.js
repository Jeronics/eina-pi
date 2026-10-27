// Copia text pla al porta-retalls. Retorna "ok", "buit" o "error".
// `entorn` permet provar-ho sense navegador; per defecte és la pàgina.
export async function copia(text, entorn = globalThis) {
  if (!text.trim()) return 'buit';
  try {
    await entorn.navigator.clipboard.writeText(text);
    return 'ok';
  } catch {
    return copiaAntiga(text, entorn.document) ? 'ok' : 'error';
  }
}

// Alternativa per a contextos on l'API no està permesa (p. ex. alguns iframes).
function copiaAntiga(text, document) {
  if (!document) return false;
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  let fet = false;
  try {
    fet = document.execCommand('copy');
  } catch {
    fet = false;
  }
  area.remove();
  return fet;
}
