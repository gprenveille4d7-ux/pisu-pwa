(function () {
  const openBtn = document.getElementById("openAcrAdultBtn");
  const closeBtn = document.getElementById("closeAcrAdultBtn");
  const protocol = document.getElementById("acrAdultProtocol");

  const call15Btn = document.getElementById("call15Btn");
  const call15Status = document.getElementById("call15Status");

  const acrTimerEl = document.getElementById("acrTimer");
  const stickyAcrTimerEl = document.getElementById("stickyAcrTimer");
  const stickyCeeCounter = document.getElementById("stickyCeeCounter");
  const adrenalineTimerEl = document.getElementById("adrenalineTimer");
  const adrenalineStatusEl = document.getElementById("adrenalineStatus");
  const stickyAdrenalineCard = document.getElementById("stickyAdrenalineCard");
  const stickyCordaroneCard = document.getElementById("stickyCordaroneCard");
  const cordaroneMainStatus = document.getElementById("cordaroneMainStatus");
  const cordaroneStatus = document.getElementById("cordaroneStatus");
  const startTimerBtn = document.getElementById("acrStartTimer");
  const resetTimerBtn = document.getElementById("acrResetTimer");
  const resetAcrProtocolBtn = document.getElementById("resetAcrProtocolBtn");

  const shockBranch = document.getElementById("shockBranch");
  const noShockBranch = document.getElementById("noShockBranch");
  const racsBranch = document.getElementById("racsBranch");

  const showShockBranchBtn = document.getElementById("showShockBranchBtn");
  const showNoShockBranchBtn = document.getElementById("showNoShockBranchBtn");
  const showRacsBranchBtn = document.getElementById("showRacsBranchBtn");
  const analysisBtn = document.getElementById("analysisBtn");
  const shockAdrenalineBtn = document.getElementById("shockAdrenalineBtn");
  const noShockAdrenalineBtn = document.getElementById("noShockAdrenalineBtn");
  const cordarone300Btn = document.getElementById("cordarone300Btn");
  const cordarone150Btn = document.getElementById("cordarone150Btn");
  const racsCall15Btn = document.getElementById("racsCall15Btn");

  const ceeCounter = document.getElementById("ceeCounter");
  const shockMedsReminder = document.getElementById("shockMedsReminder");

  let acrTimerInterval = null;
  let acrRemaining = 120;
  let ceeCount = 0;

  let adrenalineInterval = null;
  let adrenalineRemaining = null;
  let adrenalineCount = 0;

  let cordarone300Due = false;
  let cordarone150Due = false;
  let cordarone300Done = false;
  let cordarone150Done = false;

  function logAcr(text) {
    if (typeof addLog === "function") {
      addLog(`ACR adulte : ${text}`);
    }
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

  function formatAcrSeconds(seconds) {
    if (typeof formatTime === "function") {
      return formatTime(seconds);
    }

    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${minutes}:${secs}`;
  }

  function updateAcrTimer() {
    const value = formatAcrSeconds(acrRemaining);

    if (acrTimerEl) {
      acrTimerEl.textContent = value;
    }

    if (stickyAcrTimerEl) {
      stickyAcrTimerEl.textContent = value;
    }
  }

  function startAcrTimer() {
    window.pisuSounds?.startRcpMetronome("acrAdultProtocol");

    clearInterval(acrTimerInterval);

    if (acrRemaining <= 0) {
      acrRemaining = 120;
    }

    updateAcrTimer();
    logAcr("début cycle RCP 2 minutes");

    acrTimerInterval = setInterval(() => {
      acrRemaining -= 1;
      updateAcrTimer();

      if (acrRemaining <= 0) {
        clearInterval(acrTimerInterval);
        logAcr("fin cycle RCP 2 minutes — analyse de rythme à réaliser");

        flashAttention(analysisBtn, 4);

        if ("vibrate" in navigator) {
          navigator.vibrate([250, 150, 250]);
        }
      }
    }, 1000);
  }

  function resetAcrTimer() {
    window.pisuSounds?.stopRcpMetronome();

    clearInterval(acrTimerInterval);
    acrRemaining = 120;
    updateAcrTimer();
    logAcr("chrono 2 minutes réinitialisé");
  }

  function setCall15State(state) {
    if (!call15Btn || !call15Status) return;

    call15Btn.classList.remove("samu15-alert", "samu15-done", "samu15-rosc");

    if (state === "done") {
      call15Btn.classList.add("samu15-done");
      call15Status.textContent = "15 appelé";
      return;
    }

    if (state === "rosc") {
      call15Btn.classList.add("samu15-rosc");
      call15Status.textContent = "RACS : bilan / rappel 15";
      return;
    }

    call15Btn.classList.add("samu15-alert");
    call15Status.textContent = "Appel 15 à faire";
  }

  function openProtocol() {
    if (!protocol) return;

    if (typeof window.showProtocolPage === "function") {
      window.showProtocolPage("acrAdultProtocol");
    } else {
      protocol.classList.remove("hidden");
    }

    setCall15State("alert");
    logAcr("ouverture protocole");
  }

  function closeProtocol() {
    if (typeof window.showMainMenu === "function") {
      window.showMainMenu();
      return;
    }

    if (!protocol) return;
    protocol.classList.add("hidden");
  }

  function hideBranches() {
    shockBranch?.classList.add("hidden");
    noShockBranch?.classList.add("hidden");
    racsBranch?.classList.add("hidden");
  }

  function showBranch(branch) {
    hideBranches();

    if (branch === "shock") {
      shockBranch?.classList.remove("hidden");
      return;
    }

    if (branch === "noShock") {
      noShockBranch?.classList.remove("hidden");
      return;
    }

    if (branch === "racs") {
      racsBranch?.classList.remove("hidden");
      setCall15State("rosc");
    }
  }

  function updateCeeCounter() {
    if (ceeCounter) {
      ceeCounter.textContent = `CEE : ${ceeCount}`;
    }

    if (stickyCeeCounter) {
      stickyCeeCounter.textContent = ceeCount;
    }

    if (ceeCount >= 3) {
      shockMedsReminder?.classList.remove("hidden");
    }
  }

  function updateAdrenalineTimer() {
    if (!adrenalineTimerEl || !adrenalineStatusEl || !stickyAdrenalineCard) return;

    if (adrenalineRemaining === null) {
      adrenalineTimerEl.textContent = "--:--";
      adrenalineStatusEl.textContent = "Non administrée";
      stickyAdrenalineCard.classList.remove("running", "expired");
      stickyAdrenalineCard.classList.add("idle");
      return;
    }

    adrenalineTimerEl.textContent = formatAcrSeconds(Math.max(adrenalineRemaining, 0));
    adrenalineStatusEl.textContent = `Dose n°${adrenalineCount}`;

    stickyAdrenalineCard.classList.remove("idle");

    if (adrenalineRemaining <= 0) {
      stickyAdrenalineCard.classList.remove("running");
      stickyAdrenalineCard.classList.add("expired");
      adrenalineStatusEl.textContent = `Dose n°${adrenalineCount} — délai 4 min écoulé`;
      return;
    }

    stickyAdrenalineCard.classList.remove("expired");
    stickyAdrenalineCard.classList.add("running");
  }

  function updateCordaroneStatus() {
    if (!stickyCordaroneCard || !cordaroneMainStatus || !cordaroneStatus) return;

    stickyCordaroneCard.classList.remove("idle", "due", "done");

    if (cordarone300Done && cordarone150Done) {
      cordaroneMainStatus.textContent = "300 + 150";
      cordaroneStatus.textContent = "Doses faites";
      stickyCordaroneCard.classList.add("done");
      return;
    }

    if (cordarone300Done && cordarone150Due && !cordarone150Done) {
      cordaroneMainStatus.textContent = "150 mg";
      cordaroneStatus.textContent = "À faire";
      stickyCordaroneCard.classList.add("due");
      return;
    }

    if (cordarone300Done) {
      cordaroneMainStatus.textContent = "300 mg";
      cordaroneStatus.textContent = "Faite";
      stickyCordaroneCard.classList.add("done");
      return;
    }

    if (cordarone300Due && cordarone150Due) {
      cordaroneMainStatus.textContent = "300 + 150";
      cordaroneStatus.textContent = "À vérifier";
      stickyCordaroneCard.classList.add("due");
      return;
    }

    if (cordarone300Due) {
      cordaroneMainStatus.textContent = "300 mg";
      cordaroneStatus.textContent = "À faire";
      stickyCordaroneCard.classList.add("due");
      return;
    }

    cordaroneMainStatus.textContent = "--";
    cordaroneStatus.textContent = "Non indiquée";
    stickyCordaroneCard.classList.add("idle");
  }

  function markCordaroneDose(dose) {
    if (dose === "300") {
      cordarone300Done = true;
      logAcr("Cordarone 300 mg validée dans le suivi visible");
    }

    if (dose === "150") {
      cordarone150Done = true;
      logAcr("Cordarone 150 mg validée dans le suivi visible");
    }

    updateCordaroneStatus();
  }

  function startAdrenalineTimer() {
    clearInterval(adrenalineInterval);

    adrenalineCount += 1;
    adrenalineRemaining = 240;

    updateAdrenalineTimer();

    logAcr(`Adrénaline dose n°${adrenalineCount} sélectionnée — prochain rappel dans 4 minutes`);

    adrenalineInterval = setInterval(() => {
      adrenalineRemaining -= 1;
      updateAdrenalineTimer();

      if (adrenalineRemaining <= 0) {
        clearInterval(adrenalineInterval);
        window.pisuSounds?.notifyAdrenalineDue("Adrénaline ACR adulte : délai terminé");
        logAcr("Adrénaline : délai de 4 minutes écoulé — réévaluer selon protocole");

        if ("vibrate" in navigator) {
          navigator.vibrate([350, 150, 350, 150, 350]);
        }
      }
    }, 1000);
  }

  function handleCee() {
    ceeCount += 1;
    updateCeeCounter();

    logAcr(`CEE n°${ceeCount} réalisé — 150-200 J puis reprise RCP immédiate pour 2 minutes`);

    if (ceeCount === 3) {
      cordarone300Due = true;
      updateCordaroneStatus();

      logAcr("rappel protocole : à partir du 3e CEE, Adrénaline 1 mg toutes les 4 min ; au 3e CEE, Cordarone 300 mg");

      flashMany([shockAdrenalineBtn, cordarone300Btn, stickyCordaroneCard], 4);
    }

    if (ceeCount === 5) {
      cordarone150Due = true;
      updateCordaroneStatus();

      logAcr("rappel protocole : au 5e CEE, Cordarone 150 mg");

      flashMany([cordarone150Btn, stickyCordaroneCard], 4);
    }

    startAcrTimer();
  }

  openBtn?.addEventListener("click", openProtocol);
  closeBtn?.addEventListener("click", closeProtocol);

  call15Btn?.addEventListener("click", () => {
    logAcr("appel au 15 déclenché depuis l'application");
    setCall15State("done");
  });

  startTimerBtn?.addEventListener("click", startAcrTimer);
  resetTimerBtn?.addEventListener("click", resetAcrTimer);
  resetAcrProtocolBtn?.addEventListener("click", resetAcrProtocolWithSecurity);

  showShockBranchBtn?.addEventListener("click", () => {
    showBranch("shock");
  });

  showNoShockBranchBtn?.addEventListener("click", () => {
    showBranch("noShock");
    flashAttention(noShockAdrenalineBtn, 4);
  });

  showRacsBranchBtn?.addEventListener("click", () => {
    window.pisuSounds?.stopRcpMetronome();
    showBranch("racs");
    flashAttention(racsCall15Btn, 4);
  });

  document.querySelectorAll("[data-acr-action]").forEach(button => {
    button.addEventListener("click", () => {
      const action = button.dataset.acrAction;

      if (button.dataset.cee === "true") {
        handleCee();
        return;
      }

      logAcr(action);

      if (button.dataset.adrenaline === "true") {
        startAdrenalineTimer();
      }

      if (button.dataset.cordarone) {
        markCordaroneDose(button.dataset.cordarone);
      }

      if (button.dataset.startCycle === "true") {
        startAcrTimer();
      }

      if (button.dataset.samuState) {
        setCall15State(button.dataset.samuState);
      }
    });
  });

  function resetAcrProtocolWithSecurity(options = {}) {
    if (!options.skipConfirmation) {
      const confirmation = window.confirm(
        "Remettre à zéro le protocole ACR adulte ?\n\nCette action réinitialise les compteurs et les validations du protocole, mais conserve le journal mission."
      );

      if (!confirmation) {
        logAcr("reset protocole ACR adulte annulé");
        return;
      }
    }

    clearInterval(acrTimerInterval);
    window.pisuSounds?.stopRcpMetronome();
    acrRemaining = 120;
    updateAcrTimer();

    clearInterval(adrenalineInterval);
    adrenalineRemaining = null;
    adrenalineCount = 0;
    updateAdrenalineTimer();

    ceeCount = 0;
    updateCeeCounter();

    cordarone300Due = false;
    cordarone150Due = false;
    cordarone300Done = false;
    cordarone150Done = false;
    updateCordaroneStatus();

    shockMedsReminder?.classList.add("hidden");
    shockBranch?.classList.add("hidden");
    noShockBranch?.classList.add("hidden");
    racsBranch?.classList.add("hidden");

    localStorage.removeItem("pisu-counter-cee");
    localStorage.removeItem("pisu-counter-adrenaline");
    localStorage.removeItem("pisu-counter-cordarone");

    protocol.querySelectorAll(".action-done").forEach(button => {
      button.classList.remove("action-done", "click-feedback", "attention-flash");
      delete button.dataset.clickCount;
    });

    setCall15State("alert");

    if (!options.silent) {
      logAcr("protocole ACR adulte remis à zéro");
    }
  }

  window.addEventListener("pisu:mission-reset", () => {
    resetAcrProtocolWithSecurity({ skipConfirmation: true, silent: true });
  });

  updateAcrTimer();
  updateCeeCounter();
  updateAdrenalineTimer();
  updateCordaroneStatus();
})();
