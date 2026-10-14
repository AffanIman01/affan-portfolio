import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HarvestEngine, PLANTS, SILOS, RobotId } from './engine';
const C={red:0xe66646,blue:0x5996bb,green:0x6c9d69,yellow:0xddbb62,steel:0xd2dad6,dark:0x293638,purple:0x9174b3,ink:0x294238};
export function createArena(host:HTMLElement,get:()=>HarvestEngine,keys:Set<string>,onChange:()=>void,onSelect:(r:RobotId)=>void){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xdbe5df);scene.fog=new THREE.Fog(0xdbe5df,38,75);
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.setClearColor(0xdbe5df);host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','Interactive three-dimensional Harvest Day arena. Click a floor point to drive R1; drag to orbit.');renderer.domElement.setAttribute('role','img');
 const camera=new THREE.PerspectiveCamera(40,1,.1,150);camera.position.set(-11.8,13.8,16.8);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.1,.6);controls.enableDamping=true;controls.dampingFactor=.07;controls.minDistance=4;controls.maxDistance=33;controls.maxPolarAngle=Math.PI/2.12;controls.minPolarAngle=.08;controls.enablePan=true;
 scene.add(new THREE.HemisphereLight(0xf8fff5,0x506056,2.8));const sun=new THREE.DirectionalLight(0xfff5dc,3.5);sun.position.set(-5,13,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.03;sun.shadow.bias=-.0002;scene.add(sun);
 const ambient=new THREE.DirectionalLight(0xc5dceb,1.4);ambient.position.set(8,5,-8);scene.add(ambient);
 const materials:THREE.Material[]=[];const geometries:THREE.BufferGeometry[]=[];const textures:THREE.Texture[]=[];
 function material(color:number,metalness=.1,roughness=.6){const m=new THREE.MeshStandardMaterial({color,metalness,roughness});materials.push(m);return m;}
 const metal=material(C.steel,.7,.32),dark=material(C.dark,.5,.4),rubber=material(0x1a2527,0,.9),red=material(C.red,.3,.38),blue=material(C.blue,.15,.6),purple=material(C.purple,.2,.5),gold=material(C.yellow,.1,.55),white=material(0xf3f2df,.05,.7),leaf=material(0x7fbe50,.15,.65),stalk=material(0xf5d470,.1,.6);
 function mesh(g:THREE.BufferGeometry,m:THREE.Material,parent:THREE.Object3D,x=0,y=0,z=0){geometries.push(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(p:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material){return mesh(new THREE.BoxGeometry(w,h,d),m,p,x,y,z);}
 function cyl(p:THREE.Object3D,r:number,h:number,x:number,y:number,z:number,m:THREE.Material,r2=r){return mesh(new THREE.CylinderGeometry(r,r2,h,20),m,p,x,y,z);}
 function ring(p:THREE.Object3D,r:number,t:number,x:number,y:number,z:number,m:THREE.Material){const o=mesh(new THREE.TorusGeometry(r,t,8,40),m,p,x,y,z);o.rotation.x=Math.PI/2;return o;}
 function label(p:THREE.Object3D,text:string,x:number,y:number,z:number,color='#28443b',size=.65){const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.font='600 54px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,384,64);const texture=new THREE.CanvasTexture(canvas);textures.push(texture);const m=new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:true});materials.push(m);const s=new THREE.Sprite(m);s.position.set(x,y,z);s.scale.set(size*6,size,1);p.add(s);return s;}
 const floor=new THREE.Group();scene.add(floor);box(floor,200,.1,200,0,-.9,0,material(0xdbe5df,0,.95));
 const field=new THREE.Group();scene.add(field);box(field,12.6,.42,11.15,0,-.47,0,dark);box(field,12.35,.18,10.85,0,-.19,0,white);
 for(const side of [1,-1]){
   box(field,4,.1,5.08,-4,.02,side*2.67,material(side===1?0xc7d49f:0xc8d3b4));
   box(field,3.5,.26,5.08,-.25,.11,side*2.67,material(side===1?0xb1bf76:0xb6c3a5));
   box(field,4.5,.46,5.08,3.75,.21,side*2.67,material(side===1?0xe2c570:0xcacaac));
   box(field,2.34,.03,2.65,3.52,.465,side*3.18,material(side===1?0x86a875:0x9bb3a3));
   box(field,.58,.025,1.25,.98,.25,side*4.49,material(0x7db8c8,.2,.2));
   for(let n=0;n<6;n++)box(field,.42,.008,.013,.98,.267,side*(4.03+n*.19),white);
   box(field,.6,.03,.8,-5.48,.09,side*4.73,side===1?red:blue);box(field,.6,.03,.8,-4.09,.09,side*4.73,side===1?red:blue);
   // Low, broad transition ramps illustrate the climb instead of teleporting between levels.
   for(const [x,y] of [[-2,.14],[1.5,.34]]){const ramp=box(field,.65,.05,.9,x,y-.06,side*.91,metal);ramp.rotation.z=-.25;}
   box(field,1.45,.10,.45,-5.15,.18,side*.76,dark);
   for(let i=0;i<12;i++){const p=PLANTS[i];ring(field,.245,.014,p.x,.09,side*p.z,white);}
   label(field,'01   PLANT',-3.95,.12,side*1.2,'#476246',.28);label(field,'02   HARVEST',-.5,.37,side*.72,'#59633e',.24);label(field,'03   STORE',3.75,.57,side*4.88,'#766031',.28);
   box(field,12.2,.1,.07,0,.07,side*5.26,side===1?red:blue);
 }
 // Raised central silo zone, shared by both teams.
 box(field,4.65,.36,.6,3.55,.2,0,dark);box(field,7.5,.08,.10,-2.3,.13,0,white);
 const siloFill:THREE.Mesh[][]=[];
 const clear=new THREE.MeshPhysicalMaterial({color:0xffffff,transparent:true,opacity:.19,roughness:.15,metalness:.1,side:THREE.DoubleSide,depthWrite:false});materials.push(clear);
 SILOS.forEach((p,i)=>{cyl(field,.29,.07,p.x,.43,p.z,dark);const shell=mesh(new THREE.CylinderGeometry(.275,.275,.83,24,1,true),clear,field,p.x,.87,p.z);shell.castShadow=false;ring(field,.28,.027,p.x,1.29,p.z,metal);ring(field,.28,.025,p.x,.49,p.z,metal);for(const a of [0,Math.PI*.5,Math.PI,Math.PI*1.5])box(field,.025,.8,.025,p.x+Math.cos(a)*.285,.87,p.z+Math.sin(a)*.285,metal);label(field,'S'+(i+1),p.x,1.62,p.z,'#263b34',.13);siloFill.push([]);});
 const plantModels:THREE.Group[]=[];function seed(parent:THREE.Object3D,x:number,y:number,z:number,scale=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);parent.add(g);cyl(g,.045,.34,0,.18,0,white);for(let j=0;j<3;j++){const a=j*2.1;const l=mesh(new THREE.ConeGeometry(.055,.35,4),leaf,g,Math.cos(a)*.075,.4,Math.sin(a)*.075);l.rotation.z=Math.cos(a)*.5;l.rotation.x=Math.sin(a)*.5;}return g;}
 PLANTS.forEach(p=>{const s=seed(field,p.x,.08,p.z);s.visible=false;plantModels.push(s);});
 const rackSeeds=Array.from({length:12},(_,i)=>seed(field,-5.7+(i%6)*.22,.23,.58+Math.floor(i/6)*.25,.8));
 // Opponent half is a quiet reference. It has no hidden scoring or moving AI.
 PLANTS.forEach(p=>{const s=seed(field,p.x,.08,-p.z,.68);s.visible=false;});
 const ballMeshes:THREE.Mesh[]=[];get().balls.forEach(b=>{ballMeshes.push(mesh(new THREE.SphereGeometry(.12,20,14),b.kind==='paddy'?red:purple,field,b.x,b.y,b.z));});
 for(let i=0;i<12;i++)mesh(new THREE.SphereGeometry(.1,16,10),i%2?blue:purple,field,-1.2+(i%2)*1,-.0+.38,-(1.7+Math.floor(i/2)*.52));
 for(let i=0;i<16;i++)mesh(new THREE.SphereGeometry(.1,16,10),i<6?blue:purple,field,2.75+(i%4)*.48,.60,-(2.2+Math.floor(i/4)*.48));
 label(field,'BLUE · REFERENCE HALF',-3.8,.35,-5.65,'#718985',.22);label(field,'RED · YOUR TEAM',-3.8,.25,5.74,'#6d6960',.22);
 const robotRoot=new THREE.Group();scene.add(robotRoot);
 function makeRobot(id:RobotId){
   const root=new THREE.Group();robotRoot.add(root);root.userData.robot=id;
   const base=new THREE.Group();root.add(base);box(base,.55,.12,.66,0,.22,0,dark);box(base,.47,.06,.55,0,.31,0,id==='r1'?red:material(0x427c73,.3,.3));
   box(base,.5,.035,.58,0,.13,0,metal);
   const wheels:THREE.Group[]=[];for(const x of [-.34,.34])for(const z of [-.22,.22]){const w=new THREE.Group();w.position.set(x,.17,z);base.add(w);const tire=cyl(w,.145,.10,0,0,0,rubber);tire.rotation.z=Math.PI/2;const hub=cyl(w,.075,.115,0,0,0,metal);hub.rotation.z=Math.PI/2;for(let a=0;a<8;a++){const roller=cyl(w,.021,.108,0,Math.cos(a*Math.PI/4)*.135,Math.sin(a*Math.PI/4)*.135,metal);roller.rotation.z=Math.PI/2;roller.rotation.y=.5;}wheels.push(w);}
   // Two extrusion columns, belt, carriage, coupled fingers and a visible payload cradle.
   const mast=new THREE.Group();root.add(mast);for(const x of [-.2,.2]){box(mast,.05,id==='r2'?1.03:.67,.05,x,id==='r2'?.78:.6,.04,metal);box(mast,.014,id==='r2'?.94:.59,.02,x+.028,id==='r2'?.78:.6,.075,rubber);}
   box(mast,.44,.06,.09,0,id==='r2'?1.28:.93,.04,dark);cyl(mast,.062,.05,0,.41,-.04,dark).rotation.x=Math.PI/2;
   const carriage=new THREE.Group();carriage.position.y=.37;root.add(carriage);box(carriage,.43,.10,.11,0,0,.065,dark);box(carriage,.27,.025,.25,0,-.02,.25,metal);
   const fingers:THREE.Mesh[]=[];for(const x of [-.17,.17]){const f=box(carriage,.035,.14,.27,x,.04,.28,metal);fingers.push(f);box(f,.016,.075,.10,0,0,.045,rubber);}
   const payload=mesh(new THREE.SphereGeometry(.12,20,14),red,carriage,0,.1,.27);payload.visible=false;
   const sensor=box(root,.11,.065,.06,0,id==='r2'?1.32:.97,.06,dark);box(sensor,.055,.026,.009,0,0,.04,material(0x91e8d7,.25,.25));
   const cassette=new THREE.Group();root.add(cassette);cassette.position.set(0,.36,-.18);const load:THREE.Group[]=[];
   if(id==='r1'){for(let i=0;i<3;i++){cyl(cassette,.058,.11,-.13+i*.13,.025,0,dark);load.push(seed(cassette,-.13+i*.13,.04,0,.6));}for(const x of [-.16,.16]){const wheel=cyl(root,.10,.065,x,.52,.25,rubber);wheel.rotation.z=Math.PI/2;}box(root,.32,.035,.25,0,.45,.26,metal);}
   else {box(root,.30,.14,.25,0,.41,-.17,dark);box(root,.17,.015,.13,0,.49,-.17,red);}
   const selection=ring(root,.55,.014,0,.065,0,material(0xf6fff4));const badge=label(root,id.toUpperCase(),0,1.62,0,'#173c33',.15);
   return {root,base,mast,carriage,fingers,payload,wheels,load,selection,badge,cassette};
 }
 const bots={r1:makeRobot('r1'),r2:makeRobot('r2')};
 const routeMaterial=new THREE.LineDashedMaterial({color:0xf16b3d,dashSize:.13,gapSize:.10,linewidth:2});materials.push(routeMaterial);const route=new THREE.Line(new THREE.BufferGeometry(),routeMaterial);scene.add(route);
 const arcMaterial=new THREE.LineDashedMaterial({color:0xfbfbdb,dashSize:.10,gapSize:.06});materials.push(arcMaterial);const arc=new THREE.Line(new THREE.BufferGeometry(),arcMaterial);scene.add(arc);const landing=ring(scene,.22,.015,0,.5,0,white);
 const labGrid=new THREE.GridHelper(8,20,0x9bb5a8,0xc8d8cf);labGrid.position.y=-.005;scene.add(labGrid);labGrid.visible=false;
 let last=performance.now(),lastUi=0,raf=0,dead=false,previousView='',previousCamera='',downX=0,downY=0,drag=false;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();const clickPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.1);
 const pointerDown=(e:PointerEvent)=>{downX=e.clientX;downY=e.clientY;drag=false;};const pointerMove=(e:PointerEvent)=>{if(Math.abs(e.clientX-downX)+Math.abs(e.clientY-downY)>6)drag=true;};
 const pointerUp=(e:PointerEvent)=>{if(drag||get().view!=='arena')return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects([bots.r1.root,bots.r2.root],true);if(hits.length){let o:THREE.Object3D|null=hits[0].object;while(o&&!o.userData.robot)o=o.parent;if(o){get().selected=o.userData.robot;onSelect(o.userData.robot);return;}}const target=new THREE.Vector3();if(raycaster.ray.intersectPlane(clickPlane,target)){if(target.z<.45){get().log('Use the red half of the arena. Blue is a field reference.');}else get().move(get().selected,target.x,target.z);onChange();}};
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();};const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const height=(x:number)=>x<-2.3?.08:x<-1.7?.08+(x+2.3)/.6*.16:x<1.2?.24:x<1.8?.24+(x-1.2)/.6*.2:.44;
 function linePoints(line:THREE.Line,points:THREE.Vector3[]){line.geometry.dispose();line.geometry=new THREE.BufferGeometry().setFromPoints(points);line.computeLineDistances();}
 function animate(now:number){if(dead)return;const dt=Math.min(.05,(now-last)/1000);last=now;const e=get();e.step(dt,keys);const lab=e.view==='mechanism';
   if(previousView!==e.view||previousCamera!==e.camera){if(lab){camera.position.set(2.4,2.05,3.15);controls.target.set(0,.65,0);controls.minDistance=1.7;controls.maxDistance=8;}else {controls.minDistance=6;controls.maxDistance=33;if(e.camera==='top'){camera.position.set(0,22,.1);controls.target.set(0,0,.15);}else {camera.position.set(-11.8,13.8,16.8);controls.target.set(0,.1,.6);}}previousView=e.view;previousCamera=e.camera;}
   field.visible=!lab;labGrid.visible=lab;floor.visible=true;
   for(const id of ['r1','r2'] as RobotId[]){const r=e.robots[id],b=bots[id];b.root.visible=!lab||id===e.selected;b.root.position.set(lab?0:r.x,lab?0:height(r.x),lab?0:r.z);b.root.rotation.y=lab?.4:r.angle;b.selection.visible=!lab&&e.selected===id;b.badge.visible=!lab;
     const lift=lab&&e.gripTest?(Math.sin(e.mechanismCycle*2)*.5+.5):r.lift;const explode=lab&&(e as HarvestEngine&{exploded?:boolean}).exploded?1:0;
     b.base.position.y=explode*-.15;b.mast.position.y=explode*.30;b.cassette.position.z=-.18-explode*.3;b.carriage.position.y=.37+lift*(id==='r2'?.68:.4)+explode*.18;b.carriage.position.z=explode*.3+(!lab&&id==='r2'&&r.state==='Lifting paddy to silo'?lift*.55:0);b.fingers.forEach((f,i)=>f.position.x=(i?1:-1)*(.14+(lab&&e.gripTest?(1-lift)*.08:(r.grip*.04))));
     b.payload.visible=!!r.ball||lab&&e.gripTest;b.payload.material=r.ball==='empty'?purple:red;b.load.forEach((s,i)=>s.visible=lab||i<r.seeds);b.wheels.forEach(w=>w.rotation.x+=(lab&&e.gripTest?1:Math.hypot(r.vx,r.vz))*dt*5);
   }
   plantModels.forEach((p,i)=>p.visible=e.planted[i]);rackSeeds.forEach((s,i)=>s.visible=i<e.rack);
   e.balls.forEach((b,i)=>{const m=ballMeshes[i];m.visible=['field','storage','flight','silo','lost'].includes(b.state);m.position.set(b.x,b.y,b.z);if(b.state==='silo')m.position.y=b.y;});
   const r=e.robots[e.selected];route.visible=!lab&&e.showPaths&&r.tasks.length>0;if(route.visible)linePoints(route,[new THREE.Vector3(r.x,height(r.x)+.06,r.z),...r.tasks.map(t=>new THREE.Vector3(t.x,height(t.x)+.06,t.z))]);
   arc.visible=landing.visible=!lab&&e.assist&&!!e.robots.r1.ball; if(arc.visible){const s=e.launchSolution(),points:THREE.Vector3[]=[];for(let t=0;t<2;t+=.028){const y=s.y+s.vy*t-4.905*t*t;if(y<.60)break;points.push(new THREE.Vector3(s.x+s.vx*t,y,s.z+s.vz*t));}linePoints(arc,points);const end=points.at(-1);if(end)landing.position.set(end.x,.49,end.z);}
   if(!lab&&e.camera==='follow'){const r=e.robots[e.selected];controls.target.lerp(new THREE.Vector3(r.x,.5,r.z),dt*3);camera.position.lerp(new THREE.Vector3(r.x-4,5.8,r.z+5),dt*2);}
   controls.update();renderer.render(scene,camera);if(now-lastUi>100){onChange();lastUi=now;}raf=requestAnimationFrame(animate);
 }
 raf=requestAnimationFrame(animate);
 return ()=>{dead=true;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerUp);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());route.geometry.dispose();arc.geometry.dispose();renderer.dispose();host.replaceChildren();};
}
