const CACHE_NAME = "pisu-acr-cache-v1";
let timerInterval = null;
let remaining = 120;
let deferredPrompt = null;

const timerEl = document.getElementById("timer");
const logEl = document.getElementById("log");
const offlineStatus = document.getElementById("offlineStatus");
const installBtn = document.getElementById("installBtn");

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

function exportText() {
  const items = getLog();
  const header = [
    "PISU ACR adulte — journal mission",
    `Export : ${new Date().toLocaleString("fr-FR")}`,
    "Version prototype — à valider",
    ""
  ];
  const lines = items.map(item => `${item.time} — ${item.text}`);
  return [...header, ...lines].join("\n");
}

document.querySelectorAll("[data-action]").forEach(button => {
  button.addEventListener("click", () => addLog(button.dataset.action));
});

document.getElementById("startTimer").addEventListener("click", startTimer);
document.getElementById("resetTimer").addEventListener("click", resetTimer);

document.getElementById("clearLog").addEventListener("click", () => {
  if (confirm("Effacer le journal de cette mission ?")) {
    localStorage.removeItem("pisuLog");
    logEl.innerHTML = "";
    remaining = 120;
    timerEl.textContent = "02:00";
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
  a.download = `journal-pisu-${new Date().toISOString().slice(0,10)}.txt`;
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
