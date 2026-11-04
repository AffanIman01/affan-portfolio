(async()=>{
const motion=()=>window.portfolioMotionEnabled===false||matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
const nav=document.querySelector('.island-nav'),menu=nav.querySelector('.island-menu');
addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>80),{passive:true});
menu.onclick=()=>{const open=nav.classList.toggle('menu-open');menu.setAttribute('aria-expanded',String(open));menu.textContent=open?'×':'☰';menu.setAttribute('aria-label',open?'Close navigation':'Open navigation')};
nav.querySelectorAll('.island-brand,.island-contact').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');menu.textContent='☰'}));
const hashNames={ic:'ic-design',robotics:'robotics',software:'software',credentials:'credentials',about:'about',all:'all-images'};
const areaTargets={ic:'#home',robotics:'#robotics-profile',software:'#software-profile',credentials:'#credentials-profile',about:'#about-profile'};
const descriptions={ic:'IC Design · Layout screenshots, automation examples, and a workstation photo.',robotics:'Robotics · Full project photos and close-ups of the hardware you integrated.',software:'Software & AI · Programming, browser experiences and playable engineering simulations.',credentials:'Credentials · Original badge artwork and complete, readable certificates.',about:'About Me · Your portrait, teamwork, and engineering journey.',all:'All 10 image slots · A complete visual checklist for your portfolio.'};
/* About overview: compact shortcuts use the same section router as the main navigation. */
function prepareAboutPortfolio(){
  const about=document.querySelector('#about-profile');
  if(!about)return;
  const heading=about.querySelector('.profile-section-heading h2');
  if(heading)heading.textContent='My Portfolio';
  const education=[...about.querySelectorAll('.profile-subheading')].find(item=>item.querySelector('.section-eyebrow')?.textContent.trim().toUpperCase()==='EDUCATION');
  if(!education||about.querySelector('#about-portfolio-nav'))return;
  const shortcuts=document.createElement('nav');
  shortcuts.id='about-portfolio-nav';shortcuts.className='about-portfolio-nav';
  shortcuts.setAttribute('aria-label','Explore my portfolio');
  [['ic','IC Design'],['robotics','Robotics'],['software','Software']].forEach(([area,label])=>{
    const link=document.createElement('a');link.href='#'+hashNames[area];link.dataset.filter=area;
    link.setAttribute('aria-controls',areaTargets[area].slice(1));
    const icon=document.querySelector('.mobile-tabbar a[data-filter="'+area+'"] svg');
    if(icon){const copy=icon.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.setAttribute('focusable','false');link.append(copy)}
    const name=document.createElement('span');name.className='portfolio-shortcut-label';name.textContent=label;
    const arrow=document.createElement('span');arrow.className='portfolio-shortcut-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='→';
    link.append(name,arrow);shortcuts.append(link);
  });
  if(!document.getElementById('about-portfolio-navigation-styles')){
    const style=document.createElement('style');style.id='about-portfolio-navigation-styles';
    style.textContent=`
#about-profile .about-portfolio-nav{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;width:100%;max-width:720px;margin:30px 0 12px;padding:0;box-sizing:border-box}
#about-profile .about-portfolio-nav a{--shortcut-accent:#aebfea;display:flex;align-items:center;justify-content:center;gap:10px;min-width:0;min-height:52px;padding:12px 18px;border:1px solid #3b4e5c;border-radius:12px;background:#142330;color:#e2eaf2;font:inherit;font-size:14px;font-weight:500;line-height:1.35;text-decoration:none;box-sizing:border-box;transition:background .18s,border-color .18s}
#about-profile .about-portfolio-nav a[data-filter=ic]{--shortcut-accent:#ebc34f}
#about-profile .about-portfolio-nav a[data-filter=robotics]{--shortcut-accent:#a5ddd3}
#about-profile .about-portfolio-nav svg{width:20px;height:20px;flex:0 0 20px;color:var(--shortcut-accent)}
#about-profile .about-portfolio-nav .portfolio-shortcut-label{white-space:nowrap}
#about-profile .about-portfolio-nav .portfolio-shortcut-arrow{margin-left:auto;color:var(--shortcut-accent);font-size:18px}
#about-profile .about-portfolio-nav a:hover{background:#1c3040;border-color:var(--shortcut-accent)}
#about-profile .about-portfolio-nav a:focus-visible{outline:2px solid var(--shortcut-accent);outline-offset:4px}
@media(max-width:600px){#about-profile .about-portfolio-nav{gap:8px;margin-top:24px}#about-profile .about-portfolio-nav a{min-height:48px;padding:10px 8px;font-size:13px;gap:7px}#about-profile .about-portfolio-nav .portfolio-shortcut-arrow{display:none}}
@media(max-width:420px){#about-profile .about-portfolio-nav svg{display:none}#about-profile .about-portfolio-nav a{font-size:12px}}
@media(prefers-reduced-motion:reduce){#about-profile .about-portfolio-nav a{transition:none}}
html[data-portfolio-motion=off] #about-profile .about-portfolio-nav a{transition:none}
`;
    document.head.append(style);
  }
  education.before(shortcuts);
}
prepareAboutPortfolio();
const imageGuide=document.querySelector('#portfolio-image-guidance');
function closeMenu(){nav.classList.remove('menu-open');menu.setAttribute('aria-expanded','false');menu.textContent='☰';menu.setAttribute('aria-label','Open navigation')}
function filterPhotos(category){
  document.querySelectorAll('.photo-card').forEach(card=>card.hidden=category!=='all'&&card.dataset.category!==category);
  document.querySelectorAll('button[data-filter]').forEach(button=>{const selected=button.dataset.filter===category;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected))});
  document.querySelector('.photo-filter-description').textContent=descriptions[category];
}
function showArea(category,scroll=false,update=true,jump=null){
  const area=category==='all'?'ic':category;
  document.body.dataset.area=area;
  document.querySelectorAll('[data-area-content]').forEach(section=>section.hidden=!section.dataset.areaContent.split(' ').includes(area));
  document.querySelector('#ic-gallery').hidden=area!=='ic';
  document.querySelectorAll('.island-nav a[data-filter], .mobile-tabbar a[data-filter]').forEach(link=>{const selected=link.dataset.filter===area;link.classList.toggle('active',selected);if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});
  filterPhotos(category);
  if(update)history.replaceState(null,'','#'+hashNames[category]);
  const target=jump||(category==='all'?'#image-guide':areaTargets[area]);
  if(target==='#image-guide')imageGuide.open=true;
  if(scroll)document.querySelector(target).scrollIntoView({behavior:!jump&&matchMedia('(max-width: 760px)').matches?'instant':motion()});
  closeMenu();
}
document.querySelectorAll('[data-filter]').forEach(control=>control.addEventListener('click',event=>{
  if(control.tagName==='A'&&(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey))return;
  event.preventDefault();
  if(control.tagName==='BUTTON')filterPhotos(control.dataset.filter);
  else{
    showArea(control.dataset.filter,true,true,control.dataset.jump);
    if(control.closest('.about-portfolio-nav')){
      const section=document.querySelector(areaTargets[control.dataset.filter]);
      const destination=section?.querySelector('h2,h3')||section;
      if(destination){
        if(!destination.hasAttribute('tabindex')){destination.setAttribute('tabindex','-1');destination.addEventListener('blur',()=>destination.removeAttribute('tabindex'),{once:true})}
        destination.focus({preventScroll:true});
      }
    }
  }
}));
nav.querySelector('.island-brand').addEventListener('click',event=>{event.preventDefault();showArea('ic',true)});
document.querySelectorAll('a[href="#image-guide"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();imageGuide.open=true;document.querySelector('#image-guide').scrollIntoView({behavior:motion()});history.replaceState(null,'','#image-guide')}));
function readHash(){
  const category=Object.keys(hashNames).find(key=>'#'+hashNames[key]===location.hash);
  if(category)showArea(category,true,false);
  else if(location.hash==='#home')showArea('ic',true,false);
  else if(location.hash==='#image-guide'){imageGuide.open=true;document.querySelector('#image-guide').scrollIntoView({behavior:motion()})}
}
const initial=Object.keys(hashNames).find(key=>'#'+hashNames[key]===location.hash)||'ic';
showArea(initial,false,false);
if(location.hash)requestAnimationFrame(readHash);
addEventListener('hashchange',readHash);
let slots=[];try{const response=await fetch('photo-slots.json');if(!response.ok)throw new Error('Could not load guidance');slots=await response.json()}catch(e){console.error(e)}
const dialog=document.createElement('dialog');dialog.className='sample-dialog';dialog.setAttribute('aria-labelledby','sample-dialog-title');dialog.innerHTML='<button class="sample-dialog-close" aria-label="Close image guide">×</button><div class="sample-dialog-content"></div>';document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.onclick=e=>{if(e.target===dialog)dialog.close()};
function openInfo(item){const body=dialog.querySelector('.sample-dialog-content');body.replaceChildren();if(item.id==='automation'){const comparison=document.createElement('div');comparison.className='before-after';[['Before','automation-before.svg'],['After','automation.svg']].forEach(([label,file])=>{const col=document.createElement('div');const caption=document.createElement('span');caption.textContent=label;const img=document.createElement('img');img.src='samples/'+file;img.alt=label+' — illustrative automation sample';col.append(caption,img);comparison.append(col)});body.append(comparison)}else if(item.asset){const image=document.createElement('img');image.src='samples/'+item.asset;image.alt=item.title+' — sample image';body.append(image)}const text=document.createElement('div');text.className='sample-dialog-text';const ratio=document.createElement('span');ratio.className='ratio';ratio.textContent=item.ratio?'RECOMMENDED SHAPE · '+item.ratio:'PORTFOLIO CONTACT';const h=document.createElement('h2');h.id='sample-dialog-title';h.textContent=item.title;const p=document.createElement('p');p.textContent=item.guide;const small=document.createElement('small');small.textContent=item.tip;text.append(ratio,h,p,small);body.append(text);dialog.showModal()}
document.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{const item=slots.find(s=>s.id===b.dataset.photo);if(item)openInfo(item)});
const track=document.querySelector('.values-track'),panels=[...track.querySelectorAll('.value-panel')];let active=0;
function select(index,scroll=false,focus=false){active=(index+panels.length)%panels.length;panels.forEach((p,i)=>{p.classList.toggle('is-active',i===active);p.setAttribute('aria-expanded',String(i===active))});document.querySelector('.values-count').textContent=panels[active].querySelector('.value-name').textContent;document.querySelector('.values-progress span').style.transform=`translateX(${active*100}%)`;if(scroll)track.scrollTo({left:panels[active].offsetLeft-track.offsetLeft-12,behavior:motion()});if(focus)panels[active].focus({preventScroll:true})}
panels.forEach((p,i)=>{p.onpointerenter=e=>{if(e.pointerType==='mouse')select(i)};p.onclick=()=>select(i,true);p.onfocus=()=>select(i);p.onkeydown=e=>{let next;if(e.key==='ArrowRight')next=active+1;if(e.key==='ArrowLeft')next=active-1;if(e.key==='Home')next=0;if(e.key==='End')next=5;if(next!==undefined){e.preventDefault();select(next,true,true)}}});document.querySelector('.values-prev').onclick=()=>select(active-1,true);document.querySelector('.values-next').onclick=()=>select(active+1,true);

const valuesPhone=matchMedia('(max-width: 760px)');let valuesScrollTimer=null;
track.addEventListener('scroll',()=>{
  clearTimeout(valuesScrollTimer);
  if(!valuesPhone.matches)return;
  valuesScrollTimer=setTimeout(()=>{
    const focused=document.activeElement;
    if(track.contains(focused)&&focused.matches(':focus-visible'))return;
    const midpoint=track.getBoundingClientRect().left+track.clientWidth/2;
    const nearest=panels.reduce((best,panel,index)=>{const r=panel.getBoundingClientRect(),distance=Math.abs(r.left+r.width/2-midpoint);return !best||distance<best.distance?{index,distance}:best},null);
    if(nearest&&nearest.index!==active)select(nearest.index);
  },150);
},{passive:true});
})();
