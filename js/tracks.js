// Track definitions: layout (control points in metres, closed Catmull-Rom loop), visual theme,
// field mix and landmarks. Everything else (items, pads, ramps, coins) is placed from the layout.

export const TRACKS = [
  {
    id: 'milharal', name: 'Fazenda Milharal', subtitle: 'Celeiro, ponte e atalho no milho', difficulty: 1, seed: 1234,
    ctrl: [
      [0, -60], [0, 40], [10, 90], [45, 115], [90, 105], [110, 70], [100, 30], [120, -5], [165, -15], [195, 10],
      [200, 60], [185, 110], [200, 150], [240, 165], [275, 140], [270, 90], [255, 40], [260, -20], [240, -75],
      [195, -105], [140, -100], [100, -130], [55, -140], [15, -115],
    ],
    plots: { corn: 3, wheat: 2, plow: 2, sun: 1, pasture: 2 },
    landmarks: [['barn', 2, 8], ['silo', 2, 2.5], ['windmill', 2, 2], ['hay', 5, 1], ['scarecrowBig', 0, 1]],
    theme: {
      skyTop: '#3D9BEA', horizon: '#D6F0FF', fogNear: 260, fogFar: 820,
      sun: '#FFF1D6', sunInt: 2.6, sunOffset: [-60, 110, -40], hemiSky: '#FFFFFF', hemiGround: '#6E9F3A', hemiInt: 1.6,
      grass: '#7CC850', grassSpeck: ['#74BF49', '#86D05A'], verge: '#78C24D', margin: '#8AD25C', outer: '#76BF4A', hill: '#5DAE3E',
      road: '#C99A5E', roadSpeck: ['#B98749', '#D8AC70', '#BE8E52', '#E2B985'], roadEdge: '#A6743F', curbA: '#F7D154', curbB: '#B5341F',
      plotCols: { corn: '#6C9A34', wheat: '#E9C45A', plow: '#93603A', sun: '#86B947', pasture: '#93D46B', soy: '#5E9A38' },
      trees: ['tree', 'pine'], banner: 'ROÇA KART · LARGADA', cloudTint: '#FFFFFF',
    },
  },
  {
    id: 'girassol', name: 'Vale dos Girassóis', subtitle: 'Colinas, moinho gigante e saltos', difficulty: 2, seed: 777,
    ctrl: [
      [0, 0], [0, 90], [30, 150], [90, 170], [140, 140], [150, 90], [120, 50], [130, 10], [190, -10], [250, 20],
      [290, 80], [300, 150], [340, 190], [390, 160], [400, 90], [370, 20], [380, -50], [350, -120], [280, -150],
      [200, -140], [150, -180], [80, -190], [30, -150], [0, -80],
    ],
    plots: { sun: 5, wheat: 3, pasture: 1, plow: 1 },
    landmarks: [['windmill', 4, 2], ['barn', 1, 8], ['silo', 1, 2.5], ['hay', 8, 1]],
    theme: {
      skyTop: '#5161C9', horizon: '#FFC18A', fogNear: 220, fogFar: 760,
      sun: '#FFB27A', sunInt: 2.3, sunOffset: [-140, 55, -30], hemiSky: '#FFE0BF', hemiGround: '#7A8F3A', hemiInt: 1.45,
      grass: '#97C24B', grassSpeck: ['#8DB743', '#A3CB57'], verge: '#90BC47', margin: '#A2CC58', outer: '#8DB743', hill: '#6E9F3A',
      road: '#C99A5E', roadSpeck: ['#B98749', '#D8AC70', '#C08A50', '#E8BE88'], roadEdge: '#A6743F', curbA: '#FFC300', curbB: '#6B3E1D',
      plotCols: { corn: '#7B9A34', wheat: '#EFC256', plow: '#9C643C', sun: '#8DB743', pasture: '#A4D36E', soy: '#6AA040' },
      trees: ['tree', 'pine'], banner: 'VALE DOS GIRASSÓIS', cloudTint: '#FFE3D0',
    },
  },
  {
    id: 'cerrado', name: 'Cerrado da Soja', subtitle: 'Cânion, túnel e curvas inclinadas', difficulty: 3, seed: 4242,
    ctrl: [
      [0, 0], [0, 70], [25, 110], [70, 120], [95, 90], [80, 55], [110, 30], [160, 40], [185, 80], [230, 95],
      [270, 70], [275, 20], [245, -15], [260, -60], [230, -110], [170, -120], [130, -90], [90, -110], [45, -140],
      [10, -110], [-10, -60],
    ],
    plots: { soy: 5, plow: 2, corn: 1, pasture: 2 },
    landmarks: [['silo', 3, 2.5], ['barn', 1, 8], ['windmill', 1, 2], ['hay', 4, 1]],
    theme: {
      skyTop: '#4A8FD6', horizon: '#F3DDB0', fogNear: 240, fogFar: 780,
      sun: '#FFE2A8', sunInt: 2.5, sunOffset: [-90, 85, 60], hemiSky: '#FFF2DA', hemiGround: '#8A6A35', hemiInt: 1.5,
      grass: '#B8B45A', grassSpeck: ['#AAA74F', '#C6C26A'], verge: '#ADA953', margin: '#C2BE66', outer: '#A9A44F', hill: '#8E9A45',
      road: '#B85A33', roadSpeck: ['#A24A27', '#C96A40', '#9C4422', '#D9825A'], roadEdge: '#8F3F1F', curbA: '#FFFFFF', curbB: '#1F8A4C',
      plotCols: { corn: '#7F9A3A', wheat: '#D9B85A', plow: '#9C4A2A', sun: '#8DB743', pasture: '#B7C46A', soy: '#4F9A35' },
      trees: ['cerrado_tree', 'cerrado_tree'], banner: 'CERRADO DA SOJA', cloudTint: '#FFFFFF',
    },
  },
];
TRACKS.push({
  id:'feira',name:'Feira da Colheita',subtitle:'Bandeirinhas, barracas e armazém',difficulty:2,seed:1911,
  ctrl:[[0,-70],[0,20],[15,70],[65,95],[125,80],[140,25],[115,-10],[155,-40],[215,-10],[245,45],[290,70],[330,35],[325,-30],[350,-90],[310,-145],[245,-160],[195,-120],[145,-155],[80,-170],[20,-135]],
  plots:{corn:2,wheat:2,pasture:5,sun:1},landmarks:[['barn',2,8],['hay',6,1],['silo',1,2.5]],
  theme:{...TRACKS[0].theme,skyTop:'#4D538F',horizon:'#F4B88E',sun:'#FFD2A3',sunInt:2.1,hemiSky:'#FFE6C9',banner:'FEIRA DA COLHEITA',cloudTint:'#FFD6BD',road:'#B99074',curbA:'#FFF0CF',curbB:'#E87578'},
});
export const trackById = id => TRACKS.find(t => t.id === id) ?? TRACKS[0];
