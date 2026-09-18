# Terminal

Jeu de tir Canvas dans un labyrinthe infini. Le tank avance dans un monde généré zone par zone, affronte des soldats et ne rencontre jamais de sortie.

- `TerminalGame.js` : composant React, chargement des images et contrôles clavier, souris et tactiles.
- `terminalEngine.js` : génération infinie, collisions, caméra, ennemis, projectiles et rendu.
- `terminalAssets.js` : imports et préchargement des sprites.
- `TerminalGame.css` : interface responsive limitée à `#222323` et `#f0f6f0`.
- `assets/` : copie locale de tous les sprites fournis.

Commandes : flèches ou ZQSD pour se déplacer, Espace ou clic pour tirer. Sur mobile, les commandes sont affichées sous le Canvas.

Chaque zone mesure 640 × 640 pixels. Les quatre ouvertures sont toujours alignées avec les zones voisines, ce qui garantit un monde continu. Les obstacles intérieurs restent courts pour conserver des couloirs larges.
