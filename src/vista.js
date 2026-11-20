// A vista 3D: só as peças, com o fundo (a grade do chão) e a caixa tracejada. Eixo Z para cima, como
// no puzzle-cube; câmera na frente-direita, como nas imagens do manual. Desenha só quando algo muda
// (gira, anima, muda de tamanho): no celular, não gasta bateria parada.
(function () {
  'use strict';
  // as cores do manual do puzzle-cube (vista3d.PALETA): uma por formato
  const PALETA = ['#e4572e', '#29335c', '#f3a712', '#669bbc', '#a8c686', '#8e5572', '#3b8ea5',
    '#f2c14e', '#5d576b', '#c1666b', '#48a9a6', '#d4b483', '#4e598c', '#ff8c42'];
  const corDoTipo = (t) => PALETA[t % PALETA.length];
  const css = (nome) => getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  const DURACAO = 450;   // ms de cada peça entrando
  const suave = (t) => 1 - Math.pow(1 - t, 3);

  function criarVista(el, { girarSozinha = false } = {}) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    el.appendChild(renderer.domElement);
    const cena = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 500);
    camera.up.set(0, 0, 1);
    cena.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 0.75));
    const sol = new THREE.DirectionalLight(0xffffff, 0.75);
    sol.position.set(4, -6, 10);
    cena.add(sol);
    const controles = new THREE.OrbitControls(camera, renderer.domElement);
    controles.enablePan = false;
    controles.enableDamping = true;
    controles.dampingFactor = 0.12;
    controles.autoRotate = girarSozinha;
    controles.autoRotateSpeed = 1.2;
    controles.addEventListener('change', pedirQuadro);

    let mundo = null, pecas = [], seta = null, animacoes = [], quadroPedido = false, ativo = true;
    function pedirQuadro() { if (!quadroPedido && ativo) { quadroPedido = true; requestAnimationFrame(quadro); } }
    function quadro(t) {
      quadroPedido = false;
      animacoes = animacoes.filter((a) => a(t));
      const mexeu = controles.update();
      renderer.render(cena, camera);
      if (animacoes.length || mexeu || girarSozinha) pedirQuadro();
    }
    new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      enquadrar();
      pedirQuadro();
    }).observe(el);

    // uma peça: um cubo por cubinho, com as arestas de cada um (dá para contar os cubinhos)
    const caixaGeo = new THREE.BoxGeometry(1, 1, 1);
    const arestasGeo = new THREE.EdgesGeometry(caixaGeo);
    function malhaDaPeca(p) {
      const cor = new THREE.Color(corDoTipo(p.tipo));
      const material = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.7, metalness: 0.02, transparent: true, opacity: 1,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      const linha = new THREE.LineBasicMaterial({ color: cor.clone().multiplyScalar(0.55), transparent: true, opacity: 1 });
      const grupo = new THREE.Group();
      for (const [x, y, z] of p.celulas) {
        const m = new THREE.Mesh(caixaGeo, material);
        m.position.set(x + 0.5, y + 0.5, z + 0.5);
        grupo.add(m);
        const a = new THREE.LineSegments(arestasGeo, linha);
        a.position.copy(m.position);
        grupo.add(a);
      }
      grupo.userData = { material, linha };
      return grupo;
    }
    function opacidade(grupo, o) { grupo.userData.material.opacity = o; grupo.userData.linha.opacity = o; grupo.userData.material.depthWrite = o > 0.99; }

    // o chão (grade) e a caixa tracejada do bloco
    function fundo(dims) {
      const [X, Y, Z] = dims, g = new THREE.Group();
      const chao = new THREE.Mesh(new THREE.PlaneGeometry(X, Y), new THREE.MeshBasicMaterial({ color: css('--campo') || '#f3f5f7' }));
      chao.position.set(X / 2, Y / 2, -0.005);
      g.add(chao);
      const pts = [];
      for (let x = 0; x <= X; x++) pts.push(x, 0, 0, x, Y, 0);
      for (let y = 0; y <= Y; y++) pts.push(0, y, 0, X, y, 0);
      const gradeGeo = new THREE.BufferGeometry();
      gradeGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      g.add(new THREE.LineSegments(gradeGeo, new THREE.LineBasicMaterial({ color: css('--linha') || '#e1e4e8' })));
      const caixa = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(X, Y, Z)),
        new THREE.LineDashedMaterial({ color: css('--suave') || '#69717c', dashSize: 0.18, gapSize: 0.14, transparent: true, opacity: 0.55 }));
      caixa.position.set(X / 2, Y / 2, Z / 2);
      caixa.computeLineDistances();
      g.add(caixa);
      return g;
    }

    // de onde a peça k vem: fora do bloco, na direção em que ela entra
    // logo fora do bloco (FOLGA), na direção em que ela entra
    const FOLGA = 0.7;
    function afastamento(sol, k) {
      const p = sol.pecas[k], d = p.d, a = d.findIndex((v) => v !== 0);
      const v = p.celulas.map((c) => c[a]);
      const dist = d[a] > 0 ? sol.dims[a] - Math.min(...v) + FOLGA : Math.max(...v) + 1 + FOLGA;
      return new THREE.Vector3(d[0], d[1], d[2]).multiplyScalar(dist);
    }
    function centro(p) {
      const c = new THREE.Vector3();
      for (const [x, y, z] of p.celulas) c.add(new THREE.Vector3(x + 0.5, y + 0.5, z + 0.5));
      return c.divideScalar(p.celulas.length);
    }

    let solucao = null, k = 0;
    function mostrar(s) {
      if (mundo) cena.remove(mundo);
      solucao = s;
      mundo = new THREE.Group();
      mundo.add(fundo(s.dims));
      pecas = s.pecas.map((p) => { const m = malhaDaPeca(p); mundo.add(m); return m; });
      seta = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(), 1.3, new THREE.Color(css('--texto') || '#1d2126'), 0.45, 0.32);
      mundo.add(seta);
      cena.add(mundo);
      // a caixa que a câmera enquadra: o bloco e cada peça esperando fora dele (com a seta)
      caixaVista = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(...s.dims));
      centroDoBloco = new THREE.Vector3(...s.dims).multiplyScalar(0.5);
      s.pecas.forEach((p, i) => {
        const fora = afastamento(s, i);
        for (const [x, y, z] of p.celulas) {
          caixaVista.expandByPoint(new THREE.Vector3(x, y, z).add(fora));
          caixaVista.expandByPoint(new THREE.Vector3(x + 1, y + 1, z + 1).add(fora).addScaledVector(new THREE.Vector3(...p.d), 1.6));
        }
      });
      enquadrar();
      irPara(s.pecas.length, false);
    }

    // a câmera: tudo da caixaVista cabe na tela, na largura e na altura (no celular em pé, a largura
    // é que manda). Girando sozinha (a prévia), a esfera em volta, para caber em qualquer ângulo.
    let caixaVista = null, centroDoBloco = new THREE.Vector3();
    const DIRECAO = new THREE.Vector3(0.62, -1.0, 0.78).normalize();
    function enquadrar() {
      if (!caixaVista) return;
      // o giro é sempre em volta do MEIO DO BLOCO (o dono, 19/11/2026: girava em volta de uma ponta,
      // porque o meio era o da caixa com as peças esperando fora)
      const alvo = centroDoBloco.clone();
      const tV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), tH = tV * camera.aspect;
      let dist = 0;
      if (girarSozinha) {
        let raio = 0;
        for (const x of [caixaVista.min.x, caixaVista.max.x]) for (const y of [caixaVista.min.y, caixaVista.max.y]) for (const z of [caixaVista.min.z, caixaVista.max.z]) raio = Math.max(raio, alvo.distanceTo(new THREE.Vector3(x, y, z)));
        dist = raio / Math.sin(Math.atan(Math.min(tV, tH)));
      } else {
        // cada canto, no sistema da câmera: precisa de dist >= profundidade + |x|/tH (e |y|/tV)
        const frente = DIRECAO.clone().negate(), direita = new THREE.Vector3().crossVectors(frente, camera.up).normalize();
        const cima = new THREE.Vector3().crossVectors(direita, frente);
        const { min, max } = caixaVista;
        for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
          const q = new THREE.Vector3(x, y, z).sub(alvo), prof = -q.dot(frente);
          dist = Math.max(dist, prof + Math.abs(q.dot(direita)) / tH, prof + Math.abs(q.dot(cima)) / tV);
        }
      }
      dist *= 1.06;
      camera.position.copy(alvo).addScaledVector(DIRECAO, dist);
      controles.target.copy(alvo);
      controles.minDistance = dist * 0.5;
      controles.maxDistance = dist * 2;
      controles.update();
      pedirQuadro();
    }

    // k peças no lugar; a peça k (se houver) esperando fora do bloco, com a seta. animar: a peça
    // que muda (a k-1 indo para o lugar, ou voltando) desliza em vez de pular.
    function irPara(novo, animar = true) {
      if (!solucao) return;
      const n = solucao.pecas.length, antes = k;
      k = Math.max(0, Math.min(n, novo));
      animacoes = [];
      pecas.forEach((m, i) => {
        m.visible = i <= k;
        m.position.set(0, 0, 0);
        opacidade(m, i < k ? 1 : 0.88);
        if (i === k) m.position.copy(afastamento(solucao, i));
      });
      if (animar && Math.abs(k - antes) === 1) {
        const i = Math.min(k, antes), m = pecas[i], fora = afastamento(solucao, i);
        const [de, para] = k > antes ? [fora, new THREE.Vector3()] : [new THREE.Vector3(), fora];
        let t0 = null;
        m.position.copy(de);
        animacoes.push((t) => {
          if (t0 === null) t0 = t;
          const f = Math.min(1, (t - t0) / DURACAO);
          m.position.lerpVectors(de, para, suave(f));
          return f < 1;
        });
        // a próxima aparece devagar
        if (k > antes && k < n) {
          const prox = pecas[k];
          let t1 = null;
          opacidade(prox, 0);
          animacoes.push((t) => {
            if (t1 === null) t1 = t;
            const f = Math.min(1, (t - t1) / DURACAO);
            opacidade(prox, 0.88 * f);
            return f < 1;
          });
        }
      }
      // a seta: em cima da peça que espera, apontando para o lugar dela
      if (k < n) {
        const p = solucao.pecas[k], d = new THREE.Vector3(...p.d);
        // a face de fora da peça, medida ao longo de d (o cubinho c ocupa de c a c+1 em cada eixo)
        const positivo = p.d[0] + p.d[1] + p.d[2] > 0 ? 1 : 0;
        const ext = Math.max(...p.celulas.map((c) => c[0] * p.d[0] + c[1] * p.d[1] + c[2] * p.d[2] + positivo));
        const base = centro(p).add(afastamento(solucao, k));
        const meio = centro(p).dot(d);
        seta.position.copy(base).addScaledVector(d, ext - meio + 1.6);
        seta.setDirection(d.clone().negate());
        seta.visible = true;
      } else seta.visible = false;
      pedirQuadro();
    }

    function pausar(sim) { ativo = !sim; if (!sim) pedirQuadro(); }
    return { mostrar, irPara, pausar, get passo() { return k; }, get centroDoGiro() { return controles.target.toArray(); } };
  }

  const api = { criarVista, corDoTipo };
  (globalThis.PC = globalThis.PC || {}).vista = api;
})();
