# Notes — PWA

Une application de prise de notes ultra simple, moderne et installable (PWA), sans backend ni dépendance.

## Fonctionnalités

- Créer, éditer, rechercher et supprimer des notes
- Sauvegarde automatique (stockage local via IndexedDB, aucune donnée envoyée sur un serveur)
- Fonctionne hors-ligne grâce au Service Worker
- Installable sur mobile et desktop (ajout à l'écran d'accueil)
- Thème clair/sombre automatique selon les préférences système
- Interface responsive (sidebar rétractable sur mobile)

## Utilisation en local

Comme la PWA utilise un Service Worker, il faut la servir via HTTP (pas en `file://`).

```bash
python -m http.server 8080
```

Puis ouvre `http://localhost:8080` dans ton navigateur.

## Déploiement avec GitHub Pages

1. Va dans les paramètres du dépôt > Pages
2. Source : branche `main`, dossier `/ (root)`
3. Ton app sera disponible à `https://<utilisateur>.github.io/<nom-du-repo>/`

## Raccourcis clavier

- `Ctrl/Cmd + N` : nouvelle note

## Stack technique

HTML, CSS et JavaScript vanilla — aucune dépendance à installer, aucun build à lancer.
