// ============================================================
// V3 Charts — Monochrome Red + Warm Gray Palette
// ============================================================

// Restricted palette: reds + grays only
const P = {
  bg: '#0a0d12', card: '#12151b', border: '#1e2128',
  text: '#d8d5d0', dim: '#6b6e75', faint: '#3a3d44',
  red1: '#3a0c0a', red2: '#6b1a16', red3: '#c23028',
  red4: '#e85d4a', red5: '#f5a8a0',
  warm: '#d4a54a' // sparingly
};

const ATTACK_CN = {
  'Armed Assault':'武装袭击','Bombing/Explosion':'爆炸袭击',
  'Assassination':'暗杀','Hostage Taking (Kidnapping)':'绑架',
  'Facility/Infrastructure Attack':'设施攻击','Unknown':'未知',
  'Unarmed Assault':'徒手袭击','Hijacking':'劫持'
};
const TARGET_CN = {
  'Private Citizens & Property':'平民及财产','Military':'军事目标',
  'Police':'警察','Government (General)':'政府机构',
  'Business':'商业目标','Unknown':'未知',
  'Terrorists/Non-state Militia':'民兵组织',
  'Religious Figures/Institutions':'宗教机构',
  'Utilities':'公共设施','Educational Institution':'教育机构'
};

// ============================================================
// 1. FALLING EMBERS — Monochrome red scatter
// ============================================================
function createEmberChart(containerId) {
  const chart = echarts.init(document.getElementById(containerId));
  const raw = TERROR_DATA.raw;
  const dateSet = [...new Set(raw.map(d => d.date))].sort();
  const dateMap = {};
  dateSet.forEach((d, i) => dateMap[d] = i);

  const scatterData = raw.map(d => {
    const cas = d.killed + d.injured;
    return {
      value: [dateMap[d.date], Math.random()*90+5, Math.max(cas,1),
        d.country, d.attackType, d.killed, d.injured, d.date, d.region]
    };
  });

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10,13,18,0.95)',
      borderColor: P.border,
      textStyle: { color: P.text, fontSize: 13 },
      formatter: p => {
        const v = p.value;
        return `<div style="font-weight:600;color:${P.red4};margin-bottom:4px">${v[7]}</div>
          <div style="color:${P.dim}">${v[3]} · ${v[8]}</div>
          <div style="margin-top:6px">${ATTACK_CN[v[4]]||v[4]}</div>
          <div style="margin-top:4px">死亡 <b style="color:${P.red3}">${v[5]}</b> · 受伤 <b style="color:${P.red5}">${v[6]}</b></div>`;
      }
    },
    grid: { left: 50, right: 30, top: 20, bottom: 60 },
    xAxis: {
      type: 'category', data: dateSet.map(d => d.substring(5)),
      axisLine: { lineStyle: { color: P.border } },
      axisLabel: { color: P.dim, fontSize: 11, interval: 3 },
      axisTick: { show: false }
    },
    yAxis: { type: 'value', show: false, min: 0, max: 100 },
    dataZoom: [
      { type: 'slider', height: 20, bottom: 4, borderColor: P.border,
        backgroundColor: P.card, fillerColor: 'rgba(194,48,40,0.1)',
        handleStyle: { color: P.red3 }, textStyle: { color: P.dim },
        dataBackground: { lineStyle: { color: P.red2, opacity: 0.3 }, areaStyle: { color: P.red2, opacity: 0.08 } }
      },
      { type: 'inside' }
    ],
    series: [{
      type: 'scatter', data: scatterData,
      symbolSize: val => Math.sqrt(val[2]) * 3.5 + 3,
      itemStyle: {
        color: p => {
          const cas = p.value[2];
          const t = Math.min(cas / 30, 1);
          // Low casualties: dim red, high: bright red
          const r = Math.round(60 + t * 134);
          const g = Math.round(26 - t * 10);
          const b = Math.round(22 - t * 6);
          return `rgb(${r},${g},${b})`;
        },
        opacity: 0.8,
        shadowBlur: 10,
        shadowColor: 'rgba(194,48,40,0.25)'
      },
      emphasis: {
        itemStyle: { opacity: 1, shadowBlur: 25, shadowColor: 'rgba(232,93,74,0.6)', borderColor: P.red5, borderWidth: 1 },
        scale: 1.6
      },
      animationDelay: idx => idx * 6,
      animationDuration: 500
    }]
  });
  return chart;
}

