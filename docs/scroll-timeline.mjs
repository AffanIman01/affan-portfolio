import {clamp} from './silicon-math.mjs';

// Each quarter of the journey is a complete, inspectable change of scale.
const keys=[
  {at:0,yaw:.48,pitch:.84,distance:10.8,explode:0,part:'wafer'},
  {at:.25,yaw:.72,pitch:.72,distance:9.8,explode:0,part:'die'},
  {at:.5,yaw:.62,pitch:.62,distance:10.8,explode:1,part:'metal'},
  {at:.75,yaw:.82,pitch:.78,distance:10.2,explode:.45,part:'devices'},
  {at:1,yaw:.66,pitch:.70,distance:9.4,explode:.12,part:'transistor'}
];
const safeProgress=value=>clamp(Number.isFinite(value)?value:0,0,1);
export function storyPose(progress){
  const p=safeProgress(progress),index=Math.min(3,Math.floor(p*4));
  const a=keys[index],b=keys[index+1];
  const t=clamp((p-a.at)/(b.at-a.at),0,1),smooth=t*t*(3-2*t);
  const pose={part:keys[Math.min(4,Math.floor(p*4+.5))].part,progress:p};
  for(const key of ['yaw','pitch','distance','explode'])pose[key]=a[key]+(b[key]-a[key])*smooth;
  return pose;
}
export function chapterWeights(progress){
  const p=safeProgress(progress),weights=[0,0,0,0,0],cuts=[.125,.375,.625,.875],half=.055;
  for(let i=0;i<cuts.length;i++){
    if(p<cuts[i]-half){weights[i]=1;return weights}
    if(p<=cuts[i]+half){let t=(p-cuts[i]+half)/(half*2);t=t*t*(3-2*t);weights[i]=1-t;weights[i+1]=t;return weights}
  }
  weights[4]=1;return weights;
}
export function storyProgress(top,height,frameHeight){return safeProgress(-top/Math.max(1,height-frameHeight))}
