# 🪟 Window Blind Card pour Home Assistant

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/votre-username/window-blind-card.svg)](https://github.com/votre-username/window-blind-card/releases)

Une carte Lovelace élégante et animée pour visualiser et contrôler vos stores dans Home Assistant avec **personnalisation complète des fenêtres et vitrages**.

![Preview](https://via.placeholder.com/800x500?text=Window+Blind+Card+Preview)

## ✨ Fonctionnalités

- 🎨 **Animation fluide** - Le store monte et descend en temps réel
- 🪟 **6 types de fenêtres** - Simple, Double, 4 Carreaux, Triple, Baie vitrée, Grille
- 📏 **Dimensions personnalisables** - 4 largeurs et 4 hauteurs
- 🖼️ **Couleur de cadre** - Personnalisable
- 🎭 **5 styles de vitrage** - Clair, Dépoli, Teinté, Réfléchissant, Vitrail
- 🌈 **Couleurs personnalisables** - Choisissez la couleur de votre store
- 🎚️ **Contrôle intuitif** - Curseur et boutons pour un contrôle facile
- 📱 **Responsive** - S'adapte à toutes les tailles d'écran (Petit, Moyen, Grand)
- ⚙️ **Options d'affichage** - Masquez le texte de position pour un look minimaliste

## 🚀 Installation rapide

### Via HACS (recommandé)

1. Ouvrez HACS
2. Allez dans "Frontend" 
3. Cliquez sur "+" et recherchez "Window Blind Card"
4. Installez et redémarrez Home Assistant

### Manuel

Téléchargez `window-blind-card.js` et placez-le dans `/config/www/`

Ajoutez la ressource dans Configuration → Tableaux de bord → Ressources

## 📝 Configuration

### Interface Utilisateur (UI)

Vous pouvez configurer la carte facilement via l'éditeur visuel de Home Assistant.

![UI Editor](https://via.placeholder.com/600x400?text=UI+Editor+Screenshot)

### YAML

| Paramètre | Défaut | Options | Description |
|-----------|--------|---------|-------------|
| `entity` | *requis* | ID de votre `cover` | L'entité du store à contrôler. |
| `name` | "Store" | Texte libre | Le nom affiché en haut de la carte. |
| `size` | "medium" | `small`, `medium`, `large` | Ajuste la taille globale de la carte. |
| `show_position_text` | `true` | `true`, `false` | Affiche ou masque le texte "% ouvert". |
| `window_type` | "double" | `single`, `double`, `four-panes`, `triple`, `bay`, `grid` | Le style de la fenêtre. |
| `window_width` | "medium" | `narrow`, `medium`, `wide`, `extra-wide` | La largeur de la fenêtre. |
| `window_height` | "medium" | `short`, `medium`, `tall`, `extra-tall` | La hauteur de la fenêtre. |
| `glass_style` | "clear" | `clear`, `frosted`, `tinted`, `reflective`, `stained` | L'apparence du vitrage. |
| `window_frame_color` | "#333333" | Code couleur hex | La couleur du cadre de la fenêtre. |
| `blind_color` | "#d4d4d4" | Code couleur hex | La couleur principale du store. |
| `blind_slat_color` | "#999999" | Code couleur hex | La couleur des lignes des lattes. |

## 🖼️ Exemples de configuration

### 1. Configuration de base

Une carte de taille moyenne avec une fenêtre double standard.

```yaml
type: custom:window-blind-card
entity: cover.votre_store
name: Mon Store
```
![Exemple 1](https://via.placeholder.com/400x300?text=Exemple+de+base)
**Résultat :** Une carte simple et fonctionnelle, idéale pour un contrôle rapide.

### 2. Grande fenêtre de salon

Une grande baie vitrée pour un salon moderne, avec une taille de composant augmentée.

```yaml
type: custom:window-blind-card
entity: cover.salon
name: Store du Salon
size: large
window_type: bay
window_width: extra-wide
window_height: tall
window_frame_color: '#000000'
glass_style: clear
```
![Exemple 2](https://via.placeholder.com/400x300?text=Grande+fenêtre+de+salon)
**Résultat :** Une carte imposante qui simule une grande baie vitrée, parfaite pour un tableau de bord principal.

### 3. Petite fenêtre de salle de bain

Une petite fenêtre avec un vitrage dépoli pour plus d'intimité.

```yaml
type: custom:window-blind-card
entity: cover.salle_de_bain
name: Store SDB
size: small
window_type: single
window_width: narrow
window_height: short
glass_style: frosted
show_position_text: false
```
![Exemple 3](https://via.placeholder.com/400x300?text=Petite+fenêtre+de+salle+de+bain)
**Résultat :** Une carte compacte et discrète, avec le texte de position masqué pour un look minimaliste.

### 4. Fenêtre de bureau à 4 carreaux

Une fenêtre de taille moyenne avec 4 carreaux et un cadre en bois.

```yaml
type: custom:window-blind-card
entity: cover.bureau
name: Store Bureau
window_type: four-panes
window_width: medium
window_height: medium
window_frame_color: '#8B4513'
glass_style: tinted
```
![Exemple 4](https://via.placeholder.com/400x300?text=Fenêtre+de+bureau+à+4+carreaux)
**Résultat :** Une carte au style classique qui s'intègre bien dans un environnement de bureau.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une PR.

## 📜 Licence

MIT License

## ⭐ Support

Si vous aimez cette carte, n'hésitez pas à mettre une étoile ⭐ sur GitHub !

---

Made with ❤️ for the Home Assistant community