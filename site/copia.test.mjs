import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copia } from './copia.js';

function entorn({ falla = false } = {}) {
  const escrit = [];
  return {
    escrit,
    navigator: { clipboard: { writeText: async t => { if (falla) throw new Error('denegat'); escrit.push(t); } } },
    document: null,
  };
}

test('text buit no toca el porta-retalls', async () => {
  const e = entorn();
  assert.equal(await copia('', e), 'buit');
  assert.equal(await copia('   ', e), 'buit');
  assert.deepEqual(e.escrit, []);
});

test('copia amb l\'API del porta-retalls', async () => {
  const e = entorn();
  assert.equal(await copia('CE1. Text', e), 'ok');
  assert.deepEqual(e.escrit, ['CE1. Text']);
});

test('API denegada i sense document: error', async () => {
  assert.equal(await copia('CE1. Text', entorn({ falla: true })), 'error');
});
