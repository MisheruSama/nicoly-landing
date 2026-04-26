/* ═══════════════════════════════════════════════════════════
   NICOLY — main.js
   Lanternas SVG estilo Enrolados + Mapa interativo + Utilidades
═══════════════════════════════════════════════════════════ */

/* ─── Custom cursor ─── */
(function initCursor() {
  const dot  = document.querySelector('.cursor');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  let mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
  });

  function animRing() {
    rx += (mx - rx) * .14;
    ry += (my - ry) * .14;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animRing);
  }
  animRing();
})();

/* ─── Stars ─── */
(function initStars() {
  const layer = document.querySelector('.stars-layer');
  if (!layer) return;
  for (let i = 0; i < 220; i++) {
    const s   = document.createElement('div');
    s.className = 'star';
    const sz = Math.random() * 2 + 0.3;
    s.style.cssText = `
      width:${sz}px; height:${sz}px;
      top:${Math.random()*100}%;
      left:${Math.random()*100}%;
      --dur:${(Math.random()*4+2).toFixed(1)}s;
      --delay:-${(Math.random()*7).toFixed(1)}s;
      --min:${(Math.random()*.08+.03).toFixed(2)};
      --max:${(Math.random()*.55+.2).toFixed(2)};
    `;
    layer.appendChild(s);
  }
})();