// ============================================================
// 2. ISOTYPE — Human figures (reuse from v2 engine)
// ============================================================
function buildIsotype(containerId, total, perIcon, color, label) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const count = Math.ceil(total / perIcon);
  const cols = Math.min(Math.ceil(Math.sqrt(count * 1.8)), 32);
  const svg = `<svg viewBox="0 0 20 36" width="14" height="26"><circle cx="10" cy="5" r="4.5" fill="currentColor"/><path d="M5,12 Q5,10 7,10 H13 Q15,10 15,12 L14,24 H11 L10.5,35 H9.5 L9,24 H6 Z" fill="currentColor"/></svg>`;

  let html = `<div class="isotype-grid stagger-parent" style="grid-template-columns:repeat(${cols},1fr)">`;
  for (let i = 0; i < count; i++) {
    html += `<div class="isotype-icon stagger-child" style="color:${color}">${svg}</div>`;
  }
  html += '</div>';
  html += `<div class="isotype-label">${svg.replace(/currentColor/g, color)} = ${perIcon}人 · 共 <strong style="color:${color}">${total.toLocaleString()}</strong> ${label}</div>`;
  el.innerHTML = html;
}

// ============================================================
// 3. WEAPON VISUALIZATION — Icon-based infographic
// ============================================================
function buildWeaponViz(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const data = TERROR_DATA.weaponTypes;
  const total = data.reduce((s, d) => s + d[1], 0);

  const WEAPON_CN = {
    'Explosives':'爆炸物','Firearms':'枪械','Unknown':'未知',
    'Incendiary':'纵火装置','Melee':'冷兵器','Sabotage Equipment':'破坏设备'
  };

  // SVG weapon icons (simplified silhouettes)
  const WEAPON_ICONS = {
    'Explosives': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="24" cy="28" r="14"/><path d="M24 14V6M20 8l4-4 4 4"/><path d="M18 22c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke-dasharray="3 2"/></svg>`,
    'Firearms': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 18h32l4 4v4H28l-2 10h-4l-2-10H8v-4z"/><rect x="36" y="16" width="8" height="4" rx="1"/><path d="M14 26v6"/></svg>`,
    'Unknown': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="24" cy="24" r="16"/><path d="M18 18c0-3.3 2.7-6 6-6s6 2.7 6 6c0 3-2 4-4 5v3"/><circle cx="24" cy="34" r="1.5" fill="currentColor"/></svg>`,
    'Incendiary': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M24 4c0 8-10 14-10 24a14 14 0 0028 0C42 18 24 12 24 4z"/><path d="M20 32c0-4 4-7 4-12 0 5 4 8 4 12a4 4 0 01-8 0z"/></svg>`,
    'Melee': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 34L34 14M34 14l-6 1 1-6M14 34l-4 4M10 38l4-1-1 4"/></svg>`,
    'Sabotage Equipment': `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M28 4l-4 12h8l-4 12"/><circle cx="24" cy="36" r="8"/><path d="M20 36h8M24 32v8"/></svg>`
  };

  let html = '';
  data.forEach((d, i) => {
    const name = d[0];
    const count = d[1];
    const pct = (count / total * 100).toFixed(1);
    const barWidth = (count / data[0][1] * 100);
    const opacity = 1 - i * 0.12;

    html += `<div class="weapon-row reveal">
      <div class="weapon-icon" style="opacity:${opacity}">${WEAPON_ICONS[name] || WEAPON_ICONS['Unknown']}</div>
      <div class="weapon-info">
        <div class="weapon-name">${WEAPON_CN[name] || name}<span class="weapon-en">${name}</span></div>
        <div class="weapon-bar-track">
          <div class="weapon-bar-fill" style="width:${barWidth}%;opacity:${opacity}"></div>
        </div>
        <div class="weapon-stats">${count} 次使用 · ${pct}%</div>
      </div>
    </div>`;
  });

  el.innerHTML = html;
}

