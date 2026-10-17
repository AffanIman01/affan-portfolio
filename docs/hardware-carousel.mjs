import {hardware,categories,filterHardware,wrapIndex,relativePosition} from './hardware-catalog.mjs';

const root=document.querySelector('#hardware-experience');
if(root) initHardwareCarousel();
function initHardwareCarousel(){
  const stage=root.querySelector('.hardware-stage'),filters=root.querySelector('.hardware-filters'),jump=root.querySelector('select'),play=root.querySelector('.hardware-play');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const cards=new Map(),dialog=root.querySelector('.hardware-photo-dialog');
  let collection=hardware,selected=0,paused = window.PortfolioAutoplay.paused('hardware'),visible=false,hovering=false,timer=0,drag=null,suppressClickUntil=0;
  const motion=()=>!reduced.matches&&window.portfolioMotionEnabled!==false;
  const active=()=>window.PortfolioAutoplay.canRun(root)&&visible&&!document.hidden&&!root.closest('[hidden]');
  const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};

  hardware.forEach(item=>{
    const button=el('button','hardware-card');button.type='button';button.dataset.hardwareId=item.id;
    button.setAttribute('aria-label',item.brand+' '+item.name+' — '+item.role);button.tabIndex=-1;
    const photo=el('span','hardware-photo'),image=el('img','hardware-product-image');
    image.alt=item.brand+' '+item.name+' — '+(item.imageKind==='personal'?'original photograph':'product reference photo');image.decoding='async';image.loading='lazy';image.dataset.photoId=item.id;
    photo.append(image);
    const copy=el('span','hardware-card-copy');copy.append(el('span','hardware-card-brand',item.brand),el('span','hardware-card-name',item.name),el('span','hardware-card-type',item.type));
    button.append(photo,copy);
    button.onclick=()=>{if(performance.now()<suppressClickUntil)return;if(item.id===collection[selected].id)openPhoto();else select(collection.indexOf(item),true);};
    image.addEventListener('error',()=>{photo.classList.add('photo-unavailable');image.hidden=true;photo.append(el('span','hardware-image-error','Photo unavailable'));});
    stage.append(button);cards.set(item.id,{button,image});
  });
  categories.forEach(([id,label])=>{
    const button=el('button','',label);button.type='button';button.dataset.hardwareFilter=id;button.setAttribute('aria-pressed',String(id==='all'));
    button.onclick=()=>{
      collection=filterHardware(id);selected=0;
      filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      updateJump();select(0,true);
    };
    filters.append(button);
  });
  function updateJump(){
    jump.replaceChildren(...collection.map(item=>{const option=el('option','',item.brand+' · '+item.name);option.value=item.id;return option;}));
    root.querySelector('.hardware-collection').textContent=collection.length+' hardware entries';
  }
  function select(index,manual=false){
    selected=wrapIndex(index,collection.length);
    if(manual)paused=true;
    const item=collection[selected];root.style.setProperty('--hw-accent',item.color);
    hardware.forEach(entry=>{
      const {button,image}=cards.get(entry.id),i=collection.indexOf(entry),offset=i<0?99:relativePosition(i,selected,collection.length),distance=Math.abs(offset);
      button.hidden=distance>2;button.tabIndex=offset===0?0:-1;
      button.setAttribute('aria-pressed',String(offset===0));button.classList.toggle('is-active',offset===0);
      button.setAttribute('aria-label',(offset===0?'Enlarge photo of ':'Show ')+entry.brand+' '+entry.name+' — '+entry.role);
      button.style.setProperty('--offset',offset);button.style.setProperty('--depth',(-distance*105)+'px');button.style.setProperty('--angle',(-Math.sign(offset)*27)+'deg');
      button.style.setProperty('--opacity',distance===0?'1':distance===1?'.65':'.22');button.style.setProperty('--order',5-distance);
      if(distance<=2&&!image.getAttribute('src'))image.setAttribute('src',entry.image);
    });
    jump.value=item.id;
    root.querySelector('.hardware-detail-brand').textContent=item.brand+' / '+item.type;
    root.querySelector('.hardware-details h4').textContent=item.name;
    root.querySelector('.hardware-role').textContent=item.role;
    root.querySelector('.hardware-description').textContent=item.description;
    root.querySelector('.hardware-tags').replaceChildren(...item.tags.map(tag=>el('span','',tag)));
    root.querySelector('.hardware-image-note').textContent=item.imageNote;
    const credit=root.querySelector('.hardware-photo-credit');credit.href=item.imageSource;credit.textContent=(item.imageKind==='personal'?'Original photo: ':'Photo: ')+item.imageCredit+' ↗';
    root.querySelector('.hardware-position').textContent=String(selected+1).padStart(2,'0')+' / '+collection.length;
    root.querySelector('.hardware-progress span').style.width=((selected+1)/collection.length*100)+'%';
    if(manual)root.querySelector('.hardware-announcement').textContent=item.brand+' '+item.name+'. '+item.role+'. '+(selected+1)+' of '+collection.length+'.';
    sync();
  }
  function sync(){
    window.PortfolioAutoplay.remember('hardware', paused);
    clearTimeout(timer);
    const enabled=motion(),focused=root.contains(document.activeElement)&&document.activeElement!==play;
    play.disabled=!enabled;play.textContent=!enabled?'−':paused?'▷':'Ⅱ';
    play.setAttribute('aria-label',!enabled?'Automatic hardware switching disabled while motion is off':paused?'Play automatic hardware carousel':'Pause automatic hardware carousel');
    play.setAttribute('aria-pressed',String(!paused&&enabled));
    const blocked=hovering||focused||dialog.open;
    root.querySelector('.hardware-motion-status').textContent=!enabled?'Motion off':paused?'Auto switching paused':blocked?'Paused while browsing':'Auto switching · 3 s';
    if(active()&&enabled&&!paused&&!blocked&&collection.length>1){
      timer=setTimeout(()=>select(selected+1),3000);
    }
  }
  function openPhoto(){
    const item=collection[selected],image=dialog.querySelector('img');image.src=item.image;image.alt=item.brand+' '+item.name+' — '+(item.imageKind==='personal'?'original photograph':'product reference');
    dialog.querySelector('h4').textContent=item.brand+' · '+item.name;
    dialog.querySelector('p').textContent=item.imageNote;
    const credit=dialog.querySelector('a');credit.href=item.imageSource;credit.textContent=(item.imageKind==='personal'?'Original photo: ':'Photo: ')+item.imageCredit+' ↗';
    dialog.showModal();sync();
  }
  jump.onchange=()=>select(collection.findIndex(item=>item.id===jump.value),true);
  root.querySelector('[data-hardware-prev]').onclick=()=>select(selected-1,true);
  root.querySelector('[data-hardware-next]').onclick=()=>select(selected+1,true);
  play.onclick=()=>{paused=!paused;sync();};
  root.querySelector('.hardware-expand').onclick=openPhoto;
  dialog.querySelector('button').onclick=()=>dialog.close();
  dialog.addEventListener('close',sync);
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  stage.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?collection.length-1:selected+(event.key==='ArrowRight'?1:-1);
    select(index,true);cards.get(collection[selected].id).button.focus({preventScroll:true});
  });
  stage.addEventListener('pointerdown',event=>{
    if(!event.isPrimary){drag=null;return;}
    if(event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY};
  });
  stage.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(Math.abs(dy)>20&&Math.abs(dy)>Math.abs(dx)){drag=null;return;}
    if(Math.abs(dx)>15&&Math.abs(dx)>Math.abs(dy))stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointerup',event=>{
    if(!drag||event.pointerId!==drag.id)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;drag=null;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){suppressClickUntil=performance.now()+500;select(selected+(dx<0?1:-1),true);}
  });
  stage.addEventListener('pointercancel',()=>{drag=null;});
  stage.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovering=true;sync();}});
  stage.addEventListener('pointerleave',()=>{hovering=false;drag=null;sync();});
  root.addEventListener('focusin',sync);root.addEventListener('focusout',()=>queueMicrotask(sync));
  window.PortfolioAutoplay.watch(sync);
  window.addEventListener('portfolio-motion',sync);reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.12;sync();},{threshold:.12});observer.observe(root);
  const section=root.closest('section');if(section)new MutationObserver(sync).observe(section,{attributes:true,attributeFilter:['hidden']});
  updateJump();select(0);
}

