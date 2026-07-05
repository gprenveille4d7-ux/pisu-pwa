const CACHE_NAME = "pisu-acr-cache-v1";
const CHARTER_VERSION = "2026-07-04-v1";
const CHARTER_STORAGE_KEY = "pisuUserCharterAcceptance";
const PISU_EVENTS_STORAGE_KEY = "pisuStructuredEvents";
const SAED_STRUCTURED_EXPORT_VERSION = "saed-structured-v1";
const VITALS_ALERT_STORAGE_KEY = "pisuLatestVitalsAlert";
let timerInterval = null;
let remaining = 120;
let deferredPrompt = null;

const timerEl = document.getElementById("timer");
const logEl = document.getElementById("log");
const offlineStatus = document.getElementById("offlineStatus");
const installBtn = document.getElementById("installBtn");
const appHeader = document.querySelector("body > header, header.app-header, .app-header");
const floatingBackMenuBtn = document.getElementById("floatingBackMenuBtn");
const newMissionResetBtn = document.getElementById("newMissionResetBtn");
const patientNameInput = document.getElementById("patientName");
const patientAgeInput = document.getElementById("patientAge");
const patientSexInput = document.getElementById("patientSex");
const patientWeightInput = document.getElementById("patientWeight");
const patientNoteInput = document.getElementById("patientNote");
const patientCategoryInput = document.getElementById("patientCategory");
const saveIdentityBtn = document.getElementById("saveIdentityBtn");
const unknownIdentityBtn = document.getElementById("unknownIdentityBtn");
const responderNameInput = document.getElementById("responderName");
const responderRoleInput = document.getElementById("responderRole");
const responderServiceInput = document.getElementById("responderService");
const saveResponderBtn = document.getElementById("saveResponderBtn");
const responderPanel = document.querySelector(".responder-block");
const toggleResponderBtn = document.getElementById("toggleResponderBtn");
const responderContent = document.getElementById("responderContent");
const responderSummary = document.getElementById("responderSummary");
const crewPanel = document.querySelector(".crew-block");
const toggleCrewBtn = document.getElementById("toggleCrewBtn");
const crewContent = document.getElementById("crewContent");
const crewSummary = document.getElementById("crewSummary");
const crewRosterSelect = document.getElementById("crewRosterSelect");
const crewMissionRoleInput = document.getElementById("crewMissionRole");
const addCrewToMissionBtn = document.getElementById("addCrewToMissionBtn");
const missionCrewList = document.getElementById("missionCrewList");
const crewMemberNameInput = document.getElementById("crewMemberName");
const crewMemberDefaultRoleInput = document.getElementById("crewMemberDefaultRole");
const crewMemberServiceInput = document.getElementById("crewMemberService");
const crewMemberNoteInput = document.getElementById("crewMemberNote");
const saveCrewMemberBtn = document.getElementById("saveCrewMemberBtn");
const crewRosterList = document.getElementById("crewRosterList");
const patientIdentityPanel = document.querySelector(".identity-block");
const togglePatientIdentityBtn = document.getElementById("togglePatientIdentityBtn");
const patientIdentityContent = document.getElementById("patientIdentityContent");
const patientIdentitySummary = document.getElementById("patientIdentitySummary");
const createHandoffBtn = document.getElementById("createHandoffBtn");
const showImportHandoffBtn = document.getElementById("showImportHandoffBtn");
const handoffPanel = document.querySelector(".handoff-block");
const toggleHandoffBtn = document.getElementById("toggleHandoffBtn");
const handoffContent = document.getElementById("handoffContent");
const handoffSummary = document.getElementById("handoffSummary");
const handoffBox = document.getElementById("handoffBox");
const handoffQrImage = document.getElementById("handoffQrImage");
const handoffCode = document.getElementById("handoffCode");
const copyHandoffCodeBtn = document.getElementById("copyHandoffCodeBtn");
const handoffWarning = document.getElementById("handoffWarning");
const importHandoffBox = document.getElementById("importHandoffBox");
const importHandoffCode = document.getElementById("importHandoffCode");
const confirmImportHandoffBtn = document.getElementById("confirmImportHandoffBtn");
const floatingVitalsBtn = document.getElementById("floatingVitalsBtn");
const vitalsOverlay = document.getElementById("vitalsOverlay");
const vitalsSheet = document.getElementById("vitalsSheet");
const closeVitalsSheetBtn = document.getElementById("closeVitalsSheetBtn");
const vitalsMomentInput = document.getElementById("vitalsMoment");
const vitalsFcInput = document.getElementById("vitalsFc");
const vitalsTasInput = document.getElementById("vitalsTas");
const vitalsTadInput = document.getElementById("vitalsTad");
const vitalsSpo2Input = document.getElementById("vitalsSpo2");
const vitalsOxygenSupportInput = document.getElementById("vitalsOxygenSupport");
const vitalsOxygenFlowInput = document.getElementById("vitalsOxygenFlow");
const vitalsFrInput = document.getElementById("vitalsFr");
const vitalsTempInput = document.getElementById("vitalsTemp");
const vitalsGcsInput = document.getElementById("vitalsGcs");
const vitalsPainInput = document.getElementById("vitalsPain");
const vitalsGlycemiaInput = document.getElementById("vitalsGlycemia");
const saveVitalsBtn = document.getElementById("saveVitalsBtn");
const clearVitalsFormBtn = document.getElementById("clearVitalsFormBtn");
const vitalsLastSummary = document.getElementById("vitalsLastSummary");
const vitalsAlertBanner = document.getElementById("vitalsAlertBanner");
const vitalsHistory = document.getElementById("vitalsHistory");
const userCharterOverlay = document.getElementById("userCharterOverlay");
const charterAcceptCheck = document.getElementById("charterAcceptCheck");
const acceptCharterBtn = document.getElementById("acceptCharterBtn");
const charterVersionText = document.getElementById("charterVersionText");
const openCharterLinkBtn = document.getElementById("openCharterLinkBtn");
const openLegalNoticeBtn = document.getElementById("openLegalNoticeBtn");
const openValidationStatusBtn = document.getElementById("openValidationStatusBtn");
const legalOverlay = document.getElementById("legalOverlay");
const legalModalTitle = document.getElementById("legalModalTitle");
const legalModalContent = document.getElementById("legalModalContent");
const closeLegalModalBtn = document.getElementById("closeLegalModalBtn");

const ACTION_BUTTON_SELECTOR = [
  "[data-action]",
  "[data-acr-action]",
  "[data-child-acr-action]",
  "[data-dt-action]",
  "[data-smoke-action]",
  "[data-burn-action]",
  "[data-seizure-action]",
  "[data-anaphylaxis-action]",
  "[data-hemo-action]",
  "[data-hypo-action]",
  "[data-asthma-action]",
  "[data-analgesia-action]"
].join(", ");

const ACTION_FEEDBACK_SELECTOR = [
  ACTION_BUTTON_SELECTOR,
  "#call15Btn",
  "#childAcrCall15Btn",
  "#dtCall15Btn",
  "#smokeCall15Btn",
  "#burnCall15Btn",
  "#seizureCall15Btn",
  "#anaphylaxisCall15Btn",
  "#hemorrhageCall15Btn",
  "#hypoglycemiaCall15Btn",
  "#asthmaCall15Btn",
  "#analgesiaCall15Btn"
].join(", ");

const CALL15_BUTTON_SELECTOR = [
  "#call15Btn",
  "#childAcrCall15Btn",
  "#dtCall15Btn",
  "#smokeCall15Btn",
  "#burnCall15Btn",
  "#seizureCall15Btn",
  "#anaphylaxisCall15Btn",
  "#hemorrhageCall15Btn",
  "#hypoglycemiaCall15Btn",
  "#asthmaCall15Btn",
  "#analgesiaCall15Btn"
].join(", ");

