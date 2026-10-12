import {box} from './silicon-math.mjs';

// Architectural/circuit teaching models. These are not foundry layouts, device
// cross-sections, SPICE simulations, or dimensional models of commercial HBM.
export const MEMORY_MODEL_SOURCES = Object.freeze([
  {label:'UC Davis · Memory circuits (6T SRAM and 1T1C DRAM)',url:'https://www.ece.ucdavis.edu/~bbaas/116/notes/Handout.memories.pdf'},
  {label:'MIT OpenCourseWare · SRAM',url:'https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/resources/sram-6-58-/'},
  {label:'MIT OpenCourseWare · DRAM',url:'https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/resources/dram-5-10-/'},
  {label:'Micron · HBM architecture',url:'https://www.micron.com/products/memory/hbm'},
  {label:'Micron · HBM3E stack heights',url:'https://my.micron.com/products/memory/hbm/hbm3e'},
  {label:'SK hynix · Base die, TSVs and interposer',url:'https://news.skhynix.com/en/sk-hynix-partners-with-tsmc-to-strengthen-hbm-technological-leadership/'},
  {label:'Samsung · Four-die stack, buffer die and microbumps',url:'https://news.samsung.com/global/samsung-begins-mass-producing-worlds-fastest-dram-based-on-newest-high-bandwidth-memory-hbm-interface'}
]);

export const SRAM_NETLIST = Object.freeze([
  {id:'P1',type:'PMOS',role:'pullup',gate:'Qbar',drain:'Q',source:'VDD',body:'VDD'},
  {id:'P2',type:'PMOS',role:'pullup',gate:'Q',drain:'Qbar',source:'VDD',body:'VDD'},
  {id:'N1',type:'NMOS',role:'pulldown',gate:'Qbar',drain:'Q',source:'VSS',body:'VSS'},
  {id:'N2',type:'NMOS',role:'pulldown',gate:'Q',drain:'Qbar',source:'VSS',body:'VSS'},
  {id:'A1',type:'NMOS',role:'access',gate:'WL',drain:'BL',source:'Q',body:'VSS'},
  {id:'A2',type:'NMOS',role:'access',gate:'WL',drain:'BLbar',source:'Qbar',body:'VSS'}
]);
export const DRAM_NETLIST = Object.freeze([
  {id:'A1',type:'NMOS',role:'access',gate:'WL',drain:'BL',source:'SN',body:'VSS'},
  {id:'C1',type:'capacitor',role:'storage',terminals:['SN','PLATE']}
]);

const C={
  board:[.075,.105,.16],edge:[.17,.26,.34],silicon:[.15,.26,.40],
  pmos:[.82,.42,.64],nmos:[.23,.63,.81],access:[.90,.63,.25],
  metal:[.91,.66,.39],gate:[.67,.43,.93],q:[.20,.88,.83],qbar:[.92,.49,.73],
  low:[.18,.28,.35],wl:[.86,.69,.33],bl:[.31,.63,.92],vdd:[.87,.43,.38],
  vss:[.34,.43,.54],dielectric:[.67,.83,.88],plate:[.71,.74,.83],white:[.82,.89,.96]
};
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const scale=(a,k)=>a.map(v=>v*k);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>scale(a,1/Math.hypot(...a));
function mesh(name,part,explode=[0,0,0],iridescence=0){return {name,part,explode,iridescence,data:[]};}
function vertex(data,p,n,color,glow){data.push(...p,...n,...color,glow);}
function tri(data,a,b,c,na,nb,nc,color,glow){vertex(data,a,na,color,glow);vertex(data,b,nb,color,glow);vertex(data,c,nc,color,glow);}
// Low-poly circular conductors keep the circuit connections legible from any angle.
function rod(data,a,b,r,color,glow=0,sides=8){
  if(Math.hypot(...sub(b,a))<1e-8)return;
  const axis=unit(sub(b,a)),u=unit(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0])),v=cross(axis,u);
  for(let i=0;i<sides;i++){
    const t=i*Math.PI*2/sides,s=(i+1)*Math.PI*2/sides;
    const n1=add(scale(u,Math.cos(t)),scale(v,Math.sin(t))),n2=add(scale(u,Math.cos(s)),scale(v,Math.sin(s)));
    const p1=add(a,scale(n1,r)),p2=add(a,scale(n2,r)),p3=add(b,scale(n2,r)),p4=add(b,scale(n1,r));
    tri(data,p1,p2,p3,n1,n2,n2,color,glow);tri(data,p1,p3,p4,n1,n2,n1,color,glow);
    tri(data,a,p2,p1,scale(axis,-1),scale(axis,-1),scale(axis,-1),color,glow);
    tri(data,b,p4,p3,axis,axis,axis,color,glow);
  }
}
function route(target,points,color,r=.032,glow=0){for(let i=1;i<points.length;i++)rod(target.data,points[i-1],points[i],r,color,glow);}
function dot(target,p,color,r=.07,glow=.1){box(target.data,...p,r*2,r*2,r*2,color,glow);}
function hotspot(id,label,point,part,explode=[0,0,0]){return {id,label,point,part,explode};}
function board(name,w,d,cutaway){
  const m=mesh(name,'frame',[0,-.16,0],.06);
  if(!cutaway){box(m.data,0,-.16,0,w,.13,d,C.board);for(const x of[-w/2+.07,w/2-.07])box(m.data,x,-.08,0,.035,.022,d-.10,C.edge);}
  return m;
}

