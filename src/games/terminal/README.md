# Terminal

Jeu de tir Canvas dans une arène ouverte infinie. Le tank avance dans un monde sans murs et affronte des soldats seuls ou organisés en formations.

- `TerminalGame.js` : composant React, chargement des images et contrôles clavier, souris et tactiles.
- `terminalEngine.js` : génération infinie, caméra, patrouilles, ennemis, projectiles et rendu.
- `terminalAssets.js` : imports et préchargement des sprites utilisés.
- `TerminalGame.css` : interface responsive limitée à `#222323` et `#f0f6f0`.
- `assets/` : copie locale de tous les sprites fournis.

Commandes : flèches ou ZQSD pour se déplacer, Espace ou clic pour tirer. Sur mobile, les commandes sont affichées sous le Canvas.

Chaque zone peut générer des soldats indépendants ou une rangée de cinq soldats qui patrouille en formation sur un axe. Le tank et les soldats se déplacent uniquement horizontalement ou verticalement. Un soldat est éliminé si le tank lui roule dessus. Le Canvas conserve toujours son ratio 16:9 et l’animation de tir garde la même taille que le tank au repos.