/* ─────────────────────────────────────────────────────────
   LANTERNAS ESTILO ENROLADOS (Canvas)
   Cada lanterna é desenhada como SVG semântico do Tangled:
   - Corpo oval com ripple de luz interno
   - Grade de bambu estilizada
   - Franja pendente
   - Halo de brilho suave
───────────────────────────────────────────────────────── */
(function initLanterns() {
  const NS = 'http://www.w3.org/2000/svg';

  /**
   * Cria uma lanterna SVG fiel ao estilo de Enrolados.
   * @param {object} cfg  configurações de tamanho e cor
   * @returns {SVGElement}
   */
  function createLanternSVG(cfg) {
    const { w, h, primaryColor, glowColor, opacity } = cfg;

    // Proporções internas
    const bw  = w * .78;   // corpo width
    const bh  = h * .62;   // corpo height
    const cx  = w / 2;
    const cy  = h * .45;

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width',   w);
    svg.setAttribute('height',  h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('fill',    'none');
    svg.style.overflow = 'visible';

    const id = 'l' + Math.random().toString(36).slice(2,7);

    // ── defs: gradientes e filtros ──
    const defs = document.createElementNS(NS, 'defs');

    // Gradiente radial para o corpo — imita a luz vinda de dentro
    const rg = document.createElementNS(NS, 'radialGradient');
    rg.setAttribute('id', id+'_rg');
    rg.setAttribute('cx','40%'); rg.setAttribute('cy','35%');
    rg.setAttribute('r','65%');
    [
      [0,   '#fff7cc', '1'],
      [0.25, primaryColor, '1'],
      [0.6,  darken(primaryColor, .75), '1'],
      [1,    darken(primaryColor, .35), '.85'],
    ].forEach(([off, col, op]) => {
      const s = document.createElementNS(NS, 'stop');
      s.setAttribute('offset',       off);
      s.setAttribute('stop-color',   col);
      s.setAttribute('stop-opacity', op);
      rg.appendChild(s);
    });
    defs.appendChild(rg);

    // Gradiente rim (borda inferior mais escura)
    const lg = document.createElementNS(NS, 'linearGradient');
    lg.setAttribute('id',  id+'_rim');
    lg.setAttribute('x1','0'); lg.setAttribute('y1','0');
    lg.setAttribute('x2','0'); lg.setAttribute('y2','1');
    [[0,'rgba(255,255,200,.18)'],[.5,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.45)']].forEach(([off,col]) => {
      const s = document.createElementNS(NS, 'stop');
      s.setAttribute('offset',off); s.setAttribute('stop-color',col);
      lg.appendChild(s);
    });
    defs.appendChild(lg);

    // Filtro de brilho (glow)
    const fe = document.createElementNS(NS, 'filter');
    fe.setAttribute('id', id+'_glow');
    fe.setAttribute('x','-60%'); fe.setAttribute('y','-60%');
    fe.setAttribute('width','220%'); fe.setAttribute('height','220%');
    const feGaussian = document.createElementNS(NS, 'feGaussianBlur');
    feGaussian.setAttribute('stdDeviation', w * .28);
    feGaussian.setAttribute('result','blur');
    const feFlood = document.createElementNS(NS, 'feFlood');
    feFlood.setAttribute('flood-color', glowColor);
    feFlood.setAttribute('flood-opacity','1');
    feFlood.setAttribute('result','color');
    const feComp = document.createElementNS(NS, 'feComposite');
    feComp.setAttribute('in','color'); feComp.setAttribute('in2','blur');
    feComp.setAttribute('operator','in'); feComp.setAttribute('result','coloredBlur');
    const feMerge = document.createElementNS(NS, 'feMerge');
    ['coloredBlur','SourceGraphic'].forEach(n => {
      const mn = document.createElementNS(NS, 'feMergeNode');
      mn.setAttribute('in', n); feMerge.appendChild(mn);
    });
    [feGaussian,feFlood,feComp,feMerge].forEach(n => fe.appendChild(n));
    defs.appendChild(fe);

    svg.appendChild(defs);

    // ── Halo exterior (brilho suave ao redor) ──
    const halo = document.createElementNS(NS, 'ellipse');
    halo.setAttribute('cx', cx);
    halo.setAttribute('cy', cy);
    halo.setAttribute('rx', bw * .75);
    halo.setAttribute('ry', bh * .75);
    halo.setAttribute('fill', glowColor);
    halo.setAttribute('opacity', '.18');
    halo.setAttribute('filter', `url(#${id}_glow)`);
    svg.appendChild(halo);

    // ── Fio superior ──
    const stringTop = document.createElementNS(NS, 'line');
    stringTop.setAttribute('x1', cx); stringTop.setAttribute('y1', 0);
    stringTop.setAttribute('x2', cx); stringTop.setAttribute('y2', cy - bh/2 + 2);
    stringTop.setAttribute('stroke', darken(primaryColor,.7));
    stringTop.setAttribute('stroke-width','1.2');
    stringTop.setAttribute('opacity','.7');
    svg.appendChild(stringTop);

    // ── Anel superior (chapéu) ──
    const topRing = document.createElementNS(NS, 'ellipse');
    topRing.setAttribute('cx', cx);
    topRing.setAttribute('cy', cy - bh/2 + 1);
    topRing.setAttribute('rx', bw * .38);
    topRing.setAttribute('ry', bh * .09);
    topRing.setAttribute('fill', darken(primaryColor,.6));
    topRing.setAttribute('stroke', darken(primaryColor,.5));
    topRing.setAttribute('stroke-width','1');
    svg.appendChild(topRing);

    // ── Corpo principal ──
    const body = document.createElementNS(NS, 'ellipse');
    body.setAttribute('cx', cx);
    body.setAttribute('cy', cy);
    body.setAttribute('rx', bw/2);
    body.setAttribute('ry', bh/2);
    body.setAttribute('fill', `url(#${id}_rg)`);
    body.setAttribute('filter', `url(#${id}_glow)`);
    svg.appendChild(body);

    // ── Reflexo overlay (brilho de cúpula) ──
    const shine = document.createElementNS(NS, 'ellipse');
    shine.setAttribute('cx', cx - bw*.1);
    shine.setAttribute('cy', cy - bh*.18);
    shine.setAttribute('rx', bw * .25);
    shine.setAttribute('ry', bh * .2);
    shine.setAttribute('fill', 'rgba(255,255,255,.12)');
    svg.appendChild(shine);

    // ── Grade de bambu estilizada (linhas verticais sutis) ──
    const numStrips = 5;
    for (let i = 1; i < numStrips; i++) {
      const px = cx - bw/2 + (bw * i / numStrips);
      // clip pela elipse — aproximado com 2 pontos no arco
      const progress = (i / numStrips) - .5; // -0.5..0.5
      const localH   = bh * Math.sqrt(Math.max(0, .25 - progress*progress)) * 2;
      const stripTop    = cy - localH * .48;
      const stripBottom = cy + localH * .48;
      const strip = document.createElementNS(NS, 'line');
      strip.setAttribute('x1', px); strip.setAttribute('y1', stripTop);
      strip.setAttribute('x2', px); strip.setAttribute('y2', stripBottom);
      strip.setAttribute('stroke', 'rgba(0,0,0,.18)');
      strip.setAttribute('stroke-width', '1.2');
      svg.appendChild(strip);
    }
    // linhas horizontais (cintura da lanterna)
    [-0.12, 0.12].forEach(offset => {
      const ly = cy + bh * offset;
      const rLocal = bw/2 * Math.sqrt(1 - (offset*2)**2 * .6); // aprox.
      const strip = document.createElementNS(NS, 'line');
      strip.setAttribute('x1', cx - rLocal);
      strip.setAttribute('y1', ly);
      strip.setAttribute('x2', cx + rLocal);
      strip.setAttribute('y2', ly);
      strip.setAttribute('stroke', 'rgba(0,0,0,.15)');
      strip.setAttribute('stroke-width', '1');
      svg.appendChild(strip);
    });

    // ── Borda metálica do aro (overlay) ──
    const bodyStroke = document.createElementNS(NS, 'ellipse');
    bodyStroke.setAttribute('cx', cx);
    bodyStroke.setAttribute('cy', cy);
    bodyStroke.setAttribute('rx', bw/2);
    bodyStroke.setAttribute('ry', bh/2);
    bodyStroke.setAttribute('fill', 'none');
    bodyStroke.setAttribute('stroke', darken(primaryColor,.55));
    bodyStroke.setAttribute('stroke-width','1.2');
    bodyStroke.setAttribute('opacity','.6');
    svg.appendChild(bodyStroke);

    // ── Rim overlay ──
    const rim = document.createElementNS(NS, 'ellipse');
    rim.setAttribute('cx', cx); rim.setAttribute('cy', cy);
    rim.setAttribute('rx', bw/2); rim.setAttribute('ry', bh/2);
    rim.setAttribute('fill', `url(#${id}_rim)`);
    svg.appendChild(rim);

    // ── Anel inferior (base) ──
    const botRing = document.createElementNS(NS, 'ellipse');
    botRing.setAttribute('cx', cx);
    botRing.setAttribute('cy', cy + bh/2 - 1);
    botRing.setAttribute('rx', bw * .35);
    botRing.setAttribute('ry', bh * .08);
    botRing.setAttribute('fill', darken(primaryColor,.5));
    botRing.setAttribute('stroke', darken(primaryColor,.4));
    botRing.setAttribute('stroke-width','1');
    svg.appendChild(botRing);

    // ── Fio inferior + franja ──
    const stringBot = document.createElementNS(NS, 'line');
    stringBot.setAttribute('x1', cx); stringBot.setAttribute('y1', cy + bh/2);
    stringBot.setAttribute('x2', cx); stringBot.setAttribute('y2', cy + bh/2 + h*.1);
    stringBot.setAttribute('stroke', darken(primaryColor,.65));
    stringBot.setAttribute('stroke-width','1');
    stringBot.setAttribute('opacity','.6');
    svg.appendChild(stringBot);

    // Franja (3 fios pendentes)
    [-1, 0, 1].forEach(offset => {
      const fx = cx + offset * bw * .07;
      const fy1 = cy + bh/2 + h*.1;
      const fy2 = fy1 + h * .11;
      const tassel = document.createElementNS(NS, 'line');
      tassel.setAttribute('x1', fx); tassel.setAttribute('y1', fy1);
      tassel.setAttribute('x2', fx + offset * 1.5); tassel.setAttribute('y2', fy2);
      tassel.setAttribute('stroke', darken(primaryColor,.6));
      tassel.setAttribute('stroke-width', offset === 0 ? '1.2' : '.7');
      tassel.setAttribute('opacity','.55');
      svg.appendChild(tassel);
    });

    // Opacidade global
    svg.setAttribute('opacity', opacity ?? 1);

    return svg;
  }

  /** Escurece uma cor hex por fator (0=preto,1=original) */
  function darken(hex, factor) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    const f = (v) => Math.round(v * factor).toString(16).padStart(2,'0');
    return `#${f(r)}${f(g)}${f(b)}`;
  }

  /* ── Configurações das lanternas ──
     Cada entrada: [left%, bottom%, w, h, flyDuration, delay, tilt, drift, primaryColor, glowColor]
     Paleta fiel ao filme: dourado quente, âmbar, marfim, laranja suave
  */
  const palette = [
    { p:'#f5c842', g:'rgba(255,190,50,.7)'  }, // dourado vivo
    { p:'#f0a830', g:'rgba(240,160,40,.65)' }, // âmbar
    { p:'#fce68a', g:'rgba(255,220,100,.6)' }, // marfim claro
    { p:'#e8882a', g:'rgba(232,130,40,.6)'  }, // laranja
    { p:'#f7d060', g:'rgba(250,200,70,.65)' }, // dourado médio
  ];

  const configs = [
    // [l%, b%, w,  h,  fly,  delay, tilt,   drift,   palIdx]
    [ 4,  -8,  38, 56,  22,  0,    '-4deg', '18px',   0],
    [12,  -8,  52, 76,  18,  2.5,  '3deg',  '-28px',  1],
    [20,  -8,  30, 44,  26,  0.8,  '-2deg', '22px',   2],
    [29,  -8,  62, 90,  16,  4,    '5deg',  '-35px',  0],
    [38,  -8,  34, 50,  24,  1.5,  '-3deg', '20px',   3],
    [47,  -8,  46, 68,  19,  3.2,  '2deg',  '-24px',  4],
    [56,  -8,  28, 42,  27,  0.4,  '-5deg', '26px',   1],
    [64,  -8,  56, 82,  17,  5,    '4deg',  '-30px',  2],
    [72,  -8,  36, 54,  23,  2,    '-2deg', '16px',   0],
    [80,  -8,  44, 65,  20,  3.8,  '3deg',  '-20px',  3],
    [88,  -8,  26, 38,  25,  1.2,  '-4deg', '24px',   4],
    [94,  -8,  40, 60,  21,  4.5,  '2deg',  '-18px',  1],
    // segunda onda (saem um pouco depois)
    [ 7,  -8,  24, 36,  28,  8,    '2deg',  '14px',   2],
    [16,  -8,  48, 70,  15,  9.5,  '-3deg', '-26px',  0],
    [25,  -8,  32, 48,  22,  7,    '4deg',  '20px',   3],
    [34,  -8,  58, 85,  18,  11,   '-1deg', '-32px',  4],
    [43,  -8,  22, 34,  29,  6.5,  '3deg',  '18px',   1],
    [52,  -8,  50, 74,  16,  12,   '-4deg', '-22px',  2],
    [61,  -8,  36, 53,  24,  8.5,  '2deg',  '28px',   0],
    [70,  -8,  28, 42,  20,  10,   '-3deg', '-16px',  3],
    [78,  -8,  54, 79,  17,  13,   '5deg',  '-30px',  4],
    [86,  -8,  30, 45,  26,  7.5,  '-2deg', '22px',   2],
    [92,  -8,  42, 62,  19,  11.5, '3deg',  '-24px',  1],
  ];

  const layer = document.getElementById('lantern-layer');
  if (!layer) return;

  configs.forEach(([l, b, w, h, fly, delay, tilt, drift, palIdx]) => {
    const pal = palette[palIdx];
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position:absolute;
      left:${l}%; bottom:${b}%;
      width:${w}px; height:${h}px;
      animation: floatLantern ${fly}s ease-in-out infinite ${delay}s;
      --tilt:${tilt}; --drift:${drift};
      opacity:0;
    `;

    const svg = createLanternSVG({
      w, h,
      primaryColor: pal.p,
      glowColor:    pal.g,
      opacity:      (Math.random() * .35 + .65).toFixed(2),
    });
    wrapper.appendChild(svg);
    layer.appendChild(wrapper);
  });
})();

/* ─── Scroll Reveal ─── */
(function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('visible');
      // Stagger siblings dentro do mesmo pai
      const siblings = [...el.parentElement.querySelectorAll('.reveal:not(.visible)')];
      siblings.forEach((s, i) => { s.style.transitionDelay = `${i * 0.13}s`; });
    });
  }, { threshold: .12 });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();



/* ─────────────────────────────────────────────────────────
   MAPA INTERATIVO
   SVG desenhado à mão com caminhos e pins animados
───────────────────────────────────────────────────────── */
(function initMap() {
  const places = [
    {
      id: 'praia',
      icon: '🌊',
      name: 'A Praia',
      image: 'imagem/praia.jpg',
      px: '22%', py: '68%',
    },
    {
      id: 'apartamento',
      icon: '🎬',
      name: 'O Apartamento',
      image: 'imagem/apartamento.jpg',
      px: '52%', py: '38%',
    },
    {
      id: 'parque',
      icon: '🎡',
      name: 'Parque de Diversões',
      image: 'imagem/parque.jpg',
      px: '75%', py: '62%',
    },
    {
      id: 'academia',
      icon: '💪',
      name: 'A Academia',
      image: 'imagem/academia.jpg',
      px: '40%', py: '25%',
    },
  ];

  // Load stored photos for each place
  places.forEach(place => {
    const stored = localStorage.getItem(`place-photo-${place.id}`);
    if (stored) {
      place.image = stored;
    }
  });

  // Desenha paths SVG entre os lugares (linhas tracejadas douradas)
  const pathsSvg = document.getElementById('map-paths');
  if (pathsSvg) {
    // Sequência de conexões (índices)
    const connections = [[0,3],[3,1],[1,2],[2,0]];
    // Precisamos converter % para números para o path
    const coords = places.map(p => ({
      x: parseFloat(p.px),
      y: parseFloat(p.py),
    }));

    connections.forEach(([a, b]) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      const ax = coords[a].x, ay = coords[a].y;
      const bx = coords[b].x, by = coords[b].y;
      // Curva Bézier suave
      const cx1 = ax + (bx - ax) * .4 + (Math.random()*10-5);
      const cy1 = ay + (by - ay) * .2 - 8;
      path.setAttribute('d', `M ${ax} ${ay} C ${cx1} ${cy1} ${bx - (bx-ax)*.3} ${by - 8} ${bx} ${by}`);
      path.setAttribute('stroke','rgba(240,192,96,.22)');
      path.setAttribute('stroke-width','1');
      path.setAttribute('stroke-dasharray','4 6');
      path.setAttribute('fill','none');
      path.setAttribute('vector-effect','non-scaling-stroke');
      pathsSvg.appendChild(path);
    });
  }

  // Cria os pins
  const mapViewport = document.querySelector('.map-viewport');
  if (!mapViewport) return;

  places.forEach((place, idx) => {
    const pin = document.createElement('div');
    pin.className = 'map-pin';
    if (place.image) {
      pin.classList.add('has-photo');
    }
    pin.style.left = place.px;
    pin.style.top  = place.py;
    pin.style.animationDelay = `${idx * .4}s`;
    pin.setAttribute('data-place', place.id);

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'place-tooltip';
    tooltip.innerHTML = `
      <div class="tooltip-photo">
        ${place.image ? `<img src="${place.image}" alt="${place.name}">` : `<div class="tooltip-photo-placeholder">${place.icon}</div>`}
      </div>
      <div class="tooltip-name">${place.name}</div>
      <div class="tooltip-arrow"></div>
    `;

    pin.innerHTML = `
      <span class="pin-icon">${place.icon}</span>
      <div class="pin-dot"></div>
    `;

    pin.appendChild(tooltip);

    // Tooltip show/hide
    pin.addEventListener('mouseenter', () => {
      tooltip.classList.add('visible');
    });

    pin.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });

    mapViewport.appendChild(pin);
  });

  // Ativa o primeiro lugar por padrão
  setTimeout(() => {
    const firstPin = document.querySelector('.map-pin');
    if (firstPin) {
      const label = firstPin.querySelector('.pin-label');
      if (label) {
        label.style.opacity = '1';
        label.style.transform = 'translateX(-50%) translateY(0)';
      }
    }
  }, 800);
})();

/* ─── Background Music Control ─── */
(function initMusic() {
  const playBtn = document.getElementById('playMusicBtn');
  const audio = document.getElementById('backgroundMusic');

  if (!playBtn || !audio) return;

  let isPlaying = false;

  playBtn.addEventListener('click', function() {
    if (isPlaying) {
      audio.pause();
      playBtn.textContent = 'Vamos juntos ✦';
      isPlaying = false;
    } else {
      audio.play();
      playBtn.textContent = '⏸ Pausar';
      isPlaying = true;
    }
  });

  // Update button text if audio ends
  audio.addEventListener('ended', function() {
    playBtn.textContent = 'Vamos juntos ✦';
    isPlaying = false;
  });
})();
