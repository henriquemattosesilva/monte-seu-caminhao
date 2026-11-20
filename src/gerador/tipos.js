// CÓPIA de puzzle-cube/src/tipos.js (ferramentas/publicar_resolucao.js). Não editar aqui.
// Agrupa as peças por formato (iguais a menos de rotação permitida) e dá as letras.
(function () {
  'use strict';
  const g = typeof require === 'function' ? require('./grade.js') : globalThis.PC.grade;

  function formaCanonica(coords, rotacoes) {
    let melhor = null;
    for (const m of rotacoes) {
      const chave = g.chaveDeForma(g.rotacionarCelulas(coords, m));
      if (melhor === null || chave < melhor) melhor = chave;
    }
    return melhor;
  }

  // tipos numerados pela ordem em que aparecem na lista
  function identificarTipos(listaDeCoords, rotacoes) {
    const ids = new Map();
    const tipoDe = [], quantidade = [];
    for (const coords of listaDeCoords) {
      const chave = formaCanonica(coords, rotacoes);
      if (!ids.has(chave)) { ids.set(chave, quantidade.length); quantidade.push(0); }
      const t = ids.get(chave);
      tipoDe.push(t);
      quantidade[t]++;
    }
    return { tipoDe, quantidade };
  }

  function letra(i) {
    const A = 'A'.charCodeAt(0);
    return i < 26 ? String.fromCharCode(A + i) : letra(Math.floor(i / 26) - 1) + String.fromCharCode(A + (i % 26));
  }

  const api = { identificarTipos, letra, formaCanonica };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  (globalThis.PC = globalThis.PC || {}).tipos = api;
})();
