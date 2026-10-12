import {box,clamp} from './silicon-math.mjs';

// Illustrative geometry only: no process dimensions or proprietary layout data.
const colors={silicon:[.10,.18,.33],dark:[.035,.07,.13],copper:[.92,.49,.24],gold:[1,.75,.34],cyan:[.18,.78,.89],violet:[.57,.38,.94],coral:[.98,.36,.38],oxide:[.55,.82,.90]};
export const smooth=(a,b,p)=>{const t=clamp((p-a)/(b-a),0,1);return t*t*(3-2*t)};

function ring(data,radius,y,height,color,segments=112){
  // One shallow circular silicon wafer, with the orientation flat at the front.
  const edge=i=>{const angle=i/segments*Math.PI*2;return [Math.cos(angle)*radius,Math.min(Math.sin(angle)*radius,radius*.955)]};
  const vertex=(x,Y,z,n)=>data.push(x,Y,z,...n,...color,0);
  for(let i=0;i<segments;i++){
    const a=edge(i),b=edge(i+1),normal=[(a[0]+b[0])/2/radius,0,(a[1]+b[1])/2/radius];
    vertex(0,y,0,[0,1,0]);vertex(b[0],y,b[1],[0,1,0]);vertex(a[0],y,a[1],[0,1,0]);
    for(const v of [[...a,y-height],[...a,y],[...b,y],[...a,y-height],[...b,y],[...b,y-height]])vertex(v[0],v[2],v[1],normal);
    vertex(0,y-height,0,[0,-1,0]);vertex(a[0],y-height,a[1],[0,-1,0]);vertex(b[0],y-height,b[1],[0,-1,0]);
  }
}
function border(data,x,z,width,depth,y,color,weight=.026){
  box(data,x,y,z-depth/2,width,.02,weight,color,.25);
  box(data,x,y,z+depth/2,width,.02,weight,color,.25);
  box(data,x-width/2,y,z,weight,.02,depth,color,.25);
  box(data,x+width/2,y,z,weight,.02,depth,color,.25);
}
function tracks(data,x,z,width,depth,count,y,color,vertical=false){
  for(let i=0;i<count;i++){
    const f=(i+.5)/count-.5;
    box(data,vertical?x+f*width:x,y,vertical?z:z+f*depth,vertical?.022:width,.018,vertical?depth:.022,color,.24);
  }
}
export function createWaferGeometry(){
  const meshes=[];
  const add=(name,build,iridescence=0)=>{const data=[];build(data);meshes.push({name,data,iridescence})};
  add('wafer',data=>{
    ring(data,2.55,-.105,.08,colors.silicon);
    for(let row=-6;row<=6;row++)for(let col=-6;col<=6;col++){
      const x=col*.37,z=row*.37;
      if(Math.hypot(Math.abs(x)+.17,Math.abs(z)+.17)>2.50||row===0&&col===0)continue;
      box(data,x,-.045,z,.341,.055,.341,[.27,.35,.60]);
      box(data,x,-.013,z,.295,.007,.295,[.20,.26,.46]);
      for(let line=0;line<3;line++){
        box(data,x-.105+line*.073,-.005,z,.018,.01,.26,[.50,.68,.82],.12);
        box(data,x,-.002,z-.10+line*.10,.27,.009,.008,[.48,.40,.70],.12);
      }
    }
  },.92);
  add('wafer-rim',data=>{
    const n=112;
    for(let i=0;i<n;i++){
      const a=i/n*Math.PI*2,x=Math.cos(a)*2.535,z=Math.sin(a)*2.535;
      if(z>2.43)continue;
      box(data,x,-.075,z,.043,.024,.043,colors.cyan,.38);
    }
  },.75);
  add('die-base',data=>{
    box(data,0,-.14,0,3.64,.23,3.64,colors.silicon);
    box(data,0,-.012,0,3.60,.026,3.60,colors.dark);
    border(data,0,0,3.60,3.60,.017,colors.gold,.032);
  },.18);
  add('die-pads',data=>{
    for(let side=0;side<4;side++)for(let i=0;i<15;i++){
      const a=-1.47+i*.21;
      box(data,side<2?a:(side===2?-1.64:1.64),.032,side<2?(side===0?-1.64:1.64):a,side<2?.105:.17,.04,side<2?.17:.105,colors.gold,.12);
    }
  },.20);
  add('die-floorplan',data=>{
    // Differently sized repeated regions evoke an IC top view without claiming a real netlist.
    const regions=[[-.86,-.90,1.15,1.08,colors.violet],[.71,-.89,1.56,1.10,colors.cyan],[-.99,.49,.90,1.43,colors.copper],[.63,.55,1.76,1.47,colors.violet]];
    for(const [x,z,w,d,c] of regions){
      box(data,x,.037,z,w,.061,d,c.map(v=>v*.27));
      border(data,x,z,w,d,.081,c,.018);
      const rows=Math.floor(d/.15),cols=Math.floor(w/.23);
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        box(data,x-w/2+.13+col*.23,.089,z-d/2+.10+row*.15,.16,.026,.077,c,.15);
        box(data,x-w/2+.13+col*.23,.107,z-d/2+.10+row*.15,.12,.008,.012,colors.gold,.25);
      }
    }
    tracks(data,.71,-.90,1.38,.96,8,.12,colors.cyan,true);
    tracks(data,.63,.55,1.63,1.28,10,.12,colors.copper);
    box(data,-.25,.085,0,.08,.06,3.04,colors.gold,.55);
    box(data,0,.087,-.18,3.05,.061,.075,colors.cyan,.48);
  },.16);
  add('die-traces',data=>{
    for(let i=0;i<9;i++){
      const p=-1.45+i*.36;
      box(data,p,.143,0,.014,.016,3.01,i%2?colors.copper:colors.gold,.20);
      box(data,0,.16,p,3.01,.015,.012,i%3?colors.cyan:colors.violet,.16);
    }
  },.12);
  add('metal-bed',data=>{
    box(data,0,-.64,0,3.8,.18,3.45,colors.silicon);
    box(data,0,-.54,0,3.76,.024,3.40,colors.dark);
    for(let r=0;r<5;r++)for(let c=0;c<8;c++){
      box(data,-1.54+c*.44,-.46,-1.34+r*.66,.29,.11,.43,colors.violet,.12);
      box(data,-1.54+c*.44,-.392,-1.34+r*.66,.06,.034,.45,colors.gold,.12);
    }
  });
  for(let level=0;level<4;level++){
    const color=[colors.copper,colors.cyan,colors.violet,colors.gold][level];
    add('metal-'+level,data=>{
      const y=-.25+level*.34;
      const vertical=level%2===0;
      for(let i=0;i<9;i++){
        const p=-1.47+i*.3675;
        box(data,vertical?p:0,y,vertical?0:p,vertical?.10:3.42,.072,vertical?3.10:.10,color,.26);
        // Broader signal/power trunks make each routing direction legible.
        if(i===0||i===8)box(data,vertical?p:0,y+.044,vertical?0:p,vertical?.14:3.42,.022,vertical?3.10:.14,color,.12);
      }
    },.04);
    add('via-'+level,data=>{
      const y=-.42+level*.34;
      for(let r=0;r<5;r++)for(let c=0;c<5;c++){
        if((r+c+level)%3===0)continue;
        const x=-1.47+c*.735,z=-1.47+r*.735;
        box(data,x,y,z,.076,.27,.076,colors.gold,.3);
      }
    });
  }
  add('device-bed',data=>{
    box(data,0,-.34,0,4.0,.22,2.80,colors.silicon);
    box(data,0,-.214,0,3.96,.026,2.76,colors.dark);
    for(let row=-1;row<=1;row++){
      const z=row*.80;
      box(data,0,-.085,z-.30,3.76,.045,.05,colors.cyan,.48);
      box(data,0,-.085,z+.30,3.76,.045,.05,colors.gold,.35);
    }
  });
  add('device-array',data=>{
    for(let row=-1;row<=1;row++)for(let col=-2;col<=2;col++){
      if(row===0&&col===0)continue;
      const x=col*.74,z=row*.8;
      box(data,x,-.122,z,.61,.14,.49,[.14,.25,.48]);
      for(const side of [-1,1]){
        box(data,x+side*.20,-.055,z,.17,.09,.37,colors.coral,.12);
        box(data,x+side*.20,.04,z,.068,.16,.085,colors.copper,.15);
      }
      box(data,x,-.01,z,.135,.045,.42,colors.oxide);
      box(data,x,.087,z,.115,.15,.42,colors.violet,.25);
      box(data,x,.169,z,.09,.021,.42,colors.gold,.3);
      box(data,x,.04,z+.27,.055,.15,.07,colors.cyan,.25);
    }
    border(data,0,0,.70,.67,-.065,colors.gold,.024);
  });
  // Enlarged planar MOS cross-section. Source and drain are embedded into the
  // substrate top; the exposed front cross-section shows the channel below gate.
  add('transistor-substrate',data=>{
    box(data,0,-.47,0,3.6,.79,2.23,colors.silicon);
    box(data,0,-.061,0,3.58,.028,2.21,[.23,.34,.58]);
    for(let i=0;i<8;i++)box(data,-1.50+i*.42,-.60,1.12,.13,.016,.008,[.23,.36,.58]);
  },.08);
  add('transistor-diffusion',data=>{
    for(const side of [-1,1]){
      box(data,side*1.06,-.091,0,.99,.23,2.235,colors.coral,.10);
      box(data,side*1.06,.038,0,.93,.028,2.14,[1,.57,.41],.10);
    }
    // Visible, thin inversion channel bridging source and drain beneath oxide.
    box(data,0,-.035,0,1.24,.035,2.25,colors.cyan,.65);
    box(data,0,-.023,1.135,1.22,.042,.025,colors.cyan,.80);
  });
  add('transistor-oxide',data=>{
    box(data,0,.021,0,.82,.061,2.16,colors.oxide,.05);
    for(const side of [-1,1])box(data,side*.44,.158,0,.055,.32,2.13,colors.oxide,.06);
  });
  add('transistor-gate',data=>{
    box(data,0,.222,0,.74,.33,2.12,colors.violet,.16);
    box(data,0,.407,0,.74,.04,2.12,colors.gold,.20);
    for(let i=0;i<8;i++)box(data,0,.432,-.9+i*.255,.60,.01,.012,colors.copper,.2);
  });
  add('transistor-contacts',data=>{
    for(const side of [-1,1])for(const z of [-.62,.05,.72]){
      box(data,side*1.06,.33,z,.19,.56,.20,colors.copper,.15);
      box(data,side*1.06,.623,z,.27,.034,.29,colors.gold,.2);
    }
    for(const side of [-1,1])box(data,side*1.06,.66,0,.36,.065,1.82,side<0?colors.cyan:colors.copper,.2);
    box(data,0,.61,-.70,.22,.38,.23,colors.gold,.3);
  });
  return meshes;
}