// A raised schematic symbol, with distinct conduction terminals and a separate
// gate electrode. Bodies are implicit conventional supply ties, recorded in the
// netlist; the drawn blocks intentionally make no device-fabrication claims.
function transistor(name,part,x,z,axis='z',gateSign=1,pmos=false){
  const m=mesh(name,part,[0,.28,0]);
  const color=part==='access'?C.access:pmos?C.pmos:C.nmos;
  const map=(along,across,y=.15)=>axis==='z'?[x+across,y,z+along]:[x+along,y,z+across];
  if(axis==='z'){
    box(m.data,x,.12,z,.26,.14,.46,color,.05);
    box(m.data,x+gateSign*.22,.22,z,.055,.17,.29,C.gate,.08);
  }else{
    box(m.data,x,.12,z,.46,.14,.26,color,.05);
    box(m.data,x,.22,z+gateSign*.22,.29,.17,.055,C.gate,.08);
  }
  const a=map(-.30,0),b=map(.30,0),g=map(0,gateSign*.30,.22);
  route(m,[a,map(-.15,0)],C.metal,.049);route(m,[b,map(.15,0)],C.metal,.049);
  route(m,[map(0,gateSign*.22,.22),g],C.gate,.03);
  if(pmos){ // The raised PMOS gate marker is a schematic polarity cue.
    const center=map(0,gateSign*.27,.29);
    box(m.data,...center,.075,.075,.075,C.white,.10);
  }
  return {mesh:m,a,b,g};
}

