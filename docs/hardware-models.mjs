// Small original polygon models. These are illustrative, not manufacturer CAD.
const dark = '#26323c', black = '#101820', metal = '#aebdc7', green = '#287260', gold = '#d5b66c';
function rgb(hex) { return hex.slice(1).match(/../g).map(v => parseInt(v,16)); }
export function buildHardwareModel(item) {
  const faces = [];
  const face = (points, color) => faces.push({points, color:rgb(color)});
  function box(x,y,z,w,h,d,color=metal) {
    const v = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(p=>[x+p[0]*w/2,y+p[1]*h/2,z+p[2]*d/2]);
    [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]].forEach(f=>face(f.map(i=>v[i]),color));
  }
  function cylinder(x,y,z,r,h,color=metal,axis='y',n=16) {
    const point=(a,b)=>{
      const c=Math.cos(a)*r,s=Math.sin(a)*r;
      return axis==='x'?[x+b,y+c,z+s]:axis==='z'?[x+c,y+s,z+b]:[x+c,y+b,z+s];
    };
    const bottom=[],top=[];
    for(let i=0;i<n;i++) {
      const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;
      face([point(a,-h/2),point(b,-h/2),point(b,h/2),point(a,h/2)],color);
      bottom.push(point(a,-h/2));top.unshift(point(a,h/2));
    }
    face(bottom,color);face(top,color);
  }
  function beam(a,b,r,color=dark) {
    const v=b.map((x,i)=>x-a[i]), len=Math.hypot(...v), u=v.map(x=>x/len);
    const ref=Math.abs(u[1])>.9?[1,0,0]:[0,1,0];
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    let q=cross(u,ref);const ql=Math.hypot(...q);q=q.map(x=>x/ql*r);const t=cross(u,q);
    const corners=p=>[[1,1],[-1,1],[-1,-1],[1,-1]].map(([s,k])=>p.map((x,i)=>x+s*q[i]+k*t[i]));
    const A=corners(a),B=corners(b);face(A,color);face(B,color);
    for(let i=0;i<4;i++)face([A[i],B[i],B[(i+1)%4],A[(i+1)%4]],color);
  }
  function wheel(x,z,r=.43,mecanum=false) {
    cylinder(x,.47,z,r,.29,black,'x');cylinder(x+Math.sign(x)*.16,.47,z,r*.51,.035,metal,'x');
    cylinder(x+Math.sign(x)*.185,.47,z,r*.18,.045,dark,'x');
    for(let i=0;i<10;i++){
      const a=i*Math.PI/5;
      if(mecanum)beam([x-.13,.47+Math.cos(a)*r,z+Math.sin(a)*r],[x+.13,.47+Math.cos(a+.25)*r,z+Math.sin(a+.25)*r],.055,metal);
      else box(x,.47+Math.cos(a)*r,z+Math.sin(a)*r,.3,.055,.065,dark);
    }
  }
  function board(w,d,color=green) {
    box(0,.22,0,w,.09,d,color);
    for(const x of [-w/2+.08,w/2-.08])for(let z=-d/2+.15;z<d/2;z+=.16)box(x,.29,z,.07,.07,.065,gold);
    for(const x of [-w/2+.07,w/2-.07])for(const z of [-d/2+.07,d/2-.07])cylinder(x,.278,z,.035,.012,gold,'y',8);
  }
  const kind=item.model,accent=item.color;
  if(['dingo','husky','jackal'].includes(kind)) {
    const isDingo=kind==='dingo', w=kind==='husky'?1.7:1.35,d=kind==='husky'?2.4:1.8;
    box(0,.68,0,w,.43,d,accent);box(0,.95,0,w*.91,.12,d*.95,dark);
    for(const x of [-w*.57,w*.57])for(const z of [-d*.34,d*.34])wheel(x,z,isDingo?.31:kind==='husky'?.47:.4,isDingo);
    box(0,.65,-d*.56,w*.94,.15,.14,dark);box(0,.65,d*.56,w*.94,.15,.14,dark);
    for(const x of [-w*.33,w*.33])box(x,.81,d*.507,.2,.08,.03,metal);
    if(!isDingo){box(0,1.12,-.25,.75,.22,.65,metal);cylinder(0,1.39,-.3,.22,.32,dark);cylinder(0,1.5,-.3,.225,.07,accent);beam([.52,1,0],[.52,1.65,0],.018,black);}
    else for(const z of [-.4,.4])box(0,1.025,z,1.05,.035,.08,metal);
  } else if(['heron','me120'].includes(kind)) {
    const c=kind==='heron'?accent:'#e8a64b';
    for(const x of [-.91,.91]) {
      box(x,.4,-.2,.58,.45,2.8,c);
      face([[x-.29,.175,1.2],[x+.29,.175,1.2],[x,.3,1.9]],dark);
      face([[x-.29,.625,1.2],[x,.53,1.9],[x+.29,.625,1.2]],c);
      face([[x-.29,.175,1.2],[x,.3,1.9],[x,.53,1.9],[x-.29,.625,1.2]],c);
      face([[x+.29,.625,1.2],[x,.53,1.9],[x,.3,1.9],[x+.29,.175,1.2]],c);
      cylinder(x,.18,-1.64,.14,.35,black,'z');
    }
    for(const z of [-.9,.65])box(0,.7,z,2.2,.12,.17,metal);
    box(0,.75,-.13,1.22,.35,1.72,kind==='heron'?dark:metal);box(0,1,-.32,.7,.22,.8,dark);
    const positions=kind==='heron'?[-.4,.4]:[-.65,-.22,.22,.65];
    positions.forEach(x=>{beam([x,.9,-.8],[x,1.72,-.8],.024,metal);cylinder(x,1.77,-.8,.065,.17,dark);});
    cylinder(0,1.26,.22,.15,.21,accent);
  } else if(kind==='rov') {
    box(0,.75,0,1.45,.58,1.95,accent);box(0,1.07,0,1.15,.08,1.62,dark);
    for(const x of [-.95,.95])for(const z of [-.8,.8]){cylinder(x,.75,z,.29,.31,dark,'z');cylinder(x,.75,z+.18,.21,.03,black,'z');cylinder(x,.75,z+.21,.07,.035,metal,'z');}
    for(const x of [-.76,.76]){beam([x,.15,-1.1],[x,.15,1.1],.06,dark);beam([x,.15,-.78],[x,.65,-.78],.05,dark);beam([x,.15,.78],[x,.65,.78],.05,dark);}
    cylinder(0,.77,1.03,.24,.18,dark,'z');cylinder(0,.77,1.14,.155,.04,'#85c9e2','z');
    for(const x of [-.47,.47])cylinder(x,.81,1.01,.1,.05,'#e4f2f1','z');
    box(0,1.25,0,.1,.3,.75,metal);box(0,1.43,0,.1,.06,.8,dark);
  } else if(['quad','hex'].includes(kind)) {
    const count=kind==='quad'?4:6;
    cylinder(0,.92,0,.48,.12,dark,'y',count);box(0,1.09,0,.4,.2,.52,kind==='hex'?'#ee8c42':black);
    for(let i=0;i<count;i++) {
      const a=i/count*Math.PI*2+Math.PI/4,x=Math.cos(a)*1.35,z=Math.sin(a)*1.35;
      beam([0,.85,0],[x,.85,z],.055,i<count/2?accent:metal);cylinder(x,.96,z,.12,.2,black);
      beam([x-.54,1.08,z-.09],[x+.54,1.08,z+.09],.04,dark);
    }
    for(const x of [-.47,.47]){beam([x,.72,-.34],[x,.12,-.54],.04,metal);beam([x,.72,.34],[x,.12,.54],.04,metal);beam([x,.12,-.72],[x,.12,.72],.045,dark);}
    beam([.33,.96,-.22],[.33,1.46,-.22],.018,dark);cylinder(.33,1.49,-.22,.14,.06,metal);
  } else if(kind==='zed') {
    box(0,.54,0,2.75,.55,.48,metal);box(0,.54,.25,2.63,.45,.035,dark);
    for(const x of [-1.01,1.01]){cylinder(x,.54,.3,.19,.1,black,'z');cylinder(x,.54,.36,.12,.035,'#53829e','z');cylinder(x-.025,.57,.385,.035,.006,'#d6e9ec','z');}
    box(0,.17,0,.44,.2,.34,black);
  } else if(kind==='lidar') {
    cylinder(0,.2,0,.65,.18,metal);cylinder(0,.7,0,.61,.84,dark);cylinder(0,1.12,0,.59,.12,metal);cylinder(0,.72,0,.625,.24,'#294b5a');
    for(let i=0;i<8;i++){const a=i*Math.PI/4;cylinder(Math.cos(a)*.53,.3,Math.sin(a)*.53,.035,.05,black);}
  } else if(kind==='mid360') {
    box(0,.45,0,1.17,.7,1.05,dark);cylinder(0,.84,0,.52,.4,black);cylinder(0,1.05,0,.46,.06,metal);box(0,.48,.535,.8,.25,.03,'#264e61');
    for(const x of [-.47,.47])for(const z of [-.43,.43])cylinder(x,.1,z,.055,.04,metal);
  } else if(kind==='huskylens') {
    box(0,.77,0,1.48,1.22,.22,green);box(.28,.8,.19,.74,.69,.2,black);box(-.44,.76,.17,.35,.58,.15,dark);
    cylinder(-.44,.82,.29,.19,.19,black,'z');cylinder(-.44,.82,.4,.12,.035,'#6babc3','z');
    for(const x of [-.59,.59])for(const y of [.29,1.25])cylinder(x,y,.13,.045,.025,gold,'z',8);
  } else if(kind==='myrio') {
    box(0,.6,0,1.76,.7,1.6,metal);box(0,.99,0,1.65,.08,1.5,dark);box(-.48,1.055,.18,.48,.055,.5,'#87b569');
    for(const x of [-.59,0,.59]){box(x,.64,.84,.44,.29,.13,black);for(let i=0;i<6;i++)box(x-.17+i*.068,.64,.912,.022,.15,.018,gold);}
    for(let i=0;i<6;i++)box(.43,.68,-.814,.033,.025,.02,'#91debb');
  } else if(['arduino','esp32','pico','pi','nano','orin'].includes(kind)) {
    if(kind==='orin') {
      box(0,.63,0,1.9,1,1.5,dark);
      for(let x=-.83;x<.91;x+=.15)box(x,1.22,0,.055,.22,1.52,metal);
      for(let x=-.62;x<.7;x+=.4)box(x,.49,.78,.28,.24,.08,metal);
      box(.57,.88,.77,.38,.13,.08,'#87b04e');
    } else {
      const narrow=['pico','esp32'].includes(kind);const w=narrow?.83:1.65,d=narrow?2.15:2.05;
      board(w,d,kind==='arduino'?'#297e88':green);
      box(0,.36,0,narrow?.4:.68,.18,narrow?.43:.66,black);
      box(0,.36,d/2-.03,narrow?.3:.43,.19,.3,metal);
      if(kind==='nano')for(let x=-.55;x<.61;x+=.13)box(x,.67,-.1,.052,.55,.95,dark);
      else if(kind==='esp32')box(0,.36,-.47,.64,.11,.61,metal);
      else if(kind==='pico')box(0,.32,-.69,.15,.04,.11,metal);
      else {for(let i=0;i<2;i++)box(w/2-.24,.48,-.65+i*.48,.42,.39,.38,metal);box(-.48,.34,-.65,.29,.14,.23,black);}
      if(kind==='arduino')for(const x of [-.68,.68])box(x,.38,-.05,.15,.21,1.3,black);
      else for(let z=-.74;z<.5;z+=.24)box(-w/2+.24,.35,z,.11,.13,.12,metal);
    }
  } else if(kind==='bldc') {
    cylinder(-.45,.26,0,.52,.18,dark);cylinder(-.45,.67,0,.46,.66,metal);cylinder(-.45,1.04,0,.34,.08,dark);cylinder(-.45,1.22,0,.07,.3,metal);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;box(-.45+Math.cos(a)*.39,.68,Math.sin(a)*.39,.07,.42,.07,'#c3915b');}
    box(.85,.27,.2,.57,.23,1.3,dark);for(let i=0;i<3;i++)beam([.55,.24,-.27+i*.17],[.05,.32,-.27+i*.17],.02,['#c77765','#cfb85b','#5a8cac'][i]);
  } else if(kind==='servo') {
    box(0,.7,0,1.05,1.05,.67,dark);box(0,.9,0,1.6,.12,.4,dark);cylinder(.19,1.27,0,.23,.11,metal);cylinder(.19,1.39,0,.12,.17,gold);
    box(.19,1.5,0,1.38,.08,.18,metal);box(0,.62,.343,.81,.36,.016,accent);
    for(let i=0;i<3;i++)beam([-.45,.32,-.08+i*.07],[-1.05,.14,.2+i*.07],.022,['#d89158','#bc6d5a',black][i]);
  } else if(['x1c','centauri','cr10'].includes(kind)) {
    const open=kind==='cr10',frame=kind==='x1c'?metal:dark;
    box(0,.16,0,1.75,.22,1.75,dark);
    for(const x of [-.81,.81])for(const z of open?[-.18]:[-.81,.81])box(x,1.2,z,.13,2.05,.13,frame);
    if(!open){box(0,2.27,0,1.78,.17,1.76,frame);box(0,1.22,-.84,1.62,2,.06,dark);box(-.83,1.22,0,.04,2,1.6,frame);}
    else box(0,2.27,-.18,1.76,.13,.14,frame);
    box(0,.63,.1,1.45,.09,1.32,metal);box(0,.69,.1,1.37,.025,1.24,black);
    box(0,1.65,-.16,1.59,.09,.09,metal);box(.19,1.55,-.1,.33,.34,.3,dark);cylinder(.19,1.32,-.04,.055,.13,gold);
    box(.15,.9,.08,.5,.38,.53,accent);box(.15,1.15,.08,.32,.12,.34,accent);
    if(!open){box(.48,2.22,.9,.53,.37,.1,dark);box(.48,2.23,.958,.39,.23,.018,'#5b9ca7');box(.72,1.2,.9,.045,.37,.06,metal);}
    else {box(1.22,.37,-.33,.52,.64,.83,dark);box(1.22,.56,.097,.35,.19,.03,'#477b98');cylinder(0,2.6,-.18,.26,.17,dark,'x');}
  }
  if(!faces.length)throw new Error('Unknown hardware model: '+kind);
  // Normalize each model around the same turntable, with its base at y=0.
  const points=faces.flatMap(f=>f.points), min=[0,1,2].map(i=>Math.min(...points.map(p=>p[i]))),max=[0,1,2].map(i=>Math.max(...points.map(p=>p[i])));
  const scale=2.8/Math.max(max[0]-min[0],max[1]-min[1],max[2]-min[2]);
  faces.forEach(f=>f.points=f.points.map(p=>[(p[0]-(min[0]+max[0])/2)*scale,(p[1]-min[1])*scale,(p[2]-(min[2]+max[2])/2)*scale]));
  return faces;
}

