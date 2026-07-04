const CACHE_NAME = "pisu-acr-cache-v1";
const CHARTER_VERSION = "2026-07-04-v1";
const CHARTER_STORAGE_KEY = "pisuUserCharterAcceptance";
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

function addLog(text) {
  const items = getLog();
  const item = { time: nowLabel(), text };
  items.push(item);
  saveLog(items);
  addLogToDom(item.time, item.text);
}

function addLogToDom(time, text) {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${time}</strong> — ${escapeHtml(text)}`;
  logEl.appendChild(li);
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

function exportText() {
  const items = getLog();
  const responder = getResponderIdentity();
  const responderLine = formatResponderIdentity(responder);
  const crewLines = getMissionCrewLines();

  const exportDate = new Date().toLocaleString("fr-FR");

  const patientName = getInputValue("patientName", "Identité non renseignée");
  const patientAge = getInputValue("patientAge");
  const patientSex = getInputValue("patientSex");
  const patientCategory = getInputValue("patientCategory");
  const patientWeight = getInputValue("patientWeight");
  const patientNote = getInputValue("patientNote", "Aucune remarque renseignée");

  const departure = findFirstLogContaining(items, "Départ intervention");
  const arrival = findFirstLogContaining(items, "Arrivée sur les lieux");

  const gpsLines = findAllLogsContaining(items, [
    "GPS Départ intervention",
    "GPS Arrivée sur les lieux",
    "Point GPS"
  ]);

  const selectedProtocols = findAllLogsContaining(items, [
    "Sélection protocole PISU"
  ]);

  const call15Lines = findAllLogsContaining(items, [
    "appel au 15",
    "bilan 15",
    "médecin régulateur"
  ]);

  const acrLines = findAllLogsContaining(items, [
    "ACR adulte",
    "ACR enfant",
    "Arrêt cardiaque enfant"
  ]);

  const ceeLines = findAllLogsContaining(items, [
    "CEE"
  ]);

  const adrenalineLines = findAllLogsContaining(items, [
    "Adrénaline"
  ]);

  const cordaroneLines = findAllLogsContaining(items, [
    "Cordarone"
  ]);

  const racsLines = findAllLogsContaining(items, [
    "RACS",
    "ROSC",
    "reprise activité"
  ]);

  const ventilationLines = findAllLogsContaining(items, [
    "ventilation",
    "BAVU",
    "MHC"
  ]);

  const vascularLines = findAllLogsContaining(items, [
    "abord vasculaire",
    "VVP",
    "intra-osseux",
    "NaCl"
  ]);

  const rhythmLines = findAllLogsContaining(items, [
    "Analyse de rythme",
    "Choc indiqué",
    "Choc non indiqué",
    "FV",
    "TV sans pouls",
    "Asystolie",
    "AESP"
  ]);

  const lines = [
    "========================================",
    "FEUILLE SAED — INTERVENTION PISU",
    "========================================",
    "",
    `Export généré le : ${exportDate}`,
    "Version : prototype à valider",
    "",
    "----------------------------------------",
    "INTERVENANT",
    "----------------------------------------",
    responderLine,
    "",
    "----------------------------------------",
    "ÉQUIPAGE MISSION",
    "----------------------------------------",
    ...crewLines,
    "",
    "----------------------------------------",
    "IDENTITÉ PATIENT",
    "----------------------------------------",
    `Nom / Prénom : ${patientName}`,
    `Âge ou date de naissance : ${patientAge}`,
    `Sexe : ${patientSex}`,
    `Catégorie patient : ${patientCategory}`,
    `Poids estimé : ${patientWeight}`,
    `Remarque identité : ${patientNote}`,
    "",
    "----------------------------------------",
    "REPÈRES INTERVENTION",
    "----------------------------------------",
    `Départ intervention : ${departure ? formatLogLine(departure) : "À compléter"}`,
    `Arrivée sur les lieux : ${arrival ? formatLogLine(arrival) : "À compléter"}`,
    "",
    "GPS :",
    formatLogList(gpsLines),
    "",
    "Protocole(s) sélectionné(s) :",
    formatLogList(selectedProtocols),
    "",
    "========================================",
    "S — SITUATION ACTUELLE",
    "========================================",
    "",
    "Je suis :",
    responderLine,
    "",
    "Équipage mission :",
    ...crewLines,
    "",
    "Je vous appelle au sujet de :",
    `${patientName} — ${patientAge} — ${patientSex}`,
    "",
    "Car actuellement il/elle présente :",
    formatLogList(selectedProtocols, "À compléter : motif de l'appel / situation actuelle."),
    "",
    "Constantes vitales / signes cliniques :",
    "Constantes initiales :",
    getInitialVitalsLine(),
    "",
    "Dernières constantes :",
    getLatestVitalsLine(),
    "",
    "Éléments ACR / rythme :",
    formatLogList(rhythmLines),
    "",
    "========================================",
    "A — ANTÉCÉDENTS UTILES",
    "========================================",
    "",
    "Antécédents médicaux utiles :",
    "À compléter.",
    "",
    "Allergies :",
    "À compléter.",
    "",
    "Traitements en cours :",
    "À compléter.",
    "",
    "Événement / évolution récente :",
    "À compléter : minutes, heures, jours.",
    "",
    "Contexte / remarque :",
    patientNote,
    "",
    "========================================",
    "E — ÉVALUATION",
    "========================================",
    "",
    "Je pense que le problème est :",
    formatLogList(selectedProtocols, "À compléter."),
    "",
    "Constantes enregistrées :",
    ...getAllVitalsLines(),
    "",
    "Actions réalisées :",
    "",
    "Appel / régulation :",
    formatLogList(call15Lines),
    "",
    "RCP / protocole ACR :",
    formatLogList(acrLines),
    "",
    "CEE :",
    formatLogList(ceeLines),
    "",
    "Adrénaline :",
    formatLogList(adrenalineLines),
    "",
    "Cordarone :",
    formatLogList(cordaroneLines),
    "",
    "Abord vasculaire :",
    formatLogList(vascularLines),
    "",
    "Ventilation :",
    formatLogList(ventilationLines),
    "",
    "RACS / ROSC :",
    formatLogList(racsLines),
    "",
    "Je suis inquiet / aggravation / incertitude :",
    "À compléter si nécessaire.",
    "",
    "========================================",
    "D — DEMANDE / DÉCISION ATTENDUE",
    "========================================",
    "",
    "Je souhaiterais :",
    "À compléter : avis médical, décision, renfort, destination, conduite à tenir.",
    "",
    "Pouvez-vous m'indiquer ce que je dois faire, quoi et quand ?",
    "À compléter selon échange avec le médecin régulateur.",
    "",
    "Décision / consignes reçues :",
    "À compléter.",
    "",
    "========================================",
    "CHRONOLOGIE COMPLÈTE HORODATÉE",
    "========================================",
    "",
    formatLogList(items, "Aucun événement enregistré."),
    "",
    "========================================",
    "FIN FEUILLE SAED",
    "========================================"
  ];

  return lines.join("\n");
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
    version: 3,
    createdAt: new Date().toISOString(),
    responder: getResponderIdentity(),
    patient: getPatientSnapshot(),
    crew: getMissionCrew(),
    vitals: getVitalsEntries(),
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

  if (Array.isArray(payload.crew)) {
    applyMissionCrewSnapshot(payload.crew);
  } else {
    resetMissionCrew();
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
    start,
    step = 1,
    direction = "around",
    suffix = "",
    decimals = 0
  } = config;

  const currentValue = select.value;

  select.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Non renseigné";
  select.appendChild(emptyOption);

  const values = [];

  function addValue(value) {
    const rounded = Number(value.toFixed(decimals));
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
    for (let value = start; value <= max; value += step) {
      addValue(value);
    }

    for (let value = start - step; value >= min; value -= step) {
      addValue(value);
    }
  }

  values.forEach(value => {
    const option = document.createElement("option");
    const textValue = decimals > 0
      ? value.toFixed(decimals).replace(".", ",")
      : String(value);

    option.value = decimals > 0
      ? value.toFixed(decimals)
      : String(value);

    option.textContent = `${textValue}${suffix}`;

    select.appendChild(option);
  });

  if (currentValue && Array.from(select.options).some(option => option.value === currentValue)) {
    select.value = currentValue;
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
    direction: "around",
    suffix: "/min"
  });

  populateOrderedRangeSelect(vitalsFrInput, {
    min: 0,
    max: 80,
    start: 20,
    step: 1,
    direction: "around",
    suffix: "/min"
  });

  populateOrderedRangeSelect(vitalsTasInput, {
    min: 40,
    max: 280,
    start: 120,
    step: 1,
    direction: "around"
  });

  populateOrderedRangeSelect(vitalsTadInput, {
    min: 20,
    max: 180,
    start: 70,
    step: 1,
    direction: "around"
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
    direction: "around",
    suffix: " °C",
    decimals: 1
  });

  populateOrderedRangeSelect(vitalsGlycemiaInput, {
    min: 0.2,
    max: 6,
    start: 1,
    step: 0.05,
    direction: "around",
    suffix: " g/L",
    decimals: 2
  });

  populateOrderedRangeSelect(vitalsGcsInput, {
    min: 3,
    max: 15,
    start: 15,
    step: 1,
    direction: "down"
  });

  populateOrderedRangeSelect(vitalsPainInput, {
    min: 0,
    max: 10,
    start: 0,
    step: 1,
    direction: "up",
    suffix: "/10"
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
    fc: getCleanValue(vitalsFcInput),
    tas: getCleanValue(vitalsTasInput),
    tad: getCleanValue(vitalsTadInput),
    spo2: getCleanValue(vitalsSpo2Input),
    oxygenSupport: getCleanValue(vitalsOxygenSupportInput),
    oxygenFlow: normalizeDecimalValue(getCleanValue(vitalsOxygenFlowInput)),
    fr: getCleanValue(vitalsFrInput),
    temperature: normalizeDecimalValue(getCleanValue(vitalsTempInput)),
    gcs: getCleanValue(vitalsGcsInput),
    pain: getCleanValue(vitalsPainInput),
    glycemia: normalizeDecimalValue(getCleanValue(vitalsGlycemiaInput))
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

function clearVitalsForm() {
  [
    vitalsFcInput,
    vitalsTasInput,
    vitalsTadInput,
    vitalsSpo2Input,
    vitalsOxygenFlowInput,
    vitalsFrInput,
    vitalsTempInput,
    vitalsGlycemiaInput
  ].forEach(input => {
    if (input) input.value = "";
  });

  if (vitalsOxygenSupportInput) vitalsOxygenSupportInput.value = "";
  if (vitalsGcsInput) vitalsGcsInput.value = "";
  if (vitalsPainInput) vitalsPainInput.value = "";
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

  if (!vitalsHistory) return;

  if (entries.length === 0) {
    vitalsHistory.textContent = "Aucune constante enregistrée.";
    return;
  }

  vitalsHistory.innerHTML = "";

  entries.slice().reverse().forEach(entry => {
    const item = document.createElement("div");
    item.className = "vitals-history-item";
    item.textContent = formatVitalsEntry(entry);
    vitalsHistory.appendChild(item);
  });
}

function openVitalsSheet() {
  populateVitalsSelects();
  renderVitalsHistory();

  vitalsOverlay?.classList.remove("hidden");
  vitalsSheet?.classList.remove("hidden");
  document.body.classList.add("vitals-sheet-open");
}

function closeVitalsSheet() {
  vitalsOverlay?.classList.add("hidden");
  vitalsSheet?.classList.add("hidden");
  document.body.classList.remove("vitals-sheet-open");
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
  addLog(line);

  renderVitalsHistory();

  if (handoffCode?.value) {
    resetMissionHandoffUi?.();
  }
}

function clearVitalsHistory() {
  localStorage.removeItem(VITALS_STORAGE_KEY);
  clearVitalsForm();
  renderVitalsHistory();
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
  renderVitalsHistory();

  floatingVitalsBtn?.addEventListener("click", openVitalsSheet);
  closeVitalsSheetBtn?.addEventListener("click", closeVitalsSheet);
  vitalsOverlay?.addEventListener("click", closeVitalsSheet);

  saveVitalsBtn?.addEventListener("click", saveCurrentVitals);
  clearVitalsFormBtn?.addEventListener("click", clearVitalsForm);
}

window.pisuVitals = {
  getEntries: getVitalsEntries,
  getInitialLine: getInitialVitalsLine,
  getLatestLine: getLatestVitalsLine,
  getAllLines: getAllVitalsLines,
  clear: clearVitalsHistory
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
  userCharterOverlay?.classList.remove("hidden");
  document.body.classList.add("vitals-sheet-open");

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
  document.body.classList.remove("vitals-sheet-open");
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
  document.body.classList.add("vitals-sheet-open");
}

function closeLegalModal() {
  legalOverlay?.classList.add("hidden");
  document.body.classList.remove("vitals-sheet-open");
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
