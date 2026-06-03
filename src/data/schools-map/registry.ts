// Registry of detail/region scenes for the schools map.
//
// Architecture = one base + several specials:
//   • SPECIAL (hand-written TS): collegiate timelines (cambridge, oxford), region scenes (london).
//   • BASE (generated JSON): generic campus scenes under ./generated/*.json — drop a file to add a
//     school; it is auto-discovered here. Produced by the uk-school-scenes workflow.

import type { SchoolsMapScene } from './types';
import cambridge from './detail/cambridge';
import oxford from './detail/oxford';
import london from './detail/london';

const generatedModules = import.meta.glob('./generated/*.json', { eager: true }) as Record<string, any>;
const generated: Record<string, SchoolsMapScene> = {};
for (const path in generatedModules) {
  const scene = (generatedModules[path].default || generatedModules[path]) as SchoolsMapScene;
  if (scene && scene.id) generated[scene.id] = scene;
}

// Hand-written specials win over generated if an id ever collides.
export const SCENES: Record<string, SchoolsMapScene> = { ...generated, cambridge, oxford, london };

export const SCENE_IDS = Object.keys(SCENES);

export function getScene(id: string): SchoolsMapScene | undefined {
  return SCENES[id];
}

/** Lightweight index for the in-map navigation switcher (no heavy point data). */
export const SCENE_INDEX = Object.values(SCENES).map((s) => ({ id: s.id, name: s.name, nameCn: s.nameCn, type: s.type }));
