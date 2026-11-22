// Do código do puzzle às peças, na ordem de montagem — o mesmo caminho do puzzle-cube
// (puzzle.montarPuzzle), só com o que a página precisa: sem malhas, caixa nem caminhão.
// As peças não dependem das medidas do bloco; as letras (formatos), sim, quando o cubinho não é
// cúbico (só no modo cubo, com bloco achatado): aqui o cubinho é sempre cúbico.
(function () {
  'use strict';
  const req = (n) => (typeof require === 'function' ? require('./gerador/' + n + '.js') : globalThis.PC[n]);
  const g = req('grade'), particao = req('particao'), tipos = req('tipos'), codigo = req('codigo');

  const VERSAO_DO_GERADOR = 2;   // a do puzzle-cube (puzzle.js)
  const DIRECOES = { cima: [0, 0, 1], frente: [0, -1, 0], direita: [1, 0, 0], tras: [0, 1, 0], esquerda: [-1, 0, 0] };
  const NAO_EXISTE = 'Esse código não é de nenhum puzzle: confira as letras.';

  // Só lê o código (rápido, para confirmar enquanto a pessoa digita): { modo, dims, pecas } ou erro
  function ler(texto) {
    const d = codigo.decodificar(texto);
    if (d.versao !== VERSAO_DO_GERADOR % 4) throw new Error(NAO_EXISTE);
    const n = d.colunas * d.linhas * d.camadas;
    if (d.pecas > Math.floor(n / 3) || (d.maxCubos && d.maxCubos * d.pecas < n) || (d.minCubos && d.minCubos * d.pecas > n)
      || (d.minCubos && d.maxCubos && d.minCubos > d.maxCubos)) throw new Error(NAO_EXISTE);
    return { ...d, dims: [d.colunas, d.linhas, d.camadas] };
  }

  // As peças, na ordem em que entram: { modo, dims, pecas: [{ letra, tipo, celulas: [[x,y,z]], direcao, d, texto }] }
  function resolver(texto) {
    const d = ler(texto);
    const p = { ...d, largura: d.colunas, profundidade: d.linhas, altura: d.camadas };
    let r;
    try { r = particao.gerarPecas(p, d.semente); } catch (e) { throw new Error(NAO_EXISTE); }
    const t = tipos.identificarTipos(r.montagem.map((o) => r.coords[o.peca]), g.rotacoesQuePreservam([1, 1, 1]));
    const pecas = r.montagem.map((o, k) => ({
      letra: tipos.letra(t.tipoDe[k]), tipo: t.tipoDe[k], direcao: o.direcao, d: DIRECOES[o.direcao], texto: o.texto,
      celulas: r.celulas[o.peca].map((i) => g.coordenadas(i, d.dims)),
    }));
    return { modo: d.modo, dims: d.dims, pecas };
  }

  const api = { ler, resolver, VERSAO_DO_GERADOR, DIRECOES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  (globalThis.PC = globalThis.PC || {}).resolver = api;
})();
