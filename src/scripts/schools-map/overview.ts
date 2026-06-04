// Country overview renderer — universities as rank-tiered dots + rank filter + searchable list.
// Rank source is configurable per country (UK = QS, US = U.S. News) via opts.
import { L } from './leaflet-global';
import { createMap, buildBaseRow, buildSwitcher, wireToggle, wireFullscreen, attachHoverLabel, disableMapDragOn, esc, mapsLink } from './shell';

interface OverviewUni {
  id: string; name: string; nameCn: string; city: string;
  rank: number | null; lat: number; lng: number; hasDetail: boolean;
  inBudget?: boolean; tags?: string[];
}
interface Tier { key: string; label: string; color: string; max: number; }
interface OverviewOpts {
  center: [number, number];
  zoom: number;
  rankLabel: string; // 'QS' | 'USNews'
  filters: { label: string; max: number }[];
  tags: string[];
}

const $ = (id: string): any => document.getElementById(id);

export function mountOverview(unis: OverviewUni[], tiers: Tier[], detailBase: string, scenes: any[], opts: OverviewOpts) {
  const wrap = $('smap-wrap');
  const { map, setBase } = createMap('smap-map', opts.center, opts.zoom);
  buildSwitcher($('smap-switch'), scenes, '', detailBase);
  wireFullscreen($('smap-fullscreen'), wrap, map);

  const tierOf = (q: number | null) => (q == null ? tiers[tiers.length - 1] : tiers.find((t) => q <= t.max) || tiers[tiers.length - 1]);

  buildBaseRow($('smap-base-row'), setBase);
  wireToggle($('smap-label-btn'), (active) => wrap && wrap.classList.toggle('show-labels', active));
  const listWrap = $('smap-list-wrap');
  wireToggle($('smap-list-btn'), (active) => listWrap && listWrap.classList.toggle('hidden', !active));

  const tierRow = $('smap-tier-row');
  if (tierRow) tierRow.innerHTML = tiers.map((t) => `<span class="smap-legend-item"><span class="sw" style="background:${t.color}"></span>${esc(t.label)}</span>`).join('');

  const listEl = $('smap-list');
  const entries: any[] = [];
  const placed = unis.filter((u) => u.lat != null && u.lng != null).sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));

  const setHot = (id: string, on: boolean) => {
    const e = entries.find((x) => x.u.id === id); if (!e) return;
    if (e.m._icon) e.m._icon.classList.toggle('hot', on);
    e.row.classList.toggle('hot', on);
    e.m.setZIndexOffset(on ? 1000 : 0);
  };

  placed.forEach((u) => {
    const tier = tierOf(u.rank);
    const icon = L.divIcon({ className: 'smap-uni-marker', html: `<div class="ud" style="background:${tier.color}"></div>`, iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -11] });
    const m = L.marker([u.lat, u.lng], { icon }).addTo(map);
    m.bindTooltip(esc(u.nameCn), { permanent: true, direction: 'right', offset: [13, 0], className: 'smap-mk-label' });
    const rankTxt = u.rank != null ? `${opts.rankLabel} #${u.rank}` : '未排名';
    const detailLink = u.hasDetail ? `<a class="smap-pop-link" href="${detailBase}/${u.id}">🗺 精览 →</a>` : '';
    const budgetLink = u.inBudget ? `<a class="smap-pop-link" href="/tools/budget-calculator?school=${u.id}">💰 估算预算</a>` : '';
    m.bindPopup(`<div class="smap-pop-name">${esc(u.name)}</div><div class="smap-pop-cn">${esc(u.nameCn)} · ${esc(u.city)}</div><div class="smap-pop-tag" style="color:${tier.color}">${rankTxt}</div>${detailLink}${budgetLink}${mapsLink(u.lat, u.lng)}`);
    attachHoverLabel(m);
    m.on('mouseover', () => setHot(u.id, true));
    m.on('mouseout', () => setHot(u.id, false));

    const row = document.createElement('div');
    row.className = 'smap-li';
    const badge = u.rank != null ? u.rank : '–';
    row.innerHTML = `<div class="smap-li-badge" style="background:${tier.color}">${badge}</div><div class="smap-li-name">${esc(u.name)}<span class="cn">${esc(u.nameCn)} · ${esc(u.city)}</span></div><div class="smap-li-meta">${u.hasDetail ? '精览' : ''}</div>`;
    row.addEventListener('mouseenter', () => setHot(u.id, true));
    row.addEventListener('mouseleave', () => setHot(u.id, false));
    row.addEventListener('click', () => {
      if (u.hasDetail) { window.location.href = `${detailBase}/${u.id}`; return; }
      map.flyTo([u.lat, u.lng], 14, { duration: 0.8 });
      m.openPopup();
    });
    if (listEl) listEl.appendChild(row);
    entries.push({ u, m, row });
  });

  // filter + search + tag
  let maxRank = Infinity;
  let query = '';
  let activeTag = '';
  const countEl = $('smap-count');
  const applyVis = () => {
    let n = 0;
    entries.forEach(({ u, m, row }) => {
      const rankOk = u.rank != null ? u.rank <= maxRank : maxRank === Infinity;
      const q = query.trim().toLowerCase();
      const searchOk = !q || u.name.toLowerCase().includes(q) || (u.nameCn && u.nameCn.includes(query.trim())) || (u.city && u.city.toLowerCase().includes(q));
      const tagOk = !activeTag || (u.tags && u.tags.indexOf(activeTag) !== -1);
      const vis = rankOk && searchOk && tagOk;
      if (vis) n++;
      if (m._icon) { m._icon.style.opacity = vis ? '1' : '0.1'; m._icon.style.pointerEvents = vis ? 'auto' : 'none'; }
      const t = m.getTooltip(); if (t && t._container) t._container.classList.toggle('tl-hidden', !vis);
      row.style.display = vis ? '' : 'none';
    });
    if (countEl) countEl.textContent = `显示 ${n} / ${entries.length} 所`;
  };

  const filterRow = $('smap-filter-row');
  if (filterRow) {
    opts.filters.forEach((f, idx) => {
      const b = document.createElement('button');
      b.className = 'smap-filter-btn' + (idx === opts.filters.length - 1 ? ' active' : '');
      b.textContent = f.label;
      b.addEventListener('click', () => {
        maxRank = f.max;
        filterRow.querySelectorAll('.smap-filter-btn').forEach((x: any) => x.classList.toggle('active', x === b));
        applyVis();
      });
      filterRow.appendChild(b);
    });
  }

  const tagRow = $('smap-tag-row');
  if (tagRow && opts.tags.length) {
    const mkTag = (label: string, val: string) => {
      const b = document.createElement('button');
      b.className = 'smap-filter-btn' + (val === '' ? ' active' : '');
      b.textContent = label;
      b.addEventListener('click', () => {
        activeTag = val;
        tagRow.querySelectorAll('.smap-filter-btn').forEach((x: any) => x.classList.toggle('active', x === b));
        applyVis();
      });
      tagRow.appendChild(b);
    };
    mkTag('全部', '');
    opts.tags.forEach((t) => mkTag(t, t));
  }

  const search = $('smap-search');
  if (search) search.addEventListener('input', () => { query = search.value || ''; applyVis(); });

  const fitBtn = $('smap-fit');
  if (fitBtn && placed.length) {
    const b = L.latLngBounds(placed.map((u) => [u.lat, u.lng]));
    fitBtn.addEventListener('click', () => map.flyToBounds(b, { padding: [40, 40], duration: 0.8 }));
  }

  disableMapDragOn([document.querySelector('.smap-left'), document.querySelector('.smap-right'), document.querySelector('.smap-nav')]);
  applyVis();
}