function createSRAM(options){
  const bit=Number(options.bit)===1?1:0, lift=[0,.28,0], meshes=[];
  const background=board('sram-schematic-board',4.90,4.30,options.cutaway);if(background.data.length)meshes.push(background);
  const transistors={
    P1:transistor('sram-P1','pullup',-.82,-.90,'z',1,true),
    P2:transistor('sram-P2','pullup',.82,-.90,'z',-1,true),
    N1:transistor('sram-N1','pulldown',-.82,.90,'z',1),
    N2:transistor('sram-N2','pulldown',.82,.90,'z',-1),
    A1:transistor('sram-A1','access',-1.62,0,'x',1),
    A2:transistor('sram-A2','access',1.62,0,'x',1)
  };
  meshes.push(...Object.values(transistors).map(t=>t.mesh));
  const supply=mesh('sram-supply','supply',lift),wl=mesh('sram-wordline','wordline',lift),bl=mesh('sram-bitlines','bitline',lift);
  route(supply,[[-1.24,.15,-1.64],[1.24,.15,-1.64]],C.vdd,.045);
  route(supply,[[-1.24,.15,1.64],[1.24,.15,1.64]],C.vss,.045);
  for(const id of['P1','P2'])route(supply,[transistors[id].a,[transistors[id].a[0],.15,-1.64]],C.vdd);
  for(const id of['N1','N2'])route(supply,[transistors[id].b,[transistors[id].b[0],.15,1.64]],C.vss);
  // BL and BLbar pass outside the supply rails. WL is on its own elevation.
  for(const side of[-1,1]){
    route(bl,[[side*2.15,.15,-1.84],[side*2.15,.15,1.84]],C.bl,.046);
    route(bl,[[side*2.15,.15,0],[side*1.92,.15,0]],C.bl);
  }
  route(wl,[[-2.10,.45,1.97],[2.10,.45,1.97]],C.wl,.047,.13);
  for(const id of['A1','A2']){const g=transistors[id].g;route(wl,[g,[g[0],.45,g[2]],[g[0],.45,1.97]],C.wl,.035,.08);}
  const q=mesh('sram-node-q','node-q',lift),qb=mesh('sram-node-qbar','node-qbar',lift);
  const qc=bit?C.q:C.low,qbc=bit?C.low:C.qbar;
  for(const [target,x,color]of[[q,-.82,qc],[qb,.82,qbc]]){
    route(target,[[x,.15,-.60],[x,.15,.60]],color,.043,.13);
    route(target,[[x,.15,0],[Math.sign(x)*1.32,.15,0]],color,.043,.13);
    dot(target,[x,.15,0],color,.088,.30);
  }
  // The two feedback paths cross at different heights, with NO junction.
  // Q drives P2/N2; Qbar drives P1/N1. Gates have no DC conduction connection.
  route(q,[[-.82,.15,0],[-.82,.68,0],[.40,.68,.32],[.40,.35,.32]],qc,.038,.13);
  route(qb,[[.82,.15,0],[.82,.86,0],[-.40,.86,-.32],[-.40,.35,-.32]],qbc,.038,.13);
  for(const [target,x,ids,color]of[[q,.40,['P2','N2'],qc],[qb,-.40,['P1','N1'],qbc]]){
    route(target,[[x,.35,-.90],[x,.35,.90]],color,.033,.10);
    for(const id of ids){const g=transistors[id].g;route(target,[[x,.35,g[2]],[g[0],.35,g[2]],g],color,.032,.10);}
  }
  meshes.push(supply,wl,bl,q,qb);
  return {
    meshes,
    hotspots:[
      hotspot('sram-q',`Q = ${bit}`,[-.82,.22,0],'node-q',lift),
      hotspot('sram-qbar',`Q̅ = ${1-bit}`,[.82,.22,0],'node-qbar',lift),
      hotspot('sram-pmos','2 PMOS pull-ups',[-.82,.31,-.90],'pullup',lift),
      hotspot('sram-nmos','2 NMOS pull-downs',[.82,.29,.90],'pulldown',lift),
      hotspot('sram-access','2 NMOS access devices',[-1.62,.31,0],'access',lift),
      hotspot('sram-wordline','WL · access control',[0,.45,1.97],'wordline',lift),
      hotspot('sram-bitline','BL / BL̅',[2.15,.20,-.85],'bitline',lift),
      hotspot('sram-supply','VDD / VSS',[0,.15,-1.64],'supply',lift)
    ],
    metrics:[{label:'Cell topology',value:'6T · 2P + 4N'},{label:'Stored state',value:`Q = ${bit} · Q̅ = ${1-bit}`},{label:'Retention',value:'While powered'}],
    note:'Conventional 6T SRAM circuit in 3D: two cross-coupled CMOS inverters and two NMOS access devices. Raised crossing wires are separate nets. Body ties are implicit (PMOS to VDD, NMOS to VSS). Colours show an example stored state; they do not simulate voltages, read/write timing, or fabrication geometry.',
    topology:{kind:'sram',transistors:6,pmos:2,nmos:4,netlist:SRAM_NETLIST,storedState:{Q:bit,Qbar:1-bit},implicitBodyTies:true},
    sources:MEMORY_MODEL_SOURCES.slice(0,2)
  };
}

