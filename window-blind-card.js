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
  }

  set hass(hass) {
    const isFirstUpdate = !this._hass;
    this._hass = hass;

    // Vérifier que config existe avant d'accéder à l'entité
    if (this.config && this.config.entity && hass && hass.states) {
      const entity = hass.states[this.config.entity];
      if (entity) {
        this.updateBlind(entity);
      }
    }

    if (isFirstUpdate) {
      this.startSunTracking();
    }
  }

  connectedCallback() {
    // Defer starting sun tracking until hass is set
  }

  disconnectedCallback() {
    if (this.sunInterval) {
      clearInterval(this.sunInterval);
    }
  }

  startSunTracking() {
    this.updateSunEffects(); // Initial call
    this.sunInterval = setInterval(() => this.updateSunEffects(), 60000);
  }

  isSunlit() {
    if (!this._hass) return false;
    const hour = new Date().getHours();
    const { window_orientation } = this.config;
    if (hour < 6 || hour >= 18) return false;
    if (window_orientation === 'east' && hour >= 12) return false;
    if (window_orientation === 'west' && hour < 12) return false;
    if (window_orientation === 'north') return false;
    return true;
  }

  updateSunEffects() {
    if (!this._hass) return;

    const sunIcon = this.shadowRoot.getElementById('sunIcon');
    if (sunIcon) {
      const sunlit = this.isSunlit();
      const icon = sunlit ? 'mdi:weather-sunny' : 'mdi:weather-night';
      const color = sunlit ? '#FFB300' : '#7986CB';
      sunIcon.innerHTML = `<ha-icon icon="${icon}" style="color: ${color};"></ha-icon>`;
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
    const widths = { narrow: 160, medium: 200, wide: 260, 'extra-wide': 320 };
    const heights = { short: 200, medium: 280, tall: 360, 'extra-tall': 440 };
    return {
      width: (widths[width] || widths.medium) * windowScale + 'px',
      height: (heights[height] || heights.medium) * windowScale + 'px'
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
    const styles = {
      clear: 'linear-gradient(135deg, #e8f4f8 0%, #d4e9f2 100%)',
      frosted: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
      tinted: 'linear-gradient(135deg, #d4e4f0 0%, #b8d4e8 100%)',
      reflective: 'linear-gradient(135deg, #e8f0f8 0%, #c8dce8 100%)',
      stained: 'linear-gradient(135deg, #ffd4a8 0%, #ffb4a0 50%, #d4e8ff 100%)'
    };
    return styles[this.config.glass_style] || styles.clear;
  }

  render() {
    const { name } = this.config;
    const { fontScale, paddingScale, gapScale } = this.getComponentSize();
    const windowSize = this.getWindowSize();
    const glassStyle = this.getGlassStyle();
    const glassOpacity = { clear: '0.1', frosted: '0.3', tinted: '0.25', reflective: '0.15', stained: '0.2' }[this.config.glass_style] || '0.1';
    const frameColor = this.config.window_frame_color;
    const blindColor = this.config.blind_color;
    const blindSlatColor = this.config.blind_slat_color;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; position: relative; z-index: 0; }
        .card { background: var(--ha-card-background, white); border-radius: var(--ha-card-border-radius, 12px); box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1)); overflow: hidden; }
        .header { display: flex; align-items: center; justify-content: space-between; gap: ${12 * gapScale}px; padding: ${16 * paddingScale}px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); border-bottom: 1px solid rgba(0,0,0,0.1); }
        .header-left { display: flex; align-items: center; gap: ${12 * gapScale}px; }
        .header ha-icon { color: var(--primary-text-color); }
        .header h2 { margin: 0; font-size: ${20 * fontScale}px; color: var(--primary-text-color); font-weight: 500; }
        .sun-icon { font-size: ${24 * fontScale}px; }
        .window-container { padding: ${24 * paddingScale}px; background: #f5f5f5; display: flex; justify-content: center; }
        .window-frame { width: ${windowSize.width}; height: ${windowSize.height}; background: ${glassStyle}; border: 6px solid ${frameColor}; border-radius: 4px; position: relative; overflow: hidden; box-shadow: inset 0 2px 8px rgba(0,0,0,${glassOpacity}); }
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
          <div class="sun-icon" id="sunIcon"></div>
        </div>
        <div class="window-container">
          <div class="window-frame">
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
    if (!entity || !entity.attributes) return;

    const position = entity.attributes.current_position || 0;
    this.updateVisual(position);

    const slider = this.shadowRoot.getElementById('slider');
    if (slider) {
      slider.value = position;
    }
  }

  updateVisual(position) {
    const blind = this.shadowRoot.getElementById('blind');
    if (blind) {
      blind.style.height = (100 - position) + '%';
    }

    if (this.config && this.config.show_position_text) {
      const positionValue = this.shadowRoot.getElementById('positionValue');
      if (positionValue) {
        positionValue.textContent = position;
      }
    }
  }

  setPosition(position) {
    if (this._hass && this.config && this.config.entity) {
      this._hass.callService('cover', 'set_cover_position', {
        entity_id: this.config.entity,
        position: position
      });
    }
  }

  callService(service) {
    if (this._hass && this.config && this.config.entity) {
      this._hass.callService('cover', service, {
        entity_id: this.config.entity
      });
    }
  }
  getCardSize() { return 5; }
  static getConfigElement() { return document.createElement('window-blind-card-editor'); }
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
      glass_style: 'clear',
      blind_color: '#d4d4d4',
      blind_slat_color: '#999999',
      window_orientation: 'south'
    };
  }
}

