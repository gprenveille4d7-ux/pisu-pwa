const CACHE_NAME = "pisu-acr-cache-v210";
const APP_VERSION = String(globalThis.PISU_APP_VERSION || "").trim();
const CHARTER_VERSION = "2026-07-04-v1";
const CHARTER_STORAGE_KEY = "pisuUserCharterAcceptance";
const PISU_SAED_EVENT_STORAGE_KEY = "pisuStructuredEventsV2";
const PISU_EVENTS_STORAGE_KEY = PISU_SAED_EVENT_STORAGE_KEY;
const SAED_STRUCTURED_EXPORT_VERSION = "saed-structured-v2";
const VITALS_ALERT_STORAGE_KEY = "pisuLatestVitalsAlert";
const PATIENT_ANTECEDENTS_STORAGE_KEY = "pisuPatientAntecedents";
const MISSION_ROUTE_STORAGE_KEY = "pisuMissionRoute";
const MISSION_STATE_STORAGE_KEY = "pisuMissionStateV1";
const APP_DEFAULT_TITLE = "Protocole PISU";
const PROTOCOL_TITLES = {
  acrAdultProtocol: "Arrêt cardiaque adulte",
  childAcrProtocol: "Arrêt cardiaque enfant",
  chestPainProtocol: "Douleur thoracique",
  smokeExposureProtocol: "Exposition aux fumées",
  burnsProtocol: "Brûlures",
  seizureProtocol: "Crise convulsive",
  anaphylaxisProtocol: "Anaphylaxie",
  hemorrhageProtocol: "Hémorragie sévère",
  hypoglycemiaProtocol: "Hypoglycémie",
  asthmaBpcoProtocol: "Asthme / BPCO",
  analgesiaProtocol: "Antalgie"
};

const PISU_SOUND_STORAGE_KEY = "pisuSoundsEnabled";
const PISU_RCP_BPM_STORAGE_KEY = "pisuRcpBpm";

const DEFAULT_RCP_BPM = 110;
const RCP_CYCLE_MS = 120000;

const soundToggleBtn = document.getElementById("soundToggleBtn");

let pisuAudioContext = null;
let pisuSoundsEnabled = localStorage.getItem(PISU_SOUND_STORAGE_KEY) === "true";

let rcpMetronomeInterval = null;
let rcpCycleInterval = null;
let rcpMetronomeBeatCount = 0;

let lastAdrenalineDueSoundAt = 0;
let lastCall15SoundKey = "";
let lastVitalsOrangeSoundKey = "";

function getPisuAudioContext() {
  if (!pisuAudioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    pisuAudioContext = new AudioContextClass();
  }

  return pisuAudioContext;
}

async function resumePisuAudioContext() {
  const audioContext = getPisuAudioContext();

  if (!audioContext) return false;

  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch {
      return false;
    }
  }

  return audioContext.state === "running";
}

function getRcpBpm() {
  const saved = Number(localStorage.getItem(PISU_RCP_BPM_STORAGE_KEY));

  if (Number.isFinite(saved) && saved >= 90 && saved <= 130) {
    return saved;
  }

  return DEFAULT_RCP_BPM;
}

function playTone(frequency, duration = 0.08, options = {}) {
  if (!pisuSoundsEnabled && !options.force) return;

  const audioContext = getPisuAudioContext();

  if (!audioContext || audioContext.state !== "running") return;

  const startAt = audioContext.currentTime + (options.delay || 0);
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = options.type || "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);

  const volume = options.volume ?? 0.12;

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

function vibratePisu(pattern) {
  if (!navigator.vibrate) return;

  try {
    navigator.vibrate(pattern);
  } catch {
    // Vibration non disponible ou refusée.
  }
}

function playPisuSound(name, options = {}) {
  if (!pisuSoundsEnabled && !options.force) return;

  resumePisuAudioContext().then(isRunning => {
    if (!isRunning) return;

    switch (name) {
      case "rcpTick":
        playTone(720, 0.035, { type: "square", volume: 0.055 });
        break;

      case "rcpAccent":
        playTone(920, 0.045, { type: "square", volume: 0.075 });
        break;

      case "rcpStart":
        playTone(520, 0.08, { type: "triangle", volume: 0.1 });
        playTone(780, 0.1, { type: "triangle", volume: 0.1, delay: 0.11 });
        vibratePisu([40, 40, 40]);
        break;

      case "rcpStop":
        playTone(440, 0.08, { type: "triangle", volume: 0.08 });
        playTone(330, 0.12, { type: "triangle", volume: 0.08, delay: 0.1 });
        vibratePisu([80]);
        break;

      case "rcpCycleEnd":
        playTone(660, 0.12, { type: "sine", volume: 0.14 });
        playTone(660, 0.12, { type: "sine", volume: 0.14, delay: 0.18 });
        playTone(990, 0.28, { type: "sine", volume: 0.14, delay: 0.36 });
        vibratePisu([100, 80, 100]);
        break;

      case "adrenalineDue":
        playTone(880, 0.1, { type: "sine", volume: 0.16 });
        playTone(1175, 0.1, { type: "sine", volume: 0.16, delay: 0.15 });
        playTone(1568, 0.22, { type: "sine", volume: 0.16, delay: 0.3 });
        vibratePisu([80, 60, 80, 60, 180]);
        break;

      case "call15Required":
        playTone(440, 0.16, { type: "sawtooth", volume: 0.15 });
        playTone(880, 0.16, { type: "sawtooth", volume: 0.15, delay: 0.18 });
        playTone(440, 0.16, { type: "sawtooth", volume: 0.15, delay: 0.36 });
        playTone(880, 0.22, { type: "sawtooth", volume: 0.15, delay: 0.62 });
        vibratePisu([180, 80, 180, 80, 260]);
        break;

      case "vitalsOrange":
        playTone(620, 0.12, { type: "triangle", volume: 0.1 });
        playTone(520, 0.18, { type: "triangle", volume: 0.1, delay: 0.18 });
        vibratePisu([90, 60, 90]);
        break;

      case "success":
        playTone(740, 0.07, { type: "sine", volume: 0.08 });
        playTone(980, 0.1, { type: "sine", volume: 0.08, delay: 0.08 });
        break;

      case "test":
        playTone(720, 0.05, { type: "square", volume: 0.06, force: true });
        playTone(1175, 0.08, { type: "sine", volume: 0.1, delay: 0.1, force: true });
        break;

      default:
        playTone(700, 0.08, { volume: 0.1 });
    }
  });
}

function updateSoundToggleButton() {
  if (!soundToggleBtn) return;

  soundToggleBtn.classList.toggle("sound-on", pisuSoundsEnabled);
  soundToggleBtn.setAttribute("aria-pressed", String(pisuSoundsEnabled));

  if (pisuSoundsEnabled) {
    soundToggleBtn.textContent = "🔊";
    soundToggleBtn.setAttribute("aria-label", "Désactiver les sons PISU");
    soundToggleBtn.title = "Sons PISU activés";
  } else {
    soundToggleBtn.textContent = "🔇";
    soundToggleBtn.setAttribute("aria-label", "Activer les sons PISU");
    soundToggleBtn.title = "Sons PISU désactivés";
  }
}

async function enablePisuSounds() {
  const isRunning = await resumePisuAudioContext();

  if (!isRunning) {
    alert("Le son n’a pas pu être activé par le navigateur.");
    return;
  }

  pisuSoundsEnabled = true;
  localStorage.setItem(PISU_SOUND_STORAGE_KEY, "true");
  updateSoundToggleButton();
  playPisuSound("test", { force: true });

  window.setTimeout(() => {
    scanImmediateCall15VisualAlert?.({ force: true });
  }, 350);
}

function disablePisuSounds() {
  pisuSoundsEnabled = false;
  localStorage.setItem(PISU_SOUND_STORAGE_KEY, "false");
  stopRcpMetronome();
  updateSoundToggleButton();
}

function togglePisuSounds() {
  if (pisuSoundsEnabled) {
    disablePisuSounds();
    return;
  }

  enablePisuSounds();
}

function startRcpMetronome(protocolId = "") {
  if (!pisuSoundsEnabled) {
    enablePisuSounds().then(() => {
      if (pisuSoundsEnabled) startRcpMetronome(protocolId);
    });

    return;
  }

  resumePisuAudioContext();

  stopRcpMetronome();

  const bpm = getRcpBpm();
  const intervalMs = Math.round(60000 / bpm);

  rcpMetronomeBeatCount = 0;

  playPisuSound("rcpStart");

  rcpMetronomeInterval = window.setInterval(() => {
    rcpMetronomeBeatCount += 1;

    if (rcpMetronomeBeatCount % 30 === 0) {
      playPisuSound("rcpAccent");
    } else {
      playPisuSound("rcpTick");
    }
  }, intervalMs);

  rcpCycleInterval = window.setInterval(() => {
    playPisuSound("rcpCycleEnd");
  }, RCP_CYCLE_MS);

  document.body.classList.add("rcp-metronome-on");

  if (typeof addLog === "function") {
    addLog(`Son : métronome RCP démarré à ${bpm}/min`, {
      protocole: protocolId || "Mission PISU",
      categorie: "journal_technique",
      sousCategorie: "son_rcp",
      sectionSAED: "journal",
      visibleSAED: false,
      visibleChrono: false,
      visibleJournal: true
    });
  }
}

function stopRcpMetronome() {
  const hadActiveMetronome = Boolean(rcpMetronomeInterval || rcpCycleInterval);

  if (rcpMetronomeInterval) {
    window.clearInterval(rcpMetronomeInterval);
    rcpMetronomeInterval = null;
  }

  if (rcpCycleInterval) {
    window.clearInterval(rcpCycleInterval);
    rcpCycleInterval = null;
  }

  rcpMetronomeBeatCount = 0;
  document.body.classList.remove("rcp-metronome-on");

  if (pisuSoundsEnabled && hadActiveMetronome) {
    playPisuSound("rcpStop");
  }
}

function notifyRcpCycleEnd() {
  playPisuSound("rcpCycleEnd");
}

function notifyAdrenalineDue(label = "Adrénaline à réévaluer") {
  const now = Date.now();

  if (now - lastAdrenalineDueSoundAt < 5000) {
    return;
  }

  lastAdrenalineDueSoundAt = now;
  playPisuSound("adrenalineDue");

  if (typeof addLog === "function") {
    addLog(`Alerte sonore : ${label}`, {
      protocole: currentProtocolPageId || "Mission PISU",
      categorie: "journal_technique",
      sousCategorie: "alerte_adrenaline",
      sectionSAED: "journal",
      visibleSAED: false,
      visibleChrono: true,
      visibleJournal: true
    });
  }
}

function notifyCall15Required(reason = "Appel 15 exigé") {
  if (!pisuSoundsEnabled) return;

  const now = Date.now();
  const key = typeof normalizeSAEDText === "function"
    ? normalizeSAEDText(reason)
    : String(reason || "").toLowerCase();

  if (key && key === lastCall15SoundKey && now - notifyCall15Required.lastPlayedAt < 1500) {
    return;
  }

  lastCall15SoundKey = key;
  notifyCall15Required.lastPlayedAt = now;
  playPisuSound("call15Required");

  if (typeof addLog === "function") {
    addLog(`Alerte sonore : appel 15 immédiat — ${reason}`, {
      protocole: currentProtocolPageId || "Mission PISU",
      categorie: "journal_technique",
      sousCategorie: "alerte_appel_15",
      sectionSAED: "journal",
      visibleSAED: false,
      visibleChrono: true,
      visibleJournal: true
    });
  }
}

notifyCall15Required.lastPlayedAt = 0;

let lastCall15UiAlertSignature = "";
let lastImmediateCall15VisualSignature = "";
let call15VisualObserver = null;
let call15ActionContext = null;
let call15ActionSequence = 0;

const CALL15_ACTION_SELECTOR = [
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
].join(",");

const CALL15_VISUAL_SELECTOR = [
  'a[href="tel:15"]',
  ".call15-alert",
  ".call15-alert-red",
  ".call15-alert-orange",
  ".call15-required",
  ".call15-immediate",
  ".call15-blink",
  ".blink-call15",
  "[data-call15-alert]",
  "[data-call15-required]",
  "[data-call15-immediate]"
].join(",");

function isElementReallyVisible(element) {
  if (!element || element.classList.contains("hidden")) return false;

  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    Number(style.opacity) === 0
  ) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function normalizeCall15Value(value) {
  if (typeof normalizeSAEDText === "function") {
    return normalizeSAEDText(value);
  }

  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getCall15VisualState() {
  const candidates = Array.from(document.querySelectorAll(CALL15_VISUAL_SELECTOR));

  const element = candidates.find(candidate => {
    if (!isElementReallyVisible(candidate)) return false;

    const protocolSection = candidate.closest("main > section[id]");
    return !protocolSection || !protocolSection.classList.contains("hidden");
  });

  if (!element) {
    return {
      urgent: false,
      signature: "",
      reason: ""
    };
  }

  const text = normalizeCall15Value(element.textContent);
  const classes = normalizeCall15Value(element.className);
  const explicitlyIdle = /(?:^|[ _-])(idle|done|rosc)(?:$|[ _-])/.test(classes);
  const alertClass = /(?:^|[ _-])(alert|danger|urgent|immediate|required|blink)(?:$|[ _-])/.test(classes);
  const alertData =
    element.dataset.call15Alert === "true" ||
    element.dataset.call15Required === "true" ||
    element.dataset.call15Immediate === "true";
  const immediateText =
    text.includes("immediat") ||
    text.includes("a faire") ||
    text.includes("faire maintenant") ||
    text.includes("appel 15 exige") ||
    text.includes("appel 15 requis");

  const urgent = !explicitlyIdle && (alertClass || alertData || immediateText);
  const reason = element.textContent?.replace(/\s+/g, " ").trim() || "Appel 15 immédiat";

  return {
    urgent,
    signature: `${classes}|${text}|${alertData}`,
    reason
  };
}

function getCurrentCall15ImmediateReason() {
  const latestAlert = typeof getLatestVitalsAlert === "function"
    ? getLatestVitalsAlert()
    : null;

  if (
    latestAlert &&
    (
      latestAlert.level === "red" ||
      latestAlert.call15Level === "red" ||
      latestAlert.call15Required === true
    )
  ) {
    return (
      latestAlert.reasons?.join(" ; ") ||
      latestAlert.message ||
      "Appel 15 immédiat indiqué par les constantes"
    );
  }

  const state = getCall15VisualState();
  return state.urgent ? state.reason : "";
}

function getProtocolActionLabel(action) {
  const keys = [
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

  for (const key of keys) {
    if (action?.dataset?.[key]) return action.dataset[key];
  }

  return action?.textContent?.replace(/\s+/g, " ").trim() || "Action protocole";
}

function scanImmediateCall15VisualAlert(options = {}) {
  const state = getCall15VisualState();

  if (!state.urgent) {
    lastImmediateCall15VisualSignature = "";
    return false;
  }

  const signature = state.signature || normalizeCall15Value(state.reason);

  if (!options.force && signature === lastImmediateCall15VisualSignature) {
    return false;
  }

  lastImmediateCall15VisualSignature = signature;

  const reason = options.actionLabel
    ? `${options.actionLabel} — ${state.reason}`
    : state.reason;

  window.pisuSounds?.notifyCall15Required?.(reason);
  return true;
}

function notifyCall15IfImmediateVisible() {
  const reason = getCurrentCall15ImmediateReason();

  if (!reason) {
    lastCall15UiAlertSignature = "";
    return;
  }

  if (!pisuSoundsEnabled) return;

  const signature = normalizeCall15Value(reason);
  if (signature && signature === lastCall15UiAlertSignature) return;

  lastCall15UiAlertSignature = signature;
  window.pisuSounds?.notifyCall15Required?.(reason);
}

function inspectCall15AfterAction(sequence) {
  if (!call15ActionContext || sequence !== call15ActionSequence) return;

  const after = getCall15VisualState();
  const before = call15ActionContext.before;
  const label = call15ActionContext.label;
  const actionText = normalizeCall15Value(label);

  const becameUrgent =
    after.urgent &&
    (!before.urgent || before.signature !== after.signature);

  const actionExplicitlyUrgent =
    actionText.includes("appel") &&
    actionText.includes("15") &&
    (
      actionText.includes("immediat") ||
      actionText.includes("urgence") ||
      actionText.includes("exige") ||
      actionText.includes("requis")
    );

  if (!becameUrgent && !actionExplicitlyUrgent) return;

  scanImmediateCall15VisualAlert({
    force: true,
    actionLabel: label
  });

  call15ActionSequence += 1;
  call15ActionContext = null;
}

function setupImmediateCall15SoundWatcher() {
  if (call15VisualObserver) return;

  document.addEventListener("pointerdown", event => {
    const action = event.target.closest?.(CALL15_ACTION_SELECTOR);
    if (!action) return;

    call15ActionContext = {
      before: getCall15VisualState(),
      label: getProtocolActionLabel(action),
      at: Date.now()
    };

    if (pisuSoundsEnabled) {
      // Important sur iPhone : reprise de l’AudioContext pendant le geste utilisateur.
      resumePisuAudioContext?.();
    }
  }, true);

  document.addEventListener("click", event => {
    const action = event.target.closest?.(CALL15_ACTION_SELECTOR);
    if (!action) return;

    if (!call15ActionContext) {
      call15ActionContext = {
        before: getCall15VisualState(),
        label: getProtocolActionLabel(action),
        at: Date.now()
      };
    }

    const sequence = ++call15ActionSequence;

    [40, 140, 320, 650].forEach(delay => {
      window.setTimeout(() => inspectCall15AfterAction(sequence), delay);
    });
  });

  const observedRoot = document.querySelector("main") || document.body;

  call15VisualObserver = new MutationObserver(() => {
    if (!call15ActionContext) return;
    if (Date.now() - call15ActionContext.at > 1600) return;

    const sequence = call15ActionSequence;
    window.setTimeout(() => inspectCall15AfterAction(sequence), 40);
  });

  call15VisualObserver.observe(observedRoot, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
    attributeFilter: [
      "class",
      "hidden",
      "data-call15-alert",
      "data-call15-required",
      "data-call15-immediate"
    ]
  });
}

function notifyVitalsOrange(reason = "Alerte constantes orange") {
  const key = normalizeSAEDText
    ? normalizeSAEDText(reason)
    : String(reason || "").toLowerCase();

  if (key && key === lastVitalsOrangeSoundKey) {
    return;
  }

  lastVitalsOrangeSoundKey = key;
  playPisuSound("vitalsOrange");
}

function resetSoundAlertMemory() {
  lastCall15SoundKey = "";
  lastVitalsOrangeSoundKey = "";
  lastAdrenalineDueSoundAt = 0;
  lastCall15UiAlertSignature = "";
  lastImmediateCall15VisualSignature = "";
}

function setupPisuSoundFeature() {
  updateSoundToggleButton();

  soundToggleBtn?.addEventListener("click", togglePisuSounds);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopRcpMetronome();
    }
  });
}

window.pisuSounds = {
  enable: enablePisuSounds,
  disable: disablePisuSounds,
  play: playPisuSound,
  startRcpMetronome,
  stopRcpMetronome,
  notifyRcpCycleEnd,
  notifyAdrenalineDue,
  notifyCall15Required,
  notifyVitalsOrange,
  resetAlertMemory: resetSoundAlertMemory
};

const PISU_PROTOCOLS = {
  acrAdultProtocol: {
    label: "Arrêt cardiaque adulte",
    aliases: ["arret cardiaque adulte", "acr adulte", "arrêt cardiaque adulte"],
    intro: "Patient pris en charge dans le cadre d’un arrêt cardiaque adulte.",
    demand: "Demande de poursuite de la régulation médicale et orientation selon évolution de la réanimation."
  },
  childAcrProtocol: {
    label: "Arrêt cardiaque enfant",
    aliases: ["arret cardiaque enfant", "acr enfant", "arrêt cardiaque enfant"],
    intro: "Enfant pris en charge dans le cadre d’un arrêt cardiaque pédiatrique.",
    demand: "Demande de poursuite de la régulation médicale spécialisée et orientation selon évolution de la réanimation."
  },
  chestPainProtocol: {
    label: "Douleur thoracique",
    aliases: ["douleur thoracique"],
    intro: "Patient pris en charge pour douleur thoracique ou symptôme évocateur nécessitant évaluation cardiovasculaire.",
    demand: "Demande d’avis médical régulateur pour stratégie diagnostique, thérapeutique et orientation adaptée."
  },
  smokeExposureProtocol: {
    label: "Exposition aux fumées",
    aliases: ["exposition aux fumees", "exposition aux fumées", "fumee", "fumées"],
    intro: "Patient pris en charge après exposition aux fumées d’incendie.",
    demand: "Demande d’avis médical régulateur pour surveillance, traitement spécifique éventuel et orientation."
  },
  burnsProtocol: {
    label: "Brûlures",
    aliases: ["brulures", "brûlures", "brulure", "brûlure"],
    intro: "Patient pris en charge pour brûlures avec évaluation de la gravité locale et générale.",
    demand: "Demande d’avis médical régulateur pour analgésie, remplissage éventuel, surveillance et orientation spécialisée si nécessaire."
  },
  seizureProtocol: {
    label: "Crise convulsive",
    aliases: ["crise convulsive", "convulsion"],
    intro: "Patient pris en charge pour crise convulsive ou état post-critique.",
    demand: "Demande d’avis médical régulateur pour poursuite de la surveillance, traitement éventuel et orientation."
  },
  anaphylaxisProtocol: {
    label: "Anaphylaxie",
    aliases: ["anaphylaxie", "allergie grave", "choc anaphylactique"],
    intro: "Patient pris en charge pour suspicion d’anaphylaxie.",
    demand: "Demande d’avis médical régulateur pour poursuite du traitement, surveillance rapprochée et orientation."
  },
  hemorrhageProtocol: {
    label: "Hémorragie sévère",
    aliases: ["hemorragie", "hémorragie", "hemorragie severe", "hémorragie sévère"],
    intro: "Patient pris en charge pour hémorragie sévère ou suspicion de choc hémorragique.",
    demand: "Demande d’avis médical régulateur pour stratégie hémostatique, remplissage éventuel, transfusion éventuelle et orientation."
  },
  hypoglycemiaProtocol: {
    label: "Hypoglycémie",
    aliases: ["hypoglycemie", "hypoglycémie"],
    intro: "Patient pris en charge pour hypoglycémie suspectée ou confirmée.",
    demand: "Demande d’avis médical régulateur selon correction glycémique, récupération clinique et contexte."
  },
  asthmaBpcoProtocol: {
    label: "Asthme / BPCO",
    aliases: ["asthme", "bpco", "asthme bpco", "asthme / bpco"],
    intro: "Patient pris en charge pour détresse ou gêne respiratoire dans un contexte d’asthme ou de BPCO.",
    demand: "Demande d’avis médical régulateur pour stratégie respiratoire, traitement, surveillance et orientation."
  },
  analgesiaProtocol: {
    label: "Antalgie",
    aliases: ["antalgie", "douleur", "prise en charge de la douleur"],
    intro: "Patient pris en charge pour douleur nécessitant évaluation et traitement antalgique.",
    demand: "Demande d’avis médical régulateur selon intensité douloureuse, traitement réalisé et réévaluation."
  }
};

