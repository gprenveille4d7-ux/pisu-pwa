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
assert.match(versionSource, /PISU_APP_VERSION\s*=\s*["']5\.7["']/, "Version applicative centralisée introuvable");
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
assert.match(style, /\.mission-route-panel \.route-swipe-track[\s\S]*overflow:\s*visible\s*!important/, "Flux parcours vertical ou débordements non sécurisés");
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