// ============================================================
// 4. FORCE NETWORK — Enhanced perpetrator-country graph
// ============================================================
function createForceChart(containerId) {
  const chart = echarts.init(document.getElementById(containerId));
  const raw = TERROR_DATA.raw;
  const countryData = TERROR_DATA.countryStats.slice(0, 12);
  const perpData = TERROR_DATA.perpetrators.slice(0, 8);

  const links = [];
  const linkSet = new Set();
  raw.forEach(d => {
    if (d.perpetrator === 'Unknown' || !d.perpetrator) return;
    const hasPer = perpData.find(p => p[0] === d.perpetrator);
    const hasCou = countryData.find(c => c.name === d.country);
    if (hasPer && hasCou) {
      const key = d.perpetrator + '→' + d.country;
      if (!linkSet.has(key)) { linkSet.add(key); links.push({ source: d.perpetrator, target: d.country }); }
    }
  });

  const countryNodes = countryData.map(c => ({
    name: c.name, value: c.attacks,
    symbolSize: Math.sqrt(c.attacks) * 4.5 + 10,
    category: 0,
    itemStyle: { color: P.dim, borderColor: P.faint, borderWidth: 1 },
    label: { show: c.attacks > 20, fontSize: 11, color: P.text }
  }));

  const perpNodes = perpData.map(p => ({
    name: p[0], value: p[1],
    symbolSize: Math.sqrt(p[1]) * 4 + 8,
    category: 1,
    itemStyle: { color: P.red3, borderColor: P.red4, borderWidth: 2,
      shadowBlur: 15, shadowColor: 'rgba(194,48,40,0.3)' },
    label: { show: p[1] > 15, fontSize: 10, color: P.red5 }
  }));

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: 'rgba(10,13,18,0.95)', borderColor: P.border,
      textStyle: { color: P.text },
      formatter: p => {
        if (p.dataType === 'edge') return `<span style="color:${P.dim}">${p.data.source} → ${p.data.target}</span>`;
        const type = p.data.category === 0 ? '国家' : '恐怖组织';
        const col = p.data.category === 0 ? P.text : P.red4;
        return `<div style="font-weight:600;color:${col}">${p.name}</div>
          <div style="margin-top:4px;color:${P.dim}">${type} · 袭击 <b>${p.value}</b> 次</div>`;
      }
    },
    legend: {
      data: ['国家/地区', '恐怖组织'], textStyle: { color: P.dim }, top: 10
    },
    series: [{
      type: 'graph', layout: 'force', roam: true, draggable: true,
      categories: [
        { name: '国家/地区', itemStyle: { color: P.dim } },
        { name: '恐怖组织', itemStyle: { color: P.red3 } }
      ],
      nodes: [...countryNodes, ...perpNodes],
      links: links,
      force: { repulsion: 350, gravity: 0.08, edgeLength: [80, 220], layoutAnimation: true },
      lineStyle: { color: 'rgba(194,48,40,0.15)', width: 1.5, curveness: 0.2 },
      label: { color: P.text, fontSize: 11 },
      emphasis: {
        focus: 'adjacency',
        lineStyle: { color: P.red4, width: 3 },
        itemStyle: { shadowBlur: 25, shadowColor: 'rgba(194,48,40,0.5)' }
      },
      animationDuration: 2000
    }]
  });
  return chart;
}

// ============================================================
// 5. TARGET — Elegant horizontal bar with gradient
// ============================================================
function createTargetChart(containerId) {
  const chart = echarts.init(document.getElementById(containerId));
  const targets = TERROR_DATA.targets.slice(0, 8);
  const maxVal = targets[0][1];

  const names = targets.map(t => TARGET_CN[t[0]] || t[0]).reverse();
  const values = targets.map(t => t[1]).reverse();

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10,13,18,0.95)',
      borderColor: P.border,
      textStyle: { color: P.text, fontSize: 13 },
      formatter: function(params) {
        const p = params[0];
        const pct = (p.value / TERROR_DATA.summary.totalAttacks * 100).toFixed(1);
        return `<div style="font-weight:600;color:${P.red4}">${p.name}</div>
          <div style="margin-top:4px">被攻击 <b>${p.value}</b> 次 (${pct}%)</div>`;
      }
    },
    grid: { left: 120, right: 60, top: 20, bottom: 20 },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: P.dim, fontSize: 11 },
      splitLine: { lineStyle: { color: P.border, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: P.text, fontSize: 12, width: 100, overflow: 'truncate' }
    },
    series: [{
      type: 'bar',
      data: values.map((v, i) => {
        const t = v / maxVal;
        return {
          value: v,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: P.red1 },
              { offset: 1, color: t > 0.5 ? P.red3 : P.red2 }
            ]),
            borderRadius: [0, 4, 4, 0]
          }
        };
      }),
      barMaxWidth: 22,
      barGap: '30%',
      emphasis: {
        itemStyle: { color: P.red4, shadowBlur: 12, shadowColor: 'rgba(194,48,40,0.3)' }
      },
      label: {
        show: true,
        position: 'right',
        color: P.dim,
        fontSize: 12,
        formatter: function(p) {
          const pct = (p.value / TERROR_DATA.summary.totalAttacks * 100).toFixed(0);
          return `${p.value}  (${pct}%)`;
        }
      },
      animationDuration: 1200,
      animationDelay: function(i) { return i * 120; },
      animationEasing: 'cubicOut'
    }]
  });
  return chart;
}

// ============================================================
// Resize all charts
// ============================================================
function setupChartResize() {
  let t;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      document.querySelectorAll('[id^="chart-"]').forEach(el => {
        const inst = echarts.getInstanceByDom(el);
        if (inst) inst.resize();
      });
    }, 200);
  });
}
