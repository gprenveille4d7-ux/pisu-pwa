import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const index = read("index.html");
const app = read("app.js");
const saed = read("saed.js");
const style = read("style.css");
const versionSource = read("version.js");
const worker = read("service-worker.js");

const localAssets = [
  ...index.matchAll(/(?:src|href)=["']([^"'#?]+)(?:\?[^"']*)?["']/g)
]
  .map(match => match[1].replace(/^\.\//, ""))
  .filter(asset => !/^(?:https?:|tel:|mailto:|#)/.test(asset));

for (const asset of localAssets) {
  assert.ok(fs.existsSync(path.join(root, asset)), `Ressource HTML absente : ${asset}`);
}

const ids = [...index.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
const duplicateIds = [...new Set(ids.filter((id, position) => ids.indexOf(id) !== position))];
assert.deepEqual(duplicateIds, [], `Identifiants HTML dupliqués : ${duplicateIds.join(", ")}`);

const cacheVersion = worker.match(/CACHE_NAME\s*=\s*["']pisu-acr-cache-v(\d+)["']/)?.[1];
assert.ok(cacheVersion, "Version du cache PWA introuvable");
assert.match(index, new RegExp(`style\\.css\\?v=${cacheVersion}`), "Version CSS non synchronisée");
assert.match(index, new RegExp(`app\\.js\\?v=${cacheVersion}`), "Version JavaScript non synchronisée");
assert.match(index, new RegExp(`saed\\.js\\?v=${cacheVersion}`), "Version du module SAED non synchronisée");
assert.match(index, new RegExp(`version\\.js\\?v=${cacheVersion}`), "Source de version non synchronisée");
assert.match(versionSource, /PISU_APP_VERSION\s*=\s*["']5\.11["']/, "Version applicative centralisée introuvable");
assert.doesNotMatch(app, /PISU_APP_VERSION\s*=\s*["']\d/, "La version applicative est dupliquée dans app.js");

const protocolFiles = [
  "acr-adulte.js",
  "acr-enfant.js",
  "douleur-thoracique.js",
  "exposition-fumees.js",
  "brulures.js",
  "crise-convulsive.js",
  "anaphylaxie.js",
  "hemorragie.js",
  "hypoglycemie.js",
  "asthme-bpco.js",
  "antalgie.js"
];

for (const file of protocolFiles) {
  assert.match(
    read(file),
    /pisu:mission-reset/,
    `Le protocole ${file} ne réagit pas à la remise à zéro complète`
  );
}

const projectText = [index, app, worker, ...protocolFiles.map(read)].join("\n");
assert.doesNotMatch(projectText, /api\.qrserver\.com/i, "Une dépendance QR distante subsiste");
assert.doesNotMatch(
  worker,
  /catch\s*\(\s*\(\)\s*=>\s*caches\.match\(["']\.\/index\.html["']\)\s*\)/,
  "Le service worker renvoie encore du HTML pour une ressource non-HTML manquante"
);

for (const requiredId of ["missionResumeBanner", "missionResumeProtocol", "missionResumeDuration", "resumeMissionBtn"]) {
  assert.match(index, new RegExp(`id=["']${requiredId}["']`), `Élément de reprise absent : ${requiredId}`);
}
for (const requiredId of ["appVersion", "floatingSaedBtn", "saedSheet", "saedSituationContent", "saedVitalsEvolution", "saedDemandDetail"]) {
  assert.match(index, new RegExp(`id=["']${requiredId}["']`), `Élément SAED absent : ${requiredId}`);
}
for (const requiredId of [
  "missionRoutePanel",
  "missionRouteDetails",
  "missionRouteSummary",
  "routeTransportStatus",
  "routeTransportVector",
  "routeTransportMode",
  "routeOriginSummary",
  "routeDepartureDisplay",
  "routeArrivalDisplay"
]) {
  assert.match(index, new RegExp(`id=["']${requiredId}["']`), `Élément parcours absent : ${requiredId}`);
}

const protocolsPosition = index.indexOf('class="panel main-section protocols-block');
const routePanelPosition = index.indexOf('id="missionRoutePanel"');
assert.ok(protocolsPosition >= 0 && routePanelPosition > protocolsPosition, "Le point de montage parcours n’est pas placé après les protocoles");
assert.match(app, /mountMissionRouteAfterProtocols/, "Montage du parcours après les protocoles absent");
assert.match(app, /MISSION_ROUTE_DATA_VERSION\s*=\s*2/, "Migration des données parcours absente");
for (const timestampKey of ["departureAt", "junctionAt", "arrivalAt", "transmissionAt"]) {
  assert.match(app, new RegExp(timestampKey), `Timestamp parcours absent : ${timestampKey}`);
}
assert.match(app, /storeMissionRouteOriginFromGps/, "Réutilisation du GPS dans le parcours absente");
assert.match(app, /MISSION_ROUTE_TIMELINE_CATEGORY/, "Chronologie logistique structurée absente");
assert.match(saed, /route\?\.originLabel/, "Lieu de prise en charge absent du SAED");
assert.match(saed, /route\?\.transportStatus/, "Statut de transport absent du SAED");
assert.match(index, /id=["']routeSwipeTrack["'][^>]*tabindex=["']0["']/, "Piste swipe parcours non accessible au clavier");
assert.match(index, /data-route-slide-target=["']2["']/, "Navigation vers la destination absente");
assert.match(style, /\.mission-route-panel \.route-swipe-track\s*\{[\s\S]*?display:\s*flex\s*!important[\s\S]*?overflow-x:\s*auto\s*!important[\s\S]*?scroll-snap-type:\s*x mandatory\s*!important[\s\S]*?\}/, "Swipe horizontal du parcours absent ou incomplet");
assert.match(style, /\.mission-route-panel \.route-swipe-slide\s*\{[\s\S]*?flex:\s*0 0 100%\s*!important[\s\S]*?scroll-snap-align:\s*start\s*!important[\s\S]*?\}/, "Panneaux du parcours non configurés pour le swipe");
assert.doesNotMatch(app, /scrollTimer[\s\S]*?setTimeout\(\(\)\s*=>\s*this\.update\(\),\s*60\)/, "L’ancien debounce tactile de 60 ms est encore présent");
assert.match(app, /this\.track\.addEventListener\("scroll",\s*\(\)\s*=>\s*\{\s*this\.scheduleUpdate\(\);/s, "Synchronisation du swipe par frame absente");
assert.match(app, /Math\.abs\(requestedIndex - navigationIndex\)\s*>\s*1[\s\S]*?navigationIndex\s*\+\s*Math\.sign\(requestedIndex - navigationIndex\)/, "Verrouillage à un panneau par action absent");
assert.match(app, /this\.commitActiveIndex\(safeIndex,\s*\{\s*forceLayout:\s*true\s*\}\)[\s\S]*?this\.animateProgrammaticMotion\(targetLeft\)/, "Retour visuel du panneau voisin absent");
assert.match(app, /this\.track\.addEventListener\("scrollend"/, "Réconciliation finale du scroll snap absente");
assert.match(app, /this\.track\.style\.height\s*!==\s*nextHeight/, "Protection contre les écritures répétées de hauteur absente");
assert.match(app, /PISU_SWIPE_PANEL_DURATION_MS\s*=\s*420/, "Durée progressive par panneau absente");
assert.match(app, /this\.motionFrame\s*=\s*window\.requestAnimationFrame\(step\)/, "Animation de swipe pilotée par frame absente");
assert.match(app, /this\.track\.scrollLeft\s*=\s*startLeft\s*\+\s*distance\s*\*\s*progress/, "Vitesse constante de panneau absente");
assert.match(app, /PISU_SWIPE_TOUCH_THRESHOLD_PX\s*=\s*24/, "Seuil tactile du swipe absent");
assert.match(app, /addEventListener\("touchend",\s*finishTouchGesture/, "Verrouillage tactile en fin de geste absent");
assert.match(style, /\.mission-route-panel \.route-swipe-track\.pisu-swipe-programmatic-motion\s*\{[\s\S]*?scroll-behavior:\s*auto\s*!important;[\s\S]*?scroll-snap-type:\s*none\s*!important;/, "Neutralisation temporaire du snap pendant l’animation absente");
assert.match(style, /touch-action:\s*pan-x pan-y/, "Gestes horizontal et vertical non explicitement préservés");
assert.match(saed, /pisuSaedRequestV1/, "Stockage de la demande SAED absent");
assert.match(saed, /buildVitalRows/, "Comparaison initiale / actuelle des constantes absente");
assert.match(saed, /buildChronology/, "Chronologie SAED absente");
assert.match(app, /saedRequest:\s*window\.pisuSAED/, "Demande SAED absente du transfert de mission");
assert.match(app, /data-open-operational-saed/, "Accès SAED absent des protocoles");
assert.doesNotMatch(app, /Copier mini SAED/, "L’ancien résumé mini SAED reste exposé");
assert.match(app, /pisuMissionStateV1/, "État de reprise de mission absent");
assert.match(app, /RAPID_ACTION_GUARD_MS\s*=\s*900/, "Protection anti-double-clic absente");

console.log(
  `Audit statique réussi : ${ids.length} identifiants uniques, ${localAssets.length} ressources locales, ` +
  `${protocolFiles.length} protocoles reliés à la remise à zéro, cache v${cacheVersion}.`
);
