import {clamp,multiply,perspective,lookAt,project} from './silicon-math.mjs';
import {createTransistorModel} from './transistor-models.mjs';
import {createMemoryModel} from './memory-models.mjs';
import {createWaferModel} from './wafer-models.mjs';
import {SILICON_MODELS} from './silicon-model-content.mjs';

const dialog=document.querySelector('#silicon-explorer');
if(dialog)startExplorer(dialog);
function startExplorer(dialog){
  const $=selector=>dialog.querySelector(selector);
  const $$=selector=>[...dialog.querySelectorAll(selector)];
  const canvas=$('#silicon-explorer-canvas');
  const stage=$('[data-explorer-stage]');
  const hotspotRoot=$('[data-explorer-hotspots]');
  const modelButtons=$$('[data-explorer-model]');
  const actions=$$('[data-explorer-action]');
  const options=$$('[data-explorer-option]');
  const status=$('[data-explorer-status]');
  const fallback=$('[data-explorer-fallback]');
  const phone=matchMedia('(max-width: 760px)');
  const order=['wafer','finfet','gaafet','sram','dram','hbm'];
  const settings={diameter:300,dieSize:10,count:3,layers:8,bit:1,cutaway:true,explode:0};
  let model='wafer',modelData=null,meta=null,selectedPart='',labels=true;
  let gl=null,program=null,uniforms=null,attributes=[],meshes=[],hotspots=[];
  let started=false,failed=false,visible=true,raf=0,lastTime=0,clock=0,tourTime=0;
  let motion=window.portfolioMotionEnabled??!matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paused=false,touring=false,yaw=.62,pitch=.64,zoom=1,drag=null,opener=null;
  let center=[0,0,0],radius=3,projectionView=null;
  const touchPointers=new Set();
  let observer=null,resizeObserver=null;
  const defaults={wafer:{yaw:.50,pitch:.90},finfet:{yaw:.66,pitch:.56},gaafet:{yaw:.62,pitch:.57},sram:{yaw:.22,pitch:1.04},dram:{yaw:.60,pitch:.70},hbm:{yaw:.70,pitch:.48}};
  const text=(selector,value)=>{const node=$(selector);if(node)node.textContent=value??''};
  const active=()=>dialog.open&&!document.hidden&&visible&&!failed;
  const rotating=()=>motion&&!paused;
  function announce(value){if(status)status.textContent=value}
  function eventVisibility(open){window.__siliconExplorerOpen=open;window.dispatchEvent(new CustomEvent('silicon-explorer-visibility',{detail:{open}}))}
  function buttonStates(){
    actions.forEach(button=>{
      const action=button.dataset.explorerAction;
      button.disabled=failed||((action==='rotate'||action==='tour')&&!motion);
      if(action==='rotate'){button.setAttribute('aria-pressed',String(rotating()));button.textContent=rotating()?'Pause rotation':'Rotate model'}
      if(action==='tour'){button.setAttribute('aria-pressed',String(touring));button.textContent=touring?'Pause tour':'Play tour'}
      if(action==='labels'){button.setAttribute('aria-pressed',String(labels));button.textContent=labels?'Hide labels':'Show labels'}
    });
    const explode=$('[data-explorer-option="explode"]');if(explode)explode.disabled=failed;
  }
  function stopTour(){touring=false;tourTime=0;buttonStates()}
  function interact(){paused=true;stopTour();announce(failed?'3D is unavailable. Read the model explanation and sources below.':'Exploring '+(meta?.title||'silicon')+' · Rotation paused');wake()}
  function syncOptions(){
    options.forEach(input=>{
      const key=input.dataset.explorerOption;
      if(input.type==='checkbox')input.checked=Boolean(settings[key]);else input.value=String(settings[key]);
      if(key==='explode')input.setAttribute('aria-valuetext',settings.explode===0?'Assembled':settings.explode===100?'Fully separated':settings.explode+' percent separated');
    });
    const groups={wafer:model==='wafer',fet:model==='finfet'||model==='gaafet',hbm:model==='hbm',bit:model==='sram'||model==='dram'};
    $$('[data-explorer-options]').forEach(group=>{group.hidden=!groups[group.dataset.explorerOptions]});
    text('[data-explorer-explode-value]',settings.explode+'%');
    text('[data-explorer-count-label]',model==='gaafet'?'Nanosheets':'Fins');
  }
  function appendText(parent,tag,value,className){const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;parent.append(node);return node}
  function updateInformation(){
    meta=SILICON_MODELS[model]||{};
    text('[data-explorer-title]',meta.title||model.toUpperCase());
    text('[data-explorer-kicker]',meta.kicker||'Interactive silicon study');
    text('[data-explorer-summary]',meta.summary||'');
    text('[data-explorer-try]',meta.tryThis||'');
    text('[data-explorer-note]',[modelData?.note,meta.notes].filter(Boolean).join(' '));
    const metrics=$('[data-explorer-metrics]');
    if(metrics){metrics.replaceChildren();for(const metric of modelData?.metrics||[]){const item=document.createElement('div');item.className='explorer-metric';appendText(item,'dt',String(metric.label));appendText(item,'dd',String(metric.value));metrics.append(item)}}
    const sources=$('[data-explorer-sources]');
    if(sources){sources.replaceChildren();for(const source of meta.sources||[]){let url;try{url=new URL(source.url)}catch{continue}if(url.protocol!=='https:'&&url.protocol!=='http:')continue;const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=source.label;const item=document.createElement('li');item.append(link);sources.append(item)}}
    const legend=$('[data-explorer-legend]');
    if(legend){legend.replaceChildren();for(const item of meta.legend||[]){const button=document.createElement('button');button.type='button';button.className='explorer-legend-item';button.dataset.explorerPart=item.part;button.style.setProperty('--part-color',item.color);button.setAttribute('aria-pressed','false');const swatch=document.createElement('span');swatch.className='explorer-legend-swatch';swatch.setAttribute('aria-hidden','true');swatch.style.backgroundColor=item.color;button.append(swatch,document.createTextNode(item.label));button.addEventListener('click',()=>selectPart(item.part,item.label));legend.append(button)}}
    text('[data-explorer-inspector]','Select a label or colour key to highlight that part.');
    modelButtons.forEach(button=>{const selected=button.dataset.explorerModel===model;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))});
    dialog.dataset.explorerModel=model;
    if(stage)stage.dataset.model=model;
    syncOptions();
  }
  function selectPart(part,label){
    interact();selectedPart=selectedPart===part?'':part;
    $$('[data-explorer-part]').forEach(button=>{const selected=button.dataset.explorerPart===selectedPart;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))});
    for(const spot of hotspots){const selected=spot.data.part===selectedPart;spot.button.classList.toggle('selected',selected);spot.button.setAttribute('aria-pressed',String(selected))}
    const explanation=(meta?.legend||[]).find(item=>item.part===part)?.description||'';
    text('[data-explorer-inspector]',selectedPart?(label+'. '+explanation+' Select again to show all parts equally.'):'All parts shown equally.');
    drawOnce();
  }
  function buildHotspots(){
    hotspots=[];if(!hotspotRoot)return;hotspotRoot.replaceChildren();
    (modelData?.hotspots||[]).forEach((data,index)=>{
      const button=document.createElement('button');button.type='button';button.className='explorer-hotspot';button.textContent=String(index+1);button.title=data.label;button.setAttribute('aria-label',data.label);button.setAttribute('aria-pressed','false');button.dataset.explorerHotspot=data.id;button.hidden=true;
      button.addEventListener('click',()=>selectPart(data.part,data.label));hotspotRoot.append(button);hotspots.push({data,button});
    });
  }
  function makeModel(){
    if(model==='wafer')return createWaferModel({diameter:settings.diameter,dieSize:settings.dieSize});
    if(model==='finfet'||model==='gaafet')return createTransistorModel(model,{count:settings.count,cutaway:settings.cutaway});
    return createMemoryModel(model,{layers:settings.layers,bit:settings.bit,cutaway:false});
  }
  function releaseBuffers(){if(gl)for(const mesh of meshes)gl.deleteBuffer(mesh.buffer);meshes=[]}
  function rebuild({resetView=false}={}){
    releaseBuffers();modelData=makeModel();selectedPart='';
    let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(const mesh of modelData.meshes||[]){
      const offset=mesh.explode||[0,0,0],data=mesh.data;
      // Fit the assembled and fully separated model together, so a slider move
      // never crops the top die of a stack or changes the apparent wafer size.
      for(let i=0;i<data.length;i+=10)for(let axis=0;axis<3;axis++){
        const value=data[i+axis];min[axis]=Math.min(min[axis],value,value+offset[axis]);max[axis]=Math.max(max[axis],value,value+offset[axis]);
      }
      if(gl&&!failed){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);meshes.push({...mesh,buffer,count:data.length/10})}
    }
    if(!min.every(Number.isFinite)||!max.every(Number.isFinite)){min=[-1,-1,-1];max=[1,1,1]}
    center=min.map((value,i)=>(value+max[i])/2);
    radius=Math.max(.1,Math.hypot(...max.map((value,i)=>(value-min[i])/2)));
    if(resetView){yaw=defaults[model].yaw;pitch=defaults[model].pitch;zoom=1}
    updateInformation();buildHotspots();buttonStates();resize();
  }
  function selectModel(id,{automatic=false}={}){
    if(!order.includes(id))return;
    if(!automatic)interact();
    model=id;settings.explode=0;tourTime=0;
    rebuild({resetView:true});
    announce(failed?'3D is unavailable. Read '+(meta?.title||model)+' details below.':touring?'Tour · '+(meta?.title||model)+' · Next model in 8 seconds':(meta?.title||model)+' selected');
    wake();
  }
  function fail(){
    if(failed)return;failed=true;paused=true;touring=false;cancelAnimationFrame(raf);raf=0;lastTime=0;
    if(canvas)canvas.hidden=true;if(hotspotRoot)hotspotRoot.hidden=true;if(fallback)fallback.hidden=false;
    stage?.classList.add('is-unavailable');buttonStates();
    announce('3D is unavailable on this device. Model explanations, options, and sources remain available.');
  }
  function initializeGL(){
    if(started)return;started=true;
    try{
      gl=canvas?.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power',premultipliedAlpha:false});
      if(!gl)throw new Error('WebGL unavailable');
      const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error('Shader unavailable')}return shader};
      const vertex=compile(gl.VERTEX_SHADER,`
        attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;attribute float aGlow;
        uniform mat4 uVP;uniform vec3 uOffset;
        varying vec3 vPosition;varying vec3 vNormal;varying vec3 vColor;varying float vGlow;
        void main(){vPosition=aPosition+uOffset;vNormal=aNormal;vColor=aColor;vGlow=aGlow;gl_Position=uVP*vec4(vPosition,1.0);}
      `);
      const fragment=compile(gl.FRAGMENT_SHADER,`
        precision mediump float;
        uniform vec3 uEye;uniform float uTime;uniform float uIridescence;uniform float uHighlight;
        varying vec3 vPosition;varying vec3 vNormal;varying vec3 vColor;varying float vGlow;
        void main(){
          vec3 n=normalize(vNormal),v=normalize(uEye-vPosition);
          vec3 warm=normalize(vec3(-3.0,6.0,4.0)),cool=normalize(vec3(4.0,3.0,-4.0));
          float diffuse=max(dot(n,warm),0.0),rim=max(dot(n,cool),0.0);
          float spec=pow(max(dot(n,normalize(warm+v)),0.0),42.0);
          float edge=pow(1.0-max(dot(n,v),0.0),3.0);
          float phase=vPosition.x*.90+vPosition.z*.64+dot(n,v)*3.1;
          vec3 spectrum=.54+.46*cos(phase+vec3(0.0,2.09,4.18));
          vec3 material=mix(vColor,spectrum*(.52+length(vColor)*.37),uIridescence*(.35+.65*max(n.y,0.0)));
          vec3 color=material*(.40+diffuse*.80)+vec3(.18,.31,.42)*rim*.30;
          color+=vec3(1.0,.88,.71)*spec*.62+vec3(.24,.48,.63)*edge*.13;
          color+=material*vGlow*(.86+.14*sin(uTime*1.05+vPosition.x*2.0));
          gl_FragColor=vec4(color*uHighlight,1.0);
        }
      `);
      program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Program unavailable');
      gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(0,0,0,0);
      attributes=['aPosition','aNormal','aColor','aGlow'].map(name=>gl.getAttribLocation(program,name));
      uniforms=Object.fromEntries(['uVP','uOffset','uEye','uTime','uIridescence','uHighlight'].map(name=>[name,gl.getUniformLocation(program,name)]));
      canvas.hidden=false;if(fallback)fallback.hidden=true;
      canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail()});
      if('IntersectionObserver'in window){observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;wake()},{threshold:.01});observer.observe(canvas)}
      if('ResizeObserver'in window){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas)}else window.addEventListener('resize',resize);
    }catch{fail()}
  }
  function draw(){
    if(failed||!gl||!dialog.open||!canvas.width||!canvas.height||!uniforms)return;
    const aspect=canvas.width/canvas.height;
    const distance=radius/Math.sin(.36)*1.12*Math.max(1,1/aspect)*zoom;
    const eye=[distance*Math.cos(pitch)*Math.sin(yaw),distance*Math.sin(pitch),distance*Math.cos(pitch)*Math.cos(yaw)];
    projectionView=multiply(perspective(.72,aspect,Math.max(.005,distance-radius*2.3),distance+radius*4+10),lookAt(eye,[0,0,0]));
    gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
    gl.uniformMatrix4fv(uniforms.uVP,false,projectionView);gl.uniform3fv(uniforms.uEye,eye);gl.uniform1f(uniforms.uTime,clock);
    const separation=settings.explode/100;
    for(const mesh of meshes){
      gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);
      attributes.forEach((attribute,i)=>{gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,i===3?1:3,gl.FLOAT,false,40,[0,12,24,36][i])});
      gl.uniform3fv(uniforms.uOffset,(mesh.explode||[0,0,0]).map((value,i)=>value*separation-center[i]));
      gl.uniform1f(uniforms.uIridescence,mesh.iridescence||0);gl.uniform1f(uniforms.uHighlight,selectedPart?(mesh.part===selectedPart?1.18:.48):1);
      gl.drawArrays(gl.TRIANGLES,0,mesh.count);
    }
    for(const spot of hotspots){
      const offset=spot.data.explode||[0,0,0],point=spot.data.point.map((value,i)=>value+offset[i]*separation-center[i]);
      const p=project(point,projectionView);spot.button.hidden=!labels||!p.visible||Math.abs(p.x)>.92||Math.abs(p.y)>.88;
      if(!spot.button.hidden){spot.button.style.left=((p.x*.5+.5)*100)+'%';spot.button.style.top=((-p.y*.5+.5)*100)+'%'}
    }
  }
  function resize(){
    if(!canvas||failed||!dialog.open)return;
    const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
    const ratio=phone.matches?Math.min(devicePixelRatio||1,1.25,900/rect.width,900/rect.height):Math.min(devicePixelRatio||1,1.6,1400/rect.width,1100/rect.height);
    canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);draw();wake();
  }
  function frame(time){
    raf=0;if(!active()){lastTime=0;return}
    if(phone.matches&&lastTime&&time-lastTime<32){raf=requestAnimationFrame(frame);return}
    const dt=Math.min((time-(lastTime||time))/1000,.05);lastTime=time;
    if(motion){clock+=dt;if(rotating()&&!drag?.active)yaw+=dt*.075}
    if(touring&&motion&&!drag?.active){tourTime+=dt;if(tourTime>=8){selectModel(order[(order.indexOf(model)+1)%order.length],{automatic:true});}}
    draw();if((rotating()||touring)&&motion&&!raf)raf=requestAnimationFrame(frame);
  }
  function wake(){
    if(!active()){cancelAnimationFrame(raf);raf=0;lastTime=0;return}
    if(!raf){lastTime=0;raf=requestAnimationFrame(frame)}
  }
  function drawOnce(){draw();wake()}
  function open(button){
    opener=button||document.activeElement;
    if(!dialog.open){dialog.showModal();eventVisibility(true)}
    visible=true;initializeGL();
    const requested=button?.dataset.explorerStart;
    if(order.includes(requested))model=requested;
    if(!modelData||requested){settings.explode=0;rebuild({resetView:true})}else resize();
    buttonStates();announce(failed?'3D is unavailable. Explore the model details below.':(meta?.title||'Silicon Explorer')+' · Drag horizontally to orbit');wake();
  }
  document.querySelectorAll('[data-open-explorer]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();open(button)}));
  $$('[data-explorer-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('close',()=>{
    cancelAnimationFrame(raf);raf=0;lastTime=0;drag=null;touchPointers.clear();touring=false;tourTime=0;canvas?.classList.remove('is-dragging');buttonStates();eventVisibility(false);
    if(opener?.isConnected)opener.focus({preventScroll:true});
  });
  modelButtons.forEach(button=>button.addEventListener('click',()=>selectModel(button.dataset.explorerModel)));
  options.forEach(input=>{
    const update=()=>{
      const key=input.dataset.explorerOption;interact();
      if(key==='cutaway')settings.cutaway=Boolean(input.checked);
      else if(key==='explode'){settings.explode=Math.round(clamp(Number(input.value)||0,0,100));syncOptions();drawOnce();return}
      else{const allowed={diameter:[150,200,300],dieSize:[10,15,20],count:[1,2,3],layers:[4,8,12],bit:[0,1]}[key];const value=Number(input.value);if(!allowed?.includes(value))return;settings[key]=value}
      rebuild();wake();
    };
    input.addEventListener(input.dataset.explorerOption==='explode'?'input':'change',update);
  });
  actions.forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.explorerAction;
    if(action==='rotate'){stopTour();paused=!paused;buttonStates();announce(rotating()?'Automatic rotation on':'Rotation paused');drawOnce();return}
    if(action==='tour'){touring=!touring;tourTime=0;if(touring){paused=false;selectedPart='';selectModel(model,{automatic:true})}buttonStates();announce(touring?'Tour started · Each model stays for 8 seconds':'Tour paused');wake();return}
    interact();
    if(action==='in')zoom=clamp(zoom-.13,.62,1.8);
    if(action==='out')zoom=clamp(zoom+.13,.62,1.8);
    if(action==='reset'){yaw=defaults[model].yaw;pitch=defaults[model].pitch;zoom=1;settings.explode=0;selectedPart='';$$('[data-explorer-part]').forEach(item=>{item.classList.remove('selected');item.setAttribute('aria-pressed','false')});hotspots.forEach(spot=>{spot.button.classList.remove('selected');spot.button.setAttribute('aria-pressed','false')});text('[data-explorer-inspector]','View reset. Select a label or colour key to highlight a part.');syncOptions()}
    if(action==='labels'){labels=!labels;buttonStates()}
    drawOnce();
  }));
  function clearDrag(){
    const id=drag?.id;drag=null;canvas?.classList.remove('is-dragging');
    if(id!==undefined&&canvas?.hasPointerCapture(id))canvas.releasePointerCapture(id);
    wake();
  }
  if(canvas){
    canvas.addEventListener('pointerdown',event=>{
      if(failed||event.pointerType==='mouse'&&event.button!==0)return;
      const touch=event.pointerType==='touch';if(touch){touchPointers.add(event.pointerId);if(touchPointers.size>1){clearDrag();return}}
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,touch,active:!touch};
      if(!touch){canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');interact()}
    });
    canvas.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      if(drag.touch&&!drag.active){
        const dx=Math.abs(event.clientX-drag.startX),dy=Math.abs(event.clientY-drag.startY);
        if(touchPointers.size>1||dy>=10&&dy>=dx*1.15){clearDrag();return}
        if(dx<12||dx<=dy*1.3)return;
        drag.active=true;drag.x=event.clientX;drag.y=event.clientY;canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');interact();return;
      }
      yaw-=(event.clientX-drag.x)*.009;if(!drag.touch)pitch=clamp(pitch+(event.clientY-drag.y)*.007,.16,1.40);
      drag.x=event.clientX;drag.y=event.clientY;drawOnce();
    });
    const release=event=>{if(event.type!=='lostpointercapture')touchPointers.delete(event.pointerId);if(drag?.id===event.pointerId)clearDrag()};
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
    window.addEventListener('pointerup',release,{passive:true});window.addEventListener('pointercancel',release,{passive:true});
    canvas.addEventListener('keydown',event=>{
      if(failed||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))return;
      event.preventDefault();interact();
      if(event.key==='ArrowLeft')yaw+=.13;if(event.key==='ArrowRight')yaw-=.13;
      if(event.key==='ArrowUp')pitch=clamp(pitch+.1,.16,1.40);if(event.key==='ArrowDown')pitch=clamp(pitch-.1,.16,1.40);
      if(event.key==='+'||event.key==='=')zoom=clamp(zoom-.13,.62,1.8);if(event.key==='-')zoom=clamp(zoom+.13,.62,1.8);
      if(event.key==='Home'){yaw=defaults[model].yaw;pitch=defaults[model].pitch;zoom=1}
      drawOnce();
    });
  }
  document.addEventListener('visibilitychange',wake);
  window.addEventListener('portfolio-motion',event=>{motion=Boolean(event.detail.enabled);if(!motion){touring=false;tourTime=0;cancelAnimationFrame(raf);raf=0;lastTime=0}buttonStates();drawOnce()});
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;lastTime=0});
  window.addEventListener('pageshow',()=>{if(dialog.open)wake()});
}
