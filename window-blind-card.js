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
      window_type: config.window_type || 'double', // single, double, triple, bay
      glass_style: config.glass_style || 'clear', // clear, frosted, tinted, reflective
      window_width: config.window_width || 'medium', // narrow, medium, wide, extra-wide
      window_height: config.window_height || 'medium', // short, medium, tall, extra-tall
      window_frame_color: config.window_frame_color || '#333333', // Couleur du cadre
      blind_color: config.blind_color || '#d4d4d4',
      blind_slat_color: config.blind_slat_color || '#999999',
      window_orientation: config.window_orientation || 'south', // north, south, east, west
      ...config
    };
    this.render();
    this.updateSunIcon();
    setInterval(() => this.updateSunIcon(), 60000);
  }

  set hass(hass) {
    this._hass = hass;
    const entity = hass.states[this.config.entity];
    if (entity) {
      this.updateBlind(entity);
    }
  }

  getComponentSize() {
    const size = this.config.size;
    const sizes = {
        small: {
            windowScale: 0.8,
            fontScale: 0.8,
            paddingScale: 0.8,
            gapScale: 0.8
        },
        medium: {
            windowScale: 1,
            fontScale: 1,
            paddingScale: 1,
            gapScale: 1
        },
        large: {
            windowScale: 1.2,
            fontScale: 1.2,
            paddingScale: 1.2,
            gapScale: 1.2
        }
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
      case 'single':
        return ''; // Pas de divisions

      case 'double':
        return `
          <div class="window-divider-v"></div>
        `;

      case 'triple':
        return `
          <div class="window-divider-v" style="left: 33.33%"></div>
          <div class="window-divider-v" style="left: 66.66%"></div>
        `;

      case 'bay':
        return `
          <div class="window-divider-v"></div>
          <div class="window-divider-h"></div>
        `;

      case 'grid':
        return `
          <div class="window-divider-v" style="left: 33.33%"></div>
          <div class="window-divider-v" style="left: 66.66%"></div>
          <div class="window-divider-h" style="top: 33.33%"></div>
          <div class="window-divider-h" style="top: 66.66%"></div>
        `;

      default:
        return `
          <div class="window-divider-v"></div>
          <div class="window-divider-h"></div>
        `;
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
    const style = this.config.glass_style;
    const opacities = {
      clear: '0.1',
      frosted: '0.3',
      tinted: '0.25',
      reflective: '0.15',
      stained: '0.2'
    };
    return opacities[style] || '0.1';
  }

  isSunlight() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
  }

  getOrientationIcon() {
    const orientation = this.config.window_orientation || 'south';
    const icons = {
      north: 'mdi:arrow-up',
      south: 'mdi:arrow-down',
      east: 'mdi:arrow-right',
      west: 'mdi:arrow-left'
    };
    return icons[orientation] || icons.south;
  }

  getOrientationLabel() {
    const orientation = this.config.window_orientation || 'south';
    const labels = {
      north: 'Nord',
      south: 'Sud',
      east: 'Est',
      west: 'Ouest'
    };
    return labels[orientation] || 'Sud';
  }

  updateSunIcon() {
    const sunIcon = this.shadowRoot.getElementById('sunIcon');
    if (sunIcon) {
      const haIcon = sunIcon.querySelector('ha-icon');
      if (haIcon) {
        if (this.isSunlight()) {
          haIcon.setAttribute('icon', 'mdi:weather-sunny');
          sunIcon.style.color = '#FFB300';
        } else {
          haIcon.setAttribute('icon', 'mdi:moon-waning-crescent');
          sunIcon.style.color = '#7986CB';
        }
      }
    }
  }

  getLightRaysRotation() {
    const orientation = this.config.window_orientation || 'south';
    const rotations = {
      north: 45,    // Soleil de côté nord-est
      south: 0,     // Soleil de face (horizontal)
      east: 45,     // Soleil de côté est
      west: -45     // Soleil de côté ouest
    };
    return rotations[orientation] || 0;
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
        :host {
          display: block;
          position: relative;
          z-index: 0;
        }

        .card {
          background: var(--ha-card-background, white);
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1));
          overflow: hidden;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: ${12 * gapScale}px;
          padding: ${16 * paddingScale}px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: ${12 * gapScale}px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: ${8 * gapScale}px;
        }

        .sun-icon {
          font-size: ${24 * fontScale}px;
          display: flex;
          align-items: center;
          color: #FFB300;
        }

        .sun-icon ha-icon {
          color: #FFB300 !important;
        }

        .orientation-badge {
          display: flex;
          align-items: center;
          gap: ${4 * gapScale}px;
          font-size: ${12 * fontScale}px;
          color: var(--secondary-text-color);
        }

        .orientation-badge ha-icon {
          color: var(--secondary-text-color) !important;
        }

        .header ha-icon {
          color: var(--primary-text-color);
        }

        .header h2 {
          margin: 0;
          font-size: ${20 * fontScale}px;
          color: var(--primary-text-color);
          font-weight: 500;
        }

        .window-container {
          padding: ${24 * paddingScale}px;
          background: #f5f5f5;
          display: flex;
          justify-content: center;
        }

        .window-frame {
          width: ${windowSize.width};
          height: ${windowSize.height};
          background: ${glassStyle};
          border: 6px solid ${frameColor};
          border-radius: 4px;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 2px 8px rgba(0,0,0,${glassOpacity});
        }

        .window-divider-v {
          position: absolute;
          left: 50%;
          top: 0;
          width: 3px;
          height: 100%;
          background: ${frameColor};
          transform: translateX(-50%);
          z-index: 5;
        }

        .window-divider-h {
          position: absolute;
          top: 50%;
          left: 0;
          width: 100%;
          height: 3px;
          background: ${frameColor};
          transform: translateY(-50%);
          z-index: 5;
        }

        .blind {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: repeating-linear-gradient(
            0deg,
            ${blindColor} 0px,
            ${blindColor} 14px,
            ${blindSlatColor} 14px,
            ${blindSlatColor} 16px
          );
          transition: height 0.5s ease;
          box-shadow: 0 3px 6px rgba(0,0,0,0.2);
          z-index: 10;
        }

        .light-rays {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            ${this.getLightRaysRotation()}deg,
            transparent 0px,
            transparent 13px,
            rgba(255, 255, 255, ${this.isSunlight() ? '0.15' : '0'}) 13px,
            rgba(255, 255, 255, ${this.isSunlight() ? '0.15' : '0'}) 14px,
            transparent 14px,
            transparent 16px
          );
          z-index: 11;
          pointer-events: none;
        }

        .controls {
          padding: ${16 * paddingScale}px;
        }

        .position-display {
          text-align: center;
          margin-bottom: ${12 * paddingScale}px;
        }

        .position-value {
          font-size: ${36 * fontScale}px;
          font-weight: 600;
          color: var(--primary-color);
        }

        .position-label {
          font-size: ${14 * fontScale}px;
          color: var(--secondary-text-color);
        }

        .slider-container {
          margin: ${16 * paddingScale}px 0;
        }

        .slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          -webkit-appearance: none;
          background: linear-gradient(to right, #2196F3 0%, #FF9800 50%, #4CAF50 100%);
          cursor: pointer;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid var(--primary-color);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 2px solid var(--primary-color);
        }

        .buttons {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: ${8 * gapScale}px;
          margin-top: ${16 * paddingScale}px;
        }

        .btn {
          padding: ${12 * paddingScale}px;
          border: none;
          border-radius: 8px;
          font-size: ${13 * fontScale}px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: ${4 * gapScale}px;
          transition: transform 0.2s, box-shadow 0.2s;
          color: white;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .btn:active {
          transform: translateY(0);
        }

        .btn-open {
          background: linear-gradient(135deg, #4CAF50, #45a049);
        }

        .btn-stop {
          background: linear-gradient(135deg, #FF9800, #f57c00);
        }

        .btn-close {
          background: linear-gradient(135deg, #2196F3, #1976d2);
        }

        .icon {
          font-size: ${20 * fontScale}px;
        }
      </style>

      <ha-card class="card">
        <div class="header">
          <div class="header-left">
            <ha-icon icon="mdi:window-shutter"></ha-icon>
            <h2>${name}</h2>
          </div>
          <div class="header-right">
            <div class="sun-icon" id="sunIcon">
              <ha-icon icon="mdi:weather-sunny"></ha-icon>
            </div>
            <div class="orientation-badge">
              <ha-icon icon="${this.getOrientationIcon()}"></ha-icon>
              <span>${this.getOrientationLabel()}</span>
            </div>
          </div>
        </div>

        <div class="window-container">
          <div class="window-frame">
            <div class="blind" id="blind">
              <div class="light-rays" id="lightRays"></div>
            </div>
            ${this.getWindowDividers()}
          </div>
        </div>

        <div class="controls">
          ${this.config.show_position_text ? `
          <div class="position-display">
            <div class="position-value" id="positionValue">0</div>
            <div class="position-label">% ouvert</div>
          </div>
          ` : ''}

          <div class="slider-container">
            <input type="range" min="0" max="100" value="0" class="slider" id="slider">
          </div>

          <div class="buttons">
            <button class="btn btn-open" id="btnOpen">
              <span class="icon">↑</span>
              <span>Ouvrir</span>
            </button>
            <button class="btn btn-stop" id="btnStop">
              <span class="icon">⏸</span>
              <span>Stop</span>
            </button>
            <button class="btn btn-close" id="btnClose">
              <span class="icon">↓</span>
              <span>Fermer</span>
            </button>
          </div>
        </div>
      </ha-card>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const slider = this.shadowRoot.getElementById('slider');
    const btnOpen = this.shadowRoot.getElementById('btnOpen');
    const btnStop = this.shadowRoot.getElementById('btnStop');
    const btnClose = this.shadowRoot.getElementById('btnClose');

    slider.addEventListener('change', (e) => {
      this.setPosition(parseInt(e.target.value));
    });

    slider.addEventListener('input', (e) => {
      this.updateVisual(parseInt(e.target.value));
    });

    btnOpen.addEventListener('click', () => {
      this.callService('open_cover');
    });

    btnStop.addEventListener('click', () => {
      this.callService('stop_cover');
    });

    btnClose.addEventListener('click', () => {
      this.callService('close_cover');
    });
  }

  updateBlind(entity) {
    const position = entity.attributes.current_position || 0;
    this.updateVisual(position);

    const slider = this.shadowRoot.getElementById('slider');
    if (slider) {
      slider.value = position;
    }
  }

  updateVisual(position) {
    const blind = this.shadowRoot.getElementById('blind');
    if (this.config.show_position_text) {
        const positionValue = this.shadowRoot.getElementById('positionValue');
        if (positionValue) {
            positionValue.textContent = position;
        }
    }
    if (blind) {
      blind.style.height = (100 - position) + '%';
    }
  }

  setPosition(position) {
    this._hass.callService('cover', 'set_cover_position', {
      entity_id: this.config.entity,
      position: position
    });
  }

  callService(service) {
    this._hass.callService('cover', service, {
      entity_id: this.config.entity
    });
  }

  getCardSize() {
    return 5;
  }

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
      glass_style: 'clear',
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
    if (!this._hass) {
      return;
    }

    const entities = Object.keys(this._hass.states).filter(eid => eid.startsWith('cover.'));

    this.shadowRoot.innerHTML = `
      <style>
        .form-group { display: flex; flex-direction: column; margin-bottom: 12px; }
        label { margin-bottom: 4px; font-weight: 500; color: var(--primary-text-color); }
        input, select {
          width: 100%;
          padding: 8px;
          box-sizing: border-box;
          border: 1px solid var(--divider-color);
          border-radius: 4px;
          background: var(--input-fill-color);
          color: var(--primary-text-color);
        }
        .color-input { padding: 2px; height: 38px; }
        .checkbox-group { display: flex; align-items: center; gap: 8px; }
      </style>
      <div class="card-config">
        <div class="form-group">
          <label for="entity">Entité (Entity)</label>
          <select data-key="entity" id="entity">
            ${entities.map(entity => `<option value="${entity}">${this._hass.states[entity].attributes.friendly_name || entity}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label for="name">Nom</label>
          <input type="text" data-key="name" id="name">
        </div>
        <div class="form-group">
            <label for="size">Taille du composant</label>
            <select data-key="size" id="size">
                <option value="small">Petit</option>
                <option value="medium">Moyen</option>
                <option value="large">Grand</option>
            </select>
        </div>
        <div class="form-group checkbox-group">
            <input type="checkbox" data-key="show_position_text" id="show_position_text">
            <label for="show_position_text">Afficher le texte de position</label>
        </div>
        <div class="form-group">
          <label for="window_orientation">Orientation de la fenêtre</label>
          <select data-key="window_orientation" id="window_orientation">
            <option value="north">Nord</option>
            <option value="south">Sud</option>
            <option value="east">Est</option>
            <option value="west">Ouest</option>
          </select>
        </div>
        <div class="form-group">
          <label for="window_type">Type de fenêtre</label>
          <select data-key="window_type" id="window_type">
            <option value="single">Simple</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="bay">Baie vitrée</option>
            <option value="grid">Grille</option>
          </select>
        </div>
        <div class="form-group">
          <label for="window_width">Largeur de la fenêtre</label>
          <select data-key="window_width" id="window_width">
            <option value="narrow">Étroite</option>
            <option value="medium">Moyenne</option>
            <option value="wide">Large</option>
            <option value="extra-wide">Très large</option>
          </select>
        </div>
        <div class="form-group">
          <label for="window_height">Hauteur de la fenêtre</label>
          <select data-key="window_height" id="window_height">
            <option value="short">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="tall">Haute</option>
            <option value="extra-tall">Très haute</option>
          </select>
        </div>
        <div class="form-group">
          <label for="glass_style">Style du verre</label>
          <select data-key="glass_style" id="glass_style">
            <option value="clear">Clair</option>
            <option value="frosted">Dépoli</option>
            <option value="tinted">Teinté</option>
            <option value="reflective">Réfléchissant</option>
            <option value="stained">Vitrail</option>
          </select>
        </div>
        <div class="form-group">
          <label for="window_frame_color">Couleur du cadre</label>
          <input type="color" class="color-input" data-key="window_frame_color" id="window_frame_color">
        </div>
        <div class="form-group">
          <label for="blind_color">Couleur du store</label>
          <input type="color" class="color-input" data-key="blind_color" id="blind_color">
        </div>
        <div class="form-group">
          <label for="blind_slat_color">Couleur des lattes</label>
          <input type="color" class="color-input" data-key="blind_slat_color" id="blind_slat_color">
        </div>
      </div>
    `;

    this._bind('entity', 'value', 'change');
    this._bind('name', 'value', 'input', this._config.entity);
    this._bind('size', 'value', 'change', 'medium');
    this._bind('show_position_text', 'checked', 'change', true);
    this._bind('window_orientation', 'value', 'change', 'south');
    this._bind('window_type', 'value', 'change', 'double');
    this._bind('window_width', 'value', 'change', 'medium');
    this._bind('window_height', 'value', 'change', 'medium');
    this._bind('glass_style', 'value', 'change', 'clear');
    this._bind('window_frame_color', 'value', 'input', '#333333');
    this._bind('blind_color', 'value', 'input', '#d4d4d4');
    this._bind('blind_slat_color', 'value', 'input', '#999999');
  }

  _bind(id, prop, event, defaultValue) {
      const element = this.shadowRoot.getElementById(id);
      if (element) {
          if (element.type === 'checkbox') {
              element[prop] = this._config[element.dataset.key] === undefined ? defaultValue : this._config[element.dataset.key];
          } else {
              element[prop] = this._config[element.dataset.key] === undefined ? defaultValue : this._config[element.dataset.key];
          }
          element.addEventListener(event, (e) => this._valueChanged(e));
      }
  }

  _valueChanged(ev) {
    if (!this._config || !this._hass) {
      return;
    }
    const target = ev.target;
    const key = target.dataset.key;
    const value = target.type === 'checkbox' ? target.checked : target.value;

    if (this._config[key] !== value) {
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
}

customElements.define('window-blind-card', WindowBlindCard);
customElements.define('window-blind-card-editor', WindowBlindCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'window-blind-card',
  name: 'Window Blind Card',
  description: 'Une carte élégante pour visualiser et contrôler vos stores avec types de fenêtres personnalisables',
  preview: true,
  documentationURL: 'https://github.com/saniho/window-blind-card'
});

console.info(
  '%c WINDOW-BLIND-CARD %c Version 2.0.0 ',
  'color: white; background: #2196F3; font-weight: 700;',
  'color: #2196F3; background: white; font-weight: 700;'
);