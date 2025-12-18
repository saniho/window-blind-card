class WindowBlindCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  set hass(hass) {
    this._hass = hass;
    // Toujours rendre quand hass change
    this.render();
  }

  setConfig(config) {
    this._config = { ...config };
    // Ne rendre que si on a déjà hass
    if (this._hass) {
      this.render();
    }
  }

  render() {
    // Vérification stricte de hass
    if (!this._hass || !this._hass.states || typeof this._hass.states !== 'object') {
      this.shadowRoot.innerHTML = `
        <div style="padding: 16px; text-align: center;">
          <p>Chargement de la configuration...</p>
        </div>
      `;
      return;
    }

    // Récupérer les entités cover en toute sécurité
    let entities = [];
    try {
      entities = Object.keys(this._hass.states).filter(eid => eid.startsWith('cover.'));
      if (entities.length === 0) {
        this.shadowRoot.innerHTML = `
          <div style="padding: 16px; color: orange;">
            <p>Aucune entité "cover" trouvée dans votre système.</p>
          </div>
        `;
        return;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des entités:', error);
      this.shadowRoot.innerHTML = `
        <div style="padding: 16px; color: red;">
          <p>Erreur lors du chargement des entités</p>
        </div>
      `;
      return;
    }

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
            <option value="">-- Sélectionnez une entité --</option>
            ${entities.map(e => {
              const state = this._hass.states[e];
              const name = (state && state.attributes && state.attributes.friendly_name) || e;
              return `<option value="${e}">${name}</option>`;
            }).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Nom</label>
          <input type="text" data-key="name">
        </div>
        <div class="form-group">
          <label>Taille</label>
          <select data-key="size">
            <option value="small">Petit</option>
            <option value="medium">Moyen</option>
            <option value="large">Grand</option>
          </select>
        </div>
        <div class="form-group checkbox-group">
          <input type="checkbox" data-key="show_position_text">
          <label>Afficher texte position</label>
        </div>
        <div class="form-group">
          <label>Orientation Fenêtre</label>
          <select data-key="window_orientation">
            <option value="north">Nord</option>
            <option value="east">Est</option>
            <option value="south">Sud</option>
            <option value="west">Ouest</option>
          </select>
        </div>
        <div class="form-group">
          <label>Type de Fenêtre</label>
          <select data-key="window_type">
            <option value="single">Simple</option>
            <option value="double">Double</option>
            <option value="four-panes">4 Carreaux</option>
            <option value="triple">Triple</option>
            <option value="bay">Baie</option>
            <option value="grid">Grille</option>
          </select>
        </div>
        <div class="form-group">
          <label>Largeur Fenêtre</label>
          <select data-key="window_width">
            <option value="narrow">Étroite</option>
            <option value="medium">Moyenne</option>
            <option value="wide">Large</option>
            <option value="extra-wide">Très Large</option>
          </select>
        </div>
        <div class="form-group">
          <label>Hauteur Fenêtre</label>
          <select data-key="window_height">
            <option value="short">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="tall">Haute</option>
            <option value="extra-tall">Très Haute</option>
          </select>
        </div>
        <div class="form-group">
          <label>Style du Verre</label>
          <select data-key="glass_style">
            <option value="clear">Clair</option>
            <option value="frosted">Dépoli</option>
            <option value="tinted">Teinté</option>
            <option value="reflective">Réfléchissant</option>
            <option value="stained">Vitrail</option>
          </select>
        </div>
        <div class="form-group">
          <label>Couleur du Cadre</label>
          <input type="color" data-key="window_frame_color">
        </div>
        <div class="form-group">
          <label>Couleur du Store</label>
          <input type="color" data-key="blind_color">
        </div>
        <div class="form-group">
          <label>Couleur des Lattes</label>
          <input type="color" data-key="blind_slat_color">
        </div>
      </div>
    `;
    this._bindValues();
    this._addEventListeners();
  }

  _bindValues() {
    if (!this.shadowRoot) return;

    const defaults = WindowBlindCard.getStubConfig();
    const elements = this.shadowRoot.querySelectorAll('[data-key]');

    elements.forEach(el => {
      const key = el.dataset.key;
      const prop = el.type === 'checkbox' ? 'checked' : 'value';

      // Utiliser la valeur de config, sinon la valeur par défaut
      if (this._config[key] !== undefined) {
        el[prop] = this._config[key];
      } else if (defaults[key] !== undefined) {
        el[prop] = defaults[key];
      }
    });
  }

  _addEventListeners() {
    this.shadowRoot.querySelectorAll('[data-key]').forEach(el => {
      el.addEventListener('change', (e) => this._valueChanged(e));
      if (el.type !== 'checkbox') {
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
      this.dispatchEvent(new CustomEvent("config-changed", { bubbles: true, composed: true, detail: { config: newConfig } }));
    }
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