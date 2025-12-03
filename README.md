# 🪟 Window Blind Card pour Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/votre-username/window-blind-card.svg)](https://github.com/votre-username/window-blind-card/releases)

Une carte Lovelace élégante et animée pour visualiser et contrôler vos stores dans Home Assistant avec **personnalisation complète des fenêtres et vitrages**.

![Preview](https://via.placeholder.com/800x500?text=Window+Blind+Card+Preview)

## ✨ Fonctionnalités

- 🎨 **Animation fluide** - Le store monte et descend en temps réel
- 🪟 **5 types de fenêtres** - Simple, Double, Triple, Baie vitrée, Grille
- 📏 **Dimensions personnalisables** - 4 largeurs et 4 hauteurs
- 🖼️ **Couleur de cadre** - Noir, blanc, bois, PVC gris, personnalisé
- 🎭 **5 styles de vitrage** - Clair, Dépoli, Teinté, Réfléchissant, Vitrail
- 🌈 **Couleurs personnalisables** - Choisissez la couleur de votre store
- 🎚️ **Contrôle intuitif** - Curseur et boutons pour un contrôle facile
- 📱 **Responsive** - Fonctionne sur mobile, tablette et desktop

## 🚀 Installation rapide

### Via HACS (recommandé)

1. Ouvrez HACS
2. Allez dans "Frontend" 
3. Cliquez sur "+" et recherchez "Window Blind Card"
4. Installez et redémarrez Home Assistant

### Manuel

Téléchargez `window-blind-card.js` et placez-le dans `/config/www/`

Ajoutez la ressource dans Configuration → Tableaux de bord → Ressources

## 📝 Configuration rapide
```yaml
type: custom:window-blind-card
entity: cover.votre_store
name: Mon Store
window_type: bay              # single, double, triple, bay, grid
window_width: wide            # narrow, medium, wide, extra-wide
window_height: tall           # short, medium, tall, extra-tall
window_frame_color: '#8B4513' # Couleur cadre (noir, blanc, bois, etc.)
glass_style: frosted          # clear, frosted, tinted, reflective, stained
blind_color: '#2196F3'
blind_slat_color: '#1565C0'
```

## 🎯 Tous les paramètres

| Paramètre | Défaut | Options |
|-----------|--------|---------|
| `entity` | *requis* | ID de votre cover |
| `name` | "Store" | Texte libre |
| `window_type` | "double" | single, double, triple, bay, grid |
| `window_width` | "medium" | narrow, medium, wide, extra-wide |
| `window_height` | "medium" | short, medium, tall, extra-tall |
| `glass_style` | "clear" | clear, frosted, tinted, reflective, stained |
| `blind_color` | "#d4d4d4" | Code couleur hex |
| `blind_slat_color` | "#999999" | Code couleur hex |

## 🖼️ Exemples visuels

### Grande porte-fenêtre moderne
```yaml
type: custom:window-blind-card
entity: cover.salon
window_type: bay
window_width: extra-wide
window_height: tall
window_frame_color: '#000000'
glass_style: clear
```

### Petite fenêtre salle de bain
```yaml
type: custom:window-blind-card
entity: cover.sdb
window_type: double
window_width: narrow
window_height: short
window_frame_color: '#FFFFFF'
glass_style: frosted
```

### Fenêtre cathédrale bureau
```yaml
type: custom:window-blind-card
entity: cover.bureau
window_type: triple
window_width: wide
window_height: extra-tall
window_frame_color: '#8B4513'
glass_style: tinted
```

Voir [info.md](info.md) pour plus d'exemples et la documentation complète.

## 🎨 Inspiration couleurs

- **Blanc moderne** : `#FFFFFF` / `#E0E0E0`
- **Gris anthracite** : `#424242` / `#212121`
- **Bleu océan** : `#1976D2` / `#0D47A1`
- **Vert nature** : `#4CAF50` / `#2E7D32`
- **Beige chaleureux** : `#FFCC80` / `#FF9800`

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une PR.

## 📜 Licence

MIT License

## ⭐ Support

Si vous aimez cette carte, n'hésitez pas à mettre une étoile ⭐ sur GitHub !

---

Made with ❤️ for the Home Assistant community