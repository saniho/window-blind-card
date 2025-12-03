// window-blind-card.js
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
      window_type: config.window_type || 'double', // single, double, triple, bay
      glass_style: config.glass_style || 'clear', // clear, frosted, tinted, reflective
      window_width: config.window_width || 'medium', // narrow, medium, wide, extra-wide
      window_height: config.window_height || 'medium', // short, medium, tall, extra-tall
      window_frame_color: config.window_frame_color || '#333333', // Couleur du cadre
      blind_color: config.blind_color || '#d4d4d4',
      blind_slat_color: config.blind_slat_color || '#999999',
      ...config
    };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    const entity = hass.states[this.config.entity];
    if (entity) {
      this.updateBlind(entity);
    }
  }

  getWindowSize() {
    const width = this.config.window_width;
    const height = this.config.window_height;

    const widths = {
      narrow: '160px',
      medium: '200px',
      wide: '260px',
      'extra-wide': '320px'
    };

    const heights = {
      short: '200px',
      medium: '280px',
      tall: '360px',
      'extra-tall': '440px'
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

  render() {
    const name = this.config.name;
    const glassStyle = this.getGlassStyle();
    const glassOpacity = this.getGlassOpacity();
    const blindColor = this.config.blind_color;
    const blindSlatColor = this.config.blind_slat_color;
    const windowSize = this.getWindowSize();
    const frameColor = this.config.window_frame_color;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .card {
          background: var(--ha-card-background, white);
          border-radius: var(--ha-card-border-radius, 12px);
          box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgba(0,0,0,0.1));
          overflow: hidden;
        }

        .header {
          padding: 16px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-bottom: 1px solid rgba(0,0,0,0.1);
        }

        .header h2 {
          margin: 0;
          font-size: 20px;
          color: var(--primary-text-color);
          font-weight: 500;
        }

        .config-info {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          font-size: 12px;
          color: var(--secondary-text-color);
          flex-wrap: wrap;
        }

        .config-badge {
          background: rgba(255,255,255,0.7);
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .window-container {
          padding: 24px;
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

        .controls {
          padding: 16px;
        }

        .position-display {
          text-align: center;
          margin-bottom: 12px;
        }

        .position-value {
          font-size: 36px;
          font-weight: 600;
          color: var(--primary-color);
        }

        .position-label {
          font-size: 14px;
          color: var(--secondary-text-color);
        }

        .slider-container {
          margin: 16px 0;
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
          gap: 8px;
          margin-top: 16px;
        }

        .btn {
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
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
          font-size: 20px;
        }
      </style>

      <ha-card class="card">
        <div class="header">
          <h2>🪟 ${name}</h2>
          <div class="config-info">
            <span class="config-badge">📐 ${this.getWindowTypeLabel()}</span>
            <span class="config-badge">📏 ${this.getWindowWidthLabel()}</span>
            <span class="config-badge">📊 ${this.getWindowHeightLabel()}</span>
            <span class="config-badge">🪟 ${this.getGlassStyleLabel()}</span>
          </div>
        </div>

        <div class="window-container">
          <div class="window-frame">
            <div class="blind" id="blind"></div>
            ${this.getWindowDividers()}
          </div>
        </div>

        <div class="controls">
          <div class="position-display">
            <div class="position-value" id="positionValue">0</div>
            <div class="position-label">% ouvert</div>
          </div>

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

  getWindowTypeLabel() {
    const labels = {
      single: 'Simple',
      double: 'Double',
      triple: 'Triple',
      bay: 'Baie vitrée',
      grid: 'Grille'
    };
    return labels[this.config.window_type] || 'Double';
  }

  getWindowWidthLabel() {
    const labels = {
      narrow: 'Étroite',
      medium: 'Moyenne',
      wide: 'Large',
      'extra-wide': 'Très large'
    };
    return labels[this.config.window_width] || 'Moyenne';
  }

  getWindowHeightLabel() {
    const labels = {
      short: 'Basse',
      medium: 'Moyenne',
      tall: 'Haute',
      'extra-tall': 'Très haute'
    };
    return labels[this.config.window_height] || 'Moyenne';
  }

  getGlassStyleLabel() {
    const labels = {
      clear: 'Clair',
      frosted: 'Dépoli',
      tinted: 'Teinté',
      reflective: 'Réfléchissant',
      stained: 'Vitrail'
    };
    return labels[this.config.glass_style] || 'Clair';
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
    const positionValue = this.shadowRoot.getElementById('positionValue');

    if (blind && positionValue) {
      blind.style.height = (100 - position) + '%';
      positionValue.textContent = position;
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
      window_type: 'double',
      window_width: 'medium',
      window_height: 'medium',
      window_frame_color: '#333333',
      glass_style: 'clear'
    };
  }
}

customElements.define('window-blind-card', WindowBlindCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'window-blind-card',
  name: 'Window Blind Card',
  description: 'Une carte élégante pour visualiser et contrôler vos stores avec types de fenêtres personnalisables',
  preview: true,
  documentationURL: 'https://github.com/votre-username/window-blind-card'
});

console.info(
  '%c WINDOW-BLIND-CARD %c Version 2.0.0 ',
  'color: white; background: #2196F3; font-weight: 700;',
  'color: #2196F3; background: white; font-weight: 700;'
);