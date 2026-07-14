# PISU — PWA hors ligne

Prototype d’aide-mémoire PISU destiné à un usage professionnel ou de formation, sous réserve d’une validation médicale et institutionnelle.

## Version auditée

- Version de l’application : `v5.17` (source unique : `version.js`)
- Cache PWA : `v224`
- 11 protocoles reliés au cycle de mission
- Journal et SAED opérationnel structurés
- SAED contextuel sur les 11 protocoles : S construit depuis les données saisies, E synthétise actions et évolution, D propose une formulation puis exige une validation professionnelle
- Repère GPS séparé strictement de l’orientation et du transport
- Parcours / transport / destination repositionné après les protocoles, en navigation swipe avec horodatages stables
- État actif des swipes synchronisé à chaque frame, sans debounce tactile
- Inertie et snap tactiles natifs pour Protocoles, Équipe, Identité patient et Parcours
- Navigation et ressources versionnées vérifiées sur le réseau avant repli hors ligne
- Verrouillage strict : un toucher ou un swipe ne peut avancer que d’un seul panneau
- Recalage exact sur le bord intérieur de la piste à la fin de l’inertie tactile iPhone
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

Il vérifie notamment les ressources locales, les identifiants HTML, la synchronisation du cache, la source de version unique, la position du parcours après les protocoles, le SAED opérationnel, le raccordement des protocoles à la remise à zéro et l’absence du service QR distant supprimé lors de l’audit.

## Limites importantes

- Cette version n’est pas un protocole officiel et ne remplace pas le jugement clinique.
- Les doses, seuils, séquences et temporisations doivent être validés par l’autorité médicale compétente.
- Une mission et ses données restent stockées localement jusqu’à leur effacement par l’utilisateur.
- Après fermeture ou rechargement, le protocole actif est retrouvé mais les minuteurs cliniques ne sont pas reconstruits automatiquement.
