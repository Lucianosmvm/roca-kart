// A personal time-trial replay, sampled at 10 Hz. Never participates in collisions or ranking.
export class GhostRun {
  constructor(saved, definition, makeModel) {
    this.definition=JSON.parse(JSON.stringify(definition)); this.frames=[]; this.nextSample=0; this.saved=saved;
    this.model=null; this.materials=[]; this.cursor=0;
    if (saved?.revision===2 && Array.isArray(saved.frames) && saved.frames.length>1) {
      this.model=makeModel(saved.definition);
      for (const root of [this.model.root,this.model.trailer?.root].filter(Boolean)) root.traverse(o=>{
        if (!o.isMesh) return;
        o.material=o.material.clone(); o.material.transparent=true; o.material.opacity=.28; o.material.depthWrite=false;
        o.castShadow=false; this.materials.push(o.material);
      });
    }
  }
  update(time, player) {
    if (!player.finished && time >= this.nextSample && this.frames.length<12000) {
      this.frames.push([+time.toFixed(2),+player.pos.x.toFixed(3),+(player.groundY+player.y).toFixed(3),+player.pos.z.toFixed(3),+player.heading.toFixed(4)]);
      this.nextSample=time+.1;
    }
    if (!this.model) return;
    const f=this.saved.frames;
    while(this.cursor<f.length-2 && f[this.cursor+1][0]<time) this.cursor++;
    const a=f[this.cursor],b=f[this.cursor+1],u=Math.max(0,Math.min(1,(time-a[0])/Math.max(.001,b[0]-a[0])));
    const heading=a[4]+Math.atan2(Math.sin(b[4]-a[4]),Math.cos(b[4]-a[4]))*u;
    const x=a[1]+(b[1]-a[1])*u,y=a[2]+(b[2]-a[2])*u,z=a[3]+(b[3]-a[3])*u;
    this.model.root.position.set(x,y,z); this.model.root.rotation.y=heading;
    if(this.model.trailer) {
      const h=this.model.ch.hitch;
      this.model.trailer.root.position.set(x-Math.sin(heading)*h.back,y+h.y,z-Math.cos(heading)*h.back);
      this.model.trailer.root.rotation.y=heading;
    }
  }
  finish(time, player) {
    if(time>=1200) return null;
    this.frames.push([+time.toFixed(2),player.pos.x,player.groundY+player.y,player.pos.z,player.heading]);
    return { revision:2, time, definition:this.definition, frames:this.frames };
  }
  dispose() {
    this.model?.root.removeFromParent(); this.model?.trailer?.root.removeFromParent();
    this.model?.dispose(); this.materials.forEach(m=>m.dispose());
  }
}