const PROTOCOL_CALL15_BUTTON_MAP = {
  acrAdultProtocol: "call15Btn",
  childAcrProtocol: "childAcrCall15Btn",
  chestPainProtocol: "dtCall15Btn",
  smokeExposureProtocol: "smokeCall15Btn",
  burnsProtocol: "burnCall15Btn",
  seizureProtocol: "seizureCall15Btn",
  anaphylaxisProtocol: "anaphylaxisCall15Btn",
  hemorrhageProtocol: "hemorrhageCall15Btn",
  hypoglycemiaProtocol: "hypoglycemiaCall15Btn",
  asthmaBpcoProtocol: "asthmaCall15Btn",
  analgesiaProtocol: "analgesiaCall15Btn"
};

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function nowLabel() {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function loadLog() {
  const saved = JSON.parse(localStorage.getItem("pisuLog") || "[]");
  logEl.innerHTML = "";
  saved.forEach(item => addLogToDom(item.time, item.text));
}

function saveLog(items) {
  localStorage.setItem("pisuLog", JSON.stringify(items));
}

function getLog() {
  return JSON.parse(localStorage.getItem("pisuLog") || "[]");
}

function addLog(text, structuredOptions = {}) {
  const items = getLog();
  const item = { time: nowLabel(), text };
  items.push(item);
  saveLog(items);
  addLogToDom(item.time, item.text);
  addStructuredEvent(inferStructuredEvent(text, {
    ...structuredOptions,
    heure: item.time,
    iso: new Date().toISOString()
  }));
}

function addLogToDom(time, text) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${time}</strong> — ${escapeHtml(text)}`;
  logEl.appendChild(li);
}

function createStructuredEventId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeForSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getStructuredEvents() {
  try {
    const events = JSON.parse(localStorage.getItem(PISU_EVENTS_STORAGE_KEY) || "[]");
    return Array.isArray(events) ? events : [];
  } catch {
    localStorage.removeItem(PISU_EVENTS_STORAGE_KEY);
    return [];
  }
}

function saveStructuredEvents(events) {
  localStorage.setItem(PISU_EVENTS_STORAGE_KEY, JSON.stringify(events));
}

function clearStructuredEvents() {
  localStorage.removeItem(PISU_EVENTS_STORAGE_KEY);
}

function addStructuredEvent(event) {
  const events = getStructuredEvents();
  events.push(event);
  saveStructuredEvents(events);
}

function normalizeProtocolName(value) {
  const normalized = normalizeForSearch(value);

  if (!normalized) return "";

  const protocolMatchers = [
    { test: "arret cardiaque adulte", label: "ACR adulte" },
    { test: "acr adulte", label: "ACR adulte" },
    { test: "arret cardiaque enfant", label: "ACR enfant" },
    { test: "acr enfant", label: "ACR enfant" },
    { test: "douleur thoracique", label: "Douleur thoracique" },
    { test: "exposition aux fumees", label: "Exposition aux fumées" },
    { test: "fumee", label: "Exposition aux fumées" },
    { test: "brulure", label: "Brûlures" },
    { test: "brulures", label: "Brûlures" },
    { test: "crise convulsive", label: "Crise convulsive" },
    { test: "convulsion", label: "Crise convulsive" },
    { test: "anaphylaxie", label: "Anaphylaxie" },
    { test: "hemorragie", label: "Hémorragie sévère" },
    { test: "hypoglycemie adulte et enfant", label: "Hypoglycémie" },
    { test: "hypoglycemie", label: "Hypoglycémie" },
    { test: "asthme", label: "Asthme/BPCO" },
    { test: "bpco", label: "Asthme/BPCO" },
    { test: "antalgie", label: "Antalgie" }
  ];

  const found = protocolMatchers.find(item => normalized.includes(item.test));
  return found?.label || "";
}

function extractProtocolFromMessage(message) {
  const text = String(message || "");

  if (text.includes("Sélection protocole PISU :")) {
    const selectedProtocol = text.split("Sélection protocole PISU :")[1]?.trim() || "";
    return normalizeProtocolName(selectedProtocol) || "Mission PISU";
  }

  const normalizedProtocol = normalizeProtocolName(text);

  if (normalizedProtocol) {
    return normalizedProtocol;
  }

  return "Mission PISU";
}

function getCorrectionTarget(message) {
  const text = String(message || "");

  if (!normalizeForSearch(text).includes("correction")) {
    return "";
  }

  if (text.includes("—")) {
    return text.split("—").slice(1).join("—").trim();
  }

  return text.replace(/^Correction\s*:\s*/i, "").trim();
}

function inferStructuredEvent(message, options = {}) {
  const now = options.date || new Date();
  const heure = options.heure || now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const iso = options.iso || now.toISOString();
  const text = String(message || "").trim();
  const normalized = normalizeForSearch(text);
  const protocole = options.protocole || extractProtocolFromMessage(text);

  let event = {
    id: createStructuredEventId(),
    iso,
    heure,
    protocole,
    categorie: "journal_technique",
    sousCategorie: "",
    libelleCourt: text,
    libelleLong: text,
    statut: "selectionne",
    sectionSAED: "journal",
    priorite: "basse",
    condition: "",
    type: "technique",
    visibleSynthese: false,
    visibleSAED: false,
    visibleChrono: false,
    visibleJournal: true,
    correctionTarget: ""
  };

  function setClinical(partial = {}) {
    event = {
      ...event,
      statut: "realise",
      sectionSAED: "E",
      priorite: "moyenne",
      type: "clinique",
      visibleSynthese: true,
      visibleSAED: true,
      visibleChrono: true,
      visibleJournal: true,
      ...partial
    };
  }

  if (
    normalized.includes("code de transfert") ||
    normalized.includes("ouverture protocole") ||
    normalized.includes("selection protocole") ||
    normalized.includes("charte utilisateur") ||
    normalized.includes("carnet equipage") ||
    normalized.includes("reset protocole") ||
    normalized.includes("protocole remis a zero") ||
    normalized.includes("doses recalculees")
  ) {
    event = {
      ...event,
      categorie: "journal_technique",
      sousCategorie: "technique",
      statut: "selectionne",
      type: "technique",
      visibleSynthese: false,
      visibleSAED: false,
      visibleChrono: false,
      visibleJournal: true
    };
  }

  if (normalized.includes("correction")) {
    event = {
      ...event,
      categorie: "correction",
      sousCategorie: "annulation_visuelle",
      statut: "annule",
      sectionSAED: "journal",
      priorite: "basse",
      type: "technique",
      visibleSynthese: false,
      visibleSAED: false,
      visibleChrono: false,
      visibleJournal: true,
      correctionTarget: getCorrectionTarget(text)
    };
  }

  if (normalized.includes("constantes")) {
    setClinical({
      categorie: "constante",
      sousCategorie: "bilan_vital",
      sectionSAED: "S",
      priorite: "haute"
    });
  }

  if (
    normalized.includes("appel au 15") ||
    normalized.includes("bilan au medecin regulateur") ||
    normalized.includes("medecin regulateur") ||
    normalized.includes("regulation")
  ) {
    setClinical({
      categorie: "appel",
      sousCategorie: "regulation",
      sectionSAED: "D",
      priorite: "haute"
    });
  }

  if (
    normalized.includes("analyse de rythme") ||
    normalized.includes("choc indique") ||
    normalized.includes("choc non indique") ||
    normalized.includes("asystolie") ||
    normalized.includes("aesp") ||
    normalized.includes("fv") ||
    normalized.includes("tv sans pouls")
  ) {
    setClinical({
      categorie: "rythme",
      sousCategorie: normalized.includes("choc non indique") ? "non_choquable" : "analyse",
      sectionSAED: "S",
      priorite: "haute"
    });
  }

  if (
    normalized.includes("rcp") ||
    normalized.includes("mce") ||
    normalized.includes("compressions") ||
    normalized.includes("cee") ||
    normalized.includes("defibrillateur") ||
    normalized.includes("electrodes")
  ) {
    setClinical({
      categorie: "geste",
      sousCategorie: normalized.includes("cee") ? "cee" : "reanimation",
      sectionSAED: "E",
      priorite: "haute"
    });
  }

  if (
    normalized.includes("adrenaline") ||
    normalized.includes("cordarone") ||
    normalized.includes("morphine") ||
    normalized.includes("paracetamol") ||
    normalized.includes("glucagon") ||
    normalized.includes("g10") ||
    normalized.includes("g30") ||
    normalized.includes("terbutaline") ||
    normalized.includes("bricanyl") ||
    normalized.includes("ipratropium") ||
    normalized.includes("atrovent") ||
    normalized.includes("methylprednisolone") ||
    normalized.includes("solumedrol") ||
    normalized.includes("exacyl") ||
    normalized.includes("tranexamique")
  ) {
    setClinical({
      categorie: "medicament",
      sousCategorie: "traitement",
      sectionSAED: "E",
      priorite: "haute"
    });

    if (normalized.includes("adrenaline")) event.sousCategorie = "adrenaline";
    if (normalized.includes("cordarone")) event.sousCategorie = "cordarone";
    if (normalized.includes("morphine")) event.sousCategorie = "morphine";
    if (normalized.includes("glucagon")) event.sousCategorie = "glucagon";
    if (normalized.includes("g10")) event.sousCategorie = "g10";
    if (normalized.includes("g30")) event.sousCategorie = "g30";
    if (normalized.includes("exacyl") || normalized.includes("tranexamique")) event.sousCategorie = "exacyl";
  }

  if (
    normalized.includes("vvp") ||
    normalized.includes("ktio") ||
    normalized.includes("intra-osseux") ||
    normalized.includes("io si echec") ||
    normalized.includes("abord vasculaire")
  ) {
    setClinical({
      categorie: "geste",
      sousCategorie: "abord_vasculaire",
      sectionSAED: "E",
      priorite: "moyenne"
    });
  }

  if (
    normalized.includes("ventilation") ||
    normalized.includes("bavu") ||
    normalized.includes("mhc") ||
    normalized.includes("oxygenotherapie") ||
    normalized.includes("o2") ||
    normalized.includes("spo2")
  ) {
    setClinical({
      categorie: "surveillance",
      sousCategorie: "ventilation_oxygenation",
      sectionSAED: "E",
      priorite: "moyenne"
    });
  }

  if (
    normalized.includes("racs") ||
    normalized.includes("rosc") ||
    normalized.includes("reprise d'une activite") ||
    normalized.includes("reprise d une activite")
  ) {
    setClinical({
      categorie: "evolution",
      sousCategorie: "racs",
      sectionSAED: "S",
      priorite: "haute"
    });
  }

  if (
    normalized.includes("ecg") ||
    normalized.includes("d2 long") ||
    normalized.includes("18 derivations")
  ) {
    setClinical({
      categorie: "geste",
      sousCategorie: "ecg",
      sectionSAED: "E",
      priorite: "moyenne",
      condition: normalized.includes("racs") ? "RACS confirmé" : ""
    });
  }

  if (
    (normalized.includes("signes de gravite") && !normalized.includes("absence de signes de gravite")) ||
    normalized.includes("anomalie significative") ||
    normalized.includes("detresse") ||
    normalized.includes("aggravation")
  ) {
    setClinical({
      categorie: "signe_clinique",
      sousCategorie: "gravite",
      sectionSAED: "S",
      priorite: "haute"
    });
  }

  if (normalized.includes("hypoglycemie")) {
    if (normalized.includes("glycemie corrigee")) {
      setClinical({
        categorie: "constante",
        sousCategorie: "glycemie",
        sectionSAED: "S",
        priorite: "haute"
      });
    }

    if (normalized.includes("absence de signes de gravite")) {
      setClinical({
        categorie: "signe_clinique",
        sousCategorie: "absence_gravite",
        sectionSAED: "S",
        priorite: "moyenne"
      });
    }

    if (
      normalized.includes("signes de gravite") &&
      !normalized.includes("absence de signes de gravite")
    ) {
      setClinical({
        categorie: "signe_clinique",
        sousCategorie: "gravite",
        sectionSAED: "S",
        priorite: "haute"
      });
    }

    if (
      normalized.includes("pompe a insuline") ||
      normalized.includes("pompe eteinte")
    ) {
      setClinical({
        categorie: "geste",
        sousCategorie: "pompe_insuline",
        sectionSAED: "E",
        priorite: "moyenne"
      });
    }

    if (
      normalized.includes("patient conscient") ||
      normalized.includes("capable de deglutir")
    ) {
      setClinical({
        categorie: "evolution",
        sousCategorie: "conscience_deglutition",
        sectionSAED: "S",
        priorite: "moyenne"
      });
    }

    if (
      normalized.includes("resucrage") ||
      normalized.includes("sucres rapides") ||
      normalized.includes("jus de fruits") ||
      normalized.includes("confiture") ||
      normalized.includes("g30")
    ) {
      setClinical({
        categorie: "medicament",
        sousCategorie: "resucrage",
        sectionSAED: "E",
        priorite: "haute"
      });
    }
  }

  if (options && Object.keys(options).length > 0) {
    event = {
      ...event,
      ...options,
      id: options.id || event.id,
      iso: options.iso || event.iso,
      heure: options.heure || event.heure,
      libelleCourt: options.libelleCourt || event.libelleCourt,
      libelleLong: options.libelleLong || event.libelleLong
    };
  }

  delete event.date;
  return event;
}

function parseLogLineToEvent(item) {
  if (item && typeof item === "object") {
    return inferStructuredEvent(item.text, {
      heure: item.time,
      iso: new Date().toISOString()
    });
  }

  const text = String(item || "");
  const parts = text.split(" — ");
  const heure = parts.length > 1 ? parts[0] : "";
  const message = parts.length > 1 ? parts.slice(1).join(" — ") : text;

  return inferStructuredEvent(message, {
    heure,
    iso: new Date().toISOString()
  });
}

function getStructuredEventsOrFallback(rawLogItems = []) {
  const events = getStructuredEvents();

  if (events.length > 0) {
    return events;
  }

  return rawLogItems.map(parseLogLineToEvent);
}

function eventLine(event) {
  let line = `${event.heure || "--:--"} — ${event.libelleCourt || event.libelleLong || "Événement"}`;

  if (event.condition) {
    line += ` [condition : ${event.condition}]`;
  }

  if (event.statut === "a_confirmer") {
    line += " [à confirmer]";
  }

  return line;
}

function getCancelledTargets(events) {
  return events
    .filter(event => event.statut === "annule" && event.correctionTarget)
    .map(event => normalizeForSearch(event.correctionTarget));
}

function isEventCancelledByCorrection(event, cancelledTargets) {
  if (!cancelledTargets.length) return false;

  const label = normalizeForSearch(`${event.libelleCourt} ${event.libelleLong}`);

  return cancelledTargets.some(target => {
    return label.includes(target) || target.includes(label);
  });
}

function getActiveEventsForSaed(events) {
  const cancelledTargets = getCancelledTargets(events);

  return events.filter(event => {
    if (event.statut === "annule") return false;
    return !isEventCancelledByCorrection(event, cancelledTargets);
  });
}

function isClinicalEvent(event) {
  return event.type === "clinique";
}

function isUsefulForClinicalChronology(event) {
  if (!isClinicalEvent(event)) return false;
  if (event.statut === "annule") return false;
  if (event.visibleChrono === false) return false;

  return ["realise", "a_confirmer", "conditionnel", "selectionne"].includes(event.statut);
}

function getPriorityWeight(priority) {
  if (priority === "haute") return 3;
  if (priority === "moyenne") return 2;
  return 1;
}

function uniqueLines(lines) {
  const seen = new Set();

  return lines.filter(line => {
    const key = normalizeForSearch(line);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatLinesOrFallback(lines, fallback = "Aucun élément renseigné.") {
  const usefulLines = lines.filter(Boolean);

  if (usefulLines.length === 0) {
    return [fallback];
  }

  return usefulLines;
}

function getProtocolNamesFromEventsAndLog(events, rawLogItems = []) {
  const protocols = new Set();

  function addProtocol(value) {
    const protocol = normalizeProtocolName(value);

    if (!protocol) return;
    if (protocol === "Mission PISU") return;

    protocols.add(protocol);
  }

  events.forEach(event => {
    addProtocol(event.protocole);
  });

  rawLogItems.forEach(item => {
    const text = String(item?.text || item || "");

    if (text.includes("Sélection protocole PISU :")) {
      const selectedProtocol = text.split("Sélection protocole PISU :")[1]?.trim() || "";
      addProtocol(selectedProtocol);
    }
  });

  return Array.from(protocols);
}

function getEventsByCategory(events, category) {
  return events.filter(event => event.categorie === category);
}

function getEventsBySubCategory(events, subCategory) {
  return events.filter(event => event.sousCategorie === subCategory);
}

function buildStructuredSaedModel(rawLogItems = []) {
  const allEvents = getStructuredEventsOrFallback(rawLogItems);
  const activeEvents = getActiveEventsForSaed(allEvents);
  const clinicalEvents = activeEvents.filter(isClinicalEvent);
  const protocolNames = getProtocolNamesFromEventsAndLog(allEvents, rawLogItems);

  const syntheseEvents = clinicalEvents
    .filter(event => {
      return event.visibleSynthese !== false &&
        ["realise", "a_confirmer"].includes(event.statut) &&
        getPriorityWeight(event.priorite) >= 2;
    })
    .sort((a, b) => {
      return getPriorityWeight(b.priorite) - getPriorityWeight(a.priorite);
    })
    .slice(0, 12);

  const clinicalChronology = activeEvents
    .filter(isUsefulForClinicalChronology)
    .map(eventLine);

  const pointsAConfirmer = activeEvents
    .filter(event => {
      return event.statut === "a_confirmer" ||
        event.statut === "conditionnel" ||
        Boolean(event.condition);
    })
    .map(eventLine);

  const corrections = allEvents
    .filter(event => event.statut === "annule" || event.categorie === "correction")
    .map(eventLine);

  return {
    allEvents,
    activeEvents,
    clinicalEvents,
    protocolNames,
    syntheseEvents,
    clinicalChronology: uniqueLines(clinicalChronology),
    pointsAConfirmer: uniqueLines(pointsAConfirmer),
    corrections: uniqueLines(corrections),
    rythme: getEventsByCategory(clinicalEvents, "rythme"),
    medicaments: getEventsByCategory(clinicalEvents, "medicament"),
    gestes: getEventsByCategory(clinicalEvents, "geste"),
    ventilation: getEventsBySubCategory(clinicalEvents, "ventilation_oxygenation"),
    abord: getEventsBySubCategory(clinicalEvents, "abord_vasculaire"),
    evolution: getEventsByCategory(clinicalEvents, "evolution"),
    appels: getEventsByCategory(clinicalEvents, "appel"),
    signes: getEventsByCategory(clinicalEvents, "signe_clinique"),
    constantes: getEventsByCategory(clinicalEvents, "constante")
  };
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function startTimer() {
  clearInterval(timerInterval);
  if (remaining <= 0) remaining = 120;
  addLog("Début cycle RCP 2 minutes");
  timerInterval = setInterval(() => {
    remaining -= 1;
    timerEl.textContent = formatTime(remaining);
    if (remaining <= 0) {
      clearInterval(timerInterval);
      addLog("Fin cycle RCP 2 minutes — analyse à réaliser selon protocole");
      if ("vibrate" in navigator) navigator.vibrate([250, 150, 250]);
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  remaining = 120;
  timerEl.textContent = formatTime(remaining);
  addLog("Chrono RCP réinitialisé");
}

function valueOrDefault(value, fallback = "non renseigné") {
  const cleaned = value.trim();
  return cleaned || fallback;
}

function savePatientIdentity() {
  const name = valueOrDefault(patientNameInput.value, "identité non renseignée");
  const age = valueOrDefault(patientAgeInput.value);
  const sex = valueOrDefault(patientSexInput.value);
  const weight = valueOrDefault(patientWeightInput.value);
  const category = valueOrDefault(patientCategoryInput.value);
  const note = patientNoteInput.value.trim();

  let logLine = `Identité patient : ${name} — âge/naissance : ${age} — sexe : ${sex} — catégorie : ${category} — poids estimé : ${weight}`;

  if (note) {
    logLine += ` — remarque : ${note}`;
  }

  addLog(logLine);
  updatePatientIdentitySummary();
}

function setUnknownIdentity() {
  patientNameInput.value = "Inconnu";
  patientAgeInput.value = "";
  patientSexInput.value = "";
  patientCategoryInput.value = "";
  patientWeightInput.value = "";
  patientNoteInput.value = "Identité inconnue au moment de la prise en charge";

  addLog("Identité patient : inconnue au moment de la prise en charge");
  updatePatientIdentitySummary();
}

function getInputValue(elementId, fallback = "À compléter") {
  const element = document.getElementById(elementId);

  if (!element) {
    return fallback;
  }

  const value = element.value?.trim();

  return value || fallback;
}

function findFirstLogContaining(items, searchText) {
  return items.find(item => item.text.toLowerCase().includes(searchText.toLowerCase()));
}

function findAllLogsContaining(items, searchTexts) {
  return items.filter(item => {
    const text = item.text.toLowerCase();
    return searchTexts.some(searchText => text.includes(searchText.toLowerCase()));
  });
}

function formatLogLine(item) {
  return `${item.time} — ${item.text}`;
}

function formatLogList(items, fallback = "À compléter") {
  if (!items.length) {
    return fallback;
  }

  return items.map(formatLogLine).join("\n");
}

function getPatientWeightKg() {
  const rawValue = patientWeightInput?.value || "";

  const normalizedValue = rawValue
    .toLowerCase()
    .replace(",", ".")
    .replace("kg", "")
    .trim();

  const weight = Number.parseFloat(normalizedValue);

  if (!Number.isFinite(weight) || weight <= 0) {
    return null;
  }

  return weight;
}

function getPatientAgeYears() {
  const rawValue = patientAgeInput?.value || "";
  const normalizedValue = rawValue
    .toLowerCase()
    .replace(",", ".")
    .trim();

  // Cas simple : "11", "11 ans", "11a"
  const yearMatch = normalizedValue.match(/(\d+(\.\d+)?)\s*(ans|an|a)?/);

  if (!yearMatch) {
    return null;
  }

  const age = Number.parseFloat(yearMatch[1]);

  if (!Number.isFinite(age) || age < 0) {
    return null;
  }

  return age;
}

function getPatientCategory() {
  const manualCategory = patientCategoryInput?.value || "";

  // Si tu as choisi une catégorie dans le menu, elle reste prioritaire.
  if (manualCategory) {
    return manualCategory;
  }

  const ageYears = getPatientAgeYears();

  if (ageYears === null) {
    return "";
  }

  if (ageYears > 10) {
    return "adulte";
  }

  if (ageYears >= 5 && ageYears <= 10) {
    return "enfant-5-10";
  }

  if (ageYears >= 1 && ageYears < 5) {
    return "enfant-1-5";
  }

  if (ageYears >= 0.25 && ageYears < 1) {
    return "nourrisson-3-12";
  }

  return "";
}

function getPatientCategoryLabel(category) {
  switch (category) {
    case "adulte":
      return "Adulte / > 10 ans";
    case "enfant-5-10":
      return "Enfant 5 à 10 ans";
    case "enfant-1-5":
      return "Enfant 1 à 5 ans";
    case "nourrisson-3-12":
      return "Nourrisson 3 à 12 mois";
    default:
      return "Non renseignée";
  }
}

function formatDoseMg(value) {
  if (!Number.isFinite(value)) {
    return "Non calculable";
  }

  const rounded = Math.round(value * 100) / 100;

  return `${rounded.toString().replace(".", ",")} mg`;
}

function calculateClonazepamDoseMg(weightKg) {
  if (!weightKg) {
    return null;
  }

  return Math.min(weightKg * 0.015, 1.5);
}

function getMidazolamBuccolamDoseFromCategory(category) {
  switch (category) {
    case "adulte":
      return "10 mg";
    case "enfant-5-10":
      return "7,5 mg";
    case "enfant-1-5":
      return "5 mg";
    case "nourrisson-3-12":
      return "2,5 mg";
    default:
      return "Catégorie d’âge à renseigner";
  }
}

window.pisuPatient = {
  getWeightKg: getPatientWeightKg,
  getAgeYears: getPatientAgeYears,
  getCategory: getPatientCategory,
  getCategoryLabel: getPatientCategoryLabel,
  formatDoseMg,
  calculateClonazepamDoseMg,
  getMidazolamBuccolamDoseFromCategory
};

function exportTextLegacy() {
  const rawLogItems = getLog();
  const model = buildStructuredSaedModel(rawLogItems);

  const responder = typeof getResponderIdentity === "function"
    ? getResponderIdentity()
    : {};

  const responderLine = typeof formatResponderIdentity === "function"
    ? formatResponderIdentity(responder)
    : "Intervenant à compléter";

  const crewLines = typeof getMissionCrewLines === "function"
    ? getMissionCrewLines()
    : ["Aucun équipage associé renseigné."];

  const patientName = patientNameInput?.value?.trim() || "Identité non renseignée";
  const patientAge = patientAgeInput?.value?.trim() || "À compléter";
  const patientSex = patientSexInput?.value?.trim() || "À compléter";
  const patientCategory = patientCategoryInput?.value?.trim() || "À compléter";
  const patientWeight = patientWeightInput?.value?.trim() || "À compléter";
  const patientNote = patientNoteInput?.value?.trim() || "Aucune remarque renseignée";

  const initialVitals = window.pisuVitals?.getInitialLine?.() || getInitialVitalsLine();
  const latestVitals = window.pisuVitals?.getLatestLine?.() || getLatestVitalsLine();
  const allVitals = window.pisuVitals?.getAllLines?.() || getAllVitalsLines();

  const protocolLine = model.protocolNames.length > 0
    ? model.protocolNames.join(" / ")
    : "Aucun protocole sélectionné";

  const syntheseLines = [
    responderLine,
    "",
    `Patient : ${patientName}.`,
    `Âge / naissance : ${patientAge}. Sexe : ${patientSex}. Poids : ${patientWeight}.`,
    `Protocole(s) engagé(s) : ${protocolLine}.`,
    "",
    "Constantes initiales :",
    initialVitals,
    "",
    "Dernières constantes :",
    latestVitals,
    "",
    "Éléments prioritaires :",
    ...formatLinesOrFallback(
      model.syntheseEvents.map(eventLine),
      "Aucun élément prioritaire structuré pour le moment."
    ),
    "",
    "Demande attendue :",
    "Avis médical, conduite à tenir, renfort, destination ou consignes."
  ];

  const situationLines = [
    `Patient : ${patientName}`,
    `Protocole(s) engagé(s) : ${protocolLine}`,
    "",
    "Éléments de situation :",
    ...formatLinesOrFallback(
      [
        ...model.rythme,
        ...model.signes,
        ...model.evolution
      ].map(eventLine),
      "Situation clinique à compléter."
    ),
    "",
    "Constantes :",
    "Initiales :",
    initialVitals,
    "",
    "Dernières :",
    latestVitals
  ];

  const antecedentsLines = [
    "Antécédents médicaux utiles : À compléter.",
    "Allergies : À compléter.",
    "Traitements en cours : À compléter.",
    `Contexte / remarque identité : ${patientNote}`
  ];

  const evaluationLines = [
    "Actions / gestes utiles :",
    ...formatLinesOrFallback(
      model.gestes.map(eventLine),
      "Aucun geste clinique structuré renseigné."
    ),
    "",
    "Traitements / médicaments :",
    ...formatLinesOrFallback(
      model.medicaments.map(eventLine),
      "Aucun traitement structuré renseigné."
    ),
    "",
    "Abord vasculaire :",
    ...formatLinesOrFallback(
      model.abord.map(eventLine),
      "Aucun abord vasculaire structuré renseigné."
    ),
    "",
    "Ventilation / oxygénation :",
    ...formatLinesOrFallback(
      model.ventilation.map(eventLine),
      "Aucune ventilation / oxygénation structurée renseignée."
    ),
    "",
    "Constantes enregistrées :",
    ...allVitals
  ];

  const demandeLines = [
    "Appel / régulation :",
    ...formatLinesOrFallback(
      model.appels.map(eventLine),
      "Appel ou décision médicale à compléter."
    ),
    "",
    "Demande au médecin régulateur :",
    "À compléter : avis médical, décision, renfort, destination, conduite à tenir.",
    "",
    "Décision / consignes reçues :",
    "À compléter."
  ];

  const pointsAConfirmerLines = [
    "Points conditionnels / à confirmer :",
    ...formatLinesOrFallback(
      model.pointsAConfirmer,
      "Aucun point conditionnel ou à confirmer identifié."
    ),
    "",
    "Corrections / annulations :",
    ...formatLinesOrFallback(
      model.corrections,
      "Aucune correction tracée."
    )
  ];

  const clinicalChronologyLines = formatLinesOrFallback(
    model.clinicalChronology,
    "Aucune chronologie clinique utile structurée."
  );

  const journalCompleteLines = rawLogItems.length > 0
    ? rawLogItems.map(formatLogLine)
    : ["Journal vide."];

  const lines = [
    "========================================",
    "FEUILLE SAED — INTERVENTION PISU",
    "========================================",
    "",
    `Export généré le : ${new Date().toLocaleString("fr-FR")}`,
    `Version export : ${SAED_STRUCTURED_EXPORT_VERSION}`,
    "Version application : prototype à valider",
    "",
    "========================================",
    "1. SYNTHÈSE RAPIDE",
    "========================================",
    "",
    ...syntheseLines,
    "",
    "========================================",
    "2. IDENTITÉ / REPÈRES",
    "========================================",
    "",
    "INTERVENANT PRINCIPAL",
    responderLine,
    "",
    "ÉQUIPAGE MISSION",
    ...crewLines,
    "",
    "PATIENT",
    `Nom / Prénom : ${patientName}`,
    `Âge ou date de naissance : ${patientAge}`,
    `Sexe : ${patientSex}`,
    `Catégorie patient : ${patientCategory}`,
    `Poids estimé : ${patientWeight}`,
    `Remarque identité : ${patientNote}`,
    "",
    "MISSION",
    "Départ intervention : À compléter",
    "Arrivée sur les lieux : À compléter",
    "GPS : À compléter",
    `Protocole(s) : ${protocolLine}`,
    "",
    "========================================",
    "3. S — SITUATION",
    "========================================",
    "",
    ...situationLines,
    "",
    "========================================",
    "4. A — ANTÉCÉDENTS",
    "========================================",
    "",
    ...antecedentsLines,
    "",
    "========================================",
    "5. E — ÉVALUATION ET ACTIONS",
    "========================================",
    "",
    ...evaluationLines,
    "",
    "========================================",
    "6. D — DEMANDE / DÉCISION",
    "========================================",
    "",
    ...demandeLines,
    "",
    "========================================",
    "7. POINTS À CONFIRMER",
    "========================================",
    "",
    ...pointsAConfirmerLines,
    "",
    "========================================",
    "8. CHRONOLOGIE CLINIQUE UTILE",
    "========================================",
    "",
    ...clinicalChronologyLines,
    "",
    "========================================",
    "9. JOURNAL COMPLET",
    "========================================",
    "",
    ...journalCompleteLines,
    "",
    "========================================",
    "FIN FEUILLE SAED",
    "========================================"
  ];

  return lines.join("\n");
}

function exportText() {
  const rawLogItems = getLog();
  const model = buildStructuredSaedModel(rawLogItems);

  const responder = typeof getResponderIdentity === "function"
    ? getResponderIdentity()
    : {};

  const responderLine = typeof formatResponderIdentity === "function"
    ? formatResponderIdentity(responder)
    : "Intervenant à compléter";

  const crewLines = typeof getMissionCrewLines === "function"
    ? getMissionCrewLines()
    : ["Aucun équipage associé renseigné."];

  const patientName = patientNameInput?.value?.trim() || "Identité non renseignée";
  const patientAge = patientAgeInput?.value?.trim() || "À compléter";
  const patientSex = patientSexInput?.value?.trim() || "À compléter";
  const patientCategory = patientCategoryInput?.value?.trim() || "À compléter";
  const patientWeight = patientWeightInput?.value?.trim() || "À compléter";
  const patientNote = patientNoteInput?.value?.trim() || "";

  const initialVitals = window.pisuVitals?.getInitialLine?.() || "";
  const latestVitals = window.pisuVitals?.getLatestLine?.() || "";

  const protocolLine = model.protocolNames.length > 0
    ? model.protocolNames.join(" / ")
    : "À préciser";

  function bulletLines(lines) {
    return uniqueLines(lines)
      .filter(Boolean)
      .map(line => `- ${line}`);
  }

  function eventBullets(events, limit = 10) {
    return bulletLines(
      events
        .map(eventLine)
        .filter(Boolean)
    ).slice(0, limit);
  }

  function addBlock(lines, title, contentLines) {
    const cleanLines = contentLines.filter(Boolean);

    if (cleanLines.length === 0) return;

    lines.push(title);
    lines.push(...cleanLines);
    lines.push("");
  }

  function latestRawLogContaining(patterns) {
    const normalizedPatterns = patterns.map(normalizeForSearch);

    const found = rawLogItems
      .slice()
      .reverse()
      .find(item => {
        const text = typeof item === "string" ? item : formatLogLine(item);
        const normalizedLine = normalizeForSearch(text);
        return normalizedPatterns.some(pattern => normalizedLine.includes(pattern));
      });

    if (!found) return "";

    return typeof found === "string" ? found : formatLogLine(found);
  }

  const departLine = latestRawLogContaining(["Départ intervention"]);
  const arriveeLine = latestRawLogContaining(["Arrivée sur les lieux"]);
  const gpsDepartLine = latestRawLogContaining(["GPS Départ intervention"]);
  const gpsArriveeLine = latestRawLogContaining(["GPS Arrivée sur les lieux"]);

  const situationEvents = model.clinicalEvents.filter(event => {
    return [
      "situation",
      "signe_clinique",
      "rythme",
      "evolution"
    ].includes(event.categorie);
  });

  const evaluationEvents = model.clinicalEvents.filter(event => {
    return [
      "geste",
      "medicament",
      "materiel",
      "surveillance",
      "constante"
    ].includes(event.categorie);
  });

  const appelEvents = model.clinicalEvents.filter(event => {
    return ["appel", "decision", "demande", "transport"].includes(event.categorie);
  });

  const priorityEvents = model.clinicalEvents.filter(event => {
    if (event.categorie === "constante") return false;
    if (event.visibleSynthese === false) return false;
    if (!["realise", "a_confirmer", "selectionne"].includes(event.statut)) return false;

    return event.priorite === "haute" || event.priorite === "moyenne";
  });

  const syntheseClinique = eventBullets(priorityEvents, 8);
  const saedLines = [];

  addBlock(saedLines, "S — SITUATION", [
    `- Patient : ${patientName}`,
    `- Âge / naissance : ${patientAge} ; sexe : ${patientSex} ; poids : ${patientWeight}`,
    `- Protocole engagé : ${protocolLine}`,
    latestVitals ? `- Dernières constantes : ${latestVitals}` : "",
    ...eventBullets(situationEvents, 8)
  ]);

  addBlock(saedLines, "A — ANTÉCÉDENTS", [
    "- Antécédents médicaux utiles : À compléter",
    "- Allergies : À compléter",
    "- Traitements en cours : À compléter",
    patientNote ? `- Remarque identité / contexte : ${patientNote}` : ""
  ]);

  addBlock(saedLines, "E — ÉVALUATION / ACTIONS", [
    ...eventBullets(evaluationEvents, 12)
  ]);

  if (appelEvents.length > 0) {
    addBlock(saedLines, "D — DEMANDE / DÉCISION", [
      ...eventBullets(appelEvents, 8),
      "- Décision / consignes reçues : À compléter"
    ]);
  } else {
    addBlock(saedLines, "D — DEMANDE / DÉCISION", [
      "- Appel / bilan régulateur non tracé dans l’application",
      "- Demande : avis médical, conduite à tenir, renfort, destination ou consignes",
      "- Décision / consignes reçues : À compléter"
    ]);
  }

  const clinicalChronologyLines = model.clinicalChronology.length > 0
    ? model.clinicalChronology
    : ["Aucune chronologie clinique utile structurée."];

  const journalCompleteLines = rawLogItems.length > 0
    ? rawLogItems.map(item => typeof item === "string" ? item : formatLogLine(item))
    : ["Journal vide."];

  const lines = [
    "========================================",
    "FEUILLE SAED — INTERVENTION PISU",
    "========================================",
    "",
    `Export généré le : ${new Date().toLocaleString("fr-FR")}`,
    `Version export : ${SAED_STRUCTURED_EXPORT_VERSION}`,
    "Version application : prototype à valider",
    "",
    "========================================",
    "1. SYNTHÈSE RAPIDE",
    "========================================",
    "",
    responderLine,
    "",
    "Équipage :",
    ...crewLines.map(line => `- ${line}`),
    "",
    `Patient : ${patientName}`,
    `Âge / naissance : ${patientAge}`,
    `Sexe : ${patientSex}`,
    `Catégorie : ${patientCategory}`,
    `Poids estimé : ${patientWeight}`,
    "",
    `Motif / protocole : ${protocolLine}`,
    "",
    "Constantes :",
    initialVitals && latestVitals && initialVitals !== latestVitals
      ? `- Initiales : ${initialVitals}`
      : "",
    latestVitals
      ? `- Dernières : ${latestVitals}`
      : "- Non renseignées",
    "",
    "Résumé clinique :",
    ...(syntheseClinique.length > 0
      ? syntheseClinique
      : ["- Aucun élément clinique prioritaire structuré."]),
    "",
    "Demande :",
    appelEvents.length > 0
      ? "- Appel / bilan régulateur tracé dans la chronologie."
      : "- Avis médical / conduite à tenir à demander ou à tracer.",
    "",
    "========================================",
    "2. SAED",
    "========================================",
    "",
    ...saedLines,
    "Repères intervention :",
    departLine ? `- ${departLine}` : "- Départ intervention : À compléter",
    arriveeLine ? `- ${arriveeLine}` : "- Arrivée sur les lieux : À compléter",
    gpsDepartLine ? `- ${gpsDepartLine}` : "",
    gpsArriveeLine ? `- ${gpsArriveeLine}` : "",
    "",
    "========================================",
    "3. CHRONOLOGIE CLINIQUE UTILE",
    "========================================",
    "",
    ...clinicalChronologyLines,
    "",
    "========================================",
    "4. JOURNAL COMPLET",
    "========================================",
    "",
    ...journalCompleteLines,
    "",
    "========================================",
    "FIN FEUILLE SAED",
    "========================================"
  ];

  return lines
    .filter((line, index, allLines) => {
      return line !== "" || allLines[index - 1] !== "";
    })
    .join("\n");
}

function formatAddress(properties) {
  if (!properties) return "";

  const street = properties.name || properties.street || "";
  const postcode = properties.postcode || "";
  const city = properties.city || "";
  const cityLine = [postcode, city].filter(Boolean).join(" ");

  return [street, cityLine].filter(Boolean).join(", ");
}

async function reverseGeocode(latitude, longitude) {
  const url = new URL("https://api-adresse.data.gouv.fr/reverse/");
  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);
  url.searchParams.set("limit", "1");

  const response = await fetch(url.toString());
  if (!response.ok) return "";

  const data = await response.json();
  const feature = data.features && data.features[0];

  return feature ? formatAddress(feature.properties) : "";
}

function addGpsPoint(actionLabel) {
  if (!("geolocation" in navigator)) {
    addLog(`GPS ${actionLabel} impossible : geolocalisation non disponible`);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async position => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = Math.round(position.coords.accuracy);
      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      const gpsText =
        `${latitude.toFixed(6)}, ${longitude.toFixed(6)} - precision +/-${accuracy} m - ${mapsLink}`;

      try {
        const address = await reverseGeocode(latitude, longitude);
        const addressText = address ? `Adresse : ${address} - ` : "";

        addLog(`GPS ${actionLabel} : ${addressText}${gpsText}`);
      } catch {
        addLog(`GPS ${actionLabel} : adresse indisponible - ${gpsText}`);
      }
    },
    error => {
      let message = `GPS ${actionLabel} impossible`;

      if (error.code === error.PERMISSION_DENIED) {
        message = `GPS ${actionLabel} refuse : autorisation non accordee`;
      }

      if (error.code === error.POSITION_UNAVAILABLE) {
        message = `GPS ${actionLabel} impossible : position indisponible`;
      }

      if (error.code === error.TIMEOUT) {
        message = `GPS ${actionLabel} impossible : delai depasse`;
      }

      addLog(message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
}

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    addLog(action);

    if (button.dataset.gps === "true") {
      addGpsPoint(action);
    }
  });
});

saveIdentityBtn.addEventListener("click", savePatientIdentity);
unknownIdentityBtn.addEventListener("click", setUnknownIdentity);

const startTimerBtn = document.getElementById("startTimer");
const resetTimerBtn = document.getElementById("resetTimer");

if (startTimerBtn) startTimerBtn.addEventListener("click", startTimer);
if (resetTimerBtn) resetTimerBtn.addEventListener("click", resetTimer);

function clearAllProtocolCounters() {
  [
    "pisu-counter-cee",
    "pisu-counter-adrenaline",
    "pisu-counter-cordarone",
    "pisu-counter-child-cee",
    "pisu-counter-child-adrenaline",
    "pisu-counter-child-cordarone",
    "pisu-counter-seizure-treatment",
    "pisu-counter-anaphylaxis-adrenaline",
    "pisu-counter-hemorrhage-txa",
    "pisu-counter-hypoglycemia-glucagon",
    "pisu-counter-hypoglycemia-g10",
    "pisu-counter-hypoglycemia-g30",
    "pisu-counter-asthma-terbutaline",
    "pisu-counter-asthma-ipratropium",
    "pisu-counter-asthma-methylpred",
    "pisu-counter-analgesia-paracetamol",
    "pisu-counter-analgesia-morphine",
    "pisu-counter-analgesia-meopa"
  ].forEach(key => localStorage.removeItem(key));
}

function resetPatientIdentityFields() {
  if (patientNameInput) patientNameInput.value = "";
  if (patientAgeInput) patientAgeInput.value = "";
  if (patientSexInput) patientSexInput.value = "";
  if (patientCategoryInput) patientCategoryInput.value = "";
  if (patientWeightInput) patientWeightInput.value = "";
  if (patientNoteInput) patientNoteInput.value = "";

  updatePatientIdentitySummary?.();
}

function resetAllVisualValidations() {
  document.querySelectorAll(".action-done, .click-feedback, .attention-flash").forEach(element => {
    element.classList.remove("action-done", "click-feedback", "attention-flash");
    delete element.dataset.clickCount;
  });
}

function resetMissionCompletely() {
  const confirmation = window.confirm(
    "Créer une nouvelle mission ?\n\nCela efface le patient, le journal, les QR codes, les validations et les compteurs.\n\nL’intervenant reste enregistré."
  );

  if (!confirmation) {
    return;
  }

  localStorage.removeItem("pisuLog");

  clearAllProtocolCounters();
  clearStructuredEvents();
  resetPatientIdentityFields();
  resetMissionCrew();
  resetAllVisualValidations();
  resetMissionHandoffUi?.();
  clearVitalsHistory();

  if (logEl) {
    logEl.innerHTML = "";
  }

  remaining = 120;

  if (timerEl) {
    timerEl.textContent = "02:00";
  }

  if (typeof showMainMenu === "function") {
    showMainMenu();
  }

  addLog("Nouvelle mission créée — journal remis à zéro");
}

document.getElementById("clearLog").addEventListener("click", () => {
  if (confirm("Effacer le journal de cette mission ?")) {
    localStorage.removeItem("pisuLog");

    clearAllProtocolCounters();
    clearStructuredEvents();
    resetMissionHandoffUi?.();
    resetAllVisualValidations();
    clearVitalsHistory();

    if (logEl) logEl.innerHTML = "";
    remaining = 120;
    if (timerEl) timerEl.textContent = "02:00";
  }
});

document.getElementById("copyLog").addEventListener("click", async () => {
  const text = exportText();
  try {
    await navigator.clipboard.writeText(text);
    alert("Journal copié.");
  } catch {
    alert(text);
  }
});

document.getElementById("downloadLog").addEventListener("click", () => {
  const blob = new Blob([exportText()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `saed-pisu-${new Date().toISOString().slice(0,10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.classList.remove("hidden");
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.classList.add("hidden");
});

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

function updateOnlineStatus() {
  offlineStatus.textContent = navigator.onLine
    ? "En ligne — l'app sera disponible hors ligne après le premier chargement."
    : "Hors ligne — mode cache actif.";
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => {
      updateOnlineStatus();
    })
    .catch(() => {
      offlineStatus.textContent = "Service worker non actif en local. Tester via GitHub Pages ou localhost.";
    });
}

