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

  // Y axis now encodes a REAL variable — single-event casualties (killed + injured).
  // X keeps the date order but gets a small deterministic-ish jitter so same-day
  // attacks fan out instead of stacking on one vertical line.
  const scatterData = raw.map(d => {
    const cas = d.killed + d.injured;
    const jitter = (Math.random() - 0.5) * 0.72; // horizontal spread within the day
    return {
      value: [dateMap[d.date] + jitter, cas, Math.max(cas, 1),
        d.country, d.attackType, d.killed, d.injured, d.date, d.region]
    };
  });
  const maxCas = Math.max(...scatterData.map(s => s.value[1]), 1);

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
    grid: { left: 56, right: 30, top: 24, bottom: 60 },
    xAxis: {
      type: 'value', min: -0.5, max: dateSet.length - 0.5,
      interval: 3,
      axisLine: { lineStyle: { color: P.border } },
      axisLabel: {
        color: P.dim, fontSize: 11,
        formatter: v => { const d = dateSet[Math.round(v)]; return d ? d.substring(5) : ''; }
      },
      axisTick: { show: false },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value', show: true, min: 0,
      name: '单次伤亡 (死+伤)', nameTextStyle: { color: P.dim, fontSize: 11, align: 'left' },
      nameGap: 14, nameLocation: 'end',
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: P.dim, fontSize: 10 },
      splitLine: { lineStyle: { color: P.border, type: 'dashed', opacity: 0.4 } }
    },
    dataZoom: [
      { type: 'slider', height: 20, bottom: 4, borderColor: P.border,
        backgroundColor: P.card, fillerColor: 'rgba(194,48,40,0.1)',
        handleStyle: { color: P.red3 }, textStyle: { color: P.dim },
        dataBackground: { lineStyle: { color: P.red2, opacity: 0.3 }, areaStyle: { color: P.red2, opacity: 0.08 } }
      }
      // NOTE: no { type:'inside' } — wheel must scroll the page, not zoom the chart
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
  chart.__scatterData = scatterData; // expose for scroll-driven story
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

  // Aggregate links by attack count so edge thickness encodes how often a group
  // struck in a given country (previously every edge was rendered identically).
  const linkCount = {};
  raw.forEach(d => {
    if (d.perpetrator === 'Unknown' || !d.perpetrator) return;
    const hasPer = perpData.find(p => p[0] === d.perpetrator);
    const hasCou = countryData.find(c => c.name === d.country);
    if (hasPer && hasCou) {
      const key = d.perpetrator + '→' + d.country;
      linkCount[key] = (linkCount[key] || 0) + 1;
    }
  });
  const maxLink = Math.max(1, ...Object.values(linkCount));
  const links = Object.keys(linkCount).map(key => {
    const [source, target] = key.split('→');
    const n = linkCount[key];
    return {
      source, target, value: n,
      lineStyle: { width: 1 + Math.sqrt(n) * 1.4, opacity: 0.18 + 0.5 * (n / maxLink) }
    };
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
        if (p.dataType === 'edge') return `<span style="color:${P.dim}">${p.data.source} → ${p.data.target}</span><div style="margin-top:3px">在该国发动 <b style="color:${P.red4}">${p.data.value}</b> 次袭击</div>`;
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
      type: 'graph', layout: 'force', roam: 'move', draggable: true,
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
// 6. CASUALTY TREND — daily killed/injured area with peak annotation
// ============================================================
function createTrendChart(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const chart = echarts.init(el);
  const dc = TERROR_DATA.dailyCasualties;
  const dates = dc.map(d => d.date.substring(5));
  const killed = dc.map(d => d.killed);
  const injured = dc.map(d => d.injured);

  // Find the deadliest day to annotate
  let peakIdx = 0;
  dc.forEach((d, i) => { if (d.killed > dc[peakIdx].killed) peakIdx = i; });
  const peak = dc[peakIdx];

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,13,18,0.95)', borderColor: P.border,
      textStyle: { color: P.text, fontSize: 13 },
      formatter: params => {
        const i = params[0].dataIndex;
        return `<div style="font-weight:600;color:${P.red4};margin-bottom:4px">2020-${dc[i].date.substring(5)}</div>
          <div>袭击 <b>${dc[i].count}</b> 起</div>
          <div>死亡 <b style="color:${P.red3}">${dc[i].killed}</b> · 受伤 <b style="color:${P.red5}">${dc[i].injured}</b></div>`;
      }
    },
    legend: { data: ['死亡', '受伤'], textStyle: { color: P.dim }, top: 0, right: 0 },
    grid: { left: 44, right: 20, top: 36, bottom: 40 },
    xAxis: {
      type: 'category', data: dates, boundaryGap: false,
      axisLine: { lineStyle: { color: P.border } },
      axisLabel: { color: P.dim, fontSize: 10, interval: 3 },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: P.dim, fontSize: 10 },
      splitLine: { lineStyle: { color: P.border, type: 'dashed', opacity: 0.4 } }
    },
    series: [
      {
        name: '死亡', type: 'line', smooth: true, data: killed,
        symbol: 'circle', symbolSize: 4, showSymbol: false,
        lineStyle: { color: P.red3, width: 2 },
        itemStyle: { color: P.red3 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(194,48,40,0.45)' }, { offset: 1, color: 'rgba(194,48,40,0.02)' }]) },
        markPoint: {
          symbol: 'pin', symbolSize: 46, data: [{ coord: [peakIdx, peak.killed], value: peak.killed }],
          itemStyle: { color: P.red4 },
          label: { color: '#fff', fontSize: 11, fontWeight: 600 }
        },
        markLine: {
          silent: true, symbol: 'none',
          lineStyle: { color: P.red4, type: 'dashed', opacity: 0.5 },
          label: { color: P.red5, fontSize: 10, formatter: `${peak.date.substring(5)} 单日 ${peak.killed} 人遇难` },
          data: [{ xAxis: peakIdx }]
        },
        z: 3
      },
      {
        name: '受伤', type: 'line', smooth: true, data: injured,
        symbol: 'circle', symbolSize: 4, showSymbol: false,
        lineStyle: { color: P.red5, width: 1.6, opacity: 0.85 },
        itemStyle: { color: P.red5 },
        areaStyle: { color: 'rgba(245,168,160,0.06)' },
        z: 2
      }
    ]
  });
  return chart;
}

