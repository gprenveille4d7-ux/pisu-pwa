const CACHE_NAME = "pisu-acr-cache-v1";
let timerInterval = null;
let remaining = 120;
let deferredPrompt = null;

const timerEl = document.getElementById("timer");
const logEl = document.getElementById("log");
const offlineStatus = document.getElementById("offlineStatus");
const installBtn = document.getElementById("installBtn");
const patientNameInput = document.getElementById("patientName");
const patientAgeInput = document.getElementById("patientAge");
const patientSexInput = document.getElementById("patientSex");
const patientWeightInput = document.getElementById("patientWeight");
const patientNoteInput = document.getElementById("patientNote");
const saveIdentityBtn = document.getElementById("saveIdentityBtn");
const unknownIdentityBtn = document.getElementById("unknownIdentityBtn");

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
  const note = patientNoteInput.value.trim();

  let logLine = `Identité patient : ${name} — âge/naissance : ${age} — sexe : ${sex} — poids estimé : ${weight}`;

  if (note) {
    logLine += ` — remarque : ${note}`;
  }

  addLog(logLine);
}

function setUnknownIdentity() {
  patientNameInput.value = "Inconnu";
  patientAgeInput.value = "";
  patientSexInput.value = "";
  patientWeightInput.value = "";
  patientNoteInput.value = "Identité inconnue au moment de la prise en charge";

  addLog("Identité patient : inconnue au moment de la prise en charge");
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

function exportText() {
  const items = getLog();

  const exportDate = new Date().toLocaleString("fr-FR");

  const patientName = getInputValue("patientName", "Identité non renseignée");
  const patientAge = getInputValue("patientAge");
  const patientSex = getInputValue("patientSex");
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
    "ACR adulte"
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
    "IDENTITÉ PATIENT",
    "----------------------------------------",
    `Nom / Prénom : ${patientName}`,
    `Âge ou date de naissance : ${patientAge}`,
    `Sexe : ${patientSex}`,
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
    "À compléter : prénom, nom, fonction, service/unité.",
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

document.getElementById("clearLog").addEventListener("click", () => {
  if (confirm("Effacer le journal de cette mission ?")) {
    localStorage.removeItem("pisuLog");
    logEl.innerHTML = "";
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

loadLog();
updateOnlineStatus();
