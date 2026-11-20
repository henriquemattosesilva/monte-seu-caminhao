// CÓPIA de puzzle-cube/src/particao.js (ferramentas/publicar_resolucao.js). Não editar aqui.
// Divide a grade em N peças conectadas pela face, crescendo N sementes ao acaso.
(function () {
  'use strict';
  const req = (n) => (typeof require === 'function' ? require('./' + n + '.js') : globalThis.PC[n]);
  const g = req('grade');
  const { criarAleatorio } = req('aleatorio');
  const { orientacaoDeImpressao } = req('orientacao');
  const { ordemDeMontagem } = req('montagem');

  const LIMITE_DE_TENTATIVAS = 400;

  function ehReta(coords) {
    let variam = 0;
    for (let e = 0; e < 3; e++) if (new Set(coords.map((c) => c[e])).size > 1) variam++;
    return variam <= 1;
  }

  function particionar(p, rng) {
    const dims = [p.colunas, p.linhas, p.camadas];
    const n = dims[0] * dims[1] * dims[2];
    const N = p.pecas;
    const max = p.maxCubos > 0 ? p.maxCubos : Infinity;
    const dono = new Int32Array(n).fill(-1);
    const ordem = rng.embaralhar([...Array(n).keys()]);
    const regioes = [];
    for (let k = 0; k < N; k++) { dono[ordem[k]] = k; regioes.push([ordem[k]]); }
    let livres = n - N;
    while (livres > 0) {
      const cands = [];
      for (let r = 0; r < N; r++) {
        if (regioes[r].length >= max) continue;
        const fronteira = new Set();
        for (const c of regioes[r]) for (const v of g.vizinhos(c, dims)) if (dono[v] === -1) fronteira.add(v);
        if (fronteira.size) cands.push({ r, fronteira: [...fronteira] });
      }
      if (!cands.length) return null;
      let escolhido;
      if (rng.proximo() < 0.75) {
        // quase sempre cresce a menor: peças de tamanho parecido
        const menor = Math.min(...cands.map((c) => regioes[c.r].length));
        escolhido = rng.escolher(cands.filter((c) => regioes[c.r].length === menor));
      } else {
        escolhido = rng.escolher(cands);
      }
      const cel = rng.escolher(escolhido.fronteira);
      dono[cel] = escolhido.r;
      regioes[escolhido.r].push(cel);
      livres--;
    }
    return { dono, regioes };
  }

  function gerarPecas(p, semente) {
    const rng = criarAleatorio(semente);
    const dims = [p.colunas, p.linhas, p.camadas];
    const celula = [p.largura / dims[0], p.profundidade / dims[1], p.altura / dims[2]]
      .map((x) => (Number.isFinite(x) ? x : 1));
    const min = Math.max(3, p.minCubos || 0);
    for (let t = 1; t <= LIMITE_DE_TENTATIVAS; t++) {
      const r = particionar(p, rng);
      if (!r) continue;
      const coords = r.regioes.map((reg) => reg.map((i) => g.coordenadas(i, dims)));
      if (coords.some((c) => c.length < min)) continue;
      if (coords.some(ehReta)) continue;
      const orientacoes = coords.map((c) => orientacaoDeImpressao(c, celula));
      if (orientacoes.some((o) => o === null)) continue;
      const celulas = r.regioes.map((reg) => [...reg].sort((a, b) => a - b));
      // puzzle que não se monta em linha reta não serve: descarta a divisão
      const montagem = ordemDeMontagem(dims, celulas);
      if (!montagem) continue;
      return { dono: r.dono, celulas, coords, orientacoes, montagem, tentativas: t };
    }
    throw new Error('Não encontrei uma divisão válida com esses parâmetros em '
      + LIMITE_DE_TENTATIVAS + ' tentativas. Tente menos peças, outro tamanho mínimo/máximo ou outra semente.');
  }

  const api = { gerarPecas, particionar, ehReta, LIMITE_DE_TENTATIVAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  (globalThis.PC = globalThis.PC || {}).particao = api;
})();
