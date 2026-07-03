(function () {
  const openBtn = document.getElementById("openHemorrhageBtn");
  const closeBtn = document.getElementById("closeHemorrhageBtn");
  const protocol = document.getElementById("hemorrhageProtocol");

  const call15Btn = document.getElementById("hemorrhageCall15Btn");
  const call15Status = document.getElementById("hemorrhageCall15Status");

  const mStatus = document.getElementById("hemorrhageMStatus");
  const aStatus = document.getElementById("hemorrhageAStatus");
  const rStatus = document.getElementById("hemorrhageRStatus");
  const cStatus = document.getElementById("hemorrhageCStatus");
  const hStatus = document.getElementById("hemorrhageHStatus");

  const weightUsed = document.getElementById("hemorrhageWeightUsed");
  const pediatricFluidDose = document.getElementById("hemorrhagePediatricFluidDose");
  const txaDoseEl = document.getElementById("hemorrhageTxaDose");
  const refreshDosesBtn = document.getElementById("refreshHemorrhageDosesBtn");

  const manualCompressionBtn = document.getElementById("hemorrhageManualCompressionBtn");
  const ktioBtn = document.getElementById("hemorrhageKtioBtn");
  const goalsNotReachedBtn = document.getElementById("hemorrhageGoalsNotReachedBtn");
  const txaBtn = document.getElementById("hemorrhageTxaBtn");
  const engagementBtn = document.getElementById("hemorrhageEngagementBtn");
  const evacuationBtn = document.getElementById("hemorrhageEvacuationBtn");
  const resetBtn = document.getElementById("resetHemorrhageProtocolBtn");

  function logHemorrhage(text) {
    if (typeof addLog === "function") {
      addLog(`Hémorragie sévère : ${text}`);
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

    call15Btn.classList.remove(
      "hemorrhage-call15-idle",
      "hemorrhage-call15-alert",
      "hemorrhage-call15-report",
      "hemorrhage-call15-done"
    );

    if (state === "alert") {
      call15Btn.classList.add("hemorrhage-call15-alert");
      call15Status.textContent = "Appel 15 immédiat";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "report") {
      call15Btn.classList.add("hemorrhage-call15-report");
      call15Status.textContent = "Bilan 15 à transmettre";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "done") {
      call15Btn.classList.add("hemorrhage-call15-done");
      call15Status.textContent = "15 appelé";
      return;
    }

    call15Btn.classList.add("hemorrhage-call15-idle");
    call15Status.textContent = "15 si échec / aggravation / bilan";
  }

  function formatMg(value) {
    if (!Number.isFinite(value)) return "Non calculable";
    const rounded = Math.round(value * 100) / 100;
    return `${rounded.toString().replace(".", ",")} mg`;
  }

  function updateHemorrhageDoses() {
    const weightKg = window.pisuPatient?.getWeightKg?.() || null;
    const ageYears = window.pisuPatient?.getAgeYears?.() ?? null;

    let pediatricFluid = "Poids à renseigner";
    let txaDose = "Poids / âge à renseigner";

    if (weightKg) {
      pediatricFluid = `${Math.round(weightKg * 10)} ml par remplissage`;
    }

    if (ageYears !== null) {
      if (ageYears < 8 && weightKg) {
        txaDose = `${formatMg(Math.min(weightKg * 10, 1000))} max 1 g`;
      } else if (ageYears >= 8) {
        txaDose = "1 g";
      }
    }

    if (weightUsed) {
      weightUsed.textContent = weightKg ? `${weightKg} kg` : "Non renseigné";
    }

    if (pediatricFluidDose) {
      pediatricFluidDose.textContent = pediatricFluid;
    }

    if (txaDoseEl) {
      txaDoseEl.textContent = txaDose;
    }

    return {
      weightKg,
      ageYears,
      pediatricFluid,
      txaDose
    };
  }

  function openProtocol() {
    if (!protocol) return;

    if (typeof window.showProtocolPage === "function") {
      window.showProtocolPage("hemorrhageProtocol");
    } else {
      protocol.classList.remove("hidden");
    }

    updateHemorrhageDoses();
    setCall15State("idle");
    logHemorrhage("ouverture protocole");
  }

  function closeProtocol() {
    if (typeof window.showMainMenu === "function") {
      window.showMainMenu();
      return;
    }

    protocol?.classList.add("hidden");
  }

  function resetHemorrhageProtocolWithSecurity() {
    const confirmation = window.confirm(
      "Remettre à zéro le protocole hémorragie sévère ?\n\nCette action réinitialise les statuts et les validations du protocole, mais conserve le journal mission."
    );

    if (!confirmation) {
      logHemorrhage("reset protocole hémorragie sévère annulé");
      return;
    }

    mStatus.textContent = "Saignement";
    aStatus.textContent = "VAS";
    rStatus.textContent = "Resp.";
    cStatus.textContent = "Circul.";
    hStatus.textContent = "Hypo.";

    localStorage.removeItem("pisu-counter-hemorrhage-txa");

    setCall15State("idle");

    protocol.querySelectorAll(".action-done, [data-count-badge]").forEach(button => {
      button.classList.remove("action-done", "click-feedback", "attention-flash");
      delete button.dataset.clickCount;
    });

    updateHemorrhageDoses();

    logHemorrhage("protocole hémorragie sévère remis à zéro");
  }

  openBtn?.addEventListener("click", openProtocol);
  closeBtn?.addEventListener("click", closeProtocol);

  call15Btn?.addEventListener("click", () => {
    logHemorrhage("appel au 15 déclenché depuis l’application");
    setCall15State("done");
  });

  refreshDosesBtn?.addEventListener("click", () => {
    const doses = updateHemorrhageDoses();
    logHemorrhage(
      `doses recalculées — poids : ${doses.weightKg || "non renseigné"} kg — âge : ${doses.ageYears ?? "non renseigné"} ans — remplissage pédiatrique : ${doses.pediatricFluid} — Exacyl : ${doses.txaDose}`
    );
  });

  manualCompressionBtn?.addEventListener("click", () => {
    mStatus.textContent = "Contrôlé";
    logHemorrhage("compression manuelle réalisée");
  });

  ktioBtn?.addEventListener("click", () => {
    cStatus.textContent = "KTIO ?";
    logHemorrhage("échec VVP : appel au 15 pour discuter KTIO");
    setCall15State("alert");
  });

  goalsNotReachedBtn?.addEventListener("click", () => {
    cStatus.textContent = "Échec obj.";
    logHemorrhage("objectifs non atteints malgré les remplissages : appel au 15");
    setCall15State("alert");
  });

  txaBtn?.addEventListener("click", () => {
    const doses = updateHemorrhageDoses();
    cStatus.textContent = "Exacyl";
    logHemorrhage(`Acide tranexamique / Exacyl sélectionné — dose rappel : ${doses.txaDose}`);
  });

  engagementBtn?.addEventListener("click", () => {
    hStatus.textContent = "Engagement";
    logHemorrhage("signes d’engagement intracérébral présents : appel au 15");
    setCall15State("alert");
  });

  evacuationBtn?.addEventListener("click", () => {
    logHemorrhage("évacuation : appel au 15 pour bilan");
    setCall15State("report");
  });

  resetBtn?.addEventListener("click", resetHemorrhageProtocolWithSecurity);

  document.querySelectorAll("[data-hemo-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (
        button === manualCompressionBtn ||
        button === ktioBtn ||
        button === goalsNotReachedBtn ||
        button === txaBtn ||
        button === engagementBtn ||
        button === evacuationBtn
      ) {
        return;
      }

      const action = button.dataset.hemoAction;
      logHemorrhage(action);

      if (action.includes("Corps étrangers") || action.includes("Sécurisation")) {
        aStatus.textContent = "Fait";
      }

      if (action.includes("Ventilation") || action.includes("Oxygénothérapie") || action.includes("thoracique")) {
        rStatus.textContent = "Fait";
      }

      if (action.includes("Voie d’abord") || action.includes("Remplissage") || action.includes("HemoCue") || action.includes("Objectifs")) {
        cStatus.textContent = "En cours";
      }

      if (action.includes("Hypothermie") || action.includes("Immobilisation") || action.includes("Hypoglycémie") || action.includes("Examen")) {
        hStatus.textContent = "Fait";
      }
    });
  });
})();
