import { profile, save } from './save.js';

export const CUP = { id: 'colheita', name: 'Copa da Colheita', tracks: ['milharal','girassol','cerrado'], points: [10,7,5,3,2,1] };
export const CHALLENGES = [
  { id:'drift', name:'Dança na terra', description:'Complete uma volta com 5 mini-turbos de drift.', metric:'drift', target:5, reward:'Adesivo Relâmpago' },
  { id:'jumps', name:'Asas da roça', description:'Complete uma volta com 3 saltos e aterrissagens.', metric:'jumps', target:3, reward:'Pintura Céu da Colheita' },
  { id:'corn', name:'Cesta cheia', description:'Complete uma volta e colete 20 moedas de milho.', metric:'corn', target:20, reward:'Estampa Florada' },
];
export const freshMetrics = () => ({ drift:0, perfect:0, jumps:0, corn:0, shortcuts:0 });
export const challengeCount = (challenge,metrics) => challenge.metric==='drift' ? metrics.drift+metrics.perfect : metrics[challenge.metric];
export function awardProgress(metrics, { finished=false, cupPlace=null, challenge=null } = {}) {
  const earned=[];
  const unlock=(id,label,action) => {
    if (profile.achievements.includes(id)) return;
    profile.achievements.push(id); action(); earned.push(label);
  };
  if (finished && metrics.drift + metrics.perfect >= 5) unlock('drift','Adesivo Relâmpago',()=>profile.owned.decals.push('lightning'));
  if (finished && metrics.jumps >= 3) unlock('jumps','Pintura Céu da Colheita',()=>profile.owned.paints.push('safra'));
  if (finished && metrics.corn >= 20) unlock('corn','Estampa Florada',()=>profile.owned.decals.push('flowers'));
  if (cupPlace && cupPlace <= 3) {
    profile.trophies[CUP.id] = Math.min(profile.trophies[CUP.id] ?? 99, cupPlace);
    unlock('cup','Adesivo Número 07',()=>{ profile.owned.decals.push('number'); profile.coins+=150; });
  }
  const selected=CHALLENGES.find(c=>c.id===challenge);
  if (finished && selected && challengeCount(selected,metrics) >= selected.target) {
    unlock('challenge:'+selected.id,'Desafio concluído: '+selected.name,()=>{profile.coins+=80;});
  }
  for (const key of ['paints','decals']) profile.owned[key]=[...new Set(profile.owned[key])];
  save(); return earned;
}
