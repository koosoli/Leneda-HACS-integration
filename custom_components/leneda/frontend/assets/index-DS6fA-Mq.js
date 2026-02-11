var Se=Object.defineProperty;var Ce=(s,e,a)=>e in s?Se(s,e,{enumerable:!0,configurable:!0,writable:!0,value:a}):s[e]=a;var P=(s,e,a)=>Ce(s,typeof e!="symbol"?e+"":e,a);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))t(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&t(i)}).observe(document,{childList:!0,subtree:!0});function a(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function t(r){if(r.ep)return;r.ep=!0;const n=a(r);fetch(r.href,n)}})();const Ee="modulepreload",De=function(s){return"/leneda-panel/static/"+s},de={},E=function(e,a,t){let r=Promise.resolve();if(a&&a.length>0){let i=function(d){return Promise.all(d.map(h=>Promise.resolve(h).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),l=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));r=i(a.map(d=>{if(d=De(d),d in de)return;de[d]=!0;const h=d.endsWith(".css"),g=h?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${d}"]${g}`))return;const v=document.createElement("link");if(v.rel=h?"stylesheet":Ee,h||(v.as="script"),v.crossOrigin="",v.href=d,l&&v.setAttribute("nonce",l),document.head.appendChild(v),h)return new Promise((y,p)=>{v.addEventListener("load",y),v.addEventListener("error",()=>p(new Error(`Unable to preload CSS for ${d}`)))})}))}function n(i){const o=new Event("vite:preloadError",{cancelable:!0});if(o.payload=i,window.dispatchEvent(o),!o.defaultPrevented)throw i}return r.then(i=>{for(const o of i||[])o.status==="rejected"&&n(o.reason);return e().catch(n)})};function Le(){var s,e,a,t,r;try{const n=(e=(s=window.parent)==null?void 0:s.document)==null?void 0:e.querySelector("home-assistant");return((r=(t=(a=n==null?void 0:n.hass)==null?void 0:a.auth)==null?void 0:t.data)==null?void 0:r.access_token)??null}catch{return null}}async function S(s,e){const a=Le(),t={...e==null?void 0:e.headers,...a?{Authorization:`Bearer ${a}`}:{}},r={...e,credentials:"include",headers:t},n=await fetch(s,r);if(!n.ok)throw new Error(`API ${n.status}: ${n.statusText}`);return n.json()}async function z(s){return S(`/leneda_api/data?range=${s}`)}async function Re(s,e){return S(`/leneda_api/data/custom?start=${encodeURIComponent(s)}&end=${encodeURIComponent(e)}`)}async function Me(s,e,a){let t=`/leneda_api/data/timeseries?obis=${encodeURIComponent(s)}`;return e&&(t+=`&start=${encodeURIComponent(e)}`),a&&(t+=`&end=${encodeURIComponent(a)}`),S(t)}async function Pe(s,e,a){let t=`/leneda_api/data/timeseries/per-meter?obis=${encodeURIComponent(s)}`;return e&&(t+=`&start=${encodeURIComponent(e)}`),a&&(t+=`&end=${encodeURIComponent(a)}`),S(t)}async function Z(){return S("/leneda_api/sensors")}async function I(){return S("/leneda_api/config")}async function We(s){await S("/leneda_api/config",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)})}async function Te(){await S("/leneda_api/config/reset",{method:"POST"})}async function ve(){try{return await S("/leneda_api/mode")}catch{return{mode:"standalone",configured:!1}}}async function fe(){return S("/leneda_api/credentials")}async function Fe(s){await S("/leneda_api/credentials",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)})}async function Ie(s){return S("/leneda_api/credentials/test",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)})}const D=Object.freeze(Object.defineProperty({__proto__:null,fetchConfig:I,fetchCredentials:fe,fetchCustomData:Re,fetchMode:ve,fetchPerMeterTimeseries:Pe,fetchRangeData:z,fetchSensors:Z,fetchTimeseries:Me,resetConfig:Te,saveConfig:We,saveCredentials:Fe,testCredentials:Ie},Symbol.toStringTag,{value:"Module"}));function u(s,e=2){return s==null?"—":s.toLocaleString(void 0,{minimumFractionDigits:0,maximumFractionDigits:e})}function ue(s){return new Date(s).toLocaleDateString(void 0,{month:"short",day:"numeric"})}function Ae(s){return new Date(s).toLocaleString(void 0,{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}const pe=[{id:"yesterday",label:"Yesterday"},{id:"this_week",label:"This Week"},{id:"last_week",label:"Last Week"},{id:"this_month",label:"This Month"},{id:"last_month",label:"Last Month"},{id:"this_year",label:"This Year"},{id:"last_year",label:"Last Year"},{id:"custom",label:"Custom"}];function he(s){var $;const e=s.rangeData,a=(e==null?void 0:e.consumption)??0,t=(e==null?void 0:e.production)??0,r=(e==null?void 0:e.exported)??0,n=(e==null?void 0:e.self_consumed)??0,i=(e==null?void 0:e.gas_energy)??0,o=(e==null?void 0:e.gas_volume)??0,l=(e==null?void 0:e.peak_power_kw)??0,d=Math.max(0,a-n-((e==null?void 0:e.shared_with_me)??0)),h=Math.max(0,r-((e==null?void 0:e.shared)??0)),g=(e==null?void 0:e.shared)??0,v=(e==null?void 0:e.shared_with_me)??0,y=a>0?Math.min(100,n/a*100):0,p=s.range==="custom"&&s.customStart&&s.customEnd?`${ue(s.customStart+"T00:00:00")} — ${ue(s.customEnd+"T00:00:00")}`:(($=pe.find(k=>k.id===s.range))==null?void 0:$.label)??"Yesterday";return`
    <div class="dashboard" style="position: relative;">
      <div style="position:fixed;bottom:4px;right:4px;font-size:10px;opacity:0.5;pointer-events:none;z-index:9999;">v:ULTRATHINK</div>

      <!-- Range Selector -->
      <div class="range-selector">
        ${pe.map(k=>`
          <button
            class="range-btn ${k.id===s.range?"active":""}"
            data-range="${k.id}"
          >${k.label}</button>
        `).join("")}
      </div>

      ${(()=>{if(!(e!=null&&e.start)||!(e!=null&&e.end))return"";try{const k=new Date(e.start),m=new Date(e.end);return isNaN(k.getTime())||isNaN(m.getTime())?"":`
            <div class="range-info-bar">
              📅 ${k.toLocaleDateString()} — ${m.toLocaleDateString()}
            </div>
          `}catch{return""}})()}

      ${s.range==="custom"?`
      <!-- Custom Date Range Picker -->
      <div class="custom-range-picker">
        <label>
          <span>From</span>
          <input type="date" id="custom-start" value="${s.customStart??""}" />
        </label>
        <label>
          <span>To</span>
          <input type="date" id="custom-end" value="${s.customEnd??""}" />
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
            <div class="stat-value">${u(a)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card production">
          <div class="stat-icon">☀️</div>
          <div class="stat-body">
            <div class="stat-label">Production</div>
            <div class="stat-value">${u(t)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card export">
          <div class="stat-icon">📤</div>
          <div class="stat-body">
            <div class="stat-label">Exported</div>
            <div class="stat-value">${u(r)} <span class="stat-unit">kWh</span></div>
          </div>
        </div>

        <div class="stat-card self-consumed">
          <div class="stat-icon">🏠</div>
          <div class="stat-body">
            <div class="stat-label">Self-Consumed</div>
            <div class="stat-value">${u(n)} <span class="stat-unit">kWh</span></div>
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
                    <span class="module-value highlight-red">${u(a)}</span>
                    <span class="module-unit">kWh</span>
                  </div>
                </div>
                <div class="module-visual"><div class="wave-bg red"></div></div>
              </div>

              <div class="glass-module production-module">
                <div class="module-info">
                  <span class="module-label">Solar Production <span class="info-icon">ⓘ</span></span>
                  <div class="module-value-row">
                    <span class="module-value highlight-green">${u(t)}</span>
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
                ${h>0?`
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
                  <span class="badge-value">${u(d)} <small>kWh</small></span>
                </div>
                <div class="glass-badge highlight-blue sold-badge">
                  <span class="badge-label">Market Out</span>
                  <span class="badge-value">${u(h)} <small>kWh</small></span>
                </div>
                <div class="glass-badge highlight-blue shared-badge">
                  <span class="badge-label">Sent</span>
                  <span class="badge-value">${u(g)} <small>kWh</small></span>
                </div>
                <div class="glass-badge highlight-blue received-badge">
                  <span class="badge-label">Received</span>
                  <span class="badge-value">${u(v)} <small>kWh</small></span>
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
              <span class="metric-value">${u(y,1)}%</span>
            </div>
            <div class="metric-bar">
              <div class="metric-fill" style="width: ${y}%"></div>
            </div>
          </div>
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Self-Consumed</span>
              <span class="metric-value">${u(n)} kWh</span>
            </div>
          </div>
          ${l>0?`
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Peak Power</span>
              <span class="metric-value">${u(l,2)} kW</span>
            </div>
          </div>
          `:""}
          <div class="metric ${((e==null?void 0:e.exceedance_kwh)??0)>0?"metric-warning":"metric-ok"}">
            <div class="metric-header">
              <span class="metric-label">${((e==null?void 0:e.exceedance_kwh)??0)>0?"⚠️":"✅"} Exceedance</span>
              <span class="metric-value">${u((e==null?void 0:e.exceedance_kwh)??0,2)} kWh</span>
            </div>
          </div>
          ${i>0||o>0?`
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Gas Energy</span>
              <span class="metric-value">${u(i)} kWh</span>
            </div>
          </div>
          <div class="metric">
            <div class="metric-header">
              <span class="metric-label">Gas Volume</span>
              <span class="metric-value">${u(o)} m³</span>
            </div>
          </div>
          `:""}
        </div>
      </div>
      </div>

      <!-- Chart -->
      <div class="card chart-card">
        <div class="chart-header">
          <h3 class="card-title"><span class="title-icon">📉</span> Energy Profile — ${p}</h3>
          <div class="chart-unit-toggle">
            <button
              class="unit-btn ${s.chartUnit==="kw"?"active":""}"
              data-chart-unit="kw"
              title="Show power (kW) — see when you exceed the reference limit"
            >kW</button>
            <button
              class="unit-btn ${s.chartUnit==="kwh"?"active":""}"
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
  `}const me={"1-1:1.29.0":{name:"Active Consumption",unit:"kW",icon:"⚡",category:"consumption"},"1-1:2.29.0":{name:"Active Production",unit:"kW",icon:"☀️",category:"production"},"1-1:3.29.0":{name:"Reactive Consumption",unit:"kvar",icon:"⚡",category:"consumption"},"1-1:4.29.0":{name:"Reactive Production",unit:"kvar",icon:"☀️",category:"production"},"1-65:1.29.1":{name:"Consumption Covered (L1 AIR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.3":{name:"Consumption Covered (L2 ACR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.2":{name:"Consumption Covered (L3 CEL)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.4":{name:"Consumption Covered (L4 APS)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:1.29.9":{name:"Remaining Consumption",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.1":{name:"Production Shared (L1 AIR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.3":{name:"Production Shared (L2 ACR)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.2":{name:"Production Shared (L3 CEL)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.4":{name:"Production Shared (L4 APS)",unit:"kW",icon:"🔗",category:"sharing"},"1-65:2.29.9":{name:"Remaining Production",unit:"kW",icon:"🔗",category:"sharing"},"7-1:99.23.15":{name:"Gas Volume",unit:"m³",icon:"🔥",category:"gas"},"7-1:99.23.17":{name:"Gas Standard Volume",unit:"Nm³",icon:"🔥",category:"gas"},"7-20:99.33.17":{name:"Gas Energy",unit:"kWh",icon:"🔥",category:"gas"}};function Ve(s){return me[s]?me[s].name:{c_04_yesterday_consumption:"Yesterday's Consumption",c_05_weekly_consumption:"This Week's Consumption",c_06_last_week_consumption:"Last Week's Consumption",c_07_monthly_consumption:"This Month's Consumption",c_08_previous_month_consumption:"Last Month's Consumption",p_04_yesterday_production:"Yesterday's Production",p_05_weekly_production:"This Week's Production",p_06_last_week_production:"Last Week's Production",p_07_monthly_production:"This Month's Production",p_08_previous_month_production:"Last Month's Production",p_09_yesterday_exported:"Yesterday's Export",p_10_last_week_exported:"Last Week's Export",p_11_last_month_exported:"Last Month's Export",p_12_yesterday_self_consumed:"Yesterday's Self-Consumed",p_13_last_week_self_consumed:"Last Week's Self-Consumed",p_14_last_month_self_consumed:"Last Month's Self-Consumed",p_15_monthly_exported:"This Month's Export",p_16_monthly_self_consumed:"This Month's Self-Consumed",g_01_yesterday_consumption:"Gas Yesterday (kWh)",g_02_weekly_consumption:"Gas This Week (kWh)",g_03_last_week_consumption:"Gas Last Week (kWh)",g_04_monthly_consumption:"Gas This Month (kWh)",g_05_last_month_consumption:"Gas Last Month (kWh)",g_10_yesterday_volume:"Gas Yesterday (m³)",g_11_weekly_volume:"Gas This Week (m³)",g_12_last_week_volume:"Gas Last Week (m³)",g_13_monthly_volume:"Gas This Month (m³)",g_14_last_month_volume:"Gas Last Month (m³)"}[s]??s}function Ge(s){if(!s||!s.sensors.length)return`
      <section class="sensors-view">
        <div class="card">
          <p class="muted">No sensor data available. Waiting for coordinator update…</p>
        </div>
      </section>
    `;const e=[],a=[],t=[],r=[],n=[];for(const o of s.sensors){const l=o.key;l.startsWith("c_")||l==="1-1:1.29.0"||l==="1-1:3.29.0"?e.push(o):l.startsWith("p_")||l==="1-1:2.29.0"||l==="1-1:4.29.0"?a.push(o):l.startsWith("s_")||l.startsWith("1-65:")?t.push(o):l.startsWith("g_")||l.startsWith("7-")?r.push(o):n.push(o)}const i=(o,l,d,h)=>d.length?`
      <div class="card sensor-group">
        <h3 class="card-title"><span class="title-icon">${l}</span> ${o} <span class="badge">${d.length}</span></h3>
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
              ${d.map(g=>`
                <tr>
                  <td class="sensor-name">${Ve(g.key)}</td>
                  <td class="sensor-value" style="text-align: right; color: var(--clr-${h});">${u(g.value)}</td>
                  <td class="sensor-unit">${g.unit}</td>
                  <td class="sensor-peak">${g.peak_timestamp?Ae(g.peak_timestamp):'<span style="color: var(--clr-border)">—</span>'}</td>
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
          <span class="badge">${s.sensors.length} sensors</span>
          <span class="muted">${s.metering_point}</span>
        </div>
      </div>
      ${i("Electricity Consumption","⚡",e,"consumption")}
      ${i("Energy Production","☀️",a,"production")}
      ${i("Energy Sharing","🔗",t,"self")}
      ${i("Gas","🔥",r,"gas")}
      ${i("Other","📊",n,"text")}
    </section>
  `}function qe(s,e,a){const t=new Date,r=(l,d)=>new Date(l,d+1,0).getDate();let n,i;switch(s){case"yesterday":{const l=new Date(t);l.setDate(l.getDate()-1),n=1,i=l;break}case"this_week":{const l=new Date(t),d=l.getDay()||7,h=new Date(l);h.setDate(l.getDate()-d+1),n=Math.max(1,Math.round((t.getTime()-h.getTime())/864e5)+1),i=h;break}case"last_week":{n=7;const l=new Date(t);l.setDate(l.getDate()-7),i=l;break}case"this_month":{n=t.getDate(),i=t;break}case"last_month":{const l=new Date(t.getFullYear(),t.getMonth()-1,1);n=r(l.getFullYear(),l.getMonth()),i=l;break}case"custom":{if(e&&a){const l=new Date(e),d=new Date(a);n=Math.max(1,Math.round((d.getTime()-l.getTime())/864e5)+1),i=l}else n=1,i=t;break}default:n=1,i=t}const o=r(i.getFullYear(),i.getMonth());return{days:n,monthDays:o,factor:n/o}}function Ue(s){const e=s.config,a=s.rangeData;if(!e||!a)return`
      <section class="invoice-view">
        <div class="card">
          <p class="muted">Loading billing configuration…</p>
        </div>
      </section>
    `;const t=a.consumption||0,r=a.production||0,n=a.exported||0,i=a.peak_power_kw||0,o=e.reference_power_kw||5,l=a.exceedance_kwh||0,d=a.gas_energy||0,h=a.gas_volume||0,g=d>0||h>0,{days:v,monthDays:y,factor:p}=qe(s.range,s.customStart,s.customEnd),$=e.energy_fixed_fee*p,k=e.network_metering_rate*p,m=e.network_power_ref_rate*p,c=v<y?`${v}/${y} days`:"full month",b=t*e.energy_variable_rate,C=t*e.network_variable_rate,L=l*e.exceedance_rate,W=e.meter_monthly_fees??[],be=W.reduce((f,x)=>f+(x.fee||0),0)*p,Y=t*e.compensation_fund_rate,B=t*e.electricity_tax_rate,V=$+b+k+m+C+L+be+Y+B,K=V*e.vat_rate,J=V+K,ke=(e.meters??[]).filter(f=>f.types.includes("production")),we=e.feed_in_rates??[],R=ke.map(f=>{const x=we.find(A=>A.meter_id===f.id);if(x){const A=x.mode==="sensor"&&x.sensor_value!=null&&isFinite(x.sensor_value),ce=A?x.sensor_value:isFinite(x.tariff)?x.tariff:e.feed_in_tariff,xe=A?`Sensor (${u(ce,4)} ${e.currency??"EUR"}/kWh)`:"Fixed tariff";return{meterId:f.id,shortId:f.id?"…"+f.id.slice(-8):"Meter",rate:ce,label:xe,mode:x.mode}}return{meterId:f.id,shortId:f.id?"…"+f.id.slice(-8):"Meter",rate:e.feed_in_tariff,label:"Fixed tariff",mode:"fixed"}}),G=R.filter(f=>isFinite(f.rate)&&f.rate>0),Q=G.length>0?G.reduce((f,x)=>f+x.rate,0)/G.length:e.feed_in_tariff,T=n*Q,M=R.length>1,F=a.self_consumed||0,ee=F*(e.energy_variable_rate+e.network_variable_rate+e.electricity_tax_rate+e.compensation_fund_rate),te=ee*e.vat_rate,q=ee+te,se=q+T,U=J-T,ae=(e.gas_fixed_fee??6.5)*p,re=d*(e.gas_variable_rate??.055),ne=(e.gas_network_fee??4.8)*p,ie=d*(e.gas_network_variable_rate??.012),oe=d*(e.gas_tax_rate??.001),O=ae+re+ne+ie+oe,le=O*(e.gas_vat_rate??.08),H=O+le,w=e.currency||"EUR",_=f=>`${u(f,2)} ${w}`,N=s.range.replace("_"," ").replace(/\b\w/g,f=>f.toUpperCase()),$e=l>0?`<div class="card exceedance-warning">
        <strong>⚠️ Reference Power Exceeded</strong>
        <p>Peak: <strong>${u(i,1)} kW</strong> &mdash; Reference: ${u(o,1)} kW</p>
        <p>Total exceedance energy: <strong>${u(l,2)} kWh</strong></p>
        <p class="muted">Surcharge: ${_(L)}</p>
      </div>`:"";return`
    <section class="invoice-view">
      <div class="section-header">
        <h2>Cost Estimate &mdash; ${N}</h2>
        <div style="display: flex; gap: var(--sp-4); flex-wrap: wrap; margin-top: var(--sp-2);">
          <span class="badge" style="background: var(--clr-consumption-muted); color: var(--clr-consumption);">⚡ ${u(t)} kWh consumed</span>
          <span class="badge" style="background: var(--clr-production-muted); color: var(--clr-production);">☀️ ${u(r)} kWh produced</span>
          ${n>0?`<span class="badge" style="background: var(--clr-export-muted); color: var(--clr-export);">📤 ${u(n)} kWh exported</span>`:""}
          ${g?`<span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">🔥 ${u(d)} kWh gas (${u(h)} m³)</span>`:""}
        </div>
      </div>

      ${$e}

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
              <td>Fixed Fee <span class="muted">(${c})</span></td>
              <td style="text-align: right;">${u(e.energy_fixed_fee,2)} ${w}/mo</td>
              <td style="text-align: right;">${_($)}</td>
            </tr>
            <tr>
              <td>Variable (${u(t)} kWh)</td>
              <td style="text-align: right;">${u(e.energy_variable_rate,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(b)}</td>
            </tr>

            <tr class="section-label"><td colspan="3">Network Operator</td></tr>
            <tr>
              <td>Metering <span class="muted">(${c})</span></td>
              <td style="text-align: right;">${u(e.network_metering_rate,2)} ${w}/mo</td>
              <td style="text-align: right;">${_(k)}</td>
            </tr>
            <tr>
              <td>Power Reference (${u(o,1)} kW) <span class="muted">(${c})</span></td>
              <td style="text-align: right;">${u(e.network_power_ref_rate,2)} ${w}/mo</td>
              <td style="text-align: right;">${_(m)}</td>
            </tr>
            <tr>
              <td>Variable (${u(t)} kWh)</td>
              <td style="text-align: right;">${u(e.network_variable_rate,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(C)}</td>
            </tr>
            <tr class="${l>0?"exceedance-row":""}">
              <td>Exceedance (${u(l,2)} kWh over ref)</td>
              <td style="text-align: right;">${u(e.exceedance_rate,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(L)}</td>
            </tr>

            ${W.filter(f=>f.fee>0).length>0?`
            <tr class="section-label"><td colspan="3">Extra Meter Fees</td></tr>
            ${W.filter(f=>f.fee>0).map(f=>`
            <tr>
              <td>${f.label||"…"+f.meter_id.slice(-8)} <span class="muted">(${c})</span></td>
              <td style="text-align: right;">${u(f.fee,2)} ${w}/mo</td>
              <td style="text-align: right;">${_(f.fee*p)}</td>
            </tr>
            `).join("")}
            `:""}

            <tr class="section-label"><td colspan="3">Taxes & Levies</td></tr>
            <tr>
              <td>Compensation Fund</td>
              <td style="text-align: right;">${u(e.compensation_fund_rate,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(Y)}</td>
            </tr>
            <tr>
              <td>Electricity Tax</td>
              <td style="text-align: right;">${u(e.electricity_tax_rate,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(B)}</td>
            </tr>

            <tr class="subtotal-row">
              <td colspan="2">Subtotal (excl. VAT)</td>
              <td style="text-align: right;"><strong>${_(V)}</strong></td>
            </tr>
            <tr>
              <td>VAT</td>
              <td style="text-align: right;">${u(e.vat_rate*100,0)}%</td>
              <td style="text-align: right;">${_(K)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2"><strong>Total Costs</strong></td>
              <td style="text-align: right;"><strong>${_(J)}</strong></td>
            </tr>

            ${n>0?`
            <tr class="section-label revenue-section"><td colspan="3">Feed-in Revenue</td></tr>
            ${R.map(f=>`
            <tr class="revenue-row">
              <td>Exported (${M?f.shortId:u(n)+" kWh"})</td>
              <td style="text-align: right;">${f.label}<br/>${u(f.rate,4)} ${w}/kWh</td>
              <td class="revenue-amount" style="text-align: right;">-${_(M?n/R.length*f.rate:n*f.rate)}</td>
            </tr>
            `).join("")}
            ${M?`
            <tr class="revenue-row">
              <td><em>Total feed-in (${u(n)} kWh, avg rate)</em></td>
              <td style="text-align: right;">${u(Q,4)} ${w}/kWh</td>
              <td class="revenue-amount" style="text-align: right;">-${_(T)}</td>
            </tr>
            `:""}
            <tr class="net-total-row">
              <td colspan="2"><strong>Net Balance</strong></td>
              <td style="text-align: right;"><strong>${_(U)}</strong></td>
            </tr>
            `:""}
          </tbody>
        </table>
      </div>

      <div class="card invoice-footer">
        <p class="muted" style="line-height: var(--lh-relaxed);">
          This is an estimate based on your configured billing rates.
          Fixed monthly fees are prorated to the viewed period (${v} of ${y} days = ${u(p*100,1)}%).
          Peak power (${u(i,1)} kW) is compared against your reference power (${u(o,1)} kW) &mdash; 
          every kWh consumed above the Referenzwert incurs a surcharge of ${u(e.exceedance_rate,4)} ${w}/kWh.
          Adjust rates in Settings.
        </p>
      </div>

      ${g?`
      <!-- Gas Cost Estimate -->
      <div class="card invoice-card gas-invoice-card">
        <h3 class="card-title"><span class="title-icon">🔥</span> Gas Cost Estimate &mdash; ${N}</h3>
        <div style="display: flex; gap: var(--sp-4); flex-wrap: wrap; margin-bottom: var(--sp-4);">
          <span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">🔥 ${u(d)} kWh</span>
          <span class="badge" style="background: rgba(255,160,50,0.12); color: #f5a623;">📐 ${u(h)} m³</span>
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
              <td>Fixed Fee <span class="muted">(${c})</span></td>
              <td style="text-align: right;">${u(e.gas_fixed_fee??6.5,2)} ${w}/mo</td>
              <td style="text-align: right;">${_(ae)}</td>
            </tr>
            <tr>
              <td>Energy (${u(d)} kWh)</td>
              <td style="text-align: right;">${u(e.gas_variable_rate??.055,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(re)}</td>
            </tr>

            <tr class="section-label"><td colspan="3">Gas Network</td></tr>
            <tr>
              <td>Network Fee <span class="muted">(${c})</span></td>
              <td style="text-align: right;">${u(e.gas_network_fee??4.8,2)} ${w}/mo</td>
              <td style="text-align: right;">${_(ne)}</td>
            </tr>
            <tr>
              <td>Network Variable (${u(d)} kWh)</td>
              <td style="text-align: right;">${u(e.gas_network_variable_rate??.012,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(ie)}</td>
            </tr>

            <tr class="section-label"><td colspan="3">Gas Tax</td></tr>
            <tr>
              <td>Gas Tax (${u(d)} kWh)</td>
              <td style="text-align: right;">${u(e.gas_tax_rate??.001,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(oe)}</td>
            </tr>

            <tr class="subtotal-row">
              <td colspan="2">Subtotal (excl. VAT)</td>
              <td style="text-align: right;"><strong>${_(O)}</strong></td>
            </tr>
            <tr>
              <td>VAT</td>
              <td style="text-align: right;">${u((e.gas_vat_rate??.08)*100,0)}%</td>
              <td style="text-align: right;">${_(le)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2"><strong>Total Gas Costs</strong></td>
              <td style="text-align: right;"><strong>${_(H)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card invoice-footer">
        <p class="muted" style="line-height: var(--lh-relaxed);">
          <strong>Combined Energy Total: ${_(U+H)}</strong>
          (Electricity: ${_(U)} + Gas: ${_(H)})
        </p>
      </div>
      `:""}

      ${r>0?`
      <!-- Solar Revenue Tracking -->
      <div class="card solar-revenue-card">
        <h3 class="card-title"><span class="title-icon">☀️</span> Solar Panel Revenue &mdash; ${N}</h3>
        <div class="solar-revenue-summary">
          <div class="solar-stat solar-stat-primary">
            <div class="solar-stat-value">${_(se)}</div>
            <div class="solar-stat-label">Total Solar Value</div>
          </div>
          <div class="solar-stat">
            <div class="solar-stat-value">${_(q)}</div>
            <div class="solar-stat-label">Savings (self-consumed)</div>
          </div>
          <div class="solar-stat">
            <div class="solar-stat-value">${_(T)}</div>
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
              <td>Energy not bought (${u(F)} kWh)</td>
              <td style="text-align: right;">${u(e.energy_variable_rate,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(F*e.energy_variable_rate)}</td>
            </tr>
            <tr>
              <td>Network fees avoided</td>
              <td style="text-align: right;">${u(e.network_variable_rate,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(F*e.network_variable_rate)}</td>
            </tr>
            <tr>
              <td>Taxes & levies avoided</td>
              <td style="text-align: right;">${u(e.electricity_tax_rate+e.compensation_fund_rate,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(F*(e.electricity_tax_rate+e.compensation_fund_rate))}</td>
            </tr>
            <tr>
              <td>VAT saved</td>
              <td style="text-align: right;">${u(e.vat_rate*100,0)}%</td>
              <td style="text-align: right;">${_(te)}</td>
            </tr>
            <tr class="subtotal-row">
              <td colspan="2"><strong>Self-Consumption Savings</strong></td>
              <td style="text-align: right;"><strong>${_(q)}</strong></td>
            </tr>

            ${n>0?`
            <tr class="section-label"><td colspan="3">Feed-in Revenue</td></tr>
            ${R.map(f=>`
            <tr>
              <td>Sold to grid ${M?`(${f.shortId})`:`(${u(n)} kWh)`}</td>
              <td style="text-align: right;">${f.label}<br/>${u(f.rate,4)} ${w}/kWh</td>
              <td style="text-align: right;">${_(M?n/R.length*f.rate:n*f.rate)}</td>
            </tr>
            `).join("")}
            ${M?`
            <tr class="subtotal-row">
              <td colspan="2"><strong>Total Feed-in Revenue</strong></td>
              <td style="text-align: right;"><strong>${_(T)}</strong></td>
            </tr>
            `:""}
            `:""}

            <tr class="total-row solar-total-row">
              <td colspan="2"><strong>💰 Total Solar Panel Value</strong></td>
              <td style="text-align: right;"><strong>${_(se)}</strong></td>
            </tr>
          </tbody>
        </table>

        <p class="muted" style="margin-top: var(--sp-3); font-size: var(--text-xs); line-height: var(--lh-relaxed);">
          Self-consumption savings = energy you produced and used yourself instead of buying from the grid.
          Feed-in revenue = money earned by selling surplus production.
          ${R.some(f=>f.mode==="sensor")?"Market price sourced from Home Assistant sensor.":"Using fixed feed-in tariff — configure a market price sensor in Settings for real-time rates."}
          ${M?"Revenue split equally across production meters (per-meter export data not yet available).":""}
        </p>
      </div>
      `:""}
    </section>
  `}const Oe=[{title:"Energy Supplier",icon:"⚡",fields:[{key:"energy_fixed_fee",label:"Fixed Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"energy_variable_rate",label:"Variable Rate",step:"0.0001",unit:"EUR/kWh",type:"number"}]},{title:"Network Operator",icon:"🔌",fields:[{key:"network_metering_rate",label:"Metering Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"network_power_ref_rate",label:"Power Reference Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"network_variable_rate",label:"Variable Rate",step:"0.0001",unit:"EUR/kWh",type:"number"}]},{title:"Reference Power & Exceedance",icon:"📏",fields:[{key:"reference_power_kw",label:"Reference Power (Referenzwert)",step:"0.1",unit:"kW",type:"number"},{key:"exceedance_rate",label:"Exceedance Surcharge",step:"0.0001",unit:"EUR/kWh",type:"number"}]},{title:"Feed-in / Selling",icon:"💶",fields:[]},{title:"Gas Billing",icon:"🔥",fields:[{key:"gas_fixed_fee",label:"Supplier Fixed Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"gas_variable_rate",label:"Supplier Variable Rate",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"gas_network_fee",label:"Network Fixed Fee",step:"0.01",unit:"EUR/mo",type:"number"},{key:"gas_network_variable_rate",label:"Network Variable Rate",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"gas_tax_rate",label:"Gas Tax",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"gas_vat_rate",label:"Gas VAT Rate",step:"0.01",unit:"decimal (0.08 = 8%)",type:"number"}]},{title:"Meter Fees",icon:"📊",fields:[]},{title:"Taxes & Levies",icon:"🏛️",fields:[{key:"compensation_fund_rate",label:"Compensation Fund",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"electricity_tax_rate",label:"Electricity Tax",step:"0.0001",unit:"EUR/kWh",type:"number"},{key:"vat_rate",label:"VAT Rate",step:"0.01",unit:"decimal (0.08 = 8%)",type:"number"}]},{title:"General",icon:"⚙️",fields:[{key:"currency",label:"Currency",step:"",unit:"",type:"text"}]}],He={consumption:"Power Consumption",production:"Power Production",gas:"Gas Consumption"},ye={consumption:"⚡",production:"☀️",gas:"🔥"};function Ne(s){return s.map(e=>`<span class="meter-type-badge meter-type-${e}">${ye[e]??""} ${He[e]??e}</span>`).join(" ")}function ge(s,e,a){const t=s+1;return a?`
      <div class="meter-card">
        <div class="meter-header">
          <strong>Meter ${t}</strong>
          <code class="meter-id">${e.id?"..."+e.id.slice(-8):"—"}</code>
        </div>
        <div class="meter-types">${Ne(e.types)}</div>
      </div>
    `:`
    <div class="meter-card">
      <div class="meter-header">
        <strong>Meter ${t}</strong>
        ${t>1?`<button type="button" class="btn-icon remove-meter-btn" data-meter="${s}" title="Remove meter">&times;</button>`:""}
      </div>
      <div class="form-row">
        <label for="meter-id-${s}">Metering Point ID</label>
        <div class="input-group">
          <input
            id="meter-id-${s}"
            name="meter_${s}_id"
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
            <input type="checkbox" name="meter_${s}_consumption" ${e.types.includes("consumption")?"checked":""} />
            <span>⚡ Power Consumption</span>
          </label>
          <label class="meter-type-cb">
            <input type="checkbox" name="meter_${s}_production" ${e.types.includes("production")?"checked":""} />
            <span>☀️ Power Production</span>
          </label>
          <label class="meter-type-cb">
            <input type="checkbox" name="meter_${s}_gas" ${e.types.includes("gas")?"checked":""} />
            <span>🔥 Gas Consumption</span>
          </label>
        </div>
      </div>
    </div>
  `}function je(s,e="ha",a){if(!s&&e==="ha")return`
      <section class="settings-view">
        <div class="card">
          <p class="muted">Loading configuration…</p>
        </div>
      </section>
    `;const t=e==="standalone"?(a==null?void 0:a.meters)??[{id:"",types:["consumption"]}]:(s==null?void 0:s.meters)??[];let r="";if(e==="standalone"){const m=t.map((c,b)=>ge(b,c,!1)).join("");r=`
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
                  value="${(a==null?void 0:a.api_key)??""}"
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
                  value="${(a==null?void 0:a.energy_id)??""}"
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
              ${m}
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
    `}else{const m=(s==null?void 0:s.meters)??[];r=`
      <div class="card" style="margin-bottom: var(--sp-6); padding: var(--sp-4) var(--sp-5);">
        <p class="muted" style="margin: 0 0 var(--sp-3) 0;">🔒 API credentials are managed through Home Assistant &rarr; Settings &rarr; Integrations &rarr; Leneda</p>
        <div class="form-section">
          <div class="form-section-title">📊  Configured Metering Points</div>
          <div id="meters-container">
            ${m.length>0?m.map((b,C)=>ge(C,b,!0)).join(""):'<p class="muted">No meters configured</p>'}
          </div>
        </div>
      </div>
    `}const n=m=>m.map(c=>{const b=s?s[c.key]??"":"";return`
        <div class="form-row">
          <label for="cfg-${c.key}">${c.label}</label>
          <div class="input-group">
            <input
              id="cfg-${c.key}"
              name="${c.key}"
              type="${c.type}"
              ${c.type==="number"?`step="${c.step}"`:""}
              value="${b}"
            />
            ${c.unit?`<span class="input-unit">${c.unit}</span>`:""}
          </div>
        </div>
      `}).join(""),i=((s==null?void 0:s.meters)??[]).filter(m=>m.types.includes("production")),o=(s==null?void 0:s.feed_in_rates)??[],l=e==="ha";function d(m){return o.find(c=>c.meter_id===m)??{meter_id:m,mode:"fixed",tariff:(s==null?void 0:s.feed_in_tariff)??.08,sensor_entity:""}}const h=i.length===0?'<p class="muted">No production meters configured — add a meter with Power Production type above.</p>':i.map((m,c)=>{const b=d(m.id),C=m.id?"…"+m.id.slice(-8):`Meter ${c+1}`;return`
          <div class="feed-in-meter-card" data-meter-idx="${c}" data-meter-id="${m.id}">
            <div class="feed-in-meter-header">
              <span class="meter-type-badge meter-type-production">☀️ ${C}</span>
              <input type="hidden" name="feed_in_rate_${c}_meter_id" value="${m.id}" />
            </div>
            <div class="form-row">
              <label>Pricing Mode</label>
              <div class="feed-in-mode-toggle">
                <label class="mode-option">
                  <input type="radio" name="feed_in_rate_${c}_mode" value="fixed" ${b.mode==="fixed"?"checked":""} />
                  <span class="mode-label">💶 Fixed Tariff</span>
                </label>
                <label class="mode-option">
                  <input type="radio" name="feed_in_rate_${c}_mode" value="sensor" ${b.mode==="sensor"?"checked":""} />
                  <span class="mode-label">📡 HA Sensor</span>
                </label>
              </div>
            </div>
            <div class="feed-in-fixed-fields" data-rate-idx="${c}" style="${b.mode==="fixed"?"":"display:none"}">
              <div class="form-row">
                <label for="cfg-feed_in_rate_${c}_tariff">Feed-in Tariff</label>
                <div class="input-group">
                  <input id="cfg-feed_in_rate_${c}_tariff" name="feed_in_rate_${c}_tariff" type="number" step="0.0001" value="${b.tariff}" />
                  <span class="input-unit">EUR/kWh</span>
                </div>
              </div>
            </div>
            <div class="feed-in-sensor-fields" data-rate-idx="${c}" style="${b.mode==="sensor"?"":"display:none"}">
              <div class="form-row">
                <label for="cfg-feed_in_rate_${c}_sensor">Market Price Sensor</label>
                <div class="input-group sensor-picker-group">
                  <input
                    id="cfg-feed_in_rate_${c}_sensor"
                    name="feed_in_rate_${c}_sensor_entity"
                    type="text"
                    value="${b.sensor_entity}"
                    placeholder="${l?"sensor.electricity_price":"sensor.electricity_price (HA mode only)"}"
                    list="ha-entity-list"
                  />
                  <span class="input-unit">entity_id</span>
                </div>
                ${l&&c===0?'<datalist id="ha-entity-list"></datalist>':""}
              </div>
              <div class="form-row">
                <label for="cfg-feed_in_rate_${c}_fallback">Fallback Tariff</label>
                <div class="input-group">
                  <input id="cfg-feed_in_rate_${c}_fallback" name="feed_in_rate_${c}_fallback_tariff" type="number" step="0.0001" value="${b.tariff}" />
                  <span class="input-unit">EUR/kWh</span>
                </div>
                <p class="muted" style="font-size: var(--text-xs); margin-top: var(--sp-1);">
                  Used when the sensor is unavailable.
                </p>
              </div>
            </div>
          </div>
        `}).join(""),g=((s==null?void 0:s.meters)??[]).some(m=>m.types.includes("gas"))||(s==null?void 0:s.meter_has_gas),v=(s==null?void 0:s.meters)??[],y=(s==null?void 0:s.meter_monthly_fees)??[];function p(m){return y.find(c=>c.meter_id===m)??{meter_id:m,label:"",fee:0}}const $=v.length===0?'<p class="muted">No meters configured.</p>':v.map((m,c)=>{const b=p(m.id),C=m.id?"…"+m.id.slice(-8):`Meter ${c+1}`;return`
          <div class="meter-fee-card" style="margin-bottom: var(--sp-3); padding: var(--sp-3); border: 1px solid var(--clr-border); border-radius: var(--radius);">
            <div style="display: flex; align-items: center; gap: var(--sp-2); margin-bottom: var(--sp-2);">
              <span>${m.types.map(W=>ye[W]??"").join(" ")}</span>
              <code style="font-size: var(--text-sm);">${C}</code>
              <input type="hidden" name="meter_fee_${c}_meter_id" value="${m.id}" />
            </div>
            <div class="form-row" style="margin-bottom: var(--sp-2);">
              <label for="cfg-meter_fee_${c}_label">Label</label>
              <div class="input-group">
                <input id="cfg-meter_fee_${c}_label" name="meter_fee_${c}_label" type="text" value="${b.label||`Meter ${c+1} metering fee`}" placeholder="e.g. Smart meter rental" />
              </div>
            </div>
            <div class="form-row">
              <label for="cfg-meter_fee_${c}_fee">Monthly Fee</label>
              <div class="input-group">
                <input id="cfg-meter_fee_${c}_fee" name="meter_fee_${c}_fee" type="number" step="0.01" value="${b.fee}" />
                <span class="input-unit">EUR/mo</span>
              </div>
            </div>
          </div>
        `}).join(""),k=Oe.map(m=>{if(m.title==="Gas Billing"&&!g||m.title==="Meter Fees"&&v.length<2)return"";let c;return m.title==="Feed-in / Selling"?c=h:m.title==="Meter Fees"?c=`<p class="muted" style="margin: 0 0 var(--sp-3) 0; font-size: 0.85rem;">
        Each metering point has a fixed monthly rental/metering fee. Set the cost per meter below.
      </p>`+$:c=n(m.fields),`
    <div class="form-section">
      <div class="form-section-title">${m.icon}  ${m.title}</div>
      ${c}
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
          ${s?k:'<p class="muted">Loading configuration…</p>'}
          ${s?`
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Save Configuration</button>
            <button type="button" id="reset-config-btn" class="btn btn-outline">Reset to Defaults</button>
          </div>
          `:""}
        </form>
      </div>
    </section>
  `}function j(s,e){return`
    <header class="navbar" role="navigation" aria-label="Main navigation">
      <div class="navbar-brand">
        <img src="/leneda-panel/static/logo.png" srcset="/leneda-panel/static/logo@2x.png 2x" alt="Leneda Logo" class="navbar-logo-img" />

      </div>
      <nav class="navbar-tabs" role="tablist">
        ${[{id:"dashboard",label:"Dashboard",icon:"🏠"},{id:"sensors",label:"Sensors",icon:"📊"},{id:"invoice",label:"Invoice",icon:"💰"},{id:"settings",label:"Settings",icon:"⚙️"}].map(t=>`
          <button
            class="nav-btn ${t.id===s?"active":""}"
            data-tab="${t.id}"
            role="tab"
            aria-selected="${t.id===s}"
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
  `}const _e="leneda_credentials";function Xe(){try{const s=localStorage.getItem(_e);if(s)return JSON.parse(s)}catch{}return null}function X(s){try{localStorage.setItem(_e,JSON.stringify(s))}catch{}}class ze{constructor(e){P(this,"root");P(this,"state",{tab:"dashboard",range:"yesterday",customStart:"",customEnd:"",chartUnit:"kw",rangeData:null,sensors:null,config:null,loading:!0,error:null,mode:"ha",credentials:null});P(this,"preZoomRange",null);P(this,"preZoomCustomStart","");P(this,"preZoomCustomEnd","");this.root=e}async mount(){this.render();const e=await ve();if(this.state.mode=e.mode,e.mode==="standalone"){const a=Xe();if(a&&(this.state.credentials=a),!e.configured&&!a){this.state.tab="settings",this.state.loading=!1,this.state.error="Please configure your Leneda API credentials in Settings.",this.render();return}if(!e.configured&&a)try{const{saveCredentials:t}=await E(async()=>{const{saveCredentials:r}=await Promise.resolve().then(()=>D);return{saveCredentials:r}},void 0);await t(a)}catch{}if(!a)try{this.state.credentials=await fe()}catch{}}await this.loadData()}async loadData(){this.state.loading=!0,this.state.error=null,this.render();try{const[e,a,t]=await Promise.all([z(this.state.range),Z(),I()]);this.state.rangeData=e,this.state.sensors=a,this.state.config=t}catch(e){this.state.error=e instanceof Error?e.message:"Failed to load data"}finally{this.state.loading=!1,this.render()}}async changeRange(e){if(this.preZoomRange=null,this.state.range=e,e==="custom"){if(!this.state.customStart||!this.state.customEnd){const a=new Date;a.setDate(a.getDate()-1);const t=new Date(a);t.setDate(t.getDate()-6),this.state.customStart=t.toISOString().slice(0,10),this.state.customEnd=a.toISOString().slice(0,10)}this.render();return}this.state.loading=!0,this.render();try{this.state.rangeData=await z(e)}catch(a){this.state.error=a instanceof Error?a.message:"Failed to load data"}finally{this.state.loading=!1,this.render()}}async applyCustomRange(){this.preZoomRange=null;const{customStart:e,customEnd:a}=this.state;if(!(!e||!a)){this.state.loading=!0,this.render();try{const{fetchCustomData:t}=await E(async()=>{const{fetchCustomData:n}=await Promise.resolve().then(()=>D);return{fetchCustomData:n}},void 0),r=await t(e,a);this.state.rangeData={range:"custom",consumption:r.consumption,production:r.production,exported:r.exported??0,self_consumed:r.self_consumed??0,gas_energy:r.gas_energy??0,gas_volume:r.gas_volume??0,peak_power_kw:r.peak_power_kw??0,exceedance_kwh:r.exceedance_kwh??0,metering_point:r.metering_point??""}}catch(t){this.state.error=t instanceof Error?t.message:"Failed to load custom data"}finally{this.state.loading=!1,this.render()}}}changeTab(e){this.state.tab=e,this.render(),e==="sensors"&&!this.state.sensors&&Z().then(a=>{this.state.sensors=a,this.render()}),e==="settings"&&!this.state.config&&I().then(a=>{this.state.config=a,this.render()})}render(){var n;const{tab:e,loading:a,error:t}=this.state;if(a&&!this.state.rangeData){this.root.innerHTML=`
        <div class="app-shell">
          ${j(e)}
          <main class="main-content">
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading Leneda data…</p>
            </div>
          </main>
        </div>
      `;return}if(t&&!this.state.rangeData){this.root.innerHTML=`
        <div class="app-shell">
          ${j(e)}
          <main class="main-content">
            <div class="error-state">
              <h2>Connection Error</h2>
              <p>${t}</p>
              <button class="btn btn-primary" id="retry-btn">Retry</button>
            </div>
          </main>
        </div>
      `,(n=this.root.querySelector("#retry-btn"))==null||n.addEventListener("click",()=>this.loadData());return}let r="";switch(e){case"dashboard":r=he(this.state);break;case"sensors":r=Ge(this.state.sensors);break;case"invoice":r=Ue(this.state);break;case"settings":r=je(this.state.config,this.state.mode,this.state.credentials);break}this.root.innerHTML=`
      <div class="app-shell">
        ${j(e)}
        <main class="main-content">
          ${a?'<div class="loading-bar"></div>':""}
          ${r}
        </main>
      </div>
    `,this.attachNavListeners(),this.attachDashboardListeners(),this.attachSettingsListeners()}attachNavListeners(){this.root.querySelectorAll("[data-tab]").forEach(e=>{e.addEventListener("click",()=>{const a=e.dataset.tab;this.changeTab(a)})})}attachDashboardListeners(e=!1){this.root.querySelectorAll("[data-range]").forEach(i=>{i.addEventListener("click",()=>{const o=i.dataset.range;this.changeRange(o)})});const a=this.root.querySelector("#custom-start"),t=this.root.querySelector("#custom-end");a&&a.addEventListener("change",()=>{this.state.customStart=a.value}),t&&t.addEventListener("change",()=>{this.state.customEnd=t.value});const r=this.root.querySelector("#apply-custom-range");if(r==null||r.addEventListener("click",()=>this.applyCustomRange()),this.root.querySelectorAll("[data-chart-unit]").forEach(i=>{i.addEventListener("click",()=>{const o=i.dataset.chartUnit;o!==this.state.chartUnit&&(this.state.chartUnit=o,this.render())})}),!e){const i=this.root.querySelector("#energy-chart");i&&this.state.rangeData&&this.initChart(i)}const n=this.root.querySelector(".reset-zoom-btn");n==null||n.addEventListener("click",async()=>{const{resetChartZoom:i}=await E(async()=>{const{resetChartZoom:o}=await import("./Charts-BziMsIc4.js");return{resetChartZoom:o}},[]);if(i(),n.style.display="none",this.preZoomRange!==null){const o=this.preZoomRange;this.state.customStart=this.preZoomCustomStart,this.state.customEnd=this.preZoomCustomEnd,this.preZoomRange=null,this.preZoomCustomStart="",this.preZoomCustomEnd="",o==="custom"?(this.state.range="custom",this.applyCustomRange()):this.changeRange(o)}else this.changeRange(this.state.range==="custom"?"yesterday":this.state.range)})}attachSettingsListeners(){const e=this.root.querySelector("#credentials-form");if(e){const r=this.root.querySelector("#add-meter-btn");r==null||r.addEventListener("click",()=>{var d,h;const o=new FormData(e),l=n(o);if(l.length<10){l.push({id:"",types:["consumption"]});const g={api_key:o.get("api_key")||((d=this.state.credentials)==null?void 0:d.api_key)||"",energy_id:o.get("energy_id")||((h=this.state.credentials)==null?void 0:h.energy_id)||"",meters:l};this.state.credentials=g,X(g),this.render()}}),this.root.querySelectorAll(".remove-meter-btn").forEach(o=>{o.addEventListener("click",()=>{var v,y;const l=parseInt(o.dataset.meter??"0",10),d=new FormData(e),h=n(d);h.splice(l,1);const g={api_key:d.get("api_key")||((v=this.state.credentials)==null?void 0:v.api_key)||"",energy_id:d.get("energy_id")||((y=this.state.credentials)==null?void 0:y.energy_id)||"",meters:h};this.state.credentials=g,X(g),this.render()})});const n=o=>{var d,h,g;const l=[];for(let v=0;v<10;v++){const y=o.get(`meter_${v}_id`);if(y===null)break;const p=[];(d=e.querySelector(`[name="meter_${v}_consumption"]`))!=null&&d.checked&&p.push("consumption"),(h=e.querySelector(`[name="meter_${v}_production"]`))!=null&&h.checked&&p.push("production"),(g=e.querySelector(`[name="meter_${v}_gas"]`))!=null&&g.checked&&p.push("gas"),l.push({id:y.trim(),types:p})}return l};e.addEventListener("submit",async o=>{o.preventDefault();const l=new FormData(e),d={api_key:l.get("api_key"),energy_id:l.get("energy_id"),meters:n(l)},h=this.root.querySelector("#creds-status");try{X(d);const{saveCredentials:g}=await E(async()=>{const{saveCredentials:v}=await Promise.resolve().then(()=>D);return{saveCredentials:v}},void 0);await g(d),h&&(h.innerHTML='<p style="color: var(--clr-production); padding: var(--sp-3) 0;">✓ Credentials saved. Reloading data…</p>'),this.state.credentials=d,this.state.error=null,await this.loadData()}catch(g){h&&(h.innerHTML=`<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ Save failed: ${g instanceof Error?g.message:g}</p>`)}});const i=this.root.querySelector("#test-creds-btn");i==null||i.addEventListener("click",async()=>{const o=new FormData(e),l={api_key:o.get("api_key"),energy_id:o.get("energy_id"),meters:n(o)},d=this.root.querySelector("#creds-status");d&&(d.innerHTML='<p style="color: var(--clr-muted); padding: var(--sp-3) 0;">Testing connection…</p>');try{const{testCredentials:h}=await E(async()=>{const{testCredentials:v}=await Promise.resolve().then(()=>D);return{testCredentials:v}},void 0),g=await h(l);d&&(d.innerHTML=g.success?`<p style="color: var(--clr-production); padding: var(--sp-3) 0;">✓ ${g.message}</p>`:`<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ ${g.message}</p>`)}catch(h){d&&(d.innerHTML=`<p style="color: var(--clr-danger); padding: var(--sp-3) 0;">✗ Test failed: ${h instanceof Error?h.message:h}</p>`)}})}const a=this.root.querySelector("#settings-form");if(!a)return;if(a.querySelectorAll('input[type="radio"][name^="feed_in_rate_"][name$="_mode"]').forEach(r=>{r.addEventListener("change",()=>{const n=r.name.match(/feed_in_rate_(\d+)_mode/);if(!n)return;const i=n[1],o=a.querySelector(`.feed-in-fixed-fields[data-rate-idx="${i}"]`),l=a.querySelector(`.feed-in-sensor-fields[data-rate-idx="${i}"]`);o&&(o.style.display=r.value==="fixed"?"":"none"),l&&(l.style.display=r.value==="sensor"?"":"none")})}),this.state.mode==="ha"){const r=this.root.querySelector("#ha-entity-list");r&&fetch("/api/leneda/ha-entities").then(n=>n.ok?n.json():Promise.resolve({entities:[]})).then(({entities:n})=>{r.innerHTML=n.map(i=>`<option value="${i}"></option>`).join("")}).catch(()=>{})}a.addEventListener("submit",async r=>{r.preventDefault();const n=new FormData(a),i={};a.querySelectorAll('input[type="checkbox"]').forEach(y=>{i[y.name]=y.checked});const o=[],l=/^feed_in_rate_(\d+)_(.+)$/,d={},h=[],g=/^meter_fee_(\d+)_(.+)$/,v={};for(const[y,p]of n.entries()){const $=y.match(l);if($){const c=$[1],b=$[2];d[c]||(d[c]={}),d[c][b]=p;continue}const k=y.match(g);if(k){const c=k[1],b=k[2];v[c]||(v[c]={}),v[c][b]=p;continue}if(i[y]!==void 0&&typeof i[y]=="boolean")continue;const m=parseFloat(p);i[y]=isNaN(m)?p:m}for(const y of Object.keys(d).sort()){const p=d[y],$=p.mode??"fixed",k=$==="sensor"?p.fallback_tariff??p.tariff:p.tariff;o.push({meter_id:p.meter_id??"",mode:$,tariff:parseFloat(k??"0.08")||.08,sensor_entity:p.sensor_entity??""})}o.length>0&&(i.feed_in_rates=o);for(const y of Object.keys(v).sort()){const p=v[y];h.push({meter_id:p.meter_id??"",label:p.label??"",fee:parseFloat(p.fee??"0")||0})}h.length>0&&(i.meter_monthly_fees=h);try{const{saveConfig:y}=await E(async()=>{const{saveConfig:p}=await Promise.resolve().then(()=>D);return{saveConfig:p}},void 0);await y(i),this.state.config=await I(),this.render()}catch(y){alert("Failed to save: "+(y instanceof Error?y.message:y))}});const t=this.root.querySelector("#reset-config-btn");t==null||t.addEventListener("click",async()=>{if(confirm("Reset all billing rates to defaults?"))try{const{resetConfig:r}=await E(async()=>{const{resetConfig:n}=await Promise.resolve().then(()=>D);return{resetConfig:n}},void 0);await r(),this.state.config=await I(),this.render()}catch(r){alert("Failed to reset: "+(r instanceof Error?r.message:r))}})}async initChart(e){var a,t;try{const{renderEnergyChart:r}=await E(async()=>{const{renderEnergyChart:p}=await import("./Charts-BziMsIc4.js");return{renderEnergyChart:p}},[]),{fetchTimeseries:n,fetchPerMeterTimeseries:i}=await E(async()=>{const{fetchTimeseries:p,fetchPerMeterTimeseries:$}=await Promise.resolve().then(()=>D);return{fetchTimeseries:p,fetchPerMeterTimeseries:$}},void 0),{start:o,end:l}=this.getDateRangeISO(),[d,h]=await Promise.all([n("1-1:1.29.0",o,l),n("1-1:2.29.0",o,l)]),g=((a=this.state.config)==null?void 0:a.reference_power_kw)??0,v=(((t=this.state.config)==null?void 0:t.meters)??[]).filter(p=>p.types.includes("production"));let y;if(v.length>1)try{const p=await i("1-1:2.29.0",o,l);p.meters&&p.meters.length>1&&(y=p.meters)}catch(p){console.warn("Per-meter timeseries fetch failed, using merged view:",p)}r(e,d,h,{unit:this.state.chartUnit,referencePowerKw:g,perMeterProduction:y,onZoomChange:(p,$)=>{this.handleChartZoomChange(p,$)}})}catch(r){console.error("Chart init failed:",r)}}async handleChartZoomChange(e,a){try{this.preZoomRange===null&&(this.preZoomRange=this.state.range,this.preZoomCustomStart=this.state.customStart,this.preZoomCustomEnd=this.state.customEnd);const{fetchCustomData:t}=await E(async()=>{const{fetchCustomData:o}=await Promise.resolve().then(()=>D);return{fetchCustomData:o}},void 0),r=e.slice(0,10),n=a.slice(0,10),i=await t(r,n);this.state.range="custom",this.state.customStart=r,this.state.customEnd=n,this.state.rangeData={range:"custom",consumption:i.consumption,production:i.production,exported:i.exported??0,self_consumed:i.self_consumed??0,gas_energy:i.gas_energy??0,gas_volume:i.gas_volume??0,peak_power_kw:i.peak_power_kw??0,exceedance_kwh:i.exceedance_kwh??0,metering_point:i.metering_point??""},this.renderDashboardPartial()}catch(t){console.error("Zoom data fetch failed:",t)}}renderDashboardPartial(){var b,C;const e=this.root.querySelector(".dashboard");if(!e||!this.state.rangeData)return;const a=document.createElement("div");a.innerHTML=he(this.state);const t=a.querySelector(".dashboard");if(!t)return;const r=e.querySelector(".range-selector"),n=t.querySelector(".range-selector");r&&n&&r.replaceWith(n);const i=e.querySelector(".custom-range-picker"),o=t.querySelector(".custom-range-picker");i&&o?i.replaceWith(o):!i&&o?(b=e.querySelector(".range-selector"))==null||b.insertAdjacentElement("afterend",o):i&&!o&&i.remove();const l=e.querySelector(".stats-grid"),d=t.querySelector(".stats-grid");l&&d&&l.replaceWith(d);const h=e.querySelector(".flow-card"),g=t.querySelector(".flow-card");h&&g&&h.replaceWith(g);const v=e.querySelector(".metrics-card"),y=t.querySelector(".metrics-card");v&&y&&v.replaceWith(y);const p=e.querySelector(".chart-header .card-title"),$=t.querySelector(".chart-header .card-title");p&&$&&p.replaceWith($);const k=e.querySelector(".reset-zoom-btn");k&&(k.style.display=""),e.querySelectorAll("[data-range]").forEach(L=>{L.addEventListener("click",()=>{this.changeRange(L.dataset.range)})});const m=e.querySelector("#custom-start"),c=e.querySelector("#custom-end");m&&m.addEventListener("change",()=>{this.state.customStart=m.value}),c&&c.addEventListener("change",()=>{this.state.customEnd=c.value}),(C=e.querySelector("#apply-custom-range"))==null||C.addEventListener("click",()=>{this.preZoomRange=null,this.applyCustomRange()})}getDateRangeISO(){const e=new Date,a=t=>t.toISOString();switch(this.state.range){case"custom":{const t=new Date(this.state.customStart+"T00:00:00"),r=new Date(this.state.customEnd+"T23:59:59.999");return{start:a(t),end:a(r)}}case"yesterday":{const t=new Date(e);t.setDate(t.getDate()-1),t.setHours(0,0,0,0);const r=new Date(t);return r.setHours(23,59,59,999),{start:a(t),end:a(r)}}case"this_week":{const t=new Date(e),r=t.getDay()||7;return t.setDate(t.getDate()-r+1),t.setHours(0,0,0,0),{start:a(t),end:a(e)}}case"last_week":{const t=new Date(e),r=t.getDay()||7,n=new Date(t);n.setDate(t.getDate()-r),n.setHours(23,59,59,999);const i=new Date(n);return i.setDate(n.getDate()-6),i.setHours(0,0,0,0),{start:a(i),end:a(n)}}case"this_month":{const t=new Date(e.getFullYear(),e.getMonth(),1);return{start:a(t),end:a(e)}}case"last_month":{const t=new Date(e.getFullYear(),e.getMonth()-1,1),r=new Date(e.getFullYear(),e.getMonth(),0,23,59,59,999);return{start:a(t),end:a(r)}}case"this_year":{const t=new Date(e.getFullYear(),0,1);return{start:a(t),end:a(e)}}case"last_year":{const t=new Date(e.getFullYear()-1,0,1),r=new Date(e.getFullYear()-1,11,31,23,59,59,999);return{start:a(t),end:a(r)}}default:{const t=new Date(e);t.setDate(t.getDate()-1),t.setHours(0,0,0,0);const r=new Date(t);return r.setHours(23,59,59,999),{start:a(t),end:a(r)}}}}}if(window.self===window.top&&window.location.pathname.startsWith("/leneda-panel/"))window.location.href="/leneda";else{const s=document.getElementById("app");s&&new ze(s).mount()}
