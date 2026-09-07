// 80 additional Chicagoland suburbs/towns beyond the round-1 set of 22,
// spanning Cook, DuPage, Lake, Will, Kane, and (new this round) McHenry
// counties. Selected for even geographic spread across the region (not just
// the biggest/most famous towns) since these centroids become Voronoi seeds
// for scripts/generate-tessellation.mjs — density and distribution matter
// more than fame for that purpose.
//
// - `centroid` is a real, well-known town-center coordinate (general public
//   geographic knowledge), same methodology as the round-1 suburbs.
// - `targetHomePrice` is a hand-assigned relative-price anchor chosen by
//   comparing each town's real-world reputation/cost tier to the 22 suburbs
//   already in the dataset (e.g. Winnetka/Hinsdale/Lake Forest anchored
//   above Wilmette and Highland Park, both well-documented as among the
//   most expensive Chicagoland suburbs already in the dataset; Harvey and
//   North Chicago anchored low, both well-documented as economically
//   distressed south/north-suburban towns).
// - `hasRailAccess` / `transitLines` reflect real, currently operating
//   Metra lines or CTA rail extensions serving the town; `settlementPattern`
//   is "transit-suburb" when a real rail station serves the town, otherwise
//   "suburban" (same convention as round 1).
export const NEW_SUBURBS = [
  // ---- Cook County (32) ----
  { id: 'winnetka', name: 'Winnetka', countyId: 'cook', centroid: [-87.7362, 42.1082], targetHomePrice: 1050000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-N'] },
  { id: 'glencoe', name: 'Glencoe', countyId: 'cook', centroid: [-87.7570, 42.1358], targetHomePrice: 980000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-N'] },
  { id: 'northbrook', name: 'Northbrook', countyId: 'cook', centroid: [-87.8256, 42.1275], targetHomePrice: 650000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-N'] },
  { id: 'glenview', name: 'Glenview', countyId: 'cook', centroid: [-87.7878, 42.0769], targetHomePrice: 560000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Milwaukee District North'] },
  { id: 'morton-grove', name: 'Morton Grove', countyId: 'cook', centroid: [-87.7828, 42.0401], targetHomePrice: 340000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Milwaukee District North'] },
  { id: 'niles', name: 'Niles', countyId: 'cook', centroid: [-87.8020, 42.0189], targetHomePrice: 310000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'lincolnwood', name: 'Lincolnwood', countyId: 'cook', centroid: [-87.7326, 42.0058], targetHomePrice: 430000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'palatine', name: 'Palatine', countyId: 'cook', centroid: [-88.0342, 42.1103], targetHomePrice: 330000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-NW'] },
  { id: 'mount-prospect', name: 'Mount Prospect', countyId: 'cook', centroid: [-87.9370, 42.0664], targetHomePrice: 340000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-NW'] },
  { id: 'rolling-meadows', name: 'Rolling Meadows', countyId: 'cook', centroid: [-88.0134, 42.0842], targetHomePrice: 280000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'wheeling', name: 'Wheeling', countyId: 'cook', centroid: [-87.9287, 42.1392], targetHomePrice: 290000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra North Central Service'] },
  { id: 'elk-grove-village', name: 'Elk Grove Village', countyId: 'cook', centroid: [-87.9773, 42.0034], targetHomePrice: 320000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'rosemont', name: 'Rosemont', countyId: 'cook', centroid: [-87.8850, 41.9865], targetHomePrice: 260000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['CTA Blue Line'] },
  { id: 'norridge', name: 'Norridge', countyId: 'cook', centroid: [-87.8281, 41.9647], targetHomePrice: 300000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'melrose-park', name: 'Melrose Park', countyId: 'cook', centroid: [-87.8564, 41.9092], targetHomePrice: 240000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Union Pacific West'] },
  { id: 'river-forest', name: 'River Forest', countyId: 'cook', centroid: [-87.8134, 41.8951], targetHomePrice: 490000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Union Pacific West', 'CTA Green Line'] },
  { id: 'forest-park', name: 'Forest Park', countyId: 'cook', centroid: [-87.8134, 41.8744], targetHomePrice: 330000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['CTA Blue Line', 'Metra BNSF'] },
  { id: 'maywood', name: 'Maywood', countyId: 'cook', centroid: [-87.8406, 41.8792], targetHomePrice: 215000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Union Pacific West'] },
  { id: 'bellwood', name: 'Bellwood', countyId: 'cook', centroid: [-87.8814, 41.8842], targetHomePrice: 210000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Union Pacific West'] },
  { id: 'westchester', name: 'Westchester', countyId: 'cook', centroid: [-87.8814, 41.8503], targetHomePrice: 300000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'la-grange', name: 'La Grange', countyId: 'cook', centroid: [-87.8687, 41.8117], targetHomePrice: 520000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra BNSF'] },
  { id: 'oak-lawn', name: 'Oak Lawn', countyId: 'cook', centroid: [-87.7581, 41.7200], targetHomePrice: 285000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra SouthWest Service'] },
  { id: 'evergreen-park', name: 'Evergreen Park', countyId: 'cook', centroid: [-87.7020, 41.7228], targetHomePrice: 240000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'palos-heights', name: 'Palos Heights', countyId: 'cook', centroid: [-87.7970, 41.6673], targetHomePrice: 340000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'palos-park', name: 'Palos Park', countyId: 'cook', centroid: [-87.8320, 41.6606], targetHomePrice: 470000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra SouthWest Service'] },
  { id: 'worth', name: 'Worth', countyId: 'cook', centroid: [-87.7942, 41.6889], targetHomePrice: 230000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'homewood', name: 'Homewood', countyId: 'cook', centroid: [-87.6653, 41.5581], targetHomePrice: 260000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Electric'] },
  { id: 'flossmoor', name: 'Flossmoor', countyId: 'cook', centroid: [-87.6845, 41.5411], targetHomePrice: 370000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Electric'] },
  { id: 'chicago-heights', name: 'Chicago Heights', countyId: 'cook', centroid: [-87.6353, 41.5064], targetHomePrice: 155000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Electric'] },
  { id: 'calumet-city', name: 'Calumet City', countyId: 'cook', centroid: [-87.5292, 41.6156], targetHomePrice: 130000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'harvey', name: 'Harvey', countyId: 'cook', centroid: [-87.6459, 41.6086], targetHomePrice: 105000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Electric'] },
  { id: 'matteson', name: 'Matteson', countyId: 'cook', centroid: [-87.7392, 41.5045], targetHomePrice: 215000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Electric'] },

  // ---- DuPage County (14) ----
  { id: 'lombard', name: 'Lombard', countyId: 'dupage', centroid: [-88.0084, 41.8800], targetHomePrice: 330000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Union Pacific West'] },
  { id: 'villa-park', name: 'Villa Park', countyId: 'dupage', centroid: [-87.9797, 41.8895], targetHomePrice: 300000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Union Pacific West'] },
  { id: 'glen-ellyn', name: 'Glen Ellyn', countyId: 'dupage', centroid: [-88.0673, 41.8776], targetHomePrice: 480000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Union Pacific West'] },
  { id: 'carol-stream', name: 'Carol Stream', countyId: 'dupage', centroid: [-88.1339, 41.9114], targetHomePrice: 310000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'bloomingdale', name: 'Bloomingdale', countyId: 'dupage', centroid: [-88.0806, 41.9550], targetHomePrice: 330000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'addison', name: 'Addison', countyId: 'dupage', centroid: [-88.0006, 41.9314], targetHomePrice: 290000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'bensenville', name: 'Bensenville', countyId: 'dupage', centroid: [-87.9401, 41.9556], targetHomePrice: 290000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Milwaukee District West'] },
  { id: 'itasca', name: 'Itasca', countyId: 'dupage', centroid: [-88.0056, 41.9739], targetHomePrice: 340000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Milwaukee District West'] },
  { id: 'oak-brook', name: 'Oak Brook', countyId: 'dupage', centroid: [-87.9298, 41.8400], targetHomePrice: 820000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'hinsdale', name: 'Hinsdale', countyId: 'dupage', centroid: [-87.9295, 41.8020], targetHomePrice: 980000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra BNSF'] },
  { id: 'westmont', name: 'Westmont', countyId: 'dupage', centroid: [-87.9773, 41.7961], targetHomePrice: 300000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra BNSF'] },
  { id: 'lisle', name: 'Lisle', countyId: 'dupage', centroid: [-88.0748, 41.8011], targetHomePrice: 370000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra BNSF'] },
  { id: 'woodridge', name: 'Woodridge', countyId: 'dupage', centroid: [-88.0723, 41.7508], targetHomePrice: 310000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'west-chicago', name: 'West Chicago', countyId: 'dupage', centroid: [-88.2073, 41.8850], targetHomePrice: 260000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Union Pacific West'] },

  // ---- Lake County (12) ----
  { id: 'north-chicago', name: 'North Chicago', countyId: 'lake', centroid: [-87.8412, 42.3253], targetHomePrice: 120000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-N'] },
  { id: 'gurnee', name: 'Gurnee', countyId: 'lake', centroid: [-87.9020, 42.3706], targetHomePrice: 280000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'zion', name: 'Zion', countyId: 'lake', centroid: [-87.8323, 42.4467], targetHomePrice: 150000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-N'] },
  { id: 'lake-forest', name: 'Lake Forest', countyId: 'lake', centroid: [-87.8406, 42.2411], targetHomePrice: 900000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-N'] },
  { id: 'deerfield', name: 'Deerfield', countyId: 'lake', centroid: [-87.8445, 42.1711], targetHomePrice: 680000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-N'] },
  { id: 'libertyville', name: 'Libertyville', countyId: 'lake', centroid: [-87.9581, 42.2839], targetHomePrice: 480000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Milwaukee District North'] },
  { id: 'mundelein', name: 'Mundelein', countyId: 'lake', centroid: [-88.0031, 42.2731], targetHomePrice: 320000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Milwaukee District North'] },
  { id: 'vernon-hills', name: 'Vernon Hills', countyId: 'lake', centroid: [-87.9756, 42.2140], targetHomePrice: 390000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Milwaukee District North'] },
  { id: 'grayslake', name: 'Grayslake', countyId: 'lake', centroid: [-88.0434, 42.3453], targetHomePrice: 330000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Milwaukee District North'] },
  { id: 'antioch', name: 'Antioch', countyId: 'lake', centroid: [-88.0942, 42.4753], targetHomePrice: 260000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Milwaukee District North'] },
  { id: 'lake-zurich', name: 'Lake Zurich', countyId: 'lake', centroid: [-88.0934, 42.1970], targetHomePrice: 400000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'round-lake-beach', name: 'Round Lake Beach', countyId: 'lake', centroid: [-88.0787, 42.3717], targetHomePrice: 210000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Milwaukee District North'] },

  // ---- Will County (10) ----
  { id: 'bolingbrook', name: 'Bolingbrook', countyId: 'will', centroid: [-88.0687, 41.6987], targetHomePrice: 290000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'plainfield', name: 'Plainfield', countyId: 'will', centroid: [-88.2073, 41.6273], targetHomePrice: 340000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'romeoville', name: 'Romeoville', countyId: 'will', centroid: [-88.0895, 41.6475], targetHomePrice: 260000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Heritage Corridor'] },
  { id: 'new-lenox', name: 'New Lenox', countyId: 'will', centroid: [-87.9648, 41.5084], targetHomePrice: 330000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Rock Island District'] },
  { id: 'frankfort', name: 'Frankfort', countyId: 'will', centroid: [-87.8501, 41.4956], targetHomePrice: 390000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'mokena', name: 'Mokena', countyId: 'will', centroid: [-87.8887, 41.5262], targetHomePrice: 340000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Rock Island District'] },
  { id: 'lockport', name: 'Lockport', countyId: 'will', centroid: [-88.0559, 41.5895], targetHomePrice: 270000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Heritage Corridor'] },
  { id: 'shorewood', name: 'Shorewood', countyId: 'will', centroid: [-88.2151, 41.5231], targetHomePrice: 290000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'homer-glen', name: 'Homer Glen', countyId: 'will', centroid: [-87.9448, 41.6034], targetHomePrice: 400000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'wilmington', name: 'Wilmington', countyId: 'will', centroid: [-88.1470, 41.3081], targetHomePrice: 210000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },

  // ---- Kane County (7) ----
  { id: 'st-charles', name: 'St. Charles', countyId: 'kane', centroid: [-88.3126, 41.9142], targetHomePrice: 400000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'geneva', name: 'Geneva', countyId: 'kane', centroid: [-88.3051, 41.8878], targetHomePrice: 430000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra Union Pacific West'] },
  { id: 'batavia', name: 'Batavia', countyId: 'kane', centroid: [-88.3126, 41.8500], targetHomePrice: 340000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'south-elgin', name: 'South Elgin', countyId: 'kane', centroid: [-88.2892, 41.9942], targetHomePrice: 270000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'carpentersville', name: 'Carpentersville', countyId: 'kane', centroid: [-88.2570, 42.1211], targetHomePrice: 220000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'north-aurora', name: 'North Aurora', countyId: 'kane', centroid: [-88.3559, 41.7900], targetHomePrice: 270000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'sugar-grove', name: 'Sugar Grove', countyId: 'kane', centroid: [-88.4487, 41.7594], targetHomePrice: 300000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },

  // ---- McHenry County (5, new this round) ----
  { id: 'crystal-lake', name: 'Crystal Lake', countyId: 'mchenry', centroid: [-88.3162, 42.2411], targetHomePrice: 300000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-NW'] },
  { id: 'woodstock', name: 'Woodstock', countyId: 'mchenry', centroid: [-88.4487, 42.3147], targetHomePrice: 260000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-NW'] },
  { id: 'mchenry', name: 'McHenry', countyId: 'mchenry', centroid: [-88.2662, 42.3334], targetHomePrice: 250000, settlementPattern: 'transit-suburb', hasRailAccess: true, transitLines: ['Metra UP-NW'] },
  { id: 'algonquin', name: 'Algonquin', countyId: 'mchenry', centroid: [-88.2942, 42.1656], targetHomePrice: 310000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
  { id: 'huntley', name: 'Huntley', countyId: 'mchenry', centroid: [-88.4287, 42.1681], targetHomePrice: 300000, settlementPattern: 'suburban', hasRailAccess: false, transitLines: [] },
]
