// CÓPIA de puzzle-cube/src/codigo.js (ferramentas/publicar_resolucao.js). Não editar aqui.
// O código do puzzle (pedido do dono, 19/11/2026): a semente sozinha não define as peças — a mesma
// semente dá outro puzzle com outra grade, outro número de peças ou outro mínimo/máximo de cubinhos,
// e mudaria se o gerador mudasse. O código leva tudo isso junto, curto e fechado, para a pessoa
// digitar na página de resolução (sai no manual).
// Alfabeto de 32, sem 0/O nem 1/I (não se confundem ao digitar); aceita minúscula e espaço/hífen.
// Base mista, do menos para o mais significativo: versão, modo, colunas, linhas, camadas, peças,
// "tem mínimo/máximo" (e, se tiver, os dois) e, por último, a semente — sem limite, então sementes
// pequenas dão códigos curtos: 5 caracteres até a semente 202, 6 até 6060 (📐 conferido nos testes).
// As medidas do bloco ficam de fora: não mudam as peças (só o tamanho de cada cubinho).
(function () {
  'use strict';
  const ALFABETO = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  // [campo, quantos valores, menor valor]
  const CAMPOS = [['versao', 4, 0], ['modo', 2, 0], ['colunas', 12, 1], ['linhas', 6, 1], ['camadas', 6, 1], ['pecas', 24, 2], ['temMinMax', 2, 0]];
  const MINMAX = [['minCubos', 32, 0], ['maxCubos', 32, 0]];
  const MODOS = ['cubo', 'caminhao'];

  // p: os parâmetros efetivos do puzzle (com as colunas já calculadas, no caminhão); versao: a do gerador
  // Devolve o código, ou null se algum campo passa do que o código comporta (o manual mostra só a semente).
  function codificar(p, versao) {
    const v = { versao: versao % 4, modo: MODOS.indexOf(p.modo || 'cubo'), colunas: p.colunas, linhas: p.linhas, camadas: p.camadas,
      pecas: p.pecas, minCubos: p.minCubos || 0, maxCubos: p.maxCubos || 0 };
    v.temMinMax = v.minCubos || v.maxCubos ? 1 : 0;
    const campos = CAMPOS.concat(v.temMinMax ? MINMAX : []);
    if (v.modo < 0 || !Number.isInteger(p.semente) || p.semente < 0) return null;
    for (const [k, n, min] of campos) if (!Number.isInteger(v[k]) || v[k] < min || v[k] >= min + n) return null;
    let x = BigInt(p.semente);
    for (const [k, n, min] of campos.slice().reverse()) x = x * BigInt(n) + BigInt(v[k] - min);
    let s = '';
    do { s = ALFABETO[Number(x % 32n)] + s; x /= 32n; } while (x > 0n);
    return s;
  }

  // Devolve { versao, modo, colunas, linhas, camadas, pecas, minCubos, maxCubos, semente } ou lança
  // um erro com uma mensagem para a pessoa.
  function decodificar(codigo) {
    const s = String(codigo || '').toUpperCase().replace(/[\s\-·.]/g, '');
    if (!s) throw new Error('Digite o código do seu puzzle.');
    let x = 0n;
    for (const ch of s) {
      const i = ALFABETO.indexOf(ch);
      if (i < 0) throw new Error(/[01OI]/.test(ch) ? `O código não tem "${ch}": confira se é ${({ 0: 'a letra D ou o 8', O: 'a letra D ou o 8', 1: 'a letra L ou o 7', I: 'a letra L ou o 7' })[ch]}.` : `O código não tem "${ch}".`);
      x = x * 32n + BigInt(i);
    }
    const v = {};
    const ler = ([k, n, min]) => { v[k] = Number(x % BigInt(n)) + min; x /= BigInt(n); };
    CAMPOS.forEach(ler);
    if (v.temMinMax) MINMAX.forEach(ler); else { v.minCubos = 0; v.maxCubos = 0; }
    delete v.temMinMax;
    v.modo = MODOS[v.modo];
    if (x > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Esse código não é de nenhum puzzle: confira as letras.');
    v.semente = Number(x);
    return v;
  }

  const api = { codificar, decodificar, ALFABETO };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  (globalThis.PC = globalThis.PC || {}).codigo = api;
})();