function createSAEDAction(sectionSAED, categorie, priorite, libelleCourt, phraseSAED, aliases = []) {
  return {
    aliases,
    sectionSAED,
    categorie,
    priorite,
    libelleCourt,
    phraseSAED,
    visibleSynthese: Boolean(phraseSAED),
    visibleSAED: Boolean(phraseSAED),
    visibleChrono: Boolean(phraseSAED)
  };
}

const PISU_SAED_ACTIONS = {
  common: {
    call15: createSAEDAction("D", "demande", "haute", "Régulation médicale contactée", "Régulation médicale contactée ou avis médical demandé.", ["appel 15", "appel au 15", "bilan 15", "regulation", "régulation", "samu"]),
    constants_request: createSAEDAction("journal", "technique", "basse", "Constantes à renseigner", "", ["constantes", "module constantes"]),
    reevaluation: createSAEDAction("E", "evolution", "moyenne", "Réévaluation en cours", "Réévaluation clinique en cours ou à poursuivre.", ["reevaluation", "réévaluation", "surveillance", "controle", "contrôle"])
  },
  acrAdultProtocol: {
    rcp: createSAEDAction("E", "geste", "haute", "RCP en cours", "Réanimation cardio-pulmonaire spécialisée en cours.", ["rcp", "massage", "compression"]),
    shockable: createSAEDAction("S", "signe_clinique", "haute", "Rythme choquable identifié", "Rythme choquable identifié au cours de la prise en charge.", ["rythme choquable", "fv", "tv", "choc indiqué"]),
    no_shock: createSAEDAction("S", "signe_clinique", "haute", "Rythme non choquable", "Rythme non choquable identifié au cours de la prise en charge.", ["choc non indiqué", "non choquable", "asystolie", "aesp"]),
    cee: createSAEDAction("E", "geste", "haute", "CEE réalisé", "Choc électrique externe réalisé selon protocole devant un rythme choquable.", ["cee", "choc électrique", "défibrillation"]),
    adrenaline: createSAEDAction("E", "therapeutique", "haute", "Adrénaline administrée", "Adrénaline administrée selon protocole d’arrêt cardiaque.", ["adrenaline", "adrénaline"]),
    cordarone: createSAEDAction("E", "therapeutique", "haute", "Amiodarone administrée", "Amiodarone administrée selon protocole devant rythme choquable persistant ou récidivant.", ["cordarone", "amiodarone"]),
    rosc: createSAEDAction("E", "evolution", "haute", "RACS obtenue", "Reprise d’activité circulatoire spontanée rapportée au cours de la prise en charge.", ["racs", "rosc", "reprise activité"])
  },
  childAcrProtocol: {
    rcp: createSAEDAction("E", "geste", "haute", "RCP pédiatrique en cours", "Réanimation cardio-pulmonaire pédiatrique en cours.", ["rcp", "massage", "compression"]),
    cee: createSAEDAction("E", "geste", "haute", "CEE pédiatrique réalisé", "Choc électrique externe réalisé selon protocole pédiatrique devant rythme choquable.", ["cee", "choc", "défibrillation"]),
    adrenaline: createSAEDAction("E", "therapeutique", "haute", "Adrénaline pédiatrique administrée", "Adrénaline administrée selon protocole pédiatrique, avec dose adaptée au poids estimé.", ["adrenaline", "adrénaline"]),
    cordarone: createSAEDAction("E", "therapeutique", "haute", "Amiodarone pédiatrique administrée", "Amiodarone administrée selon protocole pédiatrique devant rythme choquable persistant ou récidivant.", ["cordarone", "amiodarone"]),
    rosc: createSAEDAction("E", "evolution", "haute", "RACS pédiatrique obtenue", "Reprise d’activité circulatoire spontanée rapportée chez l’enfant.", ["racs", "rosc", "reprise activité"])
  },
  chestPainProtocol: {
    pain_assessment: createSAEDAction("S", "signe_clinique", "haute", "Douleur évaluée", "Douleur thoracique évaluée avec surveillance clinique en cours.", ["douleur", "eva", "en"]),
    ecg: createSAEDAction("E", "examen", "haute", "ECG réalisé", "ECG réalisé ou en cours de réalisation dans le cadre de la douleur thoracique.", ["ecg", "électrocardiogramme", "d2"]),
    aspirin: createSAEDAction("E", "therapeutique", "haute", "Antiagrégant administré selon protocole", "Traitement antiagrégant administré selon protocole local si indication retenue et absence de contre-indication identifiée.", ["aspirine", "kardégic"]),
    nitrate: createSAEDAction("E", "therapeutique", "moyenne", "Dérivé nitré utilisé selon protocole", "Dérivé nitré utilisé selon protocole local si indication retenue et conditions de sécurité réunies.", ["trinitrine", "nitrate", "natispray"])
  },
  smokeExposureProtocol: {
    extraction: createSAEDAction("E", "geste", "haute", "Mise en sécurité réalisée", "Patient soustrait à l’exposition et mis en sécurité.", ["extraction", "mise en sécurité"]),
    oxygen: createSAEDAction("E", "therapeutique", "haute", "Oxygénothérapie mise en place", "Oxygénothérapie mise en place dans le contexte d’exposition aux fumées.", ["oxygène", "o2", "15 l"]),
    co_assessment: createSAEDAction("E", "examen", "haute", "Évaluation CO réalisée", "Évaluation de l’intoxication au monoxyde de carbone réalisée ou recherchée selon matériel disponible.", ["co", "monoxyde", "spco"]),
    neurologic_signs: createSAEDAction("S", "signe_clinique", "haute", "Signes neurologiques recherchés", "Recherche de signes neurologiques ou de gravité réalisée dans le contexte d’exposition aux fumées.", ["trouble neurologique", "confusion", "coma", "gcs", "cyanures"])
  },
  burnsProtocol: {
    burn_surface: createSAEDAction("S", "evaluation", "haute", "Surface brûlée évaluée", "Surface brûlée et localisation évaluées afin d’apprécier la gravité.", ["surface", "scb", "surface brûlée"]),
    cooling: createSAEDAction("E", "geste", "moyenne", "Refroidissement réalisé", "Refroidissement de la brûlure réalisé selon délai, contexte et protocole local.", ["refroidissement", "eau"]),
    dressing: createSAEDAction("E", "geste", "moyenne", "Protection de brûlure réalisée", "Protection de la zone brûlée réalisée selon protocole local.", ["pansement", "protection"]),
    analgesia: createSAEDAction("E", "therapeutique", "haute", "Antalgie mise en œuvre", "Antalgie mise en œuvre ou demandée devant la douleur liée aux brûlures.", ["antalgie", "analgésie", "douleur"])
  },
  seizureProtocol: {
    seizure_active: createSAEDAction("S", "signe_clinique", "haute", "Crise convulsive en cours", "Crise convulsive en cours ou répétée rapportée au moment de la prise en charge.", ["crise en cours", "convulsion", "état de mal"]),
    pls_security: createSAEDAction("E", "geste", "haute", "Protection patient réalisée", "Mesures de protection du patient et surveillance des voies aériennes mises en place.", ["pls", "protection", "voies aériennes"]),
    glycemia: createSAEDAction("E", "examen", "haute", "Glycémie contrôlée", "Glycémie capillaire contrôlée dans le cadre de la crise convulsive.", ["glycémie", "dextro"]),
    benzodiazepine: createSAEDAction("E", "therapeutique", "haute", "Benzodiazépine administrée", "Traitement anticonvulsivant par benzodiazépine administré selon protocole et dose adaptée.", ["clonazépam", "midazolam", "buccolam", "benzodiazépine"]),
    post_critical: createSAEDAction("E", "evolution", "moyenne", "Phase post-critique surveillée", "Surveillance de la phase post-critique en cours.", ["post critique", "récupération"])
  },
  anaphylaxisProtocol: {
    trigger: createSAEDAction("S", "contexte", "haute", "Déclencheur recherché", "Contexte allergique ou déclencheur potentiel recherché.", ["allergène", "piqûre", "aliment", "médicament"]),
    adrenaline: createSAEDAction("E", "therapeutique", "haute", "Adrénaline IM administrée", "Adrénaline intramusculaire administrée selon protocole devant suspicion d’anaphylaxie.", ["adrenaline", "adrénaline", "im"]),
    oxygen: createSAEDAction("E", "therapeutique", "haute", "Oxygénothérapie mise en place", "Oxygénothérapie mise en place devant suspicion d’anaphylaxie avec surveillance respiratoire.", ["oxygène", "o2"]),
    filling: createSAEDAction("E", "therapeutique", "haute", "Remplissage vasculaire engagé", "Remplissage vasculaire engagé ou préparé selon état hémodynamique et protocole local.", ["remplissage"]),
    antihistamine_corticoid: createSAEDAction("E", "therapeutique", "moyenne", "Traitement complémentaire administré", "Traitement complémentaire antihistaminique ou corticoïde réalisé selon protocole local.", ["antihistaminique", "corticoïde", "solumédrol"])
  },
  hemorrhageProtocol: {
    external_bleeding: createSAEDAction("S", "signe_clinique", "haute", "Hémorragie sévère évaluée", "Hémorragie sévère ou suspicion de choc hémorragique évaluée.", ["saignement", "hémorragie", "choc"]),
    compression: createSAEDAction("E", "geste", "haute", "Compression hémostatique réalisée", "Compression hémostatique directe ou pansement compressif réalisé selon situation.", ["compression", "pansement compressif"]),
    tourniquet: createSAEDAction("E", "geste", "haute", "Garrot posé", "Garrot posé ou contrôlé devant hémorragie de membre selon protocole.", ["garrot", "tourniquet"]),
    txa: createSAEDAction("E", "therapeutique", "haute", "Acide tranexamique administré", "Acide tranexamique administré selon protocole devant hémorragie sévère.", ["txa", "exacyl", "tranexamique"]),
    filling: createSAEDAction("E", "therapeutique", "haute", "Remplissage ou abord vasculaire engagé", "Abord vasculaire et remplissage discutés ou engagés selon état hémodynamique.", ["remplissage", "vvp", "ktio"])
  },
  hypoglycemiaProtocol: {
    glycemia_confirmed: createSAEDAction("S", "signe_clinique", "haute", "Hypoglycémie confirmée", "Hypoglycémie confirmée ou fortement suspectée devant les éléments cliniques et/ou glycémie capillaire.", ["hypoglycémie confirmée", "glycémie capillaire", "< 0,6", "< 3,3"]),
    oral_sugar: createSAEDAction("E", "therapeutique", "haute", "Resucrage oral réalisé", "Resucrage per os réalisé si patient conscient et capable de déglutir.", ["resucrage", "per os", "déglutir"]),
    g30: createSAEDAction("E", "therapeutique", "haute", "G30 administré", "Administration de G30 réalisée selon protocole hypoglycémie, avec réévaluation clinique et glycémique à poursuivre.", ["g30", "g30%"]),
    g10: createSAEDAction("E", "therapeutique", "haute", "G10 administré", "Administration de G10 réalisée selon protocole hypoglycémie, avec réévaluation clinique et glycémique à poursuivre.", ["g10", "g10%"]),
    glucagon: createSAEDAction("E", "therapeutique", "haute", "Glucagon administré", "Glucagon administré selon protocole hypoglycémie, avec surveillance de la récupération clinique.", ["glucagon"]),
    pump_off: createSAEDAction("E", "geste", "moyenne", "Pompe à insuline arrêtée", "Pompe à insuline arrêtée ou sécurisée dans le contexte d’hypoglycémie.", ["pompe", "pompe à insuline"])
  },
  asthmaBpcoProtocol: {
    dyspnea: createSAEDAction("S", "signe_clinique", "haute", "Dyspnée évaluée", "Dyspnée ou gêne respiratoire évaluée avec recherche de signes de gravité.", ["dyspnée", "détresse"]),
    oxygen: createSAEDAction("E", "therapeutique", "haute", "Oxygénothérapie adaptée", "Oxygénothérapie adaptée à la cible de saturation et à la tolérance clinique.", ["oxygène", "o2", "spo2"]),
    terbutaline: createSAEDAction("E", "therapeutique", "haute", "Terbutaline administrée", "Bronchodilatateur bêta-2 mimétique administré selon protocole respiratoire.", ["terbutaline", "bricanyl"]),
    ipratropium: createSAEDAction("E", "therapeutique", "haute", "Ipratropium administré", "Ipratropium administré selon protocole respiratoire si indication retenue.", ["ipratropium", "atrovent"]),
    corticosteroid: createSAEDAction("E", "therapeutique", "moyenne", "Corticothérapie administrée", "Corticothérapie administrée selon protocole respiratoire si indication retenue.", ["corticoïde", "methylprednisolone", "solumédrol"])
  },
  analgesiaProtocol: {
    pain_score: createSAEDAction("S", "evaluation", "haute", "Douleur évaluée", "Douleur évaluée avec score ou appréciation clinique et surveillance de l’efficacité antalgique.", ["douleur", "score", "eva", "en"]),
    paracetamol: createSAEDAction("E", "therapeutique", "moyenne", "Paracétamol administré", "Paracétamol administré selon protocole antalgique et absence de contre-indication identifiée.", ["paracétamol"]),
    meopa: createSAEDAction("E", "therapeutique", "moyenne", "MEOPA utilisé", "MEOPA utilisé selon protocole antalgique avec surveillance de la tolérance.", ["meopa"]),
    morphine: createSAEDAction("E", "therapeutique", "haute", "Morphine titrée", "Morphine titrée selon protocole antalgique avec surveillance clinique rapprochée.", ["morphine", "titration"]),
    pain_reevaluation: createSAEDAction("E", "evolution", "moyenne", "Douleur réévaluée", "Douleur réévaluée après traitement antalgique.", ["réévaluation douleur"])
  }
};
let timerInterval = null;
let remaining = 120;
let deferredPrompt = null;
let mainMenuScrollY = 0;
let currentProtocolPageId = "";
let lastSelectedProtocolId = "";
let protocolScrollPositions = {};

const timerEl = document.getElementById("timer");
const logEl = document.getElementById("log");
const logPanel = document.querySelector(".log-block");
const toggleLogBtn = document.getElementById("toggleLogBtn");
const logContent = document.getElementById("logContent");
const offlineStatus = document.getElementById("offlineStatus");
const installBtn = document.getElementById("installBtn");
const appTitle = document.getElementById("appTitle");
const appVersion = document.getElementById("appVersion");
const appHeader = document.querySelector("body > header, header.app-header, .app-header");
const floatingBackMenuBtn = document.getElementById("floatingBackMenuBtn");
const protocolSwipeTrack = document.getElementById("protocolSwipeTrack");
const protocolSwipePrev = document.getElementById("protocolSwipePrev");
const protocolSwipeNext = document.getElementById("protocolSwipeNext");
const protocolSwipeDots = document.getElementById("protocolSwipeDots");
const newMissionResetBtn = document.getElementById("newMissionResetBtn");
const missionResumeBanner = document.getElementById("missionResumeBanner");
const missionResumeProtocol = document.getElementById("missionResumeProtocol");
const missionResumeDuration = document.getElementById("missionResumeDuration");
const resumeMissionBtn = document.getElementById("resumeMissionBtn");
const patientNameInput = document.getElementById("patientName");
const patientAgeInput = document.getElementById("patientAge");
const patientSexInput = document.getElementById("patientSex");
const patientWeightInput = document.getElementById("patientWeight");
const patientNoteInput = document.getElementById("patientNote");
const patientCategoryInput = document.getElementById("patientCategory");
const patientAgeUnitInput = document.getElementById("patientAgeUnit");
const patientBirthDayInput = document.getElementById("patientBirthDay");
const patientBirthMonthInput = document.getElementById("patientBirthMonth");
const patientBirthYearInput = document.getElementById("patientBirthYear");
const patientBirthDateSummary = document.getElementById("patientBirthDateSummary");
const identitySwipeTrack = document.getElementById("identitySwipeTrack");
const identitySwipePrev = document.getElementById("identitySwipePrev");
const identitySwipeNext = document.getElementById("identitySwipeNext");
const identitySwipeTabs = Array.from(document.querySelectorAll("[data-identity-slide-target]"));
const patientSwipeTrack = identitySwipeTrack || document.getElementById("patientSwipeTrack");
const patientSwipePrev = identitySwipePrev || document.getElementById("patientSwipePrev");
const patientSwipeNext = identitySwipeNext || document.getElementById("patientSwipeNext");
const patientSwipeTabs = identitySwipeTabs.length > 0
  ? identitySwipeTabs
  : Array.from(document.querySelectorAll("[data-patient-slide-target]"));
const saveIdentityBtn = document.getElementById("savePatientIdentityBtn") || document.getElementById("saveIdentity");
const savePatientHistoryBtn = document.getElementById("savePatientHistoryBtn");
const savePatientNotesBtn = document.getElementById("savePatientNotesBtn");
const unknownIdentityBtn = document.getElementById("unknownIdentity");
const patientAllergiesInput = document.getElementById("patientAllergies");
const patientMedicalHistoryInput = document.getElementById("patientMedicalHistory");
const patientCurrentTreatmentInput = document.getElementById("patientCurrentTreatment");
const patientAntecedentsNoteInput = document.getElementById("patientAntecedentsNote");
const patientAnticoagulantCheck = document.getElementById("patientAnticoagulantCheck");
const patientDiabetesCheck = document.getElementById("patientDiabetesCheck");
const patientEpilepsyCheck = document.getElementById("patientEpilepsyCheck");
const patientCardiacHistoryCheck = document.getElementById("patientCardiacHistoryCheck");
const patientRespHistoryCheck = document.getElementById("patientRespHistoryCheck");
const patientPregnancyCheck = document.getElementById("patientPregnancyCheck");
const patientAntecedentsSummary = document.getElementById("patientAntecedentsSummary");
const responderNameInput = document.getElementById("responderName");
const responderRoleInput = document.getElementById("responderRole");
const responderServiceInput = document.getElementById("responderService");
const saveResponderBtn = document.getElementById("saveResponderBtn");
const teamPanel = document.querySelector(".team-block");
const toggleTeamBtn = document.getElementById("toggleTeamBtn");
const teamContent = document.getElementById("teamContent");
const teamSummary = document.getElementById("teamSummary");
const teamSwipeTrack = document.getElementById("teamSwipeTrack");
const teamSwipePrev = document.getElementById("teamSwipePrev");
const teamSwipeNext = document.getElementById("teamSwipeNext");
const teamSwipeTabs = Array.from(document.querySelectorAll("[data-team-slide-target]"));
const responderPanel = document.querySelector(".responder-block");
const responderSummary = document.getElementById("responderSummary");
const crewPanel = document.querySelector(".crew-block");
const crewSummary = document.getElementById("crewSummary");

const crewQuickRoster = document.getElementById("crewQuickRoster");
const openNewCrewMemberBtn = document.getElementById("openNewCrewMemberBtn");
const selectedCrewPreview = document.getElementById("selectedCrewPreview");
const crewRoleButtons = document.getElementById("crewRoleButtons");
const addCrewToMissionBtn = document.getElementById("addCrewToMissionBtn");

const missionCrewList = document.getElementById("missionCrewList");

const crewNewMemberDetails = document.getElementById("crewNewMemberDetails");
const crewMemberNameInput = document.getElementById("crewMemberName");
const crewMemberDefaultRoleInput = document.getElementById("crewMemberDefaultRole");
const crewMemberServiceInput = document.getElementById("crewMemberService");
const crewMemberNoteInput = document.getElementById("crewMemberNote");
const saveCrewMemberBtn = document.getElementById("saveCrewMemberBtn");

const crewRosterList = document.getElementById("crewRosterList");