// Définir la carte AVANT l'éditeur
customElements.define('window-blind-card', WindowBlindCard);

// ===== ÉDITEUR =====
class WindowBlindCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = undefined;
  }

  set hass(hass) {
    this._hass = hass;
    if (hass) {
      this.render();
    }
  }

  setConfig(config) {
    this._config = { ...config };
    if (this._hass) {
      this.render();
    }
  }

  render() {
    if (!this._hass) {
      this.shadowRoot.innerHTML = '<div style="padding: 20px;">Chargement...</div>';
      return;
    }

    const entities = Object.keys(this._hass.states || {}).filter(eid => eid.startsWith('cover.'));

    const defaults = {
      entity: 'cover.store',
      name: 'Store',
      size: 'medium',
      show_position_text: true,
      window_type: 'double',
      window_width: 'medium',
      window_height: 'medium',
      window_frame_color: '#333333',
      glass_style: 'clear',
      blind_color: '#d4d4d4',
      blind_slat_color: '#999999',
      window_orientation: 'south'
    };

    this.shadowRoot.innerHTML = `
      <style>
        .form-group { display: flex; flex-direction: column; margin-bottom: 12px; }
        .checkbox-group { flex-direction: row; align-items: center; }
        label { margin-bottom: 4px; font-weight: 500; }
        input, select { width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid var(--divider-color); border-radius: 4px; }
      </style>
      <div class="card-config">
        <div class="form-group">
          <label>Entité</label>
          <select data-key="entity">
            <option value="">-- Sélectionnez --</option>
            ${entities.map(e => {
              const state = this._hass.states[e];
              const name = state?.attributes?.friendly_name || e;
              const selected = this._config.entity === e ? 'selected' : '';
              return `<option value="${e}" ${selected}>${name}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Nom</label>
          <input type="text" data-key="name" value="${this._config.name || defaults.name}">
        </div>
        <div class="form-group">
          <label>Taille</label>
          <select data-key="size">
            <option value="small" ${this._config.size === 'small' ? 'selected' : ''}>Petit</option>
            <option value="medium" ${!this._config.size || this._config.size === 'medium' ? 'selected' : ''}>Moyen</option>
            <option value="large" ${this._config.size === 'large' ? 'selected' : ''}>Grand</option>
          </select>
        </div>
        <div class="form-group checkbox-group">
          <input type="checkbox" data-key="show_position_text" ${this._config.show_position_text !== false ? 'checked' : ''}>
          <label>Afficher texte position</label>
        </div>
        <div class="form-group">
          <label>Orientation Fenêtre</label>
          <select data-key="window_orientation">
            <option value="north" ${this._config.window_orientation === 'north' ? 'selected' : ''}>Nord</option>
            <option value="east" ${this._config.window_orientation === 'east' ? 'selected' : ''}>Est</option>
            <option value="south" ${!this._config.window_orientation || this._config.window_orientation === 'south' ? 'selected' : ''}>Sud</option>
            <option value="west" ${this._config.window_orientation === 'west' ? 'selected' : ''}>Ouest</option>
          </select>
        </div>
        <div class="form-group">
          <label>Type de Fenêtre</label>
          <select data-key="window_type">
            <option value="single" ${this._config.window_type === 'single' ? 'selected' : ''}>Simple</option>
            <option value="double" ${!this._config.window_type || this._config.window_type === 'double' ? 'selected' : ''}>Double</option>
            <option value="four-panes" ${this._config.window_type === 'four-panes' ? 'selected' : ''}>4 Carreaux</option>
            <option value="triple" ${this._config.window_type === 'triple' ? 'selected' : ''}>Triple</option>
            <option value="bay" ${this._config.window_type === 'bay' ? 'selected' : ''}>Baie</option>
            <option value="grid" ${this._config.window_type === 'grid' ? 'selected' : ''}>Grille</option>
          </select>
        </div>
        <div class="form-group">
          <label>Largeur Fenêtre</label>
          <select data-key="window_width">
            <option value="narrow" ${this._config.window_width === 'narrow' ? 'selected' : ''}>Étroite</option>
            <option value="medium" ${!this._config.window_width || this._config.window_width === 'medium' ? 'selected' : ''}>Moyenne</option>
            <option value="wide" ${this._config.window_width === 'wide' ? 'selected' : ''}>Large</option>
            <option value="extra-wide" ${this._config.window_width === 'extra-wide' ? 'selected' : ''}>Très Large</option>
          </select>
        </div>
        <div class="form-group">
          <label>Hauteur Fenêtre</label>
          <select data-key="window_height">
            <option value="short" ${this._config.window_height === 'short' ? 'selected' : ''}>Basse</option>
            <option value="medium" ${!this._config.window_height || this._config.window_height === 'medium' ? 'selected' : ''}>Moyenne</option>
            <option value="tall" ${this._config.window_height === 'tall' ? 'selected' : ''}>Haute</option>
            <option value="extra-tall" ${this._config.window_height === 'extra-tall' ? 'selected' : ''}>Très Haute</option>
          </select>
        </div>
        <div class="form-group">
          <label>Style du Verre</label>
          <select data-key="glass_style">
            <option value="clear" ${!this._config.glass_style || this._config.glass_style === 'clear' ? 'selected' : ''}>Clair</option>
            <option value="frosted" ${this._config.glass_style === 'frosted' ? 'selected' : ''}>Dépoli</option>
            <option value="tinted" ${this._config.glass_style === 'tinted' ? 'selected' : ''}>Teinté</option>
            <option value="reflective" ${this._config.glass_style === 'reflective' ? 'selected' : ''}>Réfléchissant</option>
            <option value="stained" ${this._config.glass_style === 'stained' ? 'selected' : ''}>Vitrail</option>
          </select>
        </div>
        <div class="form-group">
          <label>Couleur du Cadre</label>
          <input type="color" data-key="window_frame_color" value="${this._config.window_frame_color || defaults.window_frame_color}">
        </div>
        <div class="form-group">
          <label>Couleur du Store</label>
          <input type="color" data-key="blind_color" value="${this._config.blind_color || defaults.blind_color}">
        </div>
        <div class="form-group">
          <label>Couleur des Lattes</label>
          <input type="color" data-key="blind_slat_color" value="${this._config.blind_slat_color || defaults.blind_slat_color}">
        </div>
      </div>
    `;

    this._addEventListeners();
  }

  _addEventListeners() {
    this.shadowRoot.querySelectorAll('[data-key]').forEach(el => {
      el.addEventListener('change', (e) => this._valueChanged(e));
      if (el.type !== 'checkbox' && el.type !== 'color') {
        el.addEventListener('input', (e) => this._valueChanged(e));
      }
    });
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) return;

    const target = ev.target;
    const key = target.dataset.key;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    if (this._config[key] !== value) {
      const newConfig = { ...this._config, [key]: value };
      this.dispatchEvent(new CustomEvent("config-changed", {
        bubbles: true,
        composed: true,
        detail: { config: newConfig }
      }));
    }
  }
}

customElements.define('window-blind-card-editor', WindowBlindCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'window-blind-card',
  name: 'Window Blind Card',
  description: 'Une carte pour contrôler vos stores avec des effets visuels.',
  preview: true,
  documentationURL: 'https://github.com/saniho/window-blind-card'
});

console.info('%c WINDOW-BLIND-CARD %c v3.0.0f ', 'color: white; background: #2196F3; font-weight: 700;', 'color: #2196F3; background: white; font-weight: 700;');