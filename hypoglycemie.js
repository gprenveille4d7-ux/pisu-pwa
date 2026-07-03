(function () {
  const openBtn = document.getElementById("openHypoglycemiaBtn");
  const closeBtn = document.getElementById("closeHypoglycemiaBtn");
  const protocol = document.getElementById("hypoglycemiaProtocol");

  const call15Btn = document.getElementById("hypoglycemiaCall15Btn");
  const call15Status = document.getElementById("hypoglycemiaCall15Status");

  const glycemiaStatus = document.getElementById("hypoglycemiaGlycemiaStatus");
  const gravityStatus = document.getElementById("hypoglycemiaGravityStatus");
  const routeStatus = document.getElementById("hypoglycemiaRouteStatus");
  const reportStatus = document.getElementById("hypoglycemiaReportStatus");

  const constantsBtn = document.getElementById("hypoglycemiaConstantsBtn");
  const confirmedBtn = document.getElementById("hypoglycemiaConfirmedBtn");
  const correctedBtn = document.getElementById("hypoglycemiaCorrectedBtn");
  const severityBtn = document.getElementById("hypoglycemiaSeverityBtn");
  const noSeverityBtn = document.getElementById("hypoglycemiaNoSeverityBtn");
  const pumpBtn = document.getElementById("hypoglycemiaPumpBtn");
  const oralRouteBtn = document.getElementById("hypoglycemiaOralRouteBtn");
  const parenteralRouteBtn = document.getElementById("hypoglycemiaParenteralRouteBtn");

  const weightUsed = document.getElementById("hypoglycemiaWeightUsed");
  const glucagonDoseEl = document.getElementById("hypoglycemiaGlucagonDose");
  const g10DoseEl = document.getElementById("hypoglycemiaG10Dose");
  const g30DoseEl = document.getElementById("hypoglycemiaG30Dose");
  const refreshDosesBtn = document.getElementById("refreshHypoglycemiaDosesBtn");

  const glucagonBtn = document.getElementById("hypoglycemiaGlucagonBtn");
  const vvpBtn = document.getElementById("hypoglycemiaVvpBtn");
  const g10Btn = document.getElementById("hypoglycemiaG10Btn");
  const g30Btn = document.getElementById("hypoglycemiaG30Btn");
  const report15Btn = document.getElementById("hypoglycemiaReport15Btn");
  const resetBtn = document.getElementById("resetHypoglycemiaProtocolBtn");

  function logHypo(text) {
    if (typeof addLog === "function") {
      addLog(`Hypoglycémie : ${text}`);
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
      "hypoglycemia-call15-idle",
      "hypoglycemia-call15-alert",
      "hypoglycemia-call15-report",
      "hypoglycemia-call15-done"
    );

    if (state === "alert") {
      call15Btn.classList.add("hypoglycemia-call15-alert");
      call15Status.textContent = "Appel 15 immédiat";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "report") {
      call15Btn.classList.add("hypoglycemia-call15-report");
      call15Status.textContent = "Bilan 15 à transmettre";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "done") {
      call15Btn.classList.add("hypoglycemia-call15-done");
      call15Status.textContent = "15 appelé";
      return;
    }

    call15Btn.classList.add("hypoglycemia-call15-idle");
    call15Status.textContent = "15 si gravité / échec / bilan";
  }

  function updateHypoglycemiaDoses() {
    const weightKg = window.pisuPatient?.getWeightKg?.() || null;

    let glucagonDose = "Poids à renseigner";
    let g10Dose = "Poids à renseigner";
    let g30Dose = "Poids à renseigner";

    if (weightKg) {
      glucagonDose = weightKg < 25 ? "0,5 mg" : "1 mg";
      g10Dose = `${Math.round(weightKg * 5)} ml IVL`;
      g30Dose = `${Math.min(Math.round(weightKg * 1), 30)} ml IVL max`;
    }

    if (weightUsed) {
      weightUsed.textContent = weightKg ? `${weightKg} kg` : "Non renseigné";
    }

    if (glucagonDoseEl) {
      glucagonDoseEl.textContent = glucagonDose;
    }

    if (g10DoseEl) {
      g10DoseEl.textContent = g10Dose;
    }

    if (g30DoseEl) {
      g30DoseEl.textContent = g30Dose;
    }

    return {
      weightKg,
      glucagonDose,
      g10Dose,
      g30Dose
    };
  }

  function openProtocol() {
    if (!protocol) return;

    if (typeof window.showProtocolPage === "function") {
      window.showProtocolPage("hypoglycemiaProtocol");
    } else {
      protocol.classList.remove("hidden");
    }

    updateHypoglycemiaDoses();
    setCall15State("idle");
    logHypo("ouverture protocole");
  }

  function closeProtocol() {
    if (typeof window.showMainMenu === "function") {
      window.showMainMenu();
      return;
    }

    protocol?.classList.add("hidden");
  }

  function resetHypoglycemiaProtocolWithSecurity() {
    const confirmation = window.confirm(
      "Remettre à zéro le protocole hypoglycémie ?\n\nCette action réinitialise les statuts et les validations du protocole, mais conserve le journal mission."
    );

    if (!confirmation) {
      logHypo("reset protocole hypoglycémie annulé");
      return;
    }

    glycemiaStatus.textContent = "À vérifier";
    gravityStatus.textContent = "À évaluer";
    routeStatus.textContent = "À choisir";
    reportStatus.textContent = "En cours";

    localStorage.removeItem("pisu-counter-hypoglycemia-glucagon");
    localStorage.removeItem("pisu-counter-hypoglycemia-g10");
    localStorage.removeItem("pisu-counter-hypoglycemia-g30");

    setCall15State("idle");

    protocol.querySelectorAll(".action-done, [data-count-badge]").forEach(button => {
      button.classList.remove("action-done", "click-feedback", "attention-flash");
      delete button.dataset.clickCount;
    });

    updateHypoglycemiaDoses();

    logHypo("protocole hypoglycémie remis à zéro");
  }

  openBtn?.addEventListener("click", openProtocol);
  closeBtn?.addEventListener("click", closeProtocol);

  call15Btn?.addEventListener("click", () => {
    logHypo("appel au 15 déclenché depuis l’application");
    setCall15State("done");
  });

  constantsBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Constantes";
    logHypo("constantes réalisées avec glycémie capillaire");
  });

  confirmedBtn?.addEventListener("click", () => {
    glycemiaStatus.textContent = "< seuil";
    logHypo("hypoglycémie confirmée : glycémie capillaire < 0,6 g/L ou < 3,3 mmol/L");
  });

  correctedBtn?.addEventListener("click", () => {
    glycemiaStatus.textContent = "Corrigée";
    logHypo("glycémie corrigée : > 0,6 g/L ou > 3,3 mmol/L");
  });

  severityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Gravité +";
    logHypo("signes de gravité ou anomalie significative sur les constantes");
    setCall15State("alert");
  });

  noSeverityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Pas gravité";
    logHypo("absence de signes de gravité");
  });

  pumpBtn?.addEventListener("click", () => {
    logHypo("pompe à insuline présente : pompe éteinte");
  });

  oralRouteBtn?.addEventListener("click", () => {
    routeStatus.textContent = "Per os";
    logHypo("patient conscient et capable de déglutir : resucrage per os débuté");
  });

  parenteralRouteBtn?.addEventListener("click", () => {
    routeStatus.textContent = "Parentérale";
    logHypo("patient inconscient ou incapable de déglutir : prise en charge parentérale / glucagon");
    updateHypoglycemiaDoses();
    flashAttention(glucagonBtn, 4);
    flashAttention(g10Btn, 4);
  });

  refreshDosesBtn?.addEventListener("click", () => {
    const doses = updateHypoglycemiaDoses();
    logHypo(
      `doses recalculées — poids : ${doses.weightKg || "non renseigné"} kg — Glucagon : ${doses.glucagonDose} — G10 : ${doses.g10Dose} — G30 : ${doses.g30Dose}`
    );
  });

  glucagonBtn?.addEventListener("click", () => {
    const doses = updateHypoglycemiaDoses();
    logHypo(`Glucagon sélectionné — dose rappel : ${doses.glucagonDose}`);
  });

  vvpBtn?.addEventListener("click", () => {
    logHypo("VVP posée ; si échecs répétés, appel au 15 pour discuter KTIO");
  });

  g10Btn?.addEventListener("click", () => {
    const doses = updateHypoglycemiaDoses();
    logHypo(`G10% sélectionné — dose pédiatrique rappel : ${doses.g10Dose}`);
  });

  g30Btn?.addEventListener("click", () => {
    const doses = updateHypoglycemiaDoses();
    logHypo(`G30% sélectionné — adulte 20 ml IVL à répéter 4 fois si besoin ; pédiatrique : ${doses.g30Dose}`);
  });

  report15Btn?.addEventListener("click", () => {
    reportStatus.textContent = "Bilan prêt";
    logHypo("bilan hypoglycémie prêt pour appel au 15");
    setCall15State("report");
  });

  resetBtn?.addEventListener("click", resetHypoglycemiaProtocolWithSecurity);

  document.querySelectorAll("[data-hypo-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (
        button === constantsBtn ||
        button === confirmedBtn ||
        button === correctedBtn ||
        button === severityBtn ||
        button === noSeverityBtn ||
        button === pumpBtn ||
        button === oralRouteBtn ||
        button === parenteralRouteBtn ||
        button === glucagonBtn ||
        button === vvpBtn ||
        button === g10Btn ||
        button === g30Btn ||
        button === report15Btn
      ) {
        return;
      }

      logHypo(button.dataset.hypoAction);
    });
  });
})();
