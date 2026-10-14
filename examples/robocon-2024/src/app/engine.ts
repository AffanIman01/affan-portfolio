export type BallKind = 'paddy' | 'empty';
export type RobotId = 'r1' | 'r2';
export type Task = { x:number; z:number; name:string; duration?:number; done?:()=>void };
export type Robot = {id:RobotId;x:number;z:number;angle:number;vx:number;vz:number;lift:number;grip:number;seeds:number;ball:BallKind|null;ballId:number|null;tasks:Task[];dwell:number;state:string;travel:number};
export type Ball = {id:number;kind:BallKind;x:number;z:number;state:'field'|'carried'|'storage'|'silo'|'flight'|'lost';y:number};
export type Flight = {ball:Ball;x:number;z:number;y:number;vx:number;vz:number;vy:number;age:number};
export const PLANTS = Array.from({length:12},(_,i)=>({x:-5.05+(i%4)*.78,z:1.8+Math.floor(i/4)*1.12}));
export const SILOS = Array.from({length:5},(_,i)=>({x:1.85+i*.87,z:0}));
export const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export class HarvestEngine {
  robots:Record<RobotId,Robot>;
  planted:boolean[]=Array(12).fill(false);balls:Ball[]=[];flights:Flight[]=[];silos:BallKind[][]=Array.from({length:5},()=>[]);
  running=false;started=false;ended=false;won=false;demo=false;autoR2=true;timed=false;time=180;elapsed=0;speed=1.6;assist=true;launchAngle=52;launchSpeed=5.3;transferred=0;harvested=0;rack=12;plantTarget=6;selected:RobotId='r1';camera='orbit';view='arena';showPaths=true;mechanismCycle=0;gripTest=false;
  events:string[]=['Ready when you are. Start with a seedling.'];notice='Plant six seedlings, then alternate purple grain and red paddy.';
  constructor(){
    const robot=(id:RobotId,x:number,z:number):Robot=>({id,x,z,angle:0,vx:0,vz:0,lift:0,grip:1,seeds:0,ball:null,ballId:null,tasks:[],dwell:0,state:'Ready',travel:0});
    this.robots={r1:robot('r1',-5.45,4.7),r2:robot('r2',-4.05,4.7)};
    for(let i=0;i<12;i++)this.balls.push({id:i,kind:i%2===0?'empty':'paddy',x:-1.2+(i%2)*1.0,z:1.7+Math.floor(i/2)*.52,y:.39,state:'field'});
    for(let i=0;i<16;i++)this.balls.push({id:12+i,kind:i<6?'paddy':'empty',x:2.75+(i%4)*.48,z:2.2+Math.floor(i/4)*.48,y:.60,state:'storage'});
  }
  get plantedCount(){return this.planted.filter(Boolean).length;}
  get stored(){return this.silos.reduce((n,s)=>n+s.length,0);}
  get score(){return this.plantedCount*10+this.transferred*10+this.stored*30;}
  get wonSilos(){return this.silos.filter(s=>s.length===3&&s.filter(c=>c==='paddy').length>=2&&s[2]==='paddy').length;}
  get busy(){return this.robots.r1.tasks.length>0;}
  log(text:string){this.notice=text;this.events=[text,...this.events].slice(0,6);}
  play(){if(this.ended)return;this.running=true;this.started=true;}
  pause(){this.running=false;}
  toggle(){this.running?this.pause():this.play();}
  move(id:RobotId,x:number,z:number){
    if(id==='r2'){this.log('R2 is autonomous. It collects and stores one paddy at a time.');return;}
    if(this.ended)return;if(x>1.12){this.log('R1 is limited to Areas 1 and 2. Choose a point before the storage terrace.');return;}
    const r=this.robots[id];if(r.dwell>0){this.log('Wait for the mechanism to finish its cycle.');return;}
    // Preserve a queued action rather than abandoning reserved cargo midway.
    if(r.tasks.some(t=>t.done)){this.log('Finish the current action before setting another waypoint.');return;}
    x=clamp(x,-5.55,1.08);z=clamp(z,.75,4.85);if(x>.30&&z>3.65){this.log('Water is off limits. Choose a point on the dry field.');return;}this.play();this.demo=false;r.tasks=[];if((r.z>3.65||z>3.65)&&(r.x>.3||x>.3))r.tasks.push(this.task(.10,3.40,'Routing around water'));r.tasks.push({x,z,name:'Moving to waypoint'});r.dwell=0;
  }
  cancel(){const r=this.robots.r1;this.demo=false;if(r.tasks.some(t=>t.done)){this.log('Demo stopped. The current mechanism task will finish.');return;}r.tasks=[];r.vx=0;r.vz=0;this.log('Route cancelled. R1 is ready.');}
  task(x:number,z:number,name:string,duration=0,done?:()=>void):Task{return {x,z,name,duration,done};}
  plant(){
    if(this.ended||this.busy)return;const idx=this.planted.findIndex(p=>!p);if(idx<0){this.log('All twelve seedlings planted. Harvest is fully unlocked.');return;}
    this.play();const r=this.robots.r1,p=PLANTS[idx];
    if(!r.seeds)r.tasks.push(this.task(-5.4,.85,'Collecting seedlings',1.1,()=>{r.seeds=Math.min(3,this.rack);this.rack-=r.seeds;this.log('Cassette loaded. Travelling with the lift lowered.');}));
    r.tasks.push(this.task(p.x,p.z,'Lowering seedling',.9,()=>{this.planted[idx]=true;r.seeds--;this.log('Seedling planted · +10 points · one harvest pickup unlocked.');}));
  }
  harvest(){
    if(this.ended||this.busy)return;const r=this.robots.r1;if(r.ball){this.transfer();return;}
    if(this.flights.length){this.log('Wait for the transfer to land before harvesting again.');return;}
    if(this.harvested>=this.plantedCount){this.log('Plant another seedling first: one planting unlocks one ball pickup.');return;}
    const kind:BallKind=this.harvested%2===0?'empty':'paddy';const b=this.balls.find(b=>b.state==='field'&&b.kind===kind);
    if(!b){this.log('No more harvest balls of this color.');return;}
    this.play();r.tasks.push(this.task(-1.75,r.z,'Approaching harvest lane'),this.task(b.x-.38,b.z,'Closing compliant gripper',1,()=>{r.ball=b.kind;r.ballId=b.id;b.state='carried';this.harvested++;this.log(`${kind==='empty'?'Purple grain':'Red paddy'} collected. Transfer it to storage.`);}));
  }
  launchSolution(){const r=this.robots.r1;const tx=3.35,tz=3.65,heading=Math.atan2(tx-r.x,tz-r.z),x=r.x+Math.sin(heading)*.3,z=r.z+Math.cos(heading)*.3,y=1.08,a=this.launchAngle*Math.PI/180,d=Math.hypot(tx-x,tz-z);const denominator=2*Math.cos(a)**2*(d*Math.tan(a)-(.60-y));const v=this.assist?Math.sqrt(Math.max(0,9.81*d*d/denominator)):this.launchSpeed;return {x,y,z,v,vx:v*Math.cos(a)*(tx-x)/d,vz:v*Math.cos(a)*(tz-z)/d,vy:v*Math.sin(a)};}
  transfer(){
    if(this.ended||this.busy)return;const r=this.robots.r1;if(!r.ball){this.log('Collect a harvest ball before launching.');return;}
    this.play();r.tasks.push(this.task(.65,2.75,'Aligning transfer launcher',.9,()=>{
      const b=this.balls.find(b=>b.id===r.ballId);if(!b)return;r.angle=Math.atan2(3.35-r.x,3.65-r.z);const s=this.launchSolution();this.launchSpeed=s.v;b.state='flight';r.ball=null;r.ballId=null;
      this.flights.push({ball:b,x:s.x,y:s.y,z:s.z,vx:s.vx,vz:s.vz,vy:s.vy,age:0});this.log('Ball in flight. R2 waits for it to land.');
    }));
  }
  get enoughPaddy(){return this.balls.filter(b=>b.kind==='paddy'&&['storage','silo','flight'].includes(b.state)||b.kind==='paddy'&&b.id===this.robots.r2.ballId).length>=9;}
  next(){if(this.enoughPaddy&&!this.robots.r1.ball){if(this.demo){this.demo=false;this.log('Nine paddy secured or in flight. R2 will finish the silos.');}return;}if(this.robots.r1.ball)this.transfer();else if(this.plantedCount<this.plantTarget)this.plant();else if(this.harvested<this.plantedCount)this.harvest();else if(this.harvested<12)this.plant();else if(this.demo){this.demo=false;this.log('R1 tasks complete. R2 is finishing the silo sequence.');}}
  nextLabel(){if(this.enoughPaddy&&!this.robots.r1.ball)return 'R2 is finishing the silos';if(this.robots.r1.ball)return 'Transfer to storage';if(this.plantedCount<this.plantTarget||this.harvested>=this.plantedCount&&this.harvested<12)return 'Plant next seedling';if(this.harvested<12)return `Collect ${this.harvested%2===0?'empty grain':'red paddy'}`;return 'R1 tasks complete';}
  r2Auto(){
    const r=this.robots.r2;if(!this.autoR2||r.tasks.length||this.ended)return;
    if(r.x<1.7){r.tasks.push(this.task(-1.65,.8,'Empty transit to terrace'),this.task(1.85,.8,'Climbing empty'),this.task(2.45,1.25,'Searching for red paddy'));return;}
    const b=this.balls.filter(b=>b.kind==='paddy'&&b.state==='storage').sort((a,b)=>Math.hypot(a.x-r.x,a.z-r.z)-Math.hypot(b.x-r.x,b.z-r.z))[0];const idx=this.silos.findIndex(s=>s.length<3);
    if(!b||idx<0){r.state='Waiting for transferred paddy';return;}const silo=SILOS[idx];
    r.tasks.push(this.task(b.x,b.z,'Detecting red · rejecting purple',.7,()=>{b.state='carried';r.ball='paddy';r.ballId=b.id;}),this.task(silo.x,.82,'Lifting paddy to silo',1.2,()=>{b.state='silo';b.x=silo.x;b.z=silo.z;b.y=.65+this.silos[idx].length*.22;this.silos[idx].push('paddy');r.ball=null;r.ballId=null;this.log(`Silo ${idx+1}: ${this.silos[idx].length}/3 · +30 points.`);if(this.wonSilos>=3){this.won=true;this.ended=true;this.running=false;this.log('Mùa Vàng! Three full silos secured.');}}));
  }
  step(dt:number,keys:Set<string>=new Set()){
    dt=Math.min(dt,.05);if(this.view==='mechanism')this.mechanismCycle+=dt;if(!this.running||this.ended)return;
    this.elapsed+=dt;if(this.timed){this.time=Math.max(0,this.time-dt);if(this.time===0){this.ended=true;this.running=false;this.log('Time is up. Your solo trial is complete.');return;}}
    if(this.demo&&!this.busy)this.next();this.r2Auto();
    for(const id of ['r1','r2'] as RobotId[]){
      const r=this.robots[id];const kx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),kz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
      const manual=id==='r1'&&this.selected==='r1'&&(kx||kz)&&!r.tasks.some(t=>t.done);let dx=0,dz=0;
      if(manual){r.tasks=[];this.demo=false;dx=kx;dz=kz;r.state='Manual drive';}
      else if(r.tasks.length){const t=r.tasks[0];dx=t.x-r.x;dz=t.z-r.z;r.state=t.name;const dist=Math.hypot(dx,dz);if(dist<.05){r.x=t.x;r.z=t.z;dx=dz=0;r.vx=r.vz=0;r.dwell+=dt;if(t.duration){if(t.name==='Aligning transfer launcher')r.angle+=(Math.atan2(3.35-r.x,3.65-r.z)-r.angle)*Math.min(1,dt*5);if(t.name==='Lifting paddy to silo')r.angle+=(Math.PI-r.angle)*Math.min(1,dt*6);r.lift=Math.sin(Math.min(1,r.dwell/t.duration)*Math.PI);r.grip=r.dwell/t.duration<.5?.2:.7;}if(r.dwell>=(t.duration||.02)){r.tasks.shift();r.dwell=0;r.lift=0;r.grip=1;t.done?.();}}}
      else r.state=id==='r2'?'Waiting for red paddy':'Ready';
      const dist=Math.hypot(dx,dz),v=this.speed*(r.ball?.72:1)*(id==='r2'?.82:1),max=Math.min(v,dist/dt);const tvx=dist>.001?dx/dist*max:0,tvz=dist>.001?dz/dist*max:0;r.vx+=(tvx-r.vx)*Math.min(1,dt*7);r.vz+=(tvz-r.vz)*Math.min(1,dt*7);
      let nx=clamp(r.x+r.vx*dt,-5.6,id==='r1'?1.12:5.65),nz=clamp(r.z+r.vz*dt,.72,4.85);
      if(nx>.30&&nx<1.55&&nz>3.65){nx=r.x;nz=r.z;r.vx=0;r.vz=0;}
      const other=this.robots[id==='r1'?'r2':'r1'];if(Math.hypot(nx-other.x,nz-other.z)<.56){nx=r.x;nz=r.z;}
      r.travel+=Math.hypot(nx-r.x,nz-r.z);r.x=nx;r.z=nz;
      if(dist>.1){const target=Math.atan2(dx,dz);let diff=target-r.angle;while(diff>Math.PI)diff-=Math.PI*2;while(diff<-Math.PI)diff+=Math.PI*2;r.angle+=diff*Math.min(1,dt*8);r.angle=Math.atan2(Math.sin(r.angle),Math.cos(r.angle));}
    }
    for(let i=this.flights.length-1;i>=0;i--){const f=this.flights[i];f.age+=dt;f.x+=f.vx*dt;f.z+=f.vz*dt;f.y+=f.vy*dt-.5*9.81*dt*dt;f.vy-=9.81*dt;Object.assign(f.ball,{x:f.x,y:f.y,z:f.z});if(f.y<=.60){const good=f.x>=2.4&&f.x<=4.7&&f.z>=1.9&&f.z<=4.5;f.ball.state=good?'storage':'lost';f.ball.y=.60;if(good){this.transferred++;this.log('Clean landing in storage · +10 points.');}else this.log('Transfer missed. Enable aim assist for the next shot.');this.flights.splice(i,1);}}
  }
  snapshot(){return {score:this.score,planted:this.plantedCount,harvested:this.harvested,transferred:this.transferred,stored:this.stored,silos:this.silos.map(s=>s.length),won:this.won,running:this.running,notice:this.notice};}
}
