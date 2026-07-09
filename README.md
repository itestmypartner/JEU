# Zéro Mensonge dans le Jeu

> **"Les statistiques ne mentent jamais."**

Plateforme web multi-groupes permettant à des communautés de joueurs de football
virtuel (FC) d'enregistrer leurs matchs 1 contre 1 et de calculer automatiquement
toutes les statistiques, classements et confrontations directes.

## Fonctionnalités

- **Groupes multiples** : création d'un groupe (l'auteur devient administrateur) et adhésion via un code d'invitation, avec validation des demandes par l'admin.
- **Authentification sécurisée** : inscription/connexion par JWT + refresh token en cookie httpOnly, mots de passe hachés (bcrypt).
- **Enregistrement de matchs 1v1** : joueurs, équipes et scores ; le vainqueur et les statistiques sont calculés automatiquement.
- **Statistiques & classements** : victoires, défaites, nuls, taux de victoire, buts, filtrables par période (semaine, mois, année, tout).
- **Face-à-face** : confrontation directe entre deux joueurs avec l'historique complet.
- **Recherche** globale (joueurs, équipes, matchs) et **tableau de bord** synthétique.
- **Notifications temps réel** via Socket.IO (nouveau match, demande d'adhésion, etc.).
- **Administration** : gestion des membres et des rôles, modification/suppression de matchs, journal d'audit.

## Architecture

Monorepo composé de deux applications :

- **`backend/`** — API REST + temps réel
  - Node.js, Express.js, TypeScript
  - PostgreSQL via Prisma ORM
  - Authentification JWT + Refresh Token (bcrypt)
  - Notifications temps réel avec Socket.IO
  - Sécurité : helmet, rate-limiting, validation Zod, journalisation (AuditLog)
- **`frontend/`** — Interface utilisateur
  - React, TypeScript, Vite
  - Tailwind CSS (thème sombre, couleur principale verte)
  - React Router, React Query (TanStack Query)
  - Client Socket.IO pour les notifications en direct

### Structure du projet

```
JEUUUU/
├─ backend/
│  ├─ prisma/            # Schéma, migrations et script de seed
│  └─ src/
│     ├─ config/         # Chargement env + client Prisma
│     ├─ controllers/    # Contrôleurs HTTP (auth, groupes, matchs, membres…)
│     ├─ middlewares/    # Auth, validation Zod, rate limiting, erreurs
│     ├─ routes/         # Définition des routes REST
│     ├─ services/       # Logique métier (stats, classements, notifications…)
│     ├─ socket/         # Serveur temps réel Socket.IO
│     ├─ utils/          # Helpers (tokens, dates, erreurs…)
│     ├─ validators/     # Schémas Zod
│     ├─ app.ts          # Création de l'application Express
│     └─ server.ts       # Point d'entrée (HTTP + Socket.IO)
└─ frontend/
   └─ src/
      ├─ components/     # Composants réutilisables
      ├─ context/        # Contextes React (auth, groupe)
      ├─ hooks/          # Hooks personnalisés (notifications…)
      ├─ layouts/        # Mises en page (app, auth, topbar)
      ├─ pages/          # Écrans de l'application
      ├─ services/       # Client API Axios, endpoints, socket
      ├─ types/          # Types TypeScript partagés
      └─ utils/          # Helpers (formatage, classes CSS)
```

## Démarrage rapide

### Prérequis

- Node.js 20+
- PostgreSQL 14+ (ou Docker)

### 1. Base de données

```bash
docker run --name zmj-postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=zmj -p 5432:5432 -d postgres:16
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # ajuster DATABASE_URL et les secrets si besoin
npm install
npm run prisma:generate
npm run prisma:migrate     # crée les tables
npm run dev                # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

### 4. (Optionnel) Données de démonstration

Pour remplir la base avec un groupe, des joueurs et une quarantaine de matchs :

```bash
cd backend
npm run seed
```

Vous pouvez alors vous connecter avec le compte administrateur de démonstration :

| Champ | Valeur |
| --- | --- |
| E-mail | `admin@zmj.dev` |
| Mot de passe | `password123` |
| Code d'invitation du groupe | `DEMO-2026` |

> L'API est exposée sous le préfixe `/api` (ex. `http://localhost:4000/api/health`).

## Scripts utiles

### Backend

| Script | Description |
| --- | --- |
| `npm run dev` | Serveur de développement (tsx watch) |
| `npm run build` | Compilation TypeScript |
| `npm run start` | Démarre le serveur compilé |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification de types |
| `npm run prisma:migrate` | Applique les migrations |
| `npm run prisma:studio` | Interface Prisma Studio |
| `npm run seed` | Données de démonstration |

### Frontend

| Script | Description |
| --- | --- |
| `npm run dev` | Serveur Vite |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualisation du build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification de types |

## Déploiement (Render)

Le dépôt contient un **Blueprint Render** (`render.yaml`) qui déclare deux services :
`zmj-backend` (API Node) et `zmj-frontend` (site statique React).

### Étapes

1. **Base de données** — créer un projet **Supabase** et récupérer la chaîne de connexion
   via le bouton **Connect → Session pooler** (IPv4, port 5432) :
   `postgresql://postgres.<ref>:<mot_de_passe>@aws-1-<region>.pooler.supabase.com:5432/postgres`
   > L'hôte direct `db.<ref>.supabase.co` est IPv6-only et injoignable depuis Render : utiliser **le pooler**.
2. Sur Render : **New → Blueprint**, sélectionner ce dépôt. Render lit `render.yaml`.
3. Renseigner les variables `sync: false` :
   - Sur `zmj-backend` : `DATABASE_URL` (Supabase) et `CLIENT_URL` (URL publique du frontend, ex. `https://zmj-frontend.onrender.com`).
   - Sur `zmj-frontend` : `VITE_API_URL` (URL publique du backend, ex. `https://zmj-backend.onrender.com`).
   - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` sont générés automatiquement.
4. Appliquer. Le backend exécute automatiquement `prisma migrate deploy` pendant le build.
5. (Optionnel) Peupler la base de démonstration une fois déployé :
   `DATABASE_URL="…" npm --prefix backend run seed`.

> Astuce : `CLIENT_URL` et `VITE_API_URL` doivent pointer l'un vers l'autre. Les cookies de
> refresh sont `SameSite=None; Secure` en production (cross-site), et le CORS n'autorise que
> `CLIENT_URL` — ces deux URL doivent donc être exactes (sans slash final).

### Alternatives

- **Frontend** : Vercel · **Backend** : Railway · **Base de données** : Neon PostgreSQL

---

© 2026 — Conçu et développé par **haniel_dev**. Tous droits réservés.
