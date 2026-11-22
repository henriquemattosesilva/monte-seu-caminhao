// As OUTRAS soluções do puzzle: as mesmas peças (em qualquer giro) enchendo o bloco de outro jeito,
// cada uma com a sua ordem de montagem. Não conta como outra: a mesma solução só virada dentro do
// bloco (as rotações que levam o bloco nele mesmo) nem a troca de duas peças iguais.
// A busca é por cobertura exata (a célula vazia, ou a peça, com menos encaixes livres primeiro) e
// anda aos poucos (procurar() é um gerador), para a página não travar enquanto conta.
(function () {
  'use strict';
  const req = (n, d) => (typeof require === 'function' ? require(d + n + '.js') : globalThis.PC[n]);
  const g = req('grade', './gerador/'), montagem = req('montagem', './gerador/'), R = req('resolver', './');

  // até onde contar (o cubo 3x3x3 chega a milhares; o caminhão, a algumas dezenas)
  const LIMITE = 999, LIMITE_DE_NOS = 3e6;

  function encaixes(s) {
    const { dims } = s, out = [];
    s.pecas.forEach((pc, p) => {
      const vistos = new Set();
      for (const m of g.ROTACOES) {
        const r = g.rotacionarCelulas(pc.celulas, m), k = g.chaveDeForma(r);
        if (vistos.has(k)) continue;
        vistos.add(k);
        const mx = [0, 1, 2].map((e) => Math.max(...r.map((c) => c[e])));
        for (let x = 0; x + mx[0] < dims[0]; x++) for (let y = 0; y + mx[1] < dims[1]; y++) for (let z = 0; z + mx[2] < dims[2]; z++)
          out.push({ p, cells: r.map((c) => g.indice([c[0] + x, c[1] + y, c[2] + z], dims)) });
      }
    });
    return out;
  }

  // a "assinatura" de uma solução: o tipo em cada célula, no menor dos giros do bloco
  function assinador(s) {
    const { dims } = s, N = dims[0] * dims[1] * dims[2];
    const giros = g.rotacoesDaCaixa(dims, [1, 1, 1]).map((m) => {
      const para = new Int32Array(N);
      for (let i = 0; i < N; i++) {
        const r = g.aplicar(m, g.coordenadas(i, dims))
          .map((v, j) => (m[j][g.eixoDeOrigem(m, j)] < 0 ? v + dims[j] - 1 : v));
        para[i] = g.indice(r, dims);
      }
      return para;
    });
    return (tipoNaCelula) => {
      let melhor = null;
      for (const para of giros) {
        const o = new Array(N);
        for (let i = 0; i < N; i++) o[para[i]] = tipoNaCelula[i];
        const k = o.join(',');
        if (melhor === null || k < melhor) melhor = k;
      }
      return melhor;
    };
  }

  // s: a solução de sempre (resolver.resolver). Gera cada OUTRA solução nova, já no formato de s
  // (peças na ordem de montagem); no fim, devolve { completo } (false: parou num dos limites).
  function* procurar(s, { limite = LIMITE, limiteDeNos = LIMITE_DE_NOS } = {}) {
    const { dims } = s, N = dims[0] * dims[1] * dims[2], P = s.pecas.length;
    const col = encaixes(s);
    const porCel = Array.from({ length: N }, () => []), porPeca = Array.from({ length: P }, () => []);
    col.forEach((c, i) => { c.cells.forEach((k) => porCel[k].push(i)); porPeca[c.p].push(i); });
    const assinar = assinador(s), vistas = new Set();
    const tipos = new Array(N);
    s.pecas.forEach((p) => p.celulas.forEach((c) => { tipos[g.indice(c, dims)] = p.tipo; }));
    vistas.add(assinar(tipos));
    const ocup = new Uint8Array(N), usada = new Uint8Array(P), esc = [];
    let nos = 0, achadas = 0, parou = false;
    const livre = (i) => !usada[col[i].p] && col[i].cells.every((k) => !ocup[k]);

    function nova() {
      const t = new Array(N);
      for (const i of esc) for (const k of col[i].cells) t[k] = s.pecas[col[i].p].tipo;
      const a = assinar(t);
      if (vistas.has(a)) return null;
      vistas.add(a);
      const celulas = esc.map((i) => col[i].cells.slice()), donas = esc.map((i) => col[i].p);
      const ordem = montagem.ordemDeMontagem(dims, celulas.map((c) => c.slice()));
      if (!ordem) return null;   // sem como montar entrando em linha reta: não serve
      return {
        modo: s.modo, dims,
        pecas: ordem.map((o) => {
          const orig = s.pecas[donas[o.peca]];
          return { letra: orig.letra, tipo: orig.tipo, direcao: o.direcao, d: R.DIRECOES[o.direcao], texto: o.texto,
            celulas: celulas[o.peca].map((i) => g.coordenadas(i, dims)) };
        }),
      };
    }

    function* busca() {
      if (parou) return;
      if (++nos > limiteDeNos) { parou = true; return; }
      if (nos % 2000 === 0) yield null;   // uma pausa para a página
      let melhor = null, n = Infinity;
      for (let k = 0; k < N; k++) {
        if (ocup[k]) continue;
        let c = 0;
        for (const i of porCel[k]) if (livre(i) && ++c >= n) break;
        if (c < n) { n = c; melhor = porCel[k]; }
        if (n === 0) return;
      }
      if (melhor === null) {
        const x = nova();
        if (x) { yield x; if (++achadas >= limite) parou = true; }
        return;
      }
      for (let p = 0; p < P; p++) {
        if (usada[p]) continue;
        let c = 0;
        for (const i of porPeca[p]) if (livre(i) && ++c >= n) break;
        if (c < n) { n = c; melhor = porPeca[p]; }
        if (n === 0) return;
      }
      for (const i of melhor) {
        if (parou) return;
        if (!livre(i)) continue;
        const c = col[i];
        usada[c.p] = 1; c.cells.forEach((k) => { ocup[k] = 1; }); esc.push(i);
        yield* busca();
        esc.pop(); c.cells.forEach((k) => { ocup[k] = 0; }); usada[c.p] = 0;
      }
    }

    yield* busca();
    return { completo: !parou };
  }

  // todas de uma vez (para os testes e o Node): { outras: [...], completo }
  function todas(s, opcoes) {
    const it = procurar(s, opcoes), outras = [];
    for (;;) {
      const r = it.next();
      if (r.done) return { outras, completo: r.value.completo };
      if (r.value) outras.push(r.value);
    }
  }

  // na página: procura aos pedaços (~12 ms por vez), avisando a cada nova e no fim. Devolve parar().
  function emSegundoPlano(s, { aoAchar, aoTerminar }, opcoes) {
    const it = procurar(s, opcoes);
    let parado = false;
    const passo = () => {
      if (parado) return;
      const ate = Date.now() + 12;
      while (Date.now() < ate) {
        const r = it.next();
        if (r.done) { aoTerminar(r.value.completo); return; }
        if (r.value) aoAchar(r.value);
      }
      setTimeout(passo, 0);
    };
    setTimeout(passo, 0);
    return () => { parado = true; };
  }

  const api = { procurar, todas, emSegundoPlano, LIMITE, LIMITE_DE_NOS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  (globalThis.PC = globalThis.PC || {}).solucoes = api;
})();
