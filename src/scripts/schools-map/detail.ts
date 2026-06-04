// Detail scene renderer (single school or region).
// Renders the scene's Features onto the map + wires the shared shell controls.
import { L } from './leaflet-global';
import { createMap, buildBaseRow, buildSwitcher, wireToggle, wireFullscreen, attachHoverLabel, disableMapDragOn, esc, mapsLink } from './shell';
import type { SchoolsMapScene, CollegeTimelineFeature, PointLayerFeature, ZoneFeature, TransitFeature, CommuteFeature } from '../../data/schools-map/types';

const ERAS = [
  { key: 'medieval', label: '中世纪', color: '#4338ca', max: 1448 },
  { key: 'tudor', label: '都铎–斯图亚特', color: '#0d9488', max: 1700 },
  { key: 'georgian', label: '乔治–维多利亚', color: '#d97706', max: 1900 },
  { key: 'modern', label: '现代', color: '#e11d48', max: Infinity },
];
const eraOf = (y: number) => ERAS.find((e) => y <= e.max) || ERAS[ERAS.length - 1];
const $ = (id: string): any => document.getElementById(id);

export function mountDetail(scene: SchoolsMapScene, scenes: any[] = []) {
  const wrap = $('smap-wrap');
  const { map, setBase } = createMap('smap-map', scene.center, scene.zoom);
  buildSwitcher($('smap-switch'), scenes, scene.id, '/tools/schools-map');
  wireFullscreen($('smap-fullscreen'), wrap, map);

  const colleges = scene.features.find((f) => f.kind === 'collegeTimeline') as CollegeTimelineFeature | undefined;
  const pointLayers = scene.features.filter((f) => f.kind === 'pointLayer') as PointLayerFeature[];
  const zones = scene.features.filter((f) => f.kind === 'zone') as ZoneFeature[];
  const transits = scene.features.filter((f) => f.kind === 'transit') as TransitFeature[];
  const commute = scene.features.find((f) => f.kind === 'commute') as CommuteFeature | undefined;
  const fitPts: [number, number][] = [];

  buildBaseRow($('smap-base-row'), setBase);
  wireToggle($('smap-label-btn'), (active) => wrap && wrap.classList.toggle('show-labels', active));
  const listWrap = $('smap-list-wrap');
  wireToggle($('smap-list-btn'), (active) => listWrap && listWrap.classList.toggle('hidden', !active));
  const listEl = $('smap-list');
  const listTitle = $('smap-list-title');
  const listSub = $('smap-list-sub');

  // ===== colleges (timeline) =====
  if (colleges) {
    const items = colleges.items.slice().sort((a, b) => a.rank - b.rank);
    const byRank = new Map<number, any>();
    const setHot = (rank: number, on: boolean) => {
      const e = byRank.get(rank); if (!e) return;
      if (e.m._icon) e.m._icon.classList.toggle('hot', on);
      e.row.classList.toggle('hot', on);
      e.m.setZIndexOffset(on ? 1000 : 0);
    };
    items.forEach((c) => {
      const era = eraOf(c.year);
      const icon = L.divIcon({ className: 'smap-col-marker', html: `<div class="cm" style="background:${era.color}">${c.rank}</div>`, iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -14] });
      const m = L.marker([c.lat, c.lng], { icon }).addTo(map);
      m.bindTooltip(esc(c.name), { permanent: true, direction: 'right', offset: [15, 0], className: 'smap-mk-label' });
      m.bindPopup(`<div class="smap-pop-name">${esc(c.name)}</div><div class="smap-pop-cn">${esc(c.nameCn)}</div><div class="smap-pop-tag" style="color:${era.color}">${c.year} · ${era.label}</div><div class="smap-pop-note">${esc(c.note || '')}</div>${mapsLink(c.lat, c.lng)}`);
      attachHoverLabel(m);
      m.on('mouseover', () => setHot(c.rank, true));
      m.on('mouseout', () => setHot(c.rank, false));
      fitPts.push([c.lat, c.lng]);
      const row = document.createElement('div');
      row.className = 'smap-li';
      row.innerHTML = `<div class="smap-li-badge" style="background:${era.color}">${c.rank}</div><div class="smap-li-name">${esc(c.name)}<span class="cn">${esc(c.nameCn)}</span></div><div class="smap-li-meta">${c.year}</div>`;
      row.addEventListener('mouseenter', () => setHot(c.rank, true));
      row.addEventListener('mouseleave', () => setHot(c.rank, false));
      row.addEventListener('click', () => { map.flyTo([c.lat, c.lng], 17, { duration: 0.8 }); m.openPopup(); });
      if (listEl) listEl.appendChild(row);
      byRank.set(c.rank, { c, m, row });
    });

    const eraRow = $('smap-era-row');
    if (eraRow) eraRow.innerHTML = ERAS.map((e) => `<span class="smap-legend-item"><span class="sw" style="background:${e.color}"></span>${e.label}</span>`).join('');

    const years = items.map((c) => c.year);
    const minY = Math.min(...years), maxY = Math.max(...years);
    const slider = $('smap-slider'), yEl = $('smap-yr-y'), eraEl = $('smap-yr-era'), cntEl = $('smap-yr-cnt');
    if (slider) { slider.min = String(minY); slider.max = String(maxY); slider.value = String(maxY); }
    const applyYear = (y: number) => {
      let n = 0;
      byRank.forEach(({ c, m, row }) => {
        const vis = c.year <= y; if (vis) n++;
        if (m._icon) { m._icon.style.opacity = vis ? '1' : '0.12'; m._icon.style.pointerEvents = vis ? 'auto' : 'none'; }
        const t = m.getTooltip(); if (t && t._container) t._container.classList.toggle('tl-hidden', !vis);
        row.classList.toggle('dim', !vis);
      });
      const era = eraOf(y);
      if (yEl) yEl.textContent = String(y);
      if (eraEl) { eraEl.textContent = era.label; eraEl.style.color = era.color; }
      if (cntEl) cntEl.textContent = `已建 ${n} / ${items.length} 所`;
    };
    if (slider) slider.addEventListener('input', () => { stopPlay(); applyYear(+slider.value); });

    const playBtn = $('smap-play'), playIcon = $('smap-play-icon'), playTxt = $('smap-play-txt');
    let playing = false, rafId: number | null = null, startTs: number | null = null;
    const DUR = 14000;
    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const p = Math.min((ts - startTs) / DUR, 1);
      const y = Math.round(minY + (maxY - minY) * p);
      if (slider) slider.value = String(y);
      applyYear(y);
      if (p < 1) rafId = requestAnimationFrame(tick); else stopPlay();
    };
    const startPlay = () => { playing = true; startTs = null; if (playIcon) playIcon.textContent = '⏸'; if (playTxt) playTxt.textContent = '暂停'; if (slider) slider.value = String(minY); applyYear(minY); rafId = requestAnimationFrame(tick); };
    function stopPlay() { playing = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; if (playIcon) playIcon.textContent = '▶'; if (playTxt) playTxt.textContent = '播放建院顺序'; }
    if (playBtn) playBtn.addEventListener('click', () => { playing ? stopPlay() : startPlay(); });
    applyYear(maxY);
  } else {
    // no colleges → hide era section + timeline
    ['smap-timeline', 'smap-era-sec'].forEach((id) => { const el = $(id); if (el) el.style.display = 'none'; });
  }

  // ===== zones (campus / cluster circles — "点到面") + point layers =====
  const catRows = $('smap-cat-rows');
  if (!pointLayers.length && !zones.length && !transits.length) { const sec = $('smap-cat-sec'); if (sec) sec.style.display = 'none'; }

  zones.forEach((z) => {
    const group = L.layerGroup();
    z.items.forEach((it) => {
      const c = L.circle([it.lat, it.lng], { radius: it.radius || 300, color: z.color, weight: 2, fillColor: z.color, fillOpacity: 0.1 });
      c.bindTooltip(esc(it.nameCn), { direction: 'top' });
      c.bindPopup(`<div class="smap-pop-name">${esc(it.name)}</div><div class="smap-pop-cn">${esc(it.nameCn)}</div><div class="smap-pop-note">${esc(it.note || '')}</div>${mapsLink(it.lat, it.lng)}`);
      c.addTo(group);
      fitPts.push([it.lat, it.lng]);
    });
    if (z.defaultOn) group.addTo(map);
    if (catRows) catRows.appendChild(makeToggleRow(z.color, '<span class="material-symbols-outlined">workspaces</span>', z.label, String(z.items.length), z.defaultOn, (on) => { if (on) group.addTo(map); else map.removeLayer(group); }));
  });

  pointLayers.forEach((cat) => {
    const group = L.layerGroup();
    cat.items.forEach((p) => {
      const ic = p.icon || cat.icon;
      const icon = L.divIcon({ className: 'smap-cat-marker', html: `<div class="cp" style="background:${cat.color}"><span class="material-symbols-outlined">${ic}</span></div>`, iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -15] });
      const m = L.marker([p.lat, p.lng], { icon });
      m.bindTooltip(esc(p.nameCn), { permanent: true, direction: 'right', offset: [16, 0], className: 'smap-mk-label' });
      m.bindPopup(`<div class="smap-pop-name">${esc(p.name)}</div><div class="smap-pop-cn">${esc(p.nameCn)}</div><div class="smap-pop-tag" style="color:${cat.color}"><span class="material-symbols-outlined" style="font-size:14px">${ic}</span>${esc(cat.label)}</div><div class="smap-pop-note">${esc(p.note || '')}</div>${mapsLink(p.lat, p.lng)}`);
      attachHoverLabel(m);
      group.addLayer(m);
      fitPts.push([p.lat, p.lng]);
    });
    if (cat.defaultOn) group.addTo(map);
    if (catRows) catRows.appendChild(makeToggleRow(cat.color, `<span class="material-symbols-outlined">${cat.icon}</span>`, cat.label, String(cat.items.length), cat.defaultOn, (on) => { if (on) group.addTo(map); else map.removeLayer(group); }));
  });

  // ===== transit (tube lines) =====
  transits.forEach((tr) => {
    const group = L.layerGroup();
    tr.lines.forEach((ln) => {
      L.polyline(ln.path, { color: ln.color, weight: 4, opacity: 0.85 }).bindTooltip(esc(ln.name), { sticky: true }).addTo(group);
      (ln.stations || []).forEach((st) => {
        const sm = L.circleMarker([st.lat, st.lng], { radius: 4, color: '#fff', weight: 2, fillColor: ln.color, fillOpacity: 1 });
        sm.bindTooltip(esc(st.name), { direction: 'top' });
        sm.addTo(group);
        fitPts.push([st.lat, st.lng]);
      });
    });
    if (tr.defaultOn) group.addTo(map);
    if (catRows) catRows.appendChild(makeToggleRow('#334155', '<span class="material-symbols-outlined">subway</span>', tr.label, String(tr.lines.length), tr.defaultOn, (on) => { if (on) group.addTo(map); else map.removeLayer(group); }));
  });

  // ===== commute table → list panel (region scenes) =====
  if (!colleges) {
    if (commute) {
      if (listTitle) listTitle.textContent = commute.label || '通勤参考';
      if (listSub) listSub.textContent = '各校最近地铁站 · 步行 / 到市中心(分钟)';
      commute.rows.forEach((r) => {
        const row = document.createElement('div');
        row.className = 'smap-li';
        const meta = [r.walkMins != null ? `步行${r.walkMins}'` : '', r.toCentreMins != null ? `中心${r.toCentreMins}'` : ''].filter(Boolean).join(' / ');
        row.innerHTML = `<div class="smap-li-badge" style="background:#334155"><span class="material-symbols-outlined" style="font-size:14px">subway</span></div><div class="smap-li-name">${esc(r.school)}<span class="cn">${esc(r.nearestStation)}</span></div><div class="smap-li-meta">${esc(meta)}</div>`;
        if (listEl) listEl.appendChild(row);
      });
    } else {
      // nothing to list
      const lw = $('smap-list-wrap'); if (lw) lw.style.display = 'none';
      const lb = $('smap-list-btn'); if (lb) lb.style.display = 'none';
    }
  }

  // fit-to-bounds (all points across all features)
  const fitBtn = $('smap-fit');
  if (fitBtn && fitPts.length) {
    const b = L.latLngBounds(fitPts);
    fitBtn.addEventListener('click', () => map.flyToBounds(b, { padding: [50, 50], duration: 0.8 }));
  } else if (fitBtn) {
    fitBtn.style.display = 'none';
  }

  disableMapDragOn([document.querySelector('.smap-left'), document.querySelector('.smap-right'), $('smap-timeline'), document.querySelector('.smap-nav')]);
}

function makeToggleRow(color: string, iconHtml: string, label: string, count: string, on: boolean | undefined, cb: (on: boolean) => void): HTMLElement {
  const el = document.createElement('label');
  el.className = 'smap-row';
  el.innerHTML = `<input type="checkbox" ${on ? 'checked' : ''}><span class="smap-ic" style="background:${color}">${iconHtml}</span><span class="smap-nm">${esc(label)}</span><span class="smap-ct">${esc(count)}</span>`;
  el.querySelector('input')!.addEventListener('change', (e: any) => cb(e.target.checked));
  return el;
}
