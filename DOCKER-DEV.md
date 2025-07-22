# Docker pour le Développement avec Nodemon

## Démarrage rapide

```bash
# Démarrer le serveur de développement avec nodemon
docker-compose -f docker-compose.dev.yml up --build

# Ou en arrière-plan
docker-compose -f docker-compose.dev.yml up -d --build
```

## Test local (sans Docker)

```bash
# Option 1 : Avec nodemon (redémarre le serveur à chaque changement)
npm run dev:nodemon

# Option 2 : Vite direct (hot reload intégré)
npm run dev:vite

# Option 3 : Refine original (peut avoir des problèmes)
npm run dev
```

## Accès à l'application

- **URL**: http://localhost:5173
- **Nodemon**: ✅ Redémarre automatiquement le serveur à chaque changement de fichier

## Commandes utiles

```bash
# Arrêter le container
docker-compose -f docker-compose.dev.yml down

# Voir les logs
docker-compose -f docker-compose.dev.yml logs -f

# Reconstruire après changement des dépendances
docker-compose -f docker-compose.dev.yml up --build
```

## Avantages de ce setup

- 🔄 **Nodemon** redémarre automatiquement le serveur à chaque changement
- 📁 **Volume mapping** pour synchronisation instantanée du code
- 🐳 **Environnement Docker** isolé et reproductible
- ⚡ **Surveillance optimisée** des fichiers .ts, .tsx, .css, .scss
- 🎯 **Configuration nodemon** personnalisée avec délai et filtres 