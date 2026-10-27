"""Proves sobre el currículum extret (site/dades/curriculum.json)."""
import json
import pathlib
import subprocess
import unittest

ARREL = pathlib.Path(__file__).resolve().parent.parent
DADES = ARREL / 'site' / 'dades' / 'curriculum.json'


def carrega():
    return json.loads(DADES.read_text(encoding='utf-8'))


class TestCurriculum(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.c = carrega()
        cls.m = {m['id']: m for m in cls.c['materies']}

    def criteri(self, materia, bloc, codi):
        trobats = [cr for cr in self.m[materia]['criteris'] if cr['bloc'] == bloc and cr['codi'] == codi]
        self.assertEqual(len(trobats), 1, f'{materia} {bloc} {codi}: {len(trobats)} coincidències')
        return trobats[0]['text']

    def ce(self, materia, codi):
        return next(ce['text'] for ce in self.m[materia]['ces'] if ce['codi'] == codi)

    def test_materies(self):
        eso = {'eso.cat', 'eso.cas', 'eso.est', 'eso.mat', 'eso.bio', 'eso.fiq', 'eso.cs', 'eso.ef',
               'eso.epva', 'eso.mus', 'eso.tec', 'eso.val'}
        pri = {'pri.cat', 'pri.cas', 'pri.est', 'pri.mat', 'pri.medi', 'pri.art', 'pri.ef', 'pri.val'}
        self.assertEqual(set(self.m), eso | pri)

    def test_noms_sense_lletres_perdudes(self):
        noms = {m['nom'] for m in self.c['materies']}
        self.assertIn('Educació Plàstica, Visual i Audiovisual', noms)
        self.assertIn('Coneixement del Medi Natural, Social i Cultural', noms)

    def test_matematiques_eso(self):
        self.assertEqual(
            self.criteri('eso.mat', 'ESO_1-3', 'CE1.1'),
            'Interpretar problemes matemàtics organitzant-ne la informació donada i comprenent les preguntes formulades.')
        self.criteri('eso.mat', 'ESO_1-3', 'CE1.3')

    def test_matematiques_primaria(self):
        self.assertTrue(self.criteri('pri.mat', 'PRI_C3', 'CE1.1').startswith(
            'Interpretar i reformular de forma verbal i gràfica, problemes i situacions de la vida quotidiana'))
        self.assertFalse(any(cr['codi'] == 'CE1.3' and cr['bloc'] == 'PRI_C3' for cr in self.m['pri.mat']['criteris']))

    def test_castella_eso(self):
        self.assertEqual(
            self.criteri('eso.cas', 'ESO_3-4', 'CE4.1'),
            'Comprendre i interpretar el sentit global, l’estructura, la informació més rellevant i la intenció '
            'de l’emissor de textos escrits i multimodals de certa complexitat, que responguin a diferents '
            'propòsits de lectura, realitzant-ne les inferències necessàries.')

    def test_biologia_ce1(self):
        self.assertTrue(self.ce('eso.bio', 'CE1').startswith(
            'Interpretar fenòmens de la naturalesa, predient i argumentant el seu comportament'))

    def test_fisica_ce3_reparada(self):
        self.assertTrue(self.ce('eso.fiq', 'CE3').startswith(
            'Generar, interpretar i validar dades i informació en diferents formats i fonts'))

    def test_nombre_de_ce(self):
        # Xifres que dona el mateix decret a la introducció de cada àrea o matèria.
        esperat = {'pri.cat': 10, 'pri.cas': 10, 'pri.est': 10, 'pri.medi': 10, 'pri.art': 4, 'pri.val': 4,
                   'pri.ef': 5, 'pri.mat': 8, 'eso.cat': 10, 'eso.cas': 10, 'eso.est': 10, 'eso.bio': 6,
                   'eso.cs': 9, 'eso.val': 4, 'eso.ef': 5, 'eso.epva': 6, 'eso.fiq': 6, 'eso.mat': 9,
                   'eso.mus': 4, 'eso.tec': 7}
        for materia, n in esperat.items():
            self.assertEqual(len(self.m[materia]['ces']), n, materia)

    def test_blocs_esperats(self):
        self.assertEqual(self.m['eso.mat']['blocs'], ['ESO_1-3', 'ESO_4'])
        self.assertEqual(self.m['eso.cat']['blocs'], ['ESO_1-2', 'ESO_3-4'])
        self.assertEqual(self.m['eso.val']['blocs'], ['ESO_1-4'])
        self.assertEqual(self.m['eso.epva']['blocs'], ['ESO_1-3'])
        self.assertEqual(self.m['pri.medi']['blocs'], ['PRI_C1', 'PRI_C2', 'PRI_C3'])

    def test_cada_criteri_pertany_a_la_seva_ce(self):
        for m in self.c['materies']:
            for cr in m['criteris']:
                num_ce = cr['ce'].split('.CE')[1]
                self.assertTrue(cr['codi'].startswith(f'CE{num_ce}.'), cr['id'])

    def test_textos_sense_codi_al_davant(self):
        for m in self.c['materies']:
            for cr in m['criteris']:
                self.assertNotRegex(cr['text'], r'^\d', cr['id'])

    def test_validador(self):
        r = subprocess.run(['node', 'tools/valida.mjs'], cwd=ARREL, capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout[-3000:])


if __name__ == '__main__':
    unittest.main()
