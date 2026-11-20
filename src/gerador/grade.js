// CÓPIA de puzzle-cube/src/grade.js (ferramentas/publicar_resolucao.js). Não editar aqui.
// A grade de cubinhos: índices, vizinhos e as 24 rotações do cubo.
(function () {
  'use strict';

  function det(m) {
    return m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
      - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
      + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  }

  // m[j][p[j]] = ±1: o eixo novo j recebe o eixo antigo p[j]. Só as de determinante +1
  // (rotação de verdade; espelho não é um movimento que se faça com a peça na mão).
  const ROTACOES = (() => {
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    const out = [];
    for (const p of perms) {
      for (let s = 0; s < 8; s++) {
        const sinais = [s & 1 ? -1 : 1, s & 2 ? -1 : 1, s & 4 ? -1 : 1];
        const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        for (let j = 0; j < 3; j++) m[j][p[j]] = sinais[j];
        if (det(m) === 1) out.push(m);
      }
    }
    return out;
  })();

  function eixoDeOrigem(m, j) {
    return m[j][0] !== 0 ? 0 : m[j][1] !== 0 ? 1 : 2;
  }

  function aplicar(m, v) {
    return [
      m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
      m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
      m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
    ];
  }

  function indice(c, dims) {
    return c[0] + dims[0] * (c[1] + dims[1] * c[2]);
  }

  function coordenadas(i, dims) {
    const x = i % dims[0];
    const y = Math.floor(i / dims[0]) % dims[1];
    const z = Math.floor(i / (dims[0] * dims[1]));
    return [x, y, z];
  }

  function dentro(c, dims) {
    return c[0] >= 0 && c[1] >= 0 && c[2] >= 0 && c[0] < dims[0] && c[1] < dims[1] && c[2] < dims[2];
  }

  const PASSOS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

  function vizinhos(i, dims) {
    const c = coordenadas(i, dims);
    const out = [];
    for (const d of PASSOS) {
      const n = [c[0] + d[0], c[1] + d[1], c[2] + d[2]];
      if (dentro(n, dims)) out.push(indice(n, dims));
    }
    return out;
  }

  function normalizar(coords) {
    const min = [0, 1, 2].map((e) => Math.min(...coords.map((c) => c[e])));
    return coords.map((c) => [c[0] - min[0], c[1] - min[1], c[2] - min[2]]);
  }

  function rotacionarCelulas(coords, m) {
    return normalizar(coords.map((c) => aplicar(m, c)));
  }

  function chaveDeForma(coords) {
    return coords.map((c) => c.join(',')).sort().join(';');
  }

  const IGUAL = (a, b) => Math.abs(a - b) < 1e-9;

  // As rotações que levam cada eixo num eixo de mesmo valor (ex.: mesmo tamanho de cubinho).
  function rotacoesQuePreservam(...listas) {
    return ROTACOES.filter((m) => [0, 1, 2].every((j) => {
      const i = eixoDeOrigem(m, j);
      return listas.every((l) => IGUAL(l[i], l[j]));
    }));
  }

  const rotacoesDaCaixa = (dims, celula) => rotacoesQuePreservam(dims, celula);

  const api = {
    ROTACOES, PASSOS, aplicar, eixoDeOrigem, indice, coordenadas, dentro, vizinhos,
    normalizar, rotacionarCelulas, chaveDeForma, rotacoesQuePreservam, rotacoesDaCaixa,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  (globalThis.PC = globalThis.PC || {}).grade = api;
})();
