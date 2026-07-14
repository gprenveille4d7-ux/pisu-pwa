# Livraison PISU

Pour chaque livraison de cette PWA :

- mettre à jour la version dans `version.js` et synchroniser le cache du service worker ;
- exécuter les contrôles disponibles avant publication ;
- publier la version validée sur la branche `main` du dépôt GitHub ;
- attendre la fin du déploiement GitHub Pages en HTTPS ;
- vérifier la page publiée, le manifeste, le service worker et l’affichage mobile iPhone ;
- ne déclarer un essai sur iPhone physique que s’il a réellement été effectué.

Adresse de production : `https://gprenveille4d7-ux.github.io/pisu-pwa/`.