export function projectedFaces(faces,yaw,width,height) {
  const pitch=.31, cy=Math.cos(yaw),sy=Math.sin(yaw), cp=Math.cos(pitch),sp=Math.sin(pitch);
  function rotate([x,y,z]){const X=x*cy+z*sy,Z=-x*sy+z*cy,Y=y-1.15;return [X,Y*cp-Z*sp,Y*sp+Z*cp];}
  return faces.map(face=>{
    const vertices=face.points.map(rotate),a=vertices[0],b=vertices[1],c=vertices[2],u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]);
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],len=Math.hypot(...n)||1;
    const light=.62+.34*Math.abs((n[0]*-.38+n[1]*.78+n[2]*.48)/len);
    return {points:vertices.map(([x,y,z])=>{const s=Math.min(width,height)*1.3/(5.8-z);return [width/2+x*s,height*.49-y*s];}),depth:vertices.reduce((s,p)=>s+p[2],0)/vertices.length,fill:'rgb('+face.color.map(c=>Math.round(c*light)).join(',')+')'};
  }).sort((a,b)=>a.depth-b.depth);
}

let renderer;
function getRenderer() {
  if(renderer!==undefined)return renderer;
  renderer=null;
  const surface=document.createElement('canvas');surface.width=640;surface.height=500;
  const gl=surface.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:true,premultipliedAlpha:false});
  if(!gl)return null;
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Hardware shader compilation failed');return s;};
  try {
    const program=gl.createProgram();
    const vertex=shader(gl.VERTEX_SHADER,`
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec3 color;
      uniform float yaw;
      varying vec3 shade;
      vec3 rotate(vec3 p){
        float cy=cos(yaw),sy=sin(yaw),cp=cos(0.31),sp=sin(0.31);
        float x=p.x*cy+p.z*sy,z=-p.x*sy+p.z*cy;
        return vec3(x,p.y*cp-z*sp,p.y*sp+z*cp);
      }
      void main(){
        vec3 p=rotate(position-vec3(0.0,1.15,0.0));
        float cameraDistance=5.8-p.z;
        gl_Position=vec4(p.x*2.6*500.0/640.0,p.y*2.6+0.02*cameraDistance,1.01005*cameraDistance-0.201005,cameraDistance);
        float light=0.62+0.34*abs(dot(normalize(rotate(normal)),vec3(-0.38,0.78,0.48)));
        shade=color*light;
      }
    `);
    const fragment=shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec3 shade;void main(){gl_FragColor=vec4(shade,1.0);}`);
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Hardware shader linking failed');
    gl.deleteShader(vertex);gl.deleteShader(fragment);gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
    const locations=['position','normal','color'].map(n=>gl.getAttribLocation(program,n)),rotation=gl.getUniformLocation(program,'yaw'),buffers=new WeakMap();
    renderer={surface,render(faces,yaw){
      if(gl.isContextLost())return false;
      let model=buffers.get(faces);
      if(!model){
        const vertices=[];
        faces.forEach(face=>{
          const [a,b,c]=face.points,u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]);
          const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
          for(let i=1;i<face.points.length-1;i++)for(const point of [face.points[0],face.points[i],face.points[i+1]])vertices.push(...point,...n,...face.color.map(c=>c/255));
        });
        const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);model={buffer,count:vertices.length/9};buffers.set(faces,model);
      }
      gl.viewport(0,0,640,500);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.bindBuffer(gl.ARRAY_BUFFER,model.buffer);
      locations.forEach((location,i)=>{gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,3,gl.FLOAT,false,36,i*12);});
      gl.uniform1f(rotation,yaw);gl.drawArrays(gl.TRIANGLES,0,model.count);return true;
    }};
  } catch {renderer=null;}
  return renderer;
}

export function drawHardware(canvas,faces,yaw) {
  const ctx=canvas.getContext('2d');if(!ctx)return;
  const width=canvas.width,height=canvas.height;
  ctx.clearRect(0,0,width,height);
  const shadow=ctx.createRadialGradient(width/2,height*.85,0,width/2,height*.85,width*.32);
  shadow.addColorStop(0,'#00000065');shadow.addColorStop(1,'#00000000');ctx.fillStyle=shadow;ctx.fillRect(0,height*.69,width,height*.31);
  const gpu=getRenderer();
  if(gpu&&gpu.render(faces,yaw)){ctx.drawImage(gpu.surface,0,0,width,height);return;}
  projectedFaces(faces,yaw,width,height).forEach(face=>{
    ctx.beginPath();face.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=face.fill;ctx.fill();ctx.strokeStyle=face.fill;ctx.lineWidth=.45;ctx.stroke();
  });
}
