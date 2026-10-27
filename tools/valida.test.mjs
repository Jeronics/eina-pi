import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validaCurriculum, validaSimplificades, validaMapatge } from './valida.mjs';

const BLOCS = {
  'ESO_1-2': 'ESO (1r i 2n)', 'ESO_3-4': 'ESO (3r i 4t)', 'ESO_1-4': 'ESO (1r, 2n, 3r o 4t)',
  'ESO_1-3': 'ESO (1r, 2n i 3r)', 'ESO_4': 'ESO (4t)',
  'PRI_C1': 'Primària, cicle inicial (1r i 2n)', 'PRI_C2': 'Primària, cicle mitjà (3r i 4t)',
  'PRI_C3': 'Primària, cicle superior (5è i 6è)',
};

function crit(m, bloc, n, text = 'Interpretar problemes matemàtics.') {
  return { id: `${m}.${bloc}.1.${n}`, ce: `${m}.CE1`, codi: `CE1.${n}`, bloc, text };
}

function curriculum() {
  return {
    blocs: BLOCS,
    materies: [
      { id: 'eso.mat', etapa: 'ESO', nom: 'Matemàtiques', blocs: ['ESO_1-3', 'ESO_4'],
        ces: [{ id: 'eso.mat.CE1', codi: 'CE1', text: 'Interpretar situacions.' }],
        criteris: [crit('eso.mat', 'ESO_1-3', 1), crit('eso.mat', 'ESO_4', 1)] },
      { id: 'pri.mat', etapa: 'Primària', nom: 'Matemàtiques', blocs: ['PRI_C1', 'PRI_C2', 'PRI_C3'],
        ces: [{ id: 'pri.mat.CE1', codi: 'CE1', text: 'Traduir problemes.' }],
        criteris: ['PRI_C1', 'PRI_C2', 'PRI_C3'].map(b => crit('pri.mat', b, 1)) },
    ],
  };
}

test('curriculum correcte no dona errors', () => {
  assert.deepEqual(validaCurriculum(curriculum()), []);
});

test('criteri amb ce inexistent', () => {
  const c = curriculum();
  c.materies[0].criteris[0].ce = 'eso.mat.CE9';
  const e = validaCurriculum(c);
  assert.ok(e.some(x => x.includes('eso.mat.ESO_1-3.1.1')), e.join('\n'));
});

test('criteri amb bloc desconegut', () => {
  const c = curriculum();
  c.materies[0].criteris[0].bloc = 'ESO_2';
  assert.ok(validaCurriculum(c).some(x => x.includes('bloc')));
});

for (const brossa of ['ISSN 1988-298X', 'CVE-DOGC-A-22270097-2022', 'Núm. 8762', 'Diari Oficial de la Generalitat', 'https://www.gencat.cat/dogc']) {
  test(`brossa de pàgina: ${brossa}`, () => {
    const c = curriculum();
    c.materies[0].criteris[0].text = `Interpretar problemes ${brossa} matemàtics.`;
    assert.ok(validaCurriculum(c).some(x => x.includes('brossa de pàgina')));
  });
}

for (const mutilat of ['Educació Plàstica, isual i Audio isual', 'Coneixement del Medi atural', 'educació secundària obligat ria', 'les rees de primària']) {
  test(`lletra perduda: ${mutilat}`, () => {
    const c = curriculum();
    c.materies[0].ces[0].text = mutilat;
    assert.ok(validaCurriculum(c).some(x => x.includes('lletra perduda')));
  });
}

test('lletra perduda també al nom de la matèria', () => {
  const c = curriculum();
  c.materies[0].nom = 'Educació Plàstica, isual i Audio isual';
  assert.ok(validaCurriculum(c).some(x => x.includes('lletra perduda')));
});

for (const partit of ['Comprendre textos i compren-', 'Saber compren- dre textos.']) {
  test(`guió de partició: ${partit}`, () => {
    const c = curriculum();
    c.materies[0].criteris[0].text = partit;
    assert.ok(validaCurriculum(c).some(x => x.includes('partició')));
  });
}

