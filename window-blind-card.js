class WindowBlindCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity && (!config.entities || config.entities.length === 0)) {
      throw new Error('Vous devez définir une entité principale (entity) ou une liste d\'entités (entities)');
    }
    
    const mainEntity = config.entity || (config.entities && config.entities[0]);

    this.config = {
      entity: mainEntity,
      name: config.name || 'Store',
      size: config.size || 'medium',
      show_position_text: config.show_position_text !== false,
      show_weather_indicator: config.show_weather_indicator !== false,
      window_type: config.window_type || 'double',
      glass_style: config.glass_style || 'clear',
      window_width: config.window_width || 'medium',
      window_height: config.window_height || 'medium',
      window_frame_color: config.window_frame_color || '#333333',
      window_frame_material: config.window_frame_material || 'pvc',
      blind_type: config.blind_type || 'roller',
      blind_color: config.blind_color || '#d4d4d4',
      blind_slat_color: config.blind_slat_color || '#999999',
      show_handle: config.show_handle !== false,
      handle_position: config.handle_position || 'right',
      handle_style: config.handle_style || 'modern',
      handle_color: config.handle_color || '#666666',
      show_preset_buttons: config.show_preset_buttons !== false,
      preset_positions: config.preset_positions || [25, 50, 75],
      entities: config.entities || [],
      show_sun_effects: config.show_sun_effects || false,
      window_orientation: config.window_orientation || 'south',
      ...config
    };
    
    this.render();
    this.startSunTracking();
  }

  set hass(hass) {
    this._hass = hass;
    const entity = hass.states[this.config.entity];
    if (entity) this.updateBlind(entity);
    if (this.config.entities.length > 0) this.updateMultiStores();
    if (this.config.show_sun_effects) this.updateSunEffects();
  }
  
  connectedCallback() {
    this.startSunTracking();
  }

  disconnectedCallback() {
    if (this.sunInterval) clearInterval(this.sunInterval);
  }
  
  startSunTracking() {
    if (!this.config.show_sun_effects) return;
    this.updateSunEffects();
    if (this.sunInterval) clearInterval(this.sunInterval);
    this.sunInterval = setInterval(() => this.updateSunEffects(), 60000);
  }

  getSunPosition() {
    const now = new Date();
    const hours = now.getHours();
    const timeDecimal = hours + now.getMinutes() / 60;
    const sunrise = 6, sunset = 18;
    let sunAngle = 0, intensity = 0;
    
    if (timeDecimal >= sunrise && timeDecimal <= sunset) {
      const progress = (timeDecimal - sunrise) / (sunset - sunrise);
      sunAngle = -90 + (progress * 180);
      intensity = Math.sin(progress * Math.PI);
    }
    return { angle: sunAngle, intensity, hours };
  }

  updateSunEffects() {
    if (!this.config.show_sun_effects) return;
    
    const sunPos = this.getSunPosition();
    const { orientation, show_weather_indicator } = this.config;
    
    const weatherIndicator = this.shadowRoot.querySelector('.weather-indicator');
    const container = this.shadowRoot.querySelector('.window-container');
    const glassGlare = this.shadowRoot.querySelector('.glass-glare');

    // Set background color
    const bgColors = { night: '#2c3e50', dawn: '#87CEEB', day: '#f5f5f5', dusk: '#FFB347' };
    let bgColor = bgColors.day;
    if (sunPos.hours < 6 || sunPos.hours >= 20) bgColor = bgColors.night;
    else if (sunPos.hours < 8) bgColor = bgColors.dawn;
    else if (sunPos.hours >= 17) bgColor = bgColors.dusk;
    if (container) container.style.background = bgColor;

    // Set weather icon
    if (show_weather_indicator && weatherIndicator) {
      let weatherIcon = '', iconOpacity = '0';
      if (sunPos.intensity === 0) {
        weatherIcon = '🌙';
        iconOpacity = '0.7';
      } else {
        let isSunlit = false;
        if (orientation === 'east') isSunlit = sunPos.angle < -15;
        else if (orientation === 'south') isSunlit = Math.abs(sunPos.angle) < 45;
        else if (orientation === 'west') isSunlit = sunPos.angle > 15;
        
        weatherIcon = isSunlit ? '☀️' : '⛅';
        iconOpacity = (0.5 + sunPos.intensity * 0.5).toFixed(2);
      }
      weatherIndicator.textContent = weatherIcon;
      weatherIndicator.style.opacity = iconOpacity;
    }
    
    // Set glass glare effect
    if (glassGlare) {
        const isSunlit = sunPos.intensity > 0.5;
        glassGlare.style.opacity = isSunlit ? (sunPos.intensity - 0.5) * 0.5 : '0';
    }
  }

  getComponentSize() {
    const { size } = this.config;
    const sizes = {
        small: { windowScale: 0.8, fontScale: 0.8, paddingScale: 0.8, gapScale: 0.8 },
        medium: { windowScale: 1, fontScale: 1, paddingScale: 1, gapScale: 1 },
        large: { windowScale: 1.2, fontScale: 1.2, paddingScale: 1.2, gapScale: 1.2 }
    };
    return sizes[size] || sizes.medium;
  }

  getWindowSize() {
    const { window_width, window_height } = this.config;
    const { windowScale } = this.getComponentSize();
    const widths = { narrow: 160, medium: 200, wide: 260, 'extra-wide': 320 };
    const heights = { short: 200, medium: 280, tall: 360, 'extra-tall': 440 };
    return {
      width: (widths[window_width] || widths.medium) * windowScale + 'px',
      height: (heights[window_height] || heights.medium) * windowScale + 'px'
    };
  }

  getFrameMaterial() {
    const { window_frame_material } = this.config;
    const materials = {
      pvc: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
      wood: `repeating-linear-gradient(90deg, rgba(139, 69, 19, 0.1) 0px, rgba(160, 82, 45, 0.1) 2px, rgba(139, 69, 19, 0.1) 4px)`,
      aluminum: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0.1) 100%)'
    };
    return { texture: materials[window_frame_material] || materials.pvc };
  }

  getHandleStyle() {
    if (!this.config.show_handle) return '';
    const { handle_style, handle_position, handle_color } = this.config;
    const pos = { left: '20%', center: '50%', right: '80%' }[handle_position];
    const styles = {
      modern: `<div class="handle-base" style="background: ${handle_color};"></div><div class="handle-lever" style="background: ${handle_color};"></div>`,
      classic: `<div class="handle-knob" style="background: ${handle_color};"></div>`,
      round: `<div class="handle-circle" style="background: ${handle_color};"></div>`
    };
    return `<div class="window-handle" style="left: ${pos};">${styles[handle_style] || styles.modern}</div>`;
  }

  getBlindStyle() {
    const { blind_type, blind_color, blind_slat_color } = this.config;
    const styles = {
      roller: `background: ${blind_color};`,
      venetian: `background: repeating-linear-gradient(0deg, ${blind_color} 0px, ${blind_color} 14px, ${blind_slat_color} 14px, ${blind_slat_color} 16px);`,
      pleated: `background: repeating-linear-gradient(0deg, ${blind_color} 0px, ${blind_color} 8px, ${blind_slat_color} 8px, ${blind_slat_color} 10px, ${blind_color} 10px, ${blind_color} 18px, ${blind_slat_color} 18px, ${blind_slat_color} 20px);`,
      curtain: `background: linear-gradient(90deg, ${blind_color} 0%, ${blind_slat_color} 10%, ${blind_color} 20%, ${blind_slat_color} 30%, ${blind_color} 40%, ${blind_slat_color} 50%, ${blind_color} 60%, ${blind_slat_color} 70%, ${blind_color} 80%, ${blind_slat_color} 90%, ${blind_color} 100%);`
    };
    return styles[blind_type] || styles.roller;
  }

  getWindowDividers() {
    const { window_type } = this.config;
    const dividers = {
      double: '<div class="window-divider-v"></div>',
      'four-panes': '<div class="window-divider-v"></div><div class="window-divider-h"></div>',
      triple: '<div class="window-divider-v" style="left: 33.33%"></div><div class="window-divider-v" style="left: 66.66%"></div>',
      bay: '<div class="window-divider-v"></div><div class="window-divider-h"></div>',
      grid: '<div class="window-divider-v" style="left: 33.33%"></div><div class="window-divider-v" style="left: 66.66%"></div><div class="window-divider-h" style="top: 33.33%"></div><div class="window-divider-h" style="top: 66.66%"></div>'
    };
    return dividers[window_type] || '';
  }

  getGlassStyle() {
    const { glass_style } = this.config;
    const styles = {
      clear: 'linear-gradient(135deg, #e8f4f8 0%, #d4e9f2 100%)',
      frosted: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
      tinted: 'linear-gradient(135deg, #d4e4f0 0%, #b8d4e8 100%)',
      reflective: 'linear-gradient(135deg, #e8f0f8 0%, #c8dce8 100%)',
      stained: 'linear-gradient(135deg, #ffd4a8 0%, #ffb4a0 50%, #d4e8ff 100%)'
    };
    return styles[glass_style] || styles.clear;
  }

  render() {
    const { name, show_preset_buttons, preset_positions, entities, show_sun_effects, show_weather_indicator } = this.config;
    const { fontScale, paddingScale, gapScale } = this.getComponentSize();
    const windowSize = this.getWindowSize();
    const glassStyle = this.getGlassStyle();
    const glassOpacity = { clear: '0.1', frosted: '0.3', tinted: '0.25', reflective: '0.15', stained: '0.2' }[this.config.glass_style] || '0.1';
    const frameColor = this.config.window_frame_color;
    const frameMaterial = this.getFrameMaterial();
    const blindStyle = this.getBlindStyle();
    const handleHTML = this.getHandleStyle();
    const isMulti = entities.length > 0;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; position: relative; z-index: 0; }
        .card { background: var(--ha-card-background, white); border-radius: var(--ha-card-border-radius, 12px); box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1)); overflow: hidden; }
        .header { display: flex; align-items: center; gap: ${12 * gapScale}px; padding: ${16 * paddingScale}px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-bottom: 1px solid rgba(0,0,0,0.1); }
        .header ha-icon { color: var(--primary-text-color); }
        .header h2 { margin: 0; font-size: ${20 * fontScale}px; color: var(--primary-text-color); font-weight: 500; }
        .window-container { padding: ${24 * paddingScale}px; background: #f5f5f5; display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; transition: background 2s ease; position: relative; }
        .window-wrapper { position: relative; }
        .window-frame { width: ${windowSize.width}; height: ${windowSize.height}; background: ${glassStyle}; border: 6px solid ${frameColor}; border-radius: 4px; position: relative; overflow: hidden; box-shadow: inset 0 2px 8px rgba(0,0,0,${glassOpacity}); }
        .weather-indicator { position: absolute; top: 8px; right: 8px; font-size: ${24 * fontScale}px; opacity: 0; transition: opacity 1s ease; pointer-events: none; z-index: 6; text-shadow: 0 0 5px rgba(255,255,255,0.5); }
        .glass-glare { position: absolute; top: 0; left: -100%; width: 50%; height: 100%; background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%); transform: skewX(-25deg); animation: glare 5s infinite linear; opacity: 0; transition: opacity 1s; }
        @keyframes glare { 0% { left: -100%; } 100% { left: 150%; } }
        .window-frame::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${frameMaterial.texture}; pointer-events: none; z-index: 1; }
        .window-divider-v, .window-divider-h { position: absolute; background: ${frameColor}; z-index: 5; box-shadow: inset 0 0 2px rgba(0,0,0,0.3); }
        .window-divider-v { left: 50%; top: 0; width: 3px; height: 100%; transform: translateX(-50%); }
        .window-divider-h { top: 50%; left: 0; width: 100%; height: 3px; transform: translateY(-50%); }
        .blind { position: absolute; top: 0; left: 0; right: 0; ${blindStyle} transition: height 0.5s ease; box-shadow: 0 3px 6px rgba(0,0,0,0.2); z-index: 10; }
        .controls { padding: ${16 * paddingScale}px; }
        /* ... (autres styles) ... */
      </style>
      
      <ha-card class="card">
        <div class="header"><ha-icon icon="mdi:window-shutter"></ha-icon><h2>${name}</h2></div>
        <div class="window-container">
          ${isMulti ? `<div class="multi-stores" id="multiStores"></div>` : ''}
          <div class="window-wrapper">
            <div class="window-frame">
              <div class="glass-glare"></div>
              ${show_weather_indicator ? `<div class="weather-indicator"></div>` : ''}
              <div class="blind" id="blind"></div>
              ${this.getWindowDividers()}
              ${handleHTML}
            </div>
          </div>
        </div>
        <div class="controls">
          ${this.config.show_position_text ? `<div class="position-display"><div class="position-value" id="positionValue">0</div><div class="position-label">% ouvert</div></div>` : ''}
          ${show_preset_buttons ? `<div class="preset-buttons">${preset_positions.map(pos => `<button class="preset-btn" data-position="${pos}">${pos}%</button>`).join('')}</div>` : ''}
          <div class="slider-container"><input type="range" min="0" max="100" value="0" class="slider" id="slider"></div>
          <div class="buttons">
            <button class="btn btn-open" id="btnOpen"><span class="icon">↑</span><span>Ouvrir</span></button>
            <button class="btn btn-stop" id="btnStop"><span class="icon">⏸</span><span>Stop</span></button>
            <button class="btn btn-close" id="btnClose"><span class="icon">↓</span><span>Fermer</span></button>
          </div>
        </div>
      </ha-card>
    `;
    this.setupEventListeners();
  }

  setupEventListeners() {
    const slider = this.shadowRoot.getElementById('slider');
    slider.addEventListener('change', (e) => this.setPosition(parseInt(e.target.value)));
    slider.addEventListener('input', (e) => this.updateVisual(parseInt(e.target.value)));
    this.shadowRoot.getElementById('btnOpen').addEventListener('click', () => this.callService('open_cover'));
    this.shadowRoot.getElementById('btnStop').addEventListener('click', () => this.callService('stop_cover'));
    this.shadowRoot.getElementById('btnClose').addEventListener('click', () => this.callService('close_cover'));
    this.shadowRoot.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.setPosition(parseInt(e.target.dataset.position)));
    });
    if (this.config.entities.length > 0) this.setupMultiStoresListeners();
  }

  setupMultiStoresListeners() {
    setTimeout(() => {
      this.shadowRoot.querySelectorAll('.mini-window').forEach(win => {
        win.addEventListener('click', (e) => {
          this.config.entity = e.currentTarget.dataset.entity;
          const entity = this._hass.states[this.config.entity];
          if (entity) this.updateBlind(entity);
        });
      });
    }, 100);
  }

  updateMultiStores() {
    const container = this.shadowRoot.getElementById('multiStores');
    if (!container) return;
    container.innerHTML = this.config.entities.map(entityId => {
      const entity = this._hass.states[entityId];
      if (!entity) return '';
      return `<div class="mini-window" data-entity="${entityId}"><div class="mini-blind" style="height: ${100 - (entity.attributes.current_position || 0)}%;"></div><div class="mini-label">${entity.attributes.friendly_name || entityId}</div></div>`;
    }).join('');
    this.setupMultiStoresListeners();
  }

  updateBlind(entity) {
    const position = entity.attributes.current_position || 0;
    this.updateVisual(position);
    this.shadowRoot.getElementById('slider').value = position;
  }

  updateVisual(position) {
    this.shadowRoot.getElementById('blind').style.height = (100 - position) + '%';
    if (this.config.show_position_text) {
      this.shadowRoot.getElementById('positionValue').textContent = position;
    }
  }

  setPosition(position) { this._hass.callService('cover', 'set_cover_position', { entity_id: this.config.entity, position: position }); }
  callService(service) { this._hass.callService('cover', service, { entity_id: this.config.entity }); }
  getCardSize() { return 5; }
  static getConfigElement() { return document.createElement('window-blind-card-editor'); }
  static getStubConfig() { /* ... */ }
}

class WindowBlindCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
  }

  set hass(hass) { this._hass = hass; }
  setConfig(config) { this._config = config; this.render(); }

  render() {
    if (!this._hass) return;
    const entities = Object.keys(this._hass.states).filter(eid => eid.startsWith('cover.'));
    this.shadowRoot.innerHTML = `
      <style>
        .form-group { display: flex; flex-direction: column; margin-bottom: 12px; }
        .checkbox-group { flex-direction: row; align-items: center; }
        label { margin-bottom: 4px; font-weight: 500; }
        input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid var(--divider-color); border-radius: 4px; }
      </style>
      <div class="card-config">
        <div class="form-group"><label>Entité Principale</label><select data-key="entity" id="entity">${entities.map(e => `<option value="${e}">${this._hass.states[e].attributes.friendly_name || e}</option>`).join('')}</select></div>
        <div class="form-group"><label>Entités Multiples (une par ligne)</label><textarea data-key="entities" id="entities" rows="3"></textarea></div>
        <div class="form-group"><label>Nom</label><input type="text" data-key="name" id="name"></div>
        <div class="form-group"><label>Taille</label><select data-key="size" id="size"><option value="small">Petit</option><option value="medium">Moyen</option><option value="large">Grand</option></select></div>
        <div class="form-group checkbox-group"><input type="checkbox" data-key="show_sun_effects" id="show_sun_effects"><label for="show_sun_effects">Activer effets solaires</label></div>
        <div class="form-group checkbox-group"><input type="checkbox" data-key="show_weather_indicator" id="show_weather_indicator"><label for="show_weather_indicator">Afficher indicateur météo</label></div>
        <div class="form-group"><label>Orientation Fenêtre</label><select data-key="window_orientation" id="window_orientation"><option value="north">Nord</option><option value="east">Est</option><option value="south">Sud</option><option value="west">Ouest</option></select></div>
        <!-- ... autres options ... -->
      </div>
    `;
    this._bindAll();
  }

  _bindAll() {
    const defaults = {
        entity: this._config.entity, name: 'Store', size: 'medium', entities: (this._config.entities || []).join('\n'),
        show_sun_effects: false, show_weather_indicator: true, window_orientation: 'south', /* ... */
    };
    Object.keys(defaults).forEach(key => {
        const el = this.shadowRoot.getElementById(key);
        if (el) {
            const prop = el.type === 'checkbox' ? 'checked' : 'value';
            this._bind(key, prop, el.type === 'checkbox' ? 'change' : 'input', defaults[key]);
        }
    });
  }

  _bind(id, prop, event, defaultValue) {
    const el = this.shadowRoot.getElementById(id);
    if (!el) return;
    el[prop] = this._config[id] !== undefined ? this._config[id] : defaultValue;
    el.addEventListener(event, (e) => this._valueChanged(e));
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;
    const target = ev.target;
    const key = target.id;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    if (key === 'entities') value = value.split('\n').map(e => e.trim()).filter(e => e);
    if (key === 'preset_positions') value = value.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    this._config = { ...this._config, [key]: value };
    this.dispatchEvent(new CustomEvent("config-changed", { bubbles: true, composed: true, detail: { config: this._config } }));
  }
}

customElements.define('window-blind-card', WindowBlindCard);
customElements.define('window-blind-card-editor', WindowBlindCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'window-blind-card',
  name: 'Window Blind Card',
  description: 'Une carte pour contrôler vos stores avec des effets visuels.',
  preview: true,
  documentationURL: 'https://github.com/saniho/window-blind-card'
});
console.info('%c WINDOW-BLIND-CARD %c Version 2.0.0e ', 'color: white; background: #2196F3; font-weight: 700;', 'color: #2196F3; background: white; font-weight: 700;');