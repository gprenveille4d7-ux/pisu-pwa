# PISU — PWA hors ligne

Prototype d’aide-mémoire PISU destiné à un usage professionnel ou de formation, sous réserve d’une validation médicale et institutionnelle.

## Version auditée

- Cache PWA : `v199`
- 11 protocoles reliés au cycle de mission
- Journal et mini SAED structurés
- Reprise d’une mission après rechargement
- Protection contre les doubles activations rapides
- Transfert par code local, sans service QR externe
- Interface mobile vérifiée en largeur iPhone

## Démarrage local

L’application doit être servie par HTTP pour installer son cache hors ligne. Par exemple :

```powershell
python -m http.server 8000
```

Ouvrir ensuite `http://127.0.0.1:8000/`, attendre l’installation du cache, puis recharger une fois avant de tester hors ligne.

## Contrôles

Le contrôle statique ne nécessite aucune dépendance externe :

```powershell
node tests/static-audit.mjs
```

Il vérifie notamment les ressources locales, les identifiants HTML, la synchronisation du cache, le raccordement des protocoles à la remise à zéro et l’absence du service QR distant supprimé lors de l’audit.

## Limites importantes

- Cette version n’est pas un protocole officiel et ne remplace pas le jugement clinique.
- Les doses, seuils, séquences et temporisations doivent être validés par l’autorité médicale compétente.
- Une mission et ses données restent stockées localement jusqu’à leur effacement par l’utilisateur.
- Après fermeture ou rechargement, le protocole actif est retrouvé mais les minuteurs cliniques ne sont pas reconstruits automatiquement.
