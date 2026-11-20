// CÓPIA de puzzle-cube/src/montagem.js (ferramentas/publicar_resolucao.js). Não editar aqui.
// A ordem de montagem: a cada passo, uma peça apoiada (na mesa ou numa já colocada) que
// entra em linha reta sem atravessar nenhuma — de preferência por cima, a mais baixa primeiro.
// Busca com retrocesso: a escolha gulosa travava em 3% dos 3x3x3 (medido em 200 sementes);
// voltando atrás, nenhum trava. Sem ordem possível devolve null (o gerador descarta a divisão).
(function () {
  'use strict';
  const g = typeof require === 'function' ? require('./grade.js') : globalThis.PC.grade;

  // os nomes batem com o ângulo das imagens do manual (câmera na frente-direita)
  const DIRECOES = [
    { nome: 'cima', texto: 'entra por cima', d: [0, 0, 1] },
    { nome: 'frente', texto: 'entra pela frente', d: [0, -1, 0] },
    { nome: 'direita', texto: 'entra pela direita', d: [1, 0, 0] },
    { nome: 'tras', texto: 'entra por trás', d: [0, 1, 0] },
    { nome: 'esquerda', texto: 'entra pela esquerda', d: [-1, 0, 0] },
  ];

  const LIMITE_DE_NOS = 20000;

  function entra(coords, ocupado, dims, d) {
    for (const c0 of coords) {
      let c = c0;
      for (;;) {
        c = [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
        if (!g.dentro(c, dims)) break;
        if (ocupado.has(g.indice(c, dims))) return false;
      }
    }
    return true;
  }

  const apoiada = (coords, ocupado, dims) =>
    coords.some((c) => c[2] === 0 || ocupado.has(g.indice([c[0], c[1], c[2] - 1], dims)));

  function menor(a, b) {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
  }

  function ordemDeMontagem(dims, celulas) {
    const coords = celulas.map((cel) => cel.map((i) => g.coordenadas(i, dims)));
    const zs = coords.map((cs) => cs.map((c) => c[2]));
    const minZ = zs.map((z) => Math.min(...z));
    const mediaZ = zs.map((z) => z.reduce((s, x) => s + x, 0) / z.length);
    const ocupado = new Set();
    const usada = new Array(celulas.length).fill(false);
    const out = [];
    let nos = 0;

    function busca() {
      if (out.length === celulas.length) return true;
      if (++nos > LIMITE_DE_NOS) return false;
      const cands = [];
      for (let p = 0; p < celulas.length; p++) {
        if (usada[p] || !apoiada(coords[p], ocupado, dims)) continue;
        const dir = DIRECOES.findIndex((D) => entra(coords[p], ocupado, dims, D.d));
        if (dir >= 0) cands.push({ p, dir, chave: [dir === 0 ? 0 : 1, minZ[p], mediaZ[p], dir, p] });
      }
      cands.sort((a, b) => menor(a.chave, b.chave));
      for (const c of cands) {
        usada[c.p] = true;
        celulas[c.p].forEach((i) => ocupado.add(i));
        out.push({ peca: c.p, direcao: DIRECOES[c.dir].nome, texto: DIRECOES[c.dir].texto });
        if (busca()) return true;
        out.pop();
        celulas[c.p].forEach((i) => ocupado.delete(i));
        usada[c.p] = false;
      }
      return false;
    }

    return busca() ? out : null;
  }

  const api = { ordemDeMontagem, DIRECOES, LIMITE_DE_NOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  (globalThis.PC = globalThis.PC || {}).montagem = api;
})();
