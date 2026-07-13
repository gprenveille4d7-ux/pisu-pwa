(function () {
  const openBtn = document.getElementById("openAnaphylaxisBtn");
  const closeBtn = document.getElementById("closeAnaphylaxisBtn");
  const protocol = document.getElementById("anaphylaxisProtocol");

  const call15Btn = document.getElementById("anaphylaxisCall15Btn");
  const call15Status = document.getElementById("anaphylaxisCall15Status");

  const gravityStatus = document.getElementById("anaphylaxisGravityStatus");
  const confirmStatus = document.getElementById("anaphylaxisConfirmStatus");
  const adrenalineStatus = document.getElementById("anaphylaxisAdrenalineStatus");
  const reportStatus = document.getElementById("anaphylaxisReportStatus");

  const confirmedBranch = document.getElementById("anaphylaxisConfirmedBranch");
  const notConfirmedBranch = document.getElementById("anaphylaxisNotConfirmedBranch");

  const constantsBtn = document.getElementById("anaphylaxisConstantsBtn");
  const severityBtn = document.getElementById("anaphylaxisSeverityBtn");
  const noSeverityBtn = document.getElementById("anaphylaxisNoSeverityBtn");
  const evictionBtn = document.getElementById("anaphylaxisEvictionBtn");

  const criteriaUrticariaBtn = document.getElementById("anaphylaxisCriteriaUrticariaBtn");
  const criteriaTwoSystemsBtn = document.getElementById("anaphylaxisCriteriaTwoSystemsBtn");
  const criteriaHypotensionBtn = document.getElementById("anaphylaxisCriteriaHypotensionBtn");
  const notConfirmedBtn = document.getElementById("anaphylaxisNotConfirmedBtn");

  const weightUsed = document.getElementById("anaphylaxisWeightUsed");
  const adrenalineDoseEl = document.getElementById("anaphylaxisAdrenalineDose");
  const penDoseEl = document.getElementById("anaphylaxisPenDose");
  const methylpredDoseEl = document.getElementById("anaphylaxisMethylpredDose");
  const refreshDosesBtn = document.getElementById("refreshAnaphylaxisDosesBtn");

  const adrenalineBtn = document.getElementById("anaphylaxisAdrenalineBtn");
  const methylpredBtn = document.getElementById("anaphylaxisMethylpredBtn");
  const report15Btn = document.getElementById("anaphylaxisReport15Btn");
  const resetBtn = document.getElementById("resetAnaphylaxisProtocolBtn");

  function logAnaphylaxis(text) {
    if (typeof addLog === "function") {
      addLog(`Anaphylaxie : ${text}`);
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
      "anaphylaxis-call15-idle",
      "anaphylaxis-call15-alert",
      "anaphylaxis-call15-report",
      "anaphylaxis-call15-done"
    );

    if (state === "alert") {
      call15Btn.classList.add("anaphylaxis-call15-alert");
      call15Status.textContent = "Appel 15 immédiat";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "report") {
      call15Btn.classList.add("anaphylaxis-call15-report");
      call15Status.textContent = "Bilan 15 à transmettre";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "done") {
      call15Btn.classList.add("anaphylaxis-call15-done");
      call15Status.textContent = "15 appelé";
      return;
    }

    call15Btn.classList.add("anaphylaxis-call15-idle");
    call15Status.textContent = "15 si gravité / bilan";
  }

  function formatDose(value) {
    if (!Number.isFinite(value)) return "Poids à renseigner";

    const rounded = Math.round(value * 100) / 100;
    return `${rounded.toString().replace(".", ",")} mg`;
  }

  function getPenDose(weightKg) {
    if (!weightKg) return "Poids à renseigner";

    if (weightKg >= 7.5 && weightKg <= 25) {
      return "0,15 mg";
    }

    if (weightKg > 25) {
      return "0,3 mg";
    }

    return "Poids < 7,5 kg : avis médical";
  }

  function updateAnaphylaxisDoses() {
    const weightKg = window.pisuPatient?.getWeightKg?.() || null;

    const adrenalineDose = weightKg
      ? Math.min(weightKg * 0.01, 0.5)
      : null;

    const methylpredDose = weightKg
      ? weightKg * 1
      : null;

    const penDose = getPenDose(weightKg);

    if (weightUsed) {
      weightUsed.textContent = weightKg ? `${weightKg} kg` : "Non renseigné";
    }

    if (adrenalineDoseEl) {
      adrenalineDoseEl.textContent = adrenalineDose ? formatDose(adrenalineDose) : "Poids à renseigner";
    }

    if (penDoseEl) {
      penDoseEl.textContent = penDose;
    }

    if (methylpredDoseEl) {
      methylpredDoseEl.textContent = methylpredDose ? formatDose(methylpredDose) : "Poids à renseigner";
    }

    return {
      weightKg,
      adrenalineDose: adrenalineDose ? formatDose(adrenalineDose) : "Poids à renseigner",
      penDose,
      methylpredDose: methylpredDose ? formatDose(methylpredDose) : "Poids à renseigner"
    };
  }

  function openProtocol() {
    if (!protocol) return;

    if (typeof window.showProtocolPage === "function") {
      window.showProtocolPage("anaphylaxisProtocol");
    } else {
      protocol.classList.remove("hidden");
    }

    updateAnaphylaxisDoses();
    setCall15State("idle");
    logAnaphylaxis("ouverture protocole");
  }

  function closeProtocol() {
    if (typeof window.showMainMenu === "function") {
      window.showMainMenu();
      return;
    }

    protocol?.classList.add("hidden");
  }

  function showConfirmedBranch(reason) {
    confirmedBranch?.classList.remove("hidden");
    notConfirmedBranch?.classList.add("hidden");

    confirmStatus.textContent = "Confirmée";
    reportStatus.textContent = "À transmettre";

    updateAnaphylaxisDoses();

    logAnaphylaxis(`anaphylaxie confirmée : ${reason}`);

    flashAttention(adrenalineBtn, 4);
  }

  function resetAnaphylaxisProtocolWithSecurity(options = {}) {
    if (!options.skipConfirmation) {
      const confirmation = window.confirm(
        "Remettre à zéro le protocole anaphylaxie ?\n\nCette action réinitialise les statuts et les validations du protocole, mais conserve le journal mission."
      );

      if (!confirmation) {
        logAnaphylaxis("reset protocole anaphylaxie annulé");
        return;
      }
    }

    gravityStatus.textContent = "À évaluer";
    confirmStatus.textContent = "À confirmer";
    adrenalineStatus.textContent = "En attente";
    reportStatus.textContent = "En cours";

    confirmedBranch?.classList.add("hidden");
    notConfirmedBranch?.classList.add("hidden");

    localStorage.removeItem("pisu-counter-anaphylaxis-adrenaline");

    setCall15State("idle");

    protocol.querySelectorAll(".action-done, [data-count-badge]").forEach(button => {
      button.classList.remove("action-done", "click-feedback", "attention-flash");
      delete button.dataset.clickCount;
    });

    updateAnaphylaxisDoses();

    if (!options.silent) {
      logAnaphylaxis("protocole anaphylaxie remis à zéro");
    }
  }

  window.addEventListener("pisu:mission-reset", () => {
    resetAnaphylaxisProtocolWithSecurity({ skipConfirmation: true, silent: true });
  });

  openBtn?.addEventListener("click", openProtocol);
  closeBtn?.addEventListener("click", closeProtocol);

  call15Btn?.addEventListener("click", () => {
    logAnaphylaxis("appel au 15 déclenché depuis l’application");
    setCall15State("done");
  });

  constantsBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Constantes";
    logAnaphylaxis("ouverture du module constantes demandée");
    openVitalsSheet?.();
  });

  severityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Gravité +";
    logAnaphylaxis("signes de gravité ou anomalie significative sur les constantes");
    setCall15State("alert");
  });

  noSeverityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Pas gravité";
    logAnaphylaxis("absence de signes de gravité");
  });

  evictionBtn?.addEventListener("click", () => {
    logAnaphylaxis("éviction de l’allergène réalisée si possible");
  });

  criteriaUrticariaBtn?.addEventListener("click", () => {
    showConfirmedBranch("atteinte urticarienne + respiratoire ou hypotension / mauvaise perfusion d’organes");
  });

  criteriaTwoSystemsBtn?.addEventListener("click", () => {
    showConfirmedBranch("deux atteintes associées parmi les critères de Sampson");
  });

  criteriaHypotensionBtn?.addEventListener("click", () => {
    showConfirmedBranch("hypotension selon âge ou baisse >30% des valeurs habituelles");
  });

  notConfirmedBtn?.addEventListener("click", () => {
    confirmStatus.textContent = "Non confirmée";
    confirmedBranch?.classList.add("hidden");
    notConfirmedBranch?.classList.remove("hidden");
    logAnaphylaxis("anaphylaxie non confirmée : surveillance");
  });

  refreshDosesBtn?.addEventListener("click", () => {
    const doses = updateAnaphylaxisDoses();
    logAnaphylaxis(
      `doses recalculées — poids : ${doses.weightKg || "non renseigné"} kg — Adrénaline IM : ${doses.adrenalineDose} — Stylo : ${doses.penDose} — Méthylprednisolone : ${doses.methylpredDose}`
    );
  });

  adrenalineBtn?.addEventListener("click", () => {
    const doses = updateAnaphylaxisDoses();

    adrenalineStatus.textContent = "IM faite";

    logAnaphylaxis(
      `Adrénaline IM sélectionnée — dose calculée : ${doses.adrenalineDose} — stylo : ${doses.penDose}`
    );
  });

  methylpredBtn?.addEventListener("click", () => {
    const doses = updateAnaphylaxisDoses();

    logAnaphylaxis(
      `Méthylprednisolone sélectionnée — dose calculée : ${doses.methylpredDose}`
    );
  });

  report15Btn?.addEventListener("click", () => {
    reportStatus.textContent = "Bilan prêt";
    logAnaphylaxis("bilan anaphylaxie prêt pour appel au 15");
    setCall15State("report");
  });

  resetBtn?.addEventListener("click", resetAnaphylaxisProtocolWithSecurity);

  document.querySelectorAll("[data-anaphylaxis-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (
        button === constantsBtn ||
        button === severityBtn ||
        button === noSeverityBtn ||
        button === evictionBtn ||
        button === criteriaUrticariaBtn ||
        button === criteriaTwoSystemsBtn ||
        button === criteriaHypotensionBtn ||
        button === notConfirmedBtn ||
        button === adrenalineBtn ||
        button === methylpredBtn ||
        button === report15Btn
      ) {
        return;
      }

      logAnaphylaxis(button.dataset.anaphylaxisAction);
    });
  });
})();