// ============================================================
// 7. ATTACK TYPE — distribution bar (primary method)
// ============================================================
function createAttackTypeChart(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const chart = echarts.init(el);
  const types = TERROR_DATA.attackTypes.filter(t => t[0] !== 'Unknown').slice(0, 7);
  const total = TERROR_DATA.summary.totalAttacks;
  const names = types.map(t => ATTACK_CN[t[0]] || t[0]).reverse();
  const values = types.map(t => t[1]).reverse();
  const maxVal = Math.max(...values);

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10,13,18,0.95)', borderColor: P.border,
      textStyle: { color: P.text, fontSize: 13 },
      formatter: params => {
        const p = params[0];
        const pct = (p.value / total * 100).toFixed(1);
        return `<div style="font-weight:600;color:${P.red4}">${p.name}</div>
          <div style="margin-top:4px">${p.value} 起 (${pct}%)</div>`;
      }
    },
    grid: { left: 96, right: 56, top: 10, bottom: 10 },
    xAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: P.dim, fontSize: 11 },
      splitLine: { lineStyle: { color: P.border, type: 'dashed' } } },
    yAxis: { type: 'category', data: names,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: P.text, fontSize: 12 } },
    series: [{
      type: 'bar', barMaxWidth: 20,
      data: values.map(v => ({ value: v, itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: P.red1 }, { offset: 1, color: v / maxVal > 0.5 ? P.red3 : P.red2 }]),
        borderRadius: [0, 4, 4, 0] } })),
      emphasis: { itemStyle: { color: P.red4 } },
      label: { show: true, position: 'right', color: P.dim, fontSize: 12,
        formatter: p => `${p.value}  (${(p.value / total * 100).toFixed(0)}%)` },
      animationDuration: 1100, animationDelay: i => i * 110, animationEasing: 'cubicOut'
    }]
  });
  return chart;
}

