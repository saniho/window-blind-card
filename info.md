# Window Blind Card

Une carte élégante et animée pour visualiser et contrôler vos stores dans Home Assistant avec personnalisation complète des fenêtres.

## ✨ Fonctionnalités

- 🎨 Animation fluide du store en temps réel
- 🪟 **5 types de fenêtres** : Simple, Double, Triple, Baie vitrée, Grille
- 📏 **4 largeurs et 4 hauteurs** : Personnalisez les dimensions
- 🎨 **Couleur de cadre personnalisable** : Noir, blanc, bois, etc.
- 🎭 **5 styles de vitrage** : Clair, Dépoli, Teinté, Réfléchissant, Vitrail
- 🌈 **Couleurs personnalisables** pour le store
- 🎚️ Curseur de position intuitif
- 🔘 Boutons de contrôle rapides (Ouvrir/Stop/Fermer)
- 📱 Compatible mobile et desktop

## 🚀 Installation

### Via HACS (recommandé)

1. Ouvrez HACS dans Home Assistant
2. Allez dans "Frontend"
3. Cliquez sur "+" en bas à droite
4. Recherchez "Window Blind Card"
5. Cliquez sur "Installer"
6. Redémarrez Home Assistant

### Installation manuelle

1. Téléchargez `window-blind-card.js`
2. Copiez-le dans `/config/www/`
3. Ajoutez la ressource dans Configuration → Tableaux de bord → Ressources :
   - URL : `/local/window-blind-card.js`
   - Type : Module JavaScript

## 📝 Configuration

### Configuration minimale
```yaml
type: custom:window-blind-card
entity: cover.store_salon
```

### Configuration complète
```yaml
type: custom:window-blind-card
entity: cover.store_salon
name: Store du Salon
window_type: bay              # Type de fenêtre
window_width: wide            # Largeur de fenêtre
window_height: tall           # Hauteur de fenêtre
window_frame_color: '#8B4513' # Couleur du cadre (bois)
glass_style: frosted          # Style de vitrage
blind_color: '#2196F3'        # Couleur du store
blind_slat_color: '#1565C0'   # Couleur des lamelles
```

## 🎯 Paramètres

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `entity` | string | **requis** | ID de l'entité cover |
| `name` | string | "Store" | Nom personnalisé |
| `window_type` | string | "double" | Type de fenêtre (voir ci-dessous) |
| `window_width` | string | "medium" | Largeur de fenêtre (voir ci-dessous) |
| `window_height` | string | "medium" | Hauteur de fenêtre (voir ci-dessous) |
| `window_frame_color` | string | "#333333" | Couleur du cadre de fenêtre (hex) |
| `glass_style` | string | "clear" | Style du vitrage (voir ci-dessous) |
| `blind_color` | string | "#d4d4d4" | Couleur principale du store |
| `blind_slat_color` | string | "#999999" | Couleur des lamelles |

### Types de fenêtres (`window_type`)

- `single` - Fenêtre simple sans divisions
- `double` - Fenêtre à 2 battants (division verticale)
- `triple` - Fenêtre à 3 battants (2 divisions verticales)
- `bay` - Baie vitrée (divisions verticale + horizontale)
- `grid` - Fenêtre à grille (multiple divisions)

### Largeurs de fenêtre (`window_width`)

- `narrow` - Étroite (160px) - Fenêtre de salle de bain
- `medium` - Moyenne (200px) - Fenêtre standard
- `wide` - Large (260px) - Grande fenêtre
- `extra-wide` - Très large (320px) - Baie vitrée

### Hauteurs de fenêtre (`window_height`)

- `short` - Basse (200px) - Fenêtre sous-pente, lucarne
- `medium` - Moyenne (280px) - Fenêtre standard
- `tall` - Haute (360px) - Porte-fenêtre
- `extra-tall` - Très haute (440px) - Fenêtre cathédrale

### Styles de vitrage (`glass_style`)

- `clear` - Vitrage clair et transparent
- `frosted` - Vitrage dépoli/opaque
- `tinted` - Vitrage teinté bleuté
- `reflective` - Vitrage réfléchissant
- `stained` - Effet vitrail coloré

## 💡 Exemples

### Fenêtre moderne cadre noir
```yaml
type: custom:window-blind-card
entity: cover.living_room_blind
name: Salon
window_type: bay
window_width: extra-wide
window_height: tall
window_frame_color: '#000000'
glass_style: clear
```

### Fenêtre bois chaleureux
```yaml
type: custom:window-blind-card
entity: cover.bedroom_blind
name: Chambre
window_type: double
window_width: medium
window_height: medium
window_frame_color: '#8B4513'
glass_style: frosted
```

### Fenêtre blanche classique
```yaml
type: custom:window-blind-card
entity: cover.bathroom_blind
name: Salle de bain
window_type: single
window_width: narrow
window_height: short
window_frame_color: '#FFFFFF'
glass_style: frosted
```

### Fenêtre PVC gris
```yaml
type: custom:window-blind-card
entity: cover.office_blind
name: Bureau
window_type: triple
window_width: wide
window_height: extra-tall
window_frame_color: '#808080'
glass_style: tinted
```

### Store rouge avec vitrail
```yaml
type: custom:blind-card
entity: cover.bathroom_blind
name: Salle de bain
window_type: double
glass_style: stained
blind_color: '#D32F2F'
blind_slat_color: '#B71C1C'
```

### Plusieurs stores dans une grille
```yaml
type: horizontal-stack
cards:
  - type: custom:blind-card
    entity: cover.living_blind
    name: Salon
    window_type: bay
    glass_style: clear
    
  - type: custom:blind-card
    entity: cover.bedroom_blind
    name: Chambre
    window_type: double
    glass_style: frosted
    
  - type: custom:blind-card
    entity: cover.kitchen_blind
    name: Cuisine
    window_type: single
    glass_style: clear
```

### Store vert extérieur
```yaml
type: custom:blind-card
entity: cover.terrace_blind
name: Terrasse
window_type: bay
glass_style: reflective
blind_color: '#4CAF50'
blind_slat_color: '#2E7D32'
```

## 🎨 Galerie de styles

### Style moderne minimaliste
```yaml
type: custom:blind-card
entity: cover.store
window_type: single
glass_style: clear
blind_color: '#FFFFFF'
blind_slat_color: '#E0E0E0'
```

### Style industriel
```yaml
type: custom:blind-card
entity: cover.store
window_type: grid
glass_style: clear
blind_color: '#424242'
blind_slat_color: '#212121'
```

### Style chaleureux
```yaml
type: custom:blind-card
entity: cover.store
window_type: double
glass_style: tinted
blind_color: '#FFCC80'
blind_slat_color: '#FF9800'
```

## 🐛 Rapport de bugs

Si vous rencontrez un problème, veuillez ouvrir une issue sur GitHub avec :
- Version de Home Assistant
- Configuration complète de la carte
- Type de fenêtre et style de vitrage utilisés
- Message d'erreur (si applicable)