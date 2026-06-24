// ============================================================
// World Map — ECharts Geo + EffectScatter (replaces Three.js)
// ============================================================

const COUNTRY_COORDS = {
  'Afghanistan': [67.71, 33.93], 'Iraq': [43.68, 33.22], 'Yemen': [48.52, 15.55],
  'India': [78.96, 20.59], 'Nigeria': [8.68, 9.08], 'Pakistan': [69.35, 30.38],
  'Democratic Republic of the Congo': [21.76, -4.04], 'Syria': [38.99, 34.80],
  'Somalia': [46.20, 5.15], 'Mozambique': [35.53, -18.67], 'Philippines': [121.77, 12.88],
  'Central African Republic': [20.94, 6.61], 'Cameroon': [12.35, 7.37],
  'Colombia': [-74.30, 4.57], 'Kenya': [37.91, -0.02], 'Germany': [10.45, 51.17],
  'Greece': [21.82, 39.07], 'Nepal': [84.12, 28.39], 'Egypt': [30.80, 26.82],
  'Mali': [-4.00, 17.57], 'Burkina Faso': [-1.56, 12.24], 'Niger': [8.08, 17.61],
  'Ethiopia': [40.49, 9.15], 'Libya': [17.23, 26.34], 'Tunisia': [9.54, 33.89],
  'France': [2.21, 46.23], 'United States': [-95.71, 37.09], 'Thailand': [100.99, 15.87],
  'Myanmar': [95.96, 21.91], 'Bangladesh': [90.36, 23.68], 'Israel': [34.85, 31.05],
  'Lebanon': [35.86, 33.85], 'Saudi Arabia': [45.08, 23.89], 'Turkey': [35.24, 38.96],
  'Russia': [105.32, 61.52], 'Ukraine': [31.17, 48.38], 'Iran': [53.69, 32.43],
  'Algeria': [1.66, 28.03], 'Tanzania': [34.89, -6.37], 'Uganda': [32.29, 1.37],
  'South Africa': [22.94, -30.56], 'Mexico': [-102.55, 23.63], 'Chile': [-71.54, -35.68],
  'Brazil': [-51.93, -14.24], 'Venezuela': [-66.59, 6.42],
  // Added so every country in the dataset is plotted (previously 12 were dropped)
  'Netherlands': [5.29, 52.13], 'West Bank and Gaza Strip': [35.23, 31.95],
  'Cyprus': [33.43, 35.13], 'Ghana': [-1.02, 7.95], 'United Kingdom': [-3.44, 55.38],
  'Sudan': [30.22, 12.86], 'Australia': [133.78, -25.27], 'Kazakhstan': [66.92, 48.02],
  'New Caledonia': [165.62, -20.90], 'Trinidad and Tobago': [-61.22, 10.69],
  'Argentina': [-63.62, -38.42], 'China': [104.20, 35.86]
};

const P_MAP = {
  bg: '#0a0d12', land: '#1a2030', border: '#2a3248',
  red: '#c23028', redLt: '#e85d4a', redDk: '#6b1a16',
  redPale: '#f5a8a0', text: '#d8d5d0', dim: '#6b6e75'
};

let globeChartInstance = null;

