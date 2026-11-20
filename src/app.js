// A página: o código, a confirmação enquanto digita, e a montagem peça por peça.
// O endereço guarda o código (#3629G): dá para abrir direto (um QR no papel, no futuro).
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const R = PC.resolver;
  const NOME_DO_MODO = { caminhao: 'Caminhão', cubo: 'Cubo' };
  let vista = null, previa = null, solucao = null, codigo = '';
  PC.app = { vista: () => vista };   // para a conferência (o centro do giro)

  const limpo = (s) => String(s || '').toUpperCase().replace(/[\s\-·.]/g, '');
  const descrever = (d) => `${NOME_DO_MODO[d.modo]} · ${d.dims.join('×')} · ${d.pecas} peças`;

  // enquanto digita: confirma o que o código é (sem montar ainda); a prévia só quando tem certeza
  let espera = null;
  $('codigo').addEventListener('input', () => {
    const c = limpo($('codigo').value), el = $('confirma');
    clearTimeout(espera);
    $('ver').disabled = true;
    el.className = 'confirma';
    el.textContent = '';
    if (!c) { mostrarPrevia(null); return; }
    let d;
    try { d = R.ler(c); } catch (e) {
      // letra que não existe: na hora; o resto (código incompleto?), só quando parar de digitar
      const avisar = () => { el.className = 'confirma erro'; el.textContent = e.message; };
      if (/não tem/.test(e.message)) avisar(); else espera = setTimeout(avisar, 900);
      mostrarPrevia(null);
      return;
    }
    espera = setTimeout(() => {
      try {
        const s = R.resolver(c);
        el.className = 'confirma certo';
        el.textContent = '✓ ' + descrever(d);
        $('ver').disabled = false;
        mostrarPrevia(s);
      } catch (e) { el.className = 'confirma erro'; el.textContent = e.message; mostrarPrevia(null); }
    }, 250);
  });

  function mostrarPrevia(s) {
    if (!s) { $('previa').hidden = true; return; }
    $('previa').hidden = false;
    if (!previa) previa = PC.vista.criarVista($('previa'), { girarSozinha: true });
    previa.pausar(false);
    previa.mostrar(s);
  }

  $('formCodigo').addEventListener('submit', (ev) => {
    ev.preventDefault();
    abrir(limpo($('codigo').value));
  });

  function abrir(c) {
    let s;
    try { s = R.resolver(c); } catch (e) { $('confirma').className = 'confirma erro'; $('confirma').textContent = e.message; return false; }
    codigo = c;
    solucao = s;
    $('codigoVisto').textContent = c;
    $('entrada').hidden = true;
    $('montagem').hidden = false;
    if (previa) previa.pausar(true);
    if (!vista) vista = PC.vista.criarVista($('vista'));
    vista.mostrar(s);
    desenharPontos();
    irPara(0, false);
    if (location.hash !== '#' + c) history.replaceState(null, '', '#' + c);
    return true;
  }

  function voltar() {
    $('montagem').hidden = true;
    $('entrada').hidden = false;
    $('codigo').value = codigo;
    $('codigo').dispatchEvent(new Event('input'));
    history.replaceState(null, '', location.pathname + location.search);
  }
  $('voltar').addEventListener('click', voltar);
  $('trocar').addEventListener('click', () => { voltar(); $('codigo').select(); });

  function desenharPontos() {
    const el = $('pontos');
    el.innerHTML = '';
    solucao.pecas.forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ponto';
      b.textContent = p.letra;
      b.style.setProperty('--c', PC.vista.corDoTipo(p.tipo));
      b.setAttribute('aria-label', `Ir para a peça ${p.letra} (${i + 1} de ${solucao.pecas.length})`);
      b.addEventListener('click', () => irPara(i, false));
      el.appendChild(b);
    });
    $('deslizante').max = solucao.pecas.length;
  }

  // k: quantas peças já estão no lugar (a k-ésima é a próxima)
  function irPara(k, animar = true) {
    const n = solucao.pecas.length;
    k = Math.max(0, Math.min(n, k));
    vista.irPara(k, animar);
    [...$('pontos').children].forEach((b, i) => {
      b.classList.toggle('feito', i < k);
      b.classList.toggle('agora', i === k);
      b.setAttribute('aria-current', i === k ? 'step' : 'false');
    });
    $('deslizante').value = k;
    const fim = k === n, el = $('passo');
    if (fim) {
      const caminhao = solucao.modo === 'caminhao';
      el.innerHTML = `<span class="ok" aria-hidden="true">✓</span><div><b>${caminhao ? 'Carga completa!' : 'Cubo completo!'}</b><br>`
        + `<span class="sub2">${caminhao ? 'Agora é só colocar as paredes e a tampa do baú.' : 'Todas as peças no lugar.'}</span></div>`;
    } else {
      const p = solucao.pecas[k];
      el.innerHTML = `<span class="tag" style="--c:${PC.vista.corDoTipo(p.tipo)}">${p.letra}</span>`
        + `<div><b>Peça ${p.letra}</b> · ${k + 1} de ${n}<br><span class="sub2">${p.texto[0].toUpperCase() + p.texto.slice(1)}</span></div>`;
    }
    $('proxima').hidden = fim;
    $('denovo').hidden = !fim;
    $('anterior').disabled = k === 0;
  }
  $('proxima').addEventListener('click', () => irPara(vista.passo + 1));
  $('anterior').addEventListener('click', () => irPara(vista.passo - 1));
  $('denovo').addEventListener('click', () => irPara(0, false));
  $('deslizante').addEventListener('input', () => irPara(Number($('deslizante').value), false));
  document.addEventListener('keydown', (ev) => {
    if ($('montagem').hidden || ev.target.tagName === 'INPUT') return;
    if (ev.key === 'ArrowRight') irPara(vista.passo + 1);
    if (ev.key === 'ArrowLeft') irPara(vista.passo - 1);
  });

  // aberto com o código no endereço: direto na montagem
  const doEndereco = limpo(decodeURIComponent(location.hash.slice(1)));
  if (doEndereco) { $('codigo').value = doEndereco; if (!abrir(doEndereco)) $('codigo').dispatchEvent(new Event('input')); }
  else $('previa').hidden = true;
})();
