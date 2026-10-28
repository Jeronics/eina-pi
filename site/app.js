// Interfície de l'eina PI: carrega les dades, pinta la selecció i gestiona els botons de còpia.
import {
  areaPrimaria, novaSeleccio, afegeixBloc, treuBloc, commuta, marcaBloc,
  posaVersio, posaVersioTots, criterisMarcats, esModificada,
} from './estat.js';
import { textCE, textCriteris, textEtapa } from './format.js';
import { copia } from './copia.js';

const BLOCS_PRIMARIA = ['PRI_C1', 'PRI_C2', 'PRI_C3'];
const $ = id => document.getElementById(id);

let curriculum, simplificades, mapatge;
let materiaId, curs, sel;

function h(tag, atributs = {}, ...fills) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(atributs)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  el.append(...fills.filter(f => f != null));
  return el;
}

const materia = id => curriculum.materies.find(m => m.id === id);

async function carrega() {
  const llegeix = async nom => {
    const r = await fetch(`./dades/${nom}`);
    if (!r.ok) throw new Error(nom);
    return r.json();
  };
  [curriculum, simplificades, mapatge] = await Promise.all(
    ['curriculum.json', 'simplificades.json', 'mapatge.json'].map(llegeix));
}

function inicia() {
  const select = $('materia');
  for (const m of curriculum.materies.filter(m => m.etapa === 'ESO')) {
    select.append(h('option', { value: m.id }, m.nom));
  }
  select.addEventListener('change', canviaContext);
  $('curs').addEventListener('change', canviaContext);
  $('nou-bloc').addEventListener('change', mostraArea);
  $('afegeix').addEventListener('click', afegeix);
  $('reinicia').addEventListener('click', tornaAComencar);
  for (const b of document.querySelectorAll('[data-versio-global]')) {
    b.addEventListener('click', () => actualitza(posaVersioTots(sel, b.dataset.versioGlobal)));
  }
  for (const b of document.querySelectorAll('[data-copia]')) {
    b.addEventListener('click', () => copiaText(b.dataset.copia));
  }
  reinicia();
}

// Canviar de matèria o de curs torna a començar: si hi havia feina feta, es demana confirmació.
function canviaContext() {
  if (esModificada(sel, curriculum, materiaId, curs)
      && !confirm('Es perdrà la selecció actual (criteris desmarcats, nivells afegits i textos editats). Vols continuar?')) {
    $('materia').value = materiaId;
    $('curs').value = String(curs);
    return;
  }
  reinicia();
}

// Torna a l'estat inicial de la pàgina: matèria i curs per defecte i la seva selecció per defecte.
function tornaAComencar() {
  if (esModificada(sel, curriculum, materiaId, curs)
      && !confirm('Es perdrà la selecció actual (criteris desmarcats, nivells afegits i textos editats). Vols tornar a començar?')) return;
  avisa('');
  $('estat-copia').textContent = '';
  $('estat-copia').className = 'estat-copia';
  $('materia').selectedIndex = 0;
  $('curs').value = $('curs').querySelector('option[selected]').value;
  reinicia();
  window.scrollTo(0, 0);
}

function reinicia() {
  materiaId = $('materia').value;
  curs = Number($('curs').value);
  sel = novaSeleccio(curriculum, materiaId, curs);
  actualitza(sel);
}

function actualitza(nova, { repinta = true } = {}) {
  sel = nova;
  if (repinta) {
    pintaBlocs();
    pintaAfegeix();
  }
  pintaPrevia();
}

// Repintar destrueix els elements: es recorda quin control tenia el focus (data-focus) i es restaura.
function pintaBlocs() {
  const focus = document.activeElement?.dataset?.focus;
  const contenidor = $('blocs');
  contenidor.replaceChildren(...sel.blocs.map(pintaBloc));
  if (focus) contenidor.querySelector(`[data-focus="${CSS.escape(focus)}"]`)?.focus();
}

function titolBloc(m, bloc) {
  const etiqueta = curriculum.blocs[bloc];
  return m.etapa === 'ESO' ? etiqueta : `${etiqueta} · ${m.nom}`;
}

function pintaBloc({ materiaId: mid, bloc }) {
  const m = materia(mid);
  const criteris = m.criteris.filter(cr => cr.bloc === bloc);
  const perCE = m.ces.map(ce => ({ ce, criteris: criteris.filter(cr => cr.ce === ce.id) }))
    .filter(g => g.criteris.length);
  const nomes = sel.blocs.length === 1;
  return h('section', { class: 'bloc' },
    h('div', { class: 'bloc-cap' },
      h('h2', {}, titolBloc(m, bloc)),
      h('div', { class: 'bloc-accions' },
        h('button', { type: 'button', class: 'petit', 'data-focus': `${mid}|${bloc}|marca`, onclick: () => actualitza(marcaBloc(sel, mid, bloc, true)) }, 'Marca tot'),
        h('button', { type: 'button', class: 'petit', 'data-focus': `${mid}|${bloc}|desmarca`, onclick: () => actualitza(marcaBloc(sel, mid, bloc, false)) }, 'Desmarca tot'),
        nomes ? null : h('button', { type: 'button', class: 'petit', onclick: () => actualitza(treuBloc(sel, mid, bloc)) }, 'Treu'))),
    ...perCE.map(({ ce, criteris }) => h('div', { class: 'grup-ce' },
      h('p', { class: 'ce' }, h('strong', {}, `${ce.codi}. `), ce.text),
      ...criteris.map(pintaCriteri))));
}

