const CACHE_NAME = "pisu-acr-cache-v1";
let timerInterval = null;
let remaining = 120;
let deferredPrompt = null;

const timerEl = document.getElementById("timer");
const logEl = document.getElementById("log");
const offlineStatus = document.getElementById("offlineStatus");
const installBtn = document.getElementById("installBtn");
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
    "Je vous appelle au sujet de :",
    `${patientName} — ${patientAge} — ${patientSex}`,
    "",
    "Car actuellement il/elle présente :",
    formatLogList(selectedProtocols, "À compléter : motif de l'appel / situation actuelle."),
    "",
    "Constantes vitales / signes cliniques :",
    "À compléter : FC, FR, TA, SpO2, température, douleur, conscience, signes cliniques utiles.",
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
  resetAllVisualValidations();
  resetMissionHandoffUi?.();

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

document.addEventListener("click", event => {
  const clickedElement = event.target.closest(
    "[data-action], [data-acr-action], [data-child-acr-action], [data-dt-action], [data-smoke-action], [data-burn-action], [data-seizure-action], [data-anaphylaxis-action], [data-hemo-action], [data-hypo-action], [data-asthma-action], [data-analgesia-action], #call15Btn, #childAcrCall15Btn, #dtCall15Btn, #smokeCall15Btn, #burnCall15Btn, #seizureCall15Btn, #anaphylaxisCall15Btn, #hemorrhageCall15Btn, #hypoglycemiaCall15Btn, #asthmaCall15Btn, #analgesiaCall15Btn"
  );

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
    version: 1,
    createdAt: new Date().toISOString(),
    responder: getResponderIdentity(),
    patient: getPatientSnapshot(),
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

function setupCollapsiblePanels() {
  setupCollapsiblePanel(
    responderPanel,
    toggleResponderBtn,
    responderContent,
    "pisu-collapse-responder"
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
setupCollapsiblePanels();
invalidateHandoffWhenPatientChanges();
checkMissionHashImport();

loadLog();
updateOnlineStatus();
