# Dashboard Plum - Documentation Technique
Auteur(s) :  RAKOTONAIVO Aina Raphaël
Tous droits réservés

## Description

Dashboard Plum est une application de gestion administrative développée avec **React** et **TypeScript**. Elle permet de gérer les prestataires (Fliiinkers), les clients, les commandes, les paiements et les réclamations.

---

## Technologies Principales

- **React 19.0.0**
- **TypeScript**
- **Redux Toolkit** (Gestion d'état)
- **Ant Design** (UI Framework)
- **Refine Dev** (Framework d'administration)
- **Supabase** (Backend as a Service)

---

## Fonctionnalités Principales

### 1. Gestion des Utilisateurs
- Gestion des profils Fliiinkers
- Gestion des profils clients
- Interface détaillée pour chaque type d'utilisateur

### 2. Gestion des Commandes
- Tableau de bord des commandes
- Détails des commandes avec informations de facturation
- Statut des paiements

### 3. Système de Paiement
- Historique des paiements
- Gestion des paiements des prestataires
- Filtrage et recherche des paiements

### 4. Système de Réclamations
- Interface de chat en temps réel
- Gestion des notifications
- Suivi des réclamations

### 5. Photothèque
- Gestion des images par dossier
- Validation des images
- Interface de visualisation

### 6. Cartographie
- Visualisation des clients sur une carte
- Utilisation de **Leaflet** pour le rendu cartographique

---

## Architecture Technique

### État Global
- Utilisation de **Redux Toolkit** pour la gestion d'état
- Slices pour différentes fonctionnalités

### API et Services
- Services modulaires pour chaque fonctionnalité
- Gestion des requêtes API avec **Supabase**
- Système de cache pour les profils

### Composants UI
- Composants réutilisables
- **Styled Components** pour le style
- **Responsive Design**

---

## Installation et Configuration

1. **Cloner le repository :**
   ```bash
   git clone https://github.com/votre-repo/dashboard-plum.git
```
2. **Installer les dépendances :**
   ```bash
   npm install
```

3. **Configuration des variables d'environnement :**

Créer un fichier .env avec les variables nécessaires :
   ```bash
   env
   Copy

        VITE_APP_SUPABASE_URL=votre_url_supabase
        VITE_APP_SUPABASE_KEY=votre_clé_supabase

4. **Lancer l'application :**
   ```bash
   npm start
    npm start

5. **Sécurité :**

    Authentification via Supabase

    Gestion des rôles et permissions

    Validation des données

6. **Performance :**

    Lazy loading des composants

    Mise en cache des données

    Optimisation des requêtes API

7. **Maintenance :**

    Logs détaillés pour le debugging

    Structure modulaire pour faciliter les mises à jour

    Documentation des composants et services

8. **Contribution :**

    Pour contribuer au projet :

    Créer une branche pour votre fonctionnalité :
    ``` bash
    git checkout -b feature/nom-de-la-fonctionnalité
    ```

    Suivre les conventions de code.

    Tester vos modifications.

    Soumettre une merge request.

Support

Pour toute question ou problème, contacter l'équipe de développement ou créer une issue dans le repository GitLab.

Dès fois l'affichage des images sont bloquées par le CORS de Cloudflare, il faut juste modifier la politique de CORS dans le bucket

```jsons
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ]
  }
]
```

Ou  bien mettre 

```jsons
[
  {
    // AllowedOrigins : Liste des origines autorisées à accéder à la ressource (CORS)
    "AllowedOrigins": [
      "http://localhost:3000", // Autorise les requêtes depuis localhost:3000
      "http://localhost:5173"  // Autorise les requêtes depuis localhost:5173
    ],
    // AllowedMethods : Méthodes HTTP autorisées pour les requêtes
    "AllowedMethods": [
      "GET",  // Autorise les requêtes GET
      "HEAD"  // Autorise les requêtes HEAD
    ],
    // AllowedHeaders : En-têtes HTTP autorisés dans les requêtes
    "AllowedHeaders": [
      "*"  // Autorise tous les en-têtes
    ],
    // ExposeHeaders : En-têtes exposés au client dans la réponse
    "ExposeHeaders": [
      "ETag",          // Expose l'en-tête ETag
      "Content-Length" // Expose l'en-tête Content-Length
    ],
    // MaxAgeSeconds : Durée en secondes pendant laquelle les options CORS sont mises en cache
    "MaxAgeSeconds": 3600 // Cache les options CORS pendant 1 heure (3600 secondes)
  }
]
```