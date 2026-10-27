import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  blocPerCurs, areaPrimaria, novaSeleccio, afegeixBloc, treuBloc, commuta, marcaBloc,
  posaVersio, posaVersioTots, criterisMarcats,
} from './estat.js';

const cr = (m, bloc, ce, n) => ({ id: `${m}.${bloc}.${ce}.${n}`, ce: `${m}.CE${ce}`, codi: `CE${ce}.${n}`, bloc, text: `Oficial ${m} ${bloc} ${ce}.${n}.` });

const C = {
  blocs: { 'ESO_1-2': 'ESO (1r i 2n)', 'ESO_3-4': 'ESO (3r i 4t)', 'ESO_1-3': 'ESO (1r, 2n i 3r)', 'ESO_4': 'ESO (4t)', 'PRI_C3': 'Primària, cicle superior (5è i 6è)' },
  materies: [
    { id: 'eso.mat', etapa: 'ESO', nom: 'Matemàtiques', blocs: ['ESO_1-3', 'ESO_4'],
      ces: [{ id: 'eso.mat.CE1', codi: 'CE1', text: 'CE1 ESO.' }, { id: 'eso.mat.CE2', codi: 'CE2', text: 'CE2 ESO.' }],
      criteris: [cr('eso.mat', 'ESO_1-3', 1, 1), cr('eso.mat', 'ESO_1-3', 1, 2), cr('eso.mat', 'ESO_1-3', 2, 1), cr('eso.mat', 'ESO_4', 1, 1)] },
    { id: 'eso.cat', etapa: 'ESO', nom: 'Llengua Catalana i Literatura', blocs: ['ESO_1-2', 'ESO_3-4'],
      ces: [{ id: 'eso.cat.CE1', codi: 'CE1', text: 'CE1 cat.' }],
      criteris: [cr('eso.cat', 'ESO_1-2', 1, 1), cr('eso.cat', 'ESO_3-4', 1, 1)] },
    { id: 'eso.mus', etapa: 'ESO', nom: 'Música', blocs: ['ESO_1-3'],
      ces: [{ id: 'eso.mus.CE1', codi: 'CE1', text: 'CE1 mus.' }],
      criteris: [cr('eso.mus', 'ESO_1-3', 1, 1)] },
    { id: 'pri.mat', etapa: 'Primària', nom: 'Matemàtiques', blocs: ['PRI_C3'],
      ces: [{ id: 'pri.mat.CE1', codi: 'CE1', text: 'CE1 pri.' }],
      criteris: [cr('pri.mat', 'PRI_C3', 1, 1), cr('pri.mat', 'PRI_C3', 1, 2)] },
  ],
};
const MAPA = { 'eso.mat': 'pri.mat', 'eso.fiq': 'pri.medi' };
const SIMPL = { 'eso.mat.ESO_1-3.1.1': { text: 'Simple 1.1.', estat: 'pendent' } };
const ids = marcats => marcats.map(x => x.criteri.id);

test('blocPerCurs segons els blocs de la matèria', () => {
  assert.equal(blocPerCurs(C, 'eso.mat', 3), 'ESO_1-3');
  assert.equal(blocPerCurs(C, 'eso.mat', 4), 'ESO_4');
  assert.equal(blocPerCurs(C, 'eso.cat', 3), 'ESO_3-4');
  assert.equal(blocPerCurs(C, 'eso.cat', 2), 'ESO_1-2');
});

test('blocPerCurs sense bloc del curs agafa l\'últim de la matèria', () => {
  assert.equal(blocPerCurs(C, 'eso.mus', 4), 'ESO_1-3');
});

test('areaPrimaria', () => {
  assert.equal(areaPrimaria(MAPA, 'eso.fiq'), 'pri.medi');
  assert.equal(areaPrimaria(MAPA, 'eso.xxx'), null);
});

test('novaSeleccio marca tot el bloc del curs i res més', () => {
  const s = novaSeleccio(C, 'eso.mat', 3);
  assert.deepEqual(s.blocs, [{ materiaId: 'eso.mat', bloc: 'ESO_1-3' }]);
  assert.deepEqual(ids(criterisMarcats(s, C, {})), ['eso.mat.ESO_1-3.1.1', 'eso.mat.ESO_1-3.1.2', 'eso.mat.ESO_1-3.2.1']);
});

test('afegeixBloc és idempotent i marca tot el bloc', () => {
  let s = novaSeleccio(C, 'eso.mat', 3);
  s = afegeixBloc(s, C, 'pri.mat', 'PRI_C3');
  s = afegeixBloc(s, C, 'pri.mat', 'PRI_C3');
  assert.equal(s.blocs.length, 2);
  assert.equal(criterisMarcats(s, C, {}).filter(x => x.materia.id === 'pri.mat').length, 2);
});