// ============================================================
// 8. LETHALITY — most frequent vs most deadly (deaths per attack)
// ============================================================
function createLethalityChart(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const chart = echarts.init(el);
  // Compare attack methods: frequency (bar) vs deaths-per-attack (line)
  const order = ['Bombing/Explosion', 'Armed Assault', 'Assassination',
    'Hostage Taking (Kidnapping)', 'Facility/Infrastructure Attack'];
  const byType = {};
  TERROR_DATA.lethalByType.forEach(d => byType[d.name] = d);
  const rows = order.filter(n => byType[n]).map(n => byType[n]);
  const names = rows.map(d => ATTACK_CN[d.name] || d.name);
  const freq = rows.map(d => d.attacks);
  const lethal = rows.map(d => d.perAttack);

  chart.setOption({
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(10,13,18,0.95)', borderColor: P.border,
      textStyle: { color: P.text, fontSize: 13 },
      formatter: params => {
        const i = params[0].dataIndex;
        return `<div style="font-weight:600;color:${P.red4}">${names[i]}</div>
          <div style="margin-top:4px">发生 <b>${freq[i]}</b> 起</div>
          <div>平均每起致死 <b style="color:${P.warm}">${lethal[i]}</b> 人</div>`;
      }
    },
    legend: { data: ['袭击次数', '每起致死人数'], textStyle: { color: P.dim }, top: 0 },
    grid: { left: 48, right: 52, top: 40, bottom: 50 },
    xAxis: { type: 'category', data: names,
      axisLine: { lineStyle: { color: P.border } },
      axisLabel: { color: P.dim, fontSize: 11, interval: 0, rotate: 0,
        formatter: v => v.length > 4 ? v.slice(0, 4) + '\n' + v.slice(4) : v },
      axisTick: { show: false } },
    yAxis: [
      { type: 'value', name: '次数', nameTextStyle: { color: P.dim, fontSize: 10 },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: P.dim, fontSize: 10 },
        splitLine: { lineStyle: { color: P.border, type: 'dashed', opacity: 0.4 } } },
      { type: 'value', name: '人/起', nameTextStyle: { color: P.warm, fontSize: 10 },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: P.warm, fontSize: 10 }, splitLine: { show: false } }
    ],
    series: [
      { name: '袭击次数', type: 'bar', yAxisIndex: 0, data: freq, barMaxWidth: 38,
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: P.red3 }, { offset: 1, color: P.red1 }]), borderRadius: [4, 4, 0, 0] },
        animationDuration: 1000 },
      { name: '每起致死人数', type: 'line', yAxisIndex: 1, data: lethal,
        smooth: true, symbol: 'circle', symbolSize: 9,
        lineStyle: { color: P.warm, width: 2.5 },
        itemStyle: { color: P.warm, borderColor: P.bg, borderWidth: 2 },
        label: { show: true, position: 'top', color: P.warm, fontSize: 12, fontWeight: 600,
          formatter: p => p.value },
        z: 5, animationDuration: 1400 }
    ]
  });
  return chart;
}