function pintaCriteri(cr) {
  const item = sel.items[cr.id];
  const simpl = simplificades[cr.id];
  const text = item.versio === 'lliure' ? item.textLliure ?? cr.text
    : item.versio === 'simplificada' && simpl ? simpl.text : cr.text;
  const boto = (versio, etiqueta, deshabilitat = false) => h('button', {
    type: 'button', class: 'petit', 'aria-pressed': String(item.versio === versio), disabled: deshabilitat,
    'data-focus': `${cr.id}|${versio}`,
    onclick: () => {
      // Es llegeix l'estat actual: el text lliure pot haver canviat sense repintar.
      const actual = sel.items[cr.id];
      actualitza(posaVersio(sel, cr.id, versio, versio === 'lliure' && actual.textLliure === undefined ? text : undefined));
      if (versio === 'lliure') document.querySelector(`[data-focus="${CSS.escape(`${cr.id}|text`)}"]`)?.focus();
    },
  }, etiqueta);
  const id = `cr-${cr.id}`;
  return h('div', { class: item.marcat ? 'criteri' : 'criteri desmarcat' },
    h('input', { type: 'checkbox', id, 'data-focus': `${cr.id}|casella`, checked: item.marcat, onchange: () => actualitza(commuta(sel, cr.id)) }),
    h('div', { class: 'criteri-cos' },
      h('label', { for: id }, h('strong', {}, `${cr.codi} `),
        item.versio === 'lliure' ? null : text,
        item.versio === 'simplificada' && simpl?.estat === 'pendent'
          ? h('span', { class: 'pendent', title: 'Versió simplificada pendent de revisió per un departament' }, 'pendent revisar') : null),
      item.versio === 'lliure' ? h('textarea', {
        rows: 3, 'aria-label': `Text propi per a ${cr.codi}`, 'data-focus': `${cr.id}|text`,
        oninput: e => actualitza(posaVersio(sel, cr.id, 'lliure', e.target.value), { repinta: false }),
      }, item.textLliure ?? text) : null,
      h('div', { class: 'versions', role: 'group', 'aria-label': `Versió de ${cr.codi}` },
        boto('oficial', 'Oficial'),
        boto('simplificada', 'Simplificada', !simpl),
        boto('lliure', 'Edita'))));
}

function blocsDisponibles() {
  const ja = new Set(sel.blocs.map(b => `${b.materiaId}|${b.bloc}`));
  const eso = materia(materiaId).blocs
    .filter(b => !ja.has(`${materiaId}|${b}`))
    .map(b => ({ valor: b, etiqueta: curriculum.blocs[b] }));
  const pri = BLOCS_PRIMARIA.map(b => ({ valor: b, etiqueta: curriculum.blocs[b] }));
  return [...eso, ...pri];
}

function pintaAfegeix() {
  const select = $('nou-bloc');
  const abans = select.value;
  select.replaceChildren(...blocsDisponibles().map(o => h('option', { value: o.valor }, o.etiqueta)));
  if ([...select.options].some(o => o.value === abans)) select.value = abans;
  const area = $('nova-area');
  if (!area.options.length) {
    for (const m of curriculum.materies.filter(m => m.etapa !== 'ESO')) area.append(h('option', { value: m.id }, m.nom));
  }
  area.value = areaPrimaria(mapatge, materiaId) ?? area.options[0].value;
  mostraArea();
}

function mostraArea() {
  $('camp-area').hidden = !BLOCS_PRIMARIA.includes($('nou-bloc').value);
}

function afegeix() {
  const bloc = $('nou-bloc').value;
  const mid = BLOCS_PRIMARIA.includes(bloc) ? $('nova-area').value : materiaId;
  if (!materia(mid).blocs.includes(bloc)) {
    avisa(`${materia(mid).nom} no té criteris de ${curriculum.blocs[bloc]}.`);
    return;
  }
  avisa('');
  actualitza(afegeixBloc(sel, curriculum, mid, bloc));
}

function avisa(text) {
  $('avis').textContent = text;
  $('avis').hidden = !text;
}

function textos() {
  const marcats = criterisMarcats(sel, curriculum, simplificades);
  return { ce: textCE(marcats, curriculum), criteris: textCriteris(marcats, curriculum), etapa: textEtapa(marcats, curriculum) };
}

function pintaPrevia() {
  const t = textos();
  $('previa-ce').textContent = t.ce || '—';
  $('previa-criteris').textContent = t.criteris || '—';
  $('previa-etapa').textContent = t.etapa || '—';
}

const MISSATGES = {
  ok: { ce: 'CE copiades ✓', criteris: 'Criteris copiats ✓', etapa: 'Etapa i curs copiats ✓' },
  buit: 'No hi ha res seleccionat.',
  error: "No s'ha pogut copiar: obre «Mostra el text que es copiarà», selecciona'l i copia'l a mà.",
};

async function copiaText(que) {
  const resultat = await copia(textos()[que]);
  const estat = $('estat-copia');
  estat.textContent = resultat === 'ok' ? MISSATGES.ok[que] : MISSATGES[resultat];
  estat.className = `estat-copia ${resultat}`;
  if (resultat === 'error') document.querySelector('.peu details').open = true;
}

carrega().then(inicia).catch(() => {
  avisa("No s'han pogut carregar les dades. Obre l'eina des de l'enllaç web (no com a fitxer).");
});
