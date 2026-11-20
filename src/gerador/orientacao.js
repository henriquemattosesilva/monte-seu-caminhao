// CÓPIA de puzzle-cube/src/orientacao.js (ferramentas/publicar_resolucao.js). Não editar aqui.
// Acha a rotação em que a peça imprime sem balanço: todo cubinho acima da mesa
// tem outro cubinho da MESMA peça logo abaixo dele.
(function () {
  'use strict';
  const g = typeof require === 'function' ? require('./grade.js') : globalThis.PC.grade;

  function temSuporte(coords) {
    const tem = new Set(coords.map((c) => c.join(',')));
    return coords.every((c) => c[2] === 0 || tem.has([c[0], c[1], c[2] - 1].join(',')));
  }

  // Entre as que têm suporte: a mais baixa (em mm, se o cubinho não for cúbico),
  // e no empate a com mais cubinhos na mesa.
  function orientacaoDeImpressao(coords, celula = [1, 1, 1]) {
    let melhor = null;
    g.ROTACOES.forEach((m, r) => {
      const rc = g.rotacionarCelulas(coords, m);
      if (!temSuporte(rc)) return;
      const altura = (Math.max(...rc.map((c) => c[2])) + 1) * celula[g.eixoDeOrigem(m, 2)];
      const base = rc.filter((c) => c[2] === 0).length;
      if (!melhor || altura < melhor.altura - 1e-9
        || (Math.abs(altura - melhor.altura) < 1e-9 && base > melhor.base)) {
        melhor = { rotacao: r, altura, base };
      }
    });
    return melhor ? melhor.rotacao : null;
  }

  const api = { temSuporte, orientacaoDeImpressao };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  (globalThis.PC = globalThis.PC || {}).orientacao = api;
})();
