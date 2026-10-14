// Independent deterministic kinematic practice model. SI units throughout.
export const FIELD={ground:11,l1:6,l2:3,h1:.6,h2:.9,ramp:3.5,transfer:{x:-3.5,z:1.5},mustika:{x:0,z:-4.25},sky:{x:0,z:4.2}};
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const point=(x,z)=>({x,z});
export class Simulation{
 constructor(){this.settings={trSpeed:1.8,brSpeed:1.15,handling:1.1,plan:'l2'};this.reset()}
 reset(){this.time=0;this.running=false;this.finished=false;this.auto=false;this.unlocked=false;this.enshrined=false;this.transferPoints=0;this.messages=[];this.events=[];this.queue=[];this.objects=[];this.nextId=0;this.tr=this.robot('TR',-5.05,5.02);this.br=this.robot('BR',-4.21,5.02);this.tr.task='Ready to collect';this.br.task='Ready to climb';this.br.phase='startup';this.tr.phase='choose';this.tr.location='ground';this.tr.aiTarget=null;this.br.job=null;this.br.hasEntered=false;this.retryCount=0;
 this.spots=[{x:-2.65,z:2.65,level:1,shared:false,blocks:[],name:'L1 · Home tower'},{x:this.settings.plan==='l2'?-1.2:0,z:this.settings.plan==='l2'?1.2:2.65,level:this.settings.plan==='l2'?2:1,shared:true,blocks:[],name:this.settings.plan==='l2'?'L2 · Shared tower':'L1 · Shared tower'}];
 for(let i=0;i<20;i++)this.object('earth',-5.25+(i%5)*.375,-5.0+(Math.floor(i/5)%2)*.38,Math.floor(i/10)*.35);
 let n=0;for(let r=0;r<5;r++)for(let c=0;c<5;c++)if((r+c)%2===0&&!(r===2&&c===2)){this.object('sky',(c-2)*.23,4.2+(r-2)*.23,0,n++%2===0?'red':'blue')}
 this.object('mustika',0,-4.25,.5);this.log('Practice ready. Start a run or watch the autonomous demo.');return this.snapshot()}
 robot(id,x,z){return{id,x,z,y:0,yaw:0,vx:0,vz:0,speed:0,load:[],path:[],wait:0,task:'Ready',phase:'',lift:.28,grip:0}}
 object(type,x,z,base=0,face='red'){const o={id:++this.nextId,type,x,z,y:base+(type==='earth'?.175:type==='sky'?.1:.105),state:'supply',face,delivered:false};o.initial={x:o.x,z:o.z,y:o.y};this.objects.push(o);return o}
 log(text){this.messages.unshift({time:this.time,text});this.messages=this.messages.slice(0,16)}
 start(auto=false){if(this.finished)this.reset();this.auto=auto;this.running=true;this.log(auto?'Autonomous demonstration started.':'Driver practice started. Builder operates autonomously.');return this.snapshot()}
 pause(){this.running=!this.running&&!this.finished;return this.snapshot()}
 height(x,z,id='BR'){if(id==='TR'){if(x>=-4&&x<=-3){if(z>=-2.5&&z<1)return(z+2.5)/3.5*.6;if(z>=1&&z<=2)return .6}return 0}
 if(Math.abs(x)<=1.5&&Math.abs(z)<=1.5)return .9;
 if(x>=-2.1&&x< -1.5&&Math.abs(z)<.5)return x< -1.8?.6:.75;
 if(Math.abs(x)<3&&Math.abs(z)<3)return .6;
 if(x>=-4&&x<=-3&&z>=1&&z<=2)return .6;
 if(x>=-4&&x<=-3&&z>2&&z<2.9)return z<2.3?.45:z<2.6?.3:.15;return 0}
 canTR(x,z){const r=.32;if(x< -5.5+r||z< -5.5+r||z>5.5-r)return false;
 // Dedicated ramp and transfer corridor; ramp-entry movement only from its north end.
 if(x>=-4+r&&x<=-3-r&&z>=-3.35&&z<=2-r)return true;
 // Expanded footprint around platform/ramp; no access from the sides or south steps.
 if(x> -4-r&&x<3+r&&z> -3-r&&z<3+r)return false;
 if(x<=-r)return true;
 return x<=.18&&((Math.abs(z-4.2)<.28)||(Math.abs(z+4.25)<.18))}
 moveManual(dx,dz,rot,dt){const r=this.tr;this.auto=false;r.path=[];r.phase='choose';const len=Math.hypot(dx,dz)||1;const v=this.settings.trSpeed;const k=Math.min(1,dt*5);r.vx+=(dx/len*v-r.vx)*k;r.vz+=(dz/len*v-r.vz)*k;r.yaw+=rot*1.6*dt;
 const nx=r.x+r.vx*dt,nz=r.z+r.vz*dt;
 // Prevent side entry into elevated ramp when current robot is on ground.
 const crossing=Math.abs(this.height(nx,nz,'TR')-r.y)>.09;
 if(this.canTR(nx,nz)&&!crossing){r.x=nx;r.z=nz}else{r.vx=0;r.vz=0}
 r.speed=Math.hypot(r.vx,r.vz);r.y=this.height(r.x,r.z,'TR');r.task=r.load.length?'Carry load to transfer':'Collect Earth or Sky blocks';}
 pickup(type=null,silent=false){if(!this.running||this.finished)return false;const r=this.tr;if(r.load.length>=3){if(!silent)this.log('Magazine full: deliver the 3 blocks.');return false}
 const candidate=this.objects.filter(o=>o.state==='supply'&&(!type||o.type===type)&&dist(r,o)<.96).sort((a,b)=>dist(a,r)-dist(b,r)||b.y-a.y)[0];
 if(!candidate){if(!silent)this.log('Move closer to a supply block. Pickup reach: 0.95 m.');return false}
 if(candidate.type==='mustika'&&!this.unlocked){if(!silent)this.log('Mustika locked: complete 2 towers, including 1 shared tower.');return false}
 if(candidate.type==='mustika'&&r.load.length){if(!silent)this.log('Deliver the block magazine before collecting the Mustika.');return false}
 if(r.load.some(o=>o.type==='mustika'))return false;
 candidate.state='tr';r.load.push(candidate);r.wait=this.settings.handling;r.grip=1;this.log(`TR lifted ${candidate.type==='mustika'?'the Mustika':candidate.type+' block'} (${r.load.length}/3).`);return true}
 deliver(silent=false){if(!this.running||this.finished)return false;const r=this.tr;
 if(Math.abs(r.x+3.5)>.17||Math.abs(r.z-1.5)>.17||r.y<.59){if(!silent)this.log('Drive fully onto the elevated transfer square to deliver.');return false}
 if(!r.load.length){if(!silent)this.log('Collect a block first.');return false}if(dist(r,this.br)<.8){if(!silent)this.log('Wait for the builder to clear the transfer pad.');return false}if(this.queue.length+r.load.length>4){if(!silent)this.log('Transfer pad occupied. Wait for the builder.');return false}
 for(const o of r.load){o.state='transfer';o.x=-3.7+(this.queue.length%2)*.4;o.z=1.28+Math.floor(this.queue.length/2)*.4;o.y=.6+(o.type==='earth'?.175:.105);this.queue.push(o);if(!o.delivered&&o.type!=='mustika'){this.transferPoints+=5;o.delivered=true}}
 this.log(`TR released ${r.load.length} object${r.load.length===1?'':'s'} within transfer.`);r.load=[];r.grip=0;r.wait=this.settings.handling;return true}
 trRouteTo(destination){const r=this.tr;const pts=[];if(r.y<.01&&r.z>3.3)pts.push(point(-4.7,r.z));if(r.y>.01||r.x>-4.33&&r.z> -3.4&&r.z<2.1)pts.push(point(-3.5,-3.7));pts.push(point(-4.7,-3.7));
 if(destination==='transfer')pts.push(point(-3.5,-3.7),point(-3.5,1.5));
 else if(destination==='earth')pts.push(point(-4.7,-4.3));
 else if(destination==='sky')pts.push(point(-4.7,3.75),point(-.64,4.2));
 else if(destination==='mustika')pts.push(point(-.68,-4.25));
 r.path=pts;r.task=destination==='transfer'?'Climb ramp · deliver':`Navigate · ${destination} supply`;r.aiTarget=destination;}
 advance(r,dt){if(!r.path.length){r.speed=0;return true}let remaining=dt;let speed=(r.id==='TR'?this.settings.trSpeed:this.settings.brSpeed);if(r.id==='BR'&&(r.x< -3&&r.z>2&&r.z<3||r.x> -2.1&&r.x< -1.45&&Math.abs(r.z)<.55))speed*=.45;
 while(remaining>0&&r.path.length){const t=r.path[0],d=dist(r,t),step=speed*remaining;if(d<=step+.001){r.x=t.x;r.z=t.z;remaining-=d/speed;r.path.shift()}else{r.x+=(t.x-r.x)/d*step;r.z+=(t.z-r.z)/d*step;remaining=0}if(d>.01)r.yaw=Math.atan2(t.x-r.x,t.z-r.z)}r.y=this.height(r.x,r.z,r.id);r.speed=r.path.length?speed:0;return !r.path.length}
 autoTR(dt){const r=this.tr;if(r.wait>0)return;if(r.path.length){this.advance(r,dt);return}if(r.phase==='travel'){
 if(r.aiTarget==='transfer'){if(this.deliver(true)){r.path=[point(-3.5,-3.7),point(-4.7,-3.7)];r.phase='choose'}return}
 const target=r.aiTarget;const needed=target==='earth'?4:target==='sky'?2:1;
 const acquired=this.objects.filter(o=>o.type===target&&o.state!=='supply').length;
 if(acquired<needed&&r.load.length<3){let available=this.objects.filter(o=>o.type===target&&o.state==='supply').sort((a,b)=>dist(a,r)-dist(b,r));if(available[0]&&dist(available[0],r)>.94){r.path=[point(Math.min(-.62,available[0].x),target==='earth'?-4.3:available[0].z)];return}if(this.pickup(target,true))return}
 if(r.load.length){this.trRouteTo('transfer');return}r.phase='choose'}
 if(r.phase==='choose'){const earth=this.objects.filter(o=>o.type==='earth'&&o.state!=='supply').length,sky=this.objects.filter(o=>o.type==='sky'&&o.state!=='supply').length;
 const target=earth<4?'earth':sky<2?'sky':this.unlocked&&!this.enshrined&&this.objects.find(o=>o.type==='mustika').state==='supply'?'mustika':null;
 if(target){this.trRouteTo(target);r.phase='travel'}else{r.task=this.enshrined?'Mission delivered · hold':'Await sanctuary mandate';r.speed=0}}}
 brHomePath(){const r=this.br;let p=[];if(r.y>.8)p.push(point(-1.15,0),point(-2.35,0));p.push(point(-2.4,1.5));return p}
 brJobPath(job){const p=[point(-2.4,1.5)];if(job.kind==='mustika'||this.spots[job.spot].level===2){p.push(point(-2.35,0),point(-1.15,0));if(job.kind==='mustika')p.push(point(-.5,0));else p.push(point(-.65,.85))}else{const s=this.spots[job.spot];p.push(point(-2.25,2.1),point(s.x===0?-.35:-2.25,2.25))}return p}
 chooseJob(){if(this.unlocked&&!this.enshrined){const obj=this.queue.find(o=>o.type==='mustika');if(obj)return{kind:'mustika',obj}}
 // Match objects visible on the pad to the next legal layer at each planned tower.
 for(let s=0;s<this.spots.length;s++){let spot=this.spots[s];if(spot.blocks.length>=3)continue;let type=spot.blocks.length<2?'earth':'sky';let obj=this.queue.find(o=>o.type===type);if(obj)return{kind:'block',spot:s,obj}}return null}
 autoBR(dt){const r=this.br;if(r.wait>0)return;if(r.path.length){this.advance(r,dt);return}
 if(r.phase==='startup'){r.path=[point(-3.5,3.4),point(-3.5,1.5),point(-2.4,1.5)];r.phase='observe';r.task='Climb stairs · reach L1';return}
 if(r.phase==='observe'){r.hasEntered=true;let job=this.chooseJob();if(!job){r.task=this.enshrined?'Mission complete · hold':'Observe transfer pad';return}if(dist(this.tr,point(-3.5,1.5))<1.05){r.task='Wait for transporter to clear pad';return}r.job=job;r.path=[point(-3.5,1.5)];r.phase='collect';r.task='Approach released object';return}
 if(r.phase==='collect'){const o=r.job.obj;this.queue.splice(this.queue.indexOf(o),1);o.state='br';r.load=[o];r.grip=1;r.wait=this.settings.handling;r.phase='toBuild';r.task=`Lift ${o.type} from transfer`;return}
 if(r.phase==='toBuild'){r.path=this.brJobPath(r.job);r.phase='place';r.task=r.job.kind==='mustika'?'Climb L2 · enshrine Mustika':`Build ${this.spots[r.job.spot].name}`;return}
 if(r.phase==='place'){r.lift=r.job.kind==='mustika'?.86:.25+.35*this.spots[r.job.spot].blocks.length;r.wait=this.settings.handling;r.phase='release';return}
 if(r.phase==='release'){const job=r.job,o=job.obj;if(job.kind==='mustika'){o.state='enshrined';o.x=0;o.z=0;o.y=1.76;this.enshrined=true;this.log('Mustika enshrined · +250 provisional points. Match continues.')}else{let s=this.spots[job.spot];o.state='placed';o.x=s.x;o.z=s.z;o.y=(s.level===2?.9:.6)+s.blocks.length*.35+(o.type==='earth'?.175:.1);o.face='red';s.blocks.push(o);this.log(`${s.name}: ${s.blocks.length===3?'tower complete':s.blocks.length+'/3 layers'}.`);if(this.spots.filter(s=>s.blocks.length===3).length>=2&&this.spots.some(s=>s.shared&&s.blocks.length===3)){this.unlocked=true;this.log('Sanctuary mandate achieved. Mustika retrieval unlocked.')}}r.load=[];r.grip=0;r.lift=.28;r.path=this.brHomePath();r.phase='observe';r.task='Return to transfer pad';return}}
 retry(){if(!this.running)return false;for(const o of this.tr.load){o.state='supply';Object.assign(o,o.initial)}this.tr=this.robot('TR',-5.05,5.02);this.tr.phase='choose';this.retryCount++;this.log('Practice retry: TR at start; its held objects returned to supply.');return true}
 update(dt,input={}){if(!this.running||this.finished)return;dt=Math.min(dt,.1);this.time=Math.min(180,this.time+dt);for(const r of[this.tr,this.br])r.wait=Math.max(0,r.wait-dt);
 if(this.time>=180){this.running=false;this.finished=true;this.tr.speed=this.br.speed=0;this.log(`Time. Final practice score: ${this.score().total}.`);return}
 if(this.auto)this.autoTR(dt);else this.moveManual(input.x||0,input.z||0,input.rot||0,dt);this.autoBR(dt);this.updateLoads()}
 updateLoads(){for(const r of[this.tr,this.br])r.load.forEach((o,i)=>{const xx=r.id==='TR'?(i===0?-.19:i===1?.19:0):0,zz=r.id==='TR'?(i<2?-.12:.28):.35;o.x=r.x+Math.cos(r.yaw)*xx+Math.sin(r.yaw)*zz;o.z=r.z-Math.sin(r.yaw)*xx+Math.cos(r.yaw)*zz;o.y=r.y+(r.id==='TR'?.43:r.lift+.1)});}
 score(){let tower=0;for(const s of this.spots)s.blocks.forEach((o,i)=>tower+=([10,20,40][i]||0)*(s.level===2?2:1));let mustika=this.enshrined?250:0;return{transfer:this.transferPoints,tower,mustika,total:this.transferPoints+tower+mustika}}
 snapshot(){return{time:Math.round(this.time*10)/10,running:this.running,finished:this.finished,autonomousDemo:this.auto,score:this.score(),mandateUnlocked:this.unlocked,mustikaEnshrined:this.enshrined,towers:this.spots.map(s=>({name:s.name,layers:s.blocks.length})),tr:{x:this.tr.x,z:this.tr.z,load:this.tr.load.map(o=>o.type),task:this.tr.task},br:{x:this.br.x,z:this.br.z,load:this.br.load.map(o=>o.type),task:this.br.task}}}
}
