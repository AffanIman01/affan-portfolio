export const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
export function multiply(a,b){
  const out=new Float32Array(16);
  for(let column=0;column<4;column++)for(let row=0;row<4;row++){
    out[column*4+row]=a[row]*b[column*4]+a[4+row]*b[column*4+1]+a[8+row]*b[column*4+2]+a[12+row]*b[column*4+3];
  }
  return out;
}
export function perspective(fov,aspect,near,far){
  const f=1/Math.tan(fov/2),range=1/(near-far);
  return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*range,-1,0,0,2*far*near*range,0]);
}
export function lookAt(eye,target){
  let z=eye.map((v,i)=>v-target[i]),length=Math.hypot(...z);z=z.map(v=>v/length);
  let x=[z[2],0,-z[0]];length=Math.hypot(...x);x=x.map(v=>v/length);
  const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
  const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0);
  return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
}
export function project(point,matrix){
  const p=[...point,1],out=[0,0,0,0];
  for(let row=0;row<4;row++)for(let i=0;i<4;i++)out[row]+=matrix[i*4+row]*p[i];
  return {x:out[0]/out[3],y:out[1]/out[3],z:out[2]/out[3],visible:out[3]>0};
}
export function box(target,x,y,z,width,height,depth,color,glow=0){
  const X=width/2,Y=height/2,Z=depth/2;
  const faces=[
    [[0,1,0],[[-X,Y,-Z],[-X,Y,Z],[X,Y,Z],[X,Y,-Z]]],
    [[0,-1,0],[[-X,-Y,Z],[-X,-Y,-Z],[X,-Y,-Z],[X,-Y,Z]]],
    [[1,0,0],[[X,-Y,-Z],[X,Y,-Z],[X,Y,Z],[X,-Y,Z]]],
    [[-1,0,0],[[-X,-Y,Z],[-X,Y,Z],[-X,Y,-Z],[-X,-Y,-Z]]],
    [[0,0,1],[[X,-Y,Z],[X,Y,Z],[-X,Y,Z],[-X,-Y,Z]]],
    [[0,0,-1],[[-X,-Y,-Z],[-X,Y,-Z],[X,Y,-Z],[X,-Y,-Z]]]
  ];
  for(const [normal,vertices] of faces)for(const index of [0,1,2,0,2,3]){
    const vertex=vertices[index];target.push(x+vertex[0],y+vertex[1],z+vertex[2],...normal,...color,glow);
  }
}
