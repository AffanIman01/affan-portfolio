import {clamp} from './silicon-math.mjs';
import {chapterWeights,storyProgress} from './scroll-timeline.mjs';

const story=document.querySelector('#home');
const frame=story?.querySelector('.scroll-story-frame');
const stage=document.querySelector('#silicon-stage');
if(story&&frame&&stage){
  const journey=stage.closest('.wafer-scroll-track');
  const chapters=[...story.querySelectorAll('[data-story-chapter]')];
  const chapterDots=[...story.querySelectorAll('[data-story-step]')];
  const counter=story.querySelector('.story-position');
  const progressBar=story.querySelector('.story-progress-fill');
  const caption=story.querySelector('.story-scroll-caption');
  const phoneViewport=matchMedia('(max-width: 760px)');
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const manual=stage.querySelector('.scene-manual-controls');
  // A mobile address bar moving while the user scrolls must not resize the runway.
  let phoneWidth=window.innerWidth,phoneHeight=window.innerHeight,stickyTop=80;
  let enabled=false,pinned=false,phoneGuided=false,frameRequest=0,activeChapter=-1,lastProgress=-1,lastScrollY=window.scrollY;
  let lastEnabled=false;
  const captions=['Begin with the wafer','One die, a complete design','Follow the interconnects','Find the device array','Inside one transistor'];
  function revealChapter(weights){
    const active=weights.indexOf(Math.max(...weights));
    chapters.forEach((chapter,index)=>{
      const weight=weights[index]??0;chapter.style.opacity=String(weight);
      chapter.style.transform=`translateY(${(1-weight)*(index>active?22:-18)}px)`;
      chapter.style.visibility=weight<.001?'hidden':'visible';
      if(activeChapter!==active){
        chapter.inert=index!==active;chapter.setAttribute('aria-hidden',String(index!==active));
        chapter.style.pointerEvents=index===active?'auto':'none';
      }
    });
    if(active!==activeChapter){
      activeChapter=active;story.dataset.chapter=String(active);
      if(counter)counter.textContent=`0${active+1} / 05`;
      if(caption)caption.textContent=captions[active];
      chapterDots.forEach((dot,index)=>dot.classList.toggle('is-current',index===active));
    }
  }
  function update(reason='scroll'){
    frameRequest=0;
    if(story.hidden||document.body.dataset.area!=='ic')return;
    const positionChanged=Math.abs(window.scrollY-lastScrollY)>.5;lastScrollY=window.scrollY;
    let progress=0;
    if(enabled){
      if(pinned){
        progress=storyProgress(story.getBoundingClientRect().top,story.offsetHeight,frame.offsetHeight);
      }else if(phoneGuided&&journey){
        // Start when the visual reaches the header; complete before it unpins.
        progress=storyProgress(journey.getBoundingClientRect().top-stickyTop,journey.offsetHeight,stage.offsetHeight);
      }else{
        const rect=stage.getBoundingClientRect(),viewportHeight=phoneViewport.matches?phoneHeight:window.innerHeight;
        // A short viewport keeps native flow. Its five tabs also expose every scale.
        const start=viewportHeight*.62,end=Math.max(24,viewportHeight*.16);
        progress=clamp((start-rect.top)/Math.max(1,start-end),0,1);
      }
    }
    revealChapter(pinned?chapterWeights(progress):[1,0,0,0,0]);
    story.style.setProperty('--story-progress',String(progress));
    if(progressBar)progressBar.style.transform=`scaleX(${progress})`;
    // Resizing or opening details never steals an explicitly chosen manual view.
    if(enabled!==lastEnabled||reason==='setup'||(reason==='scroll'&&positionChanged&&Math.abs(progress-lastProgress)>.0001)){
      window.__siliconScroll={enabled,progress};
      window.dispatchEvent(new CustomEvent('silicon-scroll',{detail:window.__siliconScroll}));
      lastProgress=progress;lastEnabled=enabled;
    }
  }
  function schedule(){if(!frameRequest)frameRequest=requestAnimationFrame(()=>update('scroll'))}
  function configure(reason='layout'){
    if(Math.abs(window.innerWidth-phoneWidth)>1){phoneWidth=window.innerWidth;phoneHeight=window.innerHeight}
    enabled=window.portfolioMotionEnabled!==false&&!reducedMotion.matches&&window.__siliconReady===true;
    const nav=document.querySelector('.island-nav'),bottom=document.querySelector('.mobile-tabbar');
    stickyTop=Math.max(76,(nav?.getBoundingClientRect().bottom??68)+12);
    const bottomSpace=Math.max(76,(bottom?.getBoundingClientRect().height??68)+12);
    const available=Math.max(140,phoneHeight-stickyTop-bottomSpace-8);
    story.style.setProperty('--wafer-screen-height',`${phoneHeight}px`);
    story.style.setProperty('--wafer-sticky-top',`${stickyTop}px`);
    story.style.setProperty('--wafer-available-height',`${available}px`);
    pinned=enabled&&!phoneViewport.matches&&window.innerHeight>=700;
    story.classList.toggle('scroll-story-enabled',pinned);
    chapters.forEach((chapter,index)=>chapter.hidden=!pinned&&index!==0);
    // If text zoom or fonts make the composition taller than the screen, use flow.
    if(pinned&&frame.scrollHeight>frame.clientHeight+8){pinned=false;story.classList.remove('scroll-story-enabled');chapters.forEach((chapter,index)=>chapter.hidden=index!==0)}
    const canGuide=enabled&&phoneViewport.matches&&journey&&phoneHeight>=540;
    // Manual details are an explicit, scrollable overlay only while guided. Keep the
    // class while measuring an open panel so opening it cannot collapse the runway.
    if(!canGuide)story.classList.remove('wafer-phone-guided');
    phoneGuided=Boolean(canGuide&&stage.offsetHeight<=available+2);
    story.style.setProperty('--wafer-stage-height',`${stage.offsetHeight}px`);
    story.classList.toggle('wafer-phone-guided',phoneGuided);
    story.dataset.journeyMode=pinned?'desktop':phoneGuided?'phone':'flow';
    activeChapter=-1;update(typeof reason==='string'?reason:'layout');
  }
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',configure,{passive:true});
  window.addEventListener('portfolio-motion',configure);
  window.addEventListener('silicon-ready',()=>configure('setup'));
  window.addEventListener('pageshow',()=>configure('setup'));
  reducedMotion.addEventListener?.('change',configure);
  manual?.addEventListener('toggle',()=>configure('layout'));
  const areas=new MutationObserver(()=>{if(document.body.dataset.area==='ic')configure('setup')});
  areas.observe(document.body,{attributes:true,attributeFilter:['data-area']});
  document.fonts?.ready.then(()=>configure()).catch(()=>{});
  configure('setup');
}
