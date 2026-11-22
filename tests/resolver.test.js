const test = require('node:test');
const assert = require('node:assert');
const { ler, resolver } = require('../src/resolver.js');
const esperado = require('./esperado.json');

// esperado.json vem do puzzle-cube (ferramentas/publicar_resolucao.js): as peças feitas lá
test('a página refaz exatamente as peças do puzzle-cube (peças, letras, formatos e ordem)', () => {
  for (const e of esperado) {
    const r = resolver(e.codigo);
    assert.deepStrictEqual(r.dims, e.dims, e.codigo);
    assert.deepStrictEqual(r.pecas.map((p) => ({ letra: p.letra, tipo: p.tipo, direcao: p.direcao, celulas: p.celulas })), e.pecas, e.codigo);
  }
});

test('o brinde: 3629G é o caminhão 6x3x3 com 7 peças', () => {
  const d = ler('3629g');
  assert.deepStrictEqual([d.modo, d.dims, d.pecas, d.semente], ['caminhao', [6, 3, 3], 7, 7]);
});

test('código que não é de puzzle nenhum: mensagem para a pessoa', () => {
  assert.throws(() => ler(''), /Digite o código/);
  assert.throws(() => ler('3629O'), /não tem "O"/);
  assert.throws(() => resolver('2'), /não é de nenhum puzzle/);
  assert.throws(() => resolver('ZZZZZZ'), /não é de nenhum puzzle/);
});

const S = require('../src/solucoes.js');
const g = require('../src/gerador/grade.js');
// a peça enche o bloco sem sobrar nem sobrepor, e cada uma, na ordem, entra em linha reta
function confere(s, dims) {
  const N = dims[0] * dims[1] * dims[2], ocup = new Set();
  for (const p of s.pecas) {
    for (const c of p.celulas) {
      // entra pela direção dela sem atravessar o que já está no lugar
      for (let q = c.map((v, e) => v + p.d[e]); g.dentro(q, dims); q = q.map((v, e) => v + p.d[e]))
        assert.ok(!ocup.has(g.indice(q, dims)), 'entra em linha reta');
    }
    for (const c of p.celulas) { const k = g.indice(c, dims); assert.ok(!ocup.has(k), 'sem sobrepor'); ocup.add(k); }
  }
  assert.strictEqual(ocup.size, N, 'enche o bloco');
}

test('P10: outras soluções do caminhão (49PW9G tem 3, 3629G só a de sempre), todas montáveis e com as mesmas peças', () => {
  const tipos = (s) => s.pecas.map((p) => p.letra + p.tipo + ':' + p.celulas.length).sort().join(' ');
  for (const [cod, outras] of [['49PW9G', 2], ['3629G', 0], ['3SA9G', 18]]) {
    const s = resolver(cod), r = S.todas(s);
    assert.ok(r.completo, cod);
    assert.strictEqual(r.outras.length, outras, cod);
    for (const o of r.outras) { confere(o, s.dims); assert.strictEqual(tipos(o), tipos(s), 'as mesmas peças'); }
  }
});

test('P10: a mesma solução virada no bloco não conta como outra; o cubo para no limite', () => {
  const s = resolver('49PW9G'), r = S.todas(s);
  const vira = (x) => ({ ...x, pecas: x.pecas.map((p) => ({ ...p, celulas: p.celulas.map(([a, b, c]) => [5 - a, 2 - b, c]) })) });
  const chave = (x) => x.pecas.map((p) => p.celulas.map((c) => c.join(',') + '=' + p.tipo)).flat().sort().join(';');
  const vistas = new Set([s, ...r.outras].map(chave));
  for (const x of [s, ...r.outras]) {
    const v = chave(vira(x));
    if (v !== chave(x)) assert.ok(!vistas.has(v) || false, 'uma virada (180° em pé) não aparece de novo');
  }
  const c = S.todas(resolver('7N8L'), { limite: 50 });
  assert.strictEqual(c.outras.length, 50);
  assert.strictEqual(c.completo, false);
});
