// Schools map — scene & feature types.
// A "scene" is one drill-down view (a single school like Cambridge, or a region like London).
// Each scene is composed of pluggable Features; the map engine renders by `kind`.
// Add a school = add a scene data file. Add a new capability = add a Feature kind.

export interface PointItem {
  name: string;
  nameCn: string;
  lat: number;
  lng: number;
  note?: string;
  /** Override the layer's default Material Symbol for this single point. */
  icon?: string;
}

/** Generic toggleable layer of places (departments / museums / libraries / landmarks / campuses). */
export interface PointLayerFeature {
  kind: 'pointLayer';
  key: string;
  label: string;
  color: string;
  /** Material Symbols Outlined icon name. */
  icon: string;
  /** Whether the layer starts visible (default false — teacher toggles on). */
  defaultOn?: boolean;
  items: PointItem[];
}

export interface CollegeItem {
  /** Founding order (1 = oldest). */
  rank: number;
  name: string;
  nameCn: string;
  year: number;
  lat: number;
  lng: number;
  note?: string;
}

/** Collegiate timeline (Oxbridge): numbered, era-colored, with a foundation-year time slider. */
export interface CollegeTimelineFeature {
  kind: 'collegeTimeline';
  label: string;
  items: CollegeItem[];
}

export interface ZoneItem {
  name: string;
  nameCn: string;
  lat: number;
  lng: number;
  /** circle radius in metres (campus / cluster extent) */
  radius: number;
  note?: string;
}
/** Campus / department-cluster AREAS drawn as circles ("点到面"). */
export interface ZoneFeature {
  kind: 'zone';
  label: string;
  color: string;
  defaultOn?: boolean;
  items: ZoneItem[];
}

export interface TransitStation {
  name: string;
  lat: number;
  lng: number;
}
export interface TransitLine {
  name: string;
  color: string;
  path: [number, number][];
  stations?: TransitStation[];
}
/** Region transit overlay (e.g. London tube / Elizabeth line). */
export interface TransitFeature {
  kind: 'transit';
  label: string;
  defaultOn?: boolean;
  lines: TransitLine[];
}

export interface CommuteRow {
  /** Display name of the school (shown in the commute table). */
  school: string;
  nameCn?: string;
  nearestStation: string;
  walkMins?: number;
  toCentreMins?: number;
}
/** Per-school commute facts shown in a region scene. */
export interface CommuteFeature {
  kind: 'commute';
  label: string;
  rows: CommuteRow[];
}

export type Feature =
  | PointLayerFeature
  | CollegeTimelineFeature
  | ZoneFeature
  | TransitFeature
  | CommuteFeature;

export interface SchoolsMapScene {
  id: string;
  type: 'school' | 'region';
  name: string;
  nameCn: string;
  city?: string;
  center: [number, number];
  zoom: number;
  /** Short intro shown in the detail header. */
  blurb?: string;
  features: Feature[];
}