let selectedCrewMemberId = "";
let selectedCrewMissionRole = "Conducteur";
const patientIdentityPanel = document.querySelector(".identity-block");
const togglePatientIdentityBtn = document.getElementById("togglePatientIdentityBtn");
const patientIdentityContent = document.getElementById("patientIdentityContent");
const patientIdentitySummary = document.getElementById("patientIdentitySummary");
const missionRoutePanel = document.getElementById("missionRoutePanel");
const missionRouteDetails = document.getElementById("missionRouteDetails");
const missionRouteSummary = document.getElementById("missionRouteSummary");
const routeOriginCard = document.getElementById("routeOriginCard");
const routeOriginSummary = document.getElementById("routeOriginSummary");
const routeOriginCoordinates = document.getElementById("routeOriginCoordinates");
const routeCaptureLocationBtn = document.getElementById("routeCaptureLocationBtn");
const routeDepartureCard = document.getElementById("routeDepartureCard");
const routeDestinationCard = document.getElementById("routeDestinationCard");
const routeTransportCard = document.getElementById("routeTransportCard");
const routeJunctionCard = document.getElementById("routeJunctionCard") || document.getElementById("routeJunctionCompactDetails");
const routeArrivalCard = document.getElementById("routeArrivalCard");
const routeDepartureTimeInput = document.getElementById("routeDepartureTime");
const routeDepartureDisplay = document.getElementById("routeDepartureDisplay");
const routeDestinationNameInput = document.getElementById("routeDestinationName");
const routeDestinationServiceInput = document.getElementById("routeDestinationService");
const routeTransportStatusInput = document.getElementById("routeTransportStatus");
const routeTransportTypeInput = document.getElementById("routeTransportType");
const routeTransportVectorInput = document.getElementById("routeTransportVector");
const routeTransportModeInput = document.getElementById("routeTransportMode");
const routeTransportMonitoringInput = document.getElementById("routeTransportMonitoring");
const routeTransportTeamInput = document.getElementById("routeTransportTeam");
const routeCrewReuseSummary = document.getElementById("routeCrewReuseSummary");
const routeJunctionEnabledInput = document.getElementById("routeJunctionEnabled");
const routeJunctionTimeInput = document.getElementById("routeJunctionTime");
const routeJunctionPlaceInput = document.getElementById("routeJunctionPlace");
const routeJunctionWithInput = document.getElementById("routeJunctionWith");
const routeArrivalTimeInput = document.getElementById("routeArrivalTime");
const routeArrivalDisplay = document.getElementById("routeArrivalDisplay");
const routeTransmissionDoneInput = document.getElementById("routeTransmissionDone");
const routeTransportNoteInput = document.getElementById("routeTransportNote");
const saveMissionRouteBtn = document.getElementById("saveMissionRouteBtn");
const clearMissionRouteBtn = document.getElementById("clearMissionRouteBtn");
const routeSwipeTrack = document.getElementById("routeSwipeTrack");
const routeSwipePrev = document.getElementById("routeSwipePrev");
const routeSwipeNext = document.getElementById("routeSwipeNext");
const routeSwipeTabs = Array.from(document.querySelectorAll("[data-route-slide-target]"));
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
const floatingSaedBtn = document.getElementById("floatingSaedBtn");
const vitalsOverlay = document.getElementById("vitalsOverlay");
const vitalsSheet = document.getElementById("vitalsSheet");
const closeVitalsSheetBtn = document.getElementById("closeVitalsSheetBtn");
const vitalsMomentInput = document.getElementById("vitalsMoment");
const vitalsFcInput = document.getElementById("vitalsFc");
const vitalsTasLeftInput = document.getElementById("vitalsTasLeft");
const vitalsTadLeftInput = document.getElementById("vitalsTadLeft");
const vitalsTasRightInput = document.getElementById("vitalsTasRight");
const vitalsTadRightInput = document.getElementById("vitalsTadRight");
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

const RAPID_ACTION_GUARD_MS = 900;
const rapidActionTimestamps = new WeakMap();
let rapidActionStatusTimer = null;

function showRapidActionGuardFeedback(button) {
  let status = document.getElementById("rapidActionStatus");

  if (!status) {
    status = document.createElement("div");
    status.id = "rapidActionStatus";
    status.className = "rapid-action-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "assertive");
    status.setAttribute("aria-atomic", "true");
    document.body.appendChild(status);
  }

  status.textContent = "Action déjà prise en compte";
  status.classList.add("visible");

  button?.classList.add("rapid-action-blocked");

  window.clearTimeout(rapidActionStatusTimer);
  rapidActionStatusTimer = window.setTimeout(() => {
    status.classList.remove("visible");
    button?.classList.remove("rapid-action-blocked");
  }, 1200);
}

function preventRapidActionReplay(event) {
  const button = event.target.closest(ACTION_FEEDBACK_SELECTOR);

  if (!button || button.closest(".protocols-block")) return;

  const now = Date.now();
  const lastActivation = rapidActionTimestamps.get(button) || 0;

  if (now - lastActivation < RAPID_ACTION_GUARD_MS) {
    event.preventDefault();
    event.stopImmediatePropagation();
    showRapidActionGuardFeedback(button);
    return;
  }

  rapidActionTimestamps.set(button, now);
}

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

let missionResumeInterval = null;

