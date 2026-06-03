import type { SchoolsMapScene } from '../types';

// London — region scene. Member universities + key tube / Elizabeth lines + commute table.
// Tube line paths are simplified central-London segments (approximate), for orientation not routing.

const london: SchoolsMapScene = {
  id: 'london',
  type: 'region',
  name: 'London',
  nameCn: '伦敦地区',
  city: 'London',
  center: [51.512, -0.118],
  zoom: 12,
  blurb: '伦敦主要大学的分布与通勤。勾选地铁线查看与各校的关系；右侧通勤表给出每校最近车站与大致时间。',
  features: [
    {
      kind: 'pointLayer',
      key: 'school',
      label: '伦敦主要大学',
      color: '#e11d48',
      icon: 'account_balance',
      defaultOn: true,
      items: [
        { name: 'University College London (UCL)', nameCn: '伦敦大学学院', lat: 51.5246, lng: -0.134, note: 'QS 前 10；Bloomsbury 核心地段，综合性强。' },
        { name: 'Imperial College London', nameCn: '帝国理工学院', lat: 51.4988, lng: -0.1749, note: 'QS 前 5；South Kensington，理工医顶尖。' },
        { name: 'LSE', nameCn: '伦敦政治经济学院', lat: 51.5143, lng: -0.1167, note: '社科与经济金融顶尖；Holborn / Aldwych。' },
        { name: "King's College London (KCL)", nameCn: '伦敦国王学院', lat: 51.5115, lng: -0.116, note: '多校区，主校区在 Strand，泰晤士河畔。' },
        { name: 'Queen Mary University of London', nameCn: '伦敦玛丽女王大学', lat: 51.5246, lng: -0.0382, note: '罗素集团；Mile End，东伦敦少见的整体式校园。' },
        { name: 'City, University of London', nameCn: '伦敦城市大学', lat: 51.5279, lng: -0.1028, note: '邻金融城，商科与法律见长。' },
        { name: 'SOAS', nameCn: '亚非学院', lat: 51.5223, lng: -0.129, note: '亚非研究与区域研究的专门学院。' },
        { name: 'Birkbeck, University of London', nameCn: '伯贝克学院', lat: 51.5217, lng: -0.1303, note: '以夜间授课著称，邻 UCL / SOAS。' },
      ],
    },
    {
      kind: 'transit',
      label: '地铁 / Elizabeth line',
      defaultOn: true,
      lines: [
        {
          name: 'Central line', color: '#DC241F',
          path: [[51.5142, -0.1494], [51.5152, -0.1418], [51.5165, -0.1308], [51.5174, -0.12], [51.5133, -0.0886], [51.5178, -0.0823], [51.5253, -0.0334], [51.5416, -0.0042]],
          stations: [
            { name: 'Oxford Circus', lat: 51.5152, lng: -0.1418 },
            { name: 'Holborn', lat: 51.5174, lng: -0.12 },
            { name: 'Bank', lat: 51.5133, lng: -0.0886 },
            { name: 'Liverpool Street', lat: 51.5178, lng: -0.0823 },
            { name: 'Mile End', lat: 51.5253, lng: -0.0334 },
          ],
        },
        {
          name: 'Piccadilly line', color: '#003688',
          path: [[51.4941, -0.1738], [51.5015, -0.1607], [51.5067, -0.1428], [51.5174, -0.12], [51.523, -0.1244], [51.5308, -0.1238]],
          stations: [
            { name: 'South Kensington', lat: 51.4941, lng: -0.1738 },
            { name: 'Green Park', lat: 51.5067, lng: -0.1428 },
            { name: 'Russell Square', lat: 51.523, lng: -0.1244 },
            { name: "King's Cross St Pancras", lat: 51.5308, lng: -0.1238 },
          ],
        },
        {
          name: 'Victoria line', color: '#0098D4',
          path: [[51.4965, -0.1447], [51.5067, -0.1428], [51.5152, -0.1418], [51.5247, -0.1384], [51.5282, -0.1337], [51.5308, -0.1238]],
          stations: [
            { name: 'Victoria', lat: 51.4965, lng: -0.1447 },
            { name: 'Warren Street', lat: 51.5247, lng: -0.1384 },
            { name: 'Euston', lat: 51.5282, lng: -0.1337 },
          ],
        },
        {
          name: 'Elizabeth line', color: '#6950A1',
          path: [[51.5154, -0.1755], [51.5142, -0.1494], [51.5165, -0.1308], [51.5203, -0.1053], [51.5178, -0.0823]],
          stations: [
            { name: 'Paddington', lat: 51.5154, lng: -0.1755 },
            { name: 'Bond Street', lat: 51.5142, lng: -0.1494 },
            { name: 'Tottenham Court Road', lat: 51.5165, lng: -0.1308 },
            { name: 'Farringdon', lat: 51.5203, lng: -0.1053 },
          ],
        },
      ],
    },
    {
      kind: 'commute',
      label: '通勤参考',
      rows: [
        { school: 'UCL', nameCn: '伦敦大学学院', nearestStation: 'Euston Square / Warren St', walkMins: 5, toCentreMins: 10 },
        { school: 'Imperial', nameCn: '帝国理工', nearestStation: 'South Kensington', walkMins: 7, toCentreMins: 15 },
        { school: 'LSE', nameCn: '伦敦政经', nearestStation: 'Holborn / Temple', walkMins: 6, toCentreMins: 5 },
        { school: 'KCL (Strand)', nameCn: '国王学院', nearestStation: 'Temple / Charing Cross', walkMins: 4, toCentreMins: 5 },
        { school: 'QMUL', nameCn: '玛丽女王', nearestStation: 'Mile End', walkMins: 3, toCentreMins: 20 },
        { school: 'City', nameCn: '城市大学', nearestStation: 'Angel / Barbican', walkMins: 8, toCentreMins: 12 },
        { school: 'SOAS', nameCn: '亚非学院', nearestStation: 'Russell Square', walkMins: 5, toCentreMins: 10 },
        { school: 'Birkbeck', nameCn: '伯贝克', nearestStation: 'Russell Square / Euston', walkMins: 5, toCentreMins: 10 },
      ],
    },
  ],
};

export default london;
