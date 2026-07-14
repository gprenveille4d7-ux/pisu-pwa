(function setupOperationalSAEDModule() {
  "use strict";

  const REQUEST_STORAGE_KEY = "pisuSaedRequestV1";
  const APP_VERSION = String(globalThis.PISU_APP_VERSION || "").trim();
  const MAX_ACTIONS_IN_EVALUATION = 8;

  const floatingButton = document.getElementById("floatingSaedBtn");
  const overlay = document.getElementById("saedOverlay");
  const sheet = document.getElementById("saedSheet");
  const closeButton = document.getElementById("closeSaedSheetBtn");
  const updatedAt = document.getElementById("saedUpdatedAt");
  const priorityBanner = document.getElementById("saedPriorityBanner");
  const situationContent = document.getElementById("saedSituationContent");
  const antecedentsSection = document.getElementById("saedAntecedentsSection");
  const antecedentsContent = document.getElementById("saedAntecedentsContent");
  const currentAlert = document.getElementById("saedCurrentAlert");
  const vitalsEvolution = document.getElementById("saedVitalsEvolution");
  const countersContent = document.getElementById("saedCounters");
  const actionsContent = document.getElementById("saedActionsContent");
  const demandSummary = document.getElementById("saedDemandSummary");
  const demandChoices = document.getElementById("saedDemandChoices");
  const demandDetail = document.getElementById("saedDemandDetail");
  const saveDemandButton = document.getElementById("saveSaedDemandBtn");
  const routeContent = document.getElementById("saedRouteContent");
  const chronologySection = document.getElementById("saedChronologySection");
  const chronologyContent = document.getElementById("saedChronologyContent");
  const missionContext = document.getElementById("saedMissionContext");
  const missionContextContent = document.getElementById("saedMissionContextContent");
  const refreshButton = document.getElementById("refreshSaedBtn");
  const copyButton = document.getElementById("copySaedBtn");
  const downloadButton = document.getElementById("downloadSaedBtn");

  let selectedDemandType = "";

  function safeCall(name, fallback, ...args) {
    try {
      return typeof window[name] === "function" ? window[name](...args) : fallback;
    } catch {
      return fallback;
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatClock(value) {
    const parsed = Date.parse(value);

    if (!Number.isFinite(parsed)) return "";

    return new Date(parsed).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function readRequest() {
    try {
      const request = JSON.parse(localStorage.getItem(REQUEST_STORAGE_KEY) || "null");

      if (!request || typeof request !== "object") {
        return { type: "", detail: "", updatedAt: "" };
      }

      return {
        type: String(request.type || "").trim(),
        detail: String(request.detail || "").trim(),
        updatedAt: String(request.updatedAt || "").trim()
      };
    } catch {
      localStorage.removeItem(REQUEST_STORAGE_KEY);
      return { type: "", detail: "", updatedAt: "" };
    }
  }

  function storeRequest(request) {
    const normalized = {
      type: String(request?.type || "").trim(),
      detail: String(request?.detail || "").trim(),
      updatedAt: String(request?.updatedAt || new Date().toISOString())
    };

    if (!normalized.type && !normalized.detail) {
      localStorage.removeItem(REQUEST_STORAGE_KEY);
      return { type: "", detail: "", updatedAt: "" };
    }

    localStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function applyRequest(request) {
    if (!request || typeof request !== "object") {
      localStorage.removeItem(REQUEST_STORAGE_KEY);
    } else {
      storeRequest(request);
    }

    refreshIfOpen();
  }

  function reset() {
    localStorage.removeItem(REQUEST_STORAGE_KEY);
    selectedDemandType = "";

    if (demandDetail) demandDetail.value = "";
    refreshIfOpen();
  }

  function formatRequest(request = readRequest()) {
    return [request.type, request.detail].filter(Boolean).join(" — ");
  }

  function getActiveEvents() {
    const events = safeCall("getStructuredEvents", []);
    const validEvents = Array.isArray(events) ? events : [];
    const activeEvents = safeCall("getActiveEventsForSaed", validEvents, validEvents);

    return Array.isArray(activeEvents) ? activeEvents : validEvents;
  }

  function getProtocolContext(events, missionState) {
    const latestProtocolEvent = events
      .slice()
      .reverse()
      .find(event => event.protocolId || event.protocole);
    const protocolId = missionState?.activeProtocolId || latestProtocolEvent?.protocolId || "";
    const protocolLabel = protocolId
      ? safeCall("getProtocolLabel", "", protocolId)
      : String(latestProtocolEvent?.protocole || "").trim();

    return {
      id: protocolId,
      label: protocolLabel && protocolLabel !== "Mission PISU" ? protocolLabel : ""
    };
  }

  function formatResponder(responder) {
    return [responder?.role, responder?.name, responder?.service]
      .map(value => String(value || "").trim())
      .filter(Boolean)
      .join(" — ");
  }

  function formatPatient(patient) {
    const identity = [];

    if (patient?.name) identity.push(patient.name);

    const description = [patient?.sex, patient?.age]
      .map(value => String(value || "").trim())
      .filter(Boolean)
      .join(", ");

    if (description) identity.push(description);
    if (patient?.birthDate) identity.push(`né(e) le ${patient.birthDate}`);
    if (patient?.weight) identity.push(`${patient.weight} kg`);

    return identity.join(" — ");
  }

  function buildAntecedentLines(antecedents, patient) {
    const lines = [];
    const flags = [];

    if (antecedents?.allergies) lines.push(`Allergies : ${antecedents.allergies}`);
    if (antecedents?.medicalHistory) lines.push(`Antécédents : ${antecedents.medicalHistory}`);
    if (antecedents?.currentTreatment) lines.push(`Traitements habituels : ${antecedents.currentTreatment}`);

    if (antecedents?.anticoagulant) flags.push("Anticoagulant / antiagrégant");
    if (antecedents?.diabetes) flags.push("Diabète");
    if (antecedents?.epilepsy) flags.push("Épilepsie");
    if (antecedents?.cardiacHistory) flags.push("ATCD cardiaque");
    if (antecedents?.respiratoryHistory) flags.push("ATCD respiratoire");
    if (antecedents?.pregnancyPossible) flags.push("Grossesse possible");

    if (flags.length > 0) lines.push(`Risques signalés : ${flags.join(", ")}`);
    if (antecedents?.note) lines.push(`Contexte : ${antecedents.note}`);
    if (patient?.note) lines.push(`Repère patient : ${patient.note}`);

    return lines;
  }

  function formatBloodPressure(entry) {
    const left = [entry?.tasLeft || entry?.tas, entry?.tadLeft || entry?.tad]
      .filter(Boolean)
      .join("/");
    const right = [entry?.tasRight, entry?.tadRight]
      .filter(Boolean)
      .join("/");

    if (left && right && left !== right) return `G ${left} · D ${right}`;
    return left || right;
  }

  const VITAL_DEFINITIONS = [
    { key: "fc", label: "FC", unit: "/min", read: entry => entry?.fc || "" },
    { key: "ta", label: "TA", unit: "mmHg", read: formatBloodPressure },
    {
      key: "spo2",
      label: "SpO₂",
      unit: "%",
      read: entry => {
        if (!entry?.spo2) return "";
        const oxygen = [entry.oxygenSupport, entry.oxygenFlow ? `${entry.oxygenFlow} L/min` : ""]
          .filter(Boolean)
          .join(" ");
        return `${entry.spo2}${oxygen ? ` (${oxygen})` : ""}`;
      }
    },
    { key: "fr", label: "FR", unit: "/min", read: entry => entry?.fr || "" },
    {
      key: "temperature",
      label: "Temp.",
      unit: "°C",
      read: entry => String(entry?.temperature || "").replace(".", ",")
    },
    { key: "gcs", label: "GCS", unit: "", read: entry => entry?.gcs || "" },
    { key: "pain", label: "EN", unit: "/10", read: entry => entry?.pain || "" },
    {
      key: "glycemia",
      label: "Glycémie",
      unit: "g/L",
      read: entry => String(entry?.glycemia || "").replace(".", ",")
    }
  ];

  function buildVitalRows(entries) {
    return VITAL_DEFINITIONS.map(definition => {
      const measurements = entries
        .map(entry => ({
          id: entry.id || `${entry.createdAt}-${definition.key}`,
          value: String(definition.read(entry) || "").trim(),
          time: String(entry.time || formatClock(entry.createdAt) || "").slice(0, 5),
          createdAt: entry.createdAt || ""
        }))
        .filter(measurement => measurement.value);

      if (measurements.length === 0) return null;

      return {
        ...definition,
        initial: measurements[0],
        latest: measurements[measurements.length - 1],
        hasEvolution: measurements.length > 1
      };
    }).filter(Boolean);
  }

  function eventText(event) {
    const primary = String(event?.libelleLong || event?.libelleCourt || event?.phraseSAED || "").trim();
    const additions = [];
    const normalizedPrimary = normalizeText(primary);

    if (event?.dose && !normalizedPrimary.includes(normalizeText(event.dose))) {
      additions.push(`Dose : ${event.dose}`);
    }

    if (event?.voie && !normalizedPrimary.includes(normalizeText(event.voie))) {
      additions.push(`Voie : ${event.voie}`);
    }

    if (event?.detail && !normalizedPrimary.includes(normalizeText(event.detail))) {
      additions.push(event.detail);
    }

    return [primary, ...additions].filter(Boolean).join(" — ");
  }

  function isPresentationNoise(event) {
    const text = normalizeText(eventText(event));

    if (!text) return true;
    if (["journal_technique", "navigation", "technique"].includes(event?.categorie)) return true;
    if (event?.type === "technique") return true;

    return [
      "ouverture protocole",
      "selection protocole",
      "protocole remis a zero",
      "reset protocole",
      "doses recalculees",
      "rappel protocole",
      "rappel 3e cee",
      "rappel 5e cee",
      "module constantes demandee",
      "action deja prise en compte",
      "a partir du 3e cee",
      "au 3e cee",
      "au 5e cee"
    ].some(fragment => text.includes(fragment));
  }

  function uniqueEvents(events) {
    const seen = new Set();

    return events.filter(event => {
      const key = `${String(event?.heure || "").slice(0, 5)}|${normalizeText(eventText(event))}`;

      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function getActionEvents(events) {
    return uniqueEvents(
      events
        .filter(event => event?.sectionSAED === "E")
        .filter(event => event?.visibleSAED !== false)
        .filter(event => event?.categorie !== "constante")
        .filter(event => !isPresentationNoise(event))
        .sort((a, b) => String(a.iso || "").localeCompare(String(b.iso || "")))
    );
  }

  function getSituationEvents(events) {
    return uniqueEvents(
      events
        .filter(event => event?.sectionSAED === "S")
        .filter(event => event?.visibleSAED !== false)
        .filter(event => !["constante", "alerte_constantes"].includes(event?.categorie))
        .filter(event => event?.sousCategorie !== "alerte_constantes")
        .filter(event => !isPresentationNoise(event))
        .sort((a, b) => String(a.iso || "").localeCompare(String(b.iso || "")))
    ).slice(-3);
  }

  function buildChronology(events, vitalsEntries) {
    const eventItems = events
      .filter(event => event?.visibleChrono !== false)
      .filter(event => event?.categorie !== "constante")
      .filter(event => !isPresentationNoise(event))
      .map(event => ({
        iso: event.iso || "",
        time: String(event.heure || formatClock(event.iso) || "Heure ?").slice(0, 5),
        text: eventText(event),
        kind: event.categorie === "medicament" || event.categorie === "therapeutique"
          ? "treatment"
          : "event"
      }));

    const vitalItems = vitalsEntries.map(entry => ({
      iso: entry.createdAt || "",
      time: String(entry.time || formatClock(entry.createdAt) || "Heure ?").slice(0, 5),
      text: safeCall("formatVitalsEntry", "Constantes enregistrées", entry, { withNumber: false })
        .replace(/^\d{2}:\d{2}(?::\d{2})?\s+—\s+/, ""),
      kind: "vitals"
    }));

    const combined = [...eventItems, ...vitalItems]
      .filter(item => item.text)
      .sort((a, b) => String(a.iso || "").localeCompare(String(b.iso || "")));
    const seen = new Set();

    return combined.filter(item => {
      const key = `${item.time}|${normalizeText(item.text)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function buildRouteLines(route) {
    const lines = [];
    const origin = [route?.originLabel, route?.originCoordinates].filter(Boolean).join(" — ");
    const destination = [route?.destinationName, route?.destinationService].filter(Boolean).join(" — ");
    const transport = [
      route?.transportStatus,
      route?.transportType,
      route?.transportVector,
      route?.transportMode,
      route?.transportMonitoring
    ].filter(Boolean).join(" — ");

    if (origin) lines.push(`Lieu de prise en charge : ${origin}`);
    if (destination) lines.push(`Destination : ${destination}`);
    if (transport) lines.push(`Transport : ${transport}`);
    if (route?.departureTime) lines.push(`Départ des lieux : ${route.departureTime}`);

    if (route?.junctionEnabled) {
      const junction = [
        route.junctionTime ? `à ${route.junctionTime}` : "",
        route.junctionPlace,
        route.junctionWith ? `avec ${route.junctionWith}` : ""
      ].filter(Boolean).join(" — ");
      lines.push(`Jonction : ${junction || "prévue / réalisée"}`);
    }

    if (route?.arrivalTime) lines.push(`Arrivée : ${route.arrivalTime}`);
    if (route?.transmissionDone) {
      lines.push(`Transmission à l’équipe receveuse réalisée${route?.transmissionTime ? ` à ${route.transmissionTime}` : ""}`);
    }
    if (route?.note) lines.push(`Note transport : ${route.note}`);

    return lines;
  }

  function readCounter(key) {
    const value = Number(localStorage.getItem(key) || "0");
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  function buildCounters(protocolId) {
    const definitions = protocolId === "childAcrProtocol"
      ? [
          ["CEE", "pisu-counter-child-cee"],
          ["Adrénaline", "pisu-counter-child-adrenaline"],
          ["Cordarone", "pisu-counter-child-cordarone"]
        ]
      : protocolId === "acrAdultProtocol"
        ? [
            ["CEE", "pisu-counter-cee"],
            ["Adrénaline", "pisu-counter-adrenaline"],
            ["Cordarone", "pisu-counter-cordarone"]
          ]
        : [];

    return definitions
      .map(([label, key]) => ({ label, count: readCounter(key) }))
      .filter(item => item.count > 0);
  }

  function formatCrewMember(member) {
    return [member?.missionRole, member?.name, member?.defaultRole, member?.service]
      .map(value => String(value || "").trim())
      .filter(Boolean)
      .join(" — ");
  }

  function buildModel() {
    const events = getActiveEvents();
    const vitalsEntries = safeCall("getVitalsEntries", []);
    const safeVitals = Array.isArray(vitalsEntries) ? vitalsEntries : [];
    const patient = safeCall("getPatientSnapshot", {});
    const antecedents = safeCall("getPatientAntecedentsSnapshot", {});
    const responder = safeCall("getResponderIdentity", {});
    const crew = safeCall("getMissionCrew", []);
    const route = safeCall("getMissionRouteSnapshot", {});
    const missionState = safeCall("getMissionState", null);
    const alert = safeCall("getLatestVitalsAlert", { level: "none", reasons: [] });
    const request = readRequest();
    const protocol = getProtocolContext(events, missionState);
    const routeLines = buildRouteLines(route);
    const actionEvents = getActionEvents(events);

    return {
      events,
      patient,
      antecedents,
      responder,
      responderLine: formatResponder(responder),
      patientLine: formatPatient(patient),
      crew: Array.isArray(crew) ? crew : [],
      route,
      routeLines,
      missionState,
      alert,
      request,
      requestLine: formatRequest(request),
      protocol,
      antecedentLines: buildAntecedentLines(antecedents, patient),
      vitalRows: buildVitalRows(safeVitals),
      vitalsEntries: safeVitals,
      latestVitals: safeVitals[safeVitals.length - 1] || null,
      actionEvents,
      situationEvents: getSituationEvents(events),
      chronology: buildChronology(events, safeVitals),
      counters: buildCounters(protocol.id)
    };
  }

  function listHtml(lines, className = "saed-plain-list") {
    return `<ul class="${className}">${lines.map(line => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
  }

  function renderPriority(model) {
    const alertReasons = Array.isArray(model.alert?.reasons) ? model.alert.reasons : [];
    const requestText = model.requestLine || "Objet de l’appel à préciser";
    const alertText = alertReasons.length > 0 ? alertReasons.join(" · ") : "";

    priorityBanner.className = "saed-priority-banner";

    if (model.alert?.level === "red") priorityBanner.classList.add("is-red");
    if (model.alert?.level === "orange") priorityBanner.classList.add("is-orange");
    if (!model.requestLine) priorityBanner.classList.add("needs-input");

    priorityBanner.innerHTML = `
      <span>APPEL MAINTENANT</span>
      <strong>${escapeHtml(requestText)}</strong>
      ${alertText ? `<small>${escapeHtml(alertText)}</small>` : ""}
    `;
  }

  function renderSituation(model) {
    const missionStart = formatClock(model.missionState?.startedAt);
    const situationLines = model.situationEvents.map(eventText).filter(Boolean);

    situationContent.innerHTML = `
      <div class="saed-situation-grid">
        <article class="saed-fact-card ${model.responderLine ? "" : "is-missing"}">
          <span>Appelant</span>
          <strong>${escapeHtml(model.responderLine || "Intervenant à renseigner")}</strong>
        </article>
        <article class="saed-fact-card ${model.patientLine ? "" : "is-missing"}">
          <span>Patient</span>
          <strong>${escapeHtml(model.patientLine || "Patient non identifié")}</strong>
        </article>
        <article class="saed-fact-card wide ${model.protocol.label ? "" : "is-missing"}">
          <span>Motif / protocole</span>
          <strong>${escapeHtml(model.protocol.label || "Motif principal à préciser")}</strong>
          ${missionStart ? `<small>Prise en charge depuis ${escapeHtml(missionStart)}</small>` : ""}
        </article>
        <article class="saed-fact-card wide saed-call-reason ${model.requestLine ? "" : "is-missing"}">
          <span>Pourquoi l’équipe appelle maintenant</span>
          <strong>${escapeHtml(model.requestLine || "Demande non précisée")}</strong>
        </article>
      </div>
      ${situationLines.length > 0 ? `<div class="saed-current-status"><strong>Situation clinique enregistrée</strong>${listHtml(situationLines)}</div>` : ""}
    `;
  }

  function renderAntecedents(model) {
    const hasAntecedents = model.antecedentLines.length > 0;
    antecedentsSection.hidden = !hasAntecedents;
    antecedentsContent.innerHTML = hasAntecedents ? listHtml(model.antecedentLines) : "";
  }

  function renderAlert(model) {
    const reasons = Array.isArray(model.alert?.reasons) ? model.alert.reasons : [];

    if (reasons.length === 0 || model.alert?.level === "none") {
      currentAlert.hidden = true;
      currentAlert.innerHTML = "";
      return;
    }

    currentAlert.hidden = false;
    currentAlert.className = `saed-current-alert is-${model.alert.level}`;
    currentAlert.innerHTML = `
      <span>Anomalie déjà identifiée par PISU</span>
      <strong>${escapeHtml(reasons.join(" · "))}</strong>
    `;
  }

  function renderVitals(model) {
    if (model.vitalRows.length === 0) {
      vitalsEvolution.innerHTML = `<p class="saed-single-missing">Aucune constante enregistrée.</p>`;
      return;
    }

    const latestLabel = model.latestVitals
      ? `Dernière série : ${String(model.latestVitals.time || "").slice(0, 5)}${model.latestVitals.moment ? ` — ${model.latestVitals.moment}` : ""}`
      : "Dernières mesures disponibles";

    vitalsEvolution.innerHTML = `
      <div class="saed-subheading">
        <strong>Évolution des constantes</strong>
        <small>${escapeHtml(latestLabel)}</small>
      </div>
      <div class="saed-vital-table" role="table" aria-label="Évolution des constantes">
        ${model.vitalRows.map(row => `
          <div class="saed-vital-row" role="row">
            <span class="saed-vital-label" role="rowheader">${escapeHtml(row.label)}</span>
            <span class="saed-vital-initial" role="cell">
              <strong>${escapeHtml(row.initial.value)}</strong>
              ${row.initial.time ? `<small>${escapeHtml(row.initial.time)}</small>` : ""}
            </span>
            ${row.hasEvolution ? `<span class="saed-vital-arrow" aria-hidden="true">→</span>` : `<span class="saed-vital-arrow single" aria-hidden="true">•</span>`}
            <span class="saed-vital-latest" role="cell">
              <strong>${escapeHtml(row.latest.value)}</strong>
              ${row.unit ? `<em>${escapeHtml(row.unit)}</em>` : ""}
              ${row.latest.time ? `<small>${escapeHtml(row.latest.time)}</small>` : ""}
            </span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function renderCounters(model) {
    countersContent.hidden = model.counters.length === 0;
    countersContent.innerHTML = model.counters.map(counter => `
      <div class="saed-counter-pill">
        <span>${escapeHtml(counter.label)}</span>
        <strong>${counter.count}</strong>
      </div>
    `).join("");
  }

  function renderActions(model) {
    const visibleActions = model.actionEvents.slice(-MAX_ACTIONS_IN_EVALUATION);

    actionsContent.hidden = visibleActions.length === 0;
    actionsContent.innerHTML = visibleActions.length > 0
      ? `
          <div class="saed-subheading">
            <strong>Actions / traitements enregistrés</strong>
            ${model.actionEvents.length > visibleActions.length ? `<small>${model.actionEvents.length - visibleActions.length} événement(s) antérieur(s) dans la chronologie</small>` : ""}
          </div>
          <ol class="saed-action-list">
            ${visibleActions.map(event => `
              <li>
                <time>${escapeHtml(String(event.heure || "--:--").slice(0, 5))}</time>
                <span>${escapeHtml(eventText(event))}</span>
              </li>
            `).join("")}
          </ol>
        `
      : "";
  }

  function renderDemandChoiceState() {
    demandChoices?.querySelectorAll("[data-saed-demand]").forEach(button => {
      const isSelected = button.dataset.saedDemand === selectedDemandType;
      button.classList.toggle("selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function renderDemand(model) {
    selectedDemandType = model.request.type;
    if (demandDetail) demandDetail.value = model.request.detail;
    renderDemandChoiceState();

    demandSummary.className = `saed-demand-summary ${model.requestLine ? "is-complete" : "is-missing"}`;
    demandSummary.innerHTML = model.requestLine
      ? `<span>Demande actuelle</span><strong>${escapeHtml(model.requestLine)}</strong>`
      : `<span>Demande actuelle</span><strong>À préciser avant l’appel</strong>`;

    routeContent.hidden = model.routeLines.length === 0;
    routeContent.innerHTML = model.routeLines.length > 0
      ? `<strong>Orientation / transport déjà renseigné</strong>${listHtml(model.routeLines)}`
      : "";
  }

  function renderChronology(model) {
    chronologySection.hidden = model.chronology.length === 0;
    chronologyContent.innerHTML = model.chronology.map(item => `
      <li class="is-${escapeHtml(item.kind)}">
        <time>${escapeHtml(item.time)}</time>
        <span>${escapeHtml(item.text)}</span>
      </li>
    `).join("");
  }

  function renderMissionContext(model) {
    const lines = [];

    if (model.responderLine) lines.push(`Intervenant principal : ${model.responderLine}`);
    model.crew.forEach(member => {
      const line = formatCrewMember(member);
      if (line) lines.push(`Équipage : ${line}`);
    });
    model.routeLines.forEach(line => lines.push(line));

    missionContext.hidden = lines.length === 0;
    missionContextContent.innerHTML = lines.length > 0 ? listHtml(lines) : "";
  }

  function render() {
    if (!sheet) return null;

    const model = buildModel();
    renderPriority(model);
    renderSituation(model);
    renderAntecedents(model);
    renderAlert(model);
    renderVitals(model);
    renderCounters(model);
    renderActions(model);
    renderDemand(model);
    renderChronology(model);
    renderMissionContext(model);

    if (updatedAt) {
      updatedAt.textContent = `Actualisé à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
    }

    return model;
  }

  function open() {
    safeCall("closeVitalsSheet", null);
    render();
    overlay?.classList.remove("hidden");
    sheet?.classList.remove("hidden");
    document.body.classList.add("saed-sheet-open");
    floatingButton?.setAttribute("aria-expanded", "true");
    floatingButton?.classList.add("is-open");
  }

  function close() {
    overlay?.classList.add("hidden");
    sheet?.classList.add("hidden");
    document.body.classList.remove("saed-sheet-open");
    floatingButton?.setAttribute("aria-expanded", "false");
    floatingButton?.classList.remove("is-open");
  }

  function refreshIfOpen() {
    if (sheet && !sheet.classList.contains("hidden")) render();
  }

  function saveDemand() {
    const detail = String(demandDetail?.value || "").trim();
    const previous = readRequest();
    const request = storeRequest({
      type: selectedDemandType,
      detail,
      updatedAt: new Date().toISOString()
    });
    const requestText = formatRequest(request);

    if (requestText && requestText !== formatRequest(previous)) {
      safeCall("addLog", null, `Demande SAED enregistrée : ${requestText}`, {
        protocole: "Mission PISU",
        categorie: "transmission",
        sousCategorie: "demande_regulation",
        libelleCourt: `Demande : ${requestText}`,
        libelleLong: `Demande SAED : ${requestText}`,
        sectionSAED: "D",
        priorite: "haute",
        type: "transmission",
        visibleSynthese: true,
        visibleSAED: false,
        visibleChrono: true,
        visibleJournal: true
      });
    }

    render();
  }

  function buildSituationTextLines(model) {
    const lines = [
      `Appelant : ${model.responderLine || "non renseigné"}`,
      `Patient : ${model.patientLine || "non identifié"}`
    ];
    const missionStart = formatClock(model.missionState?.startedAt);

    if (model.protocol.label) lines.push(`Motif / protocole : ${model.protocol.label}`);
    if (missionStart) lines.push(`Prise en charge depuis ${missionStart}`);
    lines.push(`Appel maintenant : ${model.requestLine || "objet à préciser"}`);
    model.situationEvents.forEach(event => lines.push(eventText(event)));

    return lines;
  }

  function buildText() {
    const model = buildModel();
    const lines = [
      `TRANSMISSION SAED — PISU${APP_VERSION ? ` v${APP_VERSION}` : ""}`,
      `Générée le ${new Date().toLocaleString("fr-FR")}`,
      "",
      "S — SITUATION",
      ...buildSituationTextLines(model).map(line => `- ${line}`),
      ""
    ];

    if (model.antecedentLines.length > 0) {
      lines.push(
        "A — ANTÉCÉDENTS / CONTEXTE",
        ...model.antecedentLines.map(line => `- ${line}`),
        ""
      );
    }

    lines.push("E — ÉVALUATION");

    const alertReasons = Array.isArray(model.alert?.reasons) ? model.alert.reasons : [];
    if (alertReasons.length > 0) lines.push(`- Anomalie PISU identifiée : ${alertReasons.join(" ; ")}`);

    if (model.vitalRows.length === 0) {
      lines.push("- Aucune constante enregistrée");
    } else {
      model.vitalRows.forEach(row => {
        const initial = `${row.initial.value}${row.initial.time ? ` (${row.initial.time})` : ""}`;
        const latest = `${row.latest.value}${row.unit ? ` ${row.unit}` : ""}${row.latest.time ? ` (${row.latest.time})` : ""}`;
        lines.push(`- ${row.label} : ${row.hasEvolution ? `${initial} → ` : ""}${latest}`);
      });
    }

    model.counters.forEach(counter => lines.push(`- ${counter.label} : ${counter.count}`));
    model.actionEvents.forEach(event => {
      lines.push(`- ${String(event.heure || "--:--").slice(0, 5)} — ${eventText(event)}`);
    });

    lines.push(
      "",
      "D — DEMANDE / DÉCISION ATTENDUE",
      `- ${model.requestLine || "Demande à préciser par le professionnel"}`,
      ...model.routeLines.map(line => `- ${line}`)
    );

    if (model.chronology.length > 0) {
      lines.push(
        "",
        "CHRONOLOGIE UTILE",
        ...model.chronology.map(item => `- ${item.time} — ${item.text}`)
      );
    }

    return lines.join("\n");
  }

  async function copyText() {
    const text = buildText();

    try {
      await navigator.clipboard.writeText(text);
      window.alert("SAED copié.");
    } catch {
      window.alert(text);
    }
  }

  function downloadText() {
    const text = buildText();
    const filename = `saed-operationnel-pisu-${new Date().toISOString().slice(0, 10)}.txt`;

    if (typeof window.downloadTextFile === "function") {
      window.downloadTextFile(filename, text);
      return;
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  floatingButton?.addEventListener("click", () => {
    if (sheet?.classList.contains("hidden")) open();
    else close();
  });
  overlay?.addEventListener("click", close);
  closeButton?.addEventListener("click", close);
  refreshButton?.addEventListener("click", render);
  copyButton?.addEventListener("click", copyText);
  downloadButton?.addEventListener("click", downloadText);
  saveDemandButton?.addEventListener("click", saveDemand);

  demandChoices?.addEventListener("click", event => {
    const button = event.target.closest("[data-saed-demand]");
    if (!button) return;

    selectedDemandType = selectedDemandType === button.dataset.saedDemand
      ? ""
      : button.dataset.saedDemand;
    renderDemandChoiceState();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && sheet && !sheet.classList.contains("hidden")) close();
  });

  window.addEventListener("pisu:mission-reset", reset);

  window.pisuSAED = {
    open,
    close,
    render,
    refreshIfOpen,
    getRequest: readRequest,
    applyRequest,
    reset,
    buildText,
    buildModel
  };

  if (!document.body.classList.contains("charter-open") && !document.body.classList.contains("charter-pending")) {
    floatingButton?.removeAttribute("hidden");
  }
})();