test('criteri d\'un bloc que la matèria no declara', () => {
  const c = curriculum();
  c.materies[0].criteris[0].bloc = 'ESO_1-2';
  assert.ok(validaCurriculum(c).some(x => x.includes('eso.mat.ESO_1-3.1.1') && x.includes('ESO_1-2')));
});

test('matèria sense cap bloc', () => {
  const c = curriculum();
  c.materies[0].blocs = [];
  assert.ok(validaCurriculum(c).some(x => x.includes('eso.mat') && x.includes('cap bloc')));
});

test('matèria ESO sense bloc 4t', () => {
  const c = curriculum();
  c.materies[0].criteris = c.materies[0].criteris.filter(x => x.bloc !== 'ESO_4');
  assert.ok(validaCurriculum(c).some(x => x.includes('eso.mat') && x.includes('ESO_4')));
});

test('àrea de primària sense cicle superior', () => {
  const c = curriculum();
  c.materies[1].criteris = c.materies[1].criteris.filter(x => x.bloc !== 'PRI_C3');
  assert.ok(validaCurriculum(c).some(x => x.includes('pri.mat') && x.includes('PRI_C3')));
});

test('text buit', () => {
  const c = curriculum();
  c.materies[0].criteris[0].text = '  ';
  assert.ok(validaCurriculum(c).some(x => x.includes('buit')));
});

test('simplificades correctes', () => {
  const s = { 'eso.mat.ESO_1-3.1.1': { text: 'Entendre un problema.', estat: 'pendent' } };
  assert.deepEqual(validaSimplificades(s, curriculum()), []);
});

test('simplificada amb clau inexistent', () => {
  const s = { 'eso.mat.ESO_1-3.9.9': { text: 'Entendre.', estat: 'pendent' } };
  assert.ok(validaSimplificades(s, curriculum()).some(x => x.includes('eso.mat.ESO_1-3.9.9')));
});

test('simplificada amb estat desconegut', () => {
  const s = { 'eso.mat.ESO_1-3.1.1': { text: 'Entendre.', estat: 'feta' } };
  assert.ok(validaSimplificades(s, curriculum()).some(x => x.includes('estat')));
});

test('simplificada amb codi al text', () => {
  const s = { 'eso.mat.ESO_1-3.1.1': { text: 'CE1.1 Entendre.', estat: 'pendent' } };
  assert.ok(validaSimplificades(s, curriculum()).some(x => x.includes('sense codi')));
});

test('mapatge correcte', () => {
  assert.deepEqual(validaMapatge({ 'eso.mat': 'pri.mat' }, curriculum()), []);
});

test('mapatge cap a matèria inexistent', () => {
  assert.ok(validaMapatge({ 'eso.mat': 'pri.medi' }, curriculum()).some(x => x.includes('pri.medi')));
});

test('paraules correctes amb accent no són lletres perdudes', () => {
  const c = curriculum();
  c.materies[0].ces[0].text = 'Identificar les matemàtiques implicades en altres àrees, en l’àmbit audiovisual i natural.';
  assert.deepEqual(validaCurriculum(c), []);
});

test('CE sense cap criteri', () => {
  const c = curriculum();
  c.materies[0].ces.push({ id: 'eso.mat.CE2', codi: 'CE2', text: 'Argumentar solucions.' });
  assert.ok(validaCurriculum(c).some(x => x.includes('eso.mat.CE2') && x.includes('cap criteri')));
});

test('numeració de CE amb forats', () => {
  const c = curriculum();
  c.materies[0].ces[0] = { id: 'eso.mat.CE2', codi: 'CE2', text: 'Argumentar solucions.' };
  c.materies[0].criteris.forEach(cr => { cr.ce = 'eso.mat.CE2'; cr.codi = 'CE2.1'; });
  assert.ok(validaCurriculum(c).some(x => x.includes('eso.mat') && x.includes('CE1')));
});
