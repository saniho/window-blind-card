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
      window_type: config.window_type || 'double',
      glass_style: config.glass_style || 'clear',
      window_width: config.window_width || 'medium',
      window_height: config.window_height || 'medium',
      window_frame_color: config.window_frame_color || '#333333',
      window_frame_material: config.window_frame_material || 'pvc', // pvc, wood, aluminum
      blind_type: config.blind_type || 'roller', // roller, venetian, pleated, curtain
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
    if (entity) {
      this.updateBlind(entity);
    }
    if (this.config.entities.length > 0) {
      this.updateMultiStores();
    }
    if (this.config.show_sun_effects) {
      this.updateSunEffects();
    }
  }
  
  connectedCallback() {
      this.startSunTracking();
  }

  disconnectedCallback() {
    if (this.sunInterval) {
      clearInterval(this.sunInterval);
    }
  }
  
  startSunTracking() {
    if (!this.config.show_sun_effects) return;
    
    if (this.sunInterval) clearInterval(this.sunInterval);
    this.sunInterval = setInterval(() => {
      this.updateSunEffects();
    }, 60000);
  }

  getSunPosition() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeDecimal = hours + minutes / 60;
    
    const sunrise = 6;
    const sunset = 18;
    const noon = 12;
    
    let sunAngle = 0;
    let sunHeight = 0;
    let intensity = 0;
    
    if (timeDecimal < sunrise || timeDecimal > sunset) {
      intensity = 0;
      sunHeight = -10;
    } else if (timeDecimal < noon) {
      const progress = (timeDecimal - sunrise) / (noon - sunrise);
      sunAngle = -90 + (progress * 90);
      sunHeight = progress * 60;
      intensity = 0.3 + (progress * 0.7);
    } else {
      const progress = (timeDecimal - noon) / (sunset - noon);
      sunAngle = progress * 90;
      sunHeight = 60 - (progress * 70);
      intensity = 1 - (progress * 0.7);
    }
    
    return { angle: sunAngle, height: sunHeight, intensity, hours };
  }

  updateSunEffects() {
    if (!this.config.show_sun_effects) return;
    
    const sunPos = this.getSunPosition();
    const orientation = this.config.window_orientation;
    
    let isSunlit = false;
    let lightIntensity = 0;
    let weatherIcon = '☁️';

    switch(orientation) {
      case 'east':
        isSunlit = sunPos.angle < -30;
        lightIntensity = isSunlit ? Math.max(0, 1 - (sunPos.angle + 90) / 60) : 0;
        break;
      case 'south':
        isSunlit = Math.abs(sunPos.angle) < 30;
        lightIntensity = isSunlit ? 1 : Math.max(0, 1 - Math.abs(sunPos.angle - 30) / 30);
        break;
      case 'west':
        isSunlit = sunPos.angle > 30;
        lightIntensity = isSunlit ? Math.max(0, (sunPos.angle - 30) / 60) : 0;
        break;
      case 'north':
        lightIntensity = 0.2;
        break;
    }
    
    lightIntensity *= sunPos.intensity;

    if (sunPos.hours < 6 || sunPos.hours >= 18) {
        weatherIcon = '🌙';
    } else if (lightIntensity > 0.7) {
        weatherIcon = '☀️';
    } else if (lightIntensity > 0.3) {
        weatherIcon = '⛅';
    }

    const container = this.shadowRoot.querySelector('.window-container');
    const weatherIndicator = this.shadowRoot.querySelector('.weather-indicator');
    const timeIndicator = this.shadowRoot.querySelector('.time-indicator');
    
    if (container) {
      const bgColors = {
        night: '#2c3e50',
        dawn: '#87CEEB',
        day: '#f5f5f5',
        dusk: '#FFB347'
      };
      
      let bgColor = bgColors.day;
      if (sunPos.hours < 6 || sunPos.hours >= 20) bgColor = bgColors.night;
      else if (sunPos.hours < 8) bgColor = bgColors.dawn;
      else if (sunPos.hours >= 17) bgColor = bgColors.dusk;
      
      container.style.background = bgColor;
    }
    
    if (weatherIndicator) {
        weatherIndicator.textContent = weatherIcon;
        weatherIndicator.style.opacity = lightIntensity > 0.1 ? '0.7' : '0';
    }
    
    if (timeIndicator) {
      const timeStr = `${String(sunPos.hours).padStart(2, '0')}:${String(Math.floor((sunPos.hours % 1) * 60)).padStart(2, '0')}`;
      const icon = sunPos.hours >= 6 && sunPos.hours < 18 ? '☀️' : '🌙';
      timeIndicator.textContent = `${icon} ${timeStr}`;
    }
  }

  getComponentSize() {
    const size = this.config.size;
    const sizes = {
        small: { windowScale: 0.8, fontScale: 0.8, paddingScale: 0.8, gapScale: 0.8 },
        medium: { windowScale: 1, fontScale: 1, paddingScale: 1, gapScale: 1 },
        large: { windowScale: 1.2, fontScale: 1.2, paddingScale: 1.2, gapScale: 1.2 }
    };
    return sizes[size] || sizes.medium;
  }

  getWindowSize() {
    const width = this.config.window_width;
    const height = this.config.window_height;
    const { windowScale } = this.getComponentSize();

    const widths = {
      narrow: 160 * windowScale + 'px',
      medium: 200 * windowScale + 'px',
      wide: 260 * windowScale + 'px',
      'extra-wide': 320 * windowScale + 'px'
    };

    const heights = {
      short: 200 * windowScale + 'px',
      medium: 280 * windowScale + 'px',
      tall: 360 * windowScale + 'px',
      'extra-tall': 440 * windowScale + 'px'
    };

    return {
      width: widths[width] || widths.medium,
      height: heights[height] || heights.medium
    };
  }

  getFrameMaterial() {
    const material = this.config.window_frame_material;
    const materials = {
      pvc: { texture: 'linear-gradient(90deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)' },
      wood: { texture: `repeating-linear-gradient(90deg, rgba(139, 69, 19, 0.1) 0px, rgba(160, 82, 45, 0.1) 2px, rgba(139, 69, 19, 0.1) 4px)` },
      aluminum: { texture: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0.1) 100%)' }
    };
    return materials[material] || materials.pvc;
  }

  getHandleStyle() {
    if (!this.config.show_handle) return '';
    
    const { handle_style, handle_position, handle_color } = this.config;
    const positions = { left: '20%', center: '50%', right: '80%' };
    
    const handles = {
      modern: `<div class="window-handle" style="left: ${positions[handle_position]};"><div class="handle-base" style="background: ${handle_color};"></div><div class="handle-lever" style="background: ${handle_color};"></div></div>`,
      classic: `<div class="window-handle classic" style="left: ${positions[handle_position]};"><div class="handle-knob" style="background: ${handle_color};"></div></div>`,
      round: `<div class="window-handle round" style="left: ${positions[handle_position]};"><div class="handle-circle" style="background: ${handle_color};"></div></div>`
    };
    
    return handles[handle_style] || handles.modern;
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
    const type = this.config.window_type;
    switch(type) {
      case 'single': return '';
      case 'double': return '<div class="window-divider-v"></div>';
      case 'four-panes': return '<div class="window-divider-v"></div><div class="window-divider-h"></div>';
      case 'triple': return '<div class="window-divider-v" style="left: 33.33%"></div><div class="window-divider-v" style="left: 66.66%"></div>';
      case 'bay': return '<div class="window-divider-v"></div><div class="window-divider-h"></div>';
      case 'grid': return '<div class="window-divider-v" style="left: 33.33%"></div><div class="window-divider-v" style="left: 66.66%"></div><div class="window-divider-h" style="top: 33.33%"></div><div class="window-divider-h" style="top: 66.66%"></div>';
      default: return '<div class="window-divider-v"></div><div class="window-divider-h"></div>';
    }
  }

  getGlassStyle() {
    const style = this.config.glass_style;
    const styles = {
      clear: 'linear-gradient(135deg, #e8f4f8 0%, #d4e9f2 100%)',
      frosted: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
      tinted: 'linear-gradient(135deg, #d4e4f0 0%, #b8d4e8 100%)',
      reflective: 'linear-gradient(135deg, #e8f0f8 0%, #c8dce8 100%)',
      stained: 'linear-gradient(135deg, #ffd4a8 0%, #ffb4a0 50%, #d4e8ff 100%)'
    };
    return styles[style] || styles.clear;
  }

  getGlassOpacity() {
    const opacities = { clear: '0.1', frosted: '0.3', tinted: '0.25', reflective: '0.15', stained: '0.2' };
    return opacities[this.config.glass_style] || '0.1';
  }

  render() {
    const { name, show_preset_buttons, preset_positions, entities } = this.config;
    const { fontScale, paddingScale, gapScale } = this.getComponentSize();
    const windowSize = this.getWindowSize();
    const glassStyle = this.getGlassStyle();
    const glassOpacity = this.getGlassOpacity();
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
        .weather-indicator { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 64px; opacity: 0; transition: opacity 1s ease; pointer-events: none; z-index: 2; }
        .time-indicator { position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.4); color: white; padding: 2px 6px; border-radius: 8px; font-size: 11px; font-weight: 600; }
        .window-wrapper { position: relative; }
        .window-frame { width: ${windowSize.width}; height: ${windowSize.height}; background: ${glassStyle}; border: 6px solid ${frameColor}; border-radius: 4px; position: relative; overflow: hidden; box-shadow: inset 0 2px 8px rgba(0,0,0,${glassOpacity}); }
        .window-frame::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${frameMaterial.texture}; pointer-events: none; z-index: 1; }
        .window-divider-v, .window-divider-h { position: absolute; background: ${frameColor}; z-index: 5; box-shadow: inset 0 0 2px rgba(0,0,0,0.3); }
        .window-divider-v { left: 50%; top: 0; width: 3px; height: 100%; transform: translateX(-50%); }
        .window-divider-h { top: 50%; left: 0; width: 100%; height: 3px; transform: translateY(-50%); }
        .window-handle { position: absolute; bottom: 30%; transform: translateX(-50%); z-index: 6; }
        .handle-base { width: 8px; height: 40px; border-radius: 2px; box-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .handle-lever { width: 30px; height: 8px; border-radius: 2px; margin-top: -24px; margin-left: 8px; box-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .handle-knob { width: 20px; height: 20px; border-radius: 50%; box-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .handle-circle { width: 24px; height: 24px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3); box-shadow: 2px 2px 6px rgba(0,0,0,0.3); }
        .blind { position: absolute; top: 0; left: 0; right: 0; ${blindStyle} transition: height 0.5s ease; box-shadow: 0 3px 6px rgba(0,0,0,0.2); z-index: 10; }
        .multi-stores { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
        .mini-window { width: 80px; height: 100px; background: ${glassStyle}; border: 3px solid ${frameColor}; border-radius: 2px; position: relative; overflow: hidden; cursor: pointer; transition: transform 0.2s; }
        .mini-window:hover { transform: scale(1.05); }
        .mini-blind { position: absolute; top: 0; left: 0; right: 0; ${blindStyle} opacity: 0.9; }
        .mini-label { position: absolute; bottom: 2px; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; font-size: 9px; padding: 2px; text-align: center; }
        .controls { padding: ${16 * paddingScale}px; }
        .position-display { text-align: center; margin-bottom: ${12 * paddingScale}px; }
        .position-value { font-size: ${36 * fontScale}px; font-weight: 600; color: var(--primary-color); }
        .position-label { font-size: ${14 * fontScale}px; color: var(--secondary-text-color); }
        .slider-container { margin: ${16 * paddingScale}px 0; }
        .slider { width: 100%; }
        .preset-buttons { display: flex; gap: 8px; justify-content: center; margin: 12px 0; flex-wrap: wrap; }
        .preset-btn { padding: 8px 16px; border: 2px solid var(--primary-color); border-radius: 8px; background: white; color: var(--primary-color); font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 13px; }
        .preset-btn:hover { background: var(--primary-color); color: white; transform: translateY(-2px); }
        .buttons { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: ${8 * gapScale}px; margin-top: 16px; }
        .btn { padding: ${12 * paddingScale}px; border: none; border-radius: 8px; font-size: ${13 * fontScale}px; font-weight: 500; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: ${4 * gapScale}px; transition: transform 0.2s, box-shadow 0.2s; color: white; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .btn-open { background: linear-gradient(135deg, #4CAF50, #45a049); }
        .btn-stop { background: linear-gradient(135deg, #FF9800, #f57c00); }
        .btn-close { background: linear-gradient(135deg, #2196F3, #1976d2); }
        .icon { font-size: ${20 * fontScale}px; }
      </style>
      
      <ha-card class="card">
        <div class="header">
          <ha-icon icon="mdi:window-shutter"></ha-icon>
          <h2>${name}</h2>
        </div>
        
        <div class="window-container">
          ${isMulti ? `<div class="multi-stores" id="multiStores"></div>` : ''}
          <div class="weather-indicator"></div>
          ${this.config.show_sun_effects ? `<div class="time-indicator"></div>` : ''}
          <div class="window-wrapper">
            <div class="window-frame">
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
    
    if (this.config.entities.length > 0) {
      this.setupMultiStoresListeners();
    }
  }

  setupMultiStoresListeners() {
    setTimeout(() => {
      this.shadowRoot.querySelectorAll('.mini-window').forEach(win => {
        win.addEventListener('click', (e) => {
          const entityId = e.currentTarget.dataset.entity;
          this.config.entity = entityId;
          const entity = this._hass.states[entityId];
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
      const position = entity.attributes.current_position || 0;
      const name = entity.attributes.friendly_name || entityId;
      return `<div class="mini-window" data-entity="${entityId}"><div class="mini-blind" style="height: ${100 - position}%;"></div><div class="mini-label">${name}</div></div>`;
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

  setPosition(position) {
    this._hass.callService('cover', 'set_cover_position', { entity_id: this.config.entity, position: position });
  }

  callService(service) {
    this._hass.callService('cover', service, { entity_id: this.config.entity });
  }

  getCardSize() { return 5; }

  static getConfigElement() {
    return document.createElement('window-blind-card-editor');
  }

  static getStubConfig() {
    return {
      entity: 'cover.store',
      name: 'Store',
      size: 'medium',
      show_position_text: true,
      window_type: 'double',
      window_width: 'medium',
      window_height: 'medium',
      window_frame_color: '#333333',
      window_frame_material: 'pvc',
      blind_type: 'roller',
      glass_style: 'clear',
      show_handle: true,
      handle_position: 'right',
      handle_style: 'modern',
      show_preset_buttons: true,
      preset_positions: [25, 50, 75],
      show_sun_effects: false,
      window_orientation: 'south'
    };
  }
}

class WindowBlindCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
  }

  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this._config = config;
    this.render();
  }

  render() {
    if (!this._hass) return;

    const entities = Object.keys(this._hass.states).filter(eid => eid.startsWith('cover.'));

    this.shadowRoot.innerHTML = `
      <style>
        .form-group { display: flex; flex-direction: column; margin-bottom: 12px; }
        .checkbox-group { flex-direction: row; align-items: center; }
        label { margin-bottom: 4px; font-weight: 500; }
        input, select, textarea { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid var(--divider-color); border-radius: 4px; }
        .color-input { padding: 2px; height: 38px; }
      </style>
      <div class="card-config">
        <div class="form-group">
          <label>Entité Principale</label>
          <select data-key="entity" id="entity">${entities.map(e => `<option value="${e}">${this._hass.states[e].attributes.friendly_name || e}</option>`).join('')}</select>
        </div>
        <div class="form-group">
          <label>Entités Multiples (optionnel, une par ligne)</label>
          <textarea data-key="entities" id="entities" rows="3"></textarea>
        </div>
        <div class="form-group"><label>Nom</label><input type="text" data-key="name" id="name"></div>
        <div class="form-group"><label>Taille</label><select data-key="size" id="size"><option value="small">Petit</option><option value="medium">Moyen</option><option value="large">Grand</option></select></div>
        <div class="form-group"><label>Type de Fenêtre</label><select data-key="window_type" id="window_type"><option value="single">Simple</option><option value="double">Double</option><option value="four-panes">4 Carreaux</option><option value="triple">Triple</option><option value="bay">Baie</option><option value="grid">Grille</option></select></div>
        <div class="form-group"><label>Largeur Fenêtre</label><select data-key="window_width" id="window_width"><option value="narrow">Étroite</option><option value="medium">Moyenne</option><option value="wide">Large</option><option value="extra-wide">Très Large</option></select></div>
        <div class="form-group"><label>Hauteur Fenêtre</label><select data-key="window_height" id="window_height"><option value="short">Basse</option><option value="medium">Moyenne</option><option value="tall">Haute</option><option value="extra-tall">Très Haute</option></select></div>
        <div class="form-group"><label>Style du Verre</label><select data-key="glass_style" id="glass_style"><option value="clear">Clair</option><option value="frosted">Dépoli</option><option value="tinted">Teinté</option><option value="reflective">Réfléchissant</option><option value="stained">Vitrail</option></select></div>
        <div class="form-group"><label>Matériau du Cadre</label><select data-key="window_frame_material" id="window_frame_material"><option value="pvc">PVC</option><option value="wood">Bois</option><option value="aluminum">Aluminium</option></select></div>
        <div class="form-group"><label>Couleur du Cadre</label><input type="color" class="color-input" data-key="window_frame_color" id="window_frame_color"></div>
        <div class="form-group"><label>Type de Store</label><select data-key="blind_type" id="blind_type"><option value="roller">Enrouleur</option><option value="venetian">Vénitien</option><option value="pleated">Plissé</option><option value="curtain">Rideau</option></select></div>
        <div class="form-group"><label>Couleur du Store</label><input type="color" class="color-input" data-key="blind_color" id="blind_color"></div>
        <div class="form-group"><label>Couleur des Lattes</label><input type="color" class="color-input" data-key="blind_slat_color" id="blind_slat_color"></div>
        <div class="form-group checkbox-group"><input type="checkbox" data-key="show_handle" id="show_handle"><label for="show_handle">Afficher la poignée</label></div>
        <div class="form-group"><label>Style Poignée</label><select data-key="handle_style" id="handle_style"><option value="modern">Moderne</option><option value="classic">Classique</option><option value="round">Ronde</option></select></div>
        <div class="form-group"><label>Position Poignée</label><select data-key="handle_position" id="handle_position"><option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option></select></div>
        <div class="form-group"><label>Couleur Poignée</label><input type="color" class="color-input" data-key="handle_color" id="handle_color"></div>
        <div class="form-group checkbox-group"><input type="checkbox" data-key="show_position_text" id="show_position_text"><label for="show_position_text">Afficher texte position</label></div>
        <div class="form-group checkbox-group"><input type="checkbox" data-key="show_preset_buttons" id="show_preset_buttons"><label for="show_preset_buttons">Afficher boutons préréglés</label></div>
        <div class="form-group"><label>Positions Préréglées (ex: 25,50,75)</label><input type="text" data-key="preset_positions" id="preset_positions"></div>
        <div class="form-group checkbox-group"><input type="checkbox" data-key="show_sun_effects" id="show_sun_effects"><label for="show_sun_effects">Activer effets solaires</label></div>
        <div class="form-group"><label>Orientation Fenêtre</label><select data-key="window_orientation" id="window_orientation"><option value="north">Nord</option><option value="east">Est</option><option value="south">Sud</option><option value="west">Ouest</option></select></div>
      </div>
    `;

    this._bind('entity', 'value', 'change', this._config.entity);
    this._bind('entities', 'value', 'input', (this._config.entities || []).join('\n'));
    this._bind('name', 'value', 'input', 'Store');
    this._bind('size', 'value', 'change', 'medium');
    this._bind('window_type', 'value', 'change', 'double');
    this._bind('window_width', 'value', 'change', 'medium');
    this._bind('window_height', 'value', 'change', 'medium');
    this._bind('glass_style', 'value', 'change', 'clear');
    this._bind('window_frame_material', 'value', 'change', 'pvc');
    this._bind('window_frame_color', 'value', 'input', '#333333');
    this._bind('blind_type', 'value', 'change', 'roller');
    this._bind('blind_color', 'value', 'input', '#d4d4d4');
    this._bind('blind_slat_color', 'value', 'input', '#999999');
    this._bind('show_handle', 'checked', 'change', true);
    this._bind('handle_style', 'value', 'change', 'modern');
    this._bind('handle_position', 'value', 'change', 'right');
    this._bind('handle_color', 'value', 'input', '#666666');
    this._bind('show_position_text', 'checked', 'change', true);
    this._bind('show_preset_buttons', 'checked', 'change', true);
    this._bind('preset_positions', 'value', 'input', '25,50,75');
    this._bind('show_sun_effects', 'checked', 'change', false);
    this._bind('window_orientation', 'value', 'change', 'south');
  }

  _bind(id, prop, event, defaultValue) {
    const el = this.shadowRoot.getElementById(id);
    if (!el) return;
    
    const key = el.dataset.key;
    if (el.type === 'checkbox') {
      el.checked = this._config[key] !== undefined ? this._config[key] : defaultValue;
    } else {
      el.value = this._config[key] !== undefined ? this._config[key] : defaultValue;
    }
    
    el.addEventListener(event, (e) => this._valueChanged(e));
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;
    
    const target = ev.target;
    const key = target.dataset.key;
    let value = target.type === 'checkbox' ? target.checked : target.value;

    if (key === 'entities') {
        value = value.split('\n').map(e => e.trim()).filter(e => e);
    }
    if (key === 'preset_positions') {
        value = value.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
    }

    const newConfig = { ...this._config, [key]: value };
    this._config = newConfig;
    
    const event = new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config: newConfig },
    });
    this.dispatchEvent(event);
  }
}

customElements.define('window-blind-card', WindowBlindCard);
customElements.define('window-blind-card-editor', WindowBlindCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'window-blind-card',
  name: 'Window Blind Card',
  description: 'Une carte élégante pour visualiser et contrôler vos stores avec types de fenêtres personnalisables',
  preview: true,
  documentationURL: 'https://github.com/votre-username/window-blind-card'
});

console.info(
  '%c WINDOW-BLIND-CARD %c Version 3.0.0 ',
  'color: white; background: #2196F3; font-weight: 700;',
  'color: #2196F3; background: white; font-weight: 700;'
);