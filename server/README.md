# Connecter l’écoute Spotify

Le widget affiche la pochette, le titre, l’artiste et un lien Spotify pendant une écoute. Il est masqué en pause, sans configuration ou si Spotify est indisponible. Il se met à jour toutes les 30 secondes tant que l’onglet est visible. Aucun contrôle de lecture n’est demandé.

## Première connexion (compte Premium)

1. Créer une application dans le [tableau de bord Spotify](https://developer.spotify.com/dashboard), avec Web API et la redirection exacte `http://127.0.0.1:8888/callback`.
2. Copier `server/.env.example` vers `server/.env`. Renseigner le Client ID et le Client Secret **dans ce fichier local**, jamais dans le chat, dans `public/` ou dans une variable `REACT_APP_*`. Les fichiers `.env` sont exclus de Git.
3. Depuis la racine du projet, avec Node 20.12 ou supérieur :

   ```sh
   node --env-file=server/.env server/authorize.mjs
   ```

4. Ouvrir le lien affiché et accepter la permission de consulter le morceau en cours. L’outil local enregistre automatiquement le jeton de renouvellement dans `server/.env`, puis s’arrête. Il n’affiche jamais le jeton. En cas de refus ou d’expiration après 10 minutes, relancer la commande.
5. Lancer le service :

   ```sh
   node --env-file=server/.env server/spotify.mjs
   ```

6. Copier le `.env.example` à la racine vers `.env.local` et redémarrer le site. Seule l’URL publique du service y figure.

## Mise en ligne permanente : Cloudflare Worker

Le fichier `spotify-worker.mjs` est la version conçue pour la production. Il fonctionne sur l'infrastructure Cloudflare même quand l'ordinateur personnel est éteint. GitHub Pages continue d'héberger le portfolio et OVH continue de gérer le domaine.

Créer un compte Cloudflare, puis se connecter avec Wrangler :

```sh
npx wrangler login
```

Le fichier `wrangler.toml` est déjà configuré pour le Worker `jeremy-spotify-now-playing`. Ajouter ensuite les trois **Secrets** : `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` et `SPOTIFY_REFRESH_TOKEN`.

Exécuter depuis `server/` :

```sh
npx wrangler secret put SPOTIFY_CLIENT_ID
npx wrangler secret put SPOTIFY_CLIENT_SECRET
npx wrangler secret put SPOTIFY_REFRESH_TOKEN
npx wrangler deploy
```

Après le déploiement, tester `https://<worker>.workers.dev/now-playing`, puis définir à la racine du portfolio :

```text
REACT_APP_SPOTIFY_ENDPOINT=https://<worker>.workers.dev/now-playing
```

Relancer ensuite la compilation et le déploiement du portfolio.

## Autre hébergement Node

GitHub Pages héberge le site statique, pas ce service Node. Héberger `server/spotify.mjs` sur un service compatible Node avec HTTPS, configurer les trois variables `SPOTIFY_*` dans son stockage de secrets, `HOST=0.0.0.0`, son `PORT` et `ALLOWED_ORIGINS=https://jeremyperbost.fr`. Ne pas publier le script d’autorisation comme un service public.

Définir `REACT_APP_SPOTIFY_ENDPOINT=https://<adresse-du-service>/now-playing` lors de la compilation du portfolio. Ne jamais utiliser une URL localhost en production. Les visiteurs n’ont pas besoin de se connecter : ils voient l’écoute du propriétaire autorisé. L’endpoint est destiné à rendre publiques ces seules informations ; CORS ne constitue pas un contrôle d’accès.

Les requêtes simultanées sont regroupées, le résultat est gardé 15 secondes en mémoire et les limitations Spotify sont respectées via `Retry-After`. Les erreurs masquent le widget plutôt que de conserver une ancienne écoute. Si Spotify révoque l’autorisation, refaire la connexion. Un éventuel jeton de renouvellement remplacé est conservé en mémoire jusqu’au redémarrage ; si l’ancien jeton ne fonctionne plus après redémarrage, refaire la connexion.

Sources : [écoute en cours](https://developer.spotify.com/documentation/web-api/reference/get-the-users-currently-playing-track), [autorisation](https://developer.spotify.com/documentation/web-api/tutorials/code-flow), [redirections](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri), [renouvellement](https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens).
