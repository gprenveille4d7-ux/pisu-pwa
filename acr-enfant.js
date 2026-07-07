(function () {
  const openBtn = document.getElementById("openChildAcrBtn");
  const closeBtn = document.getElementById("closeChildAcrBtn");
  const protocol = document.getElementById("childAcrProtocol");

  const call15Btn = document.getElementById("childAcrCall15Btn");
  const call15Status = document.getElementById("childAcrCall15Status");

  const timerEl = document.getElementById("childAcrTimer");
  const ceeStatus = document.getElementById("childAcrCeeStatus");
  const adrenalineStatus = document.getElementById("childAcrAdrenalineStatus");
  const cordaroneStatus = document.getElementById("childAcrCordaroneStatus");

  const weightUsed = document.getElementById("childAcrWeightUsed");
  const ceeDoseEl = document.getElementById("childAcrCeeDose");
  const adrenalineDoseEl = document.getElementById("childAcrAdrenalineDose");
  const cordarone300DoseEl = document.getElementById("childAcrCordarone300Dose");
  const cordarone150DoseEl = document.getElementById("childAcrCordarone150Dose");
  const refreshDosesBtn = document.getElementById("refreshChildAcrDosesBtn");

  const startTimerBtn = document.getElementById("startChildAcrTimerBtn");
  const resetTimerBtn = document.getElementById("resetChildAcrTimerBtn");

  const shockIndicatedBtn = document.getElementById("childShockIndicatedBtn");
  const shockNotIndicatedBtn = document.getElementById("childShockNotIndicatedBtn");
  const racsBtn = document.getElementById("childRacsBtn");

  const shockBranch = document.getElementById("childShockBranch");
  const noShockBranch = document.getElementById("childNoShockBranch");
  const racsBranch = document.getElementById("childRacsBranch");

  const ceeBtn = document.getElementById("childCeeBtn");
  const shockAdrenalineBtn = document.getElementById("childShockAdrenalineBtn");
  const noShockAdrenalineBtn = document.getElementById("childNoShockAdrenalineBtn");
  const cordarone300Btn = document.getElementById("childCordarone300Btn");
  const cordarone150Btn = document.getElementById("childCordarone150Btn");

  const resetBtn = document.getElementById("resetChildAcrProtocolBtn");

  let cycleInterval = null;
  let cycleRemaining = 120;

  let adrenalineInterval = null;
  let adrenalineRemaining = null;
  let adrenalineCount = 0;

  let ceeCount = 0;

  let cordarone300Due = false;
  let cordarone150Due = false;
  let cordarone300Done = false;
  let cordarone150Done = false;

  function logChildAcr(text) {
    if (typeof addLog === "function") {
      addLog(`ACR enfant : ${text}`);
    }
  }

  function formatTime(seconds) {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${minutes}:${secs}`;
  }

  function formatMg(value) {
    if (!Number.isFinite(value)) return "Poids à renseigner";

    const rounded = Math.round(value * 100) / 100;
    return `${rounded.toString().replace(".", ",")} mg`;
  }

  function updateChildAcrDoses() {
    const weightKg = window.pisuPatient?.getWeightKg?.() || null;

    let ceeDose = "Poids à renseigner";
    let adrenalineDose = "Poids à renseigner";
    let cordarone300Dose = "Poids à renseigner";
    let cordarone150Dose = "Poids à renseigner";

    if (weightKg) {
      ceeDose = `${Math.round(weightKg * 4)} J`;
      adrenalineDose = `${formatMg(weightKg * 0.01)} — 10 µg/kg`;
      cordarone300Dose = `${formatMg(Math.min(weightKg * 5, 300))} — max 300 mg`;
      cordarone150Dose = `${formatMg(Math.min(weightKg * 5, 150))} — max 150 mg`;
    }

    if (weightUsed) weightUsed.textContent = weightKg ? `${weightKg} kg` : "Non renseigné";
    if (ceeDoseEl) ceeDoseEl.textContent = ceeDose;
    if (adrenalineDoseEl) adrenalineDoseEl.textContent = adrenalineDose;
    if (cordarone300DoseEl) cordarone300DoseEl.textContent = cordarone300Dose;
    if (cordarone150DoseEl) cordarone150DoseEl.textContent = cordarone150Dose;

    return {
      weightKg,
      ceeDose,
      adrenalineDose,
      cordarone300Dose,
      cordarone150Dose
    };
  }

  function flashAttention(element, times = 4) {
    if (!element) return;

    element.style.setProperty("--flash-count", String(times));
    element.classList.remove("attention-flash");

    void element.offsetWidth;

    element.classList.add("attention-flash");

    window.setTimeout(() => {
      element.classList.remove("attention-flash");
    }, times * 420);
  }

  function flashMany(elements, times = 4) {
    elements.forEach(element => flashAttention(element, times));
  }

  function setCall15State(state) {
    if (!call15Btn || !call15Status) return;

    call15Btn.classList.remove(
      "child-acr-call15-idle",
      "child-acr-call15-alert",
      "child-acr-call15-report",
      "child-acr-call15-done"
    );

    if (state === "alert") {
      call15Btn.classList.add("child-acr-call15-alert");
      call15Status.textContent = "Appel 15 à faire";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "report") {
      call15Btn.classList.add("child-acr-call15-report");
      call15Status.textContent = "Bilan / rappel 15";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "done") {
      call15Btn.classList.add("child-acr-call15-done");
      call15Status.textContent = "15 appelé";
      return;
    }

    call15Btn.classList.add("child-acr-call15-idle");
    call15Status.textContent = "15 disponible";
  }

  function updateCycleTimer() {
    if (timerEl) {
      timerEl.textContent = formatTime(cycleRemaining);
    }
  }

  function startCycleTimer() {
    window.pisuSounds?.startRcpMetronome("childAcrProtocol");

    clearInterval(cycleInterval);
    cycleRemaining = 120;
    updateCycleTimer();

    cycleInterval = setInterval(() => {
      cycleRemaining -= 1;
      updateCycleTimer();

      if (cycleRemaining <= 0) {
        clearInterval(cycleInterval);
        logChildAcr("cycle RCP 2 minutes terminé : analyse de rythme à réaliser");
        flashMany([timerEl, ceeBtn], 4);
      }
    }, 1000);

    logChildAcr("cycle RCP 2 minutes démarré");
  }

  function resetCycleTimer() {
    window.pisuSounds?.stopRcpMetronome();

    clearInterval(cycleInterval);
    cycleRemaining = 120;
    updateCycleTimer();
    logChildAcr("cycle RCP réinitialisé");
  }

  function updateCeeStatus() {
    if (ceeStatus) {
      ceeStatus.textContent = String(ceeCount);
    }
  }

  function updateAdrenalineStatus() {
    if (!adrenalineStatus) return;

    if (adrenalineRemaining === null) {
      adrenalineStatus.textContent = "--:--";
      return;
    }

    adrenalineStatus.textContent = formatTime(Math.max(adrenalineRemaining, 0));
  }

  function startAdrenalineTimer() {
    const doses = updateChildAcrDoses();

    clearInterval(adrenalineInterval);
    adrenalineRemaining = 240;
    adrenalineCount += 1;
    updateAdrenalineStatus();

    adrenalineInterval = setInterval(() => {
      adrenalineRemaining -= 1;
      updateAdrenalineStatus();

      if (adrenalineRemaining <= 0) {
        clearInterval(adrenalineInterval);
        window.pisuSounds?.notifyAdrenalineDue("Adrénaline ACR enfant : délai terminé");
        logChildAcr("rappel Adrénaline : délai 4 minutes atteint");
        flashMany([shockAdrenalineBtn, noShockAdrenalineBtn, adrenalineStatus], 4);
      }
    }, 1000);

    logChildAcr(`Adrénaline enfant sélectionnée — dose rappel : ${doses.adrenalineDose} — dose n°${adrenalineCount}`);
  }

  function updateCordaroneStatus() {
    if (!cordaroneStatus) return;

    if (cordarone300Done && cordarone150Done) {
      cordaroneStatus.textContent = "300+150";
      return;
    }

    if (cordarone300Done && cordarone150Due && !cordarone150Done) {
      cordaroneStatus.textContent = "150 à faire";
      return;
    }

    if (cordarone300Done) {
      cordaroneStatus.textContent = "300 faite";
      return;
    }

    if (cordarone300Due) {
      cordaroneStatus.textContent = "300 à faire";
      return;
    }

    cordaroneStatus.textContent = "--";
  }

  function markCordaroneDose(doseType) {
    const doses = updateChildAcrDoses();

    if (doseType === "300") {
      cordarone300Done = true;
      logChildAcr(`Cordarone 3e CEE sélectionnée — dose rappel : ${doses.cordarone300Dose}`);
    }

    if (doseType === "150") {
      cordarone150Done = true;
      logChildAcr(`Cordarone 5e CEE sélectionnée — dose rappel : ${doses.cordarone150Dose}`);
    }

    updateCordaroneStatus();
  }

  function handleCee() {
    const doses = updateChildAcrDoses();

    ceeCount += 1;
    updateCeeStatus();

    logChildAcr(`CEE n°${ceeCount} — énergie rappel : ${doses.ceeDose} — reprise RCP 2 minutes`);
    startCycleTimer();

    if (ceeCount === 3) {
      cordarone300Due = true;
      updateCordaroneStatus();

      logChildAcr("rappel 3e CEE : Adrénaline 10 µg/kg toutes les 4 min ; Cordarone 5 mg/kg max 300 mg");
      flashMany([shockAdrenalineBtn, cordarone300Btn, adrenalineStatus, cordaroneStatus], 4);
    }

    if (ceeCount === 5) {
      cordarone150Due = true;
      updateCordaroneStatus();

      logChildAcr("rappel 5e CEE : Cordarone 5 mg/kg max 150 mg");
      flashMany([cordarone150Btn, cordaroneStatus], 4);
    }
  }

  function openProtocol() {
    if (!protocol) return;

    if (typeof window.showProtocolPage === "function") {
      window.showProtocolPage("childAcrProtocol");
    } else {
      protocol.classList.remove("hidden");
    }

    updateChildAcrDoses();
    updateCycleTimer();
    updateCeeStatus();
    updateAdrenalineStatus();
    updateCordaroneStatus();

    setCall15State("alert");
    logChildAcr("ouverture protocole");
  }

  function closeProtocol() {
    if (typeof window.showMainMenu === "function") {
      window.showMainMenu();
      return;
    }

    protocol?.classList.add("hidden");
  }

  function resetChildAcrProtocolWithSecurity() {
    const confirmation = window.confirm(
      "Remettre à zéro le protocole ACR enfant ?\n\nCette action réinitialise les compteurs, timers et validations du protocole, mais conserve le journal mission."
    );

    if (!confirmation) {
      logChildAcr("reset protocole ACR enfant annulé");
      return;
    }

    clearInterval(cycleInterval);
    window.pisuSounds?.stopRcpMetronome();
    cycleRemaining = 120;
    updateCycleTimer();

    clearInterval(adrenalineInterval);
    adrenalineRemaining = null;
    adrenalineCount = 0;
    updateAdrenalineStatus();

    ceeCount = 0;
    updateCeeStatus();

    cordarone300Due = false;
    cordarone150Due = false;
    cordarone300Done = false;
    cordarone150Done = false;
    updateCordaroneStatus();

    shockBranch?.classList.add("hidden");
    noShockBranch?.classList.add("hidden");
    racsBranch?.classList.add("hidden");

    localStorage.removeItem("pisu-counter-child-cee");
    localStorage.removeItem("pisu-counter-child-adrenaline");
    localStorage.removeItem("pisu-counter-child-cordarone");

    protocol.querySelectorAll(".action-done, [data-count-badge]").forEach(button => {
      button.classList.remove("action-done", "click-feedback", "attention-flash");
      delete button.dataset.clickCount;
    });

    updateChildAcrDoses();
    setCall15State("alert");

    logChildAcr("protocole ACR enfant remis à zéro");
  }

  openBtn?.addEventListener("click", openProtocol);
  closeBtn?.addEventListener("click", closeProtocol);

  call15Btn?.addEventListener("click", () => {
    logChildAcr("appel au 15 déclenché depuis l’application");
    setCall15State("done");
  });

  startTimerBtn?.addEventListener("click", startCycleTimer);
  resetTimerBtn?.addEventListener("click", resetCycleTimer);
  refreshDosesBtn?.addEventListener("click", () => {
    const doses = updateChildAcrDoses();
    logChildAcr(
      `doses recalculées — poids : ${doses.weightKg || "non renseigné"} kg — CEE : ${doses.ceeDose} — Adrénaline : ${doses.adrenalineDose} — Cordarone 3e : ${doses.cordarone300Dose} — Cordarone 5e : ${doses.cordarone150Dose}`
    );
  });

  shockIndicatedBtn?.addEventListener("click", () => {
    shockBranch?.classList.remove("hidden");
    noShockBranch?.classList.add("hidden");
    racsBranch?.classList.add("hidden");

    logChildAcr("choc indiqué : FV / TV sans pouls");
  });

  shockNotIndicatedBtn?.addEventListener("click", () => {
    noShockBranch?.classList.remove("hidden");
    shockBranch?.classList.add("hidden");
    racsBranch?.classList.add("hidden");

    logChildAcr("choc non indiqué : asystolie / AESP");
    flashAttention(noShockAdrenalineBtn, 4);
  });

  racsBtn?.addEventListener("click", () => {
    window.pisuSounds?.stopRcpMetronome();
    racsBranch?.classList.remove("hidden");
    shockBranch?.classList.add("hidden");
    noShockBranch?.classList.add("hidden");

    setCall15State("report");
    logChildAcr("RACS : appel au 15 et prise en charge post-RACS");
  });

  resetBtn?.addEventListener("click", resetChildAcrProtocolWithSecurity);

  document.querySelectorAll("[data-child-acr-action]").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.childAcrAction;

      if (button.dataset.childCee === "true") {
        handleCee();
        return;
      }

      logChildAcr(action);

      if (button.dataset.childStartCycle === "true") {
        startCycleTimer();
      }

      if (button.dataset.childAdrenaline === "true") {
        startAdrenalineTimer();
      }

      if (button.dataset.childCordarone) {
        markCordaroneDose(button.dataset.childCordarone);
      }
    });
  });
})();
