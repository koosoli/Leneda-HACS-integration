var $e=Object.defineProperty;var xe=(a,e,s)=>e in a?$e(a,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):a[e]=s;var F=(a,e,s)=>xe(a,typeof e!="symbol"?e+"":e,s);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))t(r);new MutationObserver(r=>{for(const i of r)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&t(o)}).observe(document,{childList:!0,subtree:!0});function s(r){const i={};return r.integrity&&(i.integrity=r.integrity),r.referrerPolicy&&(i.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?i.credentials="include":r.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function t(r){if(r.ep)return;r.ep=!0;const i=s(r);fetch(r.href,i)}})();const Se="modulepreload",Ce=function(a){return"/leneda-panel/static/"+a},le={},E=function(e,s,t){let r=Promise.resolve();if(s&&s.length>0){let o=function(d){return Promise.all(d.map(g=>Promise.resolve(g).then(m=>({status:"fulfilled",value:m}),m=>({status:"rejected",reason:m}))))};document.getElementsByTagName("link");const u=document.querySelector("meta[property=csp-nonce]"),p=(u==null?void 0:u.nonce)||(u==null?void 0:u.getAttribute("nonce"));r=o(s.map(d=>{if(d=Ce(d),d in le)return;le[d]=!0;const g=d.endsWith(".css"),m=g?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${m}`))return;const h=document.createElement("link");if(h.rel=g?"stylesheet":Se,g||(h.as="script"),h.crossOrigin="",h.href=d,p&&h.setAttribute("nonce",p),document.head.appendChild(h),g)return new Promise((w,v)=>{h.addEventListener("load",w),h.addEventListener("error",()=>v(new Error(`Unable to preload CSS for ${d}`)))})}))}function i(o){const u=new Event("vite:preloadError",{cancelable:!0});if(u.payload=o,window.dispatchEvent(u),!u.defaultPrevented)throw o}return r.then(o=>{for(const u of o||[])u.status==="rejected"&&i(u.reason);return e().catch(i)})};function Ee(){var a,e,s,t,r;try{const i=(e=(a=window.parent)==null?void 0:a.document)==null?void 0:e.querySelector("home-assistant");return((r=(t=(s=i==null?void 0:i.hass)==null?void 0:s.auth)==null?void 0:t.data)==null?void 0:r.access_token)??null}catch{return null}}async function D(a,e){const s=Ee(),t={...e==null?void 0:e.headers,...s?{Authorization:`Bearer ${s}`}:{}},r={...e,credentials:"include",headers:t},i=await fetch(a,r);if(!i.ok)throw new Error(`API ${i.status}: ${i.statusText}`);return i.json()}async function me(a){return D(`/leneda_api/data?range=${a}`)}async function De(a,e){return D(`/leneda_api/data/custom?start=${encodeURIComponent(a)}&end=${encodeURIComponent(e)}`)}async function Le(a,e,s){let t=`/leneda_api/data/timeseries?obis=${encodeURIComponent(a)}`;return e&&(t+=`&start=${encodeURIComponent(e)}`),s&&(t+=`&end=${encodeURIComponent(s)}`),D(t)}async function Z(){return D("/leneda_api/sensors")}async function V(){return D("/leneda_api/config")}async function Re(a){await D("/leneda_api/config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)})}async function We(){await D("/leneda_api/config/reset",{method:"POST"})}async function ge(){try{return await D("/leneda_api/mode")}catch{return{mode:"standalone",configured:!1}}}async function ve(){return D("/leneda_api/credentials")}async function Pe(a){await D("/leneda_api/credentials",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)})}async function Me(a){return D("/leneda_api/credentials/test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)})}const W=Object.freeze(Object.defineProperty({__proto__:null,fetchConfig:V,fetchCredentials:ve,fetchCustomData:De,fetchMode:ge,fetchRangeData:me,fetchSensors:Z,fetchTimeseries:Le,resetConfig:We,saveConfig:Re,saveCredentials:Pe,testCredentials:Me},Symbol.toStringTag,{value:"Module"}));function l(a,e=2){return a==null?"—":a.toLocaleString(void 0,{minimumFractionDigits:0,maximumFractionDigits:e})}function ce(a){return new Date(a).toLocaleDateString(void 0,{month:"short",day:"numeric"})}function Te(a){return new Date(a).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}const de=[{id:"yesterday",label:"Yesterday"},{id:"this_week",label:"This Week"},{id:"last_week",label:"Last Week"},{id:"this_month",label:"This Month"},{id:"last_month",label:"Last Month"},{id:"this_year",label:"This Year"},{id:"last_year",label:"Last Year"},{id:"custom",label:"Custom"}];function ue(a){var k;const e=a.rangeData,s=(e==null?void 0:e.consumption)??0,t=(e==null?void 0:e.production)??0,r=(e==null?void 0:e.exported)??0,i=(e==null?void 0:e.self_consumed)??0,o=(e==null?void 0:e.gas_energy)??0,u=(e==null?void 0:e.gas_volume)??0,p=(e==null?void 0:e.peak_power_kw)??0,d=Math.max(0,s-i-((e==null?void 0:e.shared_with_me)??0)),g=Math.max(0,r-((e==null?void 0:e.shared)??0)),m=(e==null?void 0:e.shared)??0,h=(e==null?void 0:e.shared_with_me)??0,w=s>0?Math.min(100,i/s*100):0,v=a.range==="custom"&&a.customStart&&a.customEnd?`${ce(a.customStart+"T00:00:00")} — ${ce(a.customEnd+"T00:00:00")}`:((k=de.find(b=>b.id===a.range))==null?void 0:k.label)??"Yesterday";return`
    <div class="dashboard" style="position: relative;">
      <div style="position:fixed;bottom:4px;right:4px;font-size:10px;opacity:0.5;pointer-events:none;z-index:9999;">v:ULTRATHINK</div>

      <!-- Range Selector -->
      <div class="range-selector">
        ${de.map(b=>`
          <button
            class="range-btn ${b.id===a.range?"active":""}"
            data-range="${b.id}"
          >${b.label}</button>
        `).join("")}
      </div>

      ${(()=>{if(!(e!=null&&e.start)||!(e!=null&&e.end))return"";try{const b=new Date(e.start),c=new Date(e.end);return isNaN(b.getTime())||isNaN(c.getTime())?"":`
            <div class="range-info-bar">
              📅 ${b.toLocaleDateString()} — ${c.toLocaleDateString()}
            </div>
          `}catch{return""}})()}

      ${a.range==="custom"?`
      <!-- Custom Date Range Picker -->
      <div class="custom-range-picker">
        <label>
          <span>From</span>
          <input type="date" id="custom-start" value="${a.customStart??""}" />
        </label>
        <label>
          <span>To</span>
          <input type="date" id="custom-end" value="${a.customEnd??""}" />
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
            <div class="stat-value">${l(s)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card production">
          <div class="stat-icon">☀️</div>
          <div class="stat-body">
            <div class="stat-label">Production</div>
            <div class="stat-value">${l(t)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card export">
          <div class="stat-icon">📤</div>
          <div class="stat-body">
            <div class="stat-label">Exported</div>
            <div class="stat-value">${l(r)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card self-consumed">
          <div class="stat-icon">🏠</div>
          <div class="stat-body">
            <div class="stat-label">Self-Consumed</div>
            <div class="stat-value">${l(i)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>
      </div>

      <!-- Energy Flow + Key Metrics side by side -->
      <div class="flow-metrics-row">
        <div class="card flow-card">
          <h3 class="card-title"><span class="title-icon">🔄</span> Energy Flow</h3>

          <div class="leneda-elite-flow">
            <!-- Glass Header: Floating Modules -->
            <div class="elite-header">
              <div class="glass-module consumption-module">
                <div class="module-info">
                  <span class="module-label">Daily Consumption <span class="info-icon">ⓘ</span></span>
                  <div class="module-value-row">
                    <span class="module-value highlight-red">${l(s)}</span>
                    <span class="module-unit">kWh</span>
                  </div>
                </div>
                <div class="module-visual"><div class="wave-bg red"></div></div>
              </div>

              <div class="glass-module production-module">
                <div class="module-info">
                  <span class="module-label">Solar Production <span class="info-icon">ⓘ</span></span>
                  <div class="module-value-row">
                    <span class="module-value highlight-green">${l(t)}</span>
                    <span class="module-unit">kWh</span>
                  </div>
                </div>
                <div class="module-visual"><div class="wave-bg green"></div></div>
              </div>
            </div>

            <!-- Central Immersive Scene -->
            <div class="elite-scene">
              <svg class="elite-main-svg" viewBox="0 0 800 400" fill="none" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <!-- Premium Filters -->
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

                  <!-- Gradients for Veins -->
                  <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="var(--clr-consumption)" stop-opacity="0" />
                    <stop offset="50%" stop-color="var(--clr-consumption)" stop-opacity="1" />
                    <stop offset="100%" stop-color="var(--clr-consumption)" stop-opacity="0" />
                  </linearGradient>
                  
                  <radialGradient id="house-base-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="var(--clr-surface-alt)" stop-opacity="0.8" />
                    <stop offset="100%" stop-color="var(--clr-surface-alt)" stop-opacity="0" />
                  </radialGradient>
                </defs>

                <!-- Ambient Floor Glow -->
                <ellipse cx="400" cy="300" rx="350" ry="60" fill="url(#house-base-glow)" opacity="0.4" />

                <!-- Ground Horizon -->
                <line x1="50" y1="280" x2="750" y2="280" stroke="var(--clr-border)" stroke-width="1" stroke-opacity="0.5" />

                <!-- Grid Infrastructure (Left) -->
                <g class="tier-1-infrastructure" transform="translate(100, 160)">
                  <!-- Glowing powerline -->
                  <path d="M20 0 V120 M-10 25 H50 M-5 45 H45" stroke="var(--clr-consumption)" stroke-width="2.5" stroke-linecap="round" filter="url(#glow-red)" />
                  <path d="M5 10 L5 25 M35 10 L35 25" stroke="var(--clr-consumption)" stroke-width="1.5" />
                  <circle cx="20" cy="120" r="40" fill="var(--clr-consumption)" fill-opacity="0.05" />
                </g>

                <!-- The Grand House (Center) -->
                <g class="elite-house" transform="translate(320, 60)">
                  <!-- 3D Structure Feel -->
                  <path d="M0 80 L80 0 L160 80 V220 H0 Z" fill="var(--clr-surface)" stroke="var(--clr-border)" stroke-width="3" />
                  <path d="M80 0 V220" stroke="var(--clr-border)" stroke-width="1" stroke-opacity="0.2" />
                  
                  <!-- Elite Windows with 'Living Glow' -->
                  <rect x="25" y="100" width="30" height="40" rx="2" fill="rgba(88,166,255,0.05)" stroke="var(--clr-border)" stroke-width="1" />
                  <rect x="105" y="100" width="30" height="40" rx="2" fill="rgba(88,166,255,0.05)" stroke="var(--clr-border)" stroke-width="1" />
                  <rect x="60" y="160" width="40" height="60" rx="2" fill="var(--clr-surface-alt)" stroke="var(--clr-border)" stroke-width="2" />

                  <!-- Interior Status Centers -->
                  <g class="house-status" transform="translate(80, 120)">
                    <circle cx="-40" cy="0" r="18" fill="var(--clr-surface-alt)" stroke="var(--clr-border)" stroke-width="1.5" />
                    <!-- Smart Home Icon -->
                    <path d="M-45 4 V-4 L-40 -8 L-35 -4 V4 H-45 Z" fill="none" stroke="var(--clr-production)" stroke-width="1.5" />
                    
                    <circle cx="40" cy="0" r="18" fill="var(--clr-surface-alt)" stroke="var(--clr-border)" stroke-width="1.5" />
                    <!-- Shared Network Icon -->
                    <path d="M35 0 H45 M40 -5 V5 M37 -3 L43 3 M37 3 L43 -3" stroke="var(--clr-export)" stroke-width="1.5" />
                    
                    <text x="0" y="8" text-anchor="middle" font-size="28" opacity="0.8">💡</text>
                  </g>

                  <!-- Elite Solar Panels -->
                  <g transform="translate(115, 10) rotate(42)">
                    <rect x="0" y="0" width="55" height="15" rx="2" fill="rgba(63, 185, 80, 0.1)" stroke="var(--clr-production)" stroke-width="1.5" filter="url(#glow-green)" />
                    <rect x="0" y="22" width="55" height="15" rx="2" fill="rgba(63, 185, 80, 0.1)" stroke="var(--clr-production)" stroke-width="1.5" filter="url(#glow-green)" />
                    <line x1="10" y1="0" x2="10" y2="15" stroke="var(--clr-production)" stroke-width="0.5" stroke-opacity="0.3" />
                    <line x1="27" y1="0" x2="27" y2="15" stroke="var(--clr-production)" stroke-width="0.5" stroke-opacity="0.3" />
                  </g>
                </g>

                <!-- Energy Veins (Fluid Paths) -->
                <!-- Solar Production Line -->
                <path id="vein-solar" d="M 480 100 Q 420 180 400 180" stroke="var(--clr-production)" stroke-width="1" stroke-dasharray="100" />
                ${t>0?`
                  <circle r="3.5" fill="var(--clr-production)" filter="url(#glow-green)">
                    <animateMotion dur="1.5s" repeatCount="indefinite" path="M 480 100 Q 420 180 400 180" />
                  </circle>
                `:""}

                <!-- Underground Veins -->
                <path id="vein-bought" d="M 140 280 H 400 V 280" stroke="var(--clr-consumption)" stroke-width="2" stroke-opacity="0.3" fill="none" />
                ${d>0?`
                  <circle r="5" fill="var(--clr-consumption)" filter="url(#glow-red)">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 140 280 H 400 V 280" />
                  </circle>
                  <path d="M 395 295 L 400 285 L 405 295" stroke="var(--clr-consumption)" stroke-width="2.5" fill="none" />
                `:""}

                <path id="vein-sold" d="M 400 280 V 340 H 120" stroke="var(--clr-export)" stroke-width="2" stroke-opacity="0.3" fill="none" />
                ${g>0?`
                  <circle r="5" fill="var(--clr-export)" filter="url(#glow-blue)">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 400 285 V 340 H 130" />
                  </circle>
                  <path d="M 140 345 L 130 340 L 140 335" stroke="var(--clr-export)" stroke-width="2.5" fill="none" />
                `:""}

              </svg>

              <!-- Absolute Glass Badges for Detailed Metrics -->
              <div class="elite-badges-grid">
                <div class="glass-badge highlight-red bought-badge">
                  <span class="badge-label">Market In</span>
                  <span class="badge-value">${l(d)} <small>kWh</small></span>
                </div>
                <div class="glass-badge highlight-blue sold-badge">
                  <span class="badge-label">Market Out</span>
                  <span class="badge-value">${l(g)} <small>kWh</small></span>
                </div>
                <div class="glass-badge highlight-blue shared-badge">
                  <span class="badge-label">Sent</span>
                  <span class="badge-value">${l(m)} <small>kWh</small></span>
                </div>
                <div class="glass-badge highlight-blue received-badge">
                  <span class="badge-label">Received</span>
                  <span class="badge-value">${l(h)} <small>kWh</small></span>
                </div>
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
              <span class="metric-value">${l(w,1)}%</span>
            </div>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${w}%"></div>
            </div>
          </div>
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Self-Consumed</span>
              <span class="metric-value">${l(i)} kWh</span>
            </div>
          </div>
          ${p>0?`
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Peak Power</span>
              <span class="metric-value">${l(p,2)} kW</span>
            </div>
          </div>
          `:""}
          <div class="metric ${((e==null?void 0:e.exceedance_kwh)??0)>0?"metric-warning":"metric-ok"}">
            <div class="metric-header">
              <span class="metric-label">${((e==null?void 0:e.exceedance_kwh)??0)>0?"⚠️":"✅"} Exceedance</span>
              <span class="metric-value">${l((e==null?void 0:e.exceedance_kwh)??0,2)} kWh</span>
            </div>
          </div>
          ${o>0||u>0?`
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Gas Energy</span>
              <span class="metric-value">${l(o)} kWh</span>
            </div>
          </div>
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Gas Volume</span>
              <span class="metric-value">${l(u)} m³</span>
            </div>
          </div>
          `:""}
        </div>
      </div>
      </div>

      <!-- Chart -->
      <div class="card chart-card">
        <div class="chart-header">
          <h3 class="card-title"><span class="title-icon">📉</span> Energy Profile — ${v}</h3>
          <div class="chart-unit-toggle">
            <button
              class="unit-btn ${a.chartUnit==="kw"?"active":""}"
              data-chart-unit="kw"
              title="Show power (kW) — see when you exceed the reference limit"
            >kW</button>
            <button
              class="unit-btn ${a.chartUnit==="kwh"?"active":""}"
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
  `}const pe={"1-1:1.29.0":{name:"Active Consumption",unit:"kW",icon:"⚡",category:"consumption"},"1-1:2.29.0":{name:"Active Production",unit:"kW",icon:"☀️",category:"production"},"1-1:3.29.0":{name:"Reactive Consumption",unit:"kvar",icon:"⚡",category:"consumption"},"1-1:4.29.0":{name:"Reactive Production",unit:"kvar",icon:"☀️",category:"production"},"1-65:1.29.1":{name:"Consumption Covered (L1 AIR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.3":{name:"Consumption Covered (L2 ACR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.2":{name:"Consumption Covered (L3 CEL)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.4":{name:"Consumption Covered (L4 APS)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.9":{name:"Remaining Consumption",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.1":{name:"Production Shared (L1 AIR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.3":{name:"Production Shared (L2 ACR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.2":{name:"Production Shared (L3 CEL)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.4":{name:"Production Shared (L4 APS)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.9":{name:"Remaining Production",unit:"kW",icon:"🔗",category:"sharing"},"7-1:99.23.15":{name:"Gas Volume",unit:"m³",icon:"🔥",category:"gas"},"7-1:99.23.17":{name:"Gas Standard Volume",unit:"Nm³",icon:"🔥",category:"gas"},"7-20:99.33.17":{name:"Gas Energy",unit:"kWh",icon:"🔥",category:"gas"}};function Fe(a){return pe[a]?pe[a].name:{c_04_yesterday_consumption:"Yesterday's Consumption",c_05_weekly_consumption:"This Week's Consumption",c_06_last_week_consumption:"Last Week's Consumption",c_07_monthly_consumption:"This Month's Consumption",c_08_previous_month_consumption:"Last Month's Consumption",p_04_yesterday_production:"Yesterday's Production",p_05_weekly_production:"This Week's Production",p_06_last_week_production:"Last Week's Production",p_07_monthly_production:"This Month's Production",p_08_previous_month_production:"Last Month's Production",p_09_yesterday_exported:"Yesterday's Export",p_10_last_week_exported:"Last Week's Export",p_11_last_month_exported:"Last Month's Export",p_12_yesterday_self_consumed:"Yesterday's Self-Consumed",p_13_last_week_self_consumed:"Last Week's Self-Consumed",p_14_last_month_self_consumed:"Last Month's Self-Consumed",p_15_monthly_exported:"This Month's Export",p_16_monthly_self_consumed:"This Month's Self-Consumed",g_01_yesterday_consumption:"Gas Yesterday (kWh)",g_02_weekly_consumption:"Gas This Week (kWh)",g_03_last_week_consumption:"Gas Last Week (kWh)",g_04_monthly_consumption:"Gas This Month (kWh)",g_05_last_month_consumption:"Gas Last Month (kWh)",g_10_yesterday_volume:"Gas Yesterday (m³)",g_11_weekly_volume:"Gas This Week (m³)",g_12_last_week_volume:"Gas Last Week (m³)",g_13_monthly_volume:"Gas This Month (m³)",g_14_last_month_volume:"Gas Last Month (m³)"}[a]??a}function Ie(a){if(!a||!a.sensors.length)return`
      <section class="sensors-view">
        <div class="card">
          <p class="muted">No sensor data available. Waiting for coordinator update…</p>
        </div>
      </section>
    `;const e=[],s=[],t=[],r=[],i=[];for(const u of a.sensors){const p=u.key;p.startsWith("c_")||p==="1-1:1.29.0"||p==="1-1:3.29.0"?e.push(u):p.startsWith("p_")||p==="1-1:2.29.0"||p==="1-1:4.29.0"?s.push(u):p.startsWith("s_")||p.startsWith("1-65:")?t.push(u):p.startsWith("g_")||p.startsWith("7-")?r.push(u):i.push(u)}const o=(u,p,d,g)=>d.length?`
      <div class="card sensor-group">
        <h3 class="card-title"><span class="title-icon">${p}</span> ${u} <span class="badge">${d.length}</span></h3>
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
              ${d.map(m=>`
                <tr>
                  <td class="sensor-name">${Fe(m.key)}</td>
                  <td class="sensor-value" style="text-align: right; color: var(--clr-${g});">${l(m.value)}</td>
                  <td class="sensor-unit">${m.unit}</td>
                  <td class="sensor-peak">${m.peak_timestamp?Te(m.peak_timestamp):'<span style="color: var(--clr-border)">—</span>'}</td>
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
          <span class="badge">${a.sensors.length} sensors</span>
          <span class="muted">${a.metering_point}</span>
        </div>
      </div>
      ${o("Electricity Consumption","⚡",e,"consumption")}
      ${o("Energy Production","☀️",s,"production")}
      ${o("Energy Sharing","🔗",t,"self")}
      ${o("Gas","🔥",r,"gas")}
      ${o("Other","📊",i,"text")}
    </section>
  `}function Ae(a,e,s){const t=new Date,r=(p,d)=>new Date(p,d+1,0).getDate();let i,o;switch(a){case"yesterday":{const p=new Date(t);p.setDate(p.getDate()-1),i=1,o=p;break}case"this_week":{const p=new Date(t),d=p.getDay()||7,g=new Date(p);g.setDate(p.getDate()-d+1),i=Math.max(1,Math.round((t.getTime()-g.getTime())/864e5)+1),o=g;break}case"last_week":{i=7;const p=new Date(t);p.setDate(p.getDate()-7),o=p;break}case"this_month":{i=t.getDate(),o=t;break}case"last_month":{const p=new Date(t.getFullYear(),t.getMonth()-1,1);i=r(p.getFullYear(),p.getMonth()),o=p;break}case"custom":{if(e&&s){const p=new Date(e),d=new Date(s);i=Math.max(1,Math.round((d.getTime()-p.getTime())/864e5)+1),o=p}else i=1,o=t;break}default:i=1,o=t}const u=r(o.getFullYear(),o.getMonth());return{days:i,monthDays:u,factor:i/u}}function Ve(a){const e=a.config,s=a.rangeData;if(!e||!s)return`
      <section class="invoice-view">
        <div class="card">
          <p class="muted">Loading billing configuration…</p>
        </div>
      </section>
    `;const t=s.consumption||0,r=s.production||0,i=s.exported||0,o=s.peak_power_kw||0,u=e.reference_power_kw||5,p=s.exceedance_kwh||0,d=s.gas_energy||0,g=s.gas_volume||0,m=d>0||g>0,{days:h,monthDays:w,factor:v}=Ae(a.range,a.customStart,a.customEnd),k=e.energy_fixed_fee*v,b=e.network_metering_rate*v,c=e.network_power_ref_rate*v,n=h<w?`${h}/${w} days`:"full month",f=t*e.energy_variable_rate,x=t*e.network_variable_rate,C=p*e.exceedance_rate,P=e.meter_monthly_fees??[],L=P.reduce((y,S)=>y+(S.fee||0),0)*v,T=t*e.compensation_fund_rate,Y=t*e.electricity_tax_rate,q=k+f+b+c+x+C+L+T+Y,B=q*e.vat_rate,K=q+B,_e=(e.meters??[]).filter(y=>y.types.includes("production")),be=e.feed_in_rates??[],R=_e.map(y=>{const S=be.find(G=>G.meter_id===y.id);if(S){const G=S.mode==="sensor"&&S.sensor_value!=null?S.sensor_value:S.tariff,we=S.mode==="sensor"&&S.sensor_value!=null?`Sensor (${l(G,4)} ${e.currency??"EUR"}/kWh)`:"Fixed tariff";return{meterId:y.id,shortId:y.id?"…"+y.id.slice(-8):"Meter",rate:G,label:we,mode:S.mode}}return{meterId:y.id,shortId:y.id?"…"+y.id.slice(-8):"Meter",rate:e.feed_in_tariff,label:"Fixed tariff",mode:"fixed"}}),J=R.length>0?R.reduce((y,S)=>y+S.rate,0)/R.length:e.feed_in_tariff,I=i*J,M=R.length>1,A=s.self_consumed||0,Q=A*(e.energy_variable_rate+e.network_variable_rate+e.electricity_tax_rate+e.compensation_fund_rate),ee=Q*e.vat_rate,O=Q+ee,te=O+I,H=K-I,se=(e.gas_fixed_fee??6.5)*v,ae=d*(e.gas_variable_rate??.055),re=(e.gas_network_fee??4.8)*v,ne=d*(e.gas_network_variable_rate??.012),ie=d*(e.gas_tax_rate??.001),U=se+ae+re+ne+ie,oe=U*(e.gas_vat_rate??.08),N=U+oe,$=e.currency||"EUR",_=y=>`${l(y,2)} ${$}`,j=a.range.replace("_"," ").replace(/\b\w/g,y=>y.toUpperCase()),ke=p>0?`<div class="card exceedance-warning">
        <strong>⚠️ Reference Power Exceeded</strong>
        <p>Peak: <strong>${l(o,1)} kW</strong> &mdash; Reference: ${l(u,1)} kW</p>
        <p>Total exceedance energy: <strong>${l(p,2)} kWh</strong></p>
        <p class="muted">Surcharge: ${_(C)}</p>
      </div>`:"";return`
    <section class="invoice-view">
      <div class="section-header">
        <h2>Cost Estimate &mdash; ${j}</h2>
        <div style="display: flex; gap: var(--sp-4); flex-wrap: wrap; margin-top: var(--sp-2);">
          <span class="badge" style="background: var(--clr-consumption-muted); color: var(--clr-consumption);">⚡ ${l(t)} kWh consumed</span>
          <span class="badge" style="background: var(--clr-production-muted); color: var(--clr-production);">☀️ ${l(r)} kWh produced</span>
          ${i>0?`<span class="badge" style="background: var(--clr-export-muted); color: var(--clr-export);">📤 ${l(i)} kWh exported</span>`:""}
          ${m?`<span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">🔥 ${l(d)} kWh gas (${l(g)} m³)</span>`:""}
        </div>
      </div>

      ${ke}

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
              <td>Fixed Fee <span class="muted">(${n})</span></td>
              <td style="text-align: right;">${l(e.energy_fixed_fee,2)} ${$}/mo</td>
              <td style="text-align: right;">${_(k)}</td>
            </tr>
            <tr>
              <td>Variable (${l(t)} kWh)</td>
              <td style="text-align: right;">${l(e.energy_variable_rate,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(f)}</td>
            </tr>

            <tr class="section-label"><td colspan="3">Network Operator</td></tr>
            <tr>
              <td>Metering <span class="muted">(${n})</span></td>
              <td style="text-align: right;">${l(e.network_metering_rate,2)} ${$}/mo</td>
              <td style="text-align: right;">${_(b)}</td>
            </tr>
            <tr>
              <td>Power Reference (${l(u,1)} kW) <span class="muted">(${n})</span></td>
              <td style="text-align: right;">${l(e.network_power_ref_rate,2)} ${$}/mo</td>
              <td style="text-align: right;">${_(c)}</td>
            </tr>
            <tr>
              <td>Variable (${l(t)} kWh)</td>
              <td style="text-align: right;">${l(e.network_variable_rate,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(x)}</td>
            </tr>
            <tr class="${p>0?"exceedance-row":""}">
              <td>Exceedance (${l(p,2)} kWh over ref)</td>
              <td style="text-align: right;">${l(e.exceedance_rate,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(C)}</td>
            </tr>

            ${P.filter(y=>y.fee>0).length>0?`
            <tr class="section-label"><td colspan="3">Extra Meter Fees</td></tr>
            ${P.filter(y=>y.fee>0).map(y=>`
            <tr>
              <td>${y.label||"…"+y.meter_id.slice(-8)} <span class="muted">(${n})</span></td>
              <td style="text-align: right;">${l(y.fee,2)} ${$}/mo</td>
              <td style="text-align: right;">${_(y.fee*v)}</td>
            </tr>
            `).join("")}
            `:""}

            <tr class="section-label"><td colspan="3">Taxes & Levies</td></tr>
            <tr>
              <td>Compensation Fund</td>
              <td style="text-align: right;">${l(e.compensation_fund_rate,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(T)}</td>
            </tr>
            <tr>
              <td>Electricity Tax</td>
              <td style="text-align: right;">${l(e.electricity_tax_rate,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(Y)}</td>
            </tr>

            <tr class="subtotal-row">
              <td colspan="2">Subtotal (excl. VAT)</td>
              <td style="text-align: right;"><strong>${_(q)}</strong></td>
            </tr>
            <tr>
              <td>VAT</td>
              <td style="text-align: right;">${l(e.vat_rate*100,0)}%</td>
              <td style="text-align: right;">${_(B)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2"><strong>Total Costs</strong></td>
              <td style="text-align: right;"><strong>${_(K)}</strong></td>
            </tr>

            ${i>0?`
            <tr class="section-label revenue-section"><td colspan="3">Feed-in Revenue</td></tr>
            ${R.map(y=>`
            <tr class="revenue-row">
              <td>Exported (${M?y.shortId:l(i)+" kWh"})</td>
              <td style="text-align: right;">${y.label}<br/>${l(y.rate,4)} ${$}/kWh</td>
              <td class="revenue-amount" style="text-align: right;">-${_(M?i/R.length*y.rate:i*y.rate)}</td>
            </tr>
            `).join("")}
            ${M?`
            <tr class="revenue-row">
              <td><em>Total feed-in (${l(i)} kWh, avg rate)</em></td>
              <td style="text-align: right;">${l(J,4)} ${$}/kWh</td>
              <td class="revenue-amount" style="text-align: right;">-${_(I)}</td>
            </tr>
            `:""}
            <tr class="net-total-row">
              <td colspan="2"><strong>Net Balance</strong></td>
              <td style="text-align: right;"><strong>${_(H)}</strong></td>
            </tr>
            `:""}
          </tbody>
        </table>
      </div>

      <div class="card invoice-footer">
        <p class="muted" style="line-height: var(--lh-relaxed);">
          This is an estimate based on your configured billing rates.
          Fixed monthly fees are prorated to the viewed period (${h} of ${w} days = ${l(v*100,1)}%).
          Peak power (${l(o,1)} kW) is compared against your reference power (${l(u,1)} kW) &mdash; 
          every kWh consumed above the Referenzwert incurs a surcharge of ${l(e.exceedance_rate,4)} ${$}/kWh.
          Adjust rates in Settings.
        </p>
      </div>

      ${m?`
      <!-- Gas Cost Estimate -->
      <div class="card invoice-card gas-invoice-card">
        <h3 class="card-title"><span class="title-icon">🔥</span> Gas Cost Estimate &mdash; ${j}</h3>
        <div style="display: flex; gap: var(--sp-4); flex-wrap: wrap; margin-bottom: var(--sp-4);">
          <span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">🔥 ${l(d)} kWh</span>
          <span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">📐 ${l(g)} m³</span>
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
              <td>Fixed Fee <span class="muted">(${n})</span></td>
              <td style="text-align: right;">${l(e.gas_fixed_fee??6.5,2)} ${$}/mo</td>
              <td style="text-align: right;">${_(se)}</td>
            </tr>
            <tr>
              <td>Energy (${l(d)} kWh)</td>
              <td style="text-align: right;">${l(e.gas_variable_rate??.055,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(ae)}</td>
            </tr>

            <tr class="section-label"><td colspan="3">Gas Network</td></tr>
            <tr>
              <td>Network Fee <span class="muted">(${n})</span></td>
              <td style="text-align: right;">${l(e.gas_network_fee??4.8,2)} ${$}/mo</td>
              <td style="text-align: right;">${_(re)}</td>
            </tr>
            <tr>
              <td>Network Variable (${l(d)} kWh)</td>
              <td style="text-align: right;">${l(e.gas_network_variable_rate??.012,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(ne)}</td>
            </tr>

            <tr class="section-label"><td colspan="3">Gas Tax</td></tr>
            <tr>
              <td>Gas Tax (${l(d)} kWh)</td>
              <td style="text-align: right;">${l(e.gas_tax_rate??.001,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(ie)}</td>
            </tr>

            <tr class="subtotal-row">
              <td colspan="2">Subtotal (excl. VAT)</td>
              <td style="text-align: right;"><strong>${_(U)}</strong></td>
            </tr>
            <tr>
              <td>VAT</td>
              <td style="text-align: right;">${l((e.gas_vat_rate??.08)*100,0)}%</td>
              <td style="text-align: right;">${_(oe)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2"><strong>Total Gas Costs</strong></td>
              <td style="text-align: right;"><strong>${_(N)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card invoice-footer">
        <p class="muted" style="line-height: var(--lh-relaxed);">
          <strong>Combined Energy Total: ${_(H+N)}</strong>
          (Electricity: ${_(H)} + Gas: ${_(N)})
        </p>
      </div>
      `:""}

      ${r>0?`
      <!-- Solar Revenue Tracking -->
      <div class="card solar-revenue-card">
        <h3 class="card-title"><span class="title-icon">☀️</span> Solar Panel Revenue &mdash; ${j}</h3>
        <div class="solar-revenue-summary">
          <div class="solar-stat solar-stat-primary">
            <div class="solar-stat-value">${_(te)}</div>
            <div class="solar-stat-label">Total Solar Value</div>
          </div>
          <div class="solar-stat">
            <div class="solar-stat-value">${_(O)}</div>
            <div class="solar-stat-label">Savings (self-consumed)</div>
          </div>
          <div class="solar-stat">
            <div class="solar-stat-value">${_(I)}</div>
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
              <td>Energy not bought (${l(A)} kWh)</td>
              <td style="text-align: right;">${l(e.energy_variable_rate,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(A*e.energy_variable_rate)}</td>
            </tr>
            <tr>
              <td>Network fees avoided</td>
              <td style="text-align: right;">${l(e.network_variable_rate,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(A*e.network_variable_rate)}</td>
            </tr>
            <tr>
              <td>Taxes & levies avoided</td>
              <td style="text-align: right;">${l(e.electricity_tax_rate+e.compensation_fund_rate,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(A*(e.electricity_tax_rate+e.compensation_fund_rate))}</td>
            </tr>
            <tr>
              <td>VAT saved</td>
              <td style="text-align: right;">${l(e.vat_rate*100,0)}%</td>
              <td style="text-align: right;">${_(ee)}</td>
            </tr>
            <tr class="subtotal-row">
              <td colspan="2"><strong>Self-Consumption Savings</strong></td>
              <td style="text-align: right;"><strong>${_(O)}</strong></td>
            </tr>

            ${i>0?`
            <tr class="section-label"><td colspan="3">Feed-in Revenue</td></tr>
            ${R.map(y=>`
            <tr>
              <td>Sold to grid ${M?`(${y.shortId})`:`(${l(i)} kWh)`}</td>
              <td style="text-align: right;">${y.label}<br/>${l(y.rate,4)} ${$}/kWh</td>
              <td style="text-align: right;">${_(M?i/R.length*y.rate:i*y.rate)}</td>
            </tr>
            `).join("")}
            ${M?`
            <tr class="subtotal-row">
              <td colspan="2"><strong>Total Feed-in Revenue</strong></td>
              <td style="text-align: right;"><strong>${_(I)}</strong></td>
            </tr>
            `:""}
            `:""}

            <tr class="total-row solar-total-row">
              <td colspan="2"><strong>💰 Total Solar Panel Value</strong></td>
              <td style="text-align: right;"><strong>${_(te)}</strong></td>
            </tr>
          </tbody>
        </table>

        <p class="muted" style="margin-top: var(--sp-3); font-size: var(--text-xs); line-height: var(--lh-relaxed);">
          Self-consumption savings = energy you produced and used yourself instead of buying from the grid.
          Feed-in revenue = money earned by selling surplus production.
          ${R.some(y=>y.mode==="sensor")?"Market price sourced from Home Assistant sensor.":"Using fixed feed-in tariff — configure a market price sensor in Settings for real-time rates."}
          ${M?"Revenue split equally across production meters (per-meter export data not yet available).":""}
        </p>
      </div>
      `:""}
    </section>
  `}const Ge=[{title:"Energy Supplier",icon:"⚡",fields:[{key:"energy_fixed_fee",label:"Fixed Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"energy_variable_rate",label:"Variable Rate",step:"0.0001",unit:"EUR/kWh",type:"number"}]},{title:"Network Operator",icon:"🔌",fields:[{key:"network_metering_rate",label:"Metering Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"network_power_ref_rate",label:"Power Reference Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"network_variable_rate",label:"Variable Rate",step:"0.0001",unit:"EUR/kWh",type:"number"}]},{title:"Reference Power & Exceedance",icon:"📏",fields:[{key:"reference_power_kw",label:"Reference Power (Referenzwert)",step:"0.1",unit:"kW",type:"number"},{key:"exceedance_rate",label:"Exceedance Surcharge",step:"0.0001",unit:"EUR/kWh",type:"number"}]},{title:"Feed-in / Selling",icon:"💶",fields:[]},{title:"Gas Billing",icon:"🔥",fields:[{key:"gas_fixed_fee",label:"Supplier Fixed Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"gas_variable_rate",label:"Supplier Variable Rate",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"gas_network_fee",label:"Network Fixed Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"gas_network_variable_rate",label:"Network Variable Rate",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"gas_tax_rate",label:"Gas Tax",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"gas_vat_rate",label:"Gas VAT Rate",step:"0.01",unit:"decimal (0.08 = 8%)",type:"number"}]},{title:"Meter Fees",icon:"📊",fields:[]},{title:"Taxes & Levies",icon:"🏛️",fields:[{key:"compensation_fund_rate",label:"Compensation Fund",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"electricity_tax_rate",label:"Electricity Tax",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"vat_rate",label:"VAT Rate",step:"0.01",unit:"decimal (0.08 = 8%)",type:"number"}]},{title:"General",icon:"⚙️",fields:[{key:"currency",label:"Currency",step:"",unit:"",type:"text"}]}],qe={consumption:"Power Consumption",production:"Power Production",gas:"Gas Consumption"},fe={consumption:"⚡",production:"☀️",gas:"🔥"};function Oe(a){return a.map(e=>`<span class="meter-type-badge meter-type-${e}">${fe[e]??""} ${qe[e]??e}</span>`).join(" ")}function he(a,e,s){const t=a+1;return s?`
      <div class="meter-card">
        <div class="meter-header">
          <strong>Meter ${t}</strong>
          <code class="meter-id">${e.id?"..."+e.id.slice(-8):"—"}</code>
        </div>
        <div class="meter-types">${Oe(e.types)}</div>
      </div>
    `:`
    <div class="meter-card">
      <div class="meter-header">
        <strong>Meter ${t}</strong>
        ${t>1?`<button type="button" class="btn-icon remove-meter-btn" data-meter="${a}" title="Remove meter">&times;</button>`:""}
      </div>
      <div class="form-row">
        <label for="meter-id-${a}">Metering Point ID</label>
        <div class="input-group">
          <input
            id="meter-id-${a}"
            name="meter_${a}_id"
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
            <input type="checkbox" name="meter_${a}_consumption" ${e.types.includes("consumption")?"checked":""} />
            <span>⚡ Power Consumption</span>
          </label>
          <label class="meter-type-cb">
            <input type="checkbox" name="meter_${a}_production" ${e.types.includes("production")?"checked":""} />
            <span>☀️ Power Production</span>
          </label>
          <label class="meter-type-cb">
            <input type="checkbox" name="meter_${a}_gas" ${e.types.includes("gas")?"checked":""} />
            <span>🔥 Gas Consumption</span>
          </label>
        </div>
      </div>
    </div>
  `}function He(a,e="ha",s){if(!a&&e==="ha")return`
      <section class="settings-view">
        <div class="card">
          <p class="muted">Loading configuration…</p>
        </div>
      </section>
    `;const t=e==="standalone"?(s==null?void 0:s.meters)??[{id:"",types:["consumption"]}]:(a==null?void 0:a.meters)??[];let r="";if(e==="standalone"){const c=t.map((n,f)=>he(f,n,!1)).join("");r=`
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
              ${c}
            </div>
            ${t.length<10?`
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
    `}else{const c=(a==null?void 0:a.meters)??[];r=`
      <div class="card" style="margin-bottom: var(--sp-6); padding: var(--sp-4) var(--sp-5);">
        <p class="muted" style="margin: 0 0 var(--sp-3) 0;">🔒 API credentials are managed through Home Assistant &rarr; Settings &rarr; Integrations &rarr; Leneda</p>
        <div class="form-section">
          <div class="form-section-title">📊  Configured Metering Points</div>
          <div id="meters-container">
            ${c.length>0?c.map((f,x)=>he(x,f,!0)).join(""):'<p class="muted">No meters configured</p>'}
          </div>
        </div>
      </div>
    `}const i=c=>c.map(n=>{const f=a?a[n.key]??"":"";return`
        <div class="form-row">
          <label for="cfg-${n.key}">${n.label}</label>
          <div class="input-group">
            <input
              id="cfg-${n.key}"
              name="${n.key}"
              type="${n.type}"
              ${n.type==="number"?`step="${n.step}"`:""}
              value="${f}"
            />
            ${n.unit?`<span class="input-unit">${n.unit}</span>`:""}
          </div>
        </div>
      `}).join(""),o=((a==null?void 0:a.meters)??[]).filter(c=>c.types.includes("production")),u=(a==null?void 0:a.feed_in_rates)??[],p=e==="ha";function d(c){return u.find(n=>n.meter_id===c)??{meter_id:c,mode:"fixed",tariff:(a==null?void 0:a.feed_in_tariff)??.08,sensor_entity:""}}const g=o.length===0?'<p class="muted">No production meters configured — add a meter with Power Production type above.</p>':o.map((c,n)=>{const f=d(c.id),x=c.id?"…"+c.id.slice(-8):`Meter ${n+1}`;return`
          <div class="feed-in-meter-card" data-meter-idx="${n}" data-meter-id="${c.id}">
            <div class="feed-in-meter-header">
              <span class="meter-type-badge meter-type-production">☀️ ${x}</span>
              <input type="hidden" name="feed_in_rate_${n}_meter_id" value="${c.id}" />
            </div>
            <div class="form-row">
              <label>Pricing Mode</label>
              <div class="feed-in-mode-toggle">
                <label class="mode-option">
                  <input type="radio" name="feed_in_rate_${n}_mode" value="fixed" ${f.mode==="fixed"?"checked":""} />
                  <span class="mode-label">💶 Fixed Tariff</span>
                </label>
                <label class="mode-option">
                  <input type="radio" name="feed_in_rate_${n}_mode" value="sensor" ${f.mode==="sensor"?"checked":""} />
                  <span class="mode-label">📡 HA Sensor</span>
                </label>
              </div>
            </div>
            <div class="feed-in-fixed-fields" data-rate-idx="${n}" style="${f.mode==="fixed"?"":"display:none"}">
              <div class="form-row">
                <label for="cfg-feed_in_rate_${n}_tariff">Feed-in Tariff</label>
                <div class="input-group">
                  <input id="cfg-feed_in_rate_${n}_tariff" name="feed_in_rate_${n}_tariff" type="number" step="0.0001" value="${f.tariff}" />
                  <span class="input-unit">EUR/kWh</span>
                </div>
              </div>
            </div>
            <div class="feed-in-sensor-fields" data-rate-idx="${n}" style="${f.mode==="sensor"?"":"display:none"}">
              <div class="form-row">
                <label for="cfg-feed_in_rate_${n}_sensor">Market Price Sensor</label>
                <div class="input-group sensor-picker-group">
                  <input
                    id="cfg-feed_in_rate_${n}_sensor"
                    name="feed_in_rate_${n}_sensor_entity"
                    type="text"
                    value="${f.sensor_entity}"
                    placeholder="${p?"sensor.electricity_price":"sensor.electricity_price (HA mode only)"}"
                    list="ha-entity-list"
                  />
                  <span class="input-unit">entity_id</span>
                </div>
                ${p&&n===0?'<datalist id="ha-entity-list"></datalist>':""}
              </div>
              <div class="form-row">
                <label for="cfg-feed_in_rate_${n}_fallback">Fallback Tariff</label>
                <div class="input-group">
                  <input id="cfg-feed_in_rate_${n}_fallback" name="feed_in_rate_${n}_tariff" type="number" step="0.0001" value="${f.tariff}" />
                  <span class="input-unit">EUR/kWh</span>
                </div>
                <p class="muted" style="font-size: var(--text-xs); margin-top: var(--sp-1);">
                  Used when the sensor is unavailable.
                </p>
              </div>
            </div>
          </div>
        `}).join(""),m=((a==null?void 0:a.meters)??[]).some(c=>c.types.includes("gas"))||(a==null?void 0:a.meter_has_gas),h=(a==null?void 0:a.meters)??[],w=(a==null?void 0:a.meter_monthly_fees)??[];function v(c){return w.find(n=>n.meter_id===c)??{meter_id:c,label:"",fee:0}}const k=h.length===0?'<p class="muted">No meters configured.</p>':h.map((c,n)=>{const f=v(c.id),x=c.id?"…"+c.id.slice(-8):`Meter ${n+1}`;return`
          <div class="meter-fee-card" style="margin-bottom: var(--sp-3); padding: var(--sp-3); border: 1px solid var(--clr-border); border-radius: var(--radius);">
            <div style="display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2);">
              <span>${c.types.map(P=>fe[P]??"").join(" ")}</span>
              <code style="font-size: var(--text-sm);">${x}</code>
              <input type="hidden" name="meter_fee_${n}_meter_id" value="${c.id}" />
            </div>
            <div class="form-row" style="margin-bottom: var(--sp-2);">
              <label for="cfg-meter_fee_${n}_label">Label</label>
              <div class="input-group">
                <input id="cfg-meter_fee_${n}_label" name="meter_fee_${n}_label" type="text" value="${f.label||`Meter ${n+1} metering fee`}" placeholder="e.g. Smart meter rental" />
              </div>
            </div>
            <div class="form-row">
              <label for="cfg-meter_fee_${n}_fee">Monthly Fee</label>
              <div class="input-group">
                <input id="cfg-meter_fee_${n}_fee" name="meter_fee_${n}_fee" type="number" step="0.01" value="${f.fee}" />
                <span class="input-unit">EUR/mo</span>
              </div>
            </div>
          </div>
        `}).join(""),b=Ge.map(c=>{if(c.title==="Gas Billing"&&!m||c.title==="Meter Fees"&&h.length<2)return"";let n;return c.title==="Feed-in / Selling"?n=g:c.title==="Meter Fees"?n=`<p class="muted" style="margin: 0 0 var(--sp-3) 0; font-size: 0.85rem;">
        Each metering point has a fixed monthly rental/metering fee. Set the cost per meter below.
      </p>`+k:n=i(c.fields),`
    <div class="form-section">
      <div class="form-section-title">${c.icon}  ${c.title}</div>
      ${n}
    </div>
  `}).join("");return`
    <section class="settings-view">
      ${r}

      <div class="section-header">
        <h2>Billing Configuration</h2>
        <span class="muted">Luxembourg energy billing rates &mdash; adjust values to match your contract</span>
      </div>

      <div class="card">
        <form id="settings-form">
          ${a?b:'<p class="muted">Loading configuration…</p>'}
          ${a?`
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save Configuration</button>
            <button type="button" id="reset-config-btn" class="btn btn-outline">Reset to Defaults</button>
          </div>
          `:""}
        </form>
      </div>
    </section>
  `}function X(a,e){return`
    <header class="navbar" role="navigation" aria-label="Main navigation">
      <div class="navbar-brand">
        <img src="/leneda-panel/static/logo.png" srcset="/leneda-panel/static/logo@2x.png 2x" alt="Leneda Logo" class="navbar-logo-img" />

      </div>
      <nav class="navbar-tabs" role="tablist">
        ${[{id:"dashboard",label:"Dashboard",icon:"🏠"},{id:"sensors",label:"Sensors",icon:"📊"},{id:"invoice",label:"Invoice",icon:"💰"},{id:"settings",label:"Settings",icon:"⚙️"}].map(t=>`
          <button
            class="nav-btn ${t.id===a?"active":""}"
            data-tab="${t.id}"
            role="tab"
            aria-selected="${t.id===a}"
            aria-controls="panel-${t.id}"
          >
            <span class="nav-icon" aria-hidden="true">${t.icon}</span>
            <span class="nav-label">${t.label}</span>
          </button>
        `).join("")}

        <div style="margin-left: auto; display: flex; gap: 10px; align-items: center; padding-right: 4px;">
             <!-- Buy Me A Coffee (Sleek Redesign) -->
            <a href="https://buymeacoffee.com/koosoli" target="_blank" rel="noopener noreferrer" 
               style="display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #FFDD00 0%, #FBB034 100%); color: #000; padding: 6px 16px; border-radius: 12px; font-weight: 800; font-size: 13px; text-decoration: none; box-shadow: 0 4px 15px rgba(251, 176, 52, 0.3); transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.2);">
              <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="currentColor"><path d="M20,3H4v10c0,2.21,1.79,4,4,4h6c2.21,0,4-1.79,4-4v-3h2c1.1,0,2-0.9,2-2V5C22,3.9,21.1,3,20,3z M20,8h-2V5h2V8z M18,15H4v-1h14V15z M18,12H4V5h14V12z"/></svg>
              <span>Support Project</span>
            </a>

            <!-- GitHub (Subtle & Integrated) -->
            <a href="https://github.com/koosoli/Leneda-HACS-integration" target="_blank" rel="noopener noreferrer"
               style="display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; background: rgba(255,255,255,0.05); color: var(--clr-text); border-radius: 8px; border: 1px solid var(--clr-border); transition: all 0.2s;"
               title="View Project on GitHub">
              <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            </a>
        </div>
      </nav>
    </header>
  `}const ye="leneda_credentials";function Ue(){try{const a=localStorage.getItem(ye);if(a)return JSON.parse(a)}catch{}return null}function z(a){try{localStorage.setItem(ye,JSON.stringify(a))}catch{}}class Ne{constructor(e){F(this,"root");F(this,"state",{tab:"dashboard",range:"yesterday",customStart:"",customEnd:"",chartUnit:"kw",rangeData:null,sensors:null,config:null,loading:!0,error:null,mode:"ha",credentials:null});F(this,"preZoomRange",null);F(this,"preZoomCustomStart","");F(this,"preZoomCustomEnd","");this.root=e}async mount(){this.render();const e=await ge();if(this.state.mode=e.mode,e.mode==="standalone"){const s=Ue();if(s&&(this.state.credentials=s),!e.configured&&!s){this.state.tab="settings",this.state.loading=!1,this.state.error="Please configure your Leneda API credentials in Settings.",this.render();return}if(!e.configured&&s)try{const{saveCredentials:t}=await E(async()=>{const{saveCredentials:r}=await Promise.resolve().then(()=>W);return{saveCredentials:r}},void 0);await t(s)}catch{}if(!s)try{this.state.credentials=await ve()}catch{}}await this.loadData()}async loadData(){this.state.loading=!0,this.state.error=null,this.render();try{const[e,s,t]=await Promise.all([me(this.state.range),Z(),V()]);this.state.rangeData=e,this.state.sensors=s,this.state.config=t}catch(e){this.state.error=e instanceof Error?e.message:"Failed to load data"}finally{this.state.loading=!1,this.render()}}async changeRange(e){if(this.preZoomRange=null,this.state.range=e,e==="custom"){if(!this.state.customStart||!this.state.customEnd){const s=new Date;s.setDate(s.getDate()-1);const t=new Date(s);t.setDate(t.getDate()-6),this.state.customStart=t.toISOString().slice(0,10),this.state.customEnd=s.toISOString().slice(0,10)}this.render();return}this.state.loading=!0,this.render();try{const{fetchRangeData:s}=await E(async()=>{const{fetchRangeData:t}=await Promise.resolve().then(()=>W);return{fetchRangeData:t}},void 0);this.state.rangeData=await s(e)}catch(s){this.state.error=s instanceof Error?s.message:"Failed to load data"}finally{this.state.loading=!1,this.render()}}async applyCustomRange(){this.preZoomRange=null;const{customStart:e,customEnd:s}=this.state;if(!(!e||!s)){this.state.loading=!0,this.render();try{const{fetchCustomData:t}=await E(async()=>{const{fetchCustomData:i}=await Promise.resolve().then(()=>W);return{fetchCustomData:i}},void 0),r=await t(e,s);this.state.rangeData={range:"custom",consumption:r.consumption,production:r.production,exported:r.exported??0,self_consumed:r.self_consumed??0,gas_energy:r.gas_energy??0,gas_volume:r.gas_volume??0,peak_power_kw:r.peak_power_kw??0,exceedance_kwh:r.exceedance_kwh??0,metering_point:r.metering_point??""}}catch(t){this.state.error=t instanceof Error?t.message:"Failed to load custom data"}finally{this.state.loading=!1,this.render()}}}changeTab(e){this.state.tab=e,this.render(),e==="sensors"&&!this.state.sensors&&Z().then(s=>{this.state.sensors=s,this.render()}),e==="settings"&&!this.state.config&&V().then(s=>{this.state.config=s,this.render()})}render(){var i;const{tab:e,loading:s,error:t}=this.state;if(s&&!this.state.rangeData){this.root.innerHTML=`
        <div class="app-shell">
          ${X(e)}
          <main class="main-content">
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading Leneda data…</p>
            </div>
          </main>
        </div>
      `;return}if(t&&!this.state.rangeData){this.root.innerHTML=`
        <div class="app-shell">
          ${X(e)}
          <main class="main-content">
            <div class="error-state">
              <h2>Connection Error</h2>
              <p>${t}</p>
              <button class="btn btn-primary" id="retry-btn">Retry</button>
            </div>
          </main>
        </div>
      `,(i=this.root.querySelector("#retry-btn"))==null||i.addEventListener("click",()=>this.loadData());return}let r="";switch(e){case"dashboard":r=ue(this.state);break;case"sensors":r=Ie(this.state.sensors);break;case"invoice":r=Ve(this.state);break;case"settings":r=He(this.state.config,this.state.mode,this.state.credentials);break}this.root.innerHTML=`
      <div class="app-shell">
        ${X(e)}
        <main class="main-content">
          ${s?'<div class="loading-bar"></div>':""}
          ${r}
        </main>
      </div>
    `,this.attachNavListeners(),this.attachDashboardListeners(),this.attachSettingsListeners()}attachNavListeners(){this.root.querySelectorAll("[data-tab]").forEach(e=>{e.addEventListener("click",()=>{const s=e.dataset.tab;this.changeTab(s)})})}attachDashboardListeners(e=!1){this.root.querySelectorAll("[data-range]").forEach(o=>{o.addEventListener("click",()=>{const u=o.dataset.range;this.changeRange(u)})});const s=this.root.querySelector("#custom-start"),t=this.root.querySelector("#custom-end");s&&s.addEventListener("change",()=>{this.state.customStart=s.value}),t&&t.addEventListener("change",()=>{this.state.customEnd=t.value});const r=this.root.querySelector("#apply-custom-range");if(r==null||r.addEventListener("click",()=>this.applyCustomRange()),this.root.querySelectorAll("[data-chart-unit]").forEach(o=>{o.addEventListener("click",()=>{const u=o.dataset.chartUnit;u!==this.state.chartUnit&&(this.state.chartUnit=u,this.render())})}),!e){const o=this.root.querySelector("#energy-chart");o&&this.state.rangeData&&this.initChart(o)}const i=this.root.querySelector(".reset-zoom-btn");i==null||i.addEventListener("click",async()=>{const{resetChartZoom:o}=await E(async()=>{const{resetChartZoom:u}=await import("./Charts-C6KIBs7A.js");return{resetChartZoom:u}},[]);if(o(),i.style.display="none",this.preZoomRange!==null){const u=this.preZoomRange;this.state.customStart=this.preZoomCustomStart,this.state.customEnd=this.preZoomCustomEnd,this.preZoomRange=null,this.preZoomCustomStart="",this.preZoomCustomEnd="",u==="custom"?(this.state.range="custom",this.applyCustomRange()):this.changeRange(u)}else this.changeRange(this.state.range==="custom"?"yesterday":this.state.range)})}attachSettingsListeners(){var r,i,o,u,p;const e=this.root.querySelector("#credentials-form");if(e){const d=this.root.querySelector("#add-meter-btn");d==null||d.addEventListener("click",()=>{var v,k;const h=new FormData(e),w=g(h);if(w.length<10){w.push({id:"",types:["consumption"]});const b={api_key:h.get("api_key")||((v=this.state.credentials)==null?void 0:v.api_key)||"",energy_id:h.get("energy_id")||((k=this.state.credentials)==null?void 0:k.energy_id)||"",meters:w};this.state.credentials=b,z(b),this.render()}}),this.root.querySelectorAll(".remove-meter-btn").forEach(h=>{h.addEventListener("click",()=>{var c,n;const w=parseInt(h.dataset.meter??"0",10),v=new FormData(e),k=g(v);k.splice(w,1);const b={api_key:v.get("api_key")||((c=this.state.credentials)==null?void 0:c.api_key)||"",energy_id:v.get("energy_id")||((n=this.state.credentials)==null?void 0:n.energy_id)||"",meters:k};this.state.credentials=b,z(b),this.render()})});const g=h=>{var v,k,b;const w=[];for(let c=0;c<10;c++){const n=h.get(`meter_${c}_id`);if(n===null)break;const f=[];(v=e.querySelector(`[name="meter_${c}_consumption"]`))!=null&&v.checked&&f.push("consumption"),(k=e.querySelector(`[name="meter_${c}_production"]`))!=null&&k.checked&&f.push("production"),(b=e.querySelector(`[name="meter_${c}_gas"]`))!=null&&b.checked&&f.push("gas"),w.push({id:n.trim(),types:f})}return w};e.addEventListener("submit",async h=>{h.preventDefault();const w=new FormData(e),v={api_key:w.get("api_key"),energy_id:w.get("energy_id"),meters:g(w)},k=this.root.querySelector("#creds-status");try{z(v);const{saveCredentials:b}=await E(async()=>{const{saveCredentials:c}=await Promise.resolve().then(()=>W);return{saveCredentials:c}},void 0);await b(v),k&&(k.innerHTML='<p style="color: var(--clr-production); padding: var(--sp-3) 0;">✓ Credentials saved. Reloading data…</p>'),this.state.credentials=v,this.state.error=null,await this.loadData()}catch(b){k&&(k.innerHTML=`<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ Save failed: ${b instanceof Error?b.message:b}</p>`)}});const m=this.root.querySelector("#test-creds-btn");m==null||m.addEventListener("click",async()=>{const h=new FormData(e),w={api_key:h.get("api_key"),energy_id:h.get("energy_id"),meters:g(h)},v=this.root.querySelector("#creds-status");v&&(v.innerHTML='<p style="color: var(--clr-muted); padding: var(--sp-3) 0;">Testing connection…</p>');try{const{testCredentials:k}=await E(async()=>{const{testCredentials:c}=await Promise.resolve().then(()=>W);return{testCredentials:c}},void 0),b=await k(w);v&&(v.innerHTML=b.success?`<p style="color: var(--clr-production); padding: var(--sp-3) 0;">✓ ${b.message}</p>`:`<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ ${b.message}</p>`)}catch(k){v&&(v.innerHTML=`<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ Test failed: ${k instanceof Error?k.message:k}</p>`)}})}const s=this.root.querySelector("#settings-form");if(!s)return;if(s.querySelectorAll('input[type="radio"][name^="feed_in_rate_"][name$="_mode"]').forEach(d=>{d.addEventListener("change",()=>{const g=d.name.match(/feed_in_rate_(\d+)_mode/);if(!g)return;const m=g[1],h=s.querySelector(`.feed-in-fixed-fields[data-rate-idx="${m}"]`),w=s.querySelector(`.feed-in-sensor-fields[data-rate-idx="${m}"]`);h&&(h.style.display=d.value==="fixed"?"":"none"),w&&(w.style.display=d.value==="sensor"?"":"none")})}),this.state.mode==="ha"){const d=this.root.querySelector("#ha-entity-list");if(d){const g={};try{const m=(i=(r=window.parent)==null?void 0:r.document)==null?void 0:i.querySelector("home-assistant"),h=(p=(u=(o=m==null?void 0:m.hass)==null?void 0:o.auth)==null?void 0:u.data)==null?void 0:p.access_token;h&&(g.Authorization=`Bearer ${h}`)}catch{}fetch("/leneda_api/ha-entities",{headers:g,credentials:"include"}).then(m=>m.ok?m.json():Promise.resolve({entities:[]})).then(({entities:m})=>{d.innerHTML=m.map(h=>`<option value="${h}"></option>`).join("")}).catch(()=>{})}}s.addEventListener("submit",async d=>{d.preventDefault();const g=new FormData(s),m={};s.querySelectorAll('input[type="checkbox"]').forEach(n=>{m[n.name]=n.checked});const h=[],w=/^feed_in_rate_(\d+)_(.+)$/,v={},k=[],b=/^meter_fee_(\d+)_(.+)$/,c={};for(const[n,f]of g.entries()){const x=n.match(w);if(x){const L=x[1],T=x[2];v[L]||(v[L]={}),v[L][T]=f;continue}const C=n.match(b);if(C){const L=C[1],T=C[2];c[L]||(c[L]={}),c[L][T]=f;continue}if(m[n]!==void 0&&typeof m[n]=="boolean")continue;const P=parseFloat(f);m[n]=isNaN(P)?f:P}for(const n of Object.keys(v).sort()){const f=v[n];h.push({meter_id:f.meter_id??"",mode:f.mode??"fixed",tariff:parseFloat(f.tariff??"0.08")||.08,sensor_entity:f.sensor_entity??""})}h.length>0&&(m.feed_in_rates=h);for(const n of Object.keys(c).sort()){const f=c[n];k.push({meter_id:f.meter_id??"",label:f.label??"",fee:parseFloat(f.fee??"0")||0})}k.length>0&&(m.meter_monthly_fees=k);try{const{saveConfig:n}=await E(async()=>{const{saveConfig:f}=await Promise.resolve().then(()=>W);return{saveConfig:f}},void 0);await n(m),this.state.config=await V(),this.render()}catch(n){alert("Failed to save: "+(n instanceof Error?n.message:n))}});const t=this.root.querySelector("#reset-config-btn");t==null||t.addEventListener("click",async()=>{if(confirm("Reset all billing rates to defaults?"))try{const{resetConfig:d}=await E(async()=>{const{resetConfig:g}=await Promise.resolve().then(()=>W);return{resetConfig:g}},void 0);await d(),this.state.config=await V(),this.render()}catch(d){alert("Failed to reset: "+(d instanceof Error?d.message:d))}})}async initChart(e){var s;try{const{renderEnergyChart:t}=await E(async()=>{const{renderEnergyChart:g}=await import("./Charts-C6KIBs7A.js");return{renderEnergyChart:g}},[]),{fetchTimeseries:r}=await E(async()=>{const{fetchTimeseries:g}=await Promise.resolve().then(()=>W);return{fetchTimeseries:g}},void 0),{start:i,end:o}=this.getDateRangeISO(),[u,p]=await Promise.all([r("1-1:1.29.0",i,o),r("1-1:2.29.0",i,o)]),d=((s=this.state.config)==null?void 0:s.reference_power_kw)??0;t(e,u,p,{unit:this.state.chartUnit,referencePowerKw:d,onZoomChange:(g,m)=>{this.handleChartZoomChange(g,m)}})}catch(t){console.error("Chart init failed:",t)}}async handleChartZoomChange(e,s){try{this.preZoomRange===null&&(this.preZoomRange=this.state.range,this.preZoomCustomStart=this.state.customStart,this.preZoomCustomEnd=this.state.customEnd);const{fetchCustomData:t}=await E(async()=>{const{fetchCustomData:u}=await Promise.resolve().then(()=>W);return{fetchCustomData:u}},void 0),r=e.slice(0,10),i=s.slice(0,10),o=await t(r,i);this.state.range="custom",this.state.customStart=r,this.state.customEnd=i,this.state.rangeData={range:"custom",consumption:o.consumption,production:o.production,exported:o.exported??0,self_consumed:o.self_consumed??0,gas_energy:o.gas_energy??0,gas_volume:o.gas_volume??0,peak_power_kw:o.peak_power_kw??0,exceedance_kwh:o.exceedance_kwh??0,metering_point:o.metering_point??""},this.renderDashboardPartial()}catch(t){console.error("Zoom data fetch failed:",t)}}renderDashboardPartial(){var f,x;const e=this.root.querySelector(".dashboard");if(!e||!this.state.rangeData)return;const s=document.createElement("div");s.innerHTML=ue(this.state);const t=s.querySelector(".dashboard");if(!t)return;const r=e.querySelector(".range-selector"),i=t.querySelector(".range-selector");r&&i&&r.replaceWith(i);const o=e.querySelector(".custom-range-picker"),u=t.querySelector(".custom-range-picker");o&&u?o.replaceWith(u):!o&&u?(f=e.querySelector(".range-selector"))==null||f.insertAdjacentElement("afterend",u):o&&!u&&o.remove();const p=e.querySelector(".stats-grid"),d=t.querySelector(".stats-grid");p&&d&&p.replaceWith(d);const g=e.querySelector(".flow-card"),m=t.querySelector(".flow-card");g&&m&&g.replaceWith(m);const h=e.querySelector(".metrics-card"),w=t.querySelector(".metrics-card");h&&w&&h.replaceWith(w);const v=e.querySelector(".chart-header .card-title"),k=t.querySelector(".chart-header .card-title");v&&k&&v.replaceWith(k);const b=e.querySelector(".reset-zoom-btn");b&&(b.style.display=""),e.querySelectorAll("[data-range]").forEach(C=>{C.addEventListener("click",()=>{this.changeRange(C.dataset.range)})});const c=e.querySelector("#custom-start"),n=e.querySelector("#custom-end");c&&c.addEventListener("change",()=>{this.state.customStart=c.value}),n&&n.addEventListener("change",()=>{this.state.customEnd=n.value}),(x=e.querySelector("#apply-custom-range"))==null||x.addEventListener("click",()=>{this.preZoomRange=null,this.applyCustomRange()})}getDateRangeISO(){const e=new Date,s=t=>t.toISOString();switch(this.state.range){case"custom":{const t=new Date(this.state.customStart+"T00:00:00"),r=new Date(this.state.customEnd+"T23:59:59.999");return{start:s(t),end:s(r)}}case"yesterday":{const t=new Date(e);t.setDate(t.getDate()-1),t.setHours(0,0,0,0);const r=new Date(t);return r.setHours(23,59,59,999),{start:s(t),end:s(r)}}case"this_week":{const t=new Date(e),r=t.getDay()||7;return t.setDate(t.getDate()-r+1),t.setHours(0,0,0,0),{start:s(t),end:s(e)}}case"last_week":{const t=new Date(e),r=t.getDay()||7,i=new Date(t);i.setDate(t.getDate()-r),i.setHours(23,59,59,999);const o=new Date(i);return o.setDate(i.getDate()-6),o.setHours(0,0,0,0),{start:s(o),end:s(i)}}case"this_month":{const t=new Date(e.getFullYear(),e.getMonth(),1);return{start:s(t),end:s(e)}}case"last_month":{const t=new Date(e.getFullYear(),e.getMonth()-1,1),r=new Date(e.getFullYear(),e.getMonth(),0,23,59,59,999);return{start:s(t),end:s(r)}}case"this_year":{const t=new Date(e.getFullYear(),0,1);return{start:s(t),end:s(e)}}case"last_year":{const t=new Date(e.getFullYear()-1,0,1),r=new Date(e.getFullYear()-1,11,31,23,59,59,999);return{start:s(t),end:s(r)}}default:{const t=new Date(e);t.setDate(t.getDate()-1),t.setHours(0,0,0,0);const r=new Date(t);return r.setHours(23,59,59,999),{start:s(t),end:s(r)}}}}}if(window.self===window.top&&window.location.pathname.startsWith("/leneda-panel/"))window.location.href="/leneda";else{const a=document.getElementById("app");a&&new Ne(a).mount()}
