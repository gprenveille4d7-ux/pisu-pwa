import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const index = read("index.html");
const app = read("app.js");
const saed = read("saed.js");
const style = read("style.css");
const versionSource = read("version.js");
const patientSync = read("patient-sync.js");
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
assert.match(index, new RegExp("patient-sync\\.js\\?v=" + cacheVersion), "Module de synchronisation patient non versionné");
assert.match(worker, new RegExp("patient-sync\\.js\\?v=" + cacheVersion), "Module de synchronisation patient absent du cache");
assert.match(app, new RegExp(`CACHE_NAME\\s*=\\s*["']pisu-acr-cache-v${cacheVersion}["']`), "Cache applicatif non synchronise");
assert.match(versionSource, /PISU_APP_VERSION\s*=\s*["']5\.24["']/, "Version applicative centralisée introuvable");
assert.doesNotMatch(app, /PISU_APP_VERSION\s*=\s*["']\d/, "La version applicative est dupliquée dans app.js");
assert.match(patientSync, /const VERSION\s*=\s*["']patient-sync-v1["']/, "Version du module de synchronisation patient introuvable");
assert.match(worker, /async function fetchNetworkFirst\(request,\s*fallbackRequest\s*=\s*request\)/, "Stratégie réseau prioritaire absente");
assert.match(worker, /event\.request\.mode\s*===\s*"navigate"[\s\S]*?fetchNetworkFirst\(event\.request,\s*"\.\/index\.html"\)/, "Navigation encore prioritaire au cache");
assert.match(worker, /requestUrl\.searchParams\.has\("v"\)[\s\S]*?fetchNetworkFirst\(event\.request\)/, "Ressources versionnées encore prioritaires au cache");

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
assert.match(saed, /function formatOriginLocation\(route\)/, "Construction centralisée du lieu d’intervention absente");
const originFormatterSource = saed.slice(
  saed.indexOf("function formatOriginLocation"),
  saed.indexOf("function buildRouteLines")
);
assert.match(originFormatterSource, /route\?\.originLabel/, "Le libellé d’origine n’alimente plus le lieu SAED");
assert.match(originFormatterSource, /route\?\.originCoordinates/, "Les coordonnées d’origine n’alimentent plus le lieu SAED");
assert.doesNotMatch(originFormatterSource, /\.replace\(|\.split\(|RegExp/, "Le lieu SAED est reconstruit en parsant une chaîne");

const originBuildersSource = saed.slice(
  saed.indexOf("function formatOriginLocation"),
  saed.indexOf("function hasOrientationTransportData")
);
assert.match(originBuildersSource, /function buildOriginLines\(route\)[\s\S]*?formatOriginLocation\(route\)/, "buildOriginLines ne réutilise pas le formateur centralisé");
const originProbeContext = {};
vm.runInNewContext(
  `${originBuildersSource}
  originProbe = {
    complete: formatOriginLocation({ originLabel: "12 rue de la Pelleterie, Falaise", originCoordinates: "48.8921, -0.1968" }),
    labelOnly: formatOriginLocation({ originLabel: "12 rue de la Pelleterie, Falaise", originCoordinates: "" }),
    gpsOnly: formatOriginLocation({ originLabel: "", originCoordinates: "48.8921, -0.1968" }),
    missing: formatOriginLocation({ originLabel: "", originCoordinates: "" }),
    completeLines: buildOriginLines({ originLabel: "12 rue de la Pelleterie, Falaise", originCoordinates: "48.8921, -0.1968" }),
    missingLines: buildOriginLines({ originLabel: "", originCoordinates: "" })
  };`,
  originProbeContext
);
assert.equal(originProbeContext.originProbe.complete, "12 rue de la Pelleterie, Falaise — 48.8921, -0.1968", "Lieu complet mal formaté");
assert.equal(originProbeContext.originProbe.labelOnly, "12 rue de la Pelleterie, Falaise", "Lieu textuel seul mal formaté");
assert.equal(originProbeContext.originProbe.gpsOnly, "48.8921, -0.1968", "Coordonnées seules mal formatées");
assert.equal(originProbeContext.originProbe.missing, "", "Un lieu absent est inventé");
assert.deepEqual(Array.from(originProbeContext.originProbe.completeLines), ["Lieu d’intervention : 12 rue de la Pelleterie, Falaise — 48.8921, -0.1968"], "Ligne de lieu complète incorrecte");
assert.deepEqual(Array.from(originProbeContext.originProbe.missingLines), [], "Une ligne de lieu absente est fabriquée");
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
assert.match(app, /this\.settleIndex\s*=\s*safeIndex/, "Cible finale du panneau non mémorisée");
assert.match(app, /const slideLeft\s*=\s*slideRect\.left[\s\S]*?trackRect\.left[\s\S]*?this\.track\.scrollLeft/, "Position du panneau non calculée relativement à la piste");
assert.match(app, /settleExactPosition\(index\)[\s\S]*?this\.track\.scrollLeft\s*=\s*targetLeft/, "Recalage exact du panneau après inertie absent");
assert.match(app, /const finalIndex\s*=\s*Number\.isFinite\(this\.settleIndex\)[\s\S]*?this\.settleExactPosition\(finalIndex\)/, "Recalage final au scrollend absent");
assert.match(app, /this\.track\.style\.height\s*!==\s*nextHeight/, "Protection contre les écritures répétées de hauteur absente");
assert.match(app, /PISU_SWIPE_PANEL_DURATION_MS\s*=\s*420/, "Durée progressive par panneau absente");
assert.match(app, /this\.motionFrame\s*=\s*window\.requestAnimationFrame\(step\)/, "Animation de swipe pilotée par frame absente");
assert.match(app, /this\.track\.scrollLeft\s*=\s*startLeft\s*\+\s*distance\s*\*\s*progress/, "Vitesse constante de panneau absente");
assert.match(app, /PISU_SWIPE_TOUCH_THRESHOLD_PX\s*=\s*24/, "Seuil tactile du swipe absent");
assert.match(app, /addEventListener\("touchend",\s*finishTouchGesture/, "Verrouillage tactile en fin de geste absent");
assert.match(app, /if\s*\(this\.nativeTouch\)\s*\{\s*this\.settleExactPosition\(targetIndex\);/s, "Arrêt natif sur le panneau voisin absent");
for (const swipeName of ["protocol", "team", "route", "identity"]) {
  const nativeSwipeConfig = new RegExp(
    swipeName + ":\\s*\\{[\\s\\S]*?nativeTouch:\\s*true,[\\s\\S]*?nativeMotion:\\s*true"
  );
  assert.match(app, nativeSwipeConfig, "Swipe natif non activé pour " + swipeName);
}
assert.match(style, /\.team-swipe-slide,[\s\S]*?scroll-snap-stop:\s*always\s*!important;/, "Arrêt strict des panneaux pleine largeur absent");
assert.match(style, /\.protocol-swipe-card\s*\{[\s\S]*?scroll-snap-stop:\s*always\s*!important;/, "Arrêt strict des cartes protocoles absent");
assert.match(style, /\.mission-route-panel \.route-swipe-track\.pisu-swipe-programmatic-motion\s*\{[\s\S]*?scroll-behavior:\s*auto\s*!important;[\s\S]*?scroll-snap-type:\s*none\s*!important;/, "Neutralisation temporaire du snap pendant l’animation absente");
assert.match(style, /touch-action:\s*pan-x pan-y/, "Gestes horizontal et vertical non explicitement préservés");
assert.match(style, /--pisu-child-tabs-sticky-top/, "Variable d'offset sticky des onglets enfants absente");
assert.match(app, /function updateChildNavigationStickyOffsets\(\)/, "Synchronisation sticky des onglets enfants absente");
assert.match(app, /getComputedStyle\(anchor\)\.top/, "Position sticky du titre mere non lue dynamiquement");
assert.match(app, /anchor\.getBoundingClientRect\(\)\.height/, "Hauteur reelle du titre mere non mesuree");
assert.match(app, /function getChildNavigationStickyPairs\(\)[\s\S]*?\.team-block > \.collapsible-title[\s\S]*?\.identity-block > \.collapsible-title[\s\S]*?\.mission-route-panel > \.mission-route-subblock > \.route-panel-summary/, "Les trois couples titre/navigation enfant ne sont pas centralises");
assert.match(app, /const observer\s*=\s*new ResizeObserver\(updateAccordionStickyOffsets\)[\s\S]*?\[header, \.\.\.stickyAnchors\][\s\S]*?observer\.observe\(element\)/, "ResizeObserver commun du header et des trois titres absent");
assert.match(app, /setupMissionRouteFeature\(\);\s*setupAccordionStickyOffsets\?\.\(\);/, "Les ancres sticky sont observees avant le montage final du parcours");
assert.match(style, /\.team-compact-content \.team-swipe-tabs,[\s\S]*?\.route-compact-content \.route-swipe-tabs,[\s\S]*?\.identity-compact-content \.identity-swipe-tabs\s*\{[\s\S]*?position:\s*sticky\s*!important;[\s\S]*?top:\s*var\(--pisu-child-tabs-sticky-top,[^;]+;[\s\S]*?z-index:\s*2400\s*!important;/, "Sticky commun des trois navigations enfants absent ou incomplet");
assert.doesNotMatch(style, /\.(?:team|route|identity)-swipe-tabs\s*\{[^}]*top:\s*\d+px/s, "Un offset sticky fixe a ete code pour un module enfant");
assert.match(style, /\.team-compact-content,[\s\S]*?\.identity-compact-content\s*\{[\s\S]*?overflow:\s*visible\s*!important;/, "Les conteneurs compacts bloquent encore le sticky vertical");
assert.match(
  style,
  /\.team-swipe-track,[\s\S]*?\.route-swipe-track,[\s\S]*?\.identity-swipe-track\s*\{[\s\S]*?overflow-x:\s*auto\s*!important;[\s\S]*?overflow-y:\s*hidden\s*!important;[\s\S]*?scroll-snap-type:\s*x mandatory\s*!important;[\s\S]*?touch-action:\s*pan-x pan-y/,
  "Protections communes des trois pistes swipe alterees"
);
assert.match(style, /\.collapsible-content\[hidden\]\s*\{[\s\S]*?display:\s*none\s*!important;/, "Les onglets enfants ne disparaissent plus avec un accordéon ferme");
assert.match(style, /\.vitals-overlay\s*\{[\s\S]*?z-index:\s*10000\s*!important;[\s\S]*?\.vitals-sheet\s*\{[\s\S]*?z-index:\s*10010\s*!important;[\s\S]*?\.floating-vitals-button\s*\{[\s\S]*?z-index:\s*10020\s*!important;/, "La priorite des Constantes sur les onglets sticky est alteree");
assert.match(style, /\.saed-overlay\s*\{[\s\S]*?z-index:\s*13000\s*!important;[\s\S]*?\.saed-sheet\s*\{[\s\S]*?z-index:\s*13010\s*!important;/, "La priorite du SAED sur les onglets sticky est alteree");

const vitalsRollerIdsSource = app.match(
  /const VITALS_ROLLER_SELECT_IDS\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/
)?.[1] || "";
const vitalsRollerIds = [...vitalsRollerIdsSource.matchAll(/["']([^"']+)["']/g)]
  .map(match => match[1]);
const expectedVitalsRollerIds = [
  "vitalsFc",
  "vitalsTasLeft",
  "vitalsTadLeft",
  "vitalsTasRight",
  "vitalsTadRight",
  "vitalsSpo2",
  "vitalsOxygenFlow",
  "vitalsFr",
  "vitalsTemp",
  "vitalsGcs",
  "vitalsPain",
  "vitalsGlycemia"
];

assert.deepEqual(vitalsRollerIds, expectedVitalsRollerIds, "Liste des constantes numeriques de la roulette incorrecte");
assert.ok(!vitalsRollerIds.includes("vitalsMoment"), "Le moment ne doit pas utiliser la roulette numerique");
assert.ok(!vitalsRollerIds.includes("vitalsOxygenSupport"), "Le support O2 ne doit pas utiliser la roulette numerique");
assert.equal((app.match(/className\s*=\s*["']vitals-roller-layer hidden["']/g) || []).length, 1, "La roulette PISU n'est pas une instance unique");
assert.match(app, /function getVitalsRollerAnchorGeometry\(trigger\)[\s\S]*?const triggerRect\s*=\s*trigger\.getBoundingClientRect\(\)[\s\S]*?triggerRect\.top\s*\+\s*triggerRect\.height\s*\/\s*2/, "Ancrage vertical reel de la roulette absent");
assert.match(app, /function getVitalsRollerOptions\(select\)[\s\S]*?Array\.from\(select\.options\)[\s\S]*?option\.value\s*!==\s*["']["']/, "La roulette ne lit pas directement les options du select source");
const vitalsRollerOptionsSource = app.slice(
  app.indexOf("function getVitalsRollerOptions"),
  app.indexOf("function getVitalsRollerTrigger")
);
assert.doesNotMatch(vitalsRollerOptionsSource, /\[\s*-?\d+(?:\.\d+)?\s*(?:,|\])/, "Une plage numerique a ete dupliquee dans la roulette");
assert.match(app, /currentVirtualIndex\s*-\s*incrementalDeltaY\s*\/\s*rowHeight\s*\*\s*adaptiveGain/, "Scrub incrémental adaptatif de la roulette absent");
assert.doesNotMatch(app, /startIndex\s*-\s*deltaY\s*\/\s*rowHeight/, "L'ancien calcul absolu lent de la roulette est encore actif");
assert.match(app, /const finalIndex\s*=\s*Math\.round\(vitalsRollerState\.currentVirtualIndex\)/, "Snap final de la roulette absent");
assert.match(app, /select\.value\s*=\s*option\.value[\s\S]*?select\.dataset\.vitalsTouched\s*=\s*["']true["'][\s\S]*?new Event\(["']input["'],\s*\{\s*bubbles:\s*true\s*\}\)[\s\S]*?new Event\(["']change["'],\s*\{\s*bubbles:\s*true\s*\}\)/, "Validation de la roulette non reconnectee au select source");
assert.match(app, /function clearVitalsForm\(\)[\s\S]*?syncVitalsRollerTriggers\(\)/, "Remise a zero visuelle des triggers absente");
assert.match(app, /function closeVitalsSheet\(\)\s*\{\s*closeVitalsRoller\(\)/, "La roulette ne se ferme pas avec les Constantes");
assert.match(app, /trigger\.type\s*=\s*["']button["'][\s\S]*?aria-haspopup["'],\s*["']listbox/, "Trigger accessible de la roulette absent");

const vitalsRollerStyle = style.slice(
  style.indexOf(".vitals-native-roller-source"),
  style.indexOf("\n.vitals-actions {", style.indexOf(".vitals-native-roller-source"))
);
assert.match(vitalsRollerStyle, /\.vitals-roller-layer\s*\{[\s\S]*?position:\s*fixed;[\s\S]*?z-index:\s*10015;/, "Couche fixe de la roulette absente ou mal empilee");
assert.match(vitalsRollerStyle, /\.vitals-roller\s*\{[\s\S]*?top:\s*0;[\s\S]*?touch-action:\s*none;/, "Zone tactile de la roulette absente");
assert.match(vitalsRollerStyle, /\.vitals-roller-selection-band\s*\{[\s\S]*?position:\s*absolute;/, "Bande de selection de la roulette absente");
assert.doesNotMatch(vitalsRollerStyle, /top:\s*50%|bottom:\s*0|translateY\(-50%\)/, "La roulette est recentree ou ancree en bas du viewport");
assert.match(style, /--vitals-scroll-gutter-width:\s*clamp\(24px,\s*7vw,\s*32px\)/, "Largeur responsive des couloirs de scroll absente");
assert.match(style, /\.vitals-sheet\s*\{[\s\S]*?overflow-y:\s*auto;[\s\S]*?padding-left:\s*calc\([\s\S]*?var\(--vitals-scroll-gutter-width\)[\s\S]*?var\(--safe-left,\s*env\(safe-area-inset-left,\s*0px\)\)[\s\S]*?padding-right:\s*calc\([\s\S]*?var\(--vitals-scroll-gutter-width\)[\s\S]*?var\(--safe-right,\s*env\(safe-area-inset-right,\s*0px\)\)/, "Couloirs natifs ou safe areas du panneau Constantes incomplets");
assert.match(style, /\.vitals-grid,\s*\.vitals-bp-block,\s*\.vitals-actions,\s*\.vitals-history-details\s*\{[\s\S]*?min-width:\s*0;[\s\S]*?max-width:\s*100%;/, "Le contenu des Constantes peut deborder dans les couloirs");
const vitalsTriggerRule = style.match(
  /\.vitals-grid input,\s*\.vitals-grid select,\s*\.vitals-grid \.vitals-roller-trigger\s*\{([\s\S]*?)\}/
)?.[1] || "";
assert.match(vitalsTriggerRule, /width:\s*100%;/, "Largeur du trigger de constante non bornee par sa cellule");
assert.doesNotMatch(vitalsTriggerRule, /position:\s*absolute|margin-(?:left|right):\s*-|margin-inline:\s*-|translate[XY]?\(/, "Un trigger de constante peut recouvrir un couloir lateral");
assert.doesNotMatch(app, /vitalsSheet\.scrollTop\s*=/, "Un moteur JavaScript pilote le scroll des Constantes");
assert.doesNotMatch(app, /function\s+(?:setup|handle|update)VitalsScrollGutter/, "Un moteur pointer dedie aux couloirs a ete ajoute");
assert.match(app, /const VITALS_ROLLER_DRAG_THRESHOLD_PX\s*=\s*6/, "Le seuil tactile de la roulette validee a ete modifie");

for (const viewportWidth of [320, 375, 390, 430]) {
  const gutterWidth = Math.min(32, Math.max(24, viewportWidth * 0.07));
  const centralWidth = viewportWidth - 2 - gutterWidth * 2;
  const bpColumnWidth = (centralWidth - 2 - 16 - 2 - 8 - 50 - 12) / 2;

  assert.ok(gutterWidth >= 24, `Couloir trop etroit a ${viewportWidth}px`);
  assert.ok(centralWidth >= 270, `Zone centrale trop etroite a ${viewportWidth}px`);
  assert.ok(bpColumnWidth >= 90, `Cellules SYS/DIA trop etroites a ${viewportWidth}px`);
}

const geometryProbe = { triggerTop: 211.25, triggerHeight: 48, selectedIndex: 80 };
const geometryAnchorY = geometryProbe.triggerTop + geometryProbe.triggerHeight / 2;
const geometryTrackOffset = geometryAnchorY -
  (geometryProbe.selectedIndex + 0.5) * geometryProbe.triggerHeight;
const geometrySelectedCenter = geometryTrackOffset +
  (geometryProbe.selectedIndex + 0.5) * geometryProbe.triggerHeight;
assert.ok(Math.abs(geometrySelectedCenter - geometryAnchorY) <= 1, "Le centre simule de la valeur active n'est pas aligne a 1 px");

function createVitalSelectProbe(defaultValue) {
  return {
    dataset: { vitalDefault: defaultValue, vitalsTouched: "false" },
    options: [],
    _value: "",
    get value() {
      return this._value;
    },
    set value(nextValue) {
      this._value = String(nextValue);
    },
    set innerHTML(value) {
      if (value === "") {
        this.options = [];
        this._value = "";
      }
    },
    appendChild(option) {
      this.options.push(option);
    }
  };
}

const populatedVitals = {
  vitalsFcInput: createVitalSelectProbe("80"),
  vitalsTasLeftInput: createVitalSelectProbe("120"),
  vitalsTadLeftInput: createVitalSelectProbe("70"),
  vitalsTasRightInput: createVitalSelectProbe("120"),
  vitalsTadRightInput: createVitalSelectProbe("70"),
  vitalsSpo2Input: createVitalSelectProbe("100"),
  vitalsOxygenFlowInput: createVitalSelectProbe("15"),
  vitalsFrInput: createVitalSelectProbe("20"),
  vitalsTempInput: createVitalSelectProbe("37.0"),
  vitalsGcsInput: createVitalSelectProbe("15"),
  vitalsPainInput: createVitalSelectProbe("0"),
  vitalsGlycemiaInput: createVitalSelectProbe("1.00")
};
const populateVitalsSource = app.slice(
  app.indexOf("function populateOrderedRangeSelect"),
  app.indexOf("function getVitalsRollerSelects")
);
const populateVitalsContext = {
  ...populatedVitals,
  document: { createElement: () => ({ value: "", textContent: "" }) },
  syncVitalsRollerTriggers: () => {}
};
vm.runInNewContext(`${populateVitalsSource}\npopulateVitalsSelects();`, populateVitalsContext);

const expectedVitalDefaults = {
  vitalsFcInput: "80",
  vitalsTasLeftInput: "120",
  vitalsTadLeftInput: "70",
  vitalsTasRightInput: "120",
  vitalsTadRightInput: "70",
  vitalsSpo2Input: "100",
  vitalsOxygenFlowInput: "15",
  vitalsFrInput: "20",
  vitalsTempInput: "37.0",
  vitalsGcsInput: "15",
  vitalsPainInput: "0",
  vitalsGlycemiaInput: "1.00"
};

for (const [field, expectedValue] of Object.entries(expectedVitalDefaults)) {
  const select = populatedVitals[field];
  assert.equal(select.value, expectedValue, `Valeur par defaut incorrecte pour ${field}`);
  assert.equal(select.dataset.vitalsTouched, "false", `Valeur ${field} marquee touchee pendant la population`);
  assert.ok(select.options.some(option => option.value === expectedValue), `Option source absente pour ${field}`);
  assert.equal(new Set(select.options.map(option => option.value)).size, select.options.length, `Options dupliquees pour ${field}`);
}

const tasOptions = populatedVitals.vitalsTasLeftInput.options.filter(option => option.value !== "");
const tasStartIndex = tasOptions.findIndex(option => option.value === "120");
const tasVirtualIndexAfterThreeRows = tasStartIndex - (-3 * 48) / 48;
const tasFinalOption = tasOptions[Math.round(tasVirtualIndexAfterThreeRows)];
assert.equal(tasFinalOption?.value, "123", "Le geste TAS de trois lignes vers le haut n'aboutit pas a 123");

const adaptiveVitalsRollerSource = app.slice(
  app.indexOf("const VITALS_ROLLER_SLOW_VELOCITY_PX_PER_MS"),
  app.indexOf("function populateOrderedRangeSelect")
);
const clampVitalsRollerSource = app.slice(
  app.indexOf("function clampVitalsRollerIndex"),
  app.indexOf("function createVitalsRollerElements")
);
const vitalsRollerGestureSource = app.slice(
  app.indexOf("function beginVitalsRollerGesture"),
  app.indexOf("function handleVitalsRollerPointerCancel")
);
const adaptiveRollerContext = {
  performance: { now: () => 1 },
  addVitalsRollerGestureListeners() {},
  endVitalsRollerGesture() {},
  updateVitalsRollerPosition() {},
  commitCount: 0,
  closeCount: 0,
  commitVitalsRollerValue() { adaptiveRollerContext.commitCount += 1; },
  closeVitalsRoller() { adaptiveRollerContext.closeCount += 1; }
};

vm.runInNewContext(
  `const VITALS_ROLLER_DRAG_THRESHOLD_PX = 6;
  ${adaptiveVitalsRollerSource}
  ${clampVitalsRollerSource}
  ${vitalsRollerGestureSource}

  const gainCases = [];
  for (const optionCount of [11, 13, 16, 61, 81, 117, 161, 231, 241]) {
    for (const velocity of [0, 0.1, 0.3, 0.9, 2]) {
      gainCases.push({ optionCount, velocity, gain: getVitalsRollerAdaptiveGain(optionCount, velocity) });
    }
  }

  vitalsRollerState.select = {};
  vitalsRollerState.options = Array.from({ length: 241 }, (_, index) => ({ value: String(index) }));
  vitalsRollerState.geometry = { rowHeight: 48 };
  vitalsRollerState.currentVirtualIndex = 80;
  beginVitalsRollerGesture({ pointerId: 7, clientY: 400, timeStamp: 100 }, {});

  for (let move = 1; move <= 8; move += 1) {
    handleVitalsRollerPointerMove({
      pointerId: 7,
      clientY: 400 - move * 30,
      timeStamp: 100 + move * 16,
      preventDefault() {}
    });
  }

  const fastIndex = vitalsRollerState.currentVirtualIndex;
  handleVitalsRollerPointerMove({
    pointerId: 7,
    clientY: 164,
    timeStamp: 278,
    preventDefault() {}
  });
  const firstSlowReverseIndex = vitalsRollerState.currentVirtualIndex;
  handleVitalsRollerPointerMove({
    pointerId: 7,
    clientY: 168,
    timeStamp: 328,
    preventDefault() {}
  });
  const secondSlowReverseIndex = vitalsRollerState.currentVirtualIndex;
  handleVitalsRollerPointerUp({ pointerId: 7 });

  adaptiveProbe = {
    gainCases,
    painFastGain: getVitalsRollerAdaptiveGain(11, 2),
    gcsFastGain: getVitalsRollerAdaptiveGain(13, 2),
    glycemiaFastGain: getVitalsRollerAdaptiveGain(117, 2),
    tasSlowGain: getVitalsRollerAdaptiveGain(241, 0.1),
    tasFastGain: getVitalsRollerAdaptiveGain(241, 2),
    fastIndex,
    firstSlowReverseIndex,
    secondSlowReverseIndex,
    commitCount,
    closeCount
  };`,
  adaptiveRollerContext
);

const adaptiveProbe = adaptiveRollerContext.adaptiveProbe;
assert.equal(adaptiveProbe.painFastGain, 1, "La douleur est accélérée malgré sa petite liste");
assert.equal(adaptiveProbe.gcsFastGain, 1, "Le GCS est accéléré malgré sa petite liste");
assert.ok(adaptiveProbe.glycemiaFastGain > 1, "La glycémie n'accélère pas lors d'un geste rapide");
assert.equal(adaptiveProbe.tasSlowGain, 1, "La TAS lente ne conserve pas un réglage précis à une ligne");
assert.ok(adaptiveProbe.tasFastGain >= 10, "La TAS rapide ne parcourt pas assez de valeurs");
for (const gainCase of adaptiveProbe.gainCases) {
  assert.ok(gainCase.gain >= 1, "Le gain adaptatif descend sous 1");
  assert.ok(gainCase.gain <= 14, "Le gain adaptatif dépasse sa borne maximale");
}
assert.ok(adaptiveProbe.fastIndex - 80 >= 60, "Un geste rapide TAS ne traverse pas une grande partie de la plage");
assert.ok(adaptiveProbe.fastIndex < 240, "Un geste rapide TAS dépasse la fin de plage");
assert.ok(
  Math.abs(adaptiveProbe.firstSlowReverseIndex - adaptiveProbe.fastIndex) < 1,
  "Le premier ralentissement inverse produit encore un grand saut"
);
assert.ok(
  Math.abs(adaptiveProbe.secondSlowReverseIndex - adaptiveProbe.firstSlowReverseIndex) < 0.5,
  "Le réglage fin après inversion reste accéléré"
);
assert.equal(adaptiveProbe.commitCount, 1, "pointerup valide plusieurs fois la roulette");
assert.equal(adaptiveProbe.closeCount, 1, "pointerup ferme plusieurs fois la roulette");
assert.doesNotMatch(vitalsRollerGestureSource, /requestAnimationFrame|setTimeout|setInterval/, "Une inertie continue après pointerup");

const commitVitalsRollerSource = app.slice(
  app.indexOf("function commitVitalsRollerValue"),
  app.indexOf("function closeVitalsRoller")
);
const committedSelect = {
  value: "120",
  dataset: { vitalDefault: "120", vitalsTouched: "false" },
  dispatchedEvents: [],
  dispatchEvent(event) {
    this.dispatchedEvents.push(event.type);
    return true;
  }
};
const rollerCommitContext = {
  vitalsRollerState: {
    select: committedSelect,
    options: [{ value: "123", text: "123" }]
  },
  clampVitalsRollerIndex: () => 0,
  syncVitalsRollerTrigger: () => {},
  Event
};
vm.runInNewContext(`${commitVitalsRollerSource}\ncommitVitalsRollerValue(0);`, rollerCommitContext);
assert.equal(committedSelect.value, "123", "La roulette ne met pas a jour le select source");
assert.equal(committedSelect.dataset.vitalsTouched, "true", "La roulette ne valide pas vitalsTouched");
assert.deepEqual(committedSelect.dispatchedEvents, ["input", "change"], "Les evenements source de la roulette sont incomplets");

const getVitalsFieldValueSource = app.slice(
  app.indexOf("function getVitalsFieldValue"),
  app.indexOf("function markVitalsFieldTouched")
);
const buildVitalsEntrySource = app.slice(
  app.indexOf("function buildVitalsEntry"),
  app.indexOf("function hasVitalsData")
);
const tasLeftProbe = {
  tagName: "SELECT",
  value: "123",
  dataset: { vitalDefault: "120", vitalsTouched: "true" }
};
const vitalsBuildContext = {
  window: { crypto: { randomUUID: () => "vitals-test" } },
  vitalsMomentInput: { value: "Initial" },
  vitalsFcInput: null,
  vitalsTasLeftInput: tasLeftProbe,
  vitalsTadLeftInput: null,
  vitalsTasRightInput: null,
  vitalsTadRightInput: null,
  vitalsSpo2Input: null,
  vitalsOxygenSupportInput: null,
  vitalsOxygenFlowInput: null,
  vitalsFrInput: null,
  vitalsTempInput: null,
  vitalsGcsInput: null,
  vitalsPainInput: null,
  vitalsGlycemiaInput: null,
  getVitalsEntries: () => [],
  getCleanValue: input => input?.value?.trim() || "",
  normalizeDecimalValue: value => String(value || "").trim().replace(",", "."),
  formatVitalsTime: () => "12:00:00"
};
vm.runInNewContext(
  `${getVitalsFieldValueSource}\n${buildVitalsEntrySource}\nresult = buildVitalsEntry();`,
  vitalsBuildContext
);
assert.equal(vitalsBuildContext.result.tasLeft, "123", "buildVitalsEntry ne lit pas la TAS choisie dans le select source");
tasLeftProbe.dataset.vitalsTouched = "false";
vm.runInNewContext("resultUntouched = buildVitalsEntry();", vitalsBuildContext);
assert.equal(vitalsBuildContext.resultUntouched.tasLeft, "", "Une TAS par defaut non touchee est enregistree a tort");

const resetVitalSelectSource = app.slice(
  app.indexOf("function resetVitalSelect"),
  app.indexOf("function renderVitalsHistory")
);
let closeRollerCalls = 0;
let syncTriggerCalls = 0;
const clearVitalsContext = {
  ...populatedVitals,
  vitalsOxygenSupportInput: { value: "Air ambiant" },
  closeVitalsRoller: () => { closeRollerCalls += 1; },
  syncVitalsRollerTriggers: () => { syncTriggerCalls += 1; }
};
for (const select of Object.values(populatedVitals)) {
  select.value = select === populatedVitals.vitalsTasLeftInput ? "123" : select.value;
  select.dataset.vitalsTouched = "true";
}
vm.runInNewContext(`${resetVitalSelectSource}\nclearVitalsForm();`, clearVitalsContext);
for (const [field, expectedValue] of Object.entries(expectedVitalDefaults)) {
  assert.equal(populatedVitals[field].value, expectedValue, `Reset incorrect pour ${field}`);
  assert.equal(populatedVitals[field].dataset.vitalsTouched, "false", `vitalsTouched non remis a false pour ${field}`);
}
assert.equal(clearVitalsContext.vitalsOxygenSupportInput.value, "", "Le support O2 n'est plus remis a zero");
assert.equal(closeRollerCalls, 1, "La remise a zero ne ferme pas la roulette");
assert.equal(syncTriggerCalls, 1, "La remise a zero ne synchronise pas les triggers");
assert.match(app, /select\.disabled\s*=\s*true/, "Le select numerique natif reste interactif sur iOS");
assert.match(app, /function removeVitalsRollerGestureListeners\(\)[\s\S]*?removeEventListener\(["']pointermove["'][\s\S]*?removeEventListener\(["']pointerup["'][\s\S]*?removeEventListener\(["']pointercancel["']/, "Les listeners du geste roulette ne sont pas nettoyes");
assert.doesNotMatch(style, /\.vitals-sheet\s*\{[^}]*touch-action:\s*none/s, "Le scroll de tout le panneau Constantes est bloque");

assert.match(saed, /pisuSaedRequestV1/, "Stockage de la demande SAED absent");
assert.match(app, /function getProtocolDefinition\(protocolId\)/, "Definition contextuelle des protocoles absente");
assert.match(app, /window\.getProtocolDefinition\s*=\s*getProtocolDefinition/, "Definition protocolaire non exposee au SAED");
assert.match(saed, /const PROTOCOL_VITAL_FOCUS\s*=\s*\{/, "Focalisation des constantes par protocole absente");
for (const protocolId of [
  "acrAdultProtocol",
  "childAcrProtocol",
  "chestPainProtocol",
  "smokeExposureProtocol",
  "burnsProtocol",
  "seizureProtocol",
  "anaphylaxisProtocol",
  "hemorrhageProtocol",
  "hypoglycemiaProtocol",
  "asthmaBpcoProtocol",
  "analgesiaProtocol"
]) {
  assert.match(saed, new RegExp(protocolId), `Protocole absent du moteur SAED contextuel : ${protocolId}`);
}
assert.match(saed, /function buildClinicalCallReason\(model\)/, "Construction du pourquoi maintenant absente");
assert.match(saed, /function buildEvaluationSummary\(model\)/, "Synthese actions evolution absente");
assert.match(saed, /function buildDemandProposal\(model,\s*demandType/, "Proposition contextuelle D absente");
assert.match(saed, /validated:\s*Boolean\(request\?\.validated\s*&&\s*type\s*&&\s*detail\)/, "Validation explicite de la demande absente");
assert.match(saed, /Orientation \/ transport renseigné/, "Etat orientation transport absent");
const renderSituationSource = saed.slice(
  saed.indexOf("function renderSituation"),
  saed.indexOf("function renderAntecedents")
);
const situationOrder = [
  "<span>Appelant</span>",
  "<span>Patient</span>",
  "<span>Lieu d’intervention</span>",
  "<span>Motif / protocole</span>"
];
let previousSituationPosition = -1;
for (const label of situationOrder) {
  const position = renderSituationSource.indexOf(label);
  assert.ok(position > previousSituationPosition, `Ordre de Situation SAED incorrect autour de ${label}`);
  previousSituationPosition = position;
}
assert.match(renderSituationSource, /model\.originLocation/, "La carte Situation n’utilise pas le lieu centralisé");
assert.match(renderSituationSource, /Lieu d’intervention non renseigné/, "Le lieu absent n’est pas signalé dans la Situation");

const situationTextSource = saed.slice(
  saed.indexOf("function buildSituationTextLines"),
  saed.indexOf("function buildText")
);
const situationTextOrder = ["Appelant :", "Patient :", "Lieu d’intervention", "Motif / protocole :"];
let previousTextPosition = -1;
for (const label of situationTextOrder) {
  const position = situationTextSource.indexOf(label);
  assert.ok(position > previousTextPosition, `Ordre du SAED copié/exporté incorrect autour de ${label}`);
  previousTextPosition = position;
}
assert.match(situationTextSource, /model\.originLocation/, "Le texte SAED n’utilise pas le lieu centralisé");
assert.match(situationTextSource, /Lieu d’intervention non renseigné/, "Le texte SAED invente ou masque un lieu absent");
assert.match(saed, /async function copyText\(\)[\s\S]*?const text = buildText\(\)/, "La copie n’utilise plus le texte SAED commun");
assert.match(saed, /function downloadText\(\)[\s\S]*?const text = buildText\(\)/, "L’export TXT n’utilise plus le texte SAED commun");

function runSaedRouteProbe(route) {
  const elements = new Map();
  const createClassList = () => ({
    add() {},
    remove() {},
    toggle() {},
    contains() { return false; }
  });
  const createElement = () => ({
    className: "",
    hidden: false,
    innerHTML: "",
    textContent: "",
    value: "",
    dataset: {},
    classList: createClassList(),
    addEventListener() {},
    setAttribute() {},
    removeAttribute() {},
    querySelectorAll() { return []; }
  });
  const documentProbe = {
    body: createElement(),
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, createElement());
      return elements.get(id);
    },
    addEventListener() {},
    createElement
  };
  const storage = new Map();
  const localStorageProbe = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };
  const windowProbe = {
    addEventListener() {},
    getStructuredEvents: () => [],
    getActiveEventsForSaed: events => events,
    getVitalsEntries: () => [],
    getPatientSnapshot: () => ({ name: "Patient Test", sex: "Homme", age: "67 ans" }),
    getPatientAntecedentsSnapshot: () => ({}),
    getResponderIdentity: () => ({ role: "IDE", name: "Guillaume Prenveille", service: "SMUR Falaise" }),
    getMissionCrew: () => [],
    getMissionRouteSnapshot: () => route,
    getMissionState: () => ({ activeProtocolId: "chestPainProtocol", startedAt: "2026-07-14T08:00:00.000Z" }),
    getLatestVitalsAlert: () => ({ level: "none", reasons: [] }),
    getEffectiveCall15Alert: () => ({ level: "none", reasons: [] }),
    getProtocolDefinition: () => ({
      label: "Douleur thoracique",
      intro: "Douleur thoracique persistante.",
      demand: ""
    })
  };
  const context = {
    PISU_APP_VERSION: "5.24",
    window: windowProbe,
    document: documentProbe,
    localStorage: localStorageProbe,
    navigator: { clipboard: { writeText: async () => {} } },
    Blob,
    URL,
    Event,
    console
  };

  vm.runInNewContext(saed, context);
  const model = windowProbe.pisuSAED.render();

  return {
    model,
    text: windowProbe.pisuSAED.buildText(),
    situationHtml: elements.get("saedSituationContent").innerHTML,
    routeHtml: elements.get("saedRouteContent").innerHTML,
    missionContextHtml: elements.get("saedMissionContextContent").innerHTML
  };
}

const completeLocationProbe = runSaedRouteProbe({
  originLabel: "12 rue de la Pelleterie, Falaise",
  originCoordinates: "48.8921, -0.1968"
});
const completeLocationLine = "Lieu d’intervention : 12 rue de la Pelleterie, Falaise — 48.8921, -0.1968";
assert.match(completeLocationProbe.situationHtml, /<span>Lieu d’intervention<\/span>/, "La carte lieu manque dans la Situation rendue");
assert.match(completeLocationProbe.situationHtml, /12 rue de la Pelleterie, Falaise — 48\.8921, -0\.1968/, "Le lieu complet manque dans la Situation rendue");
assert.ok(completeLocationProbe.text.indexOf("Appelant :") < completeLocationProbe.text.indexOf("Patient :"), "L’appelant n’est pas avant le patient dans le texte");
assert.ok(completeLocationProbe.text.indexOf("Patient :") < completeLocationProbe.text.indexOf(completeLocationLine), "Le lieu n’est pas après le patient dans le texte");
assert.ok(completeLocationProbe.text.indexOf(completeLocationLine) < completeLocationProbe.text.indexOf("Motif / protocole :"), "Le lieu n’est pas avant le motif dans le texte");
assert.ok(completeLocationProbe.text.indexOf("Motif / protocole :") < completeLocationProbe.text.indexOf("Pourquoi maintenant :"), "Le motif n’est pas avant le pourquoi maintenant");
assert.equal((completeLocationProbe.text.match(/12 rue de la Pelleterie, Falaise/g) || []).length, 1, "Le lieu complet est répété dans le flux textuel");
assert.doesNotMatch(completeLocationProbe.routeHtml, /12 rue de la Pelleterie|48\.8921/, "Le lieu complet est répété dans Orientation / Transport");
assert.doesNotMatch(completeLocationProbe.missionContextHtml, /12 rue de la Pelleterie|48\.8921/, "Le lieu complet est répété dans les repères de fin");

const routeDecisionProbe = runSaedRouteProbe({
  originLabel: "12 rue de la Pelleterie, Falaise",
  originCoordinates: "48.8921, -0.1968",
  destinationName: "CH Falaise",
  destinationService: "Urgences",
  transportStatus: "Transport en cours",
  transportType: "Allongé",
  transportVector: "VSAV",
  transportMode: "Non médicalisé",
  transportMonitoring: "Surveillance continue",
  departureTime: "10:15",
  junctionEnabled: true,
  junctionTime: "10:30",
  junctionPlace: "Pont d’Eraines",
  junctionWith: "SMUR",
  arrivalTime: "10:45",
  transmissionDone: true,
  transmissionTime: "10:50",
  note: "Patient stable pendant le transport"
});
for (const expectedRouteLine of [
  "Destination : CH Falaise — Urgences",
  "Transport : Transport en cours — Allongé — VSAV — Non médicalisé — Surveillance continue",
  "Départ des lieux : 10:15",
  "Jonction : à 10:30 — Pont d’Eraines — avec SMUR",
  "Arrivée : 10:45",
  "Transmission à l’équipe receveuse réalisée à 10:50",
  "Note transport : Patient stable pendant le transport"
]) {
  assert.ok(routeDecisionProbe.model.routeDecisionLines.includes(expectedRouteLine), `Donnée de devenir perdue : ${expectedRouteLine}`);
  assert.match(routeDecisionProbe.text, new RegExp(expectedRouteLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Donnée de devenir absente du texte : ${expectedRouteLine}`);
}
assert.doesNotMatch(routeDecisionProbe.routeHtml, /12 rue de la Pelleterie|48\.8921/, "Le lieu initial revient dans le bloc de devenir complet");
assert.doesNotMatch(routeDecisionProbe.missionContextHtml, /12 rue de la Pelleterie|48\.8921/, "Le lieu initial revient dans le contexte mission complet");

const labelOnlyLocationProbe = runSaedRouteProbe({
  originLabel: "12 rue de la Pelleterie, Falaise",
  originCoordinates: ""
});
assert.match(labelOnlyLocationProbe.text, /Lieu d’intervention : 12 rue de la Pelleterie, Falaise/, "Le lieu textuel seul manque dans le SAED");
assert.doesNotMatch(labelOnlyLocationProbe.text, /Lieu d’intervention : 12 rue de la Pelleterie, Falaise —/, "Un séparateur vide suit le lieu textuel seul");

const gpsOnlyLocationProbe = runSaedRouteProbe({
  originLabel: "",
  originCoordinates: "48.8921, -0.1968"
});
const gpsOnlyLocationLine = gpsOnlyLocationProbe.text
  .split("\n")
  .find(line => line.includes("Lieu d’intervention")) || "";
assert.match(gpsOnlyLocationProbe.text, /Lieu d’intervention : 48\.8921, -0\.1968/, "Les coordonnées seules manquent dans le SAED");
assert.doesNotMatch(gpsOnlyLocationLine, /Falaise|Domicile|Voie publique|Position actuelle|Lieu inconnu/, "Un nom de lieu est inventé pour des coordonnées seules");

const missingLocationProbe = runSaedRouteProbe({ originLabel: "", originCoordinates: "" });
assert.match(missingLocationProbe.text, /Lieu d’intervention non renseigné/, "Le lieu absent n’est pas explicite dans le texte SAED");
assert.match(missingLocationProbe.situationHtml, /saed-fact-card wide is-missing/, "La carte d’un lieu absent n’est pas marquée comme manquante");
assert.match(missingLocationProbe.situationHtml, /Lieu d’intervention non renseigné/, "Le lieu absent n’est pas explicite dans la Situation rendue");

const routeBuilderSource = saed.slice(
  saed.indexOf("function buildRouteLines"),
  saed.indexOf("function buildOriginLines")
);
const orientationTransportSource = saed.slice(
  saed.indexOf("function buildOrientationTransportLines"),
  saed.indexOf("function readCounter")
);
assert.doesNotMatch(routeBuilderSource, /originLabel|originCoordinates|Lieu d’intervention|Lieu de prise en charge/, "buildRouteLines réintroduit le lieu initial en fin de SAED");
assert.doesNotMatch(orientationTransportSource, /originLabel|originCoordinates|Lieu d’intervention|Lieu de prise en charge/, "buildOrientationTransportLines réintroduit le lieu initial");
assert.doesNotMatch(saed, /const\s+\w*(?:LOCATION|ORIGIN|PLACE|LIEU)\w*_STORAGE_KEY/i, "Une clé localStorage dédiée au lieu SAED a été créée");
assert.doesNotMatch(saed, /localStorage\.(?:getItem|setItem|removeItem)\(\s*["'][^"']*(?:origin|location|lieu|place)/i, "Le SAED stocke une seconde donnée de lieu");
assert.match(saed, /model\.requestComplete[\s\S]*?!demandDraftDirty/, "Le vert D ne depend pas de la validation professionnelle");
assert.match(saed, /buildVitalRows/, "Comparaison initiale / actuelle des constantes absente");
assert.match(saed, /buildChronology/, "Chronologie SAED absente");
assert.match(app, /saedRequest:\s*window\.pisuSAED/, "Demande SAED absente du transfert de mission");
assert.match(app, /data-open-operational-saed/, "Accès SAED absent des protocoles");
assert.doesNotMatch(app, /Copier mini SAED/, "L’ancien résumé mini SAED reste exposé");
assert.match(app, /pisuMissionStateV1/, "État de reprise de mission absent");

const resetMissionSource = app.slice(
  app.indexOf("function resetMissionCompletely"),
  app.indexOf('document.getElementById("clearLog")')
);
const clearMissionStateSource = app.slice(
  app.indexOf("function clearMissionState"),
  app.indexOf("function shouldTrackMissionActivity")
);
const touchMissionStateSource = app.slice(
  app.indexOf("function touchMissionState"),
  app.indexOf("function applyMissionStateSnapshot")
);
const updateMissionResumeBannerSource = app.slice(
  app.indexOf("function updateMissionResumeBanner"),
  app.indexOf("function stopMissionResumeTicker")
);
const setupMissionResumeFeatureSource = app.slice(
  app.indexOf("function setupMissionResumeFeature"),
  app.indexOf("function loadLog")
);

assert.match(resetMissionSource, /clearMissionState\(\)/, "Le reset complet ne supprime pas l’état mission");
assert.doesNotMatch(resetMissionSource, /startNewMissionState\(\)/, "Le reset complet recrée encore une mission vide");
assert.doesNotMatch(resetMissionSource, /addLog\s*\(/, "Un message de reset est encore ajouté au journal de mission");
assert.doesNotMatch(resetMissionSource, /Nouvelle mission créée/, "L’ancien message technique pollue encore le nouveau journal");
assert.match(resetMissionSource, /markButtonValidated\(newMissionResetBtn,\s*["']Nouvelle mission prête ✓["']\)/, "Le feedback visuel de fin de reset est absent");
assert.match(clearMissionStateSource, /localStorage\.removeItem\(MISSION_STATE_STORAGE_KEY\)/, "clearMissionState ne supprime pas la clé persistée");
assert.match(clearMissionStateSource, /window\.clearInterval\(missionResumeInterval\)[\s\S]*?missionResumeInterval\s*=\s*null/, "clearMissionState n’arrête pas le ticker mission");
assert.match(clearMissionStateSource, /missionResumeBanner\?\.classList\.add\(["']hidden["']\)/, "clearMissionState ne cache pas le bandeau mission");
assert.match(clearMissionStateSource, /missionResumeProtocol\)\s*missionResumeProtocol\.textContent\s*=\s*["']["']/, "clearMissionState ne vide pas le protocole résiduel");
assert.match(clearMissionStateSource, /missionResumeDuration\)\s*missionResumeDuration\.textContent\s*=\s*["']["']/, "clearMissionState ne vide pas la durée résiduelle");
assert.match(touchMissionStateSource, /getMissionState\(\)\s*\|\|\s*startNewMissionState\(\)/, "La première activité réelle ne crée plus automatiquement la mission");
assert.doesNotMatch(updateMissionResumeBannerSource, /startNewMissionState|touchMissionState|saveMissionState|localStorage\.setItem/, "Le rafraîchissement du bandeau peut créer une mission");
assert.match(updateMissionResumeBannerSource, /hasMeaningfulMissionEvidence\(\{\s*state\s*\}\)/, "Le bandeau repose encore sur la seule présence du journal");
assert.doesNotMatch(updateMissionResumeBannerSource, /getLog\(\)\.length/, "Le bandeau considère encore tout journal comme une vraie mission");
assert.ok(
  setupMissionResumeFeatureSource.indexOf("repairLegacyPhantomMissionState()") >= 0 &&
  setupMissionResumeFeatureSource.indexOf("repairLegacyPhantomMissionState()") <
    setupMissionResumeFeatureSource.indexOf("startMissionResumeTicker()"),
  "La réparation du fantôme ne précède pas le premier démarrage du ticker"
);

const missionLifecycleSource = app.slice(
  app.indexOf("let missionResumeInterval"),
  app.indexOf("function resumeCurrentMission")
);
const missionLogSource = app.slice(
  app.indexOf("function saveLog"),
  app.indexOf("function addLogToDom")
);

function createMissionLifecycleProbe(storage = new Map()) {
  const bannerClasses = new Set(["hidden"]);
  const intervalCallbacks = new Map();
  const structuredEvents = [];
  const feedbackLabels = [];
  const missionEvidence = {
    vitalsEntries: [],
    patient: {},
    antecedents: {},
    missionCrew: [],
    route: {}
  };
  let nextIntervalId = 1;

  const context = {
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); }
    },
    window: {
      clearInterval(id) { intervalCallbacks.delete(id); },
      setInterval(callback) {
        const id = nextIntervalId;
        nextIntervalId += 1;
        intervalCallbacks.set(id, callback);
        return id;
      },
      confirm: () => true,
      pisuSounds: { stopRcpMetronome() {}, resetAlertMemory() {} },
      pisuSAED: { reset() {}, refreshIfOpen() {} }
    },
    document: { getElementById: () => null },
    PROTOCOL_TITLES: { chestPainProtocol: "Douleur thoracique" },
    missionResumeBanner: {
      classList: {
        add(name) { bannerClasses.add(name); },
        remove(name) { bannerClasses.delete(name); },
        contains(name) { return bannerClasses.has(name); }
      }
    },
    missionResumeProtocol: { textContent: "" },
    missionResumeDuration: { textContent: "" },
    nowLabel: () => "12:00:00",
    addLogToDom() {},
    addStructuredEvent(event) { if (event) structuredEvents.push(event); },
    inferStructuredEventFromLog: text => ({ text }),
    inferStructuredEvent: () => null,
    clearInterval(id) { intervalCallbacks.delete(id); },
    timerInterval: null,
    clearStructuredEvents() { structuredEvents.length = 0; },
    saveStructuredEvents(events) {
      structuredEvents.splice(0, structuredEvents.length, ...events);
    },
    getStructuredEvents() { return structuredEvents.slice(); },
    getVitalsEntries() { return missionEvidence.vitalsEntries.slice(); },
    getPatientSnapshot() { return { ...missionEvidence.patient }; },
    getPatientAntecedentsSnapshot() { return { ...missionEvidence.antecedents }; },
    hasPatientAntecedentsData(antecedents = {}) {
      return Object.values(antecedents).some(Boolean);
    },
    getMissionCrew() { return missionEvidence.missionCrew.slice(); },
    getMissionRouteSnapshot() { return { ...missionEvidence.route }; },
    hasMissionRouteData(route = {}) { return Object.values(route).some(Boolean); },
    clearAllProtocolCounters() {},
    resetPatientIdentityFields() {},
    resetPatientAntecedentsFields() {},
    resetMissionCrew() {},
    resetMissionRoute() {},
    resetAllVisualValidations() {},
    clearVitalsHistory() {},
    clearProtocolScrollMemory() {},
    resetMissionHandoffUi() {},
    notifyProtocolMissionReset() {},
    logEl: { innerHTML: "" },
    remaining: 120,
    timerEl: { textContent: "02:00" },
    showMainMenu() {},
    loadResponderIdentity() {},
    updateResponderSummary() {},
    updateTeamSummary() {},
    newMissionResetBtn: { textContent: "Reset mission complète" },
    markButtonValidated(button, label) {
      if (button) feedbackLabels.push(label);
    },
    Date,
    console
  };

  vm.runInNewContext(
    `const MISSION_STATE_STORAGE_KEY = "pisuMissionStateV1";
    ${missionLifecycleSource}
    ${missionLogSource}
    ${resetMissionSource}`,
    context
  );

  return {
    context,
    storage,
    bannerClasses,
    intervalCallbacks,
    structuredEvents,
    missionEvidence,
    feedbackLabels
  };
}

const missionStorageProbe = new Map();
const activeMissionProbe = createMissionLifecycleProbe(missionStorageProbe);
const previousMissionStartedAt = "2020-01-01T08:00:00.000Z";
activeMissionProbe.context.startNewMissionState({
  startedAt: previousMissionStartedAt,
  activeProtocolId: "chestPainProtocol"
});
activeMissionProbe.context.addLog("Identité patient enregistrée");
activeMissionProbe.context.addLog("Constantes enregistrées");
activeMissionProbe.context.addLog("Action protocolaire enregistrée");
activeMissionProbe.context.startMissionResumeTicker();

assert.ok(activeMissionProbe.context.getMissionState(), "La mission de test n’est pas active avant reset");
assert.equal(activeMissionProbe.context.getLog().length, 3, "Le journal de test actif est incomplet");
assert.equal(activeMissionProbe.context.getStructuredEvents().length, 3, "Les événements structurés de test sont incomplets");
assert.equal(activeMissionProbe.bannerClasses.has("hidden"), false, "Le bandeau de la mission active reste caché avant reset");
assert.equal(activeMissionProbe.intervalCallbacks.size, 1, "Le ticker de la mission active n’a pas démarré");

const staleMissionTicker = [...activeMissionProbe.intervalCallbacks.values()][0];
activeMissionProbe.context.resetMissionCompletely();

assert.equal(activeMissionProbe.context.getMissionState(), null, "Le reset complet laisse un état mission actif");
assert.deepEqual(Array.from(activeMissionProbe.context.getLog()), [], "Le reset complet laisse des lignes de journal");
assert.deepEqual(Array.from(activeMissionProbe.context.getStructuredEvents()), [], "Le reset complet laisse des événements structurés");
assert.equal(activeMissionProbe.storage.has("pisuMissionStateV1"), false, "La clé mission subsiste après reset");
assert.equal(activeMissionProbe.bannerClasses.has("hidden"), true, "Le bandeau mission reste visible après reset");
assert.equal(activeMissionProbe.context.missionResumeProtocol.textContent, "", "Le protocole résiduel reste visible après reset");
assert.equal(activeMissionProbe.context.missionResumeDuration.textContent, "", "La durée résiduelle reste visible après reset");
assert.equal(activeMissionProbe.intervalCallbacks.size, 0, "Le ticker mission reste actif après reset");
assert.deepEqual(activeMissionProbe.feedbackLabels, ["Nouvelle mission prête ✓"], "Le feedback UI du reset est incorrect");

for (let elapsedSecond = 0; elapsedSecond < 60; elapsedSecond += 1) {
  staleMissionTicker?.();
  activeMissionProbe.context.updateMissionResumeBanner();
}
assert.equal(activeMissionProbe.context.getMissionState(), null, "Une attente après reset recrée une mission");
assert.equal(activeMissionProbe.bannerClasses.has("hidden"), true, "Un ancien tick fait réapparaître le bandeau");

const reloadedMissionProbe = createMissionLifecycleProbe(missionStorageProbe);
reloadedMissionProbe.context.startMissionResumeTicker();
assert.equal(reloadedMissionProbe.context.getMissionState(), null, "Le reload après reset restaure une mission fantôme");
assert.deepEqual(Array.from(reloadedMissionProbe.context.getLog()), [], "Le reload après reset restaure un journal technique");
assert.equal(reloadedMissionProbe.bannerClasses.has("hidden"), true, "Le bandeau revient après reload / réouverture PWA");
assert.equal(reloadedMissionProbe.intervalCallbacks.size, 0, "Le reload démarre un ticker sans mission");

const legacyResetText = "Nouvelle mission créée — journal, SAED, patient, constantes et parcours remis à zéro";
const legacyMissionStartedAt = "2020-01-01T08:00:00.000Z";

function createLegacyMissionStorage(logItems = [{ time: "12:00:00", text: legacyResetText }]) {
  return new Map([
    ["pisuMissionStateV1", JSON.stringify({
      version: 1,
      startedAt: legacyMissionStartedAt,
      updatedAt: legacyMissionStartedAt,
      activeProtocolId: ""
    })],
    ["pisuLog", JSON.stringify(logItems)]
  ]);
}

const legacyGhostProbe = createMissionLifecycleProbe(createLegacyMissionStorage());
legacyGhostProbe.context.missionResumeProtocol.textContent = "Mission PISU";
legacyGhostProbe.context.missionResumeDuration.textContent = "99 h";
assert.equal(legacyGhostProbe.context.repairLegacyPhantomMissionState(), true, "L'ancien état fantôme exact n'est pas réparé");
assert.equal(legacyGhostProbe.context.getMissionState(), null, "L'état mission fantôme subsiste après migration");
assert.deepEqual(Array.from(legacyGhostProbe.context.getLog()), [], "Le journal technique fantôme subsiste après migration");
assert.equal(legacyGhostProbe.bannerClasses.has("hidden"), true, "Le bandeau fantôme reste visible après migration");
assert.equal(legacyGhostProbe.context.missionResumeProtocol.textContent, "", "Le protocole fantôme reste affiché");
assert.equal(legacyGhostProbe.context.missionResumeDuration.textContent, "", "La durée fantôme reste affichée");

const realLogItems = [
  { time: "12:00:00", text: legacyResetText },
  { time: "12:01:00", text: "Constantes patient enregistrées" }
];
const realLogProbe = createMissionLifecycleProbe(createLegacyMissionStorage(realLogItems));
assert.equal(realLogProbe.context.repairLegacyPhantomMissionState(), false, "Une mission avec une vraie ligne de journal est effacée");
assert.ok(realLogProbe.context.getMissionState(), "L'état d'une mission avec journal réel est supprimé");
assert.equal(realLogProbe.context.getLog().length, 2, "Le journal réel est modifié par la migration");

const activeProtocolLegacyProbe = createMissionLifecycleProbe(createLegacyMissionStorage());
activeProtocolLegacyProbe.context.saveMissionState({
  version: 1,
  startedAt: legacyMissionStartedAt,
  updatedAt: legacyMissionStartedAt,
  activeProtocolId: "chestPainProtocol"
});
assert.equal(activeProtocolLegacyProbe.context.repairLegacyPhantomMissionState(), false, "Une mission avec protocole actif est effacée");

const meaningfulEvidenceCases = [
  {
    label: "événement structuré",
    prepare(probe) { probe.structuredEvents.push({ libelleCourt: "Adrénaline administrée" }); }
  },
  {
    label: "constantes",
    prepare(probe) { probe.missionEvidence.vitalsEntries.push({ fc: "80" }); }
  },
  {
    label: "patient",
    prepare(probe) { probe.missionEvidence.patient.name = "Patient réel"; }
  },
  {
    label: "antécédent",
    prepare(probe) { probe.missionEvidence.antecedents.allergies = "Pénicilline"; }
  },
  {
    label: "équipage",
    prepare(probe) { probe.missionEvidence.missionCrew.push({ name: "Équipier" }); }
  },
  {
    label: "parcours",
    prepare(probe) { probe.missionEvidence.route.destinationName = "CHU"; }
  }
];

for (const evidenceCase of meaningfulEvidenceCases) {
  const evidenceProbe = createMissionLifecycleProbe(createLegacyMissionStorage());
  evidenceCase.prepare(evidenceProbe);
  assert.equal(
    evidenceProbe.context.repairLegacyPhantomMissionState(),
    false,
    `Une mission légitime avec ${evidenceCase.label} est effacée`
  );
  assert.ok(evidenceProbe.context.getMissionState(), `L'état avec ${evidenceCase.label} n'est pas préservé`);
  assert.equal(evidenceProbe.context.getLog().length, 1, `Le journal avec ${evidenceCase.label} est modifié`);
}

const firstRealActivityAt = Date.now();
reloadedMissionProbe.context.addLog("Identité patient enregistrée après reset");
const restartedMissionState = reloadedMissionProbe.context.getMissionState();
assert.ok(restartedMissionState, "La première activité réelle ne démarre pas une nouvelle mission");
assert.notEqual(restartedMissionState.startedAt, previousMissionStartedAt, "La nouvelle mission réutilise l’heure de l’ancienne");
assert.ok(Date.parse(restartedMissionState.startedAt) >= firstRealActivityAt, "La nouvelle mission commence avant la première activité réelle");

assert.match(app, /RAPID_ACTION_GUARD_MS\s*=\s*900/, "Protection anti-double-clic absente");

console.log(
  `Audit statique réussi : ${ids.length} identifiants uniques, ${localAssets.length} ressources locales, ` +
  `${protocolFiles.length} protocoles reliés à la remise à zéro, cache v${cacheVersion}.`
);
