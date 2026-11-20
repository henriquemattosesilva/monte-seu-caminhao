// CÓPIA de puzzle-cube/src/aleatorio.js (ferramentas/publicar_resolucao.js). Não editar aqui.
// Gerador pseudoaleatório com semente (mulberry32). A mesma semente refaz o mesmo puzzle,
// por isso o projeto salvo guarda só a semente e os parâmetros.
(function () {
  'use strict';

  function criarAleatorio(semente) {
    let a = (semente >>> 0) || 0x9e3779b9;
    function proximo() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    return {
      proximo,
      inteiro: (n) => Math.floor(proximo() * n),
      escolher: (lista) => lista[Math.floor(proximo() * lista.length)],
      embaralhar(lista) {
        for (let i = lista.length - 1; i > 0; i--) {
          const j = Math.floor(proximo() * (i + 1));
          [lista[i], lista[j]] = [lista[j], lista[i]];
        }
        return lista;
      },
    };
  }

  // de 0 a 5999: o código do puzzle (codigo.js) fica em até 6 caracteres (19/11/2026). As sementes
  // de antes (até 2^32) continuam valendo; só dão um código mais longo.
  const SEMENTES = 6000;
  function novaSemente() {
    return Math.floor(Math.random() * SEMENTES);
  }

  const api = { criarAleatorio, novaSemente };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  (globalThis.PC = globalThis.PC || {}).aleatorio = api;
})();
