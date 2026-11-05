/* Software coverflow. The existing filename preserves the deployed page's script hook.
   Progressive enhancement: read the published content before replacing its layout. */
(() => {
  'use strict';
  function init() {
    const root = document.getElementById('software-profile');
    if (!root || root.dataset.softwareShowcase === 'ready') return;
    const source = [...root.querySelectorAll('.software-skill-card')];
    const oldDemos = [...root.querySelectorAll('#robocon-carousel .software-project')];
    if (source.length < 6) return; // Keep the original, readable layout if its data changes.
    const make = (tag, cls = '', text = '') => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (text) node.textContent = text;
      return node;
    };
    const safeURL = value => {
      try { const url = new URL(value || '', document.baseURI); return /^https?:$/.test(url.protocol) && value ? url.href : ''; }
      catch { return ''; }
    };
    const text = (node, selector) => node?.querySelector(selector)?.textContent.trim() || '';
    const tags = node => [...node.querySelectorAll('.software-tech-tags span')].map(el => el.textContent.trim());
    const libraries = [...source[1].querySelectorAll('.software-library-list li')].map(li => ({
      name: text(li, 'span'), image: safeURL(li.querySelector('img')?.getAttribute('src'))
    }));
    const demos = oldDemos.map(card => ({
      title: text(card, 'h3'), year: text(card, '.robocon-theme-year'),
      description: text(card, '.software-project-copy > p'),
      image: safeURL(card.querySelector('img')?.getAttribute('src')),
      play: safeURL(card.querySelector('.software-play')?.getAttribute('href')),
      code: safeURL(card.querySelector('.software-project-actions a:not(.software-play)')?.getAttribute('href'))
    }));
    const demoNote = text(root, '.software-demo-note');
    const entries = [
      {id:'python', category:'python', label:'PYTHON ECOSYSTEM', title:'Python tools', subtitle:'Interfaces, analysis & robotics', status:'Library & workflow examples', description:text(source[1], ':scope > p'), tags:libraries.map(l => l.name), kind:'libraries', note:'Example toolkit · Logos belong to their respective owners.'},
      {id:'programming', category:'programming', label:'PROGRAMMING', title:'Programming stack', subtitle:'A multi-language engineering toolkit', status:'Hands-on programming experience', description:text(source[0], ':scope > p'), tags:tags(source[0]), kind:'code', note:'Programming languages, markup and development environments.'},
      {id:'apps', category:'apps', label:'APP DEVELOPMENT', title:'App interfaces', subtitle:'Desktop apps & web dashboards', status:'Currently building', description:text(source[2], ':scope > p'), tags:['Desktop apps','Web interfaces','Operator dashboards'], kind:'app', note:'Interface concept · Application development in progress.'},
      {id:'reverse', category:'reverse', label:'SOFTWARE ANALYSIS', title:'Reverse engineering', subtitle:'Application & protocol investigation', status:'Currently building', description:text(source[3], ':scope > p'), tags:['Application behaviour','API inspection','Protocol analysis'], kind:'protocol', note:'Illustrative protocol flow · Robotics interoperability research.'},
      {id:'web', category:'web', label:'WEB & AI DEVELOPMENT', title:'Web systems', subtitle:'Frontend, backend & AI-assisted builds', status:'Website design & development', description:text(source[4], ':scope > p'), tags:tags(source[4]), kind:'web', note:'Interface concept · AI-assisted website development.'},
      {id:'security', category:'security', label:'CYBERSECURITY', title:'Security & networks', subtitle:'Biometrics & network observation', status:'Foundational knowledge', description:text(source[5], ':scope > p'), tags:tags(source[5]), kind:'security', note:'Illustrative network view · Traffic inspection and troubleshooting.'},
      {"id":"matlab","category":"engineering","label":"ENGINEERING SOFTWARE","title":"MATLAB","subtitle":"Numerical computing & engineering analysis","status":"Software skill","description":"Using MATLAB for engineering calculations, numerical analysis and visualising data.","tags":["MATLAB","Numerical computing","Data visualisation"],"kind":"engineering-tool","toolLogo":"matlab/matlab-original.svg","note":"Engineering software · Numerical analysis."},
      {"id":"labview","category":"engineering","label":"ENGINEERING SOFTWARE","title":"LabVIEW","subtitle":"Graphical programming & instrumentation","status":"Software skill","description":"Working with LabVIEW for graphical programming and engineering instrumentation workflows.","tags":["LabVIEW","Graphical programming","Instrumentation"],"kind":"engineering-tool","toolLogo":"labview/labview-original.svg","note":"Engineering software · Graphical programming."},
      {"id":"plc","category":"engineering","label":"AUTOMATION","title":"PLC Programming","subtitle":"Control logic & industrial automation","status":"Software skill","description":"Programming PLC control logic for automation applications.","tags":["PLC programming","Control logic","Automation"],"kind":"engineering-tool","badge":"PLC","note":"Automation skill · Control logic."},
      {"id":"solidworks","category":"engineering","label":"MECHANICAL DESIGN","title":"SOLIDWORKS","subtitle":"3D CAD & mechanical design","status":"Software skill","description":"Using SOLIDWORKS for 3D mechanical modelling and engineering design.","tags":["SOLIDWORKS","3D CAD","Mechanical design"],"kind":"engineering-tool","badge":"3D CAD","note":"Engineering software · Mechanical modelling."},
      {id:'gazebo', category:'simulation-tools', label:'SIMULATION TOOLS', title:'Gazebo', subtitle:'Robotics simulation & ROS workflows', status:'Robotics simulation', description:'Exploring robot models, sensors and control behaviour in simulated environments as part of ROS and autonomous robotics workflows.', tags:['Gazebo','ROS / ROS 2','Robot models','Sensor simulation'], kind:'simulation-tool', toolLogo:'gazebo/gazebo-original.svg', note:'Simulation tool · Robotics development and learning.'},
      {id:'unity', category:'simulation-tools', label:'SIMULATION TOOLS', title:'Unity', subtitle:'Interactive 3D environments & simulation', status:'Simulation & exploration', description:'Exploring interactive 3D environments and simulation concepts with Unity, connecting visual scenes, physics and user interaction.', tags:['Unity','3D environments','Physics','Interactive simulation'], kind:'simulation-tool', toolLogo:'unity/unity-original.svg', note:'Simulation tool · Interactive 3D exploration.'},
      {id:'simulators', category:'simulators', label:'INTERACTIVE SIMULATION', title:'Robocon simulators', subtitle:`${demos.length} playable browser demos`, status:'Browser-based learning projects', description:'Interactive robot-competition simulations for exploring mechanisms, control and game behaviour. Choose a demo below; each opens separately.', tags:['Browser demos','Robot control','3D simulation'], kind:'simulation', note:demoNote || 'Independent learning simulators; WebGL is required.'},
      {id:'controls', category:'apps', label:'ROBOTICS SOFTWARE', title:'Control interfaces', subtitle:'Monitoring, telemetry & remote operation', status:'Currently building', description:'Developing software interfaces for robotics monitoring and remote operation, connecting operator controls with system feedback and integration workflows.', tags:['Robotics integration','Remote operation','Telemetry UI'], kind:'control', note:'Interface concept · Robotics software development in progress.'}
    ];
    const categories = [['all','All software'],['programming','Programming'],['python','Python ecosystem'],['apps','App development'],['reverse','Reverse engineering'],['web','Web & AI'],['security','Cybersecurity'],['engineering','Engineering & automation'],['simulation-tools','Simulation tools'],['simulators','Simulators / Robocon']];
    const icon = type => {
      const paths = {
        code:'M8 7 3 12l5 5m8-10 5 5-5 5M14 4l-4 16',
        app:'M3 5h18v14H3zM3 9h18M7 7h.01M10 7h.01M7 12h4v4H7zM14 12h4m-4 4h4',
        protocol:'M3 4h6v6H3zM15 14h6v6h-6zM9 7h8v7M15 17H7v-7m8-5 2 2 2-2m-14 12 2-2 2 2',
        web:'M3 4h18v16H3zM3 8h18M7 6h.01M10 6h.01M8 11l-3 3 3 3m8-6 3 3-3 3m-3-7-2 8',
        security:'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6zM9 12l2 2 4-4',
        control:'M4 4h16v12H4zM8 21h8m-4-5v5M7 12l3-3 3 3 4-5',
        simulation:'M7 8h10l4 8-2 3-5-3h-4l-5 3-2-3zM7 11v4m-2-2h4m7-1h.01m2 2h.01'
      };
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 24 24'); svg.setAttribute('fill','none');
      svg.setAttribute('stroke','currentColor'); svg.setAttribute('stroke-width','1.3');
      svg.setAttribute('stroke-linecap','round'); svg.setAttribute('stroke-linejoin','round');
      svg.setAttribute('aria-hidden','true');
      const path = document.createElementNS(svg.namespaceURI,'path'); path.setAttribute('d',paths[type] || paths.code); svg.append(path);
      return svg;
    };
    function libraryTiles() {
      const grid = make('span','sw-library-tiles');
      libraries.forEach(library => {
        const tile = make('span','sw-library-tile');
        const fallback = make('span','sw-logo-fallback',library.name === 'PyQt6' ? 'Qt' : library.name.slice(0,2));
        const logo = make('span','sw-logo'); logo.append(fallback);
        if (library.image) {
          const img = make('img'); img.alt = ''; img.width = 27; img.height = 27; img.loading = 'lazy'; img.decoding = 'async';
          img.addEventListener('load', () => { fallback.hidden = true; });
          img.addEventListener('error', () => { img.hidden = true; fallback.hidden = false; });
          img.src = library.image; logo.append(img);
        }
        tile.append(logo,make('span','',library.name)); grid.append(tile);
      });
      return grid;
    }
    function visual(entry) {
      const art = make('span',`sw-art sw-art-${entry.kind}`); art.setAttribute('aria-hidden','true');
      art.append(make('span','sw-art-caption',entry.kind === 'libraries' ? 'PYTHON / TOOLKIT' : entry.kind === 'simulation' ? 'PLAYABLE DEMOS' : 'SOFTWARE / EXPLORATION'));
      if (entry.kind === 'engineering-tool') {
        if(entry.toolLogo){
          const logo=make('img','sw-simulation-tool-logo');logo.src='https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/'+entry.toolLogo;logo.alt='';logo.loading='lazy';logo.decoding='async';
          logo.addEventListener('error',()=>{logo.replaceWith(make('span','sw-engineering-badge',entry.title));});art.append(logo);
        }else{art.append(make('span','sw-engineering-badge',entry.badge));}
        art.append(make('span','sw-art-label',entry.label));return art;
      }
      if (entry.kind === 'simulation-tool') {
        const logo=make('img','sw-simulation-tool-logo');logo.src='https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/'+entry.toolLogo;
        logo.alt='';logo.loading='lazy';logo.decoding='async';
        if(entry.id==='unity')logo.classList.add('sw-unity-logo');
        logo.addEventListener('error',()=>{logo.hidden=true;});
        art.append(logo,make('span','sw-art-label',entry.id==='gazebo' ? 'ROBOTICS / ROS' : 'INTERACTIVE / 3D'));
        return art;
      }
      if (entry.kind === 'libraries') { art.append(libraryTiles()); return art; }
      const emblem = make('span','sw-emblem'); emblem.append(icon(entry.kind)); art.append(emblem);
      if (entry.kind === 'code') {
        const lines = make('span','sw-code-lines');
        ['Python  ·  C++  ·  Java','Node.js  ·  JavaScript','HTML / CSS  ·  Assembly','LabVIEW'].forEach(line => lines.append(make('span','',line))); art.append(lines);
      } else if (entry.kind === 'protocol') {
        const flow = make('span','sw-flow'); ['APP','↔','API','↔','ROBOT'].forEach(s => flow.append(make('span','',s))); art.append(flow);
      } else if (entry.kind === 'security') {
        art.append(make('span','sw-art-label','OBSERVE · ANALYSE · UNDERSTAND'));
        const bars = make('span','sw-packets'); [28,46,20,59,38,67,43,30,55,24,40,32].forEach(h => {const bar=make('i');bar.style.height=`${h}%`;bars.append(bar);}); art.append(bars);
      } else if (entry.kind === 'simulation') {
        art.append(make('span','sw-art-label','ROBOT COMPETITION / SIMULATION'));
        const years = make('span','sw-flow'); demos.forEach(d => years.append(make('span','',d.year.replace('ROBOCON ','')))); art.append(years);
      } else {
        const screen = make('span','sw-mini-screen');
        screen.append(make('span','sw-screen-dots','• • •'),make('span','sw-screen-title',entry.kind === 'control' ? 'ROBOT / OPERATOR UI' : entry.kind === 'web' ? 'FRONTEND ↔ BACKEND' : 'APPLICATION / WORKSPACE'));
        const blocks = make('span','sw-screen-blocks'); for (let i=0;i<3;i++) blocks.append(make('i')); screen.append(blocks); art.append(screen);
      }
      return art;
    }
    function link(label, url, cls) {
      const a = make('a',cls,label); a.href=url; a.target='_blank'; a.rel='noopener noreferrer'; return a;
    }
    function detailContent(entry, container, expanded = false) {
      const heading = make('div','sw-detail-heading');
      heading.append(make('span','sw-detail-label',entry.label),make(expanded ? 'h3' : 'h4','',entry.title),make('span','sw-role',entry.status));
      const copy = make('div','sw-detail-copy'); copy.append(make('p','sw-description',entry.description));
      const list = make('div','sw-tags'); entry.tags.forEach(t => list.append(make('span','',t))); copy.append(list);
      if (entry.kind === 'libraries' && expanded) copy.append(libraryTiles());
      if (entry.kind === 'simulation') {
        const launches = make('div','sw-demo-links');
        demos.forEach(d => {
          const row = make('div','sw-demo-link');
          const name=make('div'); name.append(make('span','sw-demo-year',d.year),make('strong','',d.title)); row.append(name);
          const actions=make('div','sw-demo-actions');
          if(d.play) { const a=link('Play ↗',d.play,'sw-demo-play'); a.setAttribute('aria-label',`Play ${d.year}: ${d.title}`); actions.append(a); }
          if(d.code) { const a=link('Code ↗',d.code,''); a.setAttribute('aria-label',`View ${d.title} source on GitHub`); actions.append(a); }
          row.append(actions); launches.append(row);
        }); copy.append(launches);
      }
      container.replaceChildren(heading,copy);
    }
    const header=make('div','profile-section-heading sw-heading');
    const title=make('div'); const h2=make('h2','',text(root,'#software-heading') || 'Software I build, explore & learn.'); h2.id='software-heading';
    title.append(make('span','section-eyebrow','SOFTWARE & AI'),h2);
    header.append(title,make('p','','Application development, software exploration, network analysis and AI-assisted engineering workflows connected to real systems.'));
    const workNote=make('div','sw-work-note'); workNote.setAttribute('role','note');
    workNote.append(make('strong','','CURRENTLY BUILDING'),make('span','','Apps, reverse engineering and robotics controls. New demos and case studies are in progress.'));
    const filters=make('div','sw-filters'); filters.setAttribute('role','group'); filters.setAttribute('aria-label','Filter software by category');
    const exhibit=make('div','sw-exhibit'); exhibit.setAttribute('role','region'); exhibit.setAttribute('aria-roledescription','carousel'); exhibit.setAttribute('aria-label','Software experience showcase');
    const top=make('div','sw-exhibit-top'), count=make('span','sw-collection');
    const jumpLabel=make('label','sw-jump'), jump=make('select'); jump.setAttribute('aria-label','Jump to software');
    jumpLabel.append(make('span','','Jump to software'),jump); top.append(count,jumpLabel);
    const stage=make('div','sw-stage'); stage.tabIndex=0; stage.setAttribute('role','group'); stage.setAttribute('aria-label','Software cards. Swipe or use left and right arrow keys to browse.');
    const controls=make('div','sw-controls');
    function button(label, value, cls='') {const b=make('button',cls,value);b.type='button';b.setAttribute('aria-label',label);return b;}
    const prev=button('Previous software entry','←'), play=button('Start automatic software showcase','▷','sw-play'), next=button('Next software entry','→');
    const counter=make('span','sw-position'), progress=make('span','sw-progress'), fill=make('span'); progress.setAttribute('aria-hidden','true');progress.append(fill);
    const expand=button('Expand selected software details','⤢','sw-expand');expand.setAttribute('aria-haspopup','dialog');
    controls.append(prev,play,next,counter,progress,expand);
    const detail=make('div','sw-details'); detail.id='software-selected-detail';
    exhibit.append(top,stage,controls,detail);
    const attribution=make('div','sw-attribution');
    const itemNote=make('p'); attribution.append(itemNote,make('p','','Illustrative previews · Project demos open separately'));
    const footer=make('div','sw-footer'), motionStatus=make('span');
    const hint=make('p','','Swipe or use ← → to browse · '); hint.append(motionStatus); footer.append(hint,make('p','','Tools, practical experience & active development'));
    const announce=make('p','sw-sr-only');announce.setAttribute('role','status');announce.setAttribute('aria-live','polite');announce.setAttribute('aria-atomic','true');
    const dialog=make('dialog','sw-dialog');dialog.setAttribute('aria-labelledby','software-dialog-title');
    const dialogHeader=make('header'), dialogTitle=make('h2');dialogTitle.id='software-dialog-title';
    const close=button('Close software details','×');dialogHeader.append(dialogTitle,close);
    const dialogBody=make('div','sw-dialog-body');dialog.append(dialogHeader,dialogBody);
    let opener=null;
    const cards=new Map();
    entries.forEach(entry => {
      const card=button(`Select ${entry.title}`,'','sw-card');card.dataset.softwareId=entry.id;card.setAttribute('aria-controls',detail.id);
      const copy=make('span','sw-card-copy');copy.append(make('span','sw-card-label',entry.label),make('strong','sw-card-title',entry.title),make('span','sw-card-subtitle',entry.subtitle));
      card.append(visual(entry),copy);card.onclick=() => {if(Date.now()<suppressClickUntil)return;select(entry.id,true);};cards.set(entry.id,card);stage.append(card);
    });
    // Match the Robotics page: showcase, tool logos, then project work.
    const brands=make('section','robotics-brand-strip sw-brand-strip');
    brands.setAttribute('aria-labelledby','software-brand-heading');
    const brandHeading=make('h3','','LANGUAGES, LIBRARIES & TOOLS I EXPLORE');brandHeading.id='software-brand-heading';
    const brandGrid=make('div','robotics-brand-grid');
    const logoBase='https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/';
    const brandItems=[
      ['Python','python/python-original.svg','Programming & automation'],
      ['C++','cplusplus/cplusplus-original.svg','Embedded programming'],
      ['JavaScript','javascript/javascript-original.svg','Interactive web apps'],
      ['Node.js','nodejs/nodejs-original.svg','Backend development'],
      ['PyQt6','qt/qt-original.svg','Desktop interfaces'],
      ['OpenCV','opencv/opencv-original.svg','Computer vision'],
      ['NumPy','numpy/numpy-original.svg','Scientific computing'],
      ['Supabase','supabase/supabase-original.svg','Web app backend'],
      ['Gazebo','gazebo/gazebo-original.svg','Robotics simulation'],
      ['Unity','unity/unity-original.svg','Interactive 3D simulation'],
      ['MATLAB','matlab/matlab-original.svg','Numerical computing'],
      ['LabVIEW','labview/labview-original.svg','Graphical programming'],
      ['PLC Programming',null,'Control logic & automation'],
      ['SOLIDWORKS',null,'3D CAD & mechanical design']
    ];
    brandItems.forEach(([name,path,caption])=>{
      const figure=make('figure','robotics-brand');
      const art=make('div','robotics-brand-art'), img=make('img');
      if(name==='Unity')img.classList.add('sw-unity-logo');
      if(path)img.src=logoBase+path;img.alt=name;img.loading='lazy';img.decoding='async';
      img.addEventListener('error',()=>{img.hidden=true;});
      if(path){art.append(img);}else{art.append(make('span','sw-tool-wordmark',name==='PLC Programming'?'PLC':'SOLIDWORKS'));}
      figure.append(art,make('strong','sw-brand-name',name),make('figcaption','',caption));brandGrid.append(figure);
    });
    brands.append(brandHeading,brandGrid);
    const works=make('section','sw-works');works.setAttribute('aria-labelledby','software-works-heading');
    const worksHeading=make('div','profile-section-heading');
    const worksTitle=make('div'), worksH2=make('h2','','My Works');worksH2.id='software-works-heading';
    worksTitle.append(make('span','section-eyebrow','PROJECTS & EXPLORATIONS'),worksH2);
    worksHeading.append(worksTitle,make('p','','Playable simulations and ongoing software work for real engineering systems.'));
    const worksGrid=make('div','sw-work-panels');
    const projectFilters=make('div','sw-filters');projectFilters.setAttribute('role','group');projectFilters.setAttribute('aria-label','Filter my software works');
    const projectItems=demos.map(d=>({...d,category:'simulations',label:d.year,preview:d.year.includes('2025')}));
    ['controls','reverse'].forEach(id=>{const e=entries.find(e=>e.id===id);projectItems.push({...e,category:id,label:'CURRENTLY BUILDING'});});
    let activeProject=1, projectCategory='all', previewPaused=false, previewVisible=false, previewLoaded=false;
    const projectPanels=[], projectButtons=[], projectDetails=[];
    const previewVideo=make('video','sw-work-video');previewVideo.muted=true;previewVideo.loop=true;previewVideo.playsInline=true;previewVideo.preload='none';previewVideo.setAttribute('aria-label','Robocon 2025 basketball simulator gameplay');
    const previewMotion=matchMedia('(prefers-reduced-motion: reduce)');
    const galleryControls=make('div','sw-work-controls');
    const galleryStatus=make('span','sw-work-status');galleryStatus.setAttribute('aria-live','polite');
    const videoToggle=button('Pause gameplay preview','Pause preview','sw-preview-toggle');videoToggle.setAttribute('aria-pressed','false');
    const previousProject=button('Previous software project','←'),nextProject=button('Next software project','→');
    function shownProjects(){return projectItems.map((_,i)=>i).filter(i=>projectCategory==='all'||projectItems[i].category===projectCategory);}
    async function updatePreview(){
      const allowed=projectItems[activeProject].preview&&previewVisible&&!previewPaused&&!previewMotion.matches&&!document.hidden&&window.portfolioMotionEnabled!==false;
      if(!allowed)previewVideo.pause();
      if(!previewVisible)return;
      if(!previewLoaded){
        previewLoaded=true;
        try{const response=await fetch('gallery/robocon/robocon-2025-preview.json');if(!response.ok)throw new Error('Preview unavailable');const media=await response.json();previewVideo.poster=media.poster;previewVideo.src=media.video;}
        catch{previewLoaded=false;videoToggle.textContent='Preview unavailable';return;}
      }
      if(projectItems[activeProject].preview&&previewVisible&&!previewPaused&&!previewMotion.matches&&!document.hidden&&window.portfolioMotionEnabled!==false){previewVideo.play().catch(()=>{});}
    }
    function selectProject(i){
      activeProject=i;
      const visible=shownProjects();
      projectPanels.forEach((panel,n)=>{panel.hidden=!visible.includes(n);panel.classList.toggle('is-active',n===i);projectButtons[n].setAttribute('aria-expanded',String(n===i));projectDetails[n].hidden=n!==i;});
      galleryStatus.textContent=String(visible.indexOf(i)+1).padStart(2,'0')+' / '+String(visible.length).padStart(2,'0')+' · '+projectItems[i].title;
      videoToggle.hidden=!projectItems[i].preview;previousProject.disabled=nextProject.disabled=visible.length<2;
      updatePreview();
    }
    function projectLink(label,url){const a=make('a','',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
    projectItems.forEach((project,i)=>{
      const card=make('article','sw-work-panel');
      if(project.image){const img=make('img','sw-work-backdrop');img.src=project.image;img.alt=project.title+' project preview';img.loading='lazy';card.append(img);}
      else{const art=make('div','sw-work-concept');art.append(icon(project.kind),make('span','','WORK IN PROGRESS'));card.append(art);}
      if(project.preview){previewVideo.poster=project.image;card.append(previewVideo);card.append(make('span','sw-work-preview-label','GAMEPLAY PREVIEW'));}
      const heading=make('h3','sw-work-title'),toggle=button('Show '+project.title,'','sw-work-toggle');
      toggle.setAttribute('aria-controls','software-project-'+i);
      toggle.append(make('span','sw-work-category',project.label),make('span','sw-work-name',project.title));heading.append(toggle);
      const detail=make('div','sw-work-detail');detail.id='software-project-'+i;
      detail.append(make('p','',project.description));
      const links=make('div','sw-work-links');
      if(project.play)links.append(projectLink('Play demo ↗',project.play));
      if(project.code)links.append(projectLink('View code ↗',project.code));
      detail.append(links);card.append(heading,detail,make('span','sw-work-number',String(i+1).padStart(2,'0')));
      toggle.onclick=()=>selectProject(i);
      toggle.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const visible=shownProjects();const j=visible[(visible.indexOf(activeProject)+(e.key==='ArrowRight'?1:-1)+visible.length)%visible.length];selectProject(j);projectButtons[j].focus();};
      projectPanels.push(card);projectButtons.push(toggle);projectDetails.push(detail);worksGrid.append(card);
    });
    [['all','All works'],['simulations','Simulations'],['controls','Control interfaces'],['reverse','Reverse engineering']].forEach(([id,label])=>{
      const filter=button(label,label);filter.setAttribute('aria-pressed',String(id==='all'));
      filter.onclick=()=>{projectCategory=id;[...projectFilters.children].forEach(b=>b.setAttribute('aria-pressed',String(b===filter)));const visible=shownProjects();selectProject(visible.includes(activeProject)?activeProject:visible[0]);};projectFilters.append(filter);
    });
    function stepProject(step){const visible=shownProjects();selectProject(visible[(visible.indexOf(activeProject)+step+visible.length)%visible.length]);}
    previousProject.onclick=()=>stepProject(-1);nextProject.onclick=()=>stepProject(1);
    videoToggle.onclick=()=>{previewPaused=!previewPaused;videoToggle.textContent=previewPaused?'Play preview':'Pause preview';videoToggle.setAttribute('aria-label',previewPaused?'Play gameplay preview':'Pause gameplay preview');videoToggle.setAttribute('aria-pressed',String(previewPaused));updatePreview();};
    new MutationObserver(updatePreview).observe(document.documentElement,{attributes:true,attributeFilter:['data-portfolio-motion']});
    previewMotion.addEventListener('change',updatePreview);document.addEventListener('visibilitychange',updatePreview);
    const previewObserver=new IntersectionObserver(observations=>{previewVisible=observations[0].isIntersecting;updatePreview();},{threshold:0.15});previewObserver.observe(previewVideo);
    galleryControls.append(galleryStatus,videoToggle,previousProject,nextProject);
    works.append(worksHeading,projectFilters,worksGrid,galleryControls,make('p','software-demo-note','Robocon 2025 uses my gameplay recording. Other previews are theme illustrations. '+demoNote));
    selectProject(1);
    const sectionStyle=make('style');
    sectionStyle.textContent=`
      .sw-engineering-badge{display:block;margin:34px auto;color:#a4dce5;font-size:32px;font-weight:650;letter-spacing:.02em}
      .sw-tool-wordmark{font-size:18px;font-weight:650;color:#b9dce5;letter-spacing:.04em}
      #software-profile .sw-simulation-tool-logo{width:100px;height:100px;object-fit:contain;margin:24px auto;display:block}
      #software-profile .sw-simulation-tool-logo[hidden]{display:none}
      #software-profile .sw-unity-logo{filter:invert(1)}
      #software-profile .sw-brand-strip{margin-top:32px}
      #software-profile .sw-brand-strip img{width:48px;height:44px;max-width:100%}
      #software-profile .sw-brand-strip img[hidden]{display:none}
      .sw-brand-name{display:block;margin-top:12px;font-size:14px;color:#e1e8ef}
      #software-profile .sw-brand-strip figcaption{margin-top:5px}
      .sw-works{margin-top:40px}.sw-work-panels{display:flex;gap:0;min-width:0;overflow:hidden}
      .sw-work-panel{position:relative;isolation:isolate;display:flex;flex-direction:column;justify-content:flex-end;flex:1 1 0;min-width:0;height:510px;border-left:1px solid #526171;overflow:hidden;transition:flex .6s ease;background:#101923}
      .sw-work-panel[hidden]{display:none}.sw-work-panel:first-child{border-left:0}.sw-work-panel.is-active{flex:3.5 1 0}
      .sw-work-backdrop,.sw-work-video,.sw-work-concept{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-3;opacity:.16;transition:opacity .4s}
      .sw-work-video{object-fit:contain;object-position:center top;background:#111923;opacity:0}
      .sw-work-panel.is-active .sw-work-backdrop,.sw-work-panel.is-active .sw-work-video,.sw-work-panel.is-active .sw-work-concept{opacity:1}
      .sw-work-panel:after{content:'';position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,transparent 20%,#0b1421a6 52%,#0b1421fa 85%);pointer-events:none}
      .sw-work-title{margin:0!important}.sw-work-toggle{display:block;width:100%;padding:24px 20px;border:0;background:transparent;text-align:left;color:#edf3fa;min-height:110px;padding-bottom:40px}
      .sw-work-toggle:focus-visible{outline:2px solid #dca56b;outline-offset:-4px}
      .sw-work-panel.is-active .sw-work-toggle{padding-bottom:24px}
      .sw-work-category{display:block;color:#dca56b;font-size:9px;letter-spacing:.1em;margin-bottom:16px;line-height:1.6}
      .sw-work-name{display:block;font-size:20px;line-height:1.2;overflow-wrap:anywhere}.is-active .sw-work-name{font-size:30px}
      .sw-work-detail{padding:0 20px 48px}.sw-work-detail[hidden]{display:none}.sw-work-detail p{font-size:13px;line-height:1.7;color:#c1cedc;margin:0}
      .sw-work-links{display:flex;flex-wrap:wrap;gap:16px;margin-top:14px}.sw-work-links a{color:#a8e3eb;font-size:12px;min-height:44px;display:inline-flex;align-items:center}
      .sw-work-links a:focus-visible{outline:2px solid #dca56b;outline-offset:4px}.sw-work-number{position:absolute;right:20px;bottom:16px;font-size:11px;color:#a7b5c5}
      .sw-work-preview-label{position:absolute;left:18px;top:18px;font-size:9px;letter-spacing:.12em;padding:6px 10px;background:#0b1421cc;color:#a8e3eb;border:1px solid #526171}
      .sw-work-concept{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;background:radial-gradient(circle at 50% 35%,#254451,#111923 65%);color:#a7ccd5}.sw-work-concept svg{width:100px;height:100px}.sw-work-concept span{font-size:10px;letter-spacing:.15em}
      .sw-works .software-demo-note{font-size:11px;line-height:1.8;color:#8d9eaf;margin-top:22px}
      .sw-work-controls{display:flex;align-items:center;gap:12px;margin-top:24px}.sw-work-status{margin-right:auto;font-size:12px;color:#a7b5c5}.sw-work-controls button{min-width:44px;min-height:44px;padding:8px 16px;border:1px solid #526171;border-radius:24px;color:#dca56b;background:transparent;font-size:12px}.sw-work-controls button[hidden]{display:none}.sw-work-controls button:disabled{opacity:.35}
      @media(max-width:1000px){.sw-work-panels{flex-direction:column;gap:10px}.sw-work-panel,.sw-work-panel.is-active{flex:none;width:100%;height:auto;min-height:112px;border:1px solid #344352;border-radius:12px}.sw-work-panel.is-active{min-height:520px}.sw-work-toggle{padding:22px}.sw-work-detail{padding:0 22px 45px}.sw-work-panel:not(.is-active) .sw-work-preview-label{display:none}.sw-work-controls{flex-wrap:wrap}.sw-work-status{flex-basis:100%}.sw-work-video{object-position:center top}}
      @media(prefers-reduced-motion:reduce){.sw-work-panel,.sw-work-backdrop,.sw-work-video{transition:none}}
    `;
    // Mount once, only after the original content and links have been captured.
    root.replaceChildren(header,workNote,filters,exhibit,attribution,footer,brands,works,announce,dialog,sectionStyle);
    root.classList.add('software-showcase-ready');root.dataset.softwareShowcase='ready';
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    let filtered=entries, current=0, category='all', paused=true, visible=false, hovering=false, timer=null, pointer=null, suppressClickUntil=0, suspended=false;
    try {paused=sessionStorage.getItem('portfolio:pause:software-showcase')!=='no';} catch { /* Storage is optional. */ }
    const motion=() => !reduced.matches && window.portfolioMotionEnabled!==false;
    function sync() {
      clearTimeout(timer); timer=null;
      window.PortfolioAutoplay?.remember?.('software-showcase',paused);
      const focused=exhibit.contains(document.activeElement) && document.activeElement!==play;
      const allowed=!suspended && visible && !document.hidden && !root.closest('[hidden]') && !dialog.open && (window.PortfolioAutoplay?.canRun?.(root) ?? true);
      const running=!paused && motion() && allowed && !hovering && !focused && filtered.length>1;
      play.disabled=!motion() || filtered.length<2;
      play.textContent=paused || !motion() ? '▷' : 'Ⅱ';
      play.setAttribute('aria-pressed',String(!paused && motion()));
      play.setAttribute('aria-label',!motion() ? 'Automatic switching disabled by motion preference' : paused ? 'Start automatic software showcase' : 'Pause automatic software showcase');
      motionStatus.textContent=!motion() ? 'Motion off' : filtered.length<2 ? 'Single entry' : paused ? 'Auto switching paused' : running ? 'Auto switching · 6 s' : 'Paused while browsing';
      if(running) timer=setTimeout(() => step(1,false),6000);
    }
    function render(manual=false) {
      const chosen=filtered[current]; if(!chosen)return;
      entries.forEach(entry => {
        const card=cards.get(entry.id), i=filtered.indexOf(entry);
        let offset=i-current;
        if(offset>filtered.length/2) offset-=filtered.length;
        if(offset<-filtered.length/2) offset+=filtered.length;
        const away=Math.abs(offset), hide=i<0 || away>2;
        card.hidden=hide;card.setAttribute('aria-hidden',String(hide));card.tabIndex=!hide && offset===0 ? 0 : -1;
        card.classList.toggle('is-active',!hide && offset===0);card.setAttribute('aria-pressed',String(!hide && offset===0));
        card.style.setProperty('--sw-offset',offset);card.style.setProperty('--sw-depth',`${-away*85}px`);card.style.setProperty('--sw-angle',`${offset===0 ? 0 : offset>0 ? -10 : 10}deg`);
        card.style.setProperty('--sw-opacity',offset===0 ? 1 : away===1 ? .52 : .22);card.style.setProperty('--sw-order',5-away);
      });
      jump.value=chosen.id;
      counter.textContent=`${String(current+1).padStart(2,'0')} / ${String(filtered.length).padStart(2,'0')}`;
      fill.style.width=`${(current+1)/filtered.length*100}%`;
      prev.disabled=next.disabled=filtered.length<2;
      detailContent(chosen,detail);itemNote.textContent=chosen.note;
      expand.setAttribute('aria-label',`Expand ${chosen.title} details`);
      if(manual)announce.textContent=`${chosen.title}. ${chosen.status}. ${current+1} of ${filtered.length}.`;
      sync();
    }
    function select(id,manual=false) {const i=filtered.findIndex(e=>e.id===id);if(i<0)return;if(manual)paused=true;current=i;render(manual);}
    function step(direction,manual=true) {select(filtered[(current+direction+filtered.length)%filtered.length].id,manual);}
    function filter(value,manual=true) {
      const id=filtered[current]?.id;category=value;
      filtered=entries.filter(e=>value==='all'||e.category===value);
      current=Math.max(0,filtered.findIndex(e=>e.id===id));
      if(manual)paused=true;
      [...filters.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===category)));
      jump.replaceChildren(...filtered.map(entry=>{const o=make('option','',entry.title);o.value=entry.id;return o;}));
      count.textContent=`${filtered.length} software ${filtered.length===1?'entry':'entries'}`;
      render(manual);
    }
    categories.forEach(([value,label])=>{const b=button(label,label);b.dataset.category=value;b.onclick=()=>filter(value);filters.append(b);});
    prev.onclick=()=>step(-1);next.onclick=()=>step(1);jump.onchange=()=>select(jump.value,true);play.onclick=()=>{paused=!paused;sync();};
    expand.onclick=()=>{
      paused=true;opener=expand;const chosen=filtered[current];dialogTitle.textContent=chosen.title;detailContent(chosen,dialogBody,true);
      const note=make('p','sw-dialog-note',chosen.note);dialogBody.append(note);
      if(typeof dialog.showModal==='function'){dialog.showModal();close.focus();}else{detail.scrollIntoView({block:'nearest'});}
      sync();
    };
    close.onclick=()=>dialog.close();
    dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close();});
    dialog.addEventListener('close',()=>{if(!root.closest('[hidden]'))opener?.focus({preventScroll:true});sync();});
    stage.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();const focusedCard=e.target.closest('.sw-card');
      if(e.key==='Home')select(filtered[0].id,true);else if(e.key==='End')select(filtered.at(-1).id,true);else step(e.key==='ArrowRight'?1:-1);
      if(focusedCard)cards.get(filtered[current].id).focus({preventScroll:true});
    });
    stage.addEventListener('pointerdown',e=>{if(e.isPrimary===false||e.button>0)return;pointer={x:e.clientX,y:e.clientY,id:e.pointerId};},{passive:true});
    document.addEventListener('pointerup',e=>{
      if(!pointer||pointer.id!==e.pointerId)return;
      const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;
      if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.25){suppressClickUntil=Date.now()+350;step(dx<0?1:-1);}
    },{passive:true});
    document.addEventListener('pointercancel',()=>{pointer=null;},{passive:true});
    exhibit.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovering=true;sync();}});
    exhibit.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){hovering=false;sync();}});
    exhibit.addEventListener('focusin',sync);exhibit.addEventListener('focusout',()=>queueMicrotask(sync));
    if('IntersectionObserver' in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting;sync();},{threshold:.1}).observe(exhibit);else visible=true;
    new MutationObserver(()=>{if(root.hidden&&dialog.open)dialog.close();sync();}).observe(root,{attributes:true,attributeFilter:['hidden']});
    document.addEventListener('visibilitychange',sync);window.addEventListener('portfolio-motion',sync);reduced.addEventListener('change',sync);
    window.addEventListener('pagehide',()=>{suspended=true;sync();});window.addEventListener('pageshow',()=>{suspended=false;sync();});
    window.PortfolioAutoplay?.watch?.(sync);
    filter('all',false);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
