import {box} from './silicon-math.mjs';

// Structural teaching models, not foundry geometry. X is source-to-drain,
// Y is height, and Z is the fin spacing / nanosheet width direction.
// FinFET reference: Intel's 4 May 2011 Tri-Gate announcement.
// GAA reference: Samsung's GAA Structure Transistors and IEDM 2018 articles.
const COLOR={
  substrate:[.12,.27,.43],channel:[.18,.79,.84],oxide:[.76,.84,.91],
  isolation:[.32,.40,.51],gate:[.54,.36,.83],terminal:[.94,.39,.33],
  contacts:[.94,.66,.33]
};
const OFFSET={
  substrate:[0,-.18,0],isolation:[0,-.08,0],channel:[0,0,0],
  oxide:[0,.31,-.12],gate:[0,.88,-.34],terminal:[0,0,0],
  contacts:[0,1.13,0]
};

function builder(){
  const meshes=[];
  function mesh(name,part,color,explode,glow=0){
    const result={name,part,data:[],explode:[...explode],iridescence:part==='contacts'?.12:0};
    meshes.push(result);
    return (x,y,z,w,h,d)=>box(result.data,x,y,z,w,h,d,color,glow);
  }
  return {meshes,mesh};
}

function hotspot(id,label,point,part,offsetKey){
  return {id,label,point,part,explode:[...OFFSET[offsetKey]]};
}

/**
 * Geometry uses the site's position3 / normal3 / colour3 / glow1 format.
 * The cutaway removes only the drain-facing (+X) half of the gate and its
 * dielectric. It does not remove silicon, sever source/drain, or turn a
 * three-sided FinFET gate into a four-sided gate. The surviving gate remains
 * continuous across fins / sheets, and its open X face exposes the wrap.
 */