async function initGlobe(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Load world map GeoJSON
  try {
    const mapUrl = window.__resources && window.__resources.worldMap
      ? window.__resources.worldMap
      : 'https://cdn.jsdelivr.net/npm/echarts@4.9.0/map/json/world.json';
    const response = await fetch(mapUrl);
    if (!response.ok) throw new Error('fetch failed');
    const worldJson = await response.json();
    echarts.registerMap('world', worldJson);
  } catch (e) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#6b6e75;font-size:14px">地图数据加载中…请稍候</div>';
    // Retry once after 2s
    setTimeout(() => initGlobe(containerId), 2000);
    return;
  }

  const chart = echarts.init(container);
  globeChartInstance = chart;

  // Build data
  const countryStats = TERROR_DATA.countryStats || [];
  const maxAttacks = countryStats[0]?.attacks || 1;

  const scatterData = countryStats.filter(c => COUNTRY_COORDS[c.name]).map(c => ({
    name: c.name,
    value: [...COUNTRY_COORDS[c.name], c.attacks],
    attacks: c.attacks,
    killed: c.killed,
    injured: c.injured,
    region: c.region
  }));

  // EffectScatter for top countries (glowing pulse)
  const effectData = scatterData.filter(d => d.attacks >= 15);
  const normalData = scatterData.filter(d => d.attacks < 15);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10,13,18,0.95)',
      borderColor: P_MAP.border,
      textStyle: { color: P_MAP.text, fontSize: 13 },
      formatter: function(p) {
        if (!p.data || !p.data.attacks) return '';
        return `<div style="font-weight:600;color:${P_MAP.redLt};margin-bottom:4px">${p.data.name}</div>
          <div>袭击 <b>${p.data.attacks}</b> 次</div>
          <div>死亡 <b style="color:${P_MAP.red}">${p.data.killed}</b> · 受伤 <b style="color:${P_MAP.redPale}">${p.data.injured}</b></div>`;
      }
    },
    geo: {
      map: 'world',
      roam: false, // scroll-driven story controls zoom/center; roam would hijack page scroll
      zoom: 1.5,
      center: [55, 25], // Center on Middle East / South Asia
      silent: false,
      itemStyle: {
        areaColor: P_MAP.land,
        borderColor: P_MAP.border,
        borderWidth: 0.8
      },
      emphasis: {
        itemStyle: {
          areaColor: '#243050'
        },
        label: { show: false }
      },
      label: { show: false },
      scaleLimit: { min: 1, max: 10 }
    },
    series: [
      // Glowing effect for major hotspots
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: effectData,
        symbolSize: function(val) {
          return Math.sqrt(val[2] / maxAttacks) * 36 + 8;
        },
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke',
          scale: 3,
          period: 4
        },
        itemStyle: {
          color: P_MAP.red,
          shadowBlur: 20,
          shadowColor: 'rgba(194,48,40,0.5)'
        },
        zlevel: 2
      },
      // Static dots for smaller countries
      {
        type: 'scatter',
        coordinateSystem: 'geo',
        data: normalData,
        symbolSize: function(val) {
          return Math.sqrt(val[2] / maxAttacks) * 28 + 5;
        },
        itemStyle: {
          color: P_MAP.redDk,
          opacity: 0.8,
          borderColor: P_MAP.red,
          borderWidth: 1
        },
        emphasis: {
          itemStyle: {
            color: P_MAP.redLt,
            shadowBlur: 15,
            shadowColor: 'rgba(194,48,40,0.6)'
          },
          scale: 1.5
        },
        zlevel: 1
      }
    ]
  };

  // Bubble-size legend so circle area is interpretable (radius matches the
  // effectScatter formula: sqrt(attacks / maxAttacks) * 36 + 8).
  const legendVals = [maxAttacks, Math.max(2, Math.round(maxAttacks * 0.4)), Math.max(1, Math.round(maxAttacks * 0.1))];
  const radOf = v => (Math.sqrt(v / maxAttacks) * 36 + 8) / 2;
  const maxR = radOf(legendVals[0]);
  const titleY = 0, topY = 18, baseY = 18 + 2 * maxR; // circles span topY..baseY
  const legendChildren = [{
    type: 'text', x: 0, y: titleY,
    style: { text: '袭击次数', fill: P_MAP.text, font: '600 11px sans-serif' }
  }];
  let cx = maxR;
  legendVals.forEach(v => {
    const r = radOf(v);
    legendChildren.push({
      type: 'circle', shape: { cx: cx, cy: baseY - r, r: r },
      style: { fill: 'rgba(194,48,40,0.18)', stroke: P_MAP.red, lineWidth: 1 }
    });
    legendChildren.push({
      type: 'text', x: cx, y: baseY + 6,
      style: { text: String(v), fill: P_MAP.text, font: '10px sans-serif', align: 'center' }
    });
    cx += 2 * maxR + 16;
  });
  option.graphic = [{
    type: 'group', left: 24, top: 22, children: legendChildren
  }];

  chart.setOption(option);

  // Click a country dot → surface its single deadliest event (uses the global
  // detail panel defined in index.html). Falls back silently if raw is absent.
  const worstByCountry = {};
  (TERROR_DATA.raw || []).forEach(d => {
    const cur = worstByCountry[d.country];
    if (!cur || (d.killed + d.injured) > (cur.killed + cur.injured)) worstByCountry[d.country] = d;
  });
  chart.on('click', p => {
    if (!p.data || !p.data.name) return;
    const e = worstByCountry[p.data.name];
    if (e && typeof window.showEventDetail === 'function') window.showEventDetail(e);
  });

  // Wire up scroll-driven story (sticky map flies to each hotspot region)
  setupMapStory(chart, effectData, normalData);

  // Resize handler
  window.addEventListener('resize', () => {
    if (globeChartInstance) globeChartInstance.resize();
  });
  const resizeObs = new ResizeObserver(() => {
    if (globeChartInstance) globeChartInstance.resize();
  });
  resizeObs.observe(container);
}

