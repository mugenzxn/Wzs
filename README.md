# WASL Transport - Plateforme Professionnelle

Application web professionnelle de commissionnariat de transport reliant expéditeurs et transporteurs.

## Structure du Projet

```
.
├── index.html              # Page principale (HTML)
├── css/
│   └── style.css          # Design system unifié
├── js/
│   ├── firebase-config.js # Configuration Firebase
│   ├── DataStore.js       # Gestion des données Firestore
│   ├── validators.js      # Validation et sanitisation
│   ├── data.js           # État global et données de base
│   ├── app.js            # Logique principale et navigation
│   ├── expediteurs.js    # Dashboard expéditeur
│   ├── transporteur.js   # Dashboard transporteur
│   ├── admin.js          # Panel administrateur
│   ├── documents.js      # Génération de documents (CMR, factures)
│   ├── suivi.js          # Suivi public des expéditions
│   └── footer.js         # Footer et pages juridiques
└── .env                  # Variables d'environnement (Supabase)
```

## Design System

### Variables CSS (`:root`)

**Couleurs principales:**
- `--primary` : #0F172A (bleu foncé)
- `--accent` : #2563EB (bleu)
- `--success` : #059669 (vert)
- `--warning` : #D97706 (orange)
- `--danger` : #DC2626 (rouge)
- `--purple` : #7C3AED (violet)

**Variations:**
- Versions `-light` : Fond clair pour badges
- Versions `-dark` : Texte foncé pour contraste

**Spacing:**
- `--radius-sm` à `--radius-xl` : Border radius (8px → 20px)
- `--shadow-sm` à `--shadow-xl` : Ombres standardisées

### Classes Principales

**Layout:**
- `.dashboard-section` : Section de dashboard (masquée par défaut)
- `.modal` : Modal overlay
- `.modal-content` : Contenu de modal
- `.kpi-card` : Carte KPI avec animation hover

**Forms:**
- `.inp` : Input standardisé
- `.lbl` : Label standardisé
- `.section-title` : Titre de section

**Status:**
- `.status-pending` : En attente (jaune)
- `.status-quoted` : Devis envoyé (indigo)
- `.status-progress` : En cours (bleu)
- `.status-delivered` : Livré (vert)

**Documents:**
- `.doc-container` : Container de document
- `.doc-header` : En-tête de document
- `.doc-table` : Tableau de document
- `.doc-badge-*` : Badges de document

## Fonctionnalités

### Expéditeur
- Créer des demandes de transport
- Recevoir et accepter des devis
- Suivre les expéditions
- Télécharger les documents (factures, CMR)

### Transporteur
- Consulter les missions disponibles
- Soumettre des offres
- Gérer les chauffeurs
- Uploader les preuves de livraison
- Comptabilité et TMS

### Administrateur
- Gérer les utilisateurs et rôles
- Valider les conformités transporteurs
- Composer et envoyer les devis
- Assigner les missions
- Valider les livraisons
- Facturation

## Comptes Démo

**Expéditeur:**
- Email: `expediteur@wasl.fr`
- Mot de passe: `demo123`

**Transporteur (Paris - 75):**
- Email: `transporteur@wasl.fr`
- Mot de passe: `demo123`

**Transporteur (Bayonne - 64):**
- Email: `transporteur2@wasl.fr`
- Mot de passe: `demo123`

**Administrateur:**
- Email: `admin@wasl.fr`
- Mot de passe: `admin123`

## Technologies

- **Frontend:** HTML5, Tailwind CSS (CDN), Vanilla JavaScript
- **Backend:** Firebase Firestore (temps réel)
- **Auth:** Firebase Authentication
- **Database:** Supabase PostgreSQL (via MCP)
- **Design:** DM Sans font, design system personnalisé

## Configuration

Les variables d'environnement sont dans `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Firebase est configuré dans `js/firebase-config.js`.

## Développement

Aucune compilation nécessaire - ouvrir `index.html` directement dans un navigateur.

Pour le développement:
```bash
# Serveur local (optionnel)
python -m http.server 8000
# ou
npx serve
```

## Sécurité

- Validation et sanitisation via `validators.js`
- RLS (Row Level Security) sur Supabase
- Pas de clés API dans le code client
- RGPD compliant (politique de confidentialité incluse)

## Documentation Juridique

Accessible via le footer:
- CGU (Conditions Générales d'Utilisation)
- CGV (Conditions Générales de Vente)
- Politique de confidentialité RGPD
- Mentions légales

## Support

Contact: contact@wasl-transport.fr
