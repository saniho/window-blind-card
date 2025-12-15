class WindowBlindCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Vous devez définir une entité');
    }
    this.config = {
      entity: config.entity,
      name: config.name || 'Store',
      size: config.size || 'medium',
      show_position_text: config.show_position_text !== false,
      window_type: config.window_type || 'double',
      glass_style: config.glass_style || 'clear',
      window_width: config.window_width || 'medium',
      window_height: config.window_height || 'medium',
      window_frame_color: config.window_frame_color || '#333333',
      blind_color: config.blind_color || '#d4d4d4',
      blind_slat_color: config.blind_slat_color || '#999999',
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
    this.updateSunEffects();
    this.sunInterval = setInterval(() => this.updateSunEffects(), 60000);
  }

  isSunlit() {
    const hour = new Date().getHours();
    const { window_orientation } = this.config;
    if (hour < 6 || hour >= 18) return false;
    if (window_orientation === 'east' && hour >= 12) return false;
    if (window_orientation === 'west' && hour < 12) return false;
    if (window_orientation === 'north') return false;
    return true;
  }

  updateSunEffects() {
    const sunIcon = this.shadowRoot.getElementById('sunIcon');
    if (sunIcon) {
      sunIcon.style.display = this.isSunlit() ? 'flex' : 'none';
    }
    this.updateVisual(this._hass.states[this.config.entity].attributes.current_position || 0);
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

  getWindowDividers() {
    const type = this.config.window_type;
    switch(type) {
      case 'single': return '';
      case 'double': return `<div class="window-divider-v"></div>`;
      case 'four-panes': return `<div class="window-divider-v"></div><div class="window-divider-h"></div>`;
      case 'triple': return `<div class="window-divider-v" style="left: 33.33%"></div><div class="window-divider-v" style="left: 66.66%"></div>`;
      case 'bay': return `<div class="window-divider-v"></div><div class="window-divider-h"></div>`;
      case 'grid': return `<div class="window-divider-v" style="left: 33.33%"></div><div class="window-divider-v" style="left: 66.66%"></div><div class="window-divider-h" style="top: 33.33%"></div><div class="window-divider-h" style="top: 66.66%"></div>`;
      default: return `<div class="window-divider-v"></div><div class="window-divider-h"></div>`;
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
    const name = this.config.name;
    const glassStyle = this.getGlassStyle();
    const glassOpacity = this.getGlassOpacity();
    const blindColor = this.config.blind_color;
    const blindSlatColor = this.config.blind_slat_color;
    const windowSize = this.getWindowSize();
    const frameColor = this.config.window_frame_color;
    const { fontScale, paddingScale, gapScale } = this.getComponentSize();

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; position: relative; z-index: 0; }
        .card { background: var(--ha-card-background, white); border-radius: var(--ha-card-border-radius, 12px); box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1)); overflow: hidden; }
        .header { display: flex; align-items: center; justify-content: space-between; gap: ${12 * gapScale}px; padding: ${16 * paddingScale}px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-bottom: 1px solid rgba(0,0,0,0.1); }
        .header-left { display: flex; align-items: center; gap: ${12 * gapScale}px; }
        .header ha-icon { color: var(--primary-text-color); }
        .header h2 { margin: 0; font-size: ${20 * fontScale}px; color: var(--primary-text-color); font-weight: 500; }
        .sun-icon { font-size: ${24 * fontScale}px; color: #FFB300; }
        .window-container { padding: ${24 * paddingScale}px; background: #f5f5f5; display: flex; justify-content: center; }
        .window-frame { width: ${windowSize.width}; height: ${windowSize.height}; background: ${glassStyle}; border: 6px solid ${frameColor}; border-radius: 4px; position: relative; overflow: hidden; box-shadow: inset 0 2px 8px rgba(0,0,0,${glassOpacity}); }
        .visible-light-zone { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(180deg, transparent 0%, rgba(255, 220, 80, 0.15) 100%); z-index: 9; pointer-events: none; transition: height 0.5s ease; display: none; }
        .window-divider-v, .window-divider-h { position: absolute; background: ${frameColor}; z-index: 5; }
        .window-divider-v { left: 50%; top: 0; width: 3px; height: 100%; transform: translateX(-50%); }
        .window-divider-h { top: 50%; left: 0; width: 100%; height: 3px; transform: translateY(-50%); }
        .blind { position: absolute; top: 0; left: 0; right: 0; background: repeating-linear-gradient(0deg, ${blindColor} 0px, ${blindColor} 14px, ${blindSlatColor} 14px, ${blindSlatColor} 16px); transition: height 0.5s ease; box-shadow: 0 3px 6px rgba(0,0,0,0.2); z-index: 10; }
        .controls { padding: ${16 * paddingScale}px; }
        .position-display { text-align: center; margin-bottom: ${12 * paddingScale}px; }
        .position-value { font-size: ${36 * fontScale}px; font-weight: 600; color: var(--primary-color); }
        .position-label { font-size: ${14 * fontScale}px; color: var(--secondary-text-color); }
        .slider-container { margin: ${16 * paddingScale}px 0; }
        .slider { width: 100%; }
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
          <div class="header-left">
            <ha-icon icon="mdi:window-shutter"></ha-icon>
            <h2>${name}</h2>
          </div>
          <div class="sun-icon" id="sunIcon"><ha-icon icon="mdi:weather-sunny"></ha-icon></div>
        </div>
        <div class="window-container">
          <div class="window-frame">
            <div class="visible-light-zone" id="visibleLightZone"></div>
            <div class="blind" id="blind"></div>
            ${this.getWindowDividers()}
          </div>
        </div>
        <div class="controls">
          ${this.config.show_position_text ? `<div class="position-display"><div class="position-value" id="positionValue">0</div><div class="position-label">% ouvert</div></div>` : ''}
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

    const visibleLightZone = this.shadowRoot.getElementById('visibleLightZone');
    if (visibleLightZone) {
      if (this.isSunlit() && position > 0) {
        visibleLightZone.style.height = position + '%';
        visibleLightZone.style.display = 'block';
      } else {
        visibleLightZone.style.display = 'none';
      }
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
        input, select { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid var(--divider-color); border-radius: 4px; }
      </style>
      <div class="card-config">
        <div class="form-group"><label>Entité</label><select data-key="entity" id="entity">${entities.map(e => `<option value="${e}">${this._hass.states[e].attributes.friendly_name || e}</option>`).join('')}</select></div>
        <div class="form-group"><label>Nom</label><input type="text" data-key="name" id="name"></div>
        <div class="form-group"><label>Taille</label><select data-key="size" id="size"><option value="small">Petit</option><option value="medium">Moyen</option><option value="large">Grand</option></select></div>
        <div class="form-group checkbox-group"><input type="checkbox" data-key="show_position_text" id="show_position_text"><label for="show_position_text">Afficher texte position</label></div>
        <div class="form-group"><label>Orientation Fenêtre</label><select data-key="window_orientation" id="window_orientation"><option value="north">Nord</option><option value="east">Est</option><option value="south">Sud</option><option value="west">Ouest</option></select></div>
        <div class="form-group"><label>Type de Fenêtre</label><select data-key="window_type" id="window_type"><option value="single">Simple</option><option value="double">Double</option><option value="four-panes">4 Carreaux</option><option value="triple">Triple</option><option value="bay">Baie</option><option value="grid">Grille</option></select></div>
        <div class="form-group"><label>Largeur Fenêtre</label><select data-key="window_width" id="window_width"><option value="narrow">Étroite</option><option value="medium">Moyenne</option><option value="wide">Large</option><option value="extra-wide">Très Large</option></select></div>
        <div class="form-group"><label>Hauteur Fenêtre</label><select data-key="window_height" id="window_height"><option value="short">Basse</option><option value="medium">Moyenne</option><option value="tall">Haute</option><option value="extra-tall">Très Haute</option></select></div>
        <div class="form-group"><label>Style du Verre</label><select data-key="glass_style" id="glass_style"><option value="clear">Clair</option><option value="frosted">Dépoli</option><option value="tinted">Teinté</option><option value="reflective">Réfléchissant</option><option value="stained">Vitrail</option></select></div>
        <div class="form-group"><label>Couleur du Cadre</label><input type="color" class="color-input" data-key="window_frame_color" id="window_frame_color"></div>
        <div class="form-group"><label>Couleur du Store</label><input type="color" class="color-input" data-key="blind_color" id="blind_color"></div>
        <div class="form-group"><label>Couleur des Lattes</label><input type="color" class="color-input" data-key="blind_slat_color" id="blind_slat_color"></div>
      </div>
    `;
    this._bindAll();
  }

  _bindAll() {
    const defaults = {
        entity: this._config.entity, name: 'Store', size: 'medium', show_position_text: true, window_orientation: 'south',
        window_type: 'double', window_width: 'medium', window_height: 'medium', glass_style: 'clear',
        window_frame_color: '#333333', blind_color: '#d4d4d4', blind_slat_color: '#999999'
    };
    Object.keys(defaults).forEach(key => {
        const el = this.shadowRoot.querySelector(`[data-key="${key}"]`);
        if (el) {
            const prop = el.type === 'checkbox' ? 'checked' : 'value';
            el[prop] = this._config[key] !== undefined ? this._config[key] : defaults[key];
            el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', (e) => this._valueChanged(e));
        }
    });
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;
    const target = ev.target;
    const key = target.dataset.key;
    const value = target.type === 'checkbox' ? target.checked : target.value;
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
console.info('%c WINDOW-BLIND-CARD %c v3.0.0e ', 'color: white; background: #2196F3; font-weight: 700;', 'color: #2196F3; background: white; font-weight: 700;');