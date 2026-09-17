# Fonds créés dans Figma

1. Créer un frame de 1920 × 1080 px par section.
2. Garder les éléments importants loin des bords et éviter d'intégrer du texte dans l'image.
3. Exporter en SVG pour les formes vectorielles, ou en WebP à 80 % pour une image complexe.
4. Placer le fichier exporté dans ce dossier.
5. Ajouter le nom du thème et le chemin du fichier dans la liste `artworks` de `src/components/InteractiveBackground.js`.
6. Dans `src/components/InteractiveBackground.css`, ajouter la règle d'affichage du thème.

Exemple :

```js
{ theme: "projects", src: "/ressources/backgrounds/projets.svg" }
```

```css
body[data-theme="projects"] .ambient-art--projects { opacity: 0.48; }
```

Les thèmes disponibles sont `hero`, `about`, `skills`, `experiences`, `projects` et `contact`. Les halos de couleur, leur transition et l'effet de souris restent animés au-dessus de l'illustration.
