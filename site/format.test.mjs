import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textCE, textCriteris, textEtapa } from './format.js';

const BLOCS = {
  'ESO_1-3': 'ESO (1r, 2n i 3r)', 'ESO_4': 'ESO (4t)',
  'PRI_C1': 'Primària, cicle inicial (1r i 2n)', 'PRI_C3': 'Primària, cicle superior (5è i 6è)',
};
const esoMat = { id: 'eso.mat', etapa: 'ESO', nom: 'Matemàtiques',
  ces: [{ id: 'eso.mat.CE1', codi: 'CE1', text: 'Interpretar ESO.' }, { id: 'eso.mat.CE2', codi: 'CE2', text: 'Argumentar ESO.' }] };
const priMat = { id: 'pri.mat', etapa: 'Primària', nom: 'Matemàtiques',
  ces: [{ id: 'pri.mat.CE1', codi: 'CE1', text: 'Traduir primària.' }] };
const priMedi = { id: 'pri.medi', etapa: 'Primària', nom: 'Coneixement del Medi Natural, Social i Cultural',
  ces: [{ id: 'pri.medi.CE1', codi: 'CE1', text: 'Seleccionar medi.' }] };
const C = { blocs: BLOCS, materies: [esoMat, priMat, priMedi] };

const marcat = (materia, bloc, ce, n, text) => ({
  criteri: { id: `${materia.id}.${bloc}.${ce}.${n}`, ce: `${materia.id}.CE${ce}`, codi: `CE${ce}.${n}`, bloc, text: 'oficial' },
  materia, text,
});

test('textCE: una sola línia per CE encara que hi hagi diversos criteris', () => {
  const m = [marcat(esoMat, 'ESO_1-3', 1, 1, 'a.'), marcat(esoMat, 'ESO_1-3', 1, 2, 'b.')];
  assert.equal(textCE(m, C), 'CE1. Interpretar ESO.');
});

test('textCE: ordre del currículum', () => {
  const m = [marcat(esoMat, 'ESO_1-3', 2, 1, 'a.'), marcat(esoMat, 'ESO_1-3', 1, 1, 'b.')];
  assert.equal(textCE(m, C), 'CE1. Interpretar ESO.\nCE2. Argumentar ESO.');
});

test('textCriteris d\'un sol bloc, sense encapçalament', () => {
  const m = [marcat(esoMat, 'ESO_1-3', 1, 1, 'Primer.'), marcat(esoMat, 'ESO_1-3', 1, 2, 'Segon.')];
  assert.equal(textCriteris(m, C), 'CE1.1 Primer.\nCE1.2 Segon.');
});

test('barreja ESO + primària: encapçalaments a CE i criteris', () => {
  const m = [marcat(esoMat, 'ESO_1-3', 1, 1, 'Eso.'), marcat(priMat, 'PRI_C3', 1, 1, 'Pri.')];
  const ce = textCE(m, C);
  assert.ok(ce.includes('ESO\nCE1. Interpretar ESO.'), ce);
  assert.ok(ce.includes('Primària\nCE1. Traduir primària.'), ce);
  const crit = textCriteris(m, C);
  assert.ok(crit.includes('ESO (1r, 2n i 3r)\nCE1.1 Eso.'), crit);
  assert.ok(crit.includes('Primària, cicle superior (5è i 6è)\nCE1.1 Pri.'), crit);
});

test('àrea de primària amb nom diferent: el nom surt a l\'encapçalament', () => {
  const m = [marcat(esoMat, 'ESO_1-3', 1, 1, 'Eso.'), marcat(priMedi, 'PRI_C3', 1, 1, 'Medi.')];
  assert.ok(textCE(m, C).includes('Primària (Coneixement del Medi Natural, Social i Cultural)\nCE1. Seleccionar medi.'));
  assert.ok(textCriteris(m, C).includes('Primària, cicle superior (5è i 6è) · Coneixement del Medi Natural, Social i Cultural\nCE1.1 Medi.'));
});

test('dos blocs d\'ESO: encapçalament als criteris però no a les CE', () => {
  const m = [marcat(esoMat, 'ESO_1-3', 1, 1, 'Tres.'), marcat(esoMat, 'ESO_4', 1, 1, 'Quatre.')];
  assert.equal(textCE(m, C), 'CE1. Interpretar ESO.');
  assert.equal(textCriteris(m, C), 'ESO (1r, 2n i 3r)\nCE1.1 Tres.\n\nESO (4t)\nCE1.1 Quatre.');
});

test('textEtapa amb dos i tres blocs', () => {
  const dos = [marcat(esoMat, 'ESO_1-3', 1, 1, 'a.'), marcat(priMat, 'PRI_C3', 1, 1, 'b.')];
  assert.equal(textEtapa(dos, C), 'ESO (1r, 2n i 3r) i Primària, cicle superior (5è i 6è)');
  const tres = [...dos.slice(0, 1), marcat(esoMat, 'ESO_4', 1, 1, 'c.'), dos[1]];
  assert.equal(textEtapa(tres, C), 'ESO (1r, 2n i 3r), ESO (4t) i Primària, cicle superior (5è i 6è)');
});

test('textEtapa d\'un sol bloc', () => {
  assert.equal(textEtapa([marcat(esoMat, 'ESO_4', 1, 1, 'a.')], C), 'ESO (4t)');
});

test('criteri simplificat conserva el codi', () => {
  assert.equal(textCriteris([marcat(esoMat, 'ESO_1-3', 1, 1, 'Text simplificat.')], C), 'CE1.1 Text simplificat.');
});

test('res marcat: cadenes buides', () => {
  assert.equal(textCE([], C), '');
  assert.equal(textCriteris([], C), '');
  assert.equal(textEtapa([], C), '');
});