function getMissionState() {
  try {
    const state = JSON.parse(localStorage.getItem(MISSION_STATE_STORAGE_KEY) || "null");

    if (!state || !Number.isFinite(Date.parse(state.startedAt))) {
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

function saveMissionState(state) {
  try {
    localStorage.setItem(MISSION_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // La reprise est une aide de confort : son échec ne doit jamais bloquer une action.
  }

  return state;
}

function startNewMissionState(options = {}) {
  const now = new Date().toISOString();

  return saveMissionState({
    version: 1,
    startedAt: options.startedAt || now,
    updatedAt: now,
    activeProtocolId: options.activeProtocolId || ""
  });
}

function touchMissionState(options = {}) {
  const current = getMissionState() || startNewMissionState();
  const activeProtocolId = options.activeProtocolId || current.activeProtocolId || "";

  return saveMissionState({
    ...current,
    updatedAt: new Date().toISOString(),
    activeProtocolId
  });
}

function applyMissionStateSnapshot(snapshot = {}) {
  const startedAt = Number.isFinite(Date.parse(snapshot.startedAt))
    ? snapshot.startedAt
    : new Date().toISOString();
  const activeProtocolId = document.getElementById(snapshot.activeProtocolId)
    ? snapshot.activeProtocolId
    : "";

  return startNewMissionState({ startedAt, activeProtocolId });
}

function clearMissionState() {
  try {
    localStorage.removeItem(MISSION_STATE_STORAGE_KEY);
  } catch {
    // Le reste de la remise à zéro doit continuer même si le stockage est indisponible.
  }

  window.clearInterval(missionResumeInterval);
  missionResumeInterval = null;
  missionResumeBanner?.classList.add("hidden");
}

function shouldTrackMissionActivity(text, options = {}) {
  if (options.skipMissionActivity) return false;

  return !String(text || "").startsWith("Charte utilisateur");
}

function formatMissionElapsed(startedAt) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, "0")} min`;
  }

  return `${String(minutes).padStart(2, "0")} min ${String(seconds).padStart(2, "0")} s`;
}

function updateMissionResumeBanner() {
  if (!missionResumeBanner) return false;

  const state = getMissionState();
  const hasMissionLog = getLog().length > 0;

  if (!state || !hasMissionLog) {
    missionResumeBanner.classList.add("hidden");
    return false;
  }

  missionResumeProtocol.textContent =
    PROTOCOL_TITLES[state.activeProtocolId] || "Mission PISU";
  missionResumeDuration.textContent = formatMissionElapsed(state.startedAt);
  missionResumeBanner.classList.remove("hidden");
  return true;
}

function stopMissionResumeTicker() {
  window.clearInterval(missionResumeInterval);
  missionResumeInterval = null;
}

function startMissionResumeTicker() {
  stopMissionResumeTicker();

  if (!updateMissionResumeBanner()) return;

  missionResumeInterval = window.setInterval(updateMissionResumeBanner, 1000);
}

function resumeCurrentMission() {
  const state = getMissionState();

  stopMissionResumeTicker();
  missionResumeBanner?.classList.add("hidden");

  if (state?.activeProtocolId && document.getElementById(state.activeProtocolId)) {
    showProtocolPage(state.activeProtocolId);
  }

  addLog("Mission en cours reprise après réouverture");
}

function setupMissionResumeFeature() {
  resumeMissionBtn?.addEventListener("click", resumeCurrentMission);

  if (document.visibilityState === "visible") {
    startMissionResumeTicker();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopMissionResumeTicker();
      return;
    }

    if (!missionResumeBanner?.classList.contains("hidden")) {
      startMissionResumeTicker();
    }
  });
}

function loadLog() {
  const saved = getLog();
  logEl.innerHTML = "";
  saved.forEach(item => addLogToDom(item.time, item.text));
}

function saveLog(items) {
  localStorage.setItem("pisuLog", JSON.stringify(items));
}

function getLog() {
  try {
    const items = JSON.parse(localStorage.getItem("pisuLog") || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function addLog(text, structuredOptions = {}) {
  const items = getLog();
  const item = { time: nowLabel(), text };
  items.push(item);
  saveLog(items);
  addLogToDom(item.time, item.text);

  if (shouldTrackMissionActivity(text, structuredOptions)) {
    touchMissionState();
  }

  if (!structuredOptions?.skipStructuredSAED) {
    const eventOptions = {
      ...structuredOptions,
      heure: item.time,
      iso: new Date().toISOString()
    };

    addStructuredEvent(
      inferStructuredEventFromLog(text, eventOptions) ||
      inferStructuredEvent(text, eventOptions)
    );
  }

  window.pisuSAED?.refreshIfOpen?.();
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

function normalizeSAEDText(value) {
  return normalizeForSearch(value).replace(/[’']/g, " ");
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
  if (!event) return null;

  const events = getStructuredEvents();
  const now = new Date();

  events.push({
    ...event,
    id: event.id || createStructuredEventId(),
    iso: event.iso || now.toISOString(),
    heure: event.heure || nowLabel(),
    version: "saed-v2"
  });

  saveStructuredEvents(events);
  return event;
}

function saveStructuredEvent(event) {
  return addStructuredEvent(event);
}

function getProtocolIdFromText(value) {
  const normalized = normalizeSAEDText(value);

  if (!normalized) return "";

  for (const [protocolId, protocol] of Object.entries(PISU_PROTOCOLS)) {
    const aliases = [protocol.label, ...(protocol.aliases || [])].map(normalizeSAEDText);

    if (aliases.some(alias => alias && normalized.includes(alias))) {
      return protocolId;
    }
  }

  return "";
}

function getProtocolLabel(protocolId) {
  return PISU_PROTOCOLS[protocolId]?.label || PROTOCOL_TITLES[protocolId] || "Mission PISU";
}

function getActionTemplate(protocolId, actionKey) {
  return PISU_SAED_ACTIONS[protocolId]?.[actionKey] ||
    PISU_SAED_ACTIONS.common?.[actionKey] ||
    null;
}

function inferSAEDActionFromText(protocolId, message) {
  const normalized = normalizeSAEDText(message);
  const protocolActions = {
    ...(PISU_SAED_ACTIONS.common || {}),
    ...(PISU_SAED_ACTIONS[protocolId] || {})
  };

  for (const [actionKey, action] of Object.entries(protocolActions)) {
    const aliases = [actionKey, action.libelleCourt, ...(action.aliases || [])].map(normalizeSAEDText);

    if (aliases.some(alias => alias && normalized.includes(alias))) {
      return { actionKey, action };
    }
  }

  return null;
}

function buildStructuredEvent(protocolId, actionKey, overrides = {}) {
  const now = new Date();
  const protocolLabel = getProtocolLabel(protocolId);
  const template = getActionTemplate(protocolId, actionKey) || {};

  return {
    id: createStructuredEventId(),
    iso: overrides.iso || now.toISOString(),
    heure: overrides.heure || nowLabel(),
    version: "saed-v2",
    protocolId,
    protocole: protocolLabel,
    action: actionKey,
    sectionSAED: overrides.sectionSAED || template.sectionSAED || "journal",
    categorie: overrides.categorie || template.categorie || "journal",
    sousCategorie: overrides.sousCategorie || actionKey,
    priorite: overrides.priorite || template.priorite || "basse",
    statut: overrides.statut || template.statut || "realise",
    type: overrides.type || (template.phraseSAED ? "clinique" : "technique"),
    libelleCourt: overrides.libelleCourt || template.libelleCourt || `${protocolLabel} : action réalisée`,
    libelleLong: overrides.libelleLong || overrides.libelleCourt || template.libelleCourt || `${protocolLabel} : action réalisée`,
    phraseSAED: overrides.phraseSAED ?? template.phraseSAED ?? "",
    detail: overrides.detail || "",
    dose: overrides.dose || "",
    voie: overrides.voie || "",
    commentaire: overrides.commentaire || "",
    visibleSynthese: overrides.visibleSynthese ?? template.visibleSynthese ?? false,
    visibleSAED: overrides.visibleSAED ?? template.visibleSAED ?? false,
    visibleChrono: overrides.visibleChrono ?? template.visibleChrono ?? true,
    visibleJournal: overrides.visibleJournal ?? true
  };
}

function logPisuAction(protocolId, actionKey, overrides = {}) {
  const event = buildStructuredEvent(protocolId, actionKey, overrides);
  const protocolLabel = getProtocolLabel(protocolId);
  const journalMessage = overrides.journal ||
    `${protocolLabel} : ${event.libelleCourt}${event.detail ? ` — ${event.detail}` : ""}.`;

  saveStructuredEvent(event);

  if (typeof addLog === "function") {
    addLog(journalMessage, { skipStructuredSAED: true });
  }

  return event;
}

function inferStructuredEventFromLog(message, options = {}) {
  if (options?.skipStructuredSAED) return null;

  const protocolId = options.protocolId || getProtocolIdFromText(message);
  if (!protocolId) return null;

  const inferred = inferSAEDActionFromText(protocolId, message);
  if (!inferred) return null;

  return buildStructuredEvent(protocolId, inferred.actionKey, {
    ...inferred.action,
    heure: options.heure,
    iso: options.iso,
    libelleLong: message
  });
}

function installStructuredSAEDEngine() {
  window.__pisuStructuredSAEDEngineInstalled = true;
  window.logPisuAction = logPisuAction;
  window.getStructuredEvents = getStructuredEvents;
  window.clearStructuredEvents = clearStructuredEvents;
  window.saveStructuredEvent = saveStructuredEvent;
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

function savePatientIdentity(options = {}) {
  const name = valueOrDefault(patientNameInput.value, "identité non renseignée");
  const age = valueOrDefault(formatPatientAge());
  const birthDate = formatPatientBirthDate();
  const sex = valueOrDefault(patientSexInput.value);
  const weight = valueOrDefault(formatPatientWeight());
  const category = valueOrDefault(getPatientCategoryLabel(getPatientCategory()));
  const note = patientNoteInput.value.trim();

  let logLine = `Identité patient : ${name} — âge/naissance : ${age} — sexe : ${sex} — catégorie : ${category} — poids estimé : ${weight}`;

  if (birthDate) {
    logLine += ` — né(e) le ${birthDate}`;
  }

  if (note) {
    logLine += ` — remarque : ${note}`;
  }

  if (!options.silent) {
    addLog(logLine);
    setButtonValidatedPersistent?.(saveIdentityBtn, true, "Identité enregistrée ✓");
  }

  updatePatientIdentitySummary();
}

function setUnknownIdentity() {
  patientNameInput.value = "Inconnu";
  patientSexInput.value = "";
  patientCategoryInput.value = "";
  patientNoteInput.value = "Identité inconnue au moment de la prise en charge";

  if (patientAgeUnitInput) patientAgeUnitInput.value = "years";
  populatePatientAgeSelect();
  populatePatientWeightSelect();
  resetPatientRoller(patientAgeInput);
  resetPatientRoller(patientWeightInput);
  applyPatientBirthDateSnapshot({});

  addLog("Identité patient : inconnue au moment de la prise en charge");
  scrollToPatientSlide?.(0, "auto");
  updatePatientIdentitySummary();
}

function getCleanInputValue(input) {
  return input?.value?.trim() || "";
}

function setInputValue(input, value) {
  if (input) {
    input.value = value || "";
  }
}

function setCheckedValue(input, value) {
  if (input) {
    input.checked = Boolean(value);
  }
}

function getPatientAntecedentsSnapshot() {
  return {
    allergies: getCleanInputValue(patientAllergiesInput),
    medicalHistory: getCleanInputValue(patientMedicalHistoryInput),
    currentTreatment: getCleanInputValue(patientCurrentTreatmentInput),
    note: getCleanInputValue(patientAntecedentsNoteInput),

    anticoagulant: Boolean(patientAnticoagulantCheck?.checked),
    diabetes: Boolean(patientDiabetesCheck?.checked),
    epilepsy: Boolean(patientEpilepsyCheck?.checked),
    cardiacHistory: Boolean(patientCardiacHistoryCheck?.checked),
    respiratoryHistory: Boolean(patientRespHistoryCheck?.checked),
    pregnancyPossible: Boolean(patientPregnancyCheck?.checked)
  };
}

function hasPatientAntecedentsData(antecedents = getPatientAntecedentsSnapshot()) {
  return Boolean(
    antecedents.allergies ||
    antecedents.medicalHistory ||
    antecedents.currentTreatment ||
    antecedents.note ||
    antecedents.anticoagulant ||
    antecedents.diabetes ||
    antecedents.epilepsy ||
    antecedents.cardiacHistory ||
    antecedents.respiratoryHistory ||
    antecedents.pregnancyPossible
  );
}

function getPatientAntecedentsFlags(antecedents = getPatientAntecedentsSnapshot()) {
  const flags = [];

  if (antecedents.anticoagulant) flags.push("Anticoagulant / antiagrégant");
  if (antecedents.diabetes) flags.push("Diabète");
  if (antecedents.epilepsy) flags.push("Épilepsie");
  if (antecedents.cardiacHistory) flags.push("ATCD cardiaque");
  if (antecedents.respiratoryHistory) flags.push("ATCD respiratoire");
  if (antecedents.pregnancyPossible) flags.push("Grossesse possible");

  return flags;
}

function getPatientAntecedentsLines(antecedents = getPatientAntecedentsSnapshot()) {
  const lines = [];
  const flags = getPatientAntecedentsFlags(antecedents);

  if (antecedents.allergies) {
    lines.push(`Allergies : ${antecedents.allergies}`);
  }

  if (antecedents.medicalHistory) {
    lines.push(`Antécédents médicaux : ${antecedents.medicalHistory}`);
  }

  if (antecedents.currentTreatment) {
    lines.push(`Traitements habituels : ${antecedents.currentTreatment}`);
  }

  if (flags.length > 0) {
    lines.push(`Risques signalés : ${flags.join(", ")}`);
  }

  if (antecedents.note) {
    lines.push(`Remarque : ${antecedents.note}`);
  }

  if (lines.length === 0) {
    lines.push("Aucun antécédent / risque utile renseigné.");
  }

  return lines;
}

function savePatientAntecedents() {
  const antecedents = getPatientAntecedentsSnapshot();

  localStorage.setItem(
    PATIENT_ANTECEDENTS_STORAGE_KEY,
    JSON.stringify(antecedents)
  );

  updatePatientAntecedentsSummary();

  if (handoffCode?.value) {
    resetMissionHandoffUi?.();
  }

  return antecedents;
}

function applyPatientAntecedentsSnapshot(antecedents = {}, options = {}) {
  setInputValue(patientAllergiesInput, antecedents.allergies);
  setInputValue(patientMedicalHistoryInput, antecedents.medicalHistory);
  setInputValue(patientCurrentTreatmentInput, antecedents.currentTreatment);
  setInputValue(patientAntecedentsNoteInput, antecedents.note);

  setCheckedValue(patientAnticoagulantCheck, antecedents.anticoagulant);
  setCheckedValue(patientDiabetesCheck, antecedents.diabetes);
  setCheckedValue(patientEpilepsyCheck, antecedents.epilepsy);
  setCheckedValue(patientCardiacHistoryCheck, antecedents.cardiacHistory);
  setCheckedValue(patientRespHistoryCheck, antecedents.respiratoryHistory);
  setCheckedValue(patientPregnancyCheck, antecedents.pregnancyPossible);

  if (!options.skipSave) {
    localStorage.setItem(
      PATIENT_ANTECEDENTS_STORAGE_KEY,
      JSON.stringify(getPatientAntecedentsSnapshot())
    );
  }

  updatePatientAntecedentsSummary();
}

function loadPatientAntecedents() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(PATIENT_ANTECEDENTS_STORAGE_KEY) || "{}"
    );

    applyPatientAntecedentsSnapshot(saved, { skipSave: true });
  } catch {
    localStorage.removeItem(PATIENT_ANTECEDENTS_STORAGE_KEY);
    applyPatientAntecedentsSnapshot({}, { skipSave: true });
  }
}

function resetPatientAntecedentsFields() {
  localStorage.removeItem(PATIENT_ANTECEDENTS_STORAGE_KEY);
  applyPatientAntecedentsSnapshot({}, { skipSave: true });
}

function updatePatientAntecedentsSummary() {
  if (!patientAntecedentsSummary) return;

  const antecedents = getPatientAntecedentsSnapshot();

  if (!hasPatientAntecedentsData(antecedents)) {
    patientAntecedentsSummary.textContent = "Aucun antécédent renseigné.";
    return;
  }

  const flags = getPatientAntecedentsFlags(antecedents);
  const summaryParts = [];

  if (antecedents.allergies) summaryParts.push("Allergies renseignées");
  if (antecedents.medicalHistory) summaryParts.push("ATCD renseignés");
  if (antecedents.currentTreatment) summaryParts.push("Traitements renseignés");
  if (flags.length > 0) summaryParts.push(flags.join(", "));

  patientAntecedentsSummary.textContent = summaryParts.join(" · ");
}

function setupPatientAntecedentsFeature() {
  const fields = [
    patientAllergiesInput,
    patientMedicalHistoryInput,
    patientCurrentTreatmentInput,
    patientAntecedentsNoteInput,
    patientAnticoagulantCheck,
    patientDiabetesCheck,
    patientEpilepsyCheck,
    patientCardiacHistoryCheck,
    patientRespHistoryCheck,
    patientPregnancyCheck
  ];

  fields.forEach(field => {
    if (!field) return;

    field.addEventListener("input", savePatientAntecedents);
    field.addEventListener("change", savePatientAntecedents);
  });

  updatePatientAntecedentsSummary();
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

function populatePatientNumberSelect(select, config) {
  if (!select) return;

  const {
    min,
    max,
    start,
    step = 1,
    suffix = "",
    decimals = 0
  } = config;

  const currentValue = select.value;
  const wasTouched = select.dataset.patientTouched === "true";

  select.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "Non renseigné";
  select.appendChild(emptyOption);

  for (let value = min; value <= max + step / 2; value += step) {
    const rounded = Number(value.toFixed(decimals));
    const optionValue = decimals > 0 ? rounded.toFixed(decimals) : String(rounded);
    const textValue = decimals > 0
      ? rounded.toFixed(decimals).replace(".", ",")
      : String(rounded);

    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = `${textValue}${suffix}`;

    select.appendChild(option);
  }

  const defaultValue =
    select.dataset.patientDefault ||
    (decimals > 0 ? Number(start).toFixed(decimals) : String(start));

  const values = Array.from(select.options).map(option => option.value);

  if (currentValue && values.includes(currentValue)) {
    select.value = currentValue;
    select.dataset.patientTouched = wasTouched ? "true" : "false";
  } else if (defaultValue && values.includes(defaultValue)) {
    select.value = defaultValue;
    select.dataset.patientTouched = "false";
  } else {
    select.value = "";
    select.dataset.patientTouched = "false";
  }
}

function populatePatientAgeSelect() {
  if (!patientAgeInput) return;

  const unit = patientAgeUnitInput?.value || "years";

  if (unit === "months") {
    patientAgeInput.dataset.patientDefault = "6";

    populatePatientNumberSelect(patientAgeInput, {
      min: 0,
      max: 36,
      start: 6,
      step: 1,
      suffix: " mois"
    });

    return;
  }

  patientAgeInput.dataset.patientDefault = "40";

  populatePatientNumberSelect(patientAgeInput, {
    min: 0,
    max: 120,
    start: 40,
    step: 1,
    suffix: " ans"
  });
}

function populatePatientWeightSelect() {
  populatePatientNumberSelect(patientWeightInput, {
    min: 1,
    max: 200,
    start: 70,
    step: 1,
    suffix: " kg"
  });
}

function populatePatientIdentityRollers() {
  populatePatientAgeSelect();
  populatePatientWeightSelect();
}

function markPatientRollerTouched(event) {
  const input = event.target;

  if (!input?.dataset) return;

  input.dataset.patientTouched = "true";
}

function resetPatientRoller(select) {
  if (!select) return;

  const defaultValue = select.dataset.patientDefault || "";

  if (defaultValue) {
    select.value = defaultValue;
    select.dataset.patientTouched = "false";
  } else {
    select.value = "";
    select.dataset.patientTouched = "false";
  }
}

function getPatientRollerValue(select) {
  if (!select) return "";

  if (select.dataset.patientDefault && select.dataset.patientTouched !== "true") {
    return "";
  }

  return select.value?.trim() || "";
}

const PATIENT_BIRTH_MONTHS = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" }
];

function getDaysInPatientBirthMonth(month, year) {
  const safeMonth = Number(month);
  const safeYear = Number(year) || new Date().getFullYear();

  if (!safeMonth) return 31;

  return new Date(safeYear, safeMonth, 0).getDate();
}

function populatePatientBirthSelect(select, values, emptyLabel) {
  if (!select) return;

  const currentValue = select.value;

  select.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = emptyLabel;
  select.appendChild(emptyOption);

  values.forEach(item => {
    const option = document.createElement("option");

    if (typeof item === "object") {
      option.value = item.value;
      option.textContent = item.label;
    } else {
      option.value = String(item);
      option.textContent = String(item).padStart(2, "0");
    }

    select.appendChild(option);
  });

  if (currentValue && Array.from(select.options).some(option => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function populatePatientBirthDaySelect() {
  const maxDay = getDaysInPatientBirthMonth(
    patientBirthMonthInput?.value,
    patientBirthYearInput?.value
  );

  const days = Array.from({ length: maxDay }, (_, index) => index + 1);

  populatePatientBirthSelect(patientBirthDayInput, days, "Jour");
}

function populatePatientBirthMonthSelect() {
  populatePatientBirthSelect(patientBirthMonthInput, PATIENT_BIRTH_MONTHS, "Mois");
}

function populatePatientBirthYearSelect() {
  if (!patientBirthYearInput) return;

  const currentYear = new Date().getFullYear();
  const years = [];

  for (let year = currentYear; year >= currentYear - 120; year -= 1) {
    years.push(year);
  }

  populatePatientBirthSelect(patientBirthYearInput, years, "Année");
}

function populatePatientBirthDateRollers() {
  populatePatientBirthMonthSelect();
  populatePatientBirthYearSelect();
  populatePatientBirthDaySelect();
}

function getPatientBirthDateParts() {
  return {
    day: patientBirthDayInput?.value || "",
    month: patientBirthMonthInput?.value || "",
    year: patientBirthYearInput?.value || ""
  };
}

function getPatientBirthDate() {
  const { day, month, year } = getPatientBirthDateParts();

  if (!day || !month || !year) return null;

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  const isValid =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);

  if (!isValid) return null;

  const today = new Date();

  if (date > today) return null;

  return date;
}

function formatPatientBirthDate() {
  const date = getPatientBirthDate();

  if (!date) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function formatPatientBirthDateIso() {
  const date = getPatientBirthDate();

  if (!date) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${year}-${month}-${day}`;
}

function getAgeFromBirthDate() {
  const birthDate = getPatientBirthDate();

  if (!birthDate) return null;

  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months;

  return {
    years,
    months,
    totalMonths,
    ageYearsDecimal: totalMonths / 12
  };
}

function updatePatientBirthDateSummary() {
  if (!patientBirthDateSummary) return;

  const birthDateText = formatPatientBirthDate();
  const ageInfo = getAgeFromBirthDate();

  if (!birthDateText || !ageInfo) {
    patientBirthDateSummary.textContent = "Date de naissance non renseignée.";
    return;
  }

  if (ageInfo.years >= 2) {
    patientBirthDateSummary.textContent = `Né(e) le ${birthDateText} — âge calculé : ${ageInfo.years} ans.`;
    return;
  }

  patientBirthDateSummary.textContent = `Né(e) le ${birthDateText} — âge calculé : ${ageInfo.totalMonths} mois.`;
}

function formatPatientAge() {
  const manualValue = getPatientRollerValue?.(patientAgeInput) || "";

  if (manualValue) {
    const unit = patientAgeUnitInput?.value || "years";
    return unit === "months" ? `${manualValue} mois` : `${manualValue} ans`;
  }

  const birthAge = getAgeFromBirthDate();

  if (!birthAge) return "";

  if (birthAge.years >= 2) {
    return `${birthAge.years} ans`;
  }

  return `${birthAge.totalMonths} mois`;
}

function formatPatientWeight() {
  const value = getPatientRollerValue(patientWeightInput);

  return value ? `${value} kg` : "";
}

function setupPatientRollerFeature() {
  populatePatientIdentityRollers();

  [patientAgeInput, patientWeightInput].forEach(input => {
    if (!input) return;

    input.addEventListener("focus", markPatientRollerTouched);
    input.addEventListener("pointerdown", markPatientRollerTouched);
    input.addEventListener("change", markPatientRollerTouched);
  });

  patientAgeUnitInput?.addEventListener("change", () => {
    if (patientAgeInput) {
      patientAgeInput.dataset.patientTouched = "true";
    }

    populatePatientAgeSelect();

    if (typeof savePatientIdentity === "function") {
      savePatientIdentity({ silent: true });
    }
  });
}

function setupPatientBirthDateFeature() {
  populatePatientBirthDateRollers();
  updatePatientBirthDateSummary();

  [patientBirthDayInput, patientBirthMonthInput, patientBirthYearInput].forEach(input => {
    input?.addEventListener("change", () => {
      populatePatientBirthDaySelect();
      updatePatientBirthDateSummary();
      updatePatientIdentitySummary?.();

      setButtonValidatedPersistent?.(saveIdentityBtn, false);

      if (typeof savePatientIdentity === "function") {
        savePatientIdentity({ silent: true });
      }

      updatePatientSwipeUi?.();
      updateIdentitySwipeUi?.();
    });
  });
}

function getPatientWeightKg() {
  const value = getPatientRollerValue(patientWeightInput);

  if (!value) return null;

  const weight = Number(String(value).replace(",", "."));

  return Number.isFinite(weight) && weight > 0 ? weight : null;
}

function getPatientAgeYears() {
  const manualValue = getPatientRollerValue?.(patientAgeInput) || "";

  if (manualValue) {
    const age = Number(String(manualValue).replace(",", "."));

    if (!Number.isFinite(age) || age < 0) return null;

    const unit = patientAgeUnitInput?.value || "years";

    if (unit === "months") {
      return age / 12;
    }

    return age;
  }

  const birthAge = getAgeFromBirthDate();

  if (birthAge) {
    return birthAge.ageYearsDecimal;
  }

  return null;
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
  const patientAge = formatPatientAge() || "À compléter";
  const patientBirthDate = formatPatientBirthDate();
  const patientSex = patientSexInput?.value?.trim() || "À compléter";
  const patientCategory = getPatientCategoryLabel(getPatientCategory()) || "À compléter";
  const patientWeight = formatPatientWeight() || "À compléter";
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
    ...(patientBirthDate ? [`Date de naissance : ${patientBirthDate}.`] : []),
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

  const antecedentsLines = getPatientAntecedentsLines();

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
    `Version application : ${APP_VERSION ? `v${APP_VERSION}` : "non renseignée"}`,
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
    ...(patientBirthDate ? [`Date de naissance : ${patientBirthDate}`] : []),
    `Âge : ${patientAge}`,
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

function uniqueSAEDPhrases(events) {
  const seen = new Set();
  const phrases = [];

  events.forEach(event => {
    const phrase = String(event.phraseSAED || "").trim();
    if (!phrase) return;

    const key = normalizeSAEDText(phrase);
    if (seen.has(key)) return;

    seen.add(key);
    phrases.push(phrase);
  });

  return phrases;
}

function getMainProtocolIdFromEvents(events) {
  const firstProtocolEvent = events.find(event => event.protocolId);
  return firstProtocolEvent?.protocolId || "";
}

function buildPatientIdentitySAEDLine() {
  const patient = typeof getPatientSnapshot === "function" ? getPatientSnapshot() : {};
  const parts = [];

  if (patient.name) parts.push(patient.name);
  if (patient.birthDate) parts.push(`né(e) le ${patient.birthDate}`);
  if (patient.age) parts.push(`${patient.age}`);
  if (patient.sex) parts.push(patient.sex);
  if (patient.weight) parts.push(`${patient.weight} kg`);

  return parts.length > 0
    ? `Patient : ${parts.join(" — ")}.`
    : "Identité patient à compléter.";
}

function buildAntecedentsSAEDLines() {
  return typeof getPatientAntecedentsLines === "function"
    ? getPatientAntecedentsLines()
    : ["Antécédents non renseignés."];
}

function buildLatestVitalsSAEDLine() {
  if (typeof getVitalsEntries !== "function") {
    return "Constantes à compléter.";
  }

  const vitals = getVitalsEntries();
  if (!Array.isArray(vitals) || vitals.length === 0) {
    return "Constantes à compléter.";
  }

  const latest = vitals[vitals.length - 1];
  return typeof formatVitalsEntry === "function"
    ? `Dernières constantes : ${formatVitalsEntry(latest, { withNumber: false })}.`
    : "Dernières constantes renseignées dans le module constantes.";
}

function buildCrewSAEDLines() {
  if (window.pisuCrew?.getMissionCrewLines) {
    return window.pisuCrew.getMissionCrewLines();
  }

  return typeof getMissionCrewLines === "function"
    ? getMissionCrewLines()
    : ["Équipage associé non renseigné."];
}

function buildStructuredSAEDLines() {
  const events = getActiveEventsForSaed(getStructuredEvents());
  const mainProtocolId = getMainProtocolIdFromEvents(events);
  const protocol = PISU_PROTOCOLS[mainProtocolId];
  const saedEvents = events.filter(event => event.visibleSAED !== false);

  const situationEvents = saedEvents.filter(event => event.sectionSAED === "S");
  const antecedentEvents = saedEvents.filter(event => event.sectionSAED === "A");
  const evaluationEvents = saedEvents.filter(event => event.sectionSAED === "E");
  const demandEvents = saedEvents.filter(event => event.sectionSAED === "D");

  const situationLines = [
    protocol?.intro || "Patient pris en charge dans le cadre d’un protocole PISU.",
    buildPatientIdentitySAEDLine(),
    ...uniqueSAEDPhrases(situationEvents),
    buildLatestVitalsSAEDLine()
  ];

  const antecedentLines = [
    ...buildAntecedentsSAEDLines(),
    ...uniqueSAEDPhrases(antecedentEvents)
  ];

  const evaluationLines = uniqueSAEDPhrases(evaluationEvents);
  if (evaluationLines.length === 0) {
    evaluationLines.push("Évaluation et actions réalisées à reprendre dans la chronologie clinique.");
  }

  const demandLines = uniqueSAEDPhrases(demandEvents);
  if (demandLines.length === 0) {
    demandLines.push(protocol?.demand || "Demande d’avis médical régulateur selon contexte clinique et évolution.");
  }

  return [
    "========================================",
    "SAED STRUCTURÉ",
    "========================================",
    "",
    "S — SITUATION",
    "----------------------------------------",
    ...situationLines,
    "",
    "A — ANTÉCÉDENTS",
    "----------------------------------------",
    ...antecedentLines,
    "",
    "E — ÉVALUATION / ACTIONS RÉALISÉES",
    "----------------------------------------",
    ...evaluationLines,
    "",
    "D — DEMANDE / DEVENIR",
    "----------------------------------------",
    ...demandLines,
    ...getMissionRouteSAEDLines(),
    "",
    "ÉQUIPAGE MISSION",
    "----------------------------------------",
    ...buildCrewSAEDLines(),
    ""
  ];
}

function buildUsefulClinicalChronologyLines() {
  const events = getActiveEventsForSaed(getStructuredEvents())
    .filter(event => event.visibleChrono !== false)
    .sort((a, b) => String(a.iso || "").localeCompare(String(b.iso || "")));

  if (events.length === 0) {
    return ["Aucune chronologie clinique structurée disponible."];
  }

  return events.map(event => {
    const detail = event.detail ? ` — ${event.detail}` : "";
    return `${event.heure || "Heure ?"} — ${event.protocole || "Mission PISU"} — ${event.libelleCourt || "Événement"}${detail}`;
  });
}

function exportText() {
  const rawLogItems = getLog();
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
    `Version application : ${APP_VERSION ? `v${APP_VERSION}` : "non renseignée"}`,
    "",
    ...buildStructuredSAEDLines(),
    "========================================",
    "CHRONOLOGIE CLINIQUE UTILE",
    "========================================",
    ...buildUsefulClinicalChronologyLines(),
    "",
    "========================================",
    "PARCOURS / TRANSPORT",
    "========================================",
    ...getMissionRouteLines(),
    "",
    "========================================",
    "JOURNAL COMPLET",
    "========================================",
    ...journalCompleteLines,
    "",
    "========================================",
    "FIN FEUILLE SAED",
    "========================================"
  ];

  return lines
    .filter((line, index, allLines) => line !== "" || allLines[index - 1] !== "")
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

function shouldReuseGpsForMissionRoute(actionLabel) {
  const normalized = normalizeForSearch(actionLabel);
  return normalized.includes("arrivee sur les lieux") || normalized.includes("lieu de prise en charge");
}

function storeMissionRouteOriginFromGps(actionLabel, position, address = "") {
  if (!shouldReuseGpsForMissionRoute(actionLabel)) return;

  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;
  const accuracy = Math.round(position.coords.accuracy);
  const capturedAt = Number.isFinite(position.timestamp)
    ? new Date(position.timestamp).toISOString()
    : new Date().toISOString();

  missionRouteMetadata.originLabel = address || "Position GPS";
  missionRouteMetadata.originCoordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  missionRouteMetadata.originAccuracy = String(accuracy);
  missionRouteMetadata.originCapturedAt = capturedAt;
  missionRouteMetadata.originSource = actionLabel;
  saveMissionRoute();
}

function addGpsPoint(actionLabel) {
  if (!("geolocation" in navigator)) {
    addLog(`GPS ${actionLabel} impossible : geolocalisation non disponible`);
    return;
  }

  if (shouldReuseGpsForMissionRoute(actionLabel)) {
    routeCaptureLocationBtn?.setAttribute("aria-busy", "true");
    if (routeCaptureLocationBtn) routeCaptureLocationBtn.textContent = "Localisation…";
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

        storeMissionRouteOriginFromGps(actionLabel, position, address);
        addLog(`GPS ${actionLabel} : ${addressText}${gpsText}`);
      } catch {
        storeMissionRouteOriginFromGps(actionLabel, position);
        addLog(`GPS ${actionLabel} : adresse indisponible - ${gpsText}`);
      } finally {
        routeCaptureLocationBtn?.removeAttribute("aria-busy");
        updateMissionRouteUi?.();
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
      routeCaptureLocationBtn?.removeAttribute("aria-busy");
      updateMissionRouteUi?.();
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

saveIdentityBtn?.addEventListener("click", savePatientIdentity);
savePatientHistoryBtn?.addEventListener("click", () => {
  savePatientAntecedents();
  markButtonValidated?.(savePatientHistoryBtn, "Antécédents enregistrés ✓");
});
savePatientNotesBtn?.addEventListener("click", () => {
  savePatientIdentity({ silent: true });
  savePatientAntecedents();
  markButtonValidated?.(savePatientNotesBtn, "Notes enregistrées ✓");
});
unknownIdentityBtn?.addEventListener("click", setUnknownIdentity);

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
  if (patientSexInput) patientSexInput.value = "";
  if (patientCategoryInput) patientCategoryInput.value = "";
  if (patientNoteInput) patientNoteInput.value = "";

  if (patientAgeUnitInput) patientAgeUnitInput.value = "years";
  if (patientBirthDayInput) patientBirthDayInput.value = "";
  if (patientBirthMonthInput) patientBirthMonthInput.value = "";
  if (patientBirthYearInput) patientBirthYearInput.value = "";

  populatePatientAgeSelect();
  populatePatientWeightSelect();
  populatePatientBirthDateRollers();

  resetPatientRoller(patientAgeInput);
  resetPatientRoller(patientWeightInput);

  resetPatientAntecedentsFields();
  updatePatientBirthDateSummary?.();
  updatePatientIdentitySummary?.();
}

function resetAllVisualValidations() {
  document.querySelectorAll(".action-done, .click-feedback, .attention-flash, .validation-done, .validation-warning").forEach(element => {
    element.classList.remove("action-done", "click-feedback", "attention-flash", "validation-done", "validation-warning");
    delete element.dataset.clickCount;
  });
}

function notifyProtocolMissionReset() {
  window.dispatchEvent(new CustomEvent("pisu:mission-reset"));
}

function resetMissionCompletely() {
  const confirmation = window.confirm(
    "Créer une nouvelle mission ?\n\nCela efface le patient, le journal, les codes de transfert, les validations et les compteurs.\n\nL’intervenant reste enregistré."
  );

  if (!confirmation) {
    return;
  }

  window.pisuSounds?.stopRcpMetronome();
  window.pisuSounds?.resetAlertMemory();
  notifyProtocolMissionReset();

  clearInterval(timerInterval);
  timerInterval = null;

  localStorage.removeItem("pisuLog");

  clearStructuredEvents?.();
  clearAllProtocolCounters?.();
  resetPatientIdentityFields?.();
  resetPatientAntecedentsFields?.();
  resetMissionCrew?.();
  resetMissionRoute?.();
  resetAllVisualValidations?.();
  clearVitalsHistory?.();
  window.pisuSAED?.reset?.();
  clearProtocolScrollMemory?.();
  resetMissionHandoffUi?.();
  startNewMissionState();

  if (logEl) {
    logEl.innerHTML = "";
  }

  remaining = 120;

  if (timerEl) {
    timerEl.textContent = "02:00";
  }

  showMainMenu?.();

  addLog("Nouvelle mission créée — journal, SAED, patient, constantes et parcours remis à zéro");

  loadResponderIdentity?.();
  updateResponderSummary?.();
  updateTeamSummary?.();
}

document.getElementById("clearLog").addEventListener("click", () => {
  if (confirm("Effacer le journal de cette mission ?")) {
    notifyProtocolMissionReset();

    clearInterval(timerInterval);
    timerInterval = null;

    localStorage.removeItem("pisuLog");
    clearMissionState();

    clearAllProtocolCounters();
    clearStructuredEvents();
    resetMissionRoute();
    resetMissionHandoffUi?.();
    resetAllVisualValidations();
    clearVitalsHistory();
    window.pisuSAED?.reset?.();

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
  if (!offlineStatus) return;

  const offlineReady = Boolean(navigator.serviceWorker?.controller);

  if (offlineReady) {
    offlineStatus.textContent = navigator.onLine
      ? "Application prête hors ligne · connexion détectée"
      : "Hors ligne · données locales disponibles";
    return;
  }

  offlineStatus.textContent = navigator.onLine
    ? "Préparation du mode hors ligne…"
    : "Hors ligne non préparé · reconnecter une fois pour installer l'application";
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => {
      updateOnlineStatus();
      navigator.serviceWorker.ready.then(updateOnlineStatus);
    })
    .catch(() => {
      offlineStatus.textContent = "Service worker non actif en local. Tester via GitHub Pages ou localhost.";
    });

  navigator.serviceWorker.addEventListener("controllerchange", updateOnlineStatus);
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

document.addEventListener("click", preventRapidActionReplay, true);

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

function saveCurrentProtocolScrollPosition() {
  if (!document.body.classList.contains("protocol-mode")) return;
  if (!currentProtocolPageId) return;

  protocolScrollPositions[currentProtocolPageId] = window.scrollY || window.pageYOffset || 0;

  try {
    sessionStorage.setItem(
      "pisuProtocolScrollPositions",
      JSON.stringify(protocolScrollPositions)
    );
  } catch {
    // La memoire vive suffit si sessionStorage echoue.
  }
}

function loadProtocolScrollPositions() {
  try {
    const saved = JSON.parse(sessionStorage.getItem("pisuProtocolScrollPositions") || "{}");

    if (saved && typeof saved === "object") {
      protocolScrollPositions = saved;
    }
  } catch {
    protocolScrollPositions = {};
  }
}

function getSavedProtocolScrollY(protocolId) {
  const savedY = protocolScrollPositions[protocolId];

  if (typeof savedY !== "number") {
    return 0;
  }

  return Math.max(savedY - 20, 0);
}

function clearProtocolScrollMemory() {
  currentProtocolPageId = "";
  protocolScrollPositions = {};

  try {
    sessionStorage.removeItem("pisuProtocolScrollPositions");
  } catch {
    // Pas bloquant.
  }
}

function clearProtocolScrollPosition(protocolId) {
  if (!protocolId) return;

  delete protocolScrollPositions[protocolId];

  try {
    sessionStorage.setItem(
      "pisuProtocolScrollPositions",
      JSON.stringify(protocolScrollPositions)
    );
  } catch {
    // Pas bloquant.
  }
}

function setAppTitle(protocolId = "") {
  const protocolTitle = protocolId ? PROTOCOL_TITLES[protocolId] : "";
  const title = protocolTitle || APP_DEFAULT_TITLE;

  if (appTitle) {
    appTitle.textContent = title;
  }

  document.title = protocolTitle
    ? `${protocolTitle} — PISU`
    : APP_DEFAULT_TITLE;
}

/* =========================================================
   MOTEUR DE SWIPE GÉNÉRIQUE V5.12
   Remplace les quatre implémentations parallèles sans modifier
   les actions ou la logique des protocoles.
   ========================================================= */

const PISU_SWIPE_PANEL_DURATION_MS = 420;
const PISU_SWIPE_MIN_DURATION_MS = 280;
const PISU_SWIPE_MAX_DURATION_MS = 900;
const PISU_SWIPE_MOTION_CLASS = "pisu-swipe-programmatic-motion";
const PISU_SWIPE_TOUCH_THRESHOLD_PX = 24;

function clampSwipeIndex(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

class PisuSwipeController {
  constructor(options) {
    this.name = options.name;
    this.track = document.querySelector(options.trackSelector);
    this.slideSelector = options.slideSelector;
    this.tabSelector = options.tabSelector || "";
    this.prev = options.prevSelector ? document.querySelector(options.prevSelector) : null;
    this.next = options.nextSelector ? document.querySelector(options.nextSelector) : null;
    this.dots = options.dotsSelector ? document.querySelector(options.dotsSelector) : null;
    this.datasetKey = options.datasetKey || "";
    this.align = options.align || "start";
    this.autoHeight = options.autoHeight !== false;
    this.storageKey = `pisuSwipeIndex:${this.name}`;
    this.tabs = this.tabSelector
      ? Array.from(document.querySelectorAll(this.tabSelector))
      : [];
    this.frame = 0;
    this.forceLayoutUpdate = false;
    this.activeIndex = -1;
    this.pendingIndex = null;
    this.settleIndex = null;
    this.motionFrame = 0;
    this.touchGesture = null;
    this.initialized = false;
    this.resizeObserver = null;
    this.mutationObserver = null;
  }

  getSlides() {
    if (!this.track) return [];
    return Array.from(this.track.querySelectorAll(this.slideSelector));
  }

  getCurrentIndex() {
    const slides = this.getSlides();
    if (!this.track || slides.length === 0) return 0;

    const trackCenter = this.track.scrollLeft + this.track.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - trackCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  getTabTarget(tab, fallbackIndex) {
    const raw = this.datasetKey ? tab?.dataset?.[this.datasetKey] : "";
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallbackIndex;
  }

  getTargetLeft(index) {
    const slide = this.getSlides()[index];
    if (!this.track || !slide) return 0;

    const trackRect = this.track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const slideLeft = slideRect.left
      - trackRect.left
      - this.track.clientLeft
      + this.track.scrollLeft;

    if (this.align === "center") {
      return slideLeft - (this.track.clientWidth - slide.offsetWidth) / 2;
    }

    return slideLeft;
  }

  getNavigationIndex() {
    if (Number.isFinite(this.pendingIndex)) return this.pendingIndex;
    if (this.activeIndex >= 0) return this.activeIndex;
    return this.getCurrentIndex();
  }

  commitActiveIndex(index, options = {}) {
    const slides = this.getSlides();
    if (slides.length === 0) return 0;

    const safeIndex = clampSwipeIndex(index, 0, slides.length - 1);
    const changed = this.activeIndex !== safeIndex;

    if (changed) {
      this.activeIndex = safeIndex;
      this.updateControls(safeIndex);
    }

    if (changed || options.forceLayout) {
      this.updateHeight(safeIndex);
    }

    return safeIndex;
  }

  cancelProgrammaticMotion() {
    if (this.motionFrame) {
      window.cancelAnimationFrame(this.motionFrame);
      this.motionFrame = 0;
    }

    this.track?.classList.remove(PISU_SWIPE_MOTION_CLASS);
  }

  getProgrammaticMotionDuration(targetLeft) {
    if (!this.track) return PISU_SWIPE_MIN_DURATION_MS;

    const panelWidth = Math.max(1, this.track.clientWidth);
    const panelDistance = Math.abs(targetLeft - this.track.scrollLeft) / panelWidth;

    return Math.min(
      PISU_SWIPE_MAX_DURATION_MS,
      Math.max(PISU_SWIPE_MIN_DURATION_MS, panelDistance * PISU_SWIPE_PANEL_DURATION_MS)
    );
  }

  animateProgrammaticMotion(targetLeft) {
    if (!this.track) return;

    const startLeft = this.track.scrollLeft;
    const distance = targetLeft - startLeft;

    if (Math.abs(distance) < 1) {
      this.track.scrollLeft = targetLeft;
      this.track.classList.remove(PISU_SWIPE_MOTION_CLASS);
      this.scheduleUpdate(true);
      return;
    }

    const duration = this.getProgrammaticMotionDuration(targetLeft);
    let startedAt = null;

    this.track.classList.add(PISU_SWIPE_MOTION_CLASS);

    const step = timestamp => {
      if (startedAt === null) startedAt = timestamp;

      const progress = Math.min(1, (timestamp - startedAt) / duration);
      this.track.scrollLeft = startLeft + distance * progress;

      if (progress < 1) {
        this.motionFrame = window.requestAnimationFrame(step);
        return;
      }

      this.motionFrame = 0;
      this.track.scrollLeft = targetLeft;
      this.track.classList.remove(PISU_SWIPE_MOTION_CLASS);
      this.scheduleUpdate(true);
    };

    this.motionFrame = window.requestAnimationFrame(step);
  }

  settleExactPosition(index) {
    const slides = this.getSlides();
    if (!this.track || slides.length === 0) return;

    const safeIndex = clampSwipeIndex(index, 0, slides.length - 1);
    const targetLeft = this.getTargetLeft(safeIndex);

    // Safari iOS peut encore laisser quelques pixels d'inertie après le snap.
    // À scrollend, l'inertie est terminée : on recale alors la piste exactement.
    this.track.classList.add(PISU_SWIPE_MOTION_CLASS);
    this.track.scrollLeft = targetLeft;
    this.track.classList.remove(PISU_SWIPE_MOTION_CLASS);

    this.pendingIndex = null;
    this.settleIndex = null;
    this.commitActiveIndex(safeIndex, { forceLayout: true });
    this.scheduleUpdate(true);
  }

  scrollTo(index, behavior = "smooth") {
    const slides = this.getSlides();
    if (!this.track || slides.length === 0) return;

    const requestedIndex = clampSwipeIndex(index, 0, slides.length - 1);
    const navigationIndex = this.getNavigationIndex();
    const steppedIndex = behavior === "smooth"
      && Math.abs(requestedIndex - navigationIndex) > 1
      ? navigationIndex + Math.sign(requestedIndex - navigationIndex)
      : requestedIndex;
    const safeIndex = clampSwipeIndex(steppedIndex, 0, slides.length - 1);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const targetLeft = this.getTargetLeft(safeIndex);

    this.cancelProgrammaticMotion();

    this.pendingIndex = safeIndex;
    this.settleIndex = safeIndex;
    this.commitActiveIndex(safeIndex, { forceLayout: true });

    if (reducedMotion || behavior !== "smooth") {
      this.track.scrollTo({ left: targetLeft, top: 0, behavior: "auto" });
    } else {
      this.animateProgrammaticMotion(targetLeft);
    }

    try {
      sessionStorage.setItem(this.storageKey, String(safeIndex));
    } catch {
      // La mémorisation est un confort non bloquant.
    }

    this.scheduleUpdate();
  }

  updateHeight(index = this.getCurrentIndex()) {
    if (!this.autoHeight || !this.track) return;

    const slide = this.getSlides()[index];
    if (!slide) return;

    const height = Math.ceil(slide.scrollHeight);
    const nextHeight = `${height}px`;

    if (height > 0 && this.track.style.height !== nextHeight) {
      this.track.style.height = nextHeight;
    }
  }

  updateControls(index = this.getCurrentIndex()) {
    const slides = this.getSlides();
    const lastIndex = Math.max(0, slides.length - 1);

    if (this.prev) this.prev.disabled = index <= 0;
    if (this.next) this.next.disabled = index >= lastIndex;

    this.tabs.forEach((tab, tabIndex) => {
      const active = this.getTabTarget(tab, tabIndex) === index;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.setAttribute("tabindex", active ? "0" : "-1");
    });

    this.dots?.querySelectorAll(".protocol-swipe-dot").forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  }

  update(options = {}) {
    if (!this.track) return;
    const rawObservedIndex = this.getCurrentIndex();
    const observedIndex = this.touchGesture
      ? clampSwipeIndex(
        rawObservedIndex,
        this.touchGesture.index - 1,
        this.touchGesture.index + 1
      )
      : rawObservedIndex;

    if (this.pendingIndex === observedIndex) {
      this.pendingIndex = null;
    }

    this.commitActiveIndex(
      Number.isFinite(this.pendingIndex) ? this.pendingIndex : observedIndex,
      { forceLayout: Boolean(options.forceLayout) }
    );
  }

  scheduleUpdate(forceLayout = false) {
    this.forceLayoutUpdate ||= forceLayout;
    if (this.frame) return;

    this.frame = window.requestAnimationFrame(() => {
      const shouldForceLayout = this.forceLayoutUpdate;
      this.frame = 0;
      this.forceLayoutUpdate = false;
      this.update({ forceLayout: shouldForceLayout });
    });
  }

  buildDots() {
    if (!this.dots) return;

    this.dots.innerHTML = "";

    this.getSlides().forEach((slide, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "protocol-swipe-dot";
      dot.setAttribute("aria-label", `Afficher le protocole ${index + 1}`);
      dot.addEventListener("click", () => this.scrollTo(index));
      this.dots.appendChild(dot);
    });
  }

  bindControls() {
    if (this.tabs.length > 0) {
      this.tabs[0].parentElement?.setAttribute("role", "tablist");

      this.tabs.forEach((tab, index) => {
        tab.setAttribute("role", "tab");
        tab.addEventListener("click", () => {
          this.scrollTo(this.getTabTarget(tab, index));
        });
      });
    }

    this.prev?.addEventListener("click", () => {
      this.scrollTo(this.getNavigationIndex() - 1);
    });

    this.next?.addEventListener("click", () => {
      this.scrollTo(this.getNavigationIndex() + 1);
    });
  }

  bindTrack() {
    if (!this.track) return;

    this.track.addEventListener("scroll", () => {
      this.scheduleUpdate();
    }, { passive: true });

    this.track.addEventListener("scrollend", () => {
      if (this.motionFrame) return;

      const finalIndex = Number.isFinite(this.settleIndex)
        ? this.settleIndex
        : this.getCurrentIndex();
      this.settleExactPosition(finalIndex);
    }, { passive: true });

    const cancelPendingNavigation = () => {
      const hadPendingNavigation = Number.isFinite(this.pendingIndex)
        || Number.isFinite(this.settleIndex)
        || Boolean(this.motionFrame);
      if (!hadPendingNavigation) return;

      this.cancelProgrammaticMotion();
      this.pendingIndex = null;
      this.settleIndex = null;
      this.scheduleUpdate();
    };

    const beginTouchGesture = event => {
      const touch = event.touches?.[0];
      if (!touch) return;

      cancelPendingNavigation();
      this.touchGesture = {
        index: this.getCurrentIndex(),
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const finishTouchGesture = event => {
      const gesture = this.touchGesture;
      const touch = event.changedTouches?.[0];
      this.touchGesture = null;

      if (!gesture || !touch) return;

      const horizontalDistance = gesture.x - touch.clientX;
      const verticalDistance = gesture.y - touch.clientY;
      const isHorizontalGesture = Math.abs(horizontalDistance) >= PISU_SWIPE_TOUCH_THRESHOLD_PX
        && Math.abs(horizontalDistance) > Math.abs(verticalDistance);
      const targetIndex = isHorizontalGesture
        ? gesture.index + Math.sign(horizontalDistance)
        : gesture.index;

      this.scrollTo(targetIndex);
    };

    const cancelTouchGesture = () => {
      const gesture = this.touchGesture;
      this.touchGesture = null;
      if (gesture) this.scrollTo(gesture.index);
    };

    this.track.addEventListener("pointerdown", cancelPendingNavigation, { passive: true });
    this.track.addEventListener("touchstart", beginTouchGesture, { passive: true });
    this.track.addEventListener("touchend", finishTouchGesture, { passive: true });
    this.track.addEventListener("touchcancel", cancelTouchGesture, { passive: true });
    this.track.addEventListener("wheel", cancelPendingNavigation, { passive: true });

    this.track.addEventListener("keydown", event => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        this.scrollTo(this.getNavigationIndex() + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        this.scrollTo(this.getNavigationIndex() - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        this.scrollTo(0, "auto");
      } else if (event.key === "End") {
        event.preventDefault();
        this.scrollTo(this.getSlides().length - 1, "auto");
      }
    });
  }

  bindObservers() {
    if (window.ResizeObserver && this.track) {
      this.resizeObserver = new ResizeObserver(() => this.scheduleUpdate(true));
      this.resizeObserver.observe(this.track);
      this.getSlides().forEach(slide => this.resizeObserver.observe(slide));
    }

    if (window.MutationObserver && this.track) {
      this.mutationObserver = new MutationObserver(() => {
        this.getSlides().forEach(slide => this.resizeObserver?.observe(slide));
        this.scheduleUpdate(true);
      });

      this.mutationObserver.observe(this.track, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "open", "hidden", "style", "aria-expanded"]
      });
    }
  }

  restorePosition() {
    let savedIndex = 0;

    try {
      savedIndex = Number(sessionStorage.getItem(this.storageKey) || 0);
    } catch {
      savedIndex = 0;
    }

    if (Number.isFinite(savedIndex) && savedIndex > 0) {
      this.scrollTo(savedIndex, "auto");
    } else {
      this.update();
    }
  }

  init() {
    if (!this.track || this.initialized) return this;

    this.initialized = true;
    this.buildDots();
    this.bindControls();
    this.bindTrack();
    this.bindObservers();
    this.restorePosition();

    return this;
  }
}

const pisuSwipeControllers = {};

function getPisuSwipeController(name) {
  if (pisuSwipeControllers[name]) return pisuSwipeControllers[name];

  const configs = {
    protocol: {
      name: "protocol",
      trackSelector: "#protocolSwipeTrack",
      slideSelector: "[data-open-protocol]",
      prevSelector: "#protocolSwipePrev",
      nextSelector: "#protocolSwipeNext",
      dotsSelector: "#protocolSwipeDots",
      align: "center",
      autoHeight: false
    },
    team: {
      name: "team",
      trackSelector: "#teamSwipeTrack",
      slideSelector: "[data-team-slide]",
      tabSelector: "[data-team-slide-target]",
      prevSelector: "#teamSwipePrev",
      nextSelector: "#teamSwipeNext",
      datasetKey: "teamSlideTarget"
    },
    route: {
      name: "route",
      trackSelector: "#routeSwipeTrack",
      slideSelector: "[data-route-slide]",
      tabSelector: "[data-route-slide-target]",
      prevSelector: "#routeSwipePrev",
      nextSelector: "#routeSwipeNext",
      datasetKey: "routeSlideTarget"
    },
    identity: {
      name: "identity",
      trackSelector: "#identitySwipeTrack",
      slideSelector: "[data-identity-slide]",
      tabSelector: "[data-identity-slide-target]",
      prevSelector: "#identitySwipePrev",
      nextSelector: "#identitySwipeNext",
      datasetKey: "identitySlideTarget"
    }
  };

  const config = configs[name];
  if (!config) return null;

  pisuSwipeControllers[name] = new PisuSwipeController(config);
  return pisuSwipeControllers[name];
}

function refreshAllPisuSwipes() {
  Object.values(pisuSwipeControllers).forEach(controller => controller?.update());
}

function getProtocolSwipeCards() {
  return getPisuSwipeController("protocol")?.getSlides() || [];
}

function getCurrentProtocolSwipeIndex() {
  return getPisuSwipeController("protocol")?.getCurrentIndex() || 0;
}

function scrollToProtocolSwipeIndex(index) {
  getPisuSwipeController("protocol")?.scrollTo(index);
}

function updateProtocolSwipeUi() {
  getPisuSwipeController("protocol")?.update();
}

function setupProtocolSwipeMenu() {
  getPisuSwipeController("protocol")?.init();
}

function getTeamSwipeSlides() {
  return getPisuSwipeController("team")?.getSlides() || [];
}

function getCurrentTeamSwipeIndex() {
  return getPisuSwipeController("team")?.getCurrentIndex() || 0;
}

function scrollToTeamSlide(index, behavior = "smooth") {
  getPisuSwipeController("team")?.scrollTo(index, behavior);
}

function updateTeamSwipeHeight() {
  getPisuSwipeController("team")?.updateHeight();
}

function updateTeamSwipeUi() {
  getPisuSwipeController("team")?.update();
}

function setupTeamSwipeFeature() {
  getPisuSwipeController("team")?.init();
}

function getRouteSwipeSlides() {
  return getPisuSwipeController("route")?.getSlides() || [];
}

function getCurrentRouteSwipeIndex() {
  return getPisuSwipeController("route")?.getCurrentIndex() || 0;
}

function scrollToRouteSlide(index, behavior = "smooth") {
  getPisuSwipeController("route")?.scrollTo(index, behavior);
}

function updateRouteSwipeHeight() {
  getPisuSwipeController("route")?.updateHeight();
}

function updateRouteSwipeUi() {
  getPisuSwipeController("route")?.update();
}

function setupRouteSwipeFeature() {
  getPisuSwipeController("route")?.init();
}

function getIdentitySwipeSlides() {
  return getPisuSwipeController("identity")?.getSlides() || [];
}

function getCurrentIdentitySwipeIndex() {
  return getPisuSwipeController("identity")?.getCurrentIndex() || 0;
}

function scrollToIdentitySlide(index, behavior = "smooth") {
  getPisuSwipeController("identity")?.scrollTo(index, behavior);
}

function updateIdentitySwipeHeight() {
  getPisuSwipeController("identity")?.updateHeight();
}

function updateIdentitySwipeUi() {
  getPisuSwipeController("identity")?.update();
}

function setupIdentitySwipeFeature() {
  getPisuSwipeController("identity")?.init();
}

function setupIdentityNotesHeightRefresh() {
  [patientNoteInput, patientAntecedentsNoteInput].forEach(field => {
    field?.addEventListener("input", updateIdentitySwipeUi);
  });
}

function getPatientSwipeSlides() {
  return getIdentitySwipeSlides();
}

function getCurrentPatientSwipeIndex() {
  return getCurrentIdentitySwipeIndex();
}

function scrollToPatientSlide(index, behavior = "smooth") {
  scrollToIdentitySlide(index, behavior);
}

function updatePatientSwipeUi() {
  updateIdentitySwipeUi();
}

function setupPatientSwipeFeature() {
  setupIdentitySwipeFeature();
}

function setupProtocolOpeners() {
  document.addEventListener("click", event => {
    const opener = event.target.closest("[data-open-protocol]");

    if (!opener) return;

    const protocolId = opener.dataset.openProtocol;

    if (!protocolId) return;

    const protocolTitle =
      PROTOCOL_TITLES?.[protocolId] ||
      getProtocolLabel?.(protocolId) ||
      protocolId;

    if (currentProtocolPageId !== protocolId || !document.body.classList.contains("protocol-mode")) {
      showProtocolPage(protocolId);
    }

    if (typeof addLog === "function") {
      addLog(`Sélection protocole PISU : ${protocolTitle}`, {
        protocole: protocolTitle,
        categorie: "navigation",
        sousCategorie: "selection_protocole",
        libelleCourt: `Sélection protocole : ${protocolTitle}`,
        sectionSAED: "journal",
        priorite: "basse",
        visibleSAED: false,
        visibleChrono: false,
        visibleJournal: true
      });
    }
  });
}

function showMainMenu() {
  saveCurrentProtocolScrollPosition();

  getProtocolPages().forEach(section => {
    section.classList.add("hidden");
  });

  getMainPageSections().forEach(section => {
    section.classList.remove("hidden");
  });

  setAppTitle("");

  document.body.classList.remove("protocol-mode");
  floatingBackMenuBtn?.classList.add("hidden");

  window.requestAnimationFrame(() => {
    window.scrollTo(0, Math.max(mainMenuScrollY - 20, 0));

    if (!lastSelectedProtocolId) return;

    const card = document.querySelector(`[data-open-protocol="${lastSelectedProtocolId}"]`);

    card?.scrollIntoView({
      behavior: "auto",
      inline: "center",
      block: "nearest"
    });

    updateProtocolSwipeUi?.();
  });

  window.requestAnimationFrame(applyCall15AlertDisplay);
}

function showProtocolPage(protocolId) {
  lastSelectedProtocolId = protocolId;

  if (!document.body.classList.contains("protocol-mode")) {
    mainMenuScrollY = window.scrollY || window.pageYOffset || 0;
  } else {
    saveCurrentProtocolScrollPosition();
  }

  const targetProtocol = document.getElementById(protocolId);

  if (!targetProtocol) return;

  getMainPageSections().forEach(section => {
    section.classList.add("hidden");
  });

  getProtocolPages().forEach(section => {
    section.classList.add("hidden");
  });

  targetProtocol.classList.remove("hidden");

  currentProtocolPageId = protocolId;
  touchMissionState({ activeProtocolId: protocolId });

  setAppTitle(protocolId);

  document.body.classList.add("protocol-mode");
  floatingBackMenuBtn?.classList.remove("hidden");

  const savedProtocolY = getSavedProtocolScrollY(protocolId);

  window.requestAnimationFrame(() => {
    window.scrollTo(0, savedProtocolY);
  });

  window.requestAnimationFrame(applyCall15AlertDisplay);
}

window.showMainMenu = showMainMenu;
window.showProtocolPage = showProtocolPage;

floatingBackMenuBtn?.addEventListener("click", showMainMenu);

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
  setButtonValidatedPersistent(saveResponderBtn, true, "Intervenant enregistré ✓");
  updateTeamSummary?.();
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
  const ageValue = getPatientRollerValue?.(patientAgeInput) || "";
  const ageUnit = patientAgeUnitInput?.value || "years";
  const weightValue = getPatientRollerValue?.(patientWeightInput) || "";

  return {
    name: patientNameInput?.value?.trim() || "",
    birthDate: formatPatientBirthDate(),
    birthDateIso: formatPatientBirthDateIso(),
    age: formatPatientAge(),
    ageValue,
    ageUnit,
    sex: patientSexInput?.value || "",
    category: getPatientCategory(),
    categoryLabel: getPatientCategoryLabel?.(getPatientCategory()) || "",
    weight: weightValue,
    note: patientNoteInput?.value?.trim() || ""
  };
}

function inferAgeUnitFromText(ageText) {
  const normalized = String(ageText || "").toLowerCase();

  if (normalized.includes("mois")) return "months";

  return "years";
}

function inferAgeValueFromText(ageText) {
  const match = String(ageText || "").match(/(\d+(?:[.,]\d+)?)/);

  return match ? match[1].replace(",", ".") : "";
}

function parsePatientBirthDate(value) {
  const text = String(value || "").trim();

  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return {
      year: isoMatch[1],
      month: String(Number(isoMatch[2])),
      day: String(Number(isoMatch[3]))
    };
  }

  const frMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (frMatch) {
    return {
      day: String(Number(frMatch[1])),
      month: String(Number(frMatch[2])),
      year: frMatch[3]
    };
  }

  return null;
}

function applyPatientBirthDateSnapshot(patient = {}) {
  const birthParts = parsePatientBirthDate(patient.birthDateIso || patient.birthDate);

  populatePatientBirthDateRollers();

  if (!birthParts) {
    if (patientBirthDayInput) patientBirthDayInput.value = "";
    if (patientBirthMonthInput) patientBirthMonthInput.value = "";
    if (patientBirthYearInput) patientBirthYearInput.value = "";
    updatePatientBirthDateSummary();
    return;
  }

  if (patientBirthYearInput) patientBirthYearInput.value = birthParts.year;
  if (patientBirthMonthInput) patientBirthMonthInput.value = birthParts.month;

  populatePatientBirthDaySelect();

  if (patientBirthDayInput) patientBirthDayInput.value = birthParts.day;

  updatePatientBirthDateSummary();
}

function applyPatientSnapshot(patient = {}, options = {}) {
  if (patientNameInput) patientNameInput.value = patient.name || "";
  if (patientSexInput) patientSexInput.value = patient.sex || "";
  if (patientCategoryInput) patientCategoryInput.value = patient.category || "";
  if (patientNoteInput) patientNoteInput.value = patient.note || "";

  const ageUnit = patient.ageUnit || inferAgeUnitFromText(patient.age);

  if (patientAgeUnitInput) {
    patientAgeUnitInput.value = ageUnit;
  }

  populatePatientAgeSelect();

  const ageValue = patient.ageValue || inferAgeValueFromText(patient.age);

  if (patientAgeInput) {
    if (ageValue) {
      patientAgeInput.value = ageValue;
      patientAgeInput.dataset.patientTouched = "true";
    } else {
      resetPatientRoller(patientAgeInput);
    }
  }

  populatePatientWeightSelect();

  if (patientWeightInput) {
    if (patient.weight) {
      patientWeightInput.value = String(patient.weight).replace(/[^\d.,]/g, "").replace(",", ".");
      patientWeightInput.dataset.patientTouched = "true";
    } else {
      resetPatientRoller(patientWeightInput);
    }
  }

  applyPatientBirthDateSnapshot(patient);
  updatePatientIdentitySummary?.();

  if (!options.skipSave && typeof savePatientIdentity === "function") {
    savePatientIdentity({ silent: true });
  }
}

const MISSION_ROUTE_DATA_VERSION = 2;
const MISSION_ROUTE_TIMELINE_CATEGORY = "parcours_mission";
const MISSION_ROUTE_TIMELINE_DEFINITIONS = {
  departure: {
    timeKey: "departureTime",
    isoKey: "departureAt",
    label: "Départ du lieu d’intervention"
  },
  junction: {
    timeKey: "junctionTime",
    isoKey: "junctionAt",
    label: "Jonction réalisée"
  },
  arrival: {
    timeKey: "arrivalTime",
    isoKey: "arrivalAt",
    label: "Arrivée à destination"
  },
  transmission: {
    timeKey: "transmissionTime",
    isoKey: "transmissionAt",
    label: "Transmission à l’équipe receveuse réalisée"
  }
};

let missionRouteMetadata = {
  departureAt: "",
  junctionAt: "",
  arrivalAt: "",
  transmissionAt: "",
  transmissionTime: "",
  originLabel: "",
  originCoordinates: "",
  originAccuracy: "",
  originCapturedAt: "",
  originSource: ""
};

function mountMissionRouteAfterProtocols() {
  if (!missionRoutePanel || !missionRouteDetails) return;
  if (missionRouteDetails.parentElement === missionRoutePanel) return;

  missionRoutePanel.append(missionRouteDetails);
}

function getRouteValue(input) {
  return input?.value?.trim() || "";
}

function setRouteValue(input, value) {
  if (input) {
    input.value = value || "";
  }
}

function setRouteChecked(input, value) {
  if (input) {
    input.checked = Boolean(value);
  }
}

function getCurrentTimeValue(date = new Date()) {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function isValidRouteIso(value) {
  return Boolean(value && Number.isFinite(Date.parse(value)));
}

function createRouteIsoFromTime(time, referenceIso = "") {
  if (!/^\d{2}:\d{2}$/.test(String(time || ""))) return "";

  const reference = isValidRouteIso(referenceIso)
    ? new Date(referenceIso)
    : isValidRouteIso(getMissionState()?.startedAt)
      ? new Date(getMissionState().startedAt)
      : new Date();
  const [hours, minutes] = time.split(":").map(Number);
  const timestamp = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
    hours,
    minutes,
    0,
    0
  );

  if (isValidRouteIso(referenceIso) && timestamp.getTime() < reference.getTime() - (6 * 60 * 60 * 1000)) {
    timestamp.setDate(timestamp.getDate() + 1);
  }

  return timestamp.toISOString();
}

function normalizeMissionRouteSnapshot(route = {}) {
  const normalized = {
    ...route,
    version: MISSION_ROUTE_DATA_VERSION,
    departureTime: String(route.departureTime || "").slice(0, 5),
    junctionTime: String(route.junctionTime || "").slice(0, 5),
    arrivalTime: String(route.arrivalTime || "").slice(0, 5),
    transmissionTime: String(route.transmissionTime || "").slice(0, 5),
    departureAt: isValidRouteIso(route.departureAt) ? route.departureAt : "",
    junctionAt: isValidRouteIso(route.junctionAt) ? route.junctionAt : "",
    arrivalAt: isValidRouteIso(route.arrivalAt) ? route.arrivalAt : "",
    transmissionAt: isValidRouteIso(route.transmissionAt) ? route.transmissionAt : "",
    originLabel: String(route.originLabel || "").trim(),
    originCoordinates: String(route.originCoordinates || "").trim(),
    originAccuracy: String(route.originAccuracy || "").trim(),
    originCapturedAt: isValidRouteIso(route.originCapturedAt) ? route.originCapturedAt : "",
    originSource: String(route.originSource || "").trim(),
    transportStatus: String(route.transportStatus || "").trim()
  };

  if (normalized.departureTime && !normalized.departureAt) {
    normalized.departureAt = createRouteIsoFromTime(normalized.departureTime);
  }

  if (normalized.junctionTime && !normalized.junctionAt) {
    normalized.junctionAt = createRouteIsoFromTime(
      normalized.junctionTime,
      normalized.departureAt
    );
  }

  if (normalized.arrivalTime && !normalized.arrivalAt) {
    normalized.arrivalAt = createRouteIsoFromTime(
      normalized.arrivalTime,
      normalized.junctionAt || normalized.departureAt
    );
  }

  if (normalized.transmissionDone && !normalized.transmissionAt) {
    normalized.transmissionAt = normalized.arrivalAt || createRouteIsoFromTime(
      normalized.transmissionTime || normalized.arrivalTime || getCurrentTimeValue(),
      normalized.arrivalAt || normalized.junctionAt || normalized.departureAt
    );
  }

  if (normalized.transmissionAt && !normalized.transmissionTime) {
    normalized.transmissionTime = getCurrentTimeValue(new Date(normalized.transmissionAt));
  }

  return normalized;
}

function getMissionRouteSnapshot() {
  return normalizeMissionRouteSnapshot({
    version: MISSION_ROUTE_DATA_VERSION,
    departureTime: getRouteValue(routeDepartureTimeInput),
    departureAt: missionRouteMetadata.departureAt,
    destinationName: getRouteValue(routeDestinationNameInput),
    destinationService: getRouteValue(routeDestinationServiceInput),
    transportStatus: getRouteValue(routeTransportStatusInput),
    transportType: getRouteValue(routeTransportTypeInput),
    transportVector: getRouteValue(routeTransportVectorInput),
    transportMode: getRouteValue(routeTransportModeInput),
    transportMonitoring: getRouteValue(routeTransportMonitoringInput),
    transportTeam: getRouteValue(routeTransportTeamInput),
    junctionEnabled: Boolean(routeJunctionEnabledInput?.checked),
    junctionTime: getRouteValue(routeJunctionTimeInput),
    junctionAt: missionRouteMetadata.junctionAt,
    junctionPlace: getRouteValue(routeJunctionPlaceInput),
    junctionWith: getRouteValue(routeJunctionWithInput),
    arrivalTime: getRouteValue(routeArrivalTimeInput),
    arrivalAt: missionRouteMetadata.arrivalAt,
    transmissionDone: Boolean(routeTransmissionDoneInput?.checked),
    transmissionTime: missionRouteMetadata.transmissionTime,
    transmissionAt: missionRouteMetadata.transmissionAt,
    originLabel: missionRouteMetadata.originLabel,
    originCoordinates: missionRouteMetadata.originCoordinates,
    originAccuracy: missionRouteMetadata.originAccuracy,
    originCapturedAt: missionRouteMetadata.originCapturedAt,
    originSource: missionRouteMetadata.originSource,
    note: getRouteValue(routeTransportNoteInput)
  });
}

function hasMissionRouteData(route = getMissionRouteSnapshot()) {
  return Boolean(
    route.originLabel ||
    route.originCoordinates ||
    route.departureTime ||
    route.destinationName ||
    route.destinationService ||
    route.transportStatus ||
    route.transportType ||
    route.transportVector ||
    route.transportMode ||
    route.transportMonitoring ||
    route.transportTeam ||
    route.junctionEnabled ||
    route.junctionTime ||
    route.junctionPlace ||
    route.junctionWith ||
    route.arrivalTime ||
    route.transmissionDone ||
    route.note
  );
}

function saveMissionRoute(options = {}) {
  const route = getMissionRouteSnapshot();

  localStorage.setItem(MISSION_ROUTE_STORAGE_KEY, JSON.stringify(route));
  updateMissionRouteUi(route);

  if (options.log) {
    addMissionRouteLog(options.logLabel || "Parcours mission mis à jour");
    markButtonValidated(saveMissionRouteBtn, "Parcours enregistré ✓");
  }

  if (handoffCode?.value) {
    resetMissionHandoffUi?.();
  }

  return route;
}

function recoverMissionRouteOriginFromLog(route = {}) {
  if (route.originLabel || route.originCoordinates) return route;

  const gpsPattern = /^GPS (?:Arrivée sur les lieux|Lieu de prise en charge) : (?:(?:Adresse : (.*?) - )|(?:adresse indisponible - ))?(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?) - precision \+\/-([0-9]+) m/i;
  const item = [...getLog()].reverse().find(entry => gpsPattern.test(String(entry?.text || "")));

  if (!item) return route;

  const match = String(item.text || "").match(gpsPattern);
  if (!match) return route;

  return {
    ...route,
    originLabel: String(match[1] || "Position GPS").trim(),
    originCoordinates: `${match[2]}, ${match[3]}`,
    originAccuracy: match[4] || "",
    originCapturedAt: createRouteIsoFromTime(String(item.time || "").slice(0, 5)),
    originSource: "Arrivée sur les lieux (journal existant)"
  };
}

function loadMissionRoute() {
  try {
    const storedRoute = JSON.parse(localStorage.getItem(MISSION_ROUTE_STORAGE_KEY) || "{}");
    const route = recoverMissionRouteOriginFromLog(normalizeMissionRouteSnapshot(storedRoute));
    applyMissionRouteSnapshot(route, { skipSave: false });
    syncMissionRouteTimelineEvents(route);
  } catch {
    localStorage.removeItem(MISSION_ROUTE_STORAGE_KEY);
    applyMissionRouteSnapshot({}, { skipSave: true });
  }
}

function applyMissionRouteSnapshot(route = {}, options = {}) {
  const normalized = normalizeMissionRouteSnapshot(route);

  missionRouteMetadata = {
    departureAt: normalized.departureAt,
    junctionAt: normalized.junctionAt,
    arrivalAt: normalized.arrivalAt,
    transmissionAt: normalized.transmissionAt,
    transmissionTime: normalized.transmissionTime,
    originLabel: normalized.originLabel,
    originCoordinates: normalized.originCoordinates,
    originAccuracy: normalized.originAccuracy,
    originCapturedAt: normalized.originCapturedAt,
    originSource: normalized.originSource
  };

  setRouteValue(routeDepartureTimeInput, normalized.departureTime);
  setRouteValue(routeDestinationNameInput, normalized.destinationName);
  setRouteValue(routeDestinationServiceInput, normalized.destinationService);
  setRouteValue(routeTransportStatusInput, normalized.transportStatus);
  setRouteValue(routeTransportTypeInput, normalized.transportType);
  setRouteValue(routeTransportVectorInput, normalized.transportVector);
  setRouteValue(routeTransportModeInput, normalized.transportMode);
  setRouteValue(routeTransportMonitoringInput, normalized.transportMonitoring);
  setRouteValue(routeTransportTeamInput, normalized.transportTeam);
  setRouteChecked(routeJunctionEnabledInput, normalized.junctionEnabled);
  setRouteValue(routeJunctionTimeInput, normalized.junctionTime);
  setRouteValue(routeJunctionPlaceInput, normalized.junctionPlace);
  setRouteValue(routeJunctionWithInput, normalized.junctionWith);
  setRouteValue(routeArrivalTimeInput, normalized.arrivalTime);
  setRouteChecked(routeTransmissionDoneInput, normalized.transmissionDone);
  setRouteValue(routeTransportNoteInput, normalized.note);

  if (!options.skipSave) {
    localStorage.setItem(MISSION_ROUTE_STORAGE_KEY, JSON.stringify(getMissionRouteSnapshot()));
  }

  updateMissionRouteUi();
}

function resetMissionRoute() {
  localStorage.removeItem(MISSION_ROUTE_STORAGE_KEY);
  applyMissionRouteSnapshot({}, { skipSave: true });
  removeMissionRouteTimelineEvents();
}

function updateMissionRouteUi(route = getMissionRouteSnapshot()) {
  updateMissionRouteSummary(route);
  updateMissionRouteCards(route);
  updateMissionRouteJunctionState(route);
  updateMissionRouteChoiceGroups(route);
  updateMissionRouteOrigin(route);
  updateMissionRouteMilestones(route);
  updateMissionRouteCrewReuse();
}

function updateMissionRouteSummary(route = getMissionRouteSnapshot()) {
  if (!missionRouteSummary) return;

  if (!hasMissionRouteData(route)) {
    missionRouteSummary.textContent = "Suite de mission à organiser.";
    return;
  }

  const parts = [];

  if (route.transportStatus) parts.push(route.transportStatus);
  if (route.transportVector) parts.push(route.transportVector);
  if (route.destinationName) {
    parts.push([route.destinationName, route.destinationService].filter(Boolean).join(" — "));
  } else if (route.destinationService) {
    parts.push(route.destinationService);
  }
  if (route.departureTime && parts.length < 3) parts.push(`Départ ${route.departureTime}`);
  if (route.arrivalTime) parts.push(`Arrivée ${route.arrivalTime}`);

  missionRouteSummary.textContent = parts.slice(0, 3).join(" · ") || "Parcours mission en cours.";
}

function updateMissionRouteCards(route = getMissionRouteSnapshot()) {
  routeOriginCard?.classList.toggle(
    "complete",
    Boolean(route.originLabel || route.originCoordinates)
  );

  routeDepartureCard?.classList.toggle("complete", Boolean(route.departureTime));

  routeDestinationCard?.classList.toggle(
    "complete",
    Boolean(route.destinationName || route.destinationService)
  );

  routeTransportCard?.classList.toggle(
    "complete",
    Boolean(route.transportStatus || route.transportType || route.transportVector || route.transportMode || route.transportMonitoring)
  );

  routeJunctionCard?.classList.toggle(
    "complete",
    Boolean(route.junctionEnabled && (route.junctionTime || route.junctionPlace || route.junctionWith))
  );

  routeArrivalCard?.classList.toggle(
    "complete",
    Boolean(route.arrivalTime || route.transmissionDone)
  );
}

function updateMissionRouteChoiceGroups(route = getMissionRouteSnapshot()) {
  const values = {
    transportStatus: route.transportStatus || "",
    transportVector: route.transportVector || "",
    transportMode: route.transportMode || ""
  };

  document.querySelectorAll("[data-route-choice-group]").forEach(group => {
    const selectedValue = values[group.dataset.routeChoiceGroup] || "";

    group.querySelectorAll("[data-route-choice]").forEach(button => {
      const selected = button.dataset.routeChoice === selectedValue;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  });
}

function updateMissionRouteOrigin(route = getMissionRouteSnapshot()) {
  if (routeOriginSummary) {
    routeOriginSummary.textContent = route.originLabel || (
      route.originCoordinates ? "Position GPS" : "Position non mémorisée"
    );
  }

  if (routeOriginCoordinates) {
    if (route.originCoordinates) {
      const accuracy = route.originAccuracy ? ` · ±${route.originAccuracy} m` : "";
      routeOriginCoordinates.textContent = `${route.originCoordinates}${accuracy}`;
    } else {
      routeOriginCoordinates.textContent = "Le GPS « Arrivée sur les lieux » sera réutilisé ici.";
    }
  }

  if (routeCaptureLocationBtn) {
    routeCaptureLocationBtn.textContent = route.originCoordinates ? "Actualiser" : "Localiser";
  }
}

function setRouteTimeDisplay(element, label, time, iso) {
  if (!element) return;

  element.textContent = time ? `${label} ${time}` : "Non horodaté";

  if (isValidRouteIso(iso)) {
    element.setAttribute("datetime", iso);
  } else {
    element.removeAttribute("datetime");
  }
}

function updateMissionRouteMilestones(route = getMissionRouteSnapshot()) {
  setRouteTimeDisplay(
    routeDepartureDisplay,
    "Départ",
    route.departureTime,
    route.departureAt
  );
  setRouteTimeDisplay(
    routeArrivalDisplay,
    "Arrivée",
    route.arrivalTime,
    route.arrivalAt
  );
}

function updateMissionRouteCrewReuse() {
  if (!routeCrewReuseSummary) return;

  const crew = typeof getMissionCrew === "function" ? getMissionCrew() : [];

  if (!Array.isArray(crew) || crew.length === 0) {
    routeCrewReuseSummary.textContent = "L’équipage mission sera réutilisé automatiquement.";
    return;
  }

  const labels = crew.map(member => [member.missionRole, member.name]
    .filter(Boolean)
    .join(" — "))
    .filter(Boolean);

  routeCrewReuseSummary.textContent = labels.length > 0
    ? `Équipage réutilisé : ${labels.join(" · ")}`
    : `${crew.length} membre(s) d’équipage réutilisé(s).`;
}

function updateMissionRouteJunctionState(route = getMissionRouteSnapshot()) {
  const enabled = Boolean(route.junctionEnabled);

  routeJunctionCard?.classList.toggle("junction-enabled", enabled);

  [
    routeJunctionTimeInput,
    routeJunctionPlaceInput,
    routeJunctionWithInput
  ].forEach(input => {
    if (!input) return;
    input.disabled = !enabled;
  });
}

function getMissionRouteLines(route = getMissionRouteSnapshot()) {
  const lines = [];

  if (!hasMissionRouteData(route)) {
    return ["Parcours / transport non renseigné."];
  }

  if (route.originLabel || route.originCoordinates) {
    const origin = [route.originLabel, route.originCoordinates]
      .filter(Boolean)
      .join(" — ");
    lines.push(`Lieu de prise en charge : ${origin}`);
  }

  if (route.departureTime) {
    lines.push(`Départ des lieux : ${route.departureTime}`);
  }

  const destination = [
    route.destinationName,
    route.destinationService
  ].filter(Boolean).join(" — ");

  if (destination) {
    lines.push(`Destination : ${destination}`);
  }

  const transport = [
    route.transportStatus ? `Situation : ${route.transportStatus}` : "",
    route.transportType ? `Type : ${route.transportType}` : "",
    route.transportVector ? `Vecteur : ${route.transportVector}` : "",
    route.transportMode ? `Modalité : ${route.transportMode}` : "",
    route.transportMonitoring ? `Surveillance : ${route.transportMonitoring}` : "",
    route.transportTeam ? `Ancienne saisie équipe : ${route.transportTeam}` : ""
  ].filter(Boolean).join(" — ");

  if (transport) {
    lines.push(`Transport : ${transport}`);
  }

  if (route.junctionEnabled) {
    const junction = [
      route.junctionTime ? `heure ${route.junctionTime}` : "",
      route.junctionPlace ? `lieu ${route.junctionPlace}` : "",
      route.junctionWith ? `avec ${route.junctionWith}` : ""
    ].filter(Boolean).join(" — ");

    lines.push(`Jonction : ${junction || "Oui, détails à compléter"}`);
  }

  if (route.arrivalTime) {
    lines.push(`Arrivée destination : ${route.arrivalTime}`);
  }

  if (route.transmissionDone) {
    lines.push(`Transmission arrivée : réalisée${route.transmissionTime ? ` à ${route.transmissionTime}` : ""}.`);
  }

  if (route.note) {
    lines.push(`Note transport : ${route.note}`);
  }

  return lines;
}

function getMissionRouteSAEDLines(route = getMissionRouteSnapshot()) {
  if (!hasMissionRouteData(route)) {
    return ["Devenir / transport à préciser."];
  }

  const lines = [];
  const origin = [
    route.originLabel,
    route.originCoordinates
  ].filter(Boolean).join(" — ");

  if (origin) {
    lines.push(`Lieu de prise en charge : ${origin}.`);
  }

  const destination = [
    route.destinationName,
    route.destinationService
  ].filter(Boolean).join(" — ");

  if (destination) {
    lines.push(`Destination prévue ou réalisée : ${destination}.`);
  }

  const transport = [
    route.transportStatus,
    route.transportType,
    route.transportVector,
    route.transportMode,
    route.transportMonitoring
  ].filter(Boolean).join(" — ");

  if (transport) {
    lines.push(`Transport : ${transport}.`);
  }

  if (route.departureTime) {
    lines.push(`Départ des lieux à ${route.departureTime}.`);
  }

  if (route.junctionEnabled) {
    const junctionDetails = [
      route.junctionTime ? `à ${route.junctionTime}` : "",
      route.junctionPlace ? `lieu : ${route.junctionPlace}` : "",
      route.junctionWith ? `avec ${route.junctionWith}` : ""
    ].filter(Boolean).join(" — ");

    lines.push(`Jonction ${junctionDetails || "réalisée ou prévue"}.`);
  }

  if (route.arrivalTime) {
    lines.push(`Arrivée à destination à ${route.arrivalTime}.`);
  }

  if (route.transmissionDone) {
    lines.push(`Transmission réalisée à l’équipe receveuse${route.transmissionTime ? ` à ${route.transmissionTime}` : ""}.`);
  }

  return lines.length > 0 ? lines : ["Devenir / transport à préciser."];
}

function addMissionRouteLog(label) {
  const route = getMissionRouteSnapshot();
  const summary = getMissionRouteLines(route).join(" | ");

  if (typeof addLog === "function") {
    addLog(`Parcours / Transport : ${label} — ${summary}`, {
      protocole: "Mission PISU",
      categorie: "transport",
      sousCategorie: "parcours",
      libelleCourt: label,
      libelleLong: summary,
      phraseSAED: "",
      sectionSAED: "D",
      priorite: "moyenne",
      type: "transport",
      visibleSynthese: true,
      visibleSAED: false,
      visibleChrono: false,
      visibleJournal: true
    });
  }
}

function removeMissionRouteTimelineEvents(kind = "") {
  const events = getStructuredEvents();
  const filtered = events.filter(event => {
    if (event?.sousCategorie !== MISSION_ROUTE_TIMELINE_CATEGORY) return true;
    return kind && event.routeEventKey !== kind;
  });

  if (filtered.length !== events.length) {
    saveStructuredEvents(filtered);
    window.pisuSAED?.refreshIfOpen?.();
  }
}

function upsertMissionRouteTimelineEvent(kind, route = getMissionRouteSnapshot()) {
  const definition = MISSION_ROUTE_TIMELINE_DEFINITIONS[kind];
  if (!definition) return null;

  const iso = route[definition.isoKey];
  const time = route[definition.timeKey];

  if (!isValidRouteIso(iso) || !time) {
    removeMissionRouteTimelineEvents(kind);
    return null;
  }

  const events = getStructuredEvents();
  const existing = events.find(event => (
    event?.sousCategorie === MISSION_ROUTE_TIMELINE_CATEGORY &&
    event?.routeEventKey === kind
  ));
  const nextEvent = {
    id: existing?.id || createStructuredEventId(),
    iso,
    heure: `${time}:00`,
    version: "saed-v2",
    protocole: "Mission PISU",
    protocolId: "",
    action: `route_${kind}`,
    sectionSAED: "D",
    categorie: "transport",
    sousCategorie: MISSION_ROUTE_TIMELINE_CATEGORY,
    routeEventKey: kind,
    priorite: "moyenne",
    statut: "realise",
    type: "transport",
    libelleCourt: definition.label,
    libelleLong: `${definition.label} à ${time}`,
    phraseSAED: "",
    visibleSynthese: true,
    visibleSAED: false,
    visibleChrono: true,
    visibleJournal: false
  };
  const nextEvents = existing
    ? events.map(event => event.id === existing.id ? nextEvent : event)
    : [...events, nextEvent];

  saveStructuredEvents(nextEvents);
  window.pisuSAED?.refreshIfOpen?.();
  return nextEvent;
}

function syncMissionRouteTimelineEvents(route = getMissionRouteSnapshot()) {
  Object.keys(MISSION_ROUTE_TIMELINE_DEFINITIONS).forEach(kind => {
    upsertMissionRouteTimelineEvent(kind, route);
  });
}

function getRouteTimestampReference(kind, route = getMissionRouteSnapshot()) {
  if (kind === "junction") return route.departureAt;
  if (kind === "arrival") return route.junctionAt || route.departureAt;
  if (kind === "transmission") return route.arrivalAt || route.junctionAt || route.departureAt;
  return getMissionState()?.startedAt || "";
}

function syncMissionRouteTimestampFromInput(kind) {
  const definition = MISSION_ROUTE_TIMELINE_DEFINITIONS[kind];
  if (!definition || kind === "transmission") return;

  const input = kind === "departure"
    ? routeDepartureTimeInput
    : kind === "junction"
      ? routeJunctionTimeInput
      : routeArrivalTimeInput;
  const value = getRouteValue(input);

  if (!value) {
    missionRouteMetadata[definition.isoKey] = "";
    removeMissionRouteTimelineEvents(kind);
    return;
  }

  const currentIso = missionRouteMetadata[definition.isoKey];
  const currentTime = isValidRouteIso(currentIso)
    ? getCurrentTimeValue(new Date(currentIso))
    : "";

  if (currentTime !== value) {
    missionRouteMetadata[definition.isoKey] = createRouteIsoFromTime(
      value,
      getRouteTimestampReference(kind)
    );
  }
}

function stampMissionRouteTime(kind) {
  const now = new Date();
  const time = getCurrentTimeValue(now);
  const definition = MISSION_ROUTE_TIMELINE_DEFINITIONS[kind];

  if (!definition || kind === "transmission") return;

  missionRouteMetadata[definition.isoKey] = now.toISOString();

  if (kind === "departure") {
    setRouteValue(routeDepartureTimeInput, time);
  }

  if (kind === "junction") {
    setRouteChecked(routeJunctionEnabledInput, true);
    setRouteValue(routeJunctionTimeInput, time);
  }

  if (kind === "arrival") {
    setRouteValue(routeArrivalTimeInput, time);
  }

  const route = saveMissionRoute();
  upsertMissionRouteTimelineEvent(kind, route);
  addLog(`${definition.label} — ${time}`, { skipStructuredSAED: true });
}

function setupMissionRouteFeature() {
  mountMissionRouteAfterProtocols();
  loadMissionRoute();

  const routeFields = [
    routeDepartureTimeInput,
    routeDestinationNameInput,
    routeDestinationServiceInput,
    routeTransportStatusInput,
    routeTransportTypeInput,
    routeTransportVectorInput,
    routeTransportModeInput,
    routeTransportMonitoringInput,
    routeTransportTeamInput,
    routeJunctionEnabledInput,
    routeJunctionTimeInput,
    routeJunctionPlaceInput,
    routeJunctionWithInput,
    routeArrivalTimeInput,
    routeTransmissionDoneInput,
    routeTransportNoteInput
  ];

  routeFields.forEach(field => {
    if (!field) return;

    const persistField = () => {
      if (field === routeDepartureTimeInput) syncMissionRouteTimestampFromInput("departure");
      if (field === routeJunctionTimeInput) syncMissionRouteTimestampFromInput("junction");
      if (field === routeArrivalTimeInput) syncMissionRouteTimestampFromInput("arrival");

      const route = saveMissionRoute();

      if (field === routeDepartureTimeInput) upsertMissionRouteTimelineEvent("departure", route);
      if (field === routeJunctionTimeInput) upsertMissionRouteTimelineEvent("junction", route);
      if (field === routeArrivalTimeInput) upsertMissionRouteTimelineEvent("arrival", route);
    };

    field.addEventListener("input", persistField);
    field.addEventListener("change", persistField);
  });

  document.querySelectorAll("[data-route-choice-group]").forEach(group => {
    group.addEventListener("click", event => {
      const button = event.target.closest("[data-route-choice]");
      if (!button) return;

      const input = group.dataset.routeChoiceGroup === "transportStatus"
        ? routeTransportStatusInput
        : group.dataset.routeChoiceGroup === "transportVector"
          ? routeTransportVectorInput
          : routeTransportModeInput;
      const nextValue = getRouteValue(input) === button.dataset.routeChoice
        ? ""
        : button.dataset.routeChoice;

      setRouteValue(input, nextValue);
      saveMissionRoute();
    });
  });

  routeTransmissionDoneInput?.addEventListener("change", () => {
    if (routeTransmissionDoneInput.checked) {
      const now = new Date();
      missionRouteMetadata.transmissionAt = missionRouteMetadata.transmissionAt || now.toISOString();
      missionRouteMetadata.transmissionTime = missionRouteMetadata.transmissionTime || getCurrentTimeValue(now);
      const route = saveMissionRoute();
      upsertMissionRouteTimelineEvent("transmission", route);
      addLog(
        `Transmission à l’équipe receveuse réalisée — ${route.transmissionTime}`,
        { skipStructuredSAED: true }
      );
    } else {
      missionRouteMetadata.transmissionAt = "";
      missionRouteMetadata.transmissionTime = "";
      removeMissionRouteTimelineEvents("transmission");
      saveMissionRoute();
    }
  });

  routeCaptureLocationBtn?.addEventListener("click", () => {
    addGpsPoint("Lieu de prise en charge");
  });

  document.querySelectorAll("[data-route-stamp]").forEach(button => {
    button.addEventListener("click", () => {
      stampMissionRouteTime(button.dataset.routeStamp);
    });
  });

  saveMissionRouteBtn?.addEventListener("click", () => {
    saveMissionRoute({
      log: true,
      logLabel: "Parcours mission enregistré"
    });
  });

  clearMissionRouteBtn?.addEventListener("click", () => {
    const confirmation = window.confirm("Effacer le parcours / transport de cette mission ?");

    if (!confirmation) return;

    resetMissionRoute();

    if (typeof addLog === "function") {
      addLog("Correction parcours / transport : bloc effacé");
    }

    if (handoffCode?.value) {
      resetMissionHandoffUi?.();
    }
  });

  updateMissionRouteUi();
}

window.pisuMissionRoute = {
  getSnapshot: getMissionRouteSnapshot,
  getLines: getMissionRouteLines,
  getSAEDLines: getMissionRouteSAEDLines,
  reset: resetMissionRoute,
  applySnapshot: applyMissionRouteSnapshot
};

function buildMiniSAEDText(protocolId = currentProtocolPageId || "") {
  const protocolTitle = PROTOCOL_TITLES?.[protocolId] ||
    (typeof getProtocolLabel === "function" ? getProtocolLabel(protocolId) : "") ||
    "Protocole PISU";
  const events = typeof getStructuredEvents === "function" ? getStructuredEvents() : [];
  const protocolEvents = events.filter(event => {
    return event.protocolId === protocolId || event.protocole === protocolTitle;
  });

  const usefulPhrases = typeof uniqueSAEDPhrases === "function"
    ? uniqueSAEDPhrases(protocolEvents.filter(event => event.visibleSAED !== false))
    : protocolEvents
        .map(event => event.phraseSAED || event.libelleCourt)
        .filter(Boolean);

  const latestVitals = typeof buildLatestVitalsSAEDLine === "function"
    ? buildLatestVitalsSAEDLine()
    : "Constantes à compléter.";

  const routeLines = window.pisuMissionRoute?.getSAEDLines
    ? window.pisuMissionRoute.getSAEDLines()
    : ["Devenir / transport à préciser."];

  const patientLine = typeof buildPatientIdentitySAEDLine === "function"
    ? buildPatientIdentitySAEDLine()
    : "Identité patient à compléter.";

  const lines = [
    `MINI SAED — ${protocolTitle}`,
    "----------------------------------------",
    patientLine,
    latestVitals,
    "",
    "Éléments PISU utiles :",
    ...(usefulPhrases.length > 0
      ? usefulPhrases.map(line => `- ${line}`)
      : ["- Aucun élément structuré renseigné pour ce protocole."]),
    "",
    "Devenir / transport :",
    ...routeLines.map(line => `- ${line}`),
    "",
    `Généré le ${new Date().toLocaleString("fr-FR")}`
  ];

  return lines.join("\n");
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function getProtocolMiniSAEDFilename(protocolId) {
  const title = PROTOCOL_TITLES?.[protocolId] || "pisu";
  const safeTitle = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const date = new Date().toISOString().slice(0, 10);

  return `mini-saed-${safeTitle}-${date}.txt`;
}

function refreshProtocolMiniSAED(protocolId) {
  const textarea = document.querySelector(`[data-mini-saed-output="${protocolId}"]`);

  if (!textarea) return;

  textarea.value = buildMiniSAEDText(protocolId);
}

function injectProtocolMiniSAEDBlocks() {
  getProtocolPages().forEach(page => {
    if (!page?.id) return;
    if (page.querySelector(".mini-saed-block")) return;

    const block = document.createElement("section");
    block.className = "mini-saed-block";
    block.innerHTML = `
      <div class="mini-saed-title">
        <strong>Transmission SAED opérationnelle</strong>
        <small>Préremplie avec les données utiles de la mission</small>
      </div>

      <p>Ouvre le même écran SAED complet : situation, antécédents utiles, évolution, actions réalisées et demande explicite.</p>

      <div class="mini-saed-actions">
        <button type="button" class="primary validation-button" data-open-operational-saed="${page.id}">
          Ouvrir le SAED opérationnel
        </button>
      </div>
    `;

    page.appendChild(block);
  });

  if (document.body.dataset.operationalSaedListenerReady === "true") return;
  document.body.dataset.operationalSaedListenerReady = "true";

  document.addEventListener("click", event => {
    const openBtn = event.target.closest("[data-open-operational-saed]");
    if (!openBtn) return;

    window.pisuSAED?.open?.();
  });
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
    version: 10,
    createdAt: new Date().toISOString(),
    responder: getResponderIdentity(),
    patient: getPatientSnapshot(),
    antecedents: getPatientAntecedentsSnapshot(),
    crew: getMissionCrew(),
    route: getMissionRouteSnapshot(),
    vitals: getVitalsEntries(),
    vitalsAlert: getLatestVitalsAlert(),
    events: getStructuredEvents(),
    log: getLog(),
    missionState: getMissionState(),
    saedRequest: window.pisuSAED?.getRequest?.() || null
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
    handoffQrImage.removeAttribute("src");
    handoffQrImage.classList.add("hidden");
  }

  if (handoffWarning) {
    handoffWarning.textContent =
      "Transfert hors ligne : aucune donnée de mission n'est envoyée à un service externe. Copiez ce code sur l'autre appareil.";
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
  applyPatientAntecedentsSnapshot(payload.antecedents || {}, { skipSave: false });

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

  applyMissionRouteSnapshot(payload.route || {}, { skipSave: false });

  if (Array.isArray(payload.events)) {
    saveStructuredEvents(payload.events);
  } else {
    clearStructuredEvents();
  }

  syncMissionRouteTimelineEvents(getMissionRouteSnapshot());

  localStorage.setItem("pisuLog", JSON.stringify(payload.log || []));
  applyMissionStateSnapshot(payload.missionState || {});
  window.pisuSAED?.applyRequest?.(payload.saedRequest || null);
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

function markButtonValidated(button, label = "Enregistré ✓", duration = 1800) {
  window.pisuSounds?.play("success");

  if (!button) return;

  const originalText = button.dataset.originalText || button.textContent;
  button.dataset.originalText = originalText;

  button.classList.add("validation-done");
  button.textContent = label;

  window.clearTimeout(button._validationTimer);

  button._validationTimer = window.setTimeout(() => {
    button.classList.remove("validation-done");
    button.textContent = button.dataset.originalText || originalText;
  }, duration);
}

function setButtonValidatedPersistent(button, isValid, validLabel = "Enregistré ✓") {
  if (!button) return;

  const originalText = button.dataset.originalText || button.textContent;
  button.dataset.originalText = originalText;

  button.classList.toggle("validation-done", Boolean(isValid));
  button.textContent = isValid ? validLabel : originalText;
}

function setCollapsibleState(panel, toggleButton, content, storageKey, collapsed) {
  if (!panel || !toggleButton || !content) return;

  panel.classList.toggle("collapsed", collapsed);
  content.classList.toggle("hidden", collapsed);
  content.hidden = collapsed;
  toggleButton.setAttribute("aria-expanded", String(!collapsed));

  if (storageKey) {
    localStorage.setItem(storageKey, collapsed ? "closed" : "open");
  }
}

function getAccordionStickyOffset() {
  const cssValue = getComputedStyle(document.documentElement)
    .getPropertyValue("--accordion-sticky-top")
    .trim();

  const parsedValue = parseFloat(cssValue);

  if (Number.isFinite(parsedValue)) {
    return parsedValue + 8;
  }

  const header = document.querySelector(".app-header, header");
  const headerHeight = header?.getBoundingClientRect?.().height || 112;

  return headerHeight + 16;
}

function updateAccordionStickyOffsets() {
  const header = document.querySelector(".app-header, header.app-header, body > header");
  const headerRect = header?.getBoundingClientRect?.();

  const headerBottom = headerRect
    ? Math.ceil(headerRect.bottom)
    : 112;

  document.documentElement.style.setProperty(
    "--accordion-sticky-top",
    `${headerBottom + 8}px`
  );

  document.documentElement.style.setProperty(
    "--accordion-nested-sticky-top",
    `${headerBottom + 58}px`
  );
}

function setupAccordionStickyOffsets() {
  updateAccordionStickyOffsets();

  window.addEventListener("resize", updateAccordionStickyOffsets);
  window.visualViewport?.addEventListener("resize", updateAccordionStickyOffsets);
  window.visualViewport?.addEventListener("scroll", updateAccordionStickyOffsets);

  const header = document.querySelector(".app-header, header.app-header, body > header");

  if (header && window.ResizeObserver) {
    const observer = new ResizeObserver(() => {
      updateAccordionStickyOffsets();
    });

    observer.observe(header);
  }
}

function scrollToAccordionTitle(element) {
  if (!element) return;

  const offset = getAccordionStickyOffset();
  const targetY = element.getBoundingClientRect().top + window.scrollY - offset;

  window.requestAnimationFrame(() => {
    window.scrollTo({
      top: Math.max(targetY, 0),
      behavior: "smooth"
    });
  });
}

function keepElementAtSameViewportPosition(element, previousTop) {
  if (!element || typeof previousTop !== "number") return;

  window.requestAnimationFrame(() => {
    const newTop = element.getBoundingClientRect().top;
    const delta = newTop - previousTop;

    if (Math.abs(delta) < 2) return;

    window.scrollBy({
      top: delta,
      behavior: "auto"
    });
  });
}

function getElementViewportTop(element) {
  if (!element?.getBoundingClientRect) return 0;
  return element.getBoundingClientRect().top;
}

function setupCollapsiblePanel(panel, toggleBtn, content, storageKey, options = {}) {
  if (!panel || !toggleBtn || !content || !storageKey) return;

  const defaultExpanded = options.defaultExpanded ?? false;
  const savedState = localStorage.getItem(storageKey);

  const shouldBeExpanded = savedState === null
    ? defaultExpanded
    : savedState === "open";

  function applyState(isExpanded) {
    toggleBtn.setAttribute("aria-expanded", String(isExpanded));
    content.classList.toggle("hidden", !isExpanded);
    content.hidden = !isExpanded;
    panel.classList.toggle("collapsed", !isExpanded);
  }

  applyState(shouldBeExpanded);

  toggleBtn.addEventListener("click", () => {
    const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
    const nextState = !isExpanded;
    const titleTopBeforeClose = getElementViewportTop(toggleBtn);

    applyState(nextState);
    localStorage.setItem(storageKey, nextState ? "open" : "closed");

    if (!nextState) {
      keepElementAtSameViewportPosition(toggleBtn, titleTopBeforeClose);
    }

    updateAccordionStickyOffsets?.();

    window.setTimeout(() => {
      updateTeamSwipeUi?.();
    }, 120);
  });
}

const COLLAPSE_DEFAULT_VERSION_KEY = "pisuCollapseDefaultVersion";
const COLLAPSE_DEFAULT_VERSION = "2026-07-ergonomie-v2-sticky";

function applyCollapsedPanelsMigration() {
  if (localStorage.getItem(COLLAPSE_DEFAULT_VERSION_KEY) === COLLAPSE_DEFAULT_VERSION) {
    return;
  }

  [
    "pisu-collapse-team",
    "pisu-collapse-patient",
    "pisu-collapse-patient-identity",
    "pisu-collapse-log",
    "pisu-collapse-handoff",
    "pisu-collapse-responder",
    "pisu-collapse-crew",
    "pisu-collapse-mission-route"
  ].forEach(key => {
    localStorage.setItem(key, "closed");
  });

  localStorage.setItem(COLLAPSE_DEFAULT_VERSION_KEY, COLLAPSE_DEFAULT_VERSION);
}

function setupStickyDetailsScrollBehavior() {
  const detailsBlocks = document.querySelectorAll(
    "details.patient-subblock, details.crew-details, details.mission-route-subblock, details.route-details, details.protocol-subblock"
  );

  detailsBlocks.forEach(details => {
    if (details.dataset.stickyDetailsReady === "true") return;

    const summary = details.querySelector("summary");

    if (!summary) return;

    details.dataset.stickyDetailsReady = "true";
    summary.addEventListener("click", () => {
      if (details.open) {
        details.dataset.closeTop = String(getElementViewportTop(summary));
      }
    });

    details.addEventListener("toggle", () => {
      updateAccordionStickyOffsets?.();

      if (!details.open) {
        const previousTop = Number(details.dataset.closeTop);

        if (Number.isFinite(previousTop)) {
          keepElementAtSameViewportPosition(summary, previousTop);
        }

        delete details.dataset.closeTop;
      }
    });
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

  updateTeamSummary?.();
}

function updateTeamSummary() {
  if (!teamSummary) return;

  const responder = typeof getResponderIdentity === "function"
    ? getResponderIdentity()
    : {};

  const crew = typeof getMissionCrew === "function"
    ? getMissionCrew()
    : [];

  const parts = [];

  if (responder?.name || responder?.role || responder?.service) {
    parts.push(formatResponderIdentity?.(responder) || "Intervenant renseigné");
  } else {
    parts.push("Intervenant non renseigné");
  }

  if (Array.isArray(crew) && crew.length > 0) {
    parts.push(`${crew.length} membre(s) équipage`);
  } else {
    parts.push("Aucun équipage mission");
  }

  teamSummary.textContent = parts.join(" · ");
}

function updatePatientIdentitySummary() {
  if (!patientIdentitySummary) return;

  const name = patientNameInput?.value?.trim();
  const age = formatPatientAge();
  const birthDate = formatPatientBirthDate();
  const sex = patientSexInput?.value?.trim();
  const weight = formatPatientWeight();

  const parts = [];

  parts.push(name || "Identité non renseignée");

  if (age) {
    parts.push(`Âge : ${age}`);
  }

  if (birthDate) {
    parts.push(`Né(e) le ${birthDate}`);
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
    input?.addEventListener("input", () => {
      setButtonValidatedPersistent(saveResponderBtn, false);
    });
  });

  [
    patientNameInput,
    patientAgeInput,
    patientAgeUnitInput,
    patientBirthDayInput,
    patientBirthMonthInput,
    patientBirthYearInput,
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
    patientAgeUnitInput,
    patientBirthDayInput,
    patientBirthMonthInput,
    patientBirthYearInput,
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

function setupPatientIdentityValidationFeedback() {
  [
    patientNameInput,
    patientAgeInput,
    patientAgeUnitInput,
    patientBirthDayInput,
    patientBirthMonthInput,
    patientBirthYearInput,
    patientSexInput,
    patientCategoryInput,
    patientWeightInput,
    patientNoteInput
  ].forEach(input => {
    if (!input) return;

    input.addEventListener("input", () => {
      setButtonValidatedPersistent?.(saveIdentityBtn, false);
    });

    input.addEventListener("change", () => {
      setButtonValidatedPersistent?.(saveIdentityBtn, false);
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

  document.documentElement.style.setProperty(
    "--accordion-sticky-top",
    `${headerHeight + 8}px`
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
    teamPanel,
    toggleTeamBtn,
    teamContent,
    "pisu-collapse-team",
    { defaultExpanded: false }
  );

  setupCollapsiblePanel(
    patientIdentityPanel,
    togglePatientIdentityBtn,
    patientIdentityContent,
    "pisu-collapse-patient",
    { defaultExpanded: false }
  );

  setupCollapsiblePanel(
    logPanel,
    toggleLogBtn,
    logContent,
    "pisu-collapse-log",
    { defaultExpanded: false }
  );

  setupCollapsiblePanel(
    handoffPanel,
    toggleHandoffBtn,
    handoffContent,
    "pisu-collapse-handoff",
    { defaultExpanded: false }
  );

  setupIdentitySummaries();
  updateResponderSummary();
  updatePatientIdentitySummary();
  updateHandoffSummary();
  updateCrewSummary();
  updateTeamSummary();
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

  [vitalsTasLeftInput, vitalsTasRightInput].forEach(input => {
    populateOrderedRangeSelect(input, {
      min: 40,
      max: 280,
      start: 120,
      step: 1
    });
  });

  [vitalsTadLeftInput, vitalsTadRightInput].forEach(input => {
    populateOrderedRangeSelect(input, {
      min: 20,
      max: 180,
      start: 70,
      step: 1
    });
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
    vitalsTasLeftInput,
    vitalsTadLeftInput,
    vitalsTasRightInput,
    vitalsTadRightInput,
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
    tasLeft: getVitalsFieldValue(vitalsTasLeftInput),
    tadLeft: getVitalsFieldValue(vitalsTadLeftInput),
    tasRight: getVitalsFieldValue(vitalsTasRightInput),
    tadRight: getVitalsFieldValue(vitalsTadRightInput),
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
    entry.tasLeft ||
    entry.tadLeft ||
    entry.tasRight ||
    entry.tadRight ||
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
  const tasLeftValue = entry.tasLeft || entry.tas || "";
  const tadLeftValue = entry.tadLeft || entry.tad || "";
  const tasRightValue = entry.tasRight || "";
  const tadRightValue = entry.tadRight || "";

  if (entry.fc) parts.push(`FC ${entry.fc}/min`);

  if (tasLeftValue || tadLeftValue) {
    parts.push(`TA gauche ${tasLeftValue || "?"}/${tadLeftValue || "?"}`);
  }

  if (tasRightValue || tadRightValue) {
    parts.push(`TA droite ${tasRightValue || "?"}/${tadRightValue || "?"}`);
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
  const tasLeft = readNumericVital(entry.tasLeft || entry.tas);
  const tasRight = readNumericVital(entry.tasRight);
  const tasValues = [tasLeft, tasRight].filter(value => value !== null);
  const lowestTas = tasValues.length > 0 ? Math.min(...tasValues) : null;
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
    if (lowestTas !== null && lowestTas < 90) {
      addRed(`TAS minimale ${lowestTas} mmHg < 90`);
    } else if (lowestTas !== null && lowestTas >= 90 && lowestTas <= 100) {
      addOrange(`TAS minimale ${lowestTas} mmHg limite`);
    }

    if (fc !== null && fc <= 40) addRed(`FC ${fc}/min <= 40`);
    else if (fc !== null && fc >= 160) addRed(`FC ${fc}/min >= 160`);
    else if (fc !== null && fc >= 130 && fc <= 159) addOrange(`FC ${fc}/min élevée`);
    else if (fc !== null && fc >= 41 && fc <= 50) addOrange(`FC ${fc}/min basse`);

    if (fc !== null && lowestTas !== null && lowestTas > 0) {
      const shockIndex = fc / lowestTas;

      if (shockIndex > 1.2) {
        addRed(`Shock index ${shockIndex.toFixed(2).replace(".", ",")} > 1,2`);
      } else if (shockIndex > 1) {
        addOrange(`Shock index ${shockIndex.toFixed(2).replace(".", ",")} > 1`);
      }
    }

    if (tasLeft !== null && tasRight !== null) {
      const tasDifference = Math.abs(tasLeft - tasRight);

      if (tasDifference >= 20) {
        addOrange(`Écart TAS gauche/droite ${tasDifference} mmHg`);
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

  if (currentButton && !currentButton.classList.contains("action-done")) {
    const effectiveAlert = getEffectiveCall15Alert();

    if (effectiveAlert && effectiveAlert.level !== "none") {
      currentButton.classList.add(
        effectiveAlert.level === "red"
          ? "call15-alert-red"
          : "call15-alert-orange"
      );

      currentButton.dataset.call15Alert = effectiveAlert.level;
      currentButton.title = effectiveAlert.reasons.join(" ");
    }
  }

  notifyCall15IfImmediateVisible?.();
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
    vitalsTasLeftInput,
    vitalsTadLeftInput,
    vitalsTasRightInput,
    vitalsTadRightInput,
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
  window.pisuSAED?.close?.();
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

  if (alert.level === "red" || alert.call15Level === "red") {
    window.pisuSounds?.notifyCall15Required(
      alert.reasons?.join(" ; ") || alert.message || "Appel 15 exigé"
    );
  } else if (alert.level === "orange") {
    window.pisuSounds?.notifyVitalsOrange(
      alert.reasons?.join(" ; ") || alert.message || "Alerte constantes orange"
    );
  }

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

function getCrewRoleClass(role) {
  const value = String(role || "").toLowerCase();

  if (value.includes("conducteur")) return "crew-role-conducteur";
  if (value.includes("équipier") || value.includes("equipier")) return "crew-role-equipier";
  if (value.includes("ide")) return "crew-role-ide";
  if (value.includes("médecin") || value.includes("medecin")) return "crew-role-medecin";
  if (value.includes("ambulancier")) return "crew-role-ambulancier";
  if (value.includes("observateur")) return "crew-role-observateur";

  return "crew-role-autre";
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

function updateCrewSummary() {
  if (!crewSummary) return;

  const crew = getMissionCrew();

  if (crew.length === 0) {
    crewSummary.textContent = "Aucun équipage sélectionné";
    updateTeamSummary?.();
    updateMissionRouteCrewReuse?.();
    return;
  }

  crewSummary.innerHTML = "";

  const wrapper = document.createElement("span");
  wrapper.className = "crew-summary-pills";

  crew.forEach(member => {
    const pill = document.createElement("span");
    pill.className = `crew-summary-pill ${getCrewRoleClass(member.missionRole)}`;
    pill.textContent = `${member.missionRole || "Équipier"} : ${member.name || "Nom"}`;
    wrapper.appendChild(pill);
  });

  crewSummary.appendChild(wrapper);
  updateTeamSummary?.();
  updateMissionRouteCrewReuse?.();
}

function updateSelectedCrewPreview() {
  if (!selectedCrewPreview || !addCrewToMissionBtn) return;

  const roster = getCrewRoster();
  const member = roster.find(item => item.id === selectedCrewMemberId);

  if (!member) {
    selectedCrewPreview.textContent = "Sélectionne un collègue, puis son rôle.";
    addCrewToMissionBtn.disabled = true;
    addCrewToMissionBtn.className = "crew-add-mission-btn validation-button compact-main-button";
    return;
  }

  selectedCrewPreview.textContent = `${member.name} sera ajouté comme ${selectedCrewMissionRole}.`;

  addCrewToMissionBtn.disabled = false;
  addCrewToMissionBtn.className = `crew-add-mission-btn validation-button compact-main-button ${getCrewRoleClass(selectedCrewMissionRole)}`;
}

function selectCrewMember(memberId) {
  selectedCrewMemberId = memberId;
  renderCrewQuickRoster();
  updateSelectedCrewPreview();
}

function selectCrewRole(role) {
  selectedCrewMissionRole = role || "Équipier";

  crewRoleButtons?.querySelectorAll(".crew-role-btn").forEach(button => {
    button.classList.toggle("selected", button.dataset.crewRole === selectedCrewMissionRole);
  });

  updateSelectedCrewPreview();
}

function renderCrewQuickRoster() {
  if (!crewQuickRoster) return;

  const roster = getCrewRoster();

  if (roster.length === 0) {
    crewQuickRoster.textContent = "Aucun collègue enregistré. Ajoute d’abord un collègue au carnet.";
    selectedCrewMemberId = "";
    updateSelectedCrewPreview();
    return;
  }

  if (selectedCrewMemberId && !roster.some(member => member.id === selectedCrewMemberId)) {
    selectedCrewMemberId = "";
  }

  crewQuickRoster.innerHTML = "";

  roster.forEach(member => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "crew-person-chip";
    button.textContent = member.name || "Nom non renseigné";

    if (member.id === selectedCrewMemberId) {
      button.classList.add("selected");
    }

    button.addEventListener("click", () => {
      selectCrewMember(member.id);
    });

    crewQuickRoster.appendChild(button);
  });

  updateSelectedCrewPreview();
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
    item.className = `crew-role-card ${getCrewRoleClass(member.missionRole)}`;

    const main = document.createElement("div");
    main.className = "crew-role-card-main";
    main.textContent = `${member.missionRole || "Équipier"} — ${member.name || "Nom non renseigné"}`;

    const meta = document.createElement("div");
    meta.className = "crew-role-card-meta";
    meta.textContent = [
      member.defaultRole || "",
      member.service || ""
    ].filter(Boolean).join(" — ") || "Fonction / service non renseignés";

    const actions = document.createElement("div");
    actions.className = "crew-role-card-actions";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "crew-mini-btn danger";
    removeBtn.textContent = "Retirer";
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
  renderCrewQuickRoster();
  renderMissionCrewList();
  renderCrewRosterList();
  updateCrewSummary();
  updateSelectedCrewPreview();

  window.requestAnimationFrame(() => {
    updateTeamSwipeUi?.();
  });
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
    selectedCrewMemberId = existing.id;
    renderCrewFeature();
    scrollToTeamSlide?.(1, "smooth");
    window.setTimeout(updateTeamSwipeUi, 260);
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

  selectedCrewMemberId = member.id;

  clearCrewMemberForm();

  if (crewNewMemberDetails && "open" in crewNewMemberDetails) {
    crewNewMemberDetails.open = false;
  }

  renderCrewFeature();
  scrollToTeamSlide?.(1, "smooth");
  window.setTimeout(updateTeamSwipeUi, 260);
  markButtonValidated(saveCrewMemberBtn, "Collègue enregistré ✓");
  updateTeamSummary?.();

  if (typeof addLog === "function") {
    addLog(`Carnet équipage : collègue ajouté — ${formatCrewRosterMember(member)}`);
  }
}

function addSelectedCrewToMission() {
  const roster = getCrewRoster();
  const selectedMember = roster.find(member => member.id === selectedCrewMemberId);

  if (!selectedMember) {
    alert("Sélectionne un collègue.");
    return;
  }

  const missionRole = selectedCrewMissionRole || "Équipier";
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

  const existingIndex = missionCrew.findIndex(member => member.id === selectedMember.id);

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
  scrollToTeamSlide?.(1, "auto");
  window.setTimeout(updateTeamSwipeUi, 80);
  markButtonValidated(addCrewToMissionBtn, "Ajouté ✓");
  updateTeamSummary?.();

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

  if (selectedCrewMemberId === memberId) {
    selectedCrewMemberId = "";
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

  openNewCrewMemberBtn?.addEventListener("click", () => {
    scrollToTeamSlide?.(2, "smooth");

    window.setTimeout(() => {
      crewMemberNameInput?.focus();
      updateTeamSwipeUi?.();
    }, 250);
  });

  crewRoleButtons?.addEventListener("click", event => {
    const button = event.target.closest("[data-crew-role]");

    if (!button) return;

    selectCrewRole(button.dataset.crewRole);
  });

  selectCrewRole(selectedCrewMissionRole);
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
  window.pisuSAED?.close?.();

  userCharterOverlay?.classList.remove("hidden");
  document.body.classList.remove("charter-pending");
  document.body.classList.remove("vitals-floating-ready");
  document.body.classList.add("modal-open", "charter-open");

  floatingVitalsBtn?.setAttribute("hidden", "");
  floatingSaedBtn?.setAttribute("hidden", "");

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
  document.body.classList.add("vitals-floating-ready");

  floatingVitalsBtn?.removeAttribute("hidden");
  floatingSaedBtn?.removeAttribute("hidden");
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
    <p>Les données saisies peuvent inclure des informations de prise en charge. Elles sont destinées à rester locales dans l’appareil, sauf action volontaire de l’utilisateur : export, copie ou transfert par code.</p>

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

if (appVersion) {
  if (APP_VERSION) {
    appVersion.textContent = `v${APP_VERSION}`;
    appVersion.setAttribute("aria-label", `Version de l’application ${APP_VERSION}`);
  } else {
    appVersion.hidden = true;
  }
}

restoreCounterBadges();

loadProtocolScrollPositions();
loadResponderIdentity();
loadPatientAntecedents();
setupCrewFeature();
setupPatientAntecedentsFeature();
setupMissionRouteFeature();
setupAccordionStickyOffsets?.();
applyCollapsedPanelsMigration?.();
setupCollapsiblePanels();
setupStickyDetailsScrollBehavior?.();
invalidateHandoffWhenPatientChanges();
setupMobileLayoutOffsets();
setupProtocolSwipeMenu?.();
setupProtocolOpeners?.();
setupTeamSwipeFeature?.();
setupRouteSwipeFeature?.();
setupPatientRollerFeature?.();
setupPatientBirthDateFeature?.();
setupIdentitySwipeFeature?.();
setupIdentityNotesHeightRefresh?.();
setupPatientIdentityValidationFeedback?.();
setupPisuSoundFeature();
setupImmediateCall15SoundWatcher?.();
setupVitalsFeature();
setupUserCharterFeature();
setupMissionResumeFeature();
installStructuredSAEDEngine();
injectProtocolMiniSAEDBlocks?.();
checkMissionHashImport();

loadLog();
updateOnlineStatus();
updateResponderSummary?.();
updateCrewSummary?.();
updateTeamSummary?.();