export function createTransistorModel(kind,options={}){
  if(kind!=='finfet'&&kind!=='gaafet')throw new TypeError('Unknown transistor model: '+kind);
  const requested=Number(options.count??3);
  const count=Number.isFinite(requested)?Math.max(1,Math.min(3,Math.round(requested))):3;
  const cutaway=options.cutaway!==false;
  const gateLength=cutaway?.55:1.10;
  const gateX=cutaway?-.275:0;
  const model=builder();
  const substrate=model.mesh(kind+'-substrate','substrate',COLOR.substrate,OFFSET.substrate);
  const isolation=model.mesh(kind+'-isolation','isolation',COLOR.isolation,OFFSET.isolation);
  const channel=model.mesh(kind+'-channels','channel',COLOR.channel,OFFSET.channel,.14);
  const oxide=model.mesh(kind+'-gate-dielectric','oxide',COLOR.oxide,OFFSET.oxide);
  const gate=model.mesh(kind+'-common-gate','gate',COLOR.gate,OFFSET.gate,.04);
  const terminal=model.mesh(kind+'-source-drain','source-drain',COLOR.terminal,OFFSET.terminal);
  const contacts=model.mesh(kind+'-contacts','contacts',COLOR.contacts,OFFSET.contacts,.04);
  substrate(0,-.68,0,4.25,.36,3.25);

  if(kind==='finfet'){
    // The fins extend through STI into the bulk substrate. Only the fin's
    // exposed top and two sidewalls receive gate dielectric and metal.
    const finWidth=.26,finTop=.65,finBottom=-.50,exposedBottom=-.34;
    const dielectric=.05,metal=.16,pitch=.88;
    const finPositions=Array.from({length:count},(_,i)=>(i-(count-1)/2)*pitch);
    const span=(count-1)*pitch+finWidth;
    const sideHeight=finTop-exposedBottom;
    // STI fills the spaces between fins, not the silicon volume itself.
    let previousEdge=-1.54;
    for(const z of finPositions){
      const gapEnd=z-.16;
      isolation(0,-.42,(previousEdge+gapEnd)/2,4.10,.16,gapEnd-previousEdge);
      previousEdge=z+.16;
      for(const side of [-1,1]){
        isolation(side*1.90,-.42,z,.30,.16,.32);
        isolation(0,-.42,z+side*.145,1.40,.16,.03);
      }
      channel(0,(finTop+finBottom)/2,z,1.40,finTop-finBottom,finWidth);
      for(const side of [-1,1]){
        terminal(side*1.225,(finTop+finBottom)/2,z,1.05,finTop-finBottom,.32);
        // Contacts share one source and one drain rail across parallel fins.
        contacts(side*1.35,.86,z,.37,.42,.24);
        oxide(gateX,(finTop+exposedBottom)/2,z+side*(finWidth/2+dielectric/2),gateLength,sideHeight,dielectric);
        gate(gateX,(finTop+dielectric+exposedBottom)/2,z+side*(finWidth/2+dielectric+metal/2),gateLength,sideHeight+dielectric,metal);
      }
      oxide(gateX,finTop+dielectric/2,z,gateLength,dielectric,finWidth+2*dielectric);
    }
    isolation(0,-.42,(previousEdge+1.54)/2,4.10,.16,1.54-previousEdge);
    // One common gate bridge joins the U-shaped wraps. No metal runs under
    // any fin: that is the key structural distinction from the GAA model.
    const gateTop=finTop+dielectric+metal;
    gate(gateX,finTop+dielectric+metal/2,0,gateLength,metal,span+2*(dielectric+metal));
    for(const side of [-1,1])contacts(side*1.35,1.15,0,.53,.16,span+.28);
    const gateContactZ=-(span/2+dielectric+metal/2);
    contacts(gateX,gateTop+.15,gateContactZ,.32,.30,.24);
    return {
      meshes:model.meshes,
      hotspots:[
        hotspot('fin-channel',count===1?'Silicon fin':'Parallel silicon fins',[.32,.48,finPositions.at(-1)],'channel','channel'),
        hotspot('fin-gate','Common tri-gate',[gateX,gateTop,0],'gate','gate'),
        hotspot('fin-oxide','Gate dielectric',[cutaway?0:.56,.675,finPositions.at(-1)],'oxide','oxide'),
        hotspot('fin-source','Source',[-1.43,.49,finPositions.at(-1)+.17],'source-drain','terminal'),
        hotspot('fin-drain','Drain',[1.43,.49,finPositions.at(-1)+.17],'source-drain','terminal'),
        hotspot('fin-contact','Metal contacts',[1.35,1.23,0],'contacts','contacts'),
        hotspot('fin-substrate','Bulk silicon',[-1.65,-.62,1.57],'substrate','substrate')
      ],
      metrics:[
        {label:'Parallel fins',value:String(count)},
        {label:'Gated faces per fin',value:'3'},
        {label:'Shared terminals',value:'Source · gate · drain'}
      ],
      note:(cutaway?'Cutaway: the drain-facing half of the gate and gate dielectric is removed to reveal the fin. ':'Assembled view: the common gate covers the top and two sidewalls of each fin. ')+
        'The gate is insulated from the silicon by a thin dielectric; it does not wrap beneath the fin. Parallel fins share the same source, gate and drain. Colours and dimensions are illustrative; spacers and surrounding interlayer dielectric are omitted.'
    };
  }

  // GAA: horizontal silicon sheets bridge shared source/drain regions. A
  // rectangular dielectric shell separates every sheet from a metal gate
  // on all four cross-sectional faces. Adjacent gate shells touch and a
  // rear spine makes their electrical continuity explicit.
  isolation(0,-.42,0,4.10,.16,3.08);
  const sheetWidth=1.10,sheetHeight=.17,dielectric=.05,metal=.14,pitch=.55;
  const sheetY=Array.from({length:count},(_,i)=>-.025+i*pitch);
  const stackBottom=sheetY[0]-sheetHeight/2;
  const stackTop=sheetY.at(-1)+sheetHeight/2;
  const gateBottom=stackBottom-dielectric-metal;
  const gateTop=stackTop+dielectric+metal;
  for(const y of sheetY){
    channel(0,y,0,1.60,sheetHeight,sheetWidth);
    for(const side of [-1,1]){
      oxide(gateX,y+side*(sheetHeight/2+dielectric/2),0,gateLength,dielectric,sheetWidth+2*dielectric);
      oxide(gateX,y,side*(sheetWidth/2+dielectric/2),gateLength,sheetHeight,dielectric);
      gate(gateX,y+side*(sheetHeight/2+dielectric+metal/2),0,gateLength,metal,sheetWidth+2*(dielectric+metal));
      gate(gateX,y,side*(sheetWidth/2+dielectric+metal/2),gateLength,sheetHeight+2*dielectric,metal);
    }
  }
  const gateSpineZ=-(sheetWidth/2+dielectric+metal/2);
  gate(gateX,(gateTop+gateBottom)/2,gateSpineZ,gateLength,gateTop-gateBottom,metal);
  const terminalBottom=-.34,terminalTop=stackTop+.12;
  for(const side of [-1,1]){
    terminal(side*1.265,(terminalTop+terminalBottom)/2,0,.93,terminalTop-terminalBottom,1.24);
    contacts(side*1.265,terminalTop+.18,0,.52,.36,.70);
    contacts(side*1.265,terminalTop+.43,0,.68,.14,1.16);
  }
  contacts(gateX,gateTop+.17,gateSpineZ,.32,.34,.26);
  return {
    meshes:model.meshes,
    hotspots:[
      hotspot('gaa-channel',count===1?'Silicon nanosheet':'Stacked nanosheets',[.36,sheetY.at(-1),.55],'channel','channel'),
      hotspot('gaa-gate','Gate all around',[gateX,gateTop,.26],'gate','gate'),
      hotspot('gaa-oxide','Gate dielectric',[cutaway?0:.56,sheetY.at(-1),.575],'oxide','oxide'),
      hotspot('gaa-source','Common source',[-1.52,(terminalTop+terminalBottom)/2,.63],'source-drain','terminal'),
      hotspot('gaa-drain','Common drain',[1.52,(terminalTop+terminalBottom)/2,.63],'source-drain','terminal'),
      hotspot('gaa-contact','Metal contacts',[1.265,terminalTop+.50,.30],'contacts','contacts'),
      hotspot('gaa-substrate','Silicon substrate',[-1.65,-.62,1.57],'substrate','substrate')
    ],
    metrics:[
      {label:'Stacked nanosheets',value:String(count)},
      {label:'Gated faces per sheet',value:'4'},
      {label:'Shared terminals',value:'Source · gate · drain'}
    ],
    note:(cutaway?'Cutaway: the drain-facing half of the gate and gate dielectric is removed; the open section shows the wrap around each sheet. ':'Assembled view: gate metal surrounds each sheet on its top, bottom and both sidewalls. ')+
      'A thin dielectric keeps the gate insulated from every channel. The horizontal sheets connect a common source and drain, and all sheets share one gate. Colours and dimensions are illustrative; inner spacers, junction engineering and surrounding interlayer dielectric are omitted.'
  };
}
