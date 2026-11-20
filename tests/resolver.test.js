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
