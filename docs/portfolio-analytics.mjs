// No report data or dashboard credentials belong in this public bundle.
export function validConfig(config, hostname) {
  return /^G-[A-Z0-9]{6,20}$/.test(config?.measurementId || '') && config.allowedHosts?.includes(hostname.toLowerCase());
}
export function pageMetadata(location, referrer) {
  let ref = '';
  try { ref = new URL(referrer).origin + '/'; } catch {}
  const params = new URL(location.href).searchParams;
  const metadata = {page_location: location.origin + location.pathname, page_referrer: ref, page_title: 'Affan Iman — Portfolio'};
  // Campaign values should describe channels, never individual recruiters.
  for (const [key, field] of [['utm_source','campaign_source'],['utm_medium','campaign_medium'],['utm_campaign','campaign_name']]) {
    const value = params.get(key);
    if (value && /^[a-zA-Z0-9_-]{1,60}$/.test(value)) metadata[field] = value;
  }
  return metadata;
}
export function classifyClick(target, location) {
  const control = target?.closest?.('a,button');
  if (!control) return null;
  if (control.matches('.ic-panel-open[data-project]')) return ['project_open', {project_id: control.dataset.project, gallery: control.closest('.ic-gallery')?.id || 'gallery'}];
  if (control.matches('[data-robotics-open]')) return ['project_open', {project_id: control.dataset.roboticsOpen, gallery: 'robotics-stories'}];
  if (control.matches('.robot-lab-card')) return ['project_open', {project_id: control.querySelector('h3')?.textContent?.trim().slice(0,80) || 'robotics-project', gallery: 'robotics-lab'}];
  if (control.tagName !== 'A') return null;
  const href = control.getAttribute('href') || '';
  if (href.startsWith('mailto:')) return ['contact_click', {channel:'email'}];
  let url;
  try { url = new URL(href, location.href); } catch { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.origin === location.origin && /\/documents\/.*resume.*\.pdf$/i.test(url.pathname)) return ['resume_open', {document:'resume'}];
  if (['linkedin.com','www.linkedin.com'].includes(url.hostname)) return ['contact_click', {channel:'linkedin'}];
  if (url.origin === location.origin && ['#ic-design','#robotics','#software','#about','#credentials'].includes(url.hash)) return ['section_open', {section:url.hash.slice(1)}];
  return null;
}

async function initialize() {
  let config;
  try {
    const response = await fetch(new URL('analytics-config.json', import.meta.url), {cache:'no-store'});
    if (!response.ok) return;
    config = await response.json();
  } catch { return; }
  // Unconfigured deployments and previews are deliberately inert.
  if (!validConfig(config, location.hostname)) return;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
  const id = config.measurementId, key = 'portfolio-analytics-consent-v1';
  let consent = '', loaded = false;
  try { consent = localStorage.getItem(key) || ''; } catch {}
  const settings = document.createElement('button');
  settings.type = 'button'; settings.textContent = 'Analytics preferences';
  settings.style.cssText = 'margin:16px;padding:8px 12px;border:1px solid #ccc;border-radius:8px;background:#fff;color:#222;font:inherit;cursor:pointer';
  (document.querySelector('footer') || document.body).append(settings);
  const notice = document.createElement('section');
  notice.setAttribute('aria-label','Optional website analytics');
  notice.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;max-width:560px;z-index:10000;padding:20px;border:1px solid #d7dce3;border-radius:16px;background:white;color:#17202b;box-shadow:0 8px 35px #0002;font:15px/1.5 system-ui';
  notice.innerHTML = '<strong>Help improve this portfolio</strong><p>Allow optional Google Analytics cookies to measure visits and project, resume and contact clicks? Reports are private to the site owner. This does not record your screen or form inputs. You can change your choice below at any time.</p><div style="display:flex;gap:12px;flex-wrap:wrap"><button type="button" data-choice="yes">Allow analytics</button><button type="button" data-choice="no">No thanks</button></div>';
  notice.querySelectorAll('button').forEach(b => b.style.cssText = 'padding:10px 16px;background:#f3f5f8;color:#17202b;border:1px solid #bac2ce;border-radius:8px;font:inherit;cursor:pointer');
  document.body.append(notice);
  notice.hidden = consent !== '';
  settings.onclick = () => { notice.hidden = false; notice.querySelector('button').focus(); };
  function start() {
    if (loaded || consent !== 'yes') return;
    loaded = true;
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('js',new Date());
    window.gtag('config',id,{...pageMetadata(location, document.referrer),send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_expires:2592000});
    const tag = document.createElement('script');
    tag.async = true; tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.append(tag);
    window.gtag('event','page_view',pageMetadata(location,document.referrer));
  }
  notice.querySelectorAll('[data-choice]').forEach(button => button.onclick = () => {
    consent = button.dataset.choice;
    try { localStorage.setItem(key,consent); } catch {}
    notice.hidden = true;
    if (consent === 'yes') {
      if (loaded) { window['ga-disable-' + id] = false; window.gtag('consent','update',{analytics_storage:'granted'}); }
      else start();
    } else {
      window['ga-disable-' + id] = true;
      if (loaded) window.gtag('consent','update',{analytics_storage:'denied'});
      // Remove first-party GA cookies, including parent-domain cookies.
      const domains = ['', ...location.hostname.split('.').map((_,i,a)=>a.slice(i).join('.'))];
      for (const cookie of document.cookie.split(';')) {
        const name = cookie.split('=')[0].trim();
        if (name === '_ga' || name.startsWith('_ga_')) for (const domain of domains) document.cookie = name + '=; Max-Age=0; Path=/' + (domain ? '; Domain=' + domain : '') + '; SameSite=Lax; Secure';
      }
    }
    settings.focus();
  });
  document.addEventListener('click', event => {
    if (!event.isTrusted || consent !== 'yes' || !loaded || window['ga-disable-' + id]) return;
    const detail = classifyClick(event.target,location);
    if (detail) window.gtag('event',detail[0],{...detail[1],transport_type:'beacon'});
  }, {capture:true, passive:true});
  start();
}
if (typeof document !== 'undefined') initialize().catch(() => {});