test('afegeixBloc no torna a marcar criteris desmarcats', () => {
  let s = afegeixBloc(novaSeleccio(C, 'eso.mat', 3), C, 'pri.mat', 'PRI_C3');
  s = commuta(s, 'pri.mat.PRI_C3.1.1');
  s = afegeixBloc(s, C, 'pri.mat', 'PRI_C3');
  assert.ok(!ids(criterisMarcats(s, C, {})).includes('pri.mat.PRI_C3.1.1'));
});

test('treuBloc treu els seus criteris', () => {
  let s = afegeixBloc(novaSeleccio(C, 'eso.mat', 3), C, 'pri.mat', 'PRI_C3');
  s = treuBloc(s, 'pri.mat', 'PRI_C3');
  assert.equal(s.blocs.length, 1);
  assert.ok(ids(criterisMarcats(s, C, {})).every(id => id.startsWith('eso.mat')));
});

test('commuta desmarca i torna a marcar', () => {
  let s = commuta(novaSeleccio(C, 'eso.mat', 3), 'eso.mat.ESO_1-3.1.2');
  assert.ok(!ids(criterisMarcats(s, C, {})).includes('eso.mat.ESO_1-3.1.2'));
  s = commuta(s, 'eso.mat.ESO_1-3.1.2');
  assert.ok(ids(criterisMarcats(s, C, {})).includes('eso.mat.ESO_1-3.1.2'));
});

test('marcaBloc desmarca tot un bloc', () => {
  const s = marcaBloc(novaSeleccio(C, 'eso.mat', 3), 'eso.mat', 'ESO_1-3', false);
  assert.deepEqual(criterisMarcats(s, C, {}), []);
});

test('les funcions no modifiquen la selecció original', () => {
  const s = novaSeleccio(C, 'eso.mat', 3);
  const copia = JSON.stringify(s);
  commuta(s, 'eso.mat.ESO_1-3.1.1');
  posaVersioTots(s, 'simplificada');
  assert.equal(JSON.stringify(s), copia);
});

test('versió simplificada fa servir el text simplificat', () => {
  const s = posaVersio(novaSeleccio(C, 'eso.mat', 3), 'eso.mat.ESO_1-3.1.1', 'simplificada');
  assert.equal(criterisMarcats(s, C, SIMPL)[0].text, 'Simple 1.1.');
});

test('versió simplificada sense entrada fa servir l\'oficial', () => {
  const s = posaVersioTots(novaSeleccio(C, 'eso.mat', 3), 'simplificada');
  const m = criterisMarcats(s, C, SIMPL);
  assert.equal(m[0].text, 'Simple 1.1.');
  assert.equal(m[1].text, 'Oficial eso.mat ESO_1-3 1.2.');
});

test('text lliure buit fa servir l\'oficial', () => {
  const s = posaVersio(novaSeleccio(C, 'eso.mat', 3), 'eso.mat.ESO_1-3.1.1', 'lliure', '   ');
  assert.equal(criterisMarcats(s, C, SIMPL)[0].text, 'Oficial eso.mat ESO_1-3 1.1.');
});

test('text lliure', () => {
  const s = posaVersio(novaSeleccio(C, 'eso.mat', 3), 'eso.mat.ESO_1-3.1.1', 'lliure', ' El meu text. ');
  assert.equal(criterisMarcats(s, C, SIMPL)[0].text, 'El meu text.');
});

test('posaVersioTots no esborra els textos lliures', () => {
  let s = posaVersio(novaSeleccio(C, 'eso.mat', 3), 'eso.mat.ESO_1-3.1.1', 'lliure', 'El meu text.');
  s = posaVersioTots(s, 'oficial');
  assert.equal(criterisMarcats(s, C, SIMPL)[0].text, 'El meu text.');
});

test('ordre: ESO abans que primària encara que primària s\'afegeixi primer', () => {
  let s = novaSeleccio(C, 'eso.mat', 4);
  s = treuBloc(afegeixBloc(s, C, 'pri.mat', 'PRI_C3'), 'eso.mat', 'ESO_4');
  s = afegeixBloc(s, C, 'eso.mat', 'ESO_1-3');
  const m = ids(criterisMarcats(s, C, {}));
  assert.equal(m[0], 'eso.mat.ESO_1-3.1.1');
  assert.equal(m.at(-1), 'pri.mat.PRI_C3.1.2');
});
