import {clamp,multiply,perspective,lookAt,project} from './silicon-math.mjs';
import {createWaferGeometry,geometryPose} from './wafer-geometry.mjs';
import {storyPose} from './scroll-timeline.mjs';

const stage=document.querySelector('#silicon-stage');
const canvas=document.querySelector('#silicon-canvas');
if(stage&&canvas)startScene();
function startScene(){
  const hint=stage.querySelector('.silicon-hint');
  const controls=[...stage.querySelectorAll('[data-scene-action]')];
  const slider=stage.querySelector('#chip-layers');
  const parts=[...stage.querySelectorAll('[data-chip-part]')];
  const markers=[...stage.querySelectorAll('[data-chip-marker]')];
  const infoTitle=stage.querySelector('#silicon-part-title');
  const infoText=stage.querySelector('#silicon-part-description');
  const phoneViewport=matchMedia('(max-width: 760px)');
  const touchPointers=new Set();
  const partData={
    wafer:{title:'01 / Colour in silicon',label:'Wafer',depth:'Patterned silicon',text:'An iridescent silicon wafer holds repeated dies. Follow one highlighted die as it lifts out and fills the view.',point:[0,.1,0],progress:0},
    die:{title:'02 / A world on one die',label:'Die layout',depth:'Functional regions',text:'The top view reveals repeated devices, functional regions, and routing. This colourful floorplan is an illustrative study, not a production layout.',point:[0,.1,0],progress:.25},
    metal:{title:'03 / Between the layers',label:'Interconnect',depth:'Metal + vias',text:'Alternating copper, cyan, and violet routes separate in depth. Vertical vias join the metal layers to connect devices below.',point:[0,.5,0],progress:.50},
    devices:{title:'04 / Repetition with purpose',label:'Device array',depth:'Device array',text:'The routing peels away to reveal an array of devices. The selected centre transistor becomes the next view.',point:[0,.1,0],progress:.75},
    transistor:{title:'05 / Down to the transistor',label:'Transistor',depth:'MOS cross-section',text:'A simplified planar MOS transistor: coral source and drain, a thin cyan channel, pale gate oxide, a violet gate, and copper contacts over blue silicon. Colours and dimensions are illustrative.',point:[0,.3,0],progress:1}
  };
  const sceneStage=stage.querySelector('[data-scene-stage]');
  const sceneDepth=stage.querySelector('[data-scene-depth]');
  let gl,program,raf=0,observer,resizeObserver,visible=false,failed=false;
  let yaw=.48,pitch=.84,distance=10.8,explode=0,targetExplode=0,clock=0,lastTime=0;
  let progress=0,targetProgress=0;
  let drag=null,userPaused=false,activePart='wafer',interacted=false;
  let scrollGuided=false,scrollTarget=storyPose(0);
  let motion=window.portfolioMotionEnabled??!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const meshes=[];
  let projectionView=new Float32Array(16),eye=[0,0,0];
  const ready=available=>{window.__siliconReady=available;window.dispatchEvent(new CustomEvent('silicon-ready',{detail:{available}}))};
  const fail=()=>{
    if(failed)return;failed=true;cancelAnimationFrame(raf);raf=0;
    stage.classList.remove('is-3d-ready');stage.classList.add('is-static');
    hint.textContent='Static silicon study · 3D is unavailable on this device';
    controls.forEach(button=>button.disabled=true);slider.disabled=true;canvas.tabIndex=-1;
    observer?.disconnect();resizeObserver?.disconnect();ready(false);
  };
  function choosePart(id,manual=false){
    const data=partData[id];if(!data)return;
    activePart=id;
    if(infoTitle)infoTitle.textContent=data.title;if(infoText)infoText.textContent=data.text;
    if(sceneStage)sceneStage.textContent=data.label;if(sceneDepth)sceneDepth.textContent=data.depth;
    stage.dataset.scenePart=id;
    parts.forEach(button=>{const selected=button.dataset.chipPart===id;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))});
    markers.forEach(button=>{const selected=button.dataset.chipMarker===id;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected))});
    if(manual){
      scrollGuided=false;stage.classList.remove('is-scroll-guided');
      targetProgress=data.progress;
      const pose=storyPose(targetProgress);yaw=pose.yaw;pitch=pose.pitch;distance=pose.distance;
      targetExplode=pose.explode;
      if(!motion){progress=targetProgress;explode=targetExplode}
      if(slider){slider.value=String(Math.round(targetExplode*100));slider.setAttribute('aria-valuetext',Math.round(targetExplode*100)+' percent separated')}
      const output=stage.querySelector('#layer-value');if(output)output.textContent=Math.round(targetExplode*100)+'%';
      const layerButton=stage.querySelector('[data-scene-action="layers"]');if(layerButton){layerButton.setAttribute('aria-pressed',String(targetExplode>.1));layerButton.textContent=targetExplode>.1?'Assemble layers':'Separate layers'}
      if(hint)hint.textContent=failed?'Conceptual study · Select a stage to read more':'Explore this scale · Scroll to continue the journey';
    }
    renderOnce();
  }
  parts.forEach(button=>button.addEventListener('click',()=>choosePart(button.dataset.chipPart,true)));
  markers.forEach(button=>button.addEventListener('click',()=>choosePart(button.dataset.chipMarker,true)));
  choosePart('wafer');
  function compile(type,source){
    const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Scene shader failed');
    return shader;
  }
  try{
    gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power',premultipliedAlpha:false});
    if(!gl)throw new Error('WebGL unavailable');
    const vertex=compile(gl.VERTEX_SHADER,`
      attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;attribute float aGlow;
      uniform mat4 uVP;uniform vec3 uOffset;uniform float uScale;
      varying vec3 vNormal;varying vec3 vPosition;varying vec3 vLocal;varying vec3 vColor;varying float vGlow;
      void main(){vLocal=aPosition;vPosition=aPosition*uScale+uOffset;vNormal=aNormal;vColor=aColor;vGlow=aGlow;gl_Position=uVP*vec4(vPosition,1.0);}
    `);
    const fragment=compile(gl.FRAGMENT_SHADER,`
      precision mediump float;
      uniform vec3 uEye;uniform float uTime;uniform float uHighlight;uniform float uAlpha;uniform float uIridescence;
      varying vec3 vNormal;varying vec3 vPosition;varying vec3 vLocal;varying vec3 vColor;varying float vGlow;
      void main(){
        // Screen-door dissolve retains correct depth while layers are lifted away.
        vec2 pixel=mod(floor(gl_FragCoord.xy),4.0);
        float fine=mod(pixel.x,2.0)*2.0+mod(pixel.x+pixel.y,2.0);
        vec2 coarse=floor(pixel*.5);
        float threshold=(fine*4.0+coarse.x*2.0+mod(coarse.x+coarse.y,2.0)+.5)/16.0;
        if(threshold>uAlpha)discard;
        vec3 n=normalize(vNormal),v=normalize(uEye-vPosition);
        vec3 warm=normalize(vec3(-3.0,6.0,4.0)),cool=normalize(vec3(4.0,3.0,-4.0));
        float diffuse=max(dot(n,warm),0.0),rim=max(dot(n,cool),0.0);
        float spec=pow(max(dot(n,normalize(warm+v)),0.0),48.0);
        float edge=pow(1.0-max(dot(n,v),0.0),3.0);
        float pulse=.86+.14*sin(uTime*1.05+vLocal.x*2.0+vLocal.z*1.5);
        float phase=vLocal.x*1.10+vLocal.z*.68+dot(n,v)*3.1;
        vec3 spectrum=.54+.46*cos(phase+vec3(0.0,2.09,4.18));
        vec3 material=mix(vColor,spectrum*(.52+length(vColor)*.37),uIridescence*(.35+.65*max(n.y,0.0)));
        vec3 color=material*(.40+diffuse*.80)+vec3(.18,.31,.42)*rim*.30;
        color+=vec3(1.0,.88,.71)*spec*.70+vec3(.24,.48,.63)*edge*.13;
        color+=material*vGlow*(pulse+.10*uHighlight);
        gl_FragColor=vec4(color,1.0);
      }
    `);
    program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Scene program failed');
    gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.clearColor(0,0,0,0);
    const attributes=['aPosition','aNormal','aColor','aGlow'].map(name=>gl.getAttribLocation(program,name));
    const uniforms=Object.fromEntries(['uVP','uOffset','uScale','uEye','uTime','uHighlight','uAlpha','uIridescence'].map(name=>[name,gl.getUniformLocation(program,name)]));
    for(const geometry of createWaferGeometry()){
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(geometry.data),gl.STATIC_DRAW);
      meshes.push({buffer,count:geometry.data.length/10,name:geometry.name,iridescence:geometry.iridescence});
    }
    function draw(){
      if(failed||!canvas.width||!canvas.height)return;
      gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const targetY=.03+explode*.18,d=distance*Math.max(1,canvas.height/canvas.width)+explode*.20;
      eye=[d*Math.cos(pitch)*Math.sin(yaw),targetY+d*Math.sin(pitch),d*Math.cos(pitch)*Math.cos(yaw)];
      projectionView=multiply(perspective(.66,canvas.width/canvas.height,.1,55),lookAt(eye,[0,targetY,0]));
      gl.uniformMatrix4fv(uniforms.uVP,false,projectionView);gl.uniform3fv(uniforms.uEye,eye);gl.uniform1f(uniforms.uTime,clock);
      for(const part of meshes){
        const transform=geometryPose(part.name,progress,explode);if(transform.alpha<.002)continue;
        gl.bindBuffer(gl.ARRAY_BUFFER,part.buffer);
        attributes.forEach((attribute,i)=>{gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,i===3?1:3,gl.FLOAT,false,40,[0,12,24,36][i])});
        gl.uniform1f(uniforms.uHighlight,part.name.startsWith(activePart)?1:0);
        gl.uniform1f(uniforms.uScale,transform.scale);gl.uniform1f(uniforms.uAlpha,transform.alpha);
        gl.uniform1f(uniforms.uIridescence,part.iridescence);gl.uniform3fv(uniforms.uOffset,transform.offset);
        gl.drawArrays(gl.TRIANGLES,0,part.count);
      }
      markers.forEach(marker=>{
        const data=partData[marker.dataset.chipMarker];if(!data){marker.hidden=true;return}
        const p=project(data.point,projectionView);marker.style.left=((p.x*.5+.5)*100)+'%';marker.style.top=((-p.y*.5+.5)*100)+'%';
        marker.hidden=marker.dataset.chipMarker!==activePart||!p.visible||Math.abs(p.x)>.96||Math.abs(p.y)>.90;
      });
    }
    function resize(){
      const rect=canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
      const ratio=phoneViewport.matches
        ?Math.min(devicePixelRatio||1,1.25,900/rect.width,900/rect.height)
        :Math.min(devicePixelRatio||1,1.6,1200/rect.width,1100/rect.height);
      canvas.width=Math.round(rect.width*ratio);canvas.height=Math.round(rect.height*ratio);draw();
    }
    const active=()=>visible&&!document.hidden&&!stage.closest('[hidden]')&&!window.__siliconExplorerOpen;
    const animate=()=>motion&&!userPaused;
    function frame(time){
      raf=0;if(!active()){lastTime=0;return}
      // Keep the automatic phone scene light; direct controls still draw immediately.
      if(phoneViewport.matches&&lastTime&&time-lastTime<32){raf=requestAnimationFrame(frame);return}
      const dt=Math.min((time-(lastTime||time))/1000,.05);lastTime=time;
      if(animate()){clock+=dt;if(!drag?.active&&!scrollGuided)yaw+=dt*.075;}
      if(scrollGuided&&!drag?.active){
        const ease=motion?Math.min(dt*9,1):1;
        yaw+=(scrollTarget.yaw-yaw)*ease;pitch+=(scrollTarget.pitch-pitch)*ease;distance+=(scrollTarget.distance-distance)*ease;
      }
      if(Math.abs(targetProgress-progress)>.0002)progress+=motion?(targetProgress-progress)*Math.min(dt*7,1):targetProgress-progress;
      else progress=targetProgress;
      if(Math.abs(targetExplode-explode)>.001)explode+=motion?(targetExplode-explode)*Math.min(dt*8,1):targetExplode-explode;
      else explode=targetExplode;
      draw();
      if(animate()||Math.abs(targetProgress-progress)>.0002||Math.abs(targetExplode-explode)>.001||scrollGuided&&(Math.abs(scrollTarget.yaw-yaw)>.001||Math.abs(scrollTarget.pitch-pitch)>.001||Math.abs(scrollTarget.distance-distance)>.001))raf=requestAnimationFrame(frame);
    }
    function wake(){if(failed)return;if(!active()){cancelAnimationFrame(raf);raf=0;lastTime=0;return}if(!raf){lastTime=0;raf=requestAnimationFrame(frame)}}
    renderOnce=()=>{if(failed)return;draw();wake()};
    function rotationState(){
      const toggle=stage.querySelector('[data-scene-action="rotate"]');
      toggle.setAttribute('aria-pressed',String(animate()));toggle.textContent=animate()?'Pause rotation':'Rotate chip';toggle.disabled=failed||!motion;
    }
    controls.forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{
      const action=button.dataset.sceneAction;interact();
      if(action==='rotate'){userPaused=!userPaused;rotationState()}
      if(action==='in')distance=clamp(distance-.7,7.5,13.5);
      if(action==='out')distance=clamp(distance+.7,7.5,13.5);
      if(action==='reset'){targetExplode=0;slider.value='0';updateLayers();choosePart('wafer',true)}
      if(action==='layers'){targetExplode=targetExplode>.1?0:1;slider.value=String(Math.round(targetExplode*100));updateLayers()}
      renderOnce();
    })});
    slider.disabled=false;
    function updateLayers(){
      const value=Math.round(targetExplode*100);slider.value=String(value);stage.querySelector('#layer-value').textContent=value+'%';
      slider.setAttribute('aria-valuetext',value===0?'Assembled':value===100?'Fully separated':value+' percent separated');
      const button=stage.querySelector('[data-scene-action="layers"]');button.setAttribute('aria-pressed',String(targetExplode>.1));button.textContent=targetExplode>.1?'Assemble layers':'Separate layers';
      if(!motion)explode=targetExplode;
    }
    slider.addEventListener('input',()=>{interact();targetExplode=Number(slider.value)/100;updateLayers();renderOnce()});
    function interact(){scrollGuided=false;stage.classList.remove('is-scroll-guided');if(!interacted){interacted=true;stage.classList.add('has-interacted')}hint.textContent='Free exploration · Scroll to continue the story'}
    function clearDrag(){
      const pointerId=drag?.id;drag=null;canvas.classList.remove('is-dragging');
      if(pointerId!==undefined&&canvas.hasPointerCapture(pointerId))canvas.releasePointerCapture(pointerId);
      wake();
    }
    canvas.addEventListener('pointerdown',event=>{
      if(event.button!==0&&event.pointerType==='mouse')return;
      const touch=event.pointerType==='touch';
      if(touch){touchPointers.add(event.pointerId);if(touchPointers.size>1){clearDrag();return}}
      drag={id:event.pointerId,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,touch,active:!touch};
      // A touch remains native scrolling until a deliberate horizontal gesture.
      if(!touch){canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');interact()}
    });
    canvas.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==event.pointerId)return;
      if(drag.touch&&!drag.active){
        const dx=Math.abs(event.clientX-drag.startX),dy=Math.abs(event.clientY-drag.startY);
        if(touchPointers.size>1||(dy>=10&&dy>=dx*1.15)){clearDrag();return}
        if(dx<12||dx<=dy*1.3)return;
        drag.active=true;drag.x=event.clientX;drag.y=event.clientY;
        canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');interact();
        return;
      }
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      yaw-=dx*.009;if(!drag.touch)pitch=clamp(pitch+dy*.007,.22,1.35);
      drag.x=event.clientX;drag.y=event.clientY;renderOnce();
    });
    const release=event=>{
      if(event.type!=='lostpointercapture')touchPointers.delete(event.pointerId);
      if(drag&&event.pointerId===drag.id)clearDrag();
    };
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
    window.addEventListener('pointerup',release,{passive:true});window.addEventListener('pointercancel',release,{passive:true});
    canvas.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(event.key))return;event.preventDefault();
      if(event.key==='ArrowLeft')yaw+=.13;if(event.key==='ArrowRight')yaw-=.13;if(event.key==='ArrowUp')pitch=clamp(pitch+.1,.22,1.35);if(event.key==='ArrowDown')pitch=clamp(pitch-.1,.22,1.35);
      if(event.key==='+'||event.key==='=')distance=clamp(distance-.5,7.5,13.5);if(event.key==='-')distance=clamp(distance+.5,7.5,13.5);if(event.key==='Home')choosePart('wafer',true)
      interact();renderOnce();
    });
    function followScroll(detail){
      if(failed)return;
      scrollGuided=Boolean(detail.enabled&&motion);stage.classList.toggle('is-scroll-guided',scrollGuided);
      if(scrollGuided){
        scrollTarget=storyPose(detail.progress);targetProgress=scrollTarget.progress;targetExplode=scrollTarget.explode;userPaused=false;
        updateLayers();rotationState();
        if(activePart!==scrollTarget.part)choosePart(scrollTarget.part);
        hint.textContent='Scroll to travel from the wafer into one transistor';
      }
      renderOnce();
    }
    window.addEventListener('silicon-scroll',event=>followScroll(event.detail));
    window.addEventListener('portfolio-motion',event=>{motion=event.detail.enabled;if(!motion){scrollGuided=false;stage.classList.remove('is-scroll-guided');explode=targetExplode;progress=targetProgress;cancelAnimationFrame(raf);raf=0}rotationState();renderOnce()});
    document.addEventListener('visibilitychange',wake);
    window.addEventListener('silicon-explorer-visibility',wake);
    if('IntersectionObserver'in window){observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)resize();wake()},{threshold:.02});observer.observe(stage)}else visible=true;
    if('ResizeObserver'in window){resizeObserver=new ResizeObserver(()=>{resize();wake()});resizeObserver.observe(canvas)}else window.addEventListener('resize',resize);
    const areaObserver=new MutationObserver(()=>{if(document.body.dataset.area==='ic'){resize();wake()}else{cancelAnimationFrame(raf);raf=0;lastTime=0}});areaObserver.observe(document.body,{attributes:true,attributeFilter:['data-area']});
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail()});
    window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;drag=null;touchPointers.clear();canvas.classList.remove('is-dragging')});window.addEventListener('pageshow',wake);
    resize();stage.classList.add('is-3d-ready');rotationState();choosePart('wafer');ready(true);if(window.__siliconScroll)followScroll(window.__siliconScroll);wake();
  }catch(error){console.warn('Using the static silicon illustration.');fail()}
  function renderOnce(){}
}