function getGlobalCounterKey(button) {
  const counterType = button.dataset.countBadge;

  if (!counterType) {
    return null;
  }

  return `pisu-counter-${counterType}`;
}

function incrementButtonCounter(button) {
  const counterKey = getGlobalCounterKey(button);

  if (!counterKey) {
    return;
  }

  const currentValue = Number(localStorage.getItem(counterKey) || "0");
  const nextValue = currentValue + 1;

  localStorage.setItem(counterKey, String(nextValue));
  button.dataset.clickCount = String(nextValue);
}

function markButtonAsClicked(button) {
  if (!button) return;

  button.classList.remove("click-feedback");

  void button.offsetWidth;

  if (button.dataset.countBadge) {
    incrementButtonCounter(button);
  }

  button.classList.add("click-feedback");
  button.classList.add("action-done");

  window.setTimeout(() => {
    button.classList.remove("click-feedback");
  }, 500);
}

const LONG_PRESS_DURATION = 750;
const LONG_PRESS_MOVE_TOLERANCE = 12;

let longPressTimer = null;
let longPressTarget = null;
let longPressStartX = 0;
let longPressStartY = 0;

function getActionLabel(button) {
  const datasetKeys = [
    "action",
    "acrAction",
    "childAcrAction",
    "dtAction",
    "smokeAction",
    "burnAction",
    "seizureAction",
    "anaphylaxisAction",
    "hemoAction",
    "hypoAction",
    "asthmaAction",
    "analgesiaAction"
  ];

  for (const key of datasetKeys) {
    if (button.dataset[key]) {
      return button.dataset[key];
    }
  }

  return button.textContent.trim().replace(/\s+/g, " ");
}