function createDRAM(options){
  const bit=Number(options.bit)===1?1:0,lift=[0,.28,0],meshes=[];
  const background=board('dram-schematic-board',4.8,3.8,options.cutaway);if(background.data.length)meshes.push(background);
  const access=transistor('dram-A1','access',-.80,0,'x',-1);meshes.push(access.mesh);
  const bl=mesh('dram-bitline','bitline',lift),wl=mesh('dram-wordline','wordline',lift),sn=mesh('dram-storage-node','storage',lift),plate=mesh('dram-common-plate','plate',lift),capacitor=mesh('dram-capacitor','capacitor',lift);
  const storageColor=bit?C.q:C.low;
  route(bl,[[-1.90,.15,-1.58],[-1.90,.15,1.58]],C.bl,.052);
  route(bl,[[-1.90,.15,0],access.a],C.bl,.044);
  route(wl,[[-1.50,.38,-1.28],[.18,.38,-1.28]],C.wl,.052,.1);
  route(wl,[access.g,[-.80,.38,-.30],[-.80,.38,-1.28]],C.wl,.037,.1);
  // A1's other conduction terminal reaches ONLY the storage electrode.
  route(sn,[access.b,[.72,.15,0],[.72,.58,0]],storageColor,.049,.15);
  box(sn.data,.98,.58,0,.96,.09,1.20,storageColor,.18);
  dot(sn,[.15,.15,0],storageColor,.082,.25);
  // One capacitor has two separated plates. The dielectric has no conductive net.
  // Cutaway removes the front half of the dielectric for easier inspection.
  if(options.cutaway)box(capacitor.data,.98,.73,-.32,.96,.20,.56,C.dielectric,.01);
  else box(capacitor.data,.98,.73,0,.96,.20,1.20,C.dielectric,.01);
  box(plate.data,.98,.88,0,.96,.09,1.20,C.plate,.06);
  route(plate,[[1.31,.88,0],[1.88,.88,0],[1.88,.88,1.45]],C.plate,.042);
  // A small outer frame makes the dielectric boundary readable with the opaque shader.
  for(const z of[-.65,.65])box(capacitor.data,.98,.73,z,1.02,.28,.026,C.edge);
  meshes.push(bl,wl,sn,plate,capacitor);
  return {
    meshes,
    hotspots:[
      hotspot('dram-access','1 access transistor',[-.80,.30,0],'access',lift),
      hotspot('dram-capacitor','1 storage capacitor',[.98,.75,-.42],'capacitor',lift),
      hotspot('dram-storage',`Storage node · example ${bit}`,[.15,.20,0],'storage',lift),
      hotspot('dram-wordline','WL · gate control',[-.34,.38,-1.28],'wordline',lift),
      hotspot('dram-bitline','BL · read / write',[-1.90,.20,.80],'bitline',lift),
      hotspot('dram-plate','Common plate',[1.88,.88,1.25],'plate',lift)
    ],
    metrics:[{label:'Cell topology',value:'1T + 1C'},{label:'Example data',value:String(bit)},{label:'Retention',value:'Periodic refresh'}],
    note:'1T1C DRAM circuit: the wordline controls one access transistor between the bitline and storage node. The capacitor’s other electrode connects to a separate common plate. The enlarged parallel plates are a circuit illustration, not a production capacitor shape. Data colour is illustrative; charge sharing, leakage, sensing, refresh timing, body ties and peripheral circuits are not simulated.',
    topology:{kind:'dram',transistors:1,capacitors:1,netlist:DRAM_NETLIST,storedState:bit,implicitBodyTies:true},
    sources:[MEMORY_MODEL_SOURCES[0],MEMORY_MODEL_SOURCES[2]]
  };
}