// Scrollytelling: as the user scrolls past each step, fly the sticky map to a
// region and dim everything else, with a big annotation. Driven by the
// 'storystate' events dispatched by ScrollEngine.setupStickySections().
function setupMapStory(chart, effectData, normalData) {
  const anno = document.getElementById('map-anno');
  const STATES = {
    'map-intro': { center: [30, 18], zoom: 1.05, focus: null, title: '', sub: '' },
    'map-sasia': { center: [80, 24], zoom: 2.4, focus: { region: 'South Asia' }, title: '南亚 · 314起', sub: '占全球45%' },
    'map-mena':  { center: [44, 28], zoom: 2.4, focus: { region: 'Middle East & North Africa' }, title: '中东与北非 · 167起', sub: '' },
    'map-ssa':   { center: [22, 2],  zoom: 2.0, focus: { region: 'Sub-Saharan Africa' }, title: '撒哈拉以南非洲 · 155起', sub: '' },
    'map-afg':   { center: [66, 34], zoom: 4.5, focus: { country: 'Afghanistan' }, title: '阿富汗 · 234起', sub: '一国占全球1/3' }
  };
  const emph = (d, f) => {
    if (!f) return 1;
    if (f.country) return d.name === f.country ? 1 : 0.08;
    return d.region === f.region ? 1 : 0.08;
  };
  // Smoothly tween geo center/zoom (ECharts doesn't animate these on setOption)
  let cur = { center: [30, 18], zoom: 1.05 };
  let raf = null;
  function flyTo(target) {
    if (raf) cancelAnimationFrame(raf);
    const from = { center: cur.center.slice(), zoom: cur.zoom };
    const t0 = (window.performance || Date).now();
    const dur = 900;
    function frame(now) {
      const k = Math.min(((window.performance || Date).now() - t0) / dur, 1);
      // easeInOutCubic — smooth acceleration and deceleration
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const center = [from.center[0] + (target.center[0] - from.center[0]) * e,
                      from.center[1] + (target.center[1] - from.center[1]) * e];
      // geometric interpolation keeps the visual zoom rate constant (no fast-then-slow lurch)
      const zoom = from.zoom * Math.pow(target.zoom / from.zoom, e);
      chart.setOption({ geo: { center: center, zoom: zoom } });
      cur = { center: center, zoom: zoom };
      if (k < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
  }
  function apply(id) {
    const s = STATES[id];
    if (!s) return;
    const ed = effectData.map(d => ({ ...d, itemStyle: {
      color: P_MAP.red, shadowBlur: 20, shadowColor: 'rgba(194,48,40,0.5)', opacity: emph(d, s.focus) } }));
    const nd = normalData.map(d => ({ ...d, itemStyle: {
      color: P_MAP.redDk, borderColor: P_MAP.red, borderWidth: 1, opacity: 0.8 * emph(d, s.focus) } }));
    chart.setOption({ series: [{ data: ed }, { data: nd }] });
    flyTo(s);
    if (anno) {
      if (s.title) {
        anno.style.opacity = '1';
        anno.innerHTML = '<div class="a-title">' + s.title + '</div>' + (s.sub ? '<div class="a-sub">' + s.sub + '</div>' : '');
      } else {
        anno.style.opacity = '0';
      }
    }
  }
  window.addEventListener('storystate', e => {
    if (e.detail && e.detail.section === 'sec-map') apply(e.detail.state);
  });
  apply('map-intro');
}