function isLongPressCorrectableButton(button) {
  if (!button) return false;

  if (!button.matches(ACTION_BUTTON_SELECTOR)) return false;

  if (!button.classList.contains("action-done")) return false;

  if (button.closest(".protocols-block")) return false;

  if (button.closest(".export-actions")) return false;

  if (button.closest(".panel-title")) return false;

  if (button.matches("a")) return false;

  if (button.classList.contains("count-action")) return false;

  if (button.dataset.countBadge) return false;

  if (button.id && button.id.toLowerCase().includes("call15")) return false;

  if (button.id && button.id.toLowerCase().includes("reset")) return false;

  return true;
}

function clearLongPressTimer() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
  }

  longPressTimer = null;
  longPressTarget = null;
}

function cancelSimpleValidation(button) {
  if (!isLongPressCorrectableButton(button)) return;

  const label = getActionLabel(button);

  button.classList.remove("action-done", "click-feedback", "attention-flash", "long-press-pending");
  button.classList.add("undo-feedback");

  delete button.dataset.clickCount;

  window.setTimeout(() => {
    button.classList.remove("undo-feedback");
  }, 650);

  if (typeof addLog === "function") {
    addLog(`Correction : validation annulée visuellement — ${label}`);
  }

  if (handoffCode?.value) {
    resetMissionHandoffUi?.();
  }
}

function startLongPressDetection(event) {
  const button = event.target.closest(ACTION_BUTTON_SELECTOR);

  if (!isLongPressCorrectableButton(button)) return;

  longPressTarget = button;
  longPressStartX = event.clientX;
  longPressStartY = event.clientY;

  button.classList.add("long-press-pending");

  longPressTimer = window.setTimeout(() => {
    const target = longPressTarget;

    if (!target) return;

    cancelSimpleValidation(target);

    target.dataset.longPressCorrected = "true";

    if (navigator.vibrate) {
      navigator.vibrate(35);
    }

    clearLongPressTimer();
  }, LONG_PRESS_DURATION);
}

function moveLongPressDetection(event) {
  if (!longPressTarget) return;

  const deltaX = Math.abs(event.clientX - longPressStartX);
  const deltaY = Math.abs(event.clientY - longPressStartY);

  if (deltaX > LONG_PRESS_MOVE_TOLERANCE || deltaY > LONG_PRESS_MOVE_TOLERANCE) {
    longPressTarget.classList.remove("long-press-pending");
    clearLongPressTimer();
  }
}

function stopLongPressDetection() {
  if (longPressTarget) {
    longPressTarget.classList.remove("long-press-pending");
  }

  clearLongPressTimer();
}

document.addEventListener("pointerdown", startLongPressDetection, { passive: true });
document.addEventListener("pointermove", moveLongPressDetection, { passive: true });
document.addEventListener("pointerup", stopLongPressDetection, { passive: true });
document.addEventListener("pointercancel", stopLongPressDetection, { passive: true });

document.addEventListener("contextmenu", event => {
  const button = event.target.closest(ACTION_BUTTON_SELECTOR);

  if (isLongPressCorrectableButton(button)) {
    event.preventDefault();
  }
});

document.addEventListener("click", event => {
  const button = event.target.closest(ACTION_BUTTON_SELECTOR);

  if (!button?.dataset.longPressCorrected) return;

  event.preventDefault();
  event.stopImmediatePropagation();

  delete button.dataset.longPressCorrected;
}, true);

