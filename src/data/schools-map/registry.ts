// Registry of detail/region scenes for the schools map.
//
// Architecture = one base + one special (functionalist: same scene model, features toggled on/off):
//   • BASE (generated JSON): EVERY school scene under ./generated/*.json — auto-discovered here.
//     Cambridge/Oxford are ordinary generated scenes that simply ALSO carry a `collegeTimeline`
//     feature on top of the usual zones + ranked pointLayers — the timeline is just a feature that
//     happens to be "on" for them. Drop a JSON to add a school.
//   • SPECIAL (hand-written TS): only the region scene (london), which carries transit + commute.

import type { SchoolsMapScene } from './types';
import london from './detail/london';

const generatedModules = import.meta.glob('./generated/*.json', { eager: true }) as Record<string, any>;
const generated: Record<string, SchoolsMapScene> = {};
for (const path in generatedModules) {
  const scene = (generatedModules[path].default || generatedModules[path]) as SchoolsMapScene;
  if (scene && scene.id) generated[scene.id] = scene;
}

// The region special (london) is merged on top of the generated scenes.
export const SCENES: Record<string, SchoolsMapScene> = { ...generated, london };

export const SCENE_IDS = Object.keys(SCENES);

export function getScene(id: string): SchoolsMapScene | undefined {
  return SCENES[id];
}

/** Lightweight index for the in-map navigation switcher (no heavy point data). */
export const SCENE_INDEX = Object.values(SCENES).map((s) => ({ id: s.id, name: s.name, nameCn: s.nameCn, type: s.type }));