export function geometryPose(name,progress,explode=0){
  const p=clamp(progress,0,1),e=clamp(explode,0,1);
  const state={scale:1,offset:[0,0,0],alpha:1};
  if(name.startsWith('wafer')){
    const t=smooth(.035,.245,p);state.scale=1+t*.35;state.offset[1]=-t*.85;state.alpha=1-smooth(.11,.245,p);
  }else if(name.startsWith('die-')){
    const lift=smooth(.012,.245,p),exit=smooth(.29,.50,p);
    state.scale=(.093+lift*.907)*(1+exit*.23);
    state.offset[1]=Math.sin(lift*Math.PI)*.38;
    state.alpha=1-smooth(.365,.50,p);
    if(name==='die-floorplan'){state.offset[1]+=exit*1.1+e*.12;state.alpha=1-smooth(.32,.465,p)}
    if(name==='die-traces'){state.offset[1]+=exit*1.70+e*.35;state.alpha=1-smooth(.31,.46,p)}
    if(name==='die-pads')state.offset[1]+=exit*.45;
  }else if(name.startsWith('metal')||name.startsWith('via')){
    const enter=smooth(.29,.495,p),exit=smooth(.55,.735,p);
    state.scale=.76+enter*.24+exit*.18;
    state.alpha=enter*(1-smooth(.575,.735,p));
    state.offset[1]=-.28*(1-enter);
    const match=name.match(/(?:metal|via)-(\d)/);
    if(match){
      const level=Number(match[1]);state.offset[1]+=(level*.24)*e+exit*(1+level*.70);
      if(name.startsWith('via'))state.alpha*=1-smooth(.54,.675,p);
    }else{state.offset[1]-=exit*.44;state.alpha=enter*(1-smooth(.60,.74,p))}
  }else if(name.startsWith('device-')){
    const enter=smooth(.565,.745,p),exit=smooth(.79,.99,p);
    state.scale=.74+enter*.26+exit*.45;
    state.alpha=enter*(1-smooth(.82,.97,p));
    state.offset[1]=-(1-enter)*.50-exit*.80;
    if(name==='device-array')state.offset[1]+=e*.10;
  }else if(name.startsWith('transistor-')){
    const enter=smooth(.62,.755,p),zoom=smooth(.785,.99,p);
    state.scale=.15+zoom*.85;
    state.offset[1]=-.08*(1-zoom);
    state.alpha=enter;
    const level={'transistor-substrate':0,'transistor-diffusion':0,'transistor-oxide':.25,'transistor-gate':.75,'transistor-contacts':1.10}[name]||0;
    state.offset[1]+=e*level*zoom;
  }
  return state;
}