document.addEventListener("click", event => {
  const clickedElement = event.target.closest(ACTION_FEEDBACK_SELECTOR);

  if (!clickedElement) return;

  // Le menu principal "Protocole PISU" sert à naviguer :
  // on ne met pas de coche de validation dessus.
  if (clickedElement.closest(".protocols-block")) {
    clickedElement.classList.remove("action-done", "click-feedback");
    delete clickedElement.dataset.clickCount;
    return;
  }

  markButtonAsClicked(clickedElement);
});

function getProtocolPages() {
  return Array.from(document.querySelectorAll(
    "#acrAdultProtocol, #childAcrProtocol, #chestPainProtocol, #smokeExposureProtocol, #burnsProtocol, #seizureProtocol, #anaphylaxisProtocol, #hemorrhageProtocol, #hypoglycemiaProtocol, #asthmaBpcoProtocol, #analgesiaProtocol"
  ));
}

function getMainPageSections() {
  const protocolPages = getProtocolPages();

  return Array.from(document.querySelectorAll("main > section"))
    .filter(section => !protocolPages.includes(section));
}

function showMainMenu() {
  getProtocolPages().forEach(section => {
    section.classList.add("hidden");
  });

  getMainPageSections().forEach(section => {
    section.classList.remove("hidden");
  });

  document.body.classList.remove("protocol-mode");
  floatingBackMenuBtn?.classList.add("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  window.requestAnimationFrame(applyCall15AlertDisplay);
}

function showProtocolPage(protocolId) {
  const targetProtocol = document.getElementById(protocolId);

  if (!targetProtocol) return;

  getMainPageSections().forEach(section => {
    section.classList.add("hidden");
  });

  getProtocolPages().forEach(section => {
    section.classList.add("hidden");
  });

  targetProtocol.classList.remove("hidden");

  document.body.classList.add("protocol-mode");
  floatingBackMenuBtn?.classList.remove("hidden");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  window.requestAnimationFrame(applyCall15AlertDisplay);
}

window.showMainMenu = showMainMenu;
window.showProtocolPage = showProtocolPage;

floatingBackMenuBtn?.addEventListener("click", () => {
  showMainMenu();
});

function getResponderIdentity() {
  return {
    name: responderNameInput?.value?.trim() || "",
    role: responderRoleInput?.value || "",
    service: responderServiceInput?.value?.trim() || ""
  };
}

function formatResponderIdentity(responder = getResponderIdentity()) {
  const role = responder.role || "Fonction non renseignée";
  const name = responder.name || "Nom non renseigné";
  const service = responder.service || "Service non renseigné";

  return `${role} — ${name} — ${service}`;
}

function saveResponderIdentity() {
  const responder = getResponderIdentity();

  localStorage.setItem("pisuResponder", JSON.stringify(responder));

  if (typeof addLog === "function") {
    addLog(`Intervenant identifié : ${formatResponderIdentity(responder)}`);
  }

  updateResponderSummary();
}

function loadResponderIdentity() {
  try {
    const saved = JSON.parse(localStorage.getItem("pisuResponder") || "{}");

    if (responderNameInput) responderNameInput.value = saved.name || "";
    if (responderRoleInput) responderRoleInput.value = saved.role || "";
    if (responderServiceInput) responderServiceInput.value = saved.service || "";
  } catch {
    localStorage.removeItem("pisuResponder");
  }
}

function getPatientSnapshot() {
  return {
    name: patientNameInput?.value || "",
    age: patientAgeInput?.value || "",
    sex: patientSexInput?.value || "",
    category: patientCategoryInput?.value || "",
    weight: patientWeightInput?.value || "",
    note: patientNoteInput?.value || ""
  };
}

function applyPatientSnapshot(patient = {}) {
  if (patientNameInput) patientNameInput.value = patient.name || "";
  if (patientAgeInput) patientAgeInput.value = patient.age || "";
  if (patientSexInput) patientSexInput.value = patient.sex || "";
  if (patientCategoryInput) patientCategoryInput.value = patient.category || "";
  if (patientWeightInput) patientWeightInput.value = patient.weight || "";
  if (patientNoteInput) patientNoteInput.value = patient.note || "";

  updatePatientIdentitySummary();
}

function encodeMissionPayload(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);

  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeMissionPayload(codeOrUrl) {
  let code = codeOrUrl.trim();

  if (code.includes("#mission=")) {
    code = code.split("#mission=")[1];
  }

  if (code.includes("mission=")) {
    code = code.split("mission=")[1];
  }

  code = decodeURIComponent(code.trim());

  const base64 = code
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(code.length / 4) * 4, "=");

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  const json = new TextDecoder().decode(bytes);

  return JSON.parse(json);
}

function buildMissionPayload() {
  return {
    type: "pisu-mission-transfer",
    version: 5,
    createdAt: new Date().toISOString(),
    responder: getResponderIdentity(),
    patient: getPatientSnapshot(),
    crew: getMissionCrew(),
    vitals: getVitalsEntries(),
    vitalsAlert: getLatestVitalsAlert(),
    events: getStructuredEvents(),
    log: getLog()
  };
}

function buildTransferUrl(code) {
  return `${window.location.origin}${window.location.pathname}#mission=${encodeURIComponent(code)}`;
}

function updateHandoffSummary(text = null) {
  if (!handoffSummary) return;

  if (text) {
    handoffSummary.textContent = text;
    return;
  }

  if (handoffCode?.value) {
    handoffSummary.textContent = "Code de transfert généré";
    return;
  }

  handoffSummary.textContent = "Aucun code de transfert généré";
}

function resetMissionHandoffUi() {
  if (handoffCode) {
    handoffCode.value = "";
  }

  if (importHandoffCode) {
    importHandoffCode.value = "";
  }

  if (handoffQrImage) {
    handoffQrImage.src = "";
    handoffQrImage.classList.add("hidden");
  }

  if (handoffBox) {
    handoffBox.classList.add("hidden");
  }

  if (importHandoffBox) {
    importHandoffBox.classList.add("hidden");
  }

  if (handoffWarning) {
    handoffWarning.textContent = "";
  }

  updateHandoffSummary("Aucun code de transfert généré");
}

function createMissionHandoff() {
  const payload = buildMissionPayload();
  const code = encodeMissionPayload(payload);
  const transferUrl = buildTransferUrl(code);

  handoffBox?.classList.remove("hidden");

  setCollapsibleState(
    handoffPanel,
    toggleHandoffBtn,
    handoffContent,
    "pisu-collapse-handoff",
    false
  );

  updateHandoffSummary(`Code généré à ${new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  })}`);

  if (handoffCode) {
    handoffCode.value = transferUrl;
  }

  if (handoffWarning) {
    handoffWarning.textContent = "";
  }

  if (handoffQrImage) {
    if (transferUrl.length > 2400) {
      handoffQrImage.classList.add("hidden");

      if (handoffWarning) {
        handoffWarning.textContent =
          "Journal trop long pour un QR fiable : utilise plutôt le bouton Copier le code.";
      }
    } else {
      handoffQrImage.src =
        `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(transferUrl)}`;
      handoffQrImage.classList.remove("hidden");

      if (handoffWarning) {
        handoffWarning.textContent =
          "QR disponible si internet est actif. Le code texte reste la solution de secours.";
      }
    }
  }

  addLog("Code de transfert mission généré");
}

async function copyMissionHandoffCode() {
  if (!handoffCode?.value) return;

  try {
    await navigator.clipboard.writeText(handoffCode.value);
    addLog("Code de transfert mission copié");
  } catch {
    handoffCode.select();
    document.execCommand("copy");
    addLog("Code de transfert mission copié");
  }
}

function importMissionPayloadFromText(text) {
  let payload;

  try {
    payload = decodeMissionPayload(text);
  } catch {
    alert("Code de transfert illisible.");
    return;
  }

  if (payload.type !== "pisu-mission-transfer") {
    alert("Ce code ne correspond pas à une mission PISU.");
    return;
  }

  const confirmation = window.confirm(
    "Importer cette mission ?\n\nLe journal actuel sera remplacé par le journal transféré."
  );

  if (!confirmation) {
    return;
  }

  applyPatientSnapshot(payload.patient);

  if (Array.isArray(payload.vitals)) {
    saveVitalsEntries(payload.vitals);
    renderVitalsHistory();
  } else {
    clearVitalsHistory();
  }

  if (payload.vitalsAlert && payload.vitalsAlert.level) {
    saveLatestVitalsAlert(payload.vitalsAlert);
  } else {
    localStorage.removeItem(VITALS_ALERT_STORAGE_KEY);
  }

  renderVitalsAlertBanner();
  applyCall15AlertDisplay();

  if (Array.isArray(payload.crew)) {
    applyMissionCrewSnapshot(payload.crew);
  } else {
    resetMissionCrew();
  }

  if (Array.isArray(payload.events)) {
    saveStructuredEvents(payload.events);
  } else {
    clearStructuredEvents();
  }

  localStorage.setItem("pisuLog", JSON.stringify(payload.log || []));
  loadLog();

  const originResponder = formatResponderIdentity(payload.responder || {});
  const currentResponder = formatResponderIdentity(getResponderIdentity());

  addLog(`Mission reprise depuis transfert. Origine : ${originResponder}. Reprise par : ${currentResponder}`);

  window.location.hash = "";
}

function checkMissionHashImport() {
  if (!window.location.hash.includes("mission=")) {
    return;
  }

  const code = window.location.hash.split("mission=")[1];

  setCollapsibleState(
    handoffPanel,
    toggleHandoffBtn,
    handoffContent,
    "pisu-collapse-handoff",
    false
  );

  if (importHandoffBox) {
    importHandoffBox.classList.remove("hidden");
  }

  if (importHandoffCode) {
    importHandoffCode.value = code;
  }

  const confirmation = window.confirm(
    "Un transfert de mission a été détecté.\n\nImporter le journal maintenant ?"
  );

  if (confirmation) {
    importMissionPayloadFromText(code);
  }
}

saveResponderBtn?.addEventListener("click", saveResponderIdentity);

newMissionResetBtn?.addEventListener("click", resetMissionCompletely);

createHandoffBtn?.addEventListener("click", createMissionHandoff);

copyHandoffCodeBtn?.addEventListener("click", copyMissionHandoffCode);

showImportHandoffBtn?.addEventListener("click", () => {
  setCollapsibleState(
    handoffPanel,
    toggleHandoffBtn,
    handoffContent,
    "pisu-collapse-handoff",
    false
  );

  importHandoffBox?.classList.toggle("hidden");
});

confirmImportHandoffBtn?.addEventListener("click", () => {
  importMissionPayloadFromText(importHandoffCode?.value || "");
});

function setCollapsibleState(panel, toggleButton, content, storageKey, collapsed) {
  if (!panel || !toggleButton || !content) return;

  panel.classList.toggle("collapsed", collapsed);
  content.hidden = collapsed;
  toggleButton.setAttribute("aria-expanded", String(!collapsed));

  localStorage.setItem(storageKey, collapsed ? "collapsed" : "open");
}

function setupCollapsiblePanel(panel, toggleButton, content, storageKey) {
  if (!panel || !toggleButton || !content) return;

  const savedState = localStorage.getItem(storageKey);
  const shouldStartCollapsed = savedState === "collapsed";

  setCollapsibleState(panel, toggleButton, content, storageKey, shouldStartCollapsed);

  toggleButton.addEventListener("click", () => {
    const isCollapsed = panel.classList.contains("collapsed");
    setCollapsibleState(panel, toggleButton, content, storageKey, !isCollapsed);
  });
}

function updateResponderSummary() {
  if (!responderSummary) return;

  const responder = getResponderIdentity?.() || {};
  const hasResponder =
    Boolean(responder.name) ||
    Boolean(responder.role) ||
    Boolean(responder.service);

  responderSummary.textContent = hasResponder
    ? formatResponderIdentity(responder)
    : "Intervenant non renseigné";
}

function updatePatientIdentitySummary() {
  if (!patientIdentitySummary) return;

  const name = patientNameInput?.value?.trim();
  const age = patientAgeInput?.value?.trim();
  const sex = patientSexInput?.value?.trim();
  const weight = patientWeightInput?.value?.trim();

  const parts = [];

  parts.push(name || "Identité non renseignée");

  if (age) {
    parts.push(`Âge/naissance : ${age}`);
  }

  if (sex) {
    parts.push(`Sexe : ${sex}`);
  }

  if (weight) {
    parts.push(`Poids : ${weight}`);
  }

  patientIdentitySummary.textContent = parts.join(" — ");
}

function setupIdentitySummaries() {
  [
    responderNameInput,
    responderRoleInput,
    responderServiceInput
  ].forEach(input => {
    input?.addEventListener("input", updateResponderSummary);
    input?.addEventListener("change", updateResponderSummary);
  });

  [
    patientNameInput,
    patientAgeInput,
    patientSexInput,
    patientCategoryInput,
    patientWeightInput,
    patientNoteInput
  ].forEach(input => {
    input?.addEventListener("input", updatePatientIdentitySummary);
    input?.addEventListener("change", updatePatientIdentitySummary);
  });
}

function invalidateHandoffWhenPatientChanges() {
  [
    patientNameInput,
    patientAgeInput,
    patientSexInput,
    patientCategoryInput,
    patientWeightInput,
    patientNoteInput
  ].forEach(input => {
    input?.addEventListener("input", () => {
      if (handoffCode?.value) {
        resetMissionHandoffUi?.();
      }
    });

    input?.addEventListener("change", () => {
      if (handoffCode?.value) {
        resetMissionHandoffUi?.();
      }
    });
  });
}

function updateMobileLayoutOffsets() {
  if (!appHeader) return;

  const headerHeight = Math.ceil(appHeader.getBoundingClientRect().height);

  document.documentElement.style.setProperty(
    "--app-header-height",
    `${headerHeight}px`
  );

  document.documentElement.style.setProperty(
    "--protocol-sticky-top",
    `${headerHeight + 10}px`
  );
}

function setupMobileLayoutOffsets() {
  updateMobileLayoutOffsets();

  window.addEventListener("resize", updateMobileLayoutOffsets);

  window.addEventListener("orientationchange", () => {
    window.setTimeout(updateMobileLayoutOffsets, 250);
  });

  if ("ResizeObserver" in window && appHeader) {
    const observer = new ResizeObserver(updateMobileLayoutOffsets);
    observer.observe(appHeader);
  }
}

