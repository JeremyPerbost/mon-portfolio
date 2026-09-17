# Terminal

Jeu de labyrinthe Canvas autonome. Le joueur contrôle un pixel clair et doit atteindre la sortie du labyrinthe avant la fin des deux minutes.

- `TerminalGame.js` : composant React, boucle de jeu, chronomètre et contrôles clavier/tactiles.
- `terminalEngine.js` : génération du labyrinthe, collisions, caméra et dessin Canvas.
- `TerminalGame.css` : interface responsive limitée aux couleurs `#222323` et `#f0f6f0`.

Le labyrinthe mesure 61 × 61 cases et est recréé à chaque partie. Sa sortie correspond au point accessible le plus éloigné du départ. Aucune API ni aucun serveur ne sont nécessaires.

- Changez `MAZE_SIZE` pour ajuster la taille du labyrinthe. La valeur doit rester impaire.
- Changez `TIME_LIMIT` pour modifier le temps disponible.
- Modifiez `tile` dans `drawTerminalGame` pour régler le niveau de zoom.
- Ajoutez les règles de déplacement et de collision dans `updateTerminalGame`.