// ============================================================
// SCROLLYTELLING handlers — driven by 'storystate' events
// ============================================================
function setupTrendStory(chart) {
  if (!chart) return;
  const dc = TERROR_DATA.dailyCasualties;
  let peakIdx = 0;
  dc.forEach((d, i) => { if (d.killed > dc[peakIdx].killed) peakIdx = i; });
  const peak = dc[peakIdx];
  const injured = dc.map(d => d.injured);
  const mp = { symbol: 'pin', symbolSize: 46, data: [{ coord: [peakIdx, peak.killed], value: peak.killed }],
    itemStyle: { color: P.red4 }, label: { color: '#fff', fontSize: 11, fontWeight: 600 } };
  const ml = { silent: true, symbol: 'none', lineStyle: { color: P.red4, type: 'dashed', opacity: 0.5 },
    label: { color: P.red5, fontSize: 10, formatter: `${peak.date.substring(5)} 单日 ${peak.killed} 人遇难` }, data: [{ xAxis: peakIdx }] };
  const STATES = {
    'trend-intro':   { series: [{ markPoint: { data: [] }, markLine: { data: [] } }, { data: [] }] },
    'trend-peak':    { series: [{ markPoint: mp, markLine: ml }, { data: [] }] },
    'trend-injured': { series: [{ markPoint: mp, markLine: ml }, { data: injured }] }
  };
  window.addEventListener('storystate', e => {
    if (e.detail && e.detail.section === 'sec-trend' && STATES[e.detail.state]) chart.setOption(STATES[e.detail.state]);
  });
  chart.setOption(STATES['trend-intro']);
}

function setupLethalityStory(chart) {
  if (!chart) return;
  const order = ['Bombing/Explosion', 'Armed Assault', 'Assassination',
    'Hostage Taking (Kidnapping)', 'Facility/Infrastructure Attack'];
  const byType = {};
  TERROR_DATA.lethalByType.forEach(d => byType[d.name] = d);
  const rows = order.filter(n => byType[n]).map(n => byType[n]);
  const freq = rows.map(d => d.attacks);
  const lethal = rows.map(d => d.perAttack);
  const dimBars = freq.map((v, i) => ({ value: v, itemStyle: { opacity: i < 2 ? 1 : 0.22 } }));
  const STATES = {
    'leth-freq':     { series: [{ data: freq }, { data: [] }] },
    'leth-deadly':   { series: [{ data: freq }, { data: lethal }] },
    'leth-contrast': { series: [{ data: dimBars }, { data: lethal }] }
  };
  window.addEventListener('storystate', e => {
    if (e.detail && e.detail.section === 'sec-leth' && STATES[e.detail.state]) chart.setOption(STATES[e.detail.state]);
  });
  chart.setOption(STATES['leth-freq']);
}

function setupEmberStory(chart) {
  if (!chart || !chart.__scatterData) return;
  const data = chart.__scatterData;
  const dc = TERROR_DATA.dailyCasualties;
  let peak = dc[0];
  dc.forEach(d => { if (d.killed > peak.killed) peak = d; });
  const peakDate = peak.date;
  const withOpacity = fn => ({ series: [{ data: data.map(d => ({ value: d.value, itemStyle: { opacity: fn(d.value) } })) }] });
  const STATES = {
    'ember-all':    withOpacity(() => 0.8),
    'ember-severe': withOpacity(v => v[2] >= 10 ? 0.92 : 0.05),
    'ember-peak':   withOpacity(v => v[7] === peakDate ? 1 : 0.04)
  };
  window.addEventListener('storystate', e => {
    if (e.detail && e.detail.section === 'sec-ember' && STATES[e.detail.state]) chart.setOption(STATES[e.detail.state]);
  });
  chart.setOption(STATES['ember-all']);
}

function setupForceStory(chart) {
  if (!chart) return;
  const FOCUS = {
    'force-intro': null,
    'force-taliban': 'Taliban',
    'force-isil': 'Islamic State of Iraq and the Levant (ISIL)'
  };
  function apply(id) {
    chart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
    const name = FOCUS[id];
    if (name) chart.dispatchAction({ type: 'highlight', seriesIndex: 0, name: name });
  }
  window.addEventListener('storystate', e => {
    if (e.detail && e.detail.section === 'sec-force' && (e.detail.state in FOCUS)) apply(e.detail.state);
  });
  apply('force-intro');
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