function setupCollapsiblePanels() {
  setupCollapsiblePanel(
    responderPanel,
    toggleResponderBtn,
    responderContent,
    "pisu-collapse-responder"
  );

  setupCollapsiblePanel(
    crewPanel,
    toggleCrewBtn,
    crewContent,
    "pisu-collapse-crew"
  );

  setupCollapsiblePanel(
    patientIdentityPanel,
    togglePatientIdentityBtn,
    patientIdentityContent,
    "pisu-collapse-patient-identity"
  );

  setupCollapsiblePanel(
    handoffPanel,
    toggleHandoffBtn,
    handoffContent,
    "pisu-collapse-handoff"
  );

  setupIdentitySummaries();
  updateResponderSummary();
  updatePatientIdentitySummary();
  updateHandoffSummary();
  updateCrewSummary();
}

const VITALS_STORAGE_KEY = "pisuVitals";

function populateOrderedRangeSelect(select, config) {
  if (!select) return;

  const {
    min,
    max,
    anchor,
    start = anchor,
    step = 1,
    direction = "centered",
    suffix = "",
    decimals = 0
  } = config;

  const currentValue = select.value;
  const currentTouched = select.dataset.vitalsTouched === "true";

  select.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Non renseigné";
  select.appendChild(emptyOption);

  const values = [];

  function normalizeValue(value) {
    return Number(value.toFixed(decimals));
  }

  function addValue(value) {
    const rounded = normalizeValue(value);

    if (rounded < min || rounded > max) return;
    if (values.includes(rounded)) return;

    values.push(rounded);
  }

  if (direction === "down") {
    for (let value = start; value >= min; value -= step) {
      addValue(value);
    }
  } else if (direction === "up") {
    for (let value = start; value <= max; value += step) {
      addValue(value);
    }
  } else {
    for (let value = min; value <= max + step / 2; value += step) {
      addValue(value);
    }
  }

  values.forEach(value => {
    const option = document.createElement("option");

    const optionValue = decimals > 0
      ? value.toFixed(decimals)
      : String(value);

    const textValue = decimals > 0
      ? value.toFixed(decimals).replace(".", ",")
      : String(value);

    option.value = optionValue;
    option.textContent = `${textValue}${suffix}`;

    select.appendChild(option);
  });

  const defaultValue = select.dataset.vitalDefault || (
    decimals > 0
      ? Number(start).toFixed(decimals)
      : String(start)
  );

  if (currentValue && Array.from(select.options).some(option => option.value === currentValue)) {
    select.value = currentValue;
    select.dataset.vitalsTouched = currentTouched ? "true" : "false";
  } else if (defaultValue && Array.from(select.options).some(option => option.value === defaultValue)) {
    select.value = defaultValue;
    select.dataset.vitalsTouched = "false";
  } else {
    select.value = "";
    select.dataset.vitalsTouched = "false";
  }
}

function populateVitalsSelects() {
  populateOrderedRangeSelect(vitalsSpo2Input, {
    min: 40,
    max: 100,
    start: 100,
    step: 1,
    direction: "down",
    suffix: "%"
  });

  populateOrderedRangeSelect(vitalsFcInput, {
    min: 20,
    max: 250,
    start: 80,
    step: 1,
    direction: "centered",
    suffix: "/min"
  });

  populateOrderedRangeSelect(vitalsFrInput, {
    min: 0,
    max: 80,
    start: 20,
    step: 1,
    direction: "centered",
    suffix: "/min"
  });

  populateOrderedRangeSelect(vitalsTasInput, {
    min: 40,
    max: 280,
    start: 120,
    step: 1,
    direction: "centered"
  });

  populateOrderedRangeSelect(vitalsTadInput, {
    min: 20,
    max: 180,
    start: 70,
    step: 1,
    direction: "centered"
  });

  populateOrderedRangeSelect(vitalsOxygenFlowInput, {
    min: 0,
    max: 15,
    start: 15,
    step: 1,
    direction: "down",
    suffix: " L/min"
  });

  populateOrderedRangeSelect(vitalsTempInput, {
    min: 34,
    max: 42,
    start: 37,
    step: 0.1,
    direction: "centered",
    suffix: " °C",
    decimals: 1
  });

  populateOrderedRangeSelect(vitalsGlycemiaInput, {
    min: 0.2,
    max: 6,
    start: 1,
    step: 0.05,
    direction: "centered",
    suffix: " g/L",
    decimals: 2
  });

  populateOrderedRangeSelect(vitalsGcsInput, {
    min: 3,
    max: 15,
    start: 15,
    step: 1,
    direction: "centered"
  });

  populateOrderedRangeSelect(vitalsPainInput, {
    min: 0,
    max: 10,
    start: 0,
    step: 1,
    direction: "centered",
    suffix: "/10"
  });
}

function getVitalsFieldValue(input) {
  if (!input) return "";

  const isSelect = input.tagName === "SELECT";
  const isVitalDefaultSelect = Boolean(input.dataset.vitalDefault);

  if (isSelect && isVitalDefaultSelect && input.dataset.vitalsTouched !== "true") {
    return "";
  }

  return input.value?.trim() || "";
}

function markVitalsFieldTouched(event) {
  const input = event.target;

  if (!input?.dataset?.vitalDefault) return;

  input.dataset.vitalsTouched = "true";
}

function setupVitalsTouchedTracking() {
  const fields = [
    vitalsFcInput,
    vitalsTasInput,
    vitalsTadInput,
    vitalsSpo2Input,
    vitalsOxygenFlowInput,
    vitalsFrInput,
    vitalsTempInput,
    vitalsGcsInput,
    vitalsPainInput,
    vitalsGlycemiaInput
  ];

  fields.forEach(input => {
    if (!input) return;

    input.addEventListener("focus", markVitalsFieldTouched);
    input.addEventListener("pointerdown", markVitalsFieldTouched);
    input.addEventListener("change", markVitalsFieldTouched);
  });
}

function normalizeDecimalValue(value) {
  return String(value || "").trim().replace(",", ".");
}

function getCleanValue(input) {
  return input?.value?.trim() || "";
}

function getVitalsEntries() {
  try {
    const entries = JSON.parse(localStorage.getItem(VITALS_STORAGE_KEY) || "[]");
    return Array.isArray(entries) ? entries : [];
  } catch {
    localStorage.removeItem(VITALS_STORAGE_KEY);
    return [];
  }
}

function saveVitalsEntries(entries) {
  localStorage.setItem(VITALS_STORAGE_KEY, JSON.stringify(entries));
}

function formatVitalsTime(date = new Date()) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function buildVitalsEntry() {
  const now = new Date();
  const entries = getVitalsEntries();

  return {
    id: window.crypto?.randomUUID ? window.crypto.randomUUID() : `vitals-${Date.now()}`,
    number: entries.length + 1,
    createdAt: now.toISOString(),
    time: formatVitalsTime(now),
    moment: getCleanValue(vitalsMomentInput) || "Non précisé",
    fc: getVitalsFieldValue(vitalsFcInput),
    tas: getVitalsFieldValue(vitalsTasInput),
    tad: getVitalsFieldValue(vitalsTadInput),
    spo2: getVitalsFieldValue(vitalsSpo2Input),
    oxygenSupport: getCleanValue(vitalsOxygenSupportInput),
    oxygenFlow: normalizeDecimalValue(getVitalsFieldValue(vitalsOxygenFlowInput)),
    fr: getVitalsFieldValue(vitalsFrInput),
    temperature: normalizeDecimalValue(getVitalsFieldValue(vitalsTempInput)),
    gcs: getVitalsFieldValue(vitalsGcsInput),
    pain: getVitalsFieldValue(vitalsPainInput),
    glycemia: normalizeDecimalValue(getVitalsFieldValue(vitalsGlycemiaInput))
  };
}

function hasVitalsData(entry) {
  return Boolean(
    entry.fc ||
    entry.tas ||
    entry.tad ||
    entry.spo2 ||
    entry.oxygenSupport ||
    entry.oxygenFlow ||
    entry.fr ||
    entry.temperature ||
    entry.gcs ||
    entry.pain ||
    entry.glycemia
  );
}

function formatVitalsEntry(entry, options = {}) {
  const parts = [];

  if (entry.fc) parts.push(`FC ${entry.fc}/min`);

  if (entry.tas || entry.tad) {
    const tas = entry.tas || "?";
    const tad = entry.tad || "?";
    parts.push(`TA ${tas}/${tad}`);
  }

  if (entry.spo2) {
    let spo2Text = `SpO₂ ${entry.spo2}%`;

    if (entry.oxygenSupport) {
      spo2Text += ` sous ${entry.oxygenSupport}`;
    }

    if (entry.oxygenFlow) {
      spo2Text += ` ${entry.oxygenFlow} L/min`;
    }

    parts.push(spo2Text);
  } else if (entry.oxygenSupport || entry.oxygenFlow) {
    let oxygenText = `O₂ ${entry.oxygenSupport || ""}`.trim();

    if (entry.oxygenFlow) {
      oxygenText += ` ${entry.oxygenFlow} L/min`;
    }

    parts.push(oxygenText);
  }

  if (entry.fr) parts.push(`FR ${entry.fr}/min`);
  if (entry.temperature) parts.push(`T° ${entry.temperature.replace(".", ",")}°C`);
  if (entry.gcs) parts.push(`GCS ${entry.gcs}`);
  if (entry.pain) parts.push(`EN ${entry.pain}/10`);
  if (entry.glycemia) parts.push(`Glycémie ${entry.glycemia.replace(".", ",")} g/L`);

  if (parts.length === 0) {
    return "Constantes non renseignées";
  }

  const prefix = options.withNumber === false
    ? `${entry.time} — ${entry.moment}`
    : `${entry.time} — Constantes #${entry.number} (${entry.moment})`;

  return `${prefix} : ${parts.join(" ; ")}.`;
}

function readNumericVital(value) {
  if (value === null || value === undefined || value === "") return null;

  const number = Number(String(value).replace(",", "."));

  return Number.isFinite(number) ? number : null;
}

function getCurrentProtocolPageId() {
  const pages = typeof getProtocolPages === "function"
    ? getProtocolPages()
    : Array.from(document.querySelectorAll("section[id$='Protocol']"));

  const visiblePage = pages.find(page => {
    return !page.classList.contains("hidden") && page.offsetParent !== null;
  });

  return visiblePage?.id || "";
}

function isPediatricVitalsContext() {
  const category = window.pisuPatient?.getCategory?.() || patientCategoryInput?.value || "";
  const protocolId = getCurrentProtocolPageId();

  return (
    protocolId === "childAcrProtocol" ||
    category.startsWith("enfant") ||
    category.startsWith("nourrisson")
  );
}

function getEmptyVitalsAlert() {
  return {
    level: "none",
    call15Level: "none",
    red: [],
    orange: [],
    reasons: [],
    message: "",
    createdAt: new Date().toISOString()
  };
}

function getVitalsAlertWeight(level) {
  if (level === "red") return 3;
  if (level === "orange") return 2;
  return 1;
}

function analyzeVitalsAlerts(entry) {
  const alert = getEmptyVitalsAlert();

  const fc = readNumericVital(entry.fc);
  const tas = readNumericVital(entry.tas);
  const spo2 = readNumericVital(entry.spo2);
  const fr = readNumericVital(entry.fr);
  const temperature = readNumericVital(entry.temperature);
  const gcs = readNumericVital(entry.gcs);
  const glycemia = readNumericVital(entry.glycemia);

  const pediatricContext = isPediatricVitalsContext();

  function addRed(reason) {
    alert.red.push(reason);
  }

  function addOrange(reason) {
    alert.orange.push(reason);
  }

  if (!pediatricContext) {
    if (tas !== null && tas < 90) addRed(`TAS ${tas} mmHg < 90`);
    else if (tas !== null && tas >= 90 && tas <= 100) addOrange(`TAS ${tas} mmHg limite`);

    if (fc !== null && fc <= 40) addRed(`FC ${fc}/min <= 40`);
    else if (fc !== null && fc >= 160) addRed(`FC ${fc}/min >= 160`);
    else if (fc !== null && fc >= 130 && fc <= 159) addOrange(`FC ${fc}/min élevée`);
    else if (fc !== null && fc >= 41 && fc <= 50) addOrange(`FC ${fc}/min basse`);

    if (fc !== null && tas !== null && tas > 0) {
      const shockIndex = fc / tas;

      if (shockIndex > 1.2) {
        addRed(`Shock index ${shockIndex.toFixed(2).replace(".", ",")} > 1,2`);
      } else if (shockIndex > 1) {
        addOrange(`Shock index ${shockIndex.toFixed(2).replace(".", ",")} > 1`);
      }
    }
  }

  if (fr !== null && fr < 10) addRed(`FR ${fr}/min < 10`);
  else if (fr !== null && fr >= 30) addRed(`FR ${fr}/min >= 30`);
  else if (fr !== null && fr >= 25 && fr <= 29) addOrange(`FR ${fr}/min élevée`);
  else if (fr !== null && fr >= 10 && fr <= 11) addOrange(`FR ${fr}/min basse`);

  if (spo2 !== null && spo2 < 90) addRed(`SpO₂ ${spo2}% < 90`);
  else if (spo2 !== null && spo2 >= 90 && spo2 <= 92) addOrange(`SpO₂ ${spo2}% limite`);

  if (gcs !== null && gcs <= 8) addRed(`GCS ${gcs} <= 8`);
  else if (gcs !== null && gcs >= 9 && gcs <= 12) addOrange(`GCS ${gcs} altéré`);

  if (glycemia !== null && glycemia < 0.6) {
    addRed(`Glycémie ${String(entry.glycemia).replace(".", ",")} g/L < 0,60`);
  } else if (glycemia !== null && glycemia >= 0.6 && glycemia < 0.7) {
    addOrange(`Glycémie ${String(entry.glycemia).replace(".", ",")} g/L < 0,70`);
  }

  if (glycemia !== null && glycemia < 0.7 && gcs !== null && gcs < 15) {
    addRed("Glycémie basse avec trouble de conscience");
  }

  if (temperature !== null && temperature < 35) {
    addOrange(`Température ${String(entry.temperature).replace(".", ",")}°C < 35`);
  } else if (temperature !== null && temperature >= 40) {
    addOrange(`Température ${String(entry.temperature).replace(".", ",")}°C >= 40`);
  }

  alert.reasons = [...alert.red, ...alert.orange];

  if (alert.red.length > 0) {
    alert.level = "red";
    alert.call15Level = "red";
    alert.message = "Constantes inquiétantes : bilan médecin régulateur prioritaire.";
  } else if (alert.orange.length >= 2) {
    alert.level = "orange";
    alert.call15Level = "red";
    alert.message = "Plusieurs constantes limites : bilan médecin régulateur prioritaire à envisager.";
  } else if (alert.orange.length === 1) {
    alert.level = "orange";
    alert.call15Level = "orange";
    alert.message = "Constante limite : surveillance rapprochée et bilan selon contexte.";
  }

  alert.createdAt = new Date().toISOString();

  return alert;
}

