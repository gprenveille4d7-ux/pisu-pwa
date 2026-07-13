(function () {
  const openBtn = document.getElementById("openChestPainBtn");
  const closeBtn = document.getElementById("closeChestPainBtn");
  const protocol = document.getElementById("chestPainProtocol");

  const call15Btn = document.getElementById("dtCall15Btn");
  const call15Status = document.getElementById("dtCall15Status");

  const gravityStatus = document.getElementById("dtGravityStatus");
  const ecgStatus = document.getElementById("dtEcgStatus");
  const assessmentStatus = document.getElementById("dtAssessmentStatus");

  const constantsBtn = document.getElementById("dtConstantsBtn");
  const severityBtn = document.getElementById("dtSeverityBtn");
  const noSeverityBtn = document.getElementById("dtNoSeverityBtn");
  const patchesBtn = document.getElementById("dtPatchesBtn");

  const ecgBtn = document.getElementById("dtEcgBtn");
  const d2Btn = document.getElementById("dtD2Btn");
  const paBothArmsBtn = document.getElementById("dtPaBothArmsBtn");

  const report15Btn = document.getElementById("dtReport15Btn");
  const resetChestPainProtocolBtn = document.getElementById("resetChestPainProtocolBtn");

  function logDt(text) {
    if (typeof addLog === "function") {
      addLog(`Douleur thoracique : ${text}`);
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

  function setCall15State(state) {
    if (!call15Btn || !call15Status) return;

    call15Btn.classList.remove("dt-call15-idle", "dt-call15-alert", "dt-call15-report", "dt-call15-done");

    if (state === "alert") {
      call15Btn.classList.add("dt-call15-alert");
      call15Status.textContent = "Appel 15 immédiat";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "report") {
      call15Btn.classList.add("dt-call15-report");
      call15Status.textContent = "Bilan 15 à transmettre";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "done") {
      call15Btn.classList.add("dt-call15-done");
      call15Status.textContent = "15 appelé";
      return;
    }

    call15Btn.classList.add("dt-call15-idle");
    call15Status.textContent = "15 si gravité, puis bilan complet";
  }

  function openProtocol() {
    if (!protocol) return;

    if (typeof window.showProtocolPage === "function") {
      window.showProtocolPage("chestPainProtocol");
    } else {
      protocol.classList.remove("hidden");
    }

    setCall15State("idle");
    logDt("ouverture protocole");
  }

  function closeProtocol() {
    if (typeof window.showMainMenu === "function") {
      window.showMainMenu();
      return;
    }

    if (!protocol) return;
    protocol.classList.add("hidden");
  }

  openBtn?.addEventListener("click", openProtocol);
  closeBtn?.addEventListener("click", closeProtocol);

  call15Btn?.addEventListener("click", () => {
    logDt("appel au 15 déclenché depuis l'application");
    setCall15State("done");
  });

  constantsBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Constantes";
    logDt("ouverture du module constantes demandée");
    openVitalsSheet?.();
  });

  severityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Gravité +";
    logDt("signes de gravité ou anomalie significative sur les constantes");
    setCall15State("alert");
  });

  noSeverityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Pas de gravité";
    logDt("absence de signes de gravité");
  });

  patchesBtn?.addEventListener("click", () => {
    logDt("patchs de défibrillation posés");
  });

  ecgBtn?.addEventListener("click", () => {
    ecgStatus.textContent = "ECG fait";
    logDt("ECG 18 dérivations réalisé");
  });

  d2Btn?.addEventListener("click", () => {
    logDt("D2 long réalisé");
  });

  paBothArmsBtn?.addEventListener("click", () => {
    logDt("PA réalisée aux deux bras");
  });

  report15Btn?.addEventListener("click", () => {
    assessmentStatus.textContent = "Bilan prêt";
    logDt("bilan douleur thoracique prêt pour appel au 15");
    setCall15State("report");
  });

  document.querySelectorAll("[data-dt-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (
        button === constantsBtn ||
        button === severityBtn ||
        button === noSeverityBtn ||
        button === patchesBtn ||
        button === ecgBtn ||
        button === d2Btn ||
        button === paBothArmsBtn ||
        button === report15Btn
      ) {
        return;
      }

      logDt(button.dataset.dtAction);
    });
  });

  function resetChestPainProtocolWithSecurity(options = {}) {
    if (!options.skipConfirmation) {
      const confirmation = window.confirm(
        "Remettre à zéro le protocole douleur thoracique ?\n\nCette action réinitialise les statuts et les validations du protocole, mais conserve le journal mission."
      );

      if (!confirmation) {
        logDt("reset protocole douleur thoracique annulé");
        return;
      }
    }

    gravityStatus.textContent = "À évaluer";
    ecgStatus.textContent = "À faire";
    assessmentStatus.textContent = "En cours";

    setCall15State("idle");

    protocol.querySelectorAll(".action-done").forEach(button => {
      button.classList.remove("action-done", "click-feedback", "attention-flash");
      delete button.dataset.clickCount;
    });

    if (!options.silent) {
      logDt("protocole douleur thoracique remis à zéro");
    }
  }

  window.addEventListener("pisu:mission-reset", () => {
    resetChestPainProtocolWithSecurity({ skipConfirmation: true, silent: true });
  });

  resetChestPainProtocolBtn?.addEventListener("click", resetChestPainProtocolWithSecurity);
})();
