import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const index = read("index.html");
const app = read("app.js");
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
assert.match(app, /pisuMissionStateV1/, "État de reprise de mission absent");
assert.match(app, /RAPID_ACTION_GUARD_MS\s*=\s*900/, "Protection anti-double-clic absente");

console.log(
  `Audit statique réussi : ${ids.length} identifiants uniques, ${localAssets.length} ressources locales, ` +
  `${protocolFiles.length} protocoles reliés à la remise à zéro, cache v${cacheVersion}.`
);