function saveLatestVitalsAlert(alert) {
  if (!alert || alert.level === "none") {
    localStorage.removeItem(VITALS_ALERT_STORAGE_KEY);
    return;
  }

  localStorage.setItem(VITALS_ALERT_STORAGE_KEY, JSON.stringify(alert));
}

function getLatestVitalsAlert() {
  try {
    const alert = JSON.parse(localStorage.getItem(VITALS_ALERT_STORAGE_KEY) || "{}");

    if (!alert || !alert.level) {
      return getEmptyVitalsAlert();
    }

    return alert;
  } catch {
    localStorage.removeItem(VITALS_ALERT_STORAGE_KEY);
    return getEmptyVitalsAlert();
  }
}

function clearVitalsAlerts() {
  localStorage.removeItem(VITALS_ALERT_STORAGE_KEY);
  renderVitalsAlertBanner();
  applyCall15AlertDisplay();
}

function renderVitalsAlertBanner(alert = getLatestVitalsAlert()) {
  if (!vitalsAlertBanner) return;

  vitalsAlertBanner.classList.remove("alert-orange", "alert-red");

  const reasons = Array.isArray(alert?.reasons) ? alert.reasons : [];

  if (!alert || alert.level === "none" || reasons.length === 0) {
    vitalsAlertBanner.classList.add("hidden");
    vitalsAlertBanner.textContent = "Aucune alerte constante.";
    return;
  }

  vitalsAlertBanner.classList.remove("hidden");
  vitalsAlertBanner.classList.add(alert.level === "red" ? "alert-red" : "alert-orange");

  vitalsAlertBanner.textContent = `${alert.message} ${reasons.join(" ; ")}.`;
}

function getCall15Buttons() {
  return Array.from(document.querySelectorAll(CALL15_BUTTON_SELECTOR));
}

function getCurrentProtocolCall15Button() {
  const protocolId = getCurrentProtocolPageId();
  const buttonId = PROTOCOL_CALL15_BUTTON_MAP[protocolId];

  if (!buttonId) return null;

  return document.getElementById(buttonId);
}

function getProtocolBaseCall15Alert() {
  const protocolId = getCurrentProtocolPageId();

  if (protocolId === "acrAdultProtocol") {
    return {
      level: "red",
      reason: "ACR adulte : appel / bilan 15 prioritaire."
    };
  }

  if (protocolId === "childAcrProtocol") {
    return {
      level: "red",
      reason: "ACR enfant : appel / bilan 15 prioritaire."
    };
  }

  return {
    level: "none",
    reason: ""
  };
}

function getEffectiveCall15Alert() {
  const vitalsAlert = getLatestVitalsAlert();
  const protocolAlert = getProtocolBaseCall15Alert();

  const vitalsLevel = vitalsAlert?.call15Level || "none";
  const protocolLevel = protocolAlert.level || "none";

  const effectiveLevel = getVitalsAlertWeight(protocolLevel) > getVitalsAlertWeight(vitalsLevel)
    ? protocolLevel
    : vitalsLevel;

  const reasons = [];

  if (protocolAlert.reason) reasons.push(protocolAlert.reason);

  if (vitalsAlert?.reasons?.length) {
    reasons.push(`Constantes : ${vitalsAlert.reasons.join(" ; ")}`);
  }

  return {
    level: effectiveLevel,
    reasons
  };
}

function applyCall15AlertDisplay() {
  const buttons = getCall15Buttons();

  buttons.forEach(button => {
    button.classList.remove("call15-alert-orange", "call15-alert-red");
    button.removeAttribute("data-call15-alert");
    button.removeAttribute("title");
  });

  const currentButton = getCurrentProtocolCall15Button();

  if (!currentButton) return;

  if (currentButton.classList.contains("action-done")) return;

  const effectiveAlert = getEffectiveCall15Alert();

  if (!effectiveAlert || effectiveAlert.level === "none") return;

  currentButton.classList.add(
    effectiveAlert.level === "red"
      ? "call15-alert-red"
      : "call15-alert-orange"
  );

  currentButton.dataset.call15Alert = effectiveAlert.level;
  currentButton.title = effectiveAlert.reasons.join(" ");
}

function resetVitalSelect(input) {
  if (!input) return;

  const defaultValue = input.dataset.vitalDefault || "";

  if (defaultValue) {
    input.value = defaultValue;
    input.dataset.vitalsTouched = "false";
  } else {
    input.value = "";
  }
}

function clearVitalsForm() {
  [
    vitalsFcInput,
    vitalsTasInput,
    vitalsTadInput,
    vitalsSpo2Input,
    vitalsOxygenFlowInput,
    vitalsFrInput,
    vitalsTempInput,
    vitalsGcsInput,
    vitalsPainInput,
    vitalsGlycemiaInput
  ].forEach(resetVitalSelect);

  if (vitalsOxygenSupportInput) vitalsOxygenSupportInput.value = "";
}

function renderVitalsHistory() {
  const entries = getVitalsEntries();

  if (vitalsLastSummary) {
    if (entries.length === 0) {
      vitalsLastSummary.textContent = "Aucune constante enregistrée.";
    } else {
      const latest = entries[entries.length - 1];
      vitalsLastSummary.textContent = `Dernières constantes : ${formatVitalsEntry(latest, { withNumber: false })}`;
    }
  }

  if (!vitalsHistory) {
    renderVitalsAlertBanner();
    applyCall15AlertDisplay();
    return;
  }

  if (entries.length === 0) {
    vitalsHistory.textContent = "Aucune constante enregistrée.";
    renderVitalsAlertBanner();
    applyCall15AlertDisplay();
    return;
  }

  vitalsHistory.innerHTML = "";

  entries.slice().reverse().forEach(entry => {
    const item = document.createElement("div");
    item.className = "vitals-history-item";
    item.textContent = formatVitalsEntry(entry);
    vitalsHistory.appendChild(item);
  });

  renderVitalsAlertBanner();
  applyCall15AlertDisplay();
}

function updateVitalsFloatingButtonState(isOpen) {
  if (!floatingVitalsBtn) return;

  floatingVitalsBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");

  if (isOpen) {
    floatingVitalsBtn.textContent = "↙ Constantes";
    floatingVitalsBtn.title = "Fermer les constantes";
  } else {
    floatingVitalsBtn.textContent = "📊 Constantes";
    floatingVitalsBtn.title = "Ouvrir les constantes";
  }
}

function openVitalsSheet() {
  populateVitalsSelects();
  renderVitalsHistory();

  vitalsOverlay?.classList.remove("hidden");
  vitalsSheet?.classList.remove("hidden");
  document.body.classList.add("vitals-sheet-open");

  updateVitalsFloatingButtonState(true);
}

function closeVitalsSheet() {
  vitalsOverlay?.classList.add("hidden");
  vitalsSheet?.classList.add("hidden");
  document.body.classList.remove("vitals-sheet-open");

  updateVitalsFloatingButtonState(false);
}

function toggleVitalsSheet() {
  const isOpen = vitalsSheet && !vitalsSheet.classList.contains("hidden");

  if (isOpen) {
    closeVitalsSheet();
  } else {
    openVitalsSheet();
  }
}

function saveCurrentVitals() {
  const entry = buildVitalsEntry();

  if (!hasVitalsData(entry)) {
    alert("Aucune constante renseignée.");
    return;
  }

  const entries = getVitalsEntries();
  entries.push(entry);
  saveVitalsEntries(entries);

  const line = formatVitalsEntry(entry).replace(`${entry.time} — `, "");
  addLog(line, {
    protocole: "Constantes",
    categorie: "constante",
    sousCategorie: "bilan_vital",
    libelleCourt: line,
    libelleLong: line,
    statut: "realise",
    sectionSAED: "S",
    priorite: "haute",
    type: "clinique",
    visibleSynthese: true,
    visibleSAED: true,
    visibleChrono: true,
    visibleJournal: true
  });

  const alert = analyzeVitalsAlerts(entry);
  saveLatestVitalsAlert(alert);
  renderVitalsAlertBanner(alert);
  applyCall15AlertDisplay();

  if (alert.level !== "none") {
    const alertLine = `Alerte constantes ${alert.level.toUpperCase()} : ${alert.reasons.join(" ; ")} — ${alert.message}`;

    addLog(alertLine, {
      protocole: getCurrentProtocolPageId() || "Constantes",
      categorie: "signe_clinique",
      sousCategorie: "alerte_constantes",
      libelleCourt: alertLine,
      libelleLong: alertLine,
      statut: "a_confirmer",
      sectionSAED: "S",
      priorite: alert.call15Level === "red" ? "haute" : "moyenne",
      type: "clinique",
      visibleSynthese: true,
      visibleSAED: true,
      visibleChrono: true,
      visibleJournal: true
    });
  }

  renderVitalsHistory();

  if (handoffCode?.value) {
    resetMissionHandoffUi?.();
  }
}

function clearVitalsHistory() {
  localStorage.removeItem(VITALS_STORAGE_KEY);
  localStorage.removeItem(VITALS_ALERT_STORAGE_KEY);
  clearVitalsForm();
  renderVitalsHistory();
  renderVitalsAlertBanner();
  applyCall15AlertDisplay();
}

function getInitialVitalsLine() {
  const entries = getVitalsEntries();
  if (entries.length === 0) return "À compléter.";

  return formatVitalsEntry(entries[0], { withNumber: false });
}

function getLatestVitalsLine() {
  const entries = getVitalsEntries();
  if (entries.length === 0) return "À compléter.";

  return formatVitalsEntry(entries[entries.length - 1], { withNumber: false });
}

function getAllVitalsLines() {
  const entries = getVitalsEntries();

  if (entries.length === 0) {
    return ["À compléter."];
  }

  return entries.map(entry => formatVitalsEntry(entry));
}

function setupVitalsFeature() {
  populateVitalsSelects();
  setupVitalsTouchedTracking();
  renderVitalsHistory();
  renderVitalsAlertBanner();
  applyCall15AlertDisplay();
  updateVitalsFloatingButtonState(false);

  floatingVitalsBtn?.addEventListener("click", toggleVitalsSheet);
  closeVitalsSheetBtn?.addEventListener("click", closeVitalsSheet);
  vitalsOverlay?.addEventListener("click", closeVitalsSheet);

  saveVitalsBtn?.addEventListener("click", saveCurrentVitals);
  clearVitalsFormBtn?.addEventListener("click", clearVitalsForm);

  document.addEventListener("click", event => {
    const call15Button = event.target.closest?.(CALL15_BUTTON_SELECTOR);

    if (!call15Button) return;

    window.setTimeout(applyCall15AlertDisplay, 80);
  });
}

window.pisuVitals = {
  getEntries: getVitalsEntries,
  getInitialLine: getInitialVitalsLine,
  getLatestLine: getLatestVitalsLine,
  getAllLines: getAllVitalsLines,
  clear: clearVitalsHistory
};

window.pisuVitalsAlerts = {
  getLatest: getLatestVitalsAlert,
  clear: clearVitalsAlerts,
  analyze: analyzeVitalsAlerts
};

const CREW_ROSTER_STORAGE_KEY = "pisuCrewRoster";
const MISSION_CREW_STORAGE_KEY = "pisuMissionCrew";