function hbmDie(target,x,y,w,h,d,color,cutaway,iridescence=false){
  if(cutaway){
    // Remove a front-centre window but keep TSV conductors visible. This is a
    // teaching cutaway: no assertion that a manufactured die has such a window.
    const side=.27,back=d-.62;
    box(target.data,x,y,-.31,w,h,back,color);
    box(target.data,x-(w-side)/2,y,back/2,side,h,.62,color);
    box(target.data,x+(w-side)/2,y,back/2,side,h,.62,color);
  }else box(target.data,x,y,0,w,h,d,color);
  // Repeated top banks are decorative architectural blocks, not a layout/netlist.
  for(const dx of[-.56,-.20,.20,.56])for(const z of[-.62,-.26,.10,.46]){
    if(cutaway&&z>.20&&Math.abs(dx)<.60)continue;
    box(target.data,x+dx,y+h/2+.009,z,.25,.017,.24,
      iridescence?[.19+.035*(dx+.6),.49+.055*(z+.6),.58]:[.20,.34,.48],.055);
  }
}
function createHBM(options){
  const requested=Number(options.layers),layers=[4,8,12].includes(requested)?requested:8;
  const cutaway=Boolean(options.cutaway),meshes=[],x=-.95,w=1.70,d=1.84,h=.14,pitch=.225,baseY=-.01,firstY=.26;
  const substrate=mesh('hbm-package-substrate','substrate',[0,-.12,0]);
  box(substrate.data,0,-.64,0,4.70,.30,3.20,[.07,.24,.24]);
  box(substrate.data,0,-.477,0,4.60,.025,3.10,[.18,.40,.36]);
  for(let i=0;i<9;i++)for(let j=0;j<5;j++)rod(substrate.data,[-2.06+i*.515,-.93,-1.25+j*.62],[-2.06+i*.515,-.80,-1.25+j*.62],.065,C.metal,0,6);
  const interposer=mesh('hbm-silicon-interposer','interposer',[0,.02,0],.12);
  box(interposer.data,0,-.32,0,4.24,.15,2.76,[.19,.27,.40]);
  // Parallel connections across the common interposer illustrate the wide interface.
  for(let i=0;i<10;i++)box(interposer.data,.24,-.236,-.90+i*.20,1.12,.018,.023,i%2?C.metal:C.q,.08);
  const base=mesh('hbm-base-logic-die','base',[0,.14,0],.18);
  hbmDie(base,x,baseY,w,.23,d,[.37,.24,.56],cutaway);
  const compute=mesh('hbm-adjacent-compute-die','compute',[0,.14,0],.25);
  box(compute.data,1.12,-.015,0,1.37,.28,1.84,[.24,.35,.46]);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++)box(compute.data,.62+i*.33,.136,-.61+j*.40,.25,.022,.29,[.23+.04*i,.40+.03*j,.46],.06);
  const attach=mesh('hbm-interposer-attachments','bumps',[0,.09,0]);
  for(const dx of[-.54,0,.54])for(const z of[-.61,0,.61]){
    rod(attach.data,[x+dx,-.242,z],[x+dx,-.125,z],.046,C.metal,.10,6);
    rod(attach.data,[1.12+dx,-.242,z],[1.12+dx,-.155,z],.046,C.metal,.10,6);
  }
  meshes.push(substrate,interposer,base,compute,attach);
  const columns=[];for(const dx of[-.50,0,.50])for(const z of[-.60,-.23,.14,.51])columns.push([x+dx,z]);
  // Base-die TSVs join its upper pads to the interposer-facing connections.
  const baseTSV=mesh('hbm-base-tsvs','tsv',base.explode);
  for(const [vx,vz]of columns)rod(baseTSV.data,[vx,baseY-.117,vz],[vx,baseY+.117,vz],.029,C.metal,.17,6);
  meshes.push(baseTSV);
  const dies=[];
  for(let i=0;i<layers;i++){
    const y=firstY+i*pitch,e=[0,.24+i*.115,0];
    const die=mesh(`hbm-dram-die-${i+1}`,'dram',e,.25);
    hbmDie(die,x,y,w,h,d,[.18+.016*(i%3),.34+.035*(i%4),.51+.027*(i%3)],cutaway,true);
    const tsv=mesh(`hbm-tsvs-${i+1}`,'tsv',e),bumps=mesh(`hbm-microbumps-${i+1}`,'bumps',e);
    const previousTop=i===0?baseY+.115:firstY+(i-1)*pitch+h/2;
    for(const [vx,vz]of columns){
      rod(tsv.data,[vx,y-h/2-.005,vz],[vx,y+h/2+.005,vz],.029,C.metal,.18,6);
      rod(bumps.data,[vx,previousTop+.005,vz],[vx,y-h/2-.005,vz],.047,[.91,.75,.51],.13,6);
    }
    meshes.push(die,tsv,bumps);dies.push({id:i+1,kind:'DRAM',centerY:y,height:h,explode:e});
  }
  const top=firstY+(layers-1)*pitch,topExplode=[0,.24+(layers-1)*.115,0];
  const sample=Math.floor(layers/2),sampleY=firstY+sample*pitch,sampleExplode=[0,.24+sample*.115,0];
  return {
    meshes,
    hotspots:[
      hotspot('hbm-dram',`${layers} DRAM dies`,[x,top+.13,-.30],'dram',topExplode),
      hotspot('hbm-base','Base logic die',[x-.55,baseY,.73],'base',base.explode),
      hotspot('hbm-tsv','TSVs · through silicon',[x,sampleY,.51],'tsv',sampleExplode),
      hotspot('hbm-bumps','Microbumps · between dies',[x+.50,sampleY-.10,.51],'bumps',sampleExplode),
      hotspot('hbm-interposer','Silicon interposer',[.18,-.235,1.22],'interposer',interposer.explode),
      hotspot('hbm-compute','Adjacent compute die',[1.12,.16,0],'compute',compute.explode),
      hotspot('hbm-substrate','Package substrate',[1.92,-.54,1.48],'substrate',substrate.explode)
    ],
    metrics:[{label:'Memory stack',value:`${layers} DRAM dies`},{label:'Below the stack',value:'1 base logic die'},{label:'Vertical links',value:'TSVs + microbumps'}],
    note:'Illustrative HBM architecture: stacked DRAM dies above one base logic die, beside a separate compute die on a shared silicon interposer and package substrate. Stack count excludes the base die. The gold columns represent a small sample of TSVs; microbumps join neighboring dies. Dimensions, thickness, routing, bump count and colour are enlarged teaching geometry, not a vendor product or capacity/performance specification.',
    topology:{kind:'hbm',dramDieCount:layers,baseDieCount:1,computeDieCount:1,interposerCount:1,substrateCount:1,representativeTsvColumns:columns.length,dies,stackCountExcludesBase:true},
    sources:MEMORY_MODEL_SOURCES.slice(3)
  };
}

export function createMemoryModel(kind,options={}){
  if(kind==='sram')return createSRAM(options);
  if(kind==='dram')return createDRAM(options);
  if(kind==='hbm')return createHBM(options);
  throw new RangeError(`Unsupported memory model: ${kind}`);
}
