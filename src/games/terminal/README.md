# Terminal

Mini-jeu Canvas du portfolio. Tout ce qui concerne le jeu reste dans ce dossier.

- `TerminalGame.js` : composant React, boucle de jeu et contrôles.
- `terminalEngine.js` : état, règles, collisions et dessin Canvas.
- `TerminalGame.css` : interface du terminal et adaptation mobile.

Le jeu utilise une surface logique de 960 × 540 px puis s'adapte à l'espace disponible. Le record est enregistré dans `localStorage` sous la clé `terminal-best`. Aucune API ni aucun serveur ne sont nécessaires.

Pour modifier rapidement le jeu :

- Changez les mots et erreurs dans `goodTokens` et `badTokens`.
- Ajustez la vitesse dans `updateTerminalGame`.
- Ajoutez les règles et collisions dans `terminalEngine.js`.
- Gardez les interactions React et l'accessibilité dans `TerminalGame.js`.
