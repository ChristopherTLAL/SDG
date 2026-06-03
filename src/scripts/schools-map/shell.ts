// Shared map-shell helpers used by both the overview and detail scenes.
import { L } from './leaflet-global';

const OSM = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const CARTO = ' &copy; <a href="https://carto.com/attributions">CARTO</a>';

const BASE_LABELS: Record<string, string> = { light: '浅色', osm: '标准', dark: '深色', sat: '卫星' };

export function createMap(elId: string, center: [number, number], zoom: number) {
  const bases: Record<string, any> = {
    light: L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, attribution: OSM + CARTO }),
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: OSM }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, attribution: OSM + CARTO }),
    sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' }),
  };
  const map = L.map(elId, { zoomControl: false, scrollWheelZoom: true, maxZoom: 19 }).setView(center, zoom);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  let current = bases.light.addTo(map);
  let currentKey = 'light';
  const setBase = (k: string) => {
    if (k === currentKey || !bases[k]) return;
    map.removeLayer(current);
    current = bases[k].addTo(map);
    current.bringToBack();
    currentKey = k;
  };
  return { map, setBase };
}

export function buildBaseRow(rowEl: HTMLElement | null, setBase: (k: string) => void) {
  if (!rowEl) return;
  Object.keys(BASE_LABELS).forEach((k, i) => {
    const b = document.createElement('button');
    b.className = 'smap-base-btn' + (i === 0 ? ' active' : '');
    b.textContent = BASE_LABELS[k];
    b.dataset.k = k;
    b.addEventListener('click', () => {
      setBase(k);
      rowEl.querySelectorAll('.smap-base-btn').forEach((x) => x.classList.toggle('active', (x as HTMLElement).dataset.k === k));
    });
    rowEl.appendChild(b);
  });
}

export function wireToggle(btnEl: HTMLElement | null, onToggle: (active: boolean) => void) {
  if (!btnEl) return;
  btnEl.addEventListener('click', () => {
    const active = btnEl.classList.toggle('active');
    onToggle(active);
  });
}

/** Show a marker's permanent-but-hidden label on hover (even when the global 名称 toggle is off). */
export function attachHoverLabel(m: any) {
  m.on('mouseover', () => { const t = m.getTooltip(); if (t && t._container) t._container.classList.add('force'); });
  m.on('mouseout', () => { const t = m.getTooltip(); if (t && t._container) t._container.classList.remove('force'); });
}

export function disableMapDragOn(els: Array<HTMLElement | null>) {
  els.forEach((el) => {
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  });
}

export function esc(s: unknown): string {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

interface SceneRef { id: string; name: string; nameCn: string; type: string; }

/** Populate the in-map "jump to school / region" <select> and wire navigation. */
export function buildSwitcher(selectEl: HTMLSelectElement | null, scenes: SceneRef[], currentId: string, base: string) {
  if (!selectEl || !scenes) return;
  const schools = scenes.filter((s) => s.type === 'school').sort((a, b) => a.nameCn.localeCompare(b.nameCn, 'zh-Hans'));
  const regions = scenes.filter((s) => s.type === 'region').sort((a, b) => a.nameCn.localeCompare(b.nameCn, 'zh-Hans'));
  const opt = (s: SceneRef) => `<option value="${s.id}" ${s.id === currentId ? 'selected' : ''}>${esc(s.nameCn)}</option>`;
  let html = '<option value="">跳转到…</option><option value="__overview">英国总览（地图首页）</option>';
  if (regions.length) html += `<optgroup label="地区">${regions.map(opt).join('')}</optgroup>`;
  if (schools.length) html += `<optgroup label="学校">${schools.map(opt).join('')}</optgroup>`;
  selectEl.innerHTML = html;
  selectEl.addEventListener('change', () => {
    const v = selectEl.value;
    if (!v) return;
    window.location.href = v === '__overview' ? base : `${base}/${v}`;
  });
}
