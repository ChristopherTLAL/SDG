// Country registry for the schools map — drives the top nav country tabs + detail breadcrumb.
// Add a country = add an entry here + its overview page.

export interface CountryRef {
  code: string;
  label: string;
  flag: string;
  href: string;
}

export const COUNTRIES: CountryRef[] = [
  { code: 'UK', label: '英国', flag: '🇬🇧', href: '/tools/schools-map' },
  { code: 'US', label: '美国', flag: '🇺🇸', href: '/tools/schools-map/us' },
  { code: 'AU', label: '澳洲', flag: '🇦🇺', href: '/tools/schools-map/au' },
];

export const countryByCode = (code?: string): CountryRef =>
  COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