function createCrewId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `crew-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getCrewRoster() {
  try {
    const roster = JSON.parse(localStorage.getItem(CREW_ROSTER_STORAGE_KEY) || "[]");
    return Array.isArray(roster) ? roster : [];
  } catch {
    localStorage.removeItem(CREW_ROSTER_STORAGE_KEY);
    return [];
  }
}

function saveCrewRoster(roster) {
  const sortedRoster = roster.slice().sort((a, b) => {
    return String(a.name || "").localeCompare(String(b.name || ""), "fr");
  });

  localStorage.setItem(CREW_ROSTER_STORAGE_KEY, JSON.stringify(sortedRoster));
}

function getMissionCrew() {
  try {
    const crew = JSON.parse(localStorage.getItem(MISSION_CREW_STORAGE_KEY) || "[]");
    return Array.isArray(crew) ? crew : [];
  } catch {
    localStorage.removeItem(MISSION_CREW_STORAGE_KEY);
    return [];
  }
}

function saveMissionCrew(crew) {
  localStorage.setItem(MISSION_CREW_STORAGE_KEY, JSON.stringify(crew));
}

function formatCrewMember(member) {
  return [
    member.missionRole || "Équipier",
    member.name || "Nom non renseigné",
    member.defaultRole || "",
    member.service || ""
  ].filter(Boolean).join(" — ");
}

function formatCrewRosterMember(member) {
  return [
    member.name || "Nom non renseigné",
    member.defaultRole || "Fonction non renseignée",
    member.service || ""
  ].filter(Boolean).join(" — ");
}

function getMissionCrewLines() {
  const crew = getMissionCrew();

  if (crew.length === 0) {
    return ["Aucun équipage associé renseigné."];
  }

  return crew.map(member => formatCrewMember(member));
}

function getMissionCrewSummaryText() {
  const crew = getMissionCrew();

  if (crew.length === 0) {
    return "Aucun équipage renseigné";
  }

  return crew
    .map(member => `${member.missionRole || "Équipier"} : ${member.name || "Nom non renseigné"}`)
    .join(" · ");
}

function updateCrewSummary() {
  if (!crewSummary) return;
  crewSummary.textContent = getMissionCrewSummaryText();
}

function renderCrewRosterSelect() {
  if (!crewRosterSelect) return;

  const selectedValue = crewRosterSelect.value;
  const roster = getCrewRoster();

  crewRosterSelect.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = roster.length === 0
    ? "Aucun collègue enregistré"
    : "Sélectionner un collègue";
  crewRosterSelect.appendChild(emptyOption);

  roster.forEach(member => {
    const option = document.createElement("option");
    option.value = member.id;
    option.textContent = formatCrewRosterMember(member);
    crewRosterSelect.appendChild(option);
  });

  if (selectedValue && roster.some(member => member.id === selectedValue)) {
    crewRosterSelect.value = selectedValue;
  }
}

function renderMissionCrewList() {
  if (!missionCrewList) return;

  const crew = getMissionCrew();

  if (crew.length === 0) {
    missionCrewList.textContent = "Aucun équipage renseigné pour cette mission.";
    updateCrewSummary();
    return;
  }

  missionCrewList.innerHTML = "";

  crew.forEach(member => {
    const item = document.createElement("div");
    item.className = "crew-item";

    const main = document.createElement("div");
    main.className = "crew-item-main";
    main.textContent = `${member.missionRole || "Équipier"} — ${member.name || "Nom non renseigné"}`;

    const meta = document.createElement("div");
    meta.className = "crew-item-meta";
    meta.textContent = [
      member.defaultRole || "",
      member.service || ""
    ].filter(Boolean).join(" — ") || "Fonction / service non renseignés";

    const actions = document.createElement("div");
    actions.className = "crew-item-actions";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "crew-mini-btn danger";
    removeBtn.textContent = "Retirer de la mission";
    removeBtn.addEventListener("click", () => {
      removeCrewFromMission(member.id);
    });

    actions.appendChild(removeBtn);

    item.appendChild(main);
    item.appendChild(meta);
    item.appendChild(actions);

    missionCrewList.appendChild(item);
  });

  updateCrewSummary();
}

function renderCrewRosterList() {
  if (!crewRosterList) return;

  const roster = getCrewRoster();

  if (roster.length === 0) {
    crewRosterList.textContent = "Aucun collègue enregistré.";
    return;
  }

  crewRosterList.innerHTML = "";

  roster.forEach(member => {
    const item = document.createElement("div");
    item.className = "crew-item";

    const main = document.createElement("div");
    main.className = "crew-item-main";
    main.textContent = member.name || "Nom non renseigné";

    const meta = document.createElement("div");
    meta.className = "crew-item-meta";
    meta.textContent = [
      member.defaultRole || "Fonction non renseignée",
      member.service || "",
      member.note || ""
    ].filter(Boolean).join(" — ");

    const actions = document.createElement("div");
    actions.className = "crew-item-actions";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "crew-mini-btn danger";
    deleteBtn.textContent = "Supprimer du carnet";
    deleteBtn.addEventListener("click", () => {
      deleteCrewMemberFromRoster(member.id);
    });

    actions.appendChild(deleteBtn);

    item.appendChild(main);
    item.appendChild(meta);
    item.appendChild(actions);

    crewRosterList.appendChild(item);
  });
}

function renderCrewFeature() {
  renderCrewRosterSelect();
  renderMissionCrewList();
  renderCrewRosterList();
  updateCrewSummary();
}

function clearCrewMemberForm() {
  if (crewMemberNameInput) crewMemberNameInput.value = "";
  if (crewMemberDefaultRoleInput) crewMemberDefaultRoleInput.value = "";
  if (crewMemberServiceInput) crewMemberServiceInput.value = "";
  if (crewMemberNoteInput) crewMemberNoteInput.value = "";
}

function saveCrewMemberToRoster() {
  const name = crewMemberNameInput?.value?.trim() || "";

  if (!name) {
    alert("Nom du collègue à renseigner.");
    return;
  }

  const roster = getCrewRoster();
  const existing = roster.find(member => {
    return String(member.name || "").toLowerCase() === name.toLowerCase();
  });

  if (existing) {
    alert("Ce collègue existe déjà dans le carnet.");
    return;
  }

  const member = {
    id: createCrewId(),
    name,
    defaultRole: crewMemberDefaultRoleInput?.value || "",
    service: crewMemberServiceInput?.value?.trim() || "",
    note: crewMemberNoteInput?.value?.trim() || ""
  };

  roster.push(member);
  saveCrewRoster(roster);

  clearCrewMemberForm();
  renderCrewFeature();

  if (crewRosterSelect) {
    crewRosterSelect.value = member.id;
  }

  if (typeof addLog === "function") {
    addLog(`Carnet équipage : collègue ajouté — ${formatCrewRosterMember(member)}`);
  }
}

function addSelectedCrewToMission() {
  const selectedId = crewRosterSelect?.value || "";

  if (!selectedId) {
    alert("Sélectionne un collègue dans le carnet.");
    return;
  }

  const roster = getCrewRoster();
  const selectedMember = roster.find(member => member.id === selectedId);

  if (!selectedMember) {
    alert("Collègue introuvable dans le carnet.");
    return;
  }

  const missionRole = crewMissionRoleInput?.value || "Équipier";
  const missionCrew = getMissionCrew();

  const missionMember = {
    id: selectedMember.id,
    name: selectedMember.name,
    defaultRole: selectedMember.defaultRole,
    service: selectedMember.service,
    note: selectedMember.note || "",
    missionRole,
    addedAt: new Date().toISOString()
  };

  const existingIndex = missionCrew.findIndex(member => member.id === selectedId);

  if (existingIndex >= 0) {
    missionCrew[existingIndex] = missionMember;
    saveMissionCrew(missionCrew);

    if (typeof addLog === "function") {
      addLog(`Équipage mission : rôle mis à jour — ${formatCrewMember(missionMember)}`);
    }
  } else {
    missionCrew.push(missionMember);
    saveMissionCrew(missionCrew);

    if (typeof addLog === "function") {
      addLog(`Équipage mission : ${formatCrewMember(missionMember)}`);
    }
  }

  renderCrewFeature();

  if (handoffCode?.value) {
    resetMissionHandoffUi?.();
  }
}

function removeCrewFromMission(memberId) {
  const missionCrew = getMissionCrew();
  const member = missionCrew.find(item => item.id === memberId);

  if (!member) return;

  const updatedCrew = missionCrew.filter(item => item.id !== memberId);
  saveMissionCrew(updatedCrew);

  if (typeof addLog === "function") {
    addLog(`Correction équipage : retrait mission — ${formatCrewMember(member)}`);
  }

  renderCrewFeature();

  if (handoffCode?.value) {
    resetMissionHandoffUi?.();
  }
}

function deleteCrewMemberFromRoster(memberId) {
  const roster = getCrewRoster();
  const member = roster.find(item => item.id === memberId);

  if (!member) return;

  const confirmation = window.confirm(
    `Supprimer définitivement ce collègue du carnet ?\n\n${formatCrewRosterMember(member)}`
  );

  if (!confirmation) return;

  const updatedRoster = roster.filter(item => item.id !== memberId);
  saveCrewRoster(updatedRoster);

  const missionCrew = getMissionCrew();
  const wasInMission = missionCrew.some(item => item.id === memberId);

  if (wasInMission) {
    const updatedMissionCrew = missionCrew.filter(item => item.id !== memberId);
    saveMissionCrew(updatedMissionCrew);

    if (typeof addLog === "function") {
      addLog(`Correction équipage : collègue supprimé du carnet et retiré de la mission — ${formatCrewRosterMember(member)}`);
    }

    if (handoffCode?.value) {
      resetMissionHandoffUi?.();
    }
  }

  renderCrewFeature();
}

function resetMissionCrew() {
  localStorage.removeItem(MISSION_CREW_STORAGE_KEY);
  renderCrewFeature();
}

function applyMissionCrewSnapshot(crew = []) {
  if (Array.isArray(crew)) {
    saveMissionCrew(crew);
  } else {
    localStorage.removeItem(MISSION_CREW_STORAGE_KEY);
  }

  renderCrewFeature();
}

function setupCrewFeature() {
  renderCrewFeature();

  saveCrewMemberBtn?.addEventListener("click", saveCrewMemberToRoster);
  addCrewToMissionBtn?.addEventListener("click", addSelectedCrewToMission);
}

window.pisuCrew = {
  getRoster: getCrewRoster,
  getMissionCrew,
  getMissionCrewLines,
  resetMissionCrew,
  applyMissionCrewSnapshot
};

function getCharterAcceptance() {
  try {
    return JSON.parse(localStorage.getItem(CHARTER_STORAGE_KEY) || "{}");
  } catch {
    localStorage.removeItem(CHARTER_STORAGE_KEY);
    return {};
  }
}

function hasAcceptedCurrentCharter() {
  const acceptance = getCharterAcceptance();

  return Boolean(
    acceptance.accepted === true &&
    acceptance.version === CHARTER_VERSION &&
    acceptance.acceptedAt
  );
}

function showUserCharter() {
  closeVitalsSheet?.();

  userCharterOverlay?.classList.remove("hidden");
  document.body.classList.remove("charter-pending");
  document.body.classList.add("modal-open", "charter-open");

  if (charterVersionText) {
    charterVersionText.textContent = `Version charte : ${CHARTER_VERSION}`;
  }

  if (charterAcceptCheck) {
    charterAcceptCheck.checked = false;
  }

  if (acceptCharterBtn) {
    acceptCharterBtn.disabled = true;
  }
}

function hideUserCharter() {
  userCharterOverlay?.classList.add("hidden");
  document.body.classList.remove("modal-open", "charter-open", "charter-pending");
}

function acceptUserCharter() {
  if (!charterAcceptCheck?.checked) return;

  const acceptance = {
    accepted: true,
    version: CHARTER_VERSION,
    acceptedAt: new Date().toISOString()
  };

  localStorage.setItem(CHARTER_STORAGE_KEY, JSON.stringify(acceptance));
  hideUserCharter();

  if (typeof addLog === "function") {
    addLog(`Charte utilisateur acceptée — version ${CHARTER_VERSION}`);
  }
}

function getCharterHtml() {
  return `
    <h3>Charte utilisateur</h3>
    <p><strong>Version :</strong> ${escapeHtml(CHARTER_VERSION)}</p>
    <p>Cette application est un aide-mémoire numérique destiné à accompagner l’utilisation de protocoles PISU dans un cadre professionnel ou de formation.</p>
    <p>Elle ne remplace pas le jugement clinique, la formation professionnelle, les protocoles institutionnels validés, ni les consignes du médecin régulateur.</p>
    <p>L’utilisateur reste responsable de vérifier la pertinence des informations affichées, l’adéquation au patient, les doses, les contre-indications, les protocoles locaux et les décisions prises pendant la prise en charge.</p>
    <p>Les données saisies doivent être limitées au strict nécessaire et utilisées dans le respect du secret professionnel et de la protection des données.</p>
    <p>Cette version est un prototype fonctionnel à valider.</p>
  `;
}

function getLegalNoticeHtml() {
  return `
    <h3>Mentions légales</h3>

    <p><strong>Nom de l’application :</strong> Protocole PISU</p>
    <p><strong>Version :</strong> prototype à valider</p>
    <p><strong>Éditeur :</strong> À compléter</p>
    <p><strong>Contact :</strong> À compléter</p>
    <p><strong>Hébergement :</strong> GitHub Pages — GitHub, Inc. — à compléter précisément si diffusion publique.</p>

    <h3>Finalité</h3>
    <p>Application d’aide-mémoire et de traçabilité locale autour de protocoles PISU. Elle ne constitue pas une prescription médicale autonome.</p>

    <h3>Données</h3>
    <p>Les données saisies peuvent inclure des informations de prise en charge. Elles sont destinées à rester locales dans l’appareil, sauf action volontaire de l’utilisateur : export, copie ou transfert QR.</p>

    <h3>Prototype</h3>
    <p>Cette version doit être relue, validée et autorisée avant toute utilisation institutionnelle.</p>
  `;
}

function getValidationStatusHtml() {
  const acceptance = getCharterAcceptance();

  if (!acceptance.accepted) {
    return `
      <h3>Validation utilisateur</h3>
      <p>La charte utilisateur n’a pas encore été validée sur cet appareil.</p>
      <p><strong>Version actuelle :</strong> ${escapeHtml(CHARTER_VERSION)}</p>
    `;
  }

  const acceptedDate = acceptance.acceptedAt
    ? new Date(acceptance.acceptedAt).toLocaleString("fr-FR")
    : "Date inconnue";

  const status = acceptance.version === CHARTER_VERSION
    ? "Version actuelle validée"
    : "Ancienne version validée — une nouvelle validation sera demandée";

  return `
    <h3>Validation utilisateur</h3>
    <p><strong>Statut :</strong> ${escapeHtml(status)}</p>
    <p><strong>Version validée :</strong> ${escapeHtml(acceptance.version || "Non renseignée")}</p>
    <p><strong>Version actuelle :</strong> ${escapeHtml(CHARTER_VERSION)}</p>
    <p><strong>Date de validation :</strong> ${escapeHtml(acceptedDate)}</p>
  `;
}

function openLegalModal(title, html) {
  if (legalModalTitle) {
    legalModalTitle.textContent = title;
  }

  if (legalModalContent) {
    legalModalContent.innerHTML = html;
  }

  legalOverlay?.classList.remove("hidden");
  document.body.classList.add("modal-open");
}

function closeLegalModal() {
  legalOverlay?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

function setupUserCharterFeature() {
  charterAcceptCheck?.addEventListener("change", () => {
    if (acceptCharterBtn) {
      acceptCharterBtn.disabled = !charterAcceptCheck.checked;
    }
  });

  acceptCharterBtn?.addEventListener("click", acceptUserCharter);

  openCharterLinkBtn?.addEventListener("click", () => {
    openLegalModal("Charte utilisateur", getCharterHtml());
  });

  openLegalNoticeBtn?.addEventListener("click", () => {
    openLegalModal("Mentions légales", getLegalNoticeHtml());
  });

  openValidationStatusBtn?.addEventListener("click", () => {
    openLegalModal("Validation", getValidationStatusHtml());
  });

  closeLegalModalBtn?.addEventListener("click", closeLegalModal);

  legalOverlay?.addEventListener("click", event => {
    if (event.target === legalOverlay) {
      closeLegalModal();
    }
  });

  if (!hasAcceptedCurrentCharter()) {
    showUserCharter();
  } else {
    hideUserCharter();
  }
}

function restoreCounterBadges() {
  document.querySelectorAll("[data-count-badge]").forEach(button => {
    const counterKey = getGlobalCounterKey(button);
    const value = Number(localStorage.getItem(counterKey) || "0");

    if (value > 0) {
      button.dataset.clickCount = String(value);
      button.classList.add("action-done");
    }
  });
}

restoreCounterBadges();

loadResponderIdentity();
setupCrewFeature();
setupCollapsiblePanels();
invalidateHandoffWhenPatientChanges();
setupMobileLayoutOffsets();
setupVitalsFeature();
setupUserCharterFeature();
checkMissionHashImport();

loadLog();
updateOnlineStatus();
