var Ve=Object.defineProperty;var Ue=(t,e,s)=>e in t?Ve(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s;var A=(t,e,s)=>Ue(t,typeof e!="symbol"?e+"":e,s);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function s(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(n){if(n.ep)return;n.ep=!0;const r=s(n);fetch(n.href,r)}})();const Ne="modulepreload",He=function(t){return"/leneda-panel/static/"+t},_e={},W=function(e,s,a){let n=Promise.resolve();if(s&&s.length>0){let i=function(v){return Promise.all(v.map(o=>Promise.resolve(o).then(l=>({status:"fulfilled",value:l}),l=>({status:"rejected",reason:l}))))};document.getElementsByTagName("link");const m=document.querySelector("meta[property=csp-nonce]"),g=(m==null?void 0:m.nonce)||(m==null?void 0:m.getAttribute("nonce"));n=i(s.map(v=>{if(v=He(v),v in _e)return;_e[v]=!0;const o=v.endsWith(".css"),l=o?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${v}"]${l}`))return;const c=document.createElement("link");if(c.rel=o?"stylesheet":Ne,o||(c.as="script"),c.crossOrigin="",c.href=v,g&&c.setAttribute("nonce",g),document.head.appendChild(c),o)return new Promise((f,p)=>{c.addEventListener("load",f),c.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${v}`)))})}))}function r(i){const m=new Event("vite:preloadError",{cancelable:!0});if(m.payload=i,window.dispatchEvent(m),!m.defaultPrevented)throw i}return n.then(i=>{for(const m of i||[])m.status==="rejected"&&r(m.reason);return e().catch(r)})};function je(){var t,e,s,a,n;try{const r=(e=(t=window.parent)==null?void 0:t.document)==null?void 0:e.querySelector("home-assistant");return((n=(a=(s=r==null?void 0:r.hass)==null?void 0:s.auth)==null?void 0:a.data)==null?void 0:n.access_token)??null}catch{return null}}async function D(t,e){const s=je(),a={...e==null?void 0:e.headers,...s?{Authorization:`Bearer ${s}`}:{}},n={...e,credentials:"include",headers:a},r=await fetch(t,n);if(!r.ok)throw new Error(`API ${r.status}: ${r.statusText}`);return r.json()}async function te(t){return D(`/leneda_api/data?range=${t}`)}async function Xe(t,e){return D(`/leneda_api/data/custom?start=${encodeURIComponent(t)}&end=${encodeURIComponent(e)}`)}async function O(t,e,s){let a=`/leneda_api/data/timeseries?obis=${encodeURIComponent(t)}`;return e&&(a+=`&start=${encodeURIComponent(e)}`),s&&(a+=`&end=${encodeURIComponent(s)}`),D(a)}async function Ye(t,e,s){let a=`/leneda_api/data/timeseries/per-meter?obis=${encodeURIComponent(t)}`;return e&&(a+=`&start=${encodeURIComponent(e)}`),s&&(a+=`&end=${encodeURIComponent(s)}`),D(a)}async function se(){return D("/leneda_api/sensors")}async function q(){return D("/leneda_api/config")}async function Ze(t){await D("/leneda_api/config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})}async function ze(){await D("/leneda_api/config/reset",{method:"POST"})}async function Ce(){try{return await D("/leneda_api/mode")}catch{return{mode:"standalone",configured:!1}}}async function Ee(){return D("/leneda_api/credentials")}async function Be(t){await D("/leneda_api/credentials",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})}async function Ke(t){return D("/leneda_api/credentials/test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})}const L=Object.freeze(Object.defineProperty({__proto__:null,fetchConfig:q,fetchCredentials:Ee,fetchCustomData:Xe,fetchMode:Ce,fetchPerMeterTimeseries:Ye,fetchRangeData:te,fetchSensors:se,fetchTimeseries:O,resetConfig:ze,saveConfig:Ze,saveCredentials:Be,testCredentials:Ke},Symbol.toStringTag,{value:"Module"}));function u(t,e=2){return t==null?"—":t.toLocaleString(void 0,{minimumFractionDigits:0,maximumFractionDigits:e})}function we(t){return new Date(t).toLocaleDateString(void 0,{month:"short",day:"numeric"})}function Je(t){return new Date(t).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}const be=[{id:"yesterday",label:"Yesterday"},{id:"this_week",label:"This Week"},{id:"last_week",label:"Last Week"},{id:"this_month",label:"This Month"},{id:"last_month",label:"Last Month"},{id:"this_year",label:"This Year"},{id:"last_year",label:"Last Year"},{id:"custom",label:"Custom"}];function ke(t){var h;const e=t.rangeData,s=(e==null?void 0:e.consumption)??0,a=(e==null?void 0:e.production)??0,n=(e==null?void 0:e.exported)??0,r=(e==null?void 0:e.self_consumed)??0,i=(e==null?void 0:e.gas_energy)??0,m=(e==null?void 0:e.gas_volume)??0,g=(e==null?void 0:e.peak_power_kw)??0,v=Math.max(0,s-r-((e==null?void 0:e.shared_with_me)??0)),o=Math.max(0,n-((e==null?void 0:e.shared)??0)),l=(e==null?void 0:e.shared)??0,c=(e==null?void 0:e.shared_with_me)??0,f=Math.min(a,r),p=s>0?Math.min(100,r/s*100):0,y=Math.max(a,v,o,l,c,f,1),b=(d,$=3,T=11)=>(d>0?$+d/y*(T-$):2).toFixed(1),k=(d,$=.22,T=.94)=>(d>0?$+d/y*(T-$):.12).toFixed(2),_=(d,$=1.35,T=3.2)=>`${(d>0?Math.max($,T-d/y*(T-$)):T).toFixed(2)}s`,S=(d,$=4,T=7.5)=>(d>0?$+d/y*(T-$):3.5).toFixed(1),C=t.range==="custom"&&t.customStart&&t.customEnd?`${we(t.customStart+"T00:00:00")} — ${we(t.customEnd+"T00:00:00")}`:((h=be.find(d=>d.id===t.range))==null?void 0:h.label)??"Yesterday";return`
    <div class="dashboard" style="position: relative;">
      <div style="position:fixed;bottom:4px;right:4px;font-size:10px;opacity:0.5;pointer-events:none;z-index:9999;">v:2.0.4</div>

      <!-- Range Selector -->
      <div class="range-selector">
        ${be.map(d=>`
          <button
            class="range-btn ${d.id===t.range?"active":""}"
            data-range="${d.id}"
          >${d.label}</button>
        `).join("")}
      </div>

      ${(()=>{if(!(e!=null&&e.start)||!(e!=null&&e.end))return"";try{const d=new Date(e.start),$=new Date(e.end);return isNaN(d.getTime())||isNaN($.getTime())?"":`
            <div class="range-info-bar">
              📅 ${d.toLocaleDateString()} — ${$.toLocaleDateString()}
            </div>
          `}catch{return""}})()}

      ${t.range==="custom"?`
      <!-- Custom Date Range Picker -->
      <div class="custom-range-picker">
        <label>
          <span>From</span>
          <input type="date" id="custom-start" value="${t.customStart??""}" />
        </label>
        <label>
          <span>To</span>
          <input type="date" id="custom-end" value="${t.customEnd??""}" />
        </label>
        <button class="btn btn-primary" id="apply-custom-range">Apply</button>
      </div>
      `:""}

      <!-- Stat Cards -->
      <div class="stats-grid">
        <div class="stat-card consumption">
          <div class="stat-icon">⚡</div>
          <div class="stat-body">
            <div class="stat-label">Consumption</div>
            <div class="stat-value">${u(s)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card.production">
          <div class="stat-icon">☀️</div>
          <div class="stat-body">
            <div class="stat-label">Production</div>
            <div class="stat-value">${u(a)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card.export">
          <div class="stat-icon">📤</div>
          <div class="stat-body">
            <div class="stat-label">Exported</div>
            <div class="stat-value">${u(n)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card.self-consumed">
          <div class="stat-icon">🏠</div>
          <div class="stat-body">
            <div class="stat-label">Self-Consumed</div>
            <div class="stat-value">${u(r)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>
      </div>

      <!-- Energy Flow + Key Metrics side by side -->
      <div class="flow-metrics-row">
        <div class="card flow-card">
          <h3 class="card-title"><span class="title-icon">🔄</span> Energy Flow</h3>

          <div class="leneda-elite-flow">
            <div class="elite-header">
              <div class="glass-module consumption-module">
                <div class="module-info">
                  <span class="module-label">Daily Consumption <span class="info-icon">ⓘ</span></span>
                  <div class="module-value-row">
                    <span class="module-value highlight-red">${u(s)}</span>
                    <span class="module-unit">kWh</span>
                  </div>
                </div>
                <div class="module-visual"><div class="wave-bg red"></div></div>
              </div>

              <div class="glass-module production-module">
                <div class="module-info">
                  <span class="module-label">Solar Production <span class="info-icon">ⓘ</span></span>
                  <div class="module-value-row">
                    <span class="module-value highlight-green">${u(a)}</span>
                    <span class="module-unit">kWh</span>
                  </div>
                </div>
                <div class="module-visual"><div class="wave-bg green"></div></div>
              </div>
            </div>

            <div class="elite-scene">
              <svg class="elite-main-svg" viewBox="0 0 800 400" fill="none" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-blue" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-cyan" x="-25%" y="-25%" width="150%" height="150%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  <linearGradient id="flow-solar" x1="66%" y1="18%" x2="50%" y2="48%">
                    <stop offset="0%" stop-color="var(--clr-production)" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="var(--clr-production)" stop-opacity="1" />
                  </linearGradient>
                  <linearGradient id="flow-grid-in" x1="10%" y1="56%" x2="52%" y2="56%">
                    <stop offset="0%" stop-color="var(--clr-consumption)" stop-opacity="0.35" />
                    <stop offset="100%" stop-color="var(--clr-consumption)" stop-opacity="0.95" />
                  </linearGradient>
                  <linearGradient id="flow-grid-out" x1="54%" y1="70%" x2="12%" y2="78%">
                    <stop offset="0%" stop-color="var(--clr-export)" stop-opacity="0.95" />
                    <stop offset="100%" stop-color="var(--clr-export)" stop-opacity="0.4" />
                  </linearGradient>
                  <linearGradient id="flow-shared-out" x1="52%" y1="46%" x2="88%" y2="46%">
                    <stop offset="0%" stop-color="var(--clr-export)" stop-opacity="0.95" />
                    <stop offset="100%" stop-color="var(--clr-export)" stop-opacity="0.45" />
                  </linearGradient>
                  <linearGradient id="flow-shared-in" x1="88%" y1="61%" x2="52%" y2="61%">
                    <stop offset="0%" stop-color="var(--clr-primary)" stop-opacity="0.4" />
                    <stop offset="100%" stop-color="var(--clr-primary)" stop-opacity="1" />
                  </linearGradient>

                  <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0 0 L8 4 L0 8 Z" fill="var(--clr-consumption)" />
                  </marker>
                  <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0 0 L8 4 L0 8 Z" fill="var(--clr-production)" />
                  </marker>
                  <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0 0 L8 4 L0 8 Z" fill="var(--clr-export)" />
                  </marker>
                  <marker id="arrow-cyan" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M0 0 L8 4 L0 8 Z" fill="var(--clr-primary)" />
                  </marker>

                  <linearGradient id="scene-shell" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="rgba(255,255,255,0.05)" />
                    <stop offset="100%" stop-color="rgba(255,255,255,0.01)" />
                  </linearGradient>
                  <radialGradient id="house-base-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="var(--clr-surface-alt)" stop-opacity="0.8" />
                    <stop offset="100%" stop-color="var(--clr-surface-alt)" stop-opacity="0" />
                  </radialGradient>
                  <radialGradient id="house-core-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="rgba(88, 166, 255, 0.18)" />
                    <stop offset="100%" stop-color="rgba(88, 166, 255, 0)" />
                  </radialGradient>
                </defs>

                <rect x="28" y="36" width="744" height="308" rx="30" fill="url(#scene-shell)" stroke="var(--clr-scene-shell-stroke)" />
                <ellipse cx="400" cy="298" rx="324" ry="54" fill="url(#house-base-glow)" opacity="0.55" />
                <line x1="78" y1="280" x2="722" y2="280" stroke="var(--clr-border)" stroke-width="1" stroke-opacity="0.45" />

                <g class="scene-node-label" transform="translate(54, 108)">
                  <rect width="118" height="52" rx="16" fill="var(--clr-overlay)" stroke="rgba(248, 81, 73, 0.24)" />
                  <text x="16" y="22" class="scene-node-kicker">Grid</text>
                  <text x="16" y="38" class="scene-node-value">${u(v+o)} kWh</text>
                </g>

                <g class="scene-node-label" transform="translate(338, 44)">
                  <rect width="124" height="48" rx="16" fill="var(--clr-overlay)" stroke="rgba(63, 185, 80, 0.24)" />
                  <text x="16" y="20" class="scene-node-kicker">Solar</text>
                  <text x="16" y="36" class="scene-node-value">${u(a)} kWh</text>
                </g>

                <g class="scene-node-label" transform="translate(600, 108)">
                  <rect width="146" height="52" rx="16" fill="var(--clr-overlay)" stroke="rgba(88, 166, 255, 0.24)" />
                  <text x="16" y="22" class="scene-node-kicker">Community</text>
                  <text x="16" y="38" class="scene-node-value">${u(l+c)} kWh</text>
                </g>

                <g class="tier-1-infrastructure" transform="translate(112, 180)">
                  <circle cx="0" cy="44" r="48" fill="var(--clr-consumption)" fill-opacity="0.06" />
                  <path d="M0 0 V88 M-24 20 H24 M-16 42 H16 M-8 66 H8" stroke="var(--clr-consumption)" stroke-width="3" stroke-linecap="round" filter="url(#glow-red)" />
                  <path d="M-12 88 L0 60 L12 88" stroke="var(--clr-consumption)" stroke-width="3" stroke-linecap="round" fill="none" />
                </g>

                <g class="tier-1-community" transform="translate(688, 185)">
                  <circle cx="0" cy="40" r="50" fill="var(--clr-primary)" fill-opacity="0.06" />
                  <rect x="-26" y="30" width="22" height="42" rx="6" fill="rgba(88, 166, 255, 0.08)" stroke="var(--clr-primary)" stroke-width="2" />
                  <rect x="6" y="16" width="24" height="56" rx="6" fill="rgba(88, 166, 255, 0.12)" stroke="var(--clr-primary)" stroke-width="2" />
                  <rect x="-2" y="4" width="6" height="10" rx="2" fill="var(--clr-primary)" fill-opacity="0.7" />
                  <path d="M-14 12 H14 M-10 4 V20 M10 4 V20" stroke="var(--clr-primary)" stroke-width="2" stroke-linecap="round" filter="url(#glow-cyan)" />
                </g>

                <g class="tier-1-solar" transform="translate(564, 88)">
                  <circle cx="0" cy="0" r="26" fill="var(--clr-production)" fill-opacity="0.09" />
                  <circle cx="0" cy="0" r="12" fill="var(--clr-production)" fill-opacity="0.9" filter="url(#glow-green)" />
                  <path d="M0 -26 V-40 M0 26 V40 M26 0 H40 M-26 0 H-40 M18 -18 L28 -28 M18 18 L28 28 M-18 18 L-28 28 M-18 -18 L-28 -28" stroke="var(--clr-production)" stroke-width="2.5" stroke-linecap="round" />
                </g>

                <g class="elite-house" transform="translate(312, 92)">
                  <circle cx="90" cy="122" r="100" fill="url(#house-core-glow)" />
                  <circle cx="90" cy="122" r="88" stroke="rgba(88,166,255,0.12)" stroke-width="2" stroke-dasharray="6 10" />
                  <path d="M8 96 L90 28 L172 96 V228 H8 Z" fill="var(--clr-surface)" stroke="var(--clr-border)" stroke-width="3" />
                  <path d="M26 92 L90 44 L154 92" stroke="var(--clr-production)" stroke-width="4" stroke-linecap="round" stroke-opacity="0.7" />
                  <path d="M90 28 V228" stroke="var(--clr-border)" stroke-width="1" stroke-opacity="0.22" />
                  <rect x="30" y="120" width="32" height="42" rx="6" fill="rgba(88,166,255,0.06)" stroke="var(--clr-border)" stroke-width="1.5" />
                  <rect x="118" y="120" width="32" height="42" rx="6" fill="rgba(88,166,255,0.06)" stroke="var(--clr-border)" stroke-width="1.5" />
                  <rect x="68" y="170" width="44" height="58" rx="6" fill="var(--clr-surface-alt)" stroke="var(--clr-border)" stroke-width="2" />
                  <g transform="translate(122, 54) rotate(32)">
                    <rect x="0" y="0" width="56" height="14" rx="3" fill="rgba(63, 185, 80, 0.12)" stroke="var(--clr-production)" stroke-width="1.6" filter="url(#glow-green)" />
                    <rect x="0" y="20" width="56" height="14" rx="3" fill="rgba(63, 185, 80, 0.12)" stroke="var(--clr-production)" stroke-width="1.6" filter="url(#glow-green)" />
                    <line x1="13" y1="0" x2="13" y2="14" stroke="var(--clr-production)" stroke-width="0.7" stroke-opacity="0.45" />
                    <line x1="30" y1="0" x2="30" y2="14" stroke="var(--clr-production)" stroke-width="0.7" stroke-opacity="0.45" />
                    <line x1="13" y1="20" x2="13" y2="34" stroke="var(--clr-production)" stroke-width="0.7" stroke-opacity="0.45" />
                    <line x1="30" y1="20" x2="30" y2="34" stroke="var(--clr-production)" stroke-width="0.7" stroke-opacity="0.45" />
                  </g>
                  <g transform="translate(90, 124)">
                    <circle r="32" fill="var(--clr-overlay)" stroke="var(--clr-overlay-border)" stroke-width="2" />
                    <text text-anchor="middle" y="-4" class="house-core-kicker">Self-Suff.</text>
                    <text text-anchor="middle" y="18" class="house-core-value">${u(p,0)}%</text>
                  </g>
                </g>

                <path d="M 560 98 C 520 102 474 130 434 182" stroke="url(#flow-solar)" stroke-width="${b(f)}" stroke-opacity="${k(f)}" stroke-linecap="round" fill="none" marker-end="url(#arrow-green)" />
                ${f>0?`
                  <circle r="${S(f)}" fill="var(--clr-production)" filter="url(#glow-green)">
                    <animateMotion dur="${_(f)}" repeatCount="indefinite" path="M 560 98 C 520 102 474 130 434 182" />
                  </circle>
                `:""}

                <path d="M 146 224 C 226 224 298 224 354 214" stroke="url(#flow-grid-in)" stroke-width="${b(v)}" stroke-opacity="${k(v)}" stroke-linecap="round" fill="none" marker-end="url(#arrow-red)" />
                ${v>0?`
                  <circle r="${S(v)}" fill="var(--clr-consumption)" filter="url(#glow-red)">
                    <animateMotion dur="${_(v)}" repeatCount="indefinite" path="M 146 224 C 226 224 298 224 354 214" />
                  </circle>
                `:""}

                <path d="M 446 246 C 386 292 286 314 146 312" stroke="url(#flow-grid-out)" stroke-width="${b(o)}" stroke-opacity="${k(o)}" stroke-linecap="round" fill="none" marker-end="url(#arrow-blue)" />
                ${o>0?`
                  <circle r="${S(o)}" fill="var(--clr-export)" filter="url(#glow-blue)">
                    <animateMotion dur="${_(o)}" repeatCount="indefinite" path="M 446 246 C 386 292 286 314 146 312" />
                  </circle>
                `:""}

                <path d="M 450 206 C 514 184 582 184 650 206" stroke="url(#flow-shared-out)" stroke-width="${b(l)}" stroke-opacity="${k(l)}" stroke-linecap="round" fill="none" marker-end="url(#arrow-blue)" />
                ${l>0?`
                  <circle r="${S(l)}" fill="var(--clr-export)" filter="url(#glow-blue)">
                    <animateMotion dur="${_(l)}" repeatCount="indefinite" path="M 450 206 C 514 184 582 184 650 206" />
                  </circle>
                `:""}

                <path d="M 650 236 C 586 252 522 254 448 238" stroke="url(#flow-shared-in)" stroke-width="${b(c)}" stroke-opacity="${k(c)}" stroke-linecap="round" fill="none" marker-end="url(#arrow-cyan)" />
                ${c>0?`
                  <circle r="${S(c)}" fill="var(--clr-primary)" filter="url(#glow-cyan)">
                    <animateMotion dur="${_(c)}" repeatCount="indefinite" path="M 650 236 C 586 252 522 254 448 238" />
                  </circle>
                `:""}
              </svg>
            </div>

            <div class="flow-legend">
              <div class="flow-legend-item solar">
                <span class="flow-legend-dot"></span>
                <span class="flow-legend-copy">
                  <strong>Solar to home</strong>
                  <span>${u(f)} kWh used directly in the house</span>
                </span>
              </div>
              <div class="flow-legend-item import">
                <span class="flow-legend-dot"></span>
                <span class="flow-legend-copy">
                  <strong>Grid import</strong>
                  <span>${u(v)} kWh bought from the market</span>
                </span>
              </div>
              <div class="flow-legend-item export">
                <span class="flow-legend-dot"></span>
                <span class="flow-legend-copy">
                  <strong>Grid export</strong>
                  <span>${u(o)} kWh sent back to the market</span>
                </span>
              </div>
              <div class="flow-legend-item community">
                <span class="flow-legend-dot"></span>
                <span class="flow-legend-copy">
                  <strong>Community exchange</strong>
                  <span>${u(l)} kWh sent · ${u(c)} kWh received</span>
                </span>
              </div>
            </div>
          </div>
      </div>

      <!-- Key Metrics (right of flow) -->
      <div class="card metrics-card">
        <h3 class="card-title"><span class="title-icon">📈</span> Key Metrics</h3>
        <div class="metrics-list">
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Self-Sufficiency</span>
              <span class="metric-value">${u(p,1)}%</span>
            </div>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${p}%"></div>
            </div>
          </div>
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Self-Consumed</span>
              <span class="metric-value">${u(r)} kWh</span>
            </div>
          </div>
          ${g>0?`
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Peak Power</span>
              <span class="metric-value">${u(g,2)} kW</span>
            </div>
          </div>
          `:""}
          <div class="metric ${((e==null?void 0:e.exceedance_kwh)??0)>0?"metric-warning":"metric-ok"}">
            <div class="metric-header">
              <span class="metric-label">${((e==null?void 0:e.exceedance_kwh)??0)>0?"⚠️":"✅"} Exceedance</span>
              <span class="metric-value">${u((e==null?void 0:e.exceedance_kwh)??0,2)} kWh</span>
            </div>
          </div>
          ${i>0||m>0?`
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Gas Energy</span>
              <span class="metric-value">${u(i)} kWh</span>
            </div>
          </div>
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Gas Volume</span>
              <span class="metric-value">${u(m)} m³</span>
            </div>
          </div>
          `:""}
        </div>
      </div>
      </div>

      <!-- Chart -->
      <div class="card chart-card">
        <div class="chart-header">
          <h3 class="card-title"><span class="title-icon">📉</span> Energy Profile — ${C}</h3>
          <div class="chart-unit-toggle">
            <button
              class="unit-btn ${t.chartUnit==="kw"?"active":""}"
              data-chart-unit="kw"
              title="Show power (kW) — see when you exceed the reference limit"
            >kW</button>
            <button
              class="unit-btn ${t.chartUnit==="kwh"?"active":""}"
              data-chart-unit="kwh"
              title="Show energy consumed (kWh)"
            >kWh</button>
            <button
              class="reset-zoom-btn"
              style="display: none;"
              title="Reset zoom to full period"
            >↩ Reset Zoom</button>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="energy-chart"></canvas>
        </div>
        <p class="muted chart-hint" style="text-align:center; margin-top: var(--sp-2); font-size: var(--text-xs);">
          Scroll to zoom · Drag to pan · Key metrics update with visible range
        </p>
      </div>

      </div>

      </div>
    </section>
  `}const $e={"1-1:1.29.0":{name:"Active Consumption",unit:"kW",icon:"⚡",category:"consumption"},"1-1:2.29.0":{name:"Active Production",unit:"kW",icon:"☀️",category:"production"},"1-1:3.29.0":{name:"Reactive Consumption",unit:"kvar",icon:"⚡",category:"consumption"},"1-1:4.29.0":{name:"Reactive Production",unit:"kvar",icon:"☀️",category:"production"},"1-65:1.29.1":{name:"Consumption Covered (L1 AIR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.3":{name:"Consumption Covered (L2 ACR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.2":{name:"Consumption Covered (L3 CEL)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.4":{name:"Consumption Covered (L4 APS)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.9":{name:"Remaining Consumption",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.1":{name:"Production Shared (L1 AIR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.3":{name:"Production Shared (L2 ACR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.2":{name:"Production Shared (L3 CEL)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.4":{name:"Production Shared (L4 APS)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.9":{name:"Remaining Production",unit:"kW",icon:"🔗",category:"sharing"},"7-1:99.23.15":{name:"Gas Volume",unit:"m³",icon:"🔥",category:"gas"},"7-1:99.23.17":{name:"Gas Standard Volume",unit:"Nm³",icon:"🔥",category:"gas"},"7-20:99.33.17":{name:"Gas Energy",unit:"kWh",icon:"🔥",category:"gas"}};function Qe(t){return $e[t]?$e[t].name:{c_04_yesterday_consumption:"Yesterday's Consumption",c_05_weekly_consumption:"This Week's Consumption",c_06_last_week_consumption:"Last Week's Consumption",c_07_monthly_consumption:"This Month's Consumption",c_08_previous_month_consumption:"Last Month's Consumption",p_04_yesterday_production:"Yesterday's Production",p_05_weekly_production:"This Week's Production",p_06_last_week_production:"Last Week's Production",p_07_monthly_production:"This Month's Production",p_08_previous_month_production:"Last Month's Production",p_09_yesterday_exported:"Yesterday's Export",p_10_last_week_exported:"Last Week's Export",p_11_last_month_exported:"Last Month's Export",p_12_yesterday_self_consumed:"Yesterday's Self-Consumed",p_13_last_week_self_consumed:"Last Week's Self-Consumed",p_14_last_month_self_consumed:"Last Month's Self-Consumed",p_15_monthly_exported:"This Month's Export",p_16_monthly_self_consumed:"This Month's Self-Consumed",g_01_yesterday_consumption:"Gas Yesterday (kWh)",g_02_weekly_consumption:"Gas This Week (kWh)",g_03_last_week_consumption:"Gas Last Week (kWh)",g_04_monthly_consumption:"Gas This Month (kWh)",g_05_last_month_consumption:"Gas Last Month (kWh)",g_10_yesterday_volume:"Gas Yesterday (m³)",g_11_weekly_volume:"Gas This Week (m³)",g_12_last_week_volume:"Gas Last Week (m³)",g_13_monthly_volume:"Gas This Month (m³)",g_14_last_month_volume:"Gas Last Month (m³)"}[t]??t}function et(t){if(!t||!t.sensors.length)return`
      <section class="sensors-view">
        <div class="card">
          <p class="muted">No sensor data available. Waiting for coordinator update…</p>
        </div>
      </section>
    `;const e=[],s=[],a=[],n=[],r=[];for(const m of t.sensors){const g=m.key;g.startsWith("c_")||g==="1-1:1.29.0"||g==="1-1:3.29.0"?e.push(m):g.startsWith("p_")||g==="1-1:2.29.0"||g==="1-1:4.29.0"?s.push(m):g.startsWith("s_")||g.startsWith("1-65:")?a.push(m):g.startsWith("g_")||g.startsWith("7-")?n.push(m):r.push(m)}const i=(m,g,v,o)=>v.length?`
      <div class="card sensor-group">
        <h3 class="card-title"><span class="title-icon">${g}</span> ${m} <span class="badge">${v.length}</span></h3>
        <div style="overflow-x: auto;">
          <table class="sensor-table">
            <thead>
              <tr>
                <th>Sensor</th>
                <th style="text-align: right;">Value</th>
                <th>Unit</th>
                <th>Peak Time</th>
              </tr>
            </thead>
            <tbody>
              ${v.map(l=>`
                <tr>
                  <td class="sensor-name">${Qe(l.key)}</td>
                  <td class="sensor-value" style="text-align: right; color: var(--clr-${o});">${u(l.value)}</td>
                  <td class="sensor-unit">${l.unit}</td>
                  <td class="sensor-peak">${l.peak_timestamp?Je(l.peak_timestamp):'<span style="color: var(--clr-border)">—</span>'}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `:"";return`
    <section class="sensors-view">
      <div class="section-header">
        <h2>All Sensors</h2>
        <div style="display: flex; align-items: center; gap: var(--sp-3); margin-top: var(--sp-2);">
          <span class="badge">${t.sensors.length} sensors</span>
          <span class="muted">${t.metering_point}</span>
        </div>
      </div>
      ${i("Electricity Consumption","⚡",e,"consumption")}
      ${i("Energy Production","☀️",s,"production")}
      ${i("Energy Sharing","🔗",a,"self")}
      ${i("Gas","🔥",n,"gas")}
      ${i("Other","📊",r,"text")}
    </section>
  `}function tt(t,e,s){const a=new Date,n=(g,v)=>new Date(g,v+1,0).getDate();let r,i;switch(t){case"yesterday":{const g=new Date(a);g.setDate(g.getDate()-1),r=1,i=g;break}case"this_week":{const g=new Date(a),v=g.getDay()||7,o=new Date(g);o.setDate(g.getDate()-v+1),r=Math.max(1,Math.round((a.getTime()-o.getTime())/864e5)+1),i=o;break}case"last_week":{r=7;const g=new Date(a);g.setDate(g.getDate()-7),i=g;break}case"this_month":{r=a.getDate(),i=a;break}case"last_month":{const g=new Date(a.getFullYear(),a.getMonth()-1,1);r=n(g.getFullYear(),g.getMonth()),i=g;break}case"custom":{if(e&&s){const g=new Date(e),v=new Date(s);r=Math.max(1,Math.round((v.getTime()-g.getTime())/864e5)+1),i=g}else r=1,i=a;break}default:r=1,i=a}const m=n(i.getFullYear(),i.getMonth());return{days:r,monthDays:m,factor:r/m}}function st(t,e){return e==="all"?!0:e==="weekdays"?t>=1&&t<=5:t===0||t===6}function xe(t){const[e,s]=t.split(":").map(a=>parseInt(a,10)||0);return e*60+s}function Te(t,e,s,a){if(!st(t.getDay(),e))return!1;const n=t.getHours()*60+t.getMinutes(),r=xe(s),i=xe(a);return r===i?!0:r<i?n>=r&&n<i:n>=r||n<i}function at(t,e){return e.find(s=>Te(t,s.day_group,s.start_time,s.end_time))}function rt(t,e){return e.find(s=>Te(t,s.day_group,s.start_time,s.end_time))}function nt(t,e,s,a,n){var v;const r=new Map;let i=0,m=0,g=0;for(const o of t){const l=Number(o.value)||0,c=l*.25,f=new Date(o.startedAt);if(Number.isNaN(f.getTime()))continue;const p=at(f,a),y=rt(f,n),b=(p==null?void 0:p.rate)??e,k=((v=p==null?void 0:p.label)==null?void 0:v.trim())||"Base tariff",_=(y==null?void 0:y.reference_power_kw)??s;i+=c*b,g=Math.max(g,l),l>_&&(m+=(l-_)*.25);const S=`${k}__${b}`,C=r.get(S);C?C.kwh+=c:r.set(S,{label:k,rate:b,kwh:c})}return{energyCost:i,exceedanceKwh:m,peakPowerKw:g,rateBreakdown:Array.from(r.values()).sort((o,l)=>o.label.localeCompare(l.label))}}function ot(t){const e=t.config,s=t.rangeData;if(!e||!s)return`
      <section class="invoice-view">
        <div class="card">
          <p class="muted">Loading billing configuration…</p>
        </div>
      </section>
    `;const a=s.consumption||0,n=s.production||0,r=s.exported||0,i=s.peak_power_kw||0,m=e.reference_power_kw||5,g=s.exceedance_kwh||0,v=s.gas_energy||0,o=s.gas_volume||0,l=v>0||o>0,c=e.consumption_rate_windows??[],f=e.reference_power_windows??[],p=t.consumptionTimeseries?nt(t.consumptionTimeseries.items,e.energy_variable_rate,m,c,f):null,y=c.length>0&&!!p,b=f.length>0&&!!p,k=b?p.peakPowerKw:i,_=b?p.exceedanceKwh:g,{days:S,monthDays:C,factor:h}=tt(t.range,t.customStart,t.customEnd),d=e.energy_fixed_fee*h,$=e.network_metering_rate*h,T=e.network_power_ref_rate*h,R=S<C?`${S}/${C} days`:"full month",V=y?p.energyCost:a*e.energy_variable_rate,ae=a*e.network_variable_rate,N=_*e.exceedance_rate,H=e.meter_monthly_fees??[],Le=H.reduce((w,M)=>w+(M.fee||0),0)*h,re=a*e.compensation_fund_rate,ne=a*e.electricity_tax_rate,j=Math.max(0,e.connect_discount??0)*h,X=d+V+$+T+ae+N+Le+re+ne-j,oe=X*e.vat_rate,ie=X+oe,Pe=(e.meters??[]).filter(w=>w.types.includes("production")),Fe=e.feed_in_rates??[],P=Pe.map(w=>{const M=Fe.find(U=>U.meter_id===w.id);if(M){const U=M.mode==="sensor"&&M.sensor_value!=null&&isFinite(M.sensor_value),ye=U?M.sensor_value:isFinite(M.tariff)?M.tariff:e.feed_in_tariff,qe=U?`Sensor (${u(ye,4)} ${e.currency??"EUR"}/kWh)`:"Fixed tariff";return{meterId:w.id,shortId:w.id?"…"+w.id.slice(-8):"Meter",rate:ye,label:qe,mode:M.mode}}return{meterId:w.id,shortId:w.id?"…"+w.id.slice(-8):"Meter",rate:e.feed_in_tariff,label:"Fixed tariff",mode:"fixed"}}),Y=P.filter(w=>isFinite(w.rate)&&w.rate>0),le=Y.length>0?Y.reduce((w,M)=>w+M.rate,0)/Y.length:e.feed_in_tariff,I=r*le,F=P.length>1,G=s.self_consumed||0,ce=G*(e.energy_variable_rate+e.network_variable_rate+e.electricity_tax_rate+e.compensation_fund_rate),de=ce*e.vat_rate,Z=ce+de,ue=Z+I,z=ie-I,pe=(e.gas_fixed_fee??6.5)*h,me=v*(e.gas_variable_rate??.055),he=(e.gas_network_fee??4.8)*h,ge=v*(e.gas_network_variable_rate??.012),fe=v*(e.gas_tax_rate??.001),B=pe+me+he+ge+fe,ve=B*(e.gas_vat_rate??.08),K=B+ve,E=e.currency||"EUR",x=w=>`${u(w,2)} ${E}`,J=t.range.replace("_"," ").replace(/\b\w/g,w=>w.toUpperCase()),Ae=_>0?`<div class="card exceedance-warning">
        <strong>⚠️ Reference Power Exceeded</strong>
        <p>Peak: <strong>${u(k,1)} kW</strong> &mdash; ${b?"Scheduled reference windows active":`Reference: ${u(m,1)} kW`}</p>
        <p>Total exceedance energy: <strong>${u(_,2)} kWh</strong></p>
        <p class="muted">Surcharge: ${x(N)}</p>
      </div>`:"",Ie=y?p.rateBreakdown.map(w=>`
            <tr>
              <td>${w.label} (${u(w.kwh)} kWh)</td>
              <td style="text-align: right;">${u(w.rate,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(w.kwh*w.rate)}</td>
            </tr>
          `).join(""):`
            <tr>
              <td>Variable (${u(a)} kWh)</td>
              <td style="text-align: right;">${u(e.energy_variable_rate,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(V)}</td>
            </tr>
          `,Ge=b?`Scheduled windows active (${f.length})`:`${u(m,1)} kW`,Oe=y?`Time-of-use windows active (${c.length})`:`${u(e.energy_variable_rate,4)} ${E}/kWh`;return`
    <section class="invoice-view">
      <div class="section-header">
        <h2>Cost Estimate &mdash; ${J}</h2>
        <div style="display: flex; gap: var(--sp-4); flex-wrap: wrap; margin-top: var(--sp-2);">
          <span class="badge" style="background: var(--clr-consumption-muted); color: var(--clr-consumption);">⚡ ${u(a)} kWh consumed</span>
          <span class="badge" style="background: var(--clr-production-muted); color: var(--clr-production);">☀️ ${u(n)} kWh produced</span>
          ${r>0?`<span class="badge" style="background: var(--clr-export-muted); color: var(--clr-export);">📤 ${u(r)} kWh exported</span>`:""}
          ${l?`<span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">🔥 ${u(v)} kWh gas (${u(o)} m³)</span>`:""}
        </div>
      </div>

      ${Ae}

      <div class="card invoice-card">
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Component</th>
              <th style="text-align: right;">Rate / Detail</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-label"><td colspan="3">Energy Supplier</td></tr>
            <tr>
              <td>Fixed Fee <span class="muted">(${R})</span></td>
              <td style="text-align: right;">${u(e.energy_fixed_fee,2)} ${E}/mo</td>
              <td style="text-align: right;">${x(d)}</td>
            </tr>
            ${Ie}

            <tr class="section-label"><td colspan="3">Network Operator</td></tr>
            <tr>
              <td>Metering <span class="muted">(${R})</span></td>
              <td style="text-align: right;">${u(e.network_metering_rate,2)} ${E}/mo</td>
              <td style="text-align: right;">${x($)}</td>
            </tr>
            <tr>
              <td>Power Reference (${Ge}) <span class="muted">(${R})</span></td>
              <td style="text-align: right;">${u(e.network_power_ref_rate,2)} ${E}/mo</td>
              <td style="text-align: right;">${x(T)}</td>
            </tr>
            <tr>
              <td>Variable (${u(a)} kWh)</td>
              <td style="text-align: right;">${u(e.network_variable_rate,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(ae)}</td>
            </tr>
            <tr class="${_>0?"exceedance-row":""}">
              <td>Exceedance (${u(_,2)} kWh over ref)</td>
              <td style="text-align: right;">${u(e.exceedance_rate,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(N)}</td>
            </tr>

            ${H.filter(w=>w.fee>0).length>0?`
            <tr class="section-label"><td colspan="3">Extra Meter Fees</td></tr>
            ${H.filter(w=>w.fee>0).map(w=>`
            <tr>
              <td>${w.label||"…"+w.meter_id.slice(-8)} <span class="muted">(${R})</span></td>
              <td style="text-align: right;">${u(w.fee,2)} ${E}/mo</td>
              <td style="text-align: right;">${x(w.fee*h)}</td>
            </tr>
            `).join("")}
            `:""}

            <tr class="section-label"><td colspan="3">Taxes & Levies</td></tr>
            <tr>
              <td>Compensation Fund</td>
              <td style="text-align: right;">${u(e.compensation_fund_rate,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(re)}</td>
            </tr>
            <tr>
              <td>Electricity Tax</td>
              <td style="text-align: right;">${u(e.electricity_tax_rate,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(ne)}</td>
            </tr>
            ${j>0?`
            <tr class="section-label"><td colspan="3">Discounts</td></tr>
            <tr>
              <td>Connect Discount <span class="muted">(${R})</span></td>
              <td style="text-align: right;">-${u(Math.max(0,e.connect_discount??0),2)} ${E}/mo</td>
              <td style="text-align: right;">-${x(j)}</td>
            </tr>
            `:""}

            <tr class="subtotal-row">
              <td colspan="2">Subtotal (excl. VAT)</td>
              <td style="text-align: right;"><strong>${x(X)}</strong></td>
            </tr>
            <tr>
              <td>VAT</td>
              <td style="text-align: right;">${u(e.vat_rate*100,0)}%</td>
              <td style="text-align: right;">${x(oe)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2"><strong>Total Costs</strong></td>
              <td style="text-align: right;"><strong>${x(ie)}</strong></td>
            </tr>

            ${r>0?`
            <tr class="section-label revenue-section"><td colspan="3">Feed-in Revenue</td></tr>
            ${P.map(w=>`
            <tr class="revenue-row">
              <td>Exported (${F?w.shortId:u(r)+" kWh"})</td>
              <td style="text-align: right;">${w.label}<br/>${u(w.rate,4)} ${E}/kWh</td>
              <td class="revenue-amount" style="text-align: right;">-${x(F?r/P.length*w.rate:r*w.rate)}</td>
            </tr>
            `).join("")}
            ${F?`
            <tr class="revenue-row">
              <td><em>Total feed-in (${u(r)} kWh, avg rate)</em></td>
              <td style="text-align: right;">${u(le,4)} ${E}/kWh</td>
              <td class="revenue-amount" style="text-align: right;">-${x(I)}</td>
            </tr>
            `:""}
            <tr class="net-total-row">
              <td colspan="2"><strong>Net Balance</strong></td>
              <td style="text-align: right;"><strong>${x(z)}</strong></td>
            </tr>
            `:""}
          </tbody>
        </table>
      </div>

      <div class="card invoice-footer">
        <p class="muted" style="line-height: var(--lh-relaxed);">
          This is an estimate based on your configured billing rates.
          Fixed monthly fees are prorated to the viewed period (${S} of ${C} days = ${u(h*100,1)}%).
          Supplier energy pricing: ${Oe}.
          Peak power (${u(k,1)} kW) is compared against ${b?"your scheduled reference windows":`your reference power (${u(m,1)} kW)`} &mdash; 
          every kWh consumed above the Referenzwert incurs a surcharge of ${u(e.exceedance_rate,4)} ${E}/kWh.
          Adjust rates in Settings.
        </p>
      </div>

      ${l?`
      <!-- Gas Cost Estimate -->
      <div class="card invoice-card gas-invoice-card">
        <h3 class="card-title"><span class="title-icon">🔥</span> Gas Cost Estimate &mdash; ${J}</h3>
        <div style="display: flex; gap: var(--sp-4); flex-wrap: wrap; margin-bottom: var(--sp-4);">
          <span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">🔥 ${u(v)} kWh</span>
          <span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">📐 ${u(o)} m³</span>
        </div>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Component</th>
              <th style="text-align: right;">Rate / Detail</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-label"><td colspan="3">Gas Supplier</td></tr>
            <tr>
              <td>Fixed Fee <span class="muted">(${R})</span></td>
              <td style="text-align: right;">${u(e.gas_fixed_fee??6.5,2)} ${E}/mo</td>
              <td style="text-align: right;">${x(pe)}</td>
            </tr>
            <tr>
              <td>Energy (${u(v)} kWh)</td>
              <td style="text-align: right;">${u(e.gas_variable_rate??.055,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(me)}</td>
            </tr>

            <tr class="section-label"><td colspan="3">Gas Network</td></tr>
            <tr>
              <td>Network Fee <span class="muted">(${R})</span></td>
              <td style="text-align: right;">${u(e.gas_network_fee??4.8,2)} ${E}/mo</td>
              <td style="text-align: right;">${x(he)}</td>
            </tr>
            <tr>
              <td>Network Variable (${u(v)} kWh)</td>
              <td style="text-align: right;">${u(e.gas_network_variable_rate??.012,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(ge)}</td>
            </tr>

            <tr class="section-label"><td colspan="3">Gas Tax</td></tr>
            <tr>
              <td>Gas Tax (${u(v)} kWh)</td>
              <td style="text-align: right;">${u(e.gas_tax_rate??.001,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(fe)}</td>
            </tr>

            <tr class="subtotal-row">
              <td colspan="2">Subtotal (excl. VAT)</td>
              <td style="text-align: right;"><strong>${x(B)}</strong></td>
            </tr>
            <tr>
              <td>VAT</td>
              <td style="text-align: right;">${u((e.gas_vat_rate??.08)*100,0)}%</td>
              <td style="text-align: right;">${x(ve)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2"><strong>Total Gas Costs</strong></td>
              <td style="text-align: right;"><strong>${x(K)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card invoice-footer">
        <p class="muted" style="line-height: var(--lh-relaxed);">
          <strong>Combined Energy Total: ${x(z+K)}</strong>
          (Electricity: ${x(z)} + Gas: ${x(K)})
        </p>
      </div>
      `:""}

      ${n>0?`
      <!-- Solar Revenue Tracking -->
      <div class="card solar-revenue-card">
        <h3 class="card-title"><span class="title-icon">☀️</span> Solar Panel Revenue &mdash; ${J}</h3>
        <div class="solar-revenue-summary">
          <div class="solar-stat solar-stat-primary">
            <div class="solar-stat-value">${x(ue)}</div>
            <div class="solar-stat-label">Total Solar Value</div>
          </div>
          <div class="solar-stat">
            <div class="solar-stat-value">${x(Z)}</div>
            <div class="solar-stat-label">Savings (self-consumed)</div>
          </div>
          <div class="solar-stat">
            <div class="solar-stat-value">${x(I)}</div>
            <div class="solar-stat-label">Feed-in revenue</div>
          </div>
        </div>

        <table class="invoice-table solar-table">
          <thead>
            <tr>
              <th>Component</th>
              <th style="text-align: right;">Detail</th>
              <th style="text-align: right;">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-label"><td colspan="3">Self-Consumption Savings</td></tr>
            <tr>
              <td>Energy not bought (${u(G)} kWh)</td>
              <td style="text-align: right;">${u(e.energy_variable_rate,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(G*e.energy_variable_rate)}</td>
            </tr>
            <tr>
              <td>Network fees avoided</td>
              <td style="text-align: right;">${u(e.network_variable_rate,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(G*e.network_variable_rate)}</td>
            </tr>
            <tr>
              <td>Taxes & levies avoided</td>
              <td style="text-align: right;">${u(e.electricity_tax_rate+e.compensation_fund_rate,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(G*(e.electricity_tax_rate+e.compensation_fund_rate))}</td>
            </tr>
            <tr>
              <td>VAT saved</td>
              <td style="text-align: right;">${u(e.vat_rate*100,0)}%</td>
              <td style="text-align: right;">${x(de)}</td>
            </tr>
            <tr class="subtotal-row">
              <td colspan="2"><strong>Self-Consumption Savings</strong></td>
              <td style="text-align: right;"><strong>${x(Z)}</strong></td>
            </tr>

            ${r>0?`
            <tr class="section-label"><td colspan="3">Feed-in Revenue</td></tr>
            ${P.map(w=>`
            <tr>
              <td>Sold to grid ${F?`(${w.shortId})`:`(${u(r)} kWh)`}</td>
              <td style="text-align: right;">${w.label}<br/>${u(w.rate,4)} ${E}/kWh</td>
              <td style="text-align: right;">${x(F?r/P.length*w.rate:r*w.rate)}</td>
            </tr>
            `).join("")}
            ${F?`
            <tr class="subtotal-row">
              <td colspan="2"><strong>Total Feed-in Revenue</strong></td>
              <td style="text-align: right;"><strong>${x(I)}</strong></td>
            </tr>
            `:""}
            `:""}

            <tr class="total-row solar-total-row">
              <td colspan="2"><strong>💰 Total Solar Panel Value</strong></td>
              <td style="text-align: right;"><strong>${x(ue)}</strong></td>
            </tr>
          </tbody>
        </table>

        <p class="muted" style="margin-top: var(--sp-3); font-size: var(--text-xs); line-height: var(--lh-relaxed);">
          Self-consumption savings = energy you produced and used yourself instead of buying from the grid.
          Feed-in revenue = money earned by selling surplus production.
          ${P.some(w=>w.mode==="sensor")?"Market price sourced from Home Assistant sensor.":"Using fixed feed-in tariff — configure a market price sensor in Settings for real-time rates."}
          ${F?"Revenue split equally across production meters (per-meter export data not yet available).":""}
        </p>
      </div>
      `:""}
    </section>
  `}const it=[{value:"all",label:"Every day"},{value:"weekdays",label:"Weekdays"},{value:"weekends",label:"Weekends"}],lt=[{title:"Energy Supplier",icon:"⚡",fields:[{key:"energy_fixed_fee",label:"Fixed Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"energy_variable_rate",label:"Variable Rate",step:"0.00001",unit:"EUR/kWh",type:"number"}]},{title:"Network Operator",icon:"🔌",fields:[{key:"network_metering_rate",label:"Metering Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"network_power_ref_rate",label:"Power Reference Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"network_variable_rate",label:"Variable Rate",step:"0.0001",unit:"EUR/kWh",type:"number"}]},{title:"Reference Power & Exceedance",icon:"📏",fields:[{key:"reference_power_kw",label:"Reference Power (Referenzwert)",step:"0.1",unit:"kW",type:"number"},{key:"exceedance_rate",label:"Exceedance Surcharge",step:"0.0001",unit:"EUR/kWh",type:"number"}]},{title:"Reference Power Windows",icon:"⏱️",fields:[]},{title:"Time-of-Use Tariffs",icon:"🕒",fields:[]},{title:"Feed-in / Selling",icon:"💶",fields:[]},{title:"Gas Billing",icon:"🔥",fields:[{key:"gas_fixed_fee",label:"Supplier Fixed Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"gas_variable_rate",label:"Supplier Variable Rate",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"gas_network_fee",label:"Network Fixed Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"gas_network_variable_rate",label:"Network Variable Rate",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"gas_tax_rate",label:"Gas Tax",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"gas_vat_rate",label:"Gas VAT Rate",step:"0.01",unit:"decimal (0.08 = 8%)",type:"number"}]},{title:"Meter Fees",icon:"📊",fields:[]},{title:"Taxes & Levies",icon:"🏛️",fields:[{key:"compensation_fund_rate",label:"Compensation Fund",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"electricity_tax_rate",label:"Electricity Tax",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"vat_rate",label:"VAT Rate",step:"0.01",unit:"decimal (0.08 = 8%)",type:"number"}]},{title:"Discounts",icon:"💸",fields:[{key:"connect_discount",label:"Connect Discount",step:"0.01",unit:"EUR/mo",type:"number"}]},{title:"General",icon:"⚙️",fields:[{key:"currency",label:"Currency",step:"",unit:"",type:"text"}]}],ct={consumption:"Power Consumption",production:"Power Production",gas:"Gas Consumption"},Me={consumption:"⚡",production:"☀️",gas:"🔥"};function dt(t){return t.map(e=>`<span class="meter-type-badge meter-type-${e}">${Me[e]??""} ${ct[e]??e}</span>`).join(" ")}function Se(t,e,s){const a=t+1;return s?`
      <div class="meter-card">
        <div class="meter-header">
          <strong>Meter ${a}</strong>
          <code class="meter-id">${e.id?"..."+e.id.slice(-8):"—"}</code>
        </div>
        <div class="meter-types">${dt(e.types)}</div>
      </div>
    `:`
    <div class="meter-card">
      <div class="meter-header">
        <strong>Meter ${a}</strong>
        ${a>1?`<button type="button" class="btn-icon remove-meter-btn" data-meter="${t}" title="Remove meter">&times;</button>`:""}
      </div>
      <div class="form-row">
        <label for="meter-id-${t}">Metering Point ID</label>
        <div class="input-group">
          <input
            id="meter-id-${t}"
            name="meter_${t}_id"
            type="text"
            value="${e.id??""}"
            placeholder="e.g. LUXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
          />
        </div>
      </div>
      <div class="form-row">
        <label>This meter measures</label>
        <div class="meter-type-checkboxes">
          <label class="meter-type-cb">
            <input type="checkbox" name="meter_${t}_consumption" ${e.types.includes("consumption")?"checked":""} />
            <span>⚡ Power Consumption</span>
          </label>
          <label class="meter-type-cb">
            <input type="checkbox" name="meter_${t}_production" ${e.types.includes("production")?"checked":""} />
            <span>☀️ Power Production</span>
          </label>
          <label class="meter-type-cb">
            <input type="checkbox" name="meter_${t}_gas" ${e.types.includes("gas")?"checked":""} />
            <span>🔥 Gas Consumption</span>
          </label>
        </div>
      </div>
    </div>
  `}function De(t){return it.map(e=>`<option value="${e.value}" ${e.value===t?"selected":""}>${e.label}</option>`).join("")}function ut(t,e){return`
    <div class="meter-card">
      <div class="meter-header">
        <strong>Tariff Window ${t+1}</strong>
        <button type="button" class="btn-icon remove-consumption-window-btn" data-window="${t}" title="Remove tariff window">&times;</button>
      </div>
      <div class="form-row">
        <label for="consumption-window-${t}-label">Label</label>
        <div class="input-group">
          <input id="consumption-window-${t}-label" name="consumption_window_${t}_label" type="text" value="${e.label??""}" placeholder="e.g. Night / Drive / Weekend" />
        </div>
      </div>
      <div class="form-row">
        <label for="consumption-window-${t}-day-group">Active days</label>
        <div class="input-group">
          <select id="consumption-window-${t}-day-group" name="consumption_window_${t}_day_group">
            ${De(e.day_group??"all")}
          </select>
        </div>
      </div>
      <div class="form-row">
        <label>Time window</label>
        <div class="input-group schedule-window-inputs">
          <input name="consumption_window_${t}_start_time" type="time" value="${e.start_time??"00:00"}" />
          <span class="input-unit">to</span>
          <input name="consumption_window_${t}_end_time" type="time" value="${e.end_time??"06:00"}" />
        </div>
      </div>
      <div class="form-row">
        <label for="consumption-window-${t}-rate">Supplier rate</label>
        <div class="input-group">
          <input id="consumption-window-${t}-rate" name="consumption_window_${t}_rate" type="number" step="0.0001" value="${e.rate??0}" />
          <span class="input-unit">EUR/kWh</span>
        </div>
      </div>
    </div>
  `}function pt(t,e){return`
    <div class="meter-card">
      <div class="meter-header">
        <strong>Reference Window ${t+1}</strong>
        <button type="button" class="btn-icon remove-reference-window-btn" data-window="${t}" title="Remove reference window">&times;</button>
      </div>
      <div class="form-row">
        <label for="reference-window-${t}-label">Label</label>
        <div class="input-group">
          <input id="reference-window-${t}-label" name="reference_window_${t}_label" type="text" value="${e.label??""}" placeholder="e.g. Evening / Charging hours" />
        </div>
      </div>
      <div class="form-row">
        <label for="reference-window-${t}-day-group">Active days</label>
        <div class="input-group">
          <select id="reference-window-${t}-day-group" name="reference_window_${t}_day_group">
            ${De(e.day_group??"all")}
          </select>
        </div>
      </div>
      <div class="form-row">
        <label>Time window</label>
        <div class="input-group schedule-window-inputs">
          <input name="reference_window_${t}_start_time" type="time" value="${e.start_time??"17:00"}" />
          <span class="input-unit">to</span>
          <input name="reference_window_${t}_end_time" type="time" value="${e.end_time??"00:00"}" />
        </div>
      </div>
      <div class="form-row">
        <label for="reference-window-${t}-power">Reference power</label>
        <div class="input-group">
          <input id="reference-window-${t}-power" name="reference_window_${t}_reference_power_kw" type="number" step="0.1" value="${e.reference_power_kw??5}" />
          <span class="input-unit">kW</span>
        </div>
      </div>
    </div>
  `}function mt(t,e="ha",s){if(!t&&e==="ha")return`
      <section class="settings-view">
        <div class="card">
          <p class="muted">Loading configuration…</p>
        </div>
      </section>
    `;const a=e==="standalone"?(s==null?void 0:s.meters)??[{id:"",types:["consumption"]}]:(t==null?void 0:t.meters)??[];let n="";if(e==="standalone"){const h=a.map((d,$)=>Se($,d,!1)).join("");n=`
      <div class="section-header">
        <h2>API Connection</h2>
        <span class="muted">Configure your Leneda API credentials and metering points</span>
      </div>
      <div class="card" style="margin-bottom: var(--sp-6);">
        <form id="credentials-form">
          <div class="form-section">
            <div class="form-section-title">🔑  Leneda API Credentials</div>
            <div class="form-row">
              <label for="cfg-api_key">API Key</label>
              <div class="input-group">
                <input
                  id="cfg-api_key"
                  name="api_key"
                  type="password"
                  value="${(s==null?void 0:s.api_key)??""}"
                  placeholder="Enter your Leneda API key"
                />
              </div>
            </div>
            <div class="form-row">
              <label for="cfg-energy_id">Energy ID</label>
              <div class="input-group">
                <input
                  id="cfg-energy_id"
                  name="energy_id"
                  type="text"
                  value="${(s==null?void 0:s.energy_id)??""}"
                  placeholder="e.g. LU-123-456-789"
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="form-section-title">📊  Metering Points</div>
            <p class="muted" style="margin: 0 0 var(--sp-3) 0; font-size: 0.85rem;">
              For each meter, select what it measures. A single bidirectional meter can handle both consumption and production.
            </p>
            <div id="meters-container">
              ${h}
            </div>
            ${a.length<10?`
            <button type="button" id="add-meter-btn" class="btn btn-outline" style="margin-top: var(--sp-3);">
              + Add Metering Point
            </button>
            `:""}
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save Credentials</button>
            <button type="button" id="test-creds-btn" class="btn btn-outline">Test Connection</button>
          </div>
          <div id="creds-status"></div>
        </form>
      </div>
    `}else{const h=(t==null?void 0:t.meters)??[];n=`
      <div class="card" style="margin-bottom: var(--sp-6); padding: var(--sp-4) var(--sp-5);">
        <p class="muted" style="margin: 0 0 var(--sp-3) 0;">🔒 API credentials are managed through Home Assistant &rarr; Settings &rarr; Integrations &rarr; Leneda</p>
        <div class="form-section">
          <div class="form-section-title">📊  Configured Metering Points</div>
          <div id="meters-container">
            ${h.length>0?h.map(($,T)=>Se(T,$,!0)).join(""):'<p class="muted">No meters configured</p>'}
          </div>
        </div>
      </div>
    `}const r=h=>h.map(d=>{const $=t?t[d.key]??"":"";return`
        <div class="form-row">
          <label for="cfg-${d.key}">${d.label}</label>
          <div class="input-group">
            <input
              id="cfg-${d.key}"
              name="${d.key}"
              type="${d.type}"
              ${d.type==="number"?`step="${d.step}"`:""}
              value="${$}"
            />
            ${d.unit?`<span class="input-unit">${d.unit}</span>`:""}
          </div>
        </div>
      `}).join(""),i=((t==null?void 0:t.meters)??[]).filter(h=>h.types.includes("production")),m=(t==null?void 0:t.feed_in_rates)??[],g=e==="ha";function v(h){return m.find(d=>d.meter_id===h)??{meter_id:h,mode:"fixed",tariff:(t==null?void 0:t.feed_in_tariff)??.08,sensor_entity:""}}const o=i.length===0?'<p class="muted">No production meters configured — add a meter with Power Production type above.</p>':i.map((h,d)=>{const $=v(h.id),T=h.id?"…"+h.id.slice(-8):`Meter ${d+1}`;return`
          <div class="feed-in-meter-card" data-meter-idx="${d}" data-meter-id="${h.id}">
            <div class="feed-in-meter-header">
              <span class="meter-type-badge meter-type-production">☀️ ${T}</span>
              <input type="hidden" name="feed_in_rate_${d}_meter_id" value="${h.id}" />
            </div>
            <div class="form-row">
              <label>Pricing Mode</label>
              <div class="feed-in-mode-toggle">
                <label class="mode-option">
                  <input type="radio" name="feed_in_rate_${d}_mode" value="fixed" ${$.mode==="fixed"?"checked":""} />
                  <span class="mode-label">💶 Fixed Tariff</span>
                </label>
                <label class="mode-option">
                  <input type="radio" name="feed_in_rate_${d}_mode" value="sensor" ${$.mode==="sensor"?"checked":""} />
                  <span class="mode-label">📡 HA Sensor</span>
                </label>
              </div>
            </div>
            <div class="feed-in-fixed-fields" data-rate-idx="${d}" style="${$.mode==="fixed"?"":"display:none"}">
              <div class="form-row">
                <label for="cfg-feed_in_rate_${d}_tariff">Feed-in Tariff</label>
                <div class="input-group">
                  <input id="cfg-feed_in_rate_${d}_tariff" name="feed_in_rate_${d}_tariff" type="number" step="0.0001" value="${$.tariff}" />
                  <span class="input-unit">EUR/kWh</span>
                </div>
              </div>
            </div>
            <div class="feed-in-sensor-fields" data-rate-idx="${d}" style="${$.mode==="sensor"?"":"display:none"}">
              <div class="form-row">
                <label for="cfg-feed_in_rate_${d}_sensor">Market Price Sensor</label>
                <div class="input-group sensor-picker-group">
                  <input
                    id="cfg-feed_in_rate_${d}_sensor"
                    name="feed_in_rate_${d}_sensor_entity"
                    type="text"
                    value="${$.sensor_entity}"
                    placeholder="${g?"sensor.electricity_price":"sensor.electricity_price (HA mode only)"}"
                    list="ha-entity-list"
                  />
                  <span class="input-unit">entity_id</span>
                </div>
                ${g&&d===0?'<datalist id="ha-entity-list"></datalist>':""}
              </div>
              <div class="form-row">
                <label for="cfg-feed_in_rate_${d}_fallback">Fallback Tariff</label>
                <div class="input-group">
                  <input id="cfg-feed_in_rate_${d}_fallback" name="feed_in_rate_${d}_fallback_tariff" type="number" step="0.0001" value="${$.tariff}" />
                  <span class="input-unit">EUR/kWh</span>
                </div>
                <p class="muted" style="font-size: var(--text-xs); margin-top: var(--sp-1);">
                  Used when the sensor is unavailable.
                </p>
              </div>
            </div>
          </div>
        `}).join(""),l=((t==null?void 0:t.meters)??[]).some(h=>h.types.includes("gas"))||(t==null?void 0:t.meter_has_gas),c=(t==null?void 0:t.consumption_rate_windows)??[],f=(t==null?void 0:t.reference_power_windows)??[],p=(t==null?void 0:t.meters)??[],y=(t==null?void 0:t.meter_monthly_fees)??[];function b(h){return y.find(d=>d.meter_id===h)??{meter_id:h,label:"",fee:0}}const k=p.length===0?'<p class="muted">No meters configured.</p>':p.map((h,d)=>{const $=b(h.id),T=h.id?"…"+h.id.slice(-8):`Meter ${d+1}`;return`
          <div class="meter-fee-card" style="margin-bottom: var(--sp-3); padding: var(--sp-3); border: 1px solid var(--clr-border); border-radius: var(--radius);">
            <div style="display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2);">
              <span>${h.types.map(V=>Me[V]??"").join(" ")}</span>
              <code style="font-size: var(--text-sm);">${T}</code>
              <input type="hidden" name="meter_fee_${d}_meter_id" value="${h.id}" />
            </div>
            <div class="form-row" style="margin-bottom: var(--sp-2);">
              <label for="cfg-meter_fee_${d}_label">Label</label>
              <div class="input-group">
                <input id="cfg-meter_fee_${d}_label" name="meter_fee_${d}_label" type="text" value="${$.label||`Meter ${d+1} metering fee`}" placeholder="e.g. Smart meter rental" />
              </div>
            </div>
            <div class="form-row">
              <label for="cfg-meter_fee_${d}_fee">Monthly Fee</label>
              <div class="input-group">
                <input id="cfg-meter_fee_${d}_fee" name="meter_fee_${d}_fee" type="number" step="0.01" value="${$.fee}" />
                <span class="input-unit">EUR/mo</span>
              </div>
            </div>
          </div>
        `}).join(""),_=`
    <p class="muted" style="margin: 0 0 var(--sp-3) 0; font-size: 0.85rem;">
      Optional supplier-rate windows. Outside these windows, the base <strong>Energy Supplier → Variable Rate</strong> is used.
      Windows can cross midnight by setting an end time earlier than the start time.
    </p>
    <div id="consumption-windows-container">
      ${c.length>0?c.map((h,d)=>ut(d,h)).join(""):'<p class="muted">No time-of-use windows configured. Using the flat supplier rate.</p>'}
    </div>
    <button type="button" id="add-consumption-window-btn" class="btn btn-outline" style="margin-top: var(--sp-3);">
      + Add Tariff Window
    </button>
  `,S=`
    <p class="muted" style="margin: 0 0 var(--sp-3) 0; font-size: 0.85rem;">
      Optional reference-power overrides for specific hours. Outside these windows, the base reference power above is used.
    </p>
    <div id="reference-windows-container">
      ${f.length>0?f.map((h,d)=>pt(d,h)).join(""):'<p class="muted">No scheduled reference windows configured. Using one reference power all day.</p>'}
    </div>
    <button type="button" id="add-reference-window-btn" class="btn btn-outline" style="margin-top: var(--sp-3);">
      + Add Reference Window
    </button>
  `,C=lt.map(h=>{if(h.title==="Gas Billing"&&!l||h.title==="Meter Fees"&&p.length<2)return"";let d;return h.title==="Feed-in / Selling"?d=o:h.title==="Time-of-Use Tariffs"?d=_:h.title==="Reference Power Windows"?d=S:h.title==="Discounts"?d=`<p class="muted" style="margin: 0 0 var(--sp-3) 0; font-size: 0.85rem;">
        Positive values are treated as a monthly credit. The dashboard prorates it to the selected period and subtracts it before VAT.
      </p>`+r(h.fields):h.title==="Meter Fees"?d=`<p class="muted" style="margin: 0 0 var(--sp-3) 0; font-size: 0.85rem;">
        Each metering point has a fixed monthly rental/metering fee. Set the cost per meter below.
      </p>`+k:d=r(h.fields),`
    <div class="form-section">
      <div class="form-section-title">${h.icon}  ${h.title}</div>
      ${d}
    </div>
  `}).join("");return`
    <section class="settings-view">
      ${n}

      <div class="section-header">
        <h2>Billing Configuration</h2>
        <span class="muted">Luxembourg energy billing rates &mdash; adjust values to match your contract</span>
      </div>

      <div class="card">
        <form id="settings-form">
          ${t?C:'<p class="muted">Loading configuration…</p>'}
          ${t?`
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save Configuration</button>
            <button type="button" id="reset-config-btn" class="btn btn-outline">Reset to Defaults</button>
          </div>
          `:""}
        </form>
      </div>
    </section>
  `}function Q(t,e,s=!1,a="dark"){return`
    <header class="navbar" role="navigation" aria-label="Main navigation">
      <div class="navbar-brand">
        <img src="/leneda-panel/static/logo.png" srcset="/leneda-panel/static/logo@2x.png 2x" alt="Leneda Logo" class="navbar-logo-img" />
 
        <button class="menu-toggle ${s?"open":""}" aria-label="Toggle menu" aria-expanded="${s}">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <nav class="navbar-tabs ${s?"mobile-open":""}" role="tablist">
        ${[{id:"dashboard",label:"Dashboard",icon:"🏠"},{id:"sensors",label:"Sensors",icon:"📊"},{id:"invoice",label:"Invoice",icon:"💰"},{id:"settings",label:"Settings",icon:"⚙️"}].map(r=>`
          <button
            class="nav-btn ${r.id===t?"active":""}"
            data-tab="${r.id}"
            role="tab"
            aria-selected="${r.id===t}"
            aria-controls="panel-${r.id}"
          >
            <span class="nav-icon" aria-hidden="true">${r.icon}</span>
            <span class="nav-label">${r.label}</span>
          </button>
        `).join("")}

        <div class="navbar-actions">
            <button
              class="theme-toggle"
              type="button"
              data-theme-toggle
              title="Switch to ${a==="dark"?"light":"dark"} mode"
              aria-label="Switch to ${a==="dark"?"light":"dark"} mode"
            >
              <span class="theme-toggle-icon" aria-hidden="true">${a==="dark"?"☀️":"🌙"}</span>
              <span class="theme-toggle-label">${a==="dark"?"Light":"Dark"} mode</span>
            </button>

            <a href="https://buymeacoffee.com/koosoli" target="_blank" rel="noopener noreferrer" 
               class="navbar-cta"
            >
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="currentColor"><path d="M20,3H4v10c0,2.21,1.79,4,4,4h6c2.21,0,4-1.79,4-4v-3h2c1.1,0,2-0.9,2-2V5C22,3.9,21.1,3,20,3z M20,8h-2V5h2V8z M18,15H4v-1h14V15z M18,12H4V5h14V12z"/></svg>
              <span>Support Project</span>
            </a>

            <a href="https://github.com/koosoli/Leneda-HACS-integration" target="_blank" rel="noopener noreferrer"
               class="navbar-icon-link"
               title="View Project on GitHub">
              <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
        </div>
      </nav>
    </header>
  `}const We="leneda_credentials",Re="leneda_theme";function ht(){try{const t=localStorage.getItem(We);if(t)return JSON.parse(t)}catch{}return null}function ee(t){try{localStorage.setItem(We,JSON.stringify(t))}catch{}}function gt(){var t;try{const e=localStorage.getItem(Re);if(e==="dark"||e==="light")return e}catch{}return(t=window.matchMedia)!=null&&t.call(window,"(prefers-color-scheme: light)").matches?"light":"dark"}function ft(t){try{localStorage.setItem(Re,t)}catch{}}class vt{constructor(e){A(this,"root");A(this,"state",{tab:"dashboard",range:"yesterday",customStart:"",customEnd:"",chartUnit:"kw",rangeData:null,consumptionTimeseries:null,sensors:null,config:null,loading:!0,error:null,mode:"ha",credentials:null,isMenuOpen:!1,theme:gt()});A(this,"preZoomRange",null);A(this,"preZoomCustomStart","");A(this,"preZoomCustomEnd","");this.root=e}async mount(){this.applyTheme(),this.render();const e=await Ce();if(this.state.mode=e.mode,e.mode==="standalone"){const s=ht();if(s&&(this.state.credentials=s),!e.configured&&!s){this.state.tab="settings",this.state.loading=!1,this.state.error="Please configure your Leneda API credentials in Settings.",this.render();return}if(!e.configured&&s)try{const{saveCredentials:a}=await W(async()=>{const{saveCredentials:n}=await Promise.resolve().then(()=>L);return{saveCredentials:n}},void 0);await a(s)}catch{}if(!s)try{this.state.credentials=await Ee()}catch{}}await this.loadData()}async loadData(){this.state.loading=!0,this.state.error=null,this.render();try{const[e,s,a]=await Promise.all([te(this.state.range),se(),q()]),{start:n,end:r}=this.getDateRangeISO(),i=await O("1-1:1.29.0",n,r);this.state.rangeData=e,this.state.consumptionTimeseries=i,this.state.sensors=s,this.state.config=a}catch(e){this.state.error=e instanceof Error?e.message:"Failed to load data"}finally{this.state.loading=!1,this.render()}}async changeRange(e){if(this.preZoomRange=null,this.state.range=e,e==="custom"){if(!this.state.customStart||!this.state.customEnd){const s=new Date;s.setDate(s.getDate()-1);const a=new Date(s);a.setDate(a.getDate()-6),this.state.customStart=a.toISOString().slice(0,10),this.state.customEnd=s.toISOString().slice(0,10)}this.render();return}this.state.loading=!0,this.render();try{const{start:s,end:a}=this.getDateRangeISO(),[n,r]=await Promise.all([te(e),O("1-1:1.29.0",s,a)]);this.state.rangeData=n,this.state.consumptionTimeseries=r}catch(s){this.state.error=s instanceof Error?s.message:"Failed to load data"}finally{this.state.loading=!1,this.render()}}async applyCustomRange(){this.preZoomRange=null;const{customStart:e,customEnd:s}=this.state;if(!(!e||!s)){this.state.loading=!0,this.render();try{const{fetchCustomData:a}=await W(async()=>{const{fetchCustomData:i}=await Promise.resolve().then(()=>L);return{fetchCustomData:i}},void 0),[n,r]=await Promise.all([a(e,s),O("1-1:1.29.0",new Date(e+"T00:00:00").toISOString(),new Date(s+"T23:59:59.999").toISOString())]);this.state.rangeData={range:"custom",consumption:n.consumption,production:n.production,exported:n.exported??0,self_consumed:n.self_consumed??0,gas_energy:n.gas_energy??0,gas_volume:n.gas_volume??0,peak_power_kw:n.peak_power_kw??0,exceedance_kwh:n.exceedance_kwh??0,metering_point:n.metering_point??""},this.state.consumptionTimeseries=r}catch(a){this.state.error=a instanceof Error?a.message:"Failed to load custom data"}finally{this.state.loading=!1,this.render()}}}changeTab(e){this.state.tab=e,this.render(),e==="sensors"&&!this.state.sensors&&se().then(s=>{this.state.sensors=s,this.render()}),e==="settings"&&!this.state.config&&q().then(s=>{this.state.config=s,this.render()}),this.state.isMenuOpen=!1}toggleMenu(){this.state.isMenuOpen=!this.state.isMenuOpen,this.render()}applyTheme(){document.documentElement.dataset.theme=this.state.theme}setTheme(e){e!==this.state.theme&&(this.state.theme=e,ft(e),this.applyTheme(),this.render())}toggleTheme(){this.setTheme(this.state.theme==="dark"?"light":"dark")}getMainContentScrollTop(){const e=this.root.querySelector(".main-content");return e?e.scrollTop:window.scrollY||document.documentElement.scrollTop||0}restoreMainContentScrollTop(e){requestAnimationFrame(()=>{const s=this.root.querySelector(".main-content");s?s.scrollTop=e:window.scrollTo({top:e})})}renderPreserveMainScroll(){const e=this.getMainContentScrollTop();this.render(),this.restoreMainContentScrollTop(e)}render(){var i;const{tab:e,loading:s,error:a,theme:n}=this.state;if(s&&!this.state.rangeData){this.root.innerHTML=`
        <div class="app-shell">
          ${Q(e,m=>{},!1,n)}
          <main class="main-content">
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading Leneda data…</p>
            </div>
          </main>
        </div>
      `,this.attachNavListeners();return}if(a&&!this.state.rangeData){this.root.innerHTML=`
        <div class="app-shell">
          ${Q(e,m=>{},!1,n)}
          <main class="main-content">
            <div class="error-state">
              <h2>Connection Error</h2>
              <p>${a}</p>
              <button class="btn btn-primary" id="retry-btn">Retry</button>
            </div>
          </main>
        </div>
      `,this.attachNavListeners(),(i=this.root.querySelector("#retry-btn"))==null||i.addEventListener("click",()=>this.loadData());return}let r="";switch(e){case"dashboard":r=ke(this.state);break;case"sensors":r=et(this.state.sensors);break;case"invoice":r=ot(this.state);break;case"settings":r=mt(this.state.config,this.state.mode,this.state.credentials);break}this.root.innerHTML=`
      <div class="app-shell">
        ${Q(e,m=>this.changeTab(m),this.state.isMenuOpen,n)}
        <main class="main-content">
          ${s?'<div class="loading-bar"></div>':""}
          ${r}
        </main>
      </div>
    `,this.attachNavListeners(),this.attachDashboardListeners(),this.attachSettingsListeners()}attachNavListeners(){var e,s;(e=this.root.querySelector(".menu-toggle"))==null||e.addEventListener("click",()=>{this.toggleMenu()}),(s=this.root.querySelector("[data-theme-toggle]"))==null||s.addEventListener("click",()=>{this.toggleTheme()}),this.root.querySelectorAll("[data-tab]").forEach(a=>{a.addEventListener("click",()=>{const n=a.dataset.tab;this.changeTab(n)})})}attachDashboardListeners(e=!1){this.root.querySelectorAll("[data-range]").forEach(i=>{i.addEventListener("click",()=>{const m=i.dataset.range;this.changeRange(m)})});const s=this.root.querySelector("#custom-start"),a=this.root.querySelector("#custom-end");s&&s.addEventListener("change",()=>{this.state.customStart=s.value}),a&&a.addEventListener("change",()=>{this.state.customEnd=a.value});const n=this.root.querySelector("#apply-custom-range");if(n==null||n.addEventListener("click",()=>this.applyCustomRange()),this.root.querySelectorAll("[data-chart-unit]").forEach(i=>{i.addEventListener("click",()=>{const m=i.dataset.chartUnit;m!==this.state.chartUnit&&(this.state.chartUnit=m,this.render())})}),!e){const i=this.root.querySelector("#energy-chart");i&&this.state.rangeData&&this.initChart(i)}const r=this.root.querySelector(".reset-zoom-btn");r==null||r.addEventListener("click",async()=>{const{resetChartZoom:i}=await W(async()=>{const{resetChartZoom:m}=await import("./Charts-CD10JIPH.js");return{resetChartZoom:m}},[]);if(i(),r.style.display="none",this.preZoomRange!==null){const m=this.preZoomRange;this.state.customStart=this.preZoomCustomStart,this.state.customEnd=this.preZoomCustomEnd,this.preZoomRange=null,this.preZoomCustomStart="",this.preZoomCustomEnd="",m==="custom"?(this.state.range="custom",this.applyCustomRange()):this.changeRange(m)}else this.changeRange(this.state.range==="custom"?"yesterday":this.state.range)})}attachSettingsListeners(){var g,v;const e=this.root.querySelector("#credentials-form");if(e){const o=this.root.querySelector("#add-meter-btn");o==null||o.addEventListener("click",()=>{var y,b;const f=new FormData(e),p=l(f);if(p.length<10){p.push({id:"",types:["consumption"]});const k={api_key:f.get("api_key")||((y=this.state.credentials)==null?void 0:y.api_key)||"",energy_id:f.get("energy_id")||((b=this.state.credentials)==null?void 0:b.energy_id)||"",meters:p};this.state.credentials=k,ee(k),this.renderPreserveMainScroll()}}),this.root.querySelectorAll(".remove-meter-btn").forEach(f=>{f.addEventListener("click",()=>{var _,S;const p=parseInt(f.dataset.meter??"0",10),y=new FormData(e),b=l(y);b.splice(p,1);const k={api_key:y.get("api_key")||((_=this.state.credentials)==null?void 0:_.api_key)||"",energy_id:y.get("energy_id")||((S=this.state.credentials)==null?void 0:S.energy_id)||"",meters:b};this.state.credentials=k,ee(k),this.renderPreserveMainScroll()})});const l=f=>{var y,b,k;const p=[];for(let _=0;_<10;_++){const S=f.get(`meter_${_}_id`);if(S===null)break;const C=[];(y=e.querySelector(`[name="meter_${_}_consumption"]`))!=null&&y.checked&&C.push("consumption"),(b=e.querySelector(`[name="meter_${_}_production"]`))!=null&&b.checked&&C.push("production"),(k=e.querySelector(`[name="meter_${_}_gas"]`))!=null&&k.checked&&C.push("gas"),p.push({id:S.trim(),types:C})}return p};e.addEventListener("submit",async f=>{f.preventDefault();const p=new FormData(e),y={api_key:p.get("api_key"),energy_id:p.get("energy_id"),meters:l(p)},b=this.root.querySelector("#creds-status");try{ee(y);const{saveCredentials:k}=await W(async()=>{const{saveCredentials:_}=await Promise.resolve().then(()=>L);return{saveCredentials:_}},void 0);await k(y),b&&(b.innerHTML='<p style="color: var(--clr-production); padding: var(--sp-3) 0;">✓ Credentials saved. Reloading data…</p>'),this.state.credentials=y,this.state.error=null,await this.loadData()}catch(k){b&&(b.innerHTML=`<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ Save failed: ${k instanceof Error?k.message:k}</p>`)}});const c=this.root.querySelector("#test-creds-btn");c==null||c.addEventListener("click",async()=>{const f=new FormData(e),p={api_key:f.get("api_key"),energy_id:f.get("energy_id"),meters:l(f)},y=this.root.querySelector("#creds-status");y&&(y.innerHTML='<p style="color: var(--clr-muted); padding: var(--sp-3) 0;">Testing connection…</p>');try{const{testCredentials:b}=await W(async()=>{const{testCredentials:_}=await Promise.resolve().then(()=>L);return{testCredentials:_}},void 0),k=await b(p);y&&(y.innerHTML=k.success?`<p style="color: var(--clr-production); padding: var(--sp-3) 0;">✓ ${k.message}</p>`:`<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ ${k.message}</p>`)}catch(b){y&&(y.innerHTML=`<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ Test failed: ${b instanceof Error?b.message:b}</p>`)}})}const s=this.root.querySelector("#settings-form");if(!s)return;const a=o=>{const l=[];for(let c=0;c<24;c++){const f=o.get(`consumption_window_${c}_label`),p=o.get(`consumption_window_${c}_day_group`),y=o.get(`consumption_window_${c}_start_time`),b=o.get(`consumption_window_${c}_end_time`),k=o.get(`consumption_window_${c}_rate`);if(f===null&&p===null&&y===null&&b===null&&k===null)break;l.push({label:(f??"").trim()||`Window ${c+1}`,day_group:p??"all",start_time:y??"00:00",end_time:b??"06:00",rate:parseFloat(k??"0")||0})}return l},n=o=>{const l=[];for(let c=0;c<24;c++){const f=o.get(`reference_window_${c}_label`),p=o.get(`reference_window_${c}_day_group`),y=o.get(`reference_window_${c}_start_time`),b=o.get(`reference_window_${c}_end_time`),k=o.get(`reference_window_${c}_reference_power_kw`);if(f===null&&p===null&&y===null&&b===null&&k===null)break;l.push({label:(f??"").trim()||`Reference ${c+1}`,day_group:p??"all",start_time:y??"17:00",end_time:b??"00:00",reference_power_kw:parseFloat(k??"0")||0})}return l},r=()=>{const o=new FormData(s),l={};s.querySelectorAll('input[type="checkbox"]').forEach(_=>{l[_.name]=_.checked});const c=[],f=/^feed_in_rate_(\d+)_(.+)$/,p={},y=[],b=/^meter_fee_(\d+)_(.+)$/,k={};for(const[_,S]of o.entries()){if(_.startsWith("consumption_window_")||_.startsWith("reference_window_"))continue;const C=_.match(f);if(C){const $=C[1],T=C[2];p[$]||(p[$]={}),p[$][T]=S;continue}const h=_.match(b);if(h){const $=h[1],T=h[2];k[$]||(k[$]={}),k[$][T]=S;continue}if(l[_]!==void 0&&typeof l[_]=="boolean")continue;const d=parseFloat(S);l[_]=isNaN(d)?S:d}for(const _ of Object.keys(p).sort()){const S=p[_],C=S.mode??"fixed",h=C==="sensor"?S.fallback_tariff??S.tariff:S.tariff;c.push({meter_id:S.meter_id??"",mode:C,tariff:parseFloat(h??"0.08")||.08,sensor_entity:S.sensor_entity??""})}c.length>0&&(l.feed_in_rates=c);for(const _ of Object.keys(k).sort()){const S=k[_];y.push({meter_id:S.meter_id??"",label:S.label??"",fee:parseFloat(S.fee??"0")||0})}return y.length>0&&(l.meter_monthly_fees=y),l.consumption_rate_windows=a(o),l.reference_power_windows=n(o),l},i=o=>{if(!this.state.config)return;const l=r();o(l),this.state.config={...this.state.config,...l},this.renderPreserveMainScroll()};if((g=this.root.querySelector("#add-consumption-window-btn"))==null||g.addEventListener("click",()=>{i(o=>{var c;const l=Array.isArray(o.consumption_rate_windows)?[...o.consumption_rate_windows]:[];l.push({label:`Window ${l.length+1}`,day_group:"weekdays",start_time:"17:00",end_time:"00:00",rate:((c=this.state.config)==null?void 0:c.energy_variable_rate)??.15}),o.consumption_rate_windows=l})}),this.root.querySelectorAll(".remove-consumption-window-btn").forEach(o=>{o.addEventListener("click",()=>{const l=parseInt(o.dataset.window??"0",10);i(c=>{const f=Array.isArray(c.consumption_rate_windows)?[...c.consumption_rate_windows]:[];f.splice(l,1),c.consumption_rate_windows=f})})}),(v=this.root.querySelector("#add-reference-window-btn"))==null||v.addEventListener("click",()=>{i(o=>{var c;const l=Array.isArray(o.reference_power_windows)?[...o.reference_power_windows]:[];l.push({label:`Reference ${l.length+1}`,day_group:"weekdays",start_time:"17:00",end_time:"00:00",reference_power_kw:((c=this.state.config)==null?void 0:c.reference_power_kw)??5}),o.reference_power_windows=l})}),this.root.querySelectorAll(".remove-reference-window-btn").forEach(o=>{o.addEventListener("click",()=>{const l=parseInt(o.dataset.window??"0",10);i(c=>{const f=Array.isArray(c.reference_power_windows)?[...c.reference_power_windows]:[];f.splice(l,1),c.reference_power_windows=f})})}),s.querySelectorAll('input[type="radio"][name^="feed_in_rate_"][name$="_mode"]').forEach(o=>{o.addEventListener("change",()=>{const l=o.name.match(/feed_in_rate_(\d+)_mode/);if(!l)return;const c=l[1],f=s.querySelector(`.feed-in-fixed-fields[data-rate-idx="${c}"]`),p=s.querySelector(`.feed-in-sensor-fields[data-rate-idx="${c}"]`);f&&(f.style.display=o.value==="fixed"?"":"none"),p&&(p.style.display=o.value==="sensor"?"":"none")})}),this.state.mode==="ha"){const o=this.root.querySelector("#ha-entity-list");o&&fetch("/api/leneda/ha-entities").then(l=>l.ok?l.json():Promise.resolve({entities:[]})).then(({entities:l})=>{o.innerHTML=l.map(c=>`<option value="${c}"></option>`).join("")}).catch(()=>{})}s.addEventListener("submit",async o=>{o.preventDefault();const l=r();try{const{saveConfig:c}=await W(async()=>{const{saveConfig:f}=await Promise.resolve().then(()=>L);return{saveConfig:f}},void 0);await c(l),this.state.config=await q(),this.render()}catch(c){alert("Failed to save: "+(c instanceof Error?c.message:c))}});const m=this.root.querySelector("#reset-config-btn");m==null||m.addEventListener("click",async()=>{if(confirm("Reset all billing rates to defaults?"))try{const{resetConfig:o}=await W(async()=>{const{resetConfig:l}=await Promise.resolve().then(()=>L);return{resetConfig:l}},void 0);await o(),this.state.config=await q(),this.render()}catch(o){alert("Failed to reset: "+(o instanceof Error?o.message:o))}})}async initChart(e){var s,a;try{const{renderEnergyChart:n}=await W(async()=>{const{renderEnergyChart:p}=await import("./Charts-CD10JIPH.js");return{renderEnergyChart:p}},[]),{fetchTimeseries:r,fetchPerMeterTimeseries:i}=await W(async()=>{const{fetchTimeseries:p,fetchPerMeterTimeseries:y}=await Promise.resolve().then(()=>L);return{fetchTimeseries:p,fetchPerMeterTimeseries:y}},void 0),{start:m,end:g}=this.getDateRangeISO(),[v,o]=await Promise.all([r("1-1:1.29.0",m,g),r("1-1:2.29.0",m,g)]),l=((s=this.state.config)==null?void 0:s.reference_power_kw)??0,c=(((a=this.state.config)==null?void 0:a.meters)??[]).filter(p=>p.types.includes("production"));let f;if(c.length>1)try{const p=await i("1-1:2.29.0",m,g);p.meters&&p.meters.length>1&&(f=p.meters)}catch(p){console.warn("Per-meter timeseries fetch failed, using merged view:",p)}n(e,v,o,{unit:this.state.chartUnit,referencePowerKw:l,perMeterProduction:f,onZoomChange:(p,y)=>{this.handleChartZoomChange(p,y)}})}catch(n){console.error("Chart init failed:",n)}}async handleChartZoomChange(e,s){try{this.preZoomRange===null&&(this.preZoomRange=this.state.range,this.preZoomCustomStart=this.state.customStart,this.preZoomCustomEnd=this.state.customEnd);const{fetchCustomData:a}=await W(async()=>{const{fetchCustomData:g}=await Promise.resolve().then(()=>L);return{fetchCustomData:g}},void 0),n=e.slice(0,10),r=s.slice(0,10),i=await a(n,r),m=await O("1-1:1.29.0",new Date(n+"T00:00:00").toISOString(),new Date(r+"T23:59:59.999").toISOString());this.state.range="custom",this.state.customStart=n,this.state.customEnd=r,this.state.rangeData={range:"custom",consumption:i.consumption,production:i.production,exported:i.exported??0,self_consumed:i.self_consumed??0,gas_energy:i.gas_energy??0,gas_volume:i.gas_volume??0,peak_power_kw:i.peak_power_kw??0,exceedance_kwh:i.exceedance_kwh??0,metering_point:i.metering_point??""},this.state.consumptionTimeseries=m,this.renderDashboardPartial()}catch(a){console.error("Zoom data fetch failed:",a)}}renderDashboardPartial(){var S,C;const e=this.root.querySelector(".dashboard");if(!e||!this.state.rangeData)return;const s=document.createElement("div");s.innerHTML=ke(this.state);const a=s.querySelector(".dashboard");if(!a)return;const n=e.querySelector(".range-selector"),r=a.querySelector(".range-selector");n&&r&&n.replaceWith(r);const i=e.querySelector(".custom-range-picker"),m=a.querySelector(".custom-range-picker");i&&m?i.replaceWith(m):!i&&m?(S=e.querySelector(".range-selector"))==null||S.insertAdjacentElement("afterend",m):i&&!m&&i.remove();const g=e.querySelector(".stats-grid"),v=a.querySelector(".stats-grid");g&&v&&g.replaceWith(v);const o=e.querySelector(".flow-card"),l=a.querySelector(".flow-card");o&&l&&o.replaceWith(l);const c=e.querySelector(".metrics-card"),f=a.querySelector(".metrics-card");c&&f&&c.replaceWith(f);const p=e.querySelector(".chart-header .card-title"),y=a.querySelector(".chart-header .card-title");p&&y&&p.replaceWith(y);const b=e.querySelector(".reset-zoom-btn");b&&(b.style.display=""),e.querySelectorAll("[data-range]").forEach(h=>{h.addEventListener("click",()=>{this.changeRange(h.dataset.range)})});const k=e.querySelector("#custom-start"),_=e.querySelector("#custom-end");k&&k.addEventListener("change",()=>{this.state.customStart=k.value}),_&&_.addEventListener("change",()=>{this.state.customEnd=_.value}),(C=e.querySelector("#apply-custom-range"))==null||C.addEventListener("click",()=>{this.preZoomRange=null,this.applyCustomRange()})}getDateRangeISO(){const e=new Date,s=a=>a.toISOString();switch(this.state.range){case"custom":{const a=new Date(this.state.customStart+"T00:00:00"),n=new Date(this.state.customEnd+"T23:59:59.999");return{start:s(a),end:s(n)}}case"yesterday":{const a=new Date(e);a.setDate(a.getDate()-1),a.setHours(0,0,0,0);const n=new Date(a);return n.setHours(23,59,59,999),{start:s(a),end:s(n)}}case"this_week":{const a=new Date(e),n=a.getDay()||7;return a.setDate(a.getDate()-n+1),a.setHours(0,0,0,0),{start:s(a),end:s(e)}}case"last_week":{const a=new Date(e),n=a.getDay()||7,r=new Date(a);r.setDate(a.getDate()-n),r.setHours(23,59,59,999);const i=new Date(r);return i.setDate(r.getDate()-6),i.setHours(0,0,0,0),{start:s(i),end:s(r)}}case"this_month":{const a=new Date(e.getFullYear(),e.getMonth(),1);return{start:s(a),end:s(e)}}case"last_month":{const a=new Date(e.getFullYear(),e.getMonth()-1,1),n=new Date(e.getFullYear(),e.getMonth(),0,23,59,59,999);return{start:s(a),end:s(n)}}case"this_year":{const a=new Date(e.getFullYear(),0,1);return{start:s(a),end:s(e)}}case"last_year":{const a=new Date(e.getFullYear()-1,0,1),n=new Date(e.getFullYear()-1,11,31,23,59,59,999);return{start:s(a),end:s(n)}}default:{const a=new Date(e);a.setDate(a.getDate()-1),a.setHours(0,0,0,0);const n=new Date(a);return n.setHours(23,59,59,999),{start:s(a),end:s(n)}}}}}if(window.self===window.top&&window.location.pathname.startsWith("/leneda-panel/"))window.location.href="/leneda";else{const t=document.getElementById("app");t&&new vt(t).mount()}
