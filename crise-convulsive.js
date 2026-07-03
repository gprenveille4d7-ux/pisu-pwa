(function () {
  const openBtn = document.getElementById("openSeizureBtn");
  const closeBtn = document.getElementById("closeSeizureBtn");
  const protocol = document.getElementById("seizureProtocol");

  const call15Btn = document.getElementById("seizureCall15Btn");
  const call15Status = document.getElementById("seizureCall15Status");

  const gravityStatus = document.getElementById("seizureGravityStatus");
  const persistenceStatus = document.getElementById("seizurePersistenceStatus");
  const acrStatus = document.getElementById("seizureAcrStatus");
  const treatmentStatus = document.getElementById("seizureTreatmentStatus");

  const persistentBranch = document.getElementById("seizurePersistentBranch");
  const noPersistentBranch = document.getElementById("seizureNoPersistentBranch");
  const postCrisisBranch = document.getElementById("seizurePostCrisisBranch");

  const constantsBtn = document.getElementById("seizureConstantsBtn");
  const severityBtn = document.getElementById("seizureSeverityBtn");
  const noSeverityBtn = document.getElementById("seizureNoSeverityBtn");
  const persistentYesBtn = document.getElementById("seizurePersistentYesBtn");
  const persistentNoBtn = document.getElementById("seizurePersistentNoBtn");
  const stillPersistentBtn = document.getElementById("seizureStillPersistentBtn");
  const stoppedAfterTreatmentBtn = document.getElementById("seizureStoppedAfterTreatmentBtn");
  const acrYesBtn = document.getElementById("seizureAcrYesBtn");
  const acrNoBtn = document.getElementById("seizureAcrNoBtn");
  const midazolamBtn = document.getElementById("seizureMidazolamBtn");
  const clonazepamBtn = document.getElementById("seizureClonazepamBtn");
  const report15Btn = document.getElementById("seizureReport15Btn");
  const resetBtn = document.getElementById("resetSeizureProtocolBtn");
  const seizureWeightUsed = document.getElementById("seizureWeightUsed");
  const seizureCategoryUsed = document.getElementById("seizureCategoryUsed");
  const seizureMidazolamDose = document.getElementById("seizureMidazolamDose");
  const seizureClonazepamDose = document.getElementById("seizureClonazepamDose");
  const refreshSeizureDosesBtn = document.getElementById("refreshSeizureDosesBtn");

  function logSeizure(text) {
    if (typeof addLog === "function") {
      addLog(`Crise convulsive : ${text}`);
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
      "seizure-call15-idle",
      "seizure-call15-alert",
      "seizure-call15-report",
      "seizure-call15-done"
    );

    if (state === "alert") {
      call15Btn.classList.add("seizure-call15-alert");
      call15Status.textContent = "Appel 15 immédiat";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "report") {
      call15Btn.classList.add("seizure-call15-report");
      call15Status.textContent = "Bilan 15 à transmettre";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "done") {
      call15Btn.classList.add("seizure-call15-done");
      call15Status.textContent = "15 appelé";
      return;
    }

    call15Btn.classList.add("seizure-call15-idle");
    call15Status.textContent = "15 si gravité / persistance / bilan";
  }

  function updateSeizureDoses() {
    const weightKg = window.pisuPatient?.getWeightKg?.() || null;
    const category = window.pisuPatient?.getCategory?.() || "";
    const categoryLabel = window.pisuPatient?.getCategoryLabel?.(category) || "Non renseignée";

    const midazolamDose = window.pisuPatient?.getMidazolamBuccolamDoseFromCategory?.(category)
      || "Catégorie d’âge à renseigner";

    const clonazepamDoseMg = window.pisuPatient?.calculateClonazepamDoseMg?.(weightKg);
    const clonazepamDose = clonazepamDoseMg
      ? window.pisuPatient.formatDoseMg(clonazepamDoseMg)
      : "Poids à renseigner";

    if (seizureWeightUsed) {
      seizureWeightUsed.textContent = weightKg ? `${weightKg} kg` : "Non renseigné";
    }

    if (seizureCategoryUsed) {
      seizureCategoryUsed.textContent = categoryLabel;
    }

    if (seizureMidazolamDose) {
      seizureMidazolamDose.textContent = midazolamDose;
    }

    if (seizureClonazepamDose) {
      seizureClonazepamDose.textContent = clonazepamDose;
    }

    return {
      weightKg,
      category,
      categoryLabel,
      midazolamDose,
      clonazepamDose
    };
  }

  function openProtocol() {
    if (!protocol) return;

    if (typeof window.showProtocolPage === "function") {
      window.showProtocolPage("seizureProtocol");
    } else {
      protocol.classList.remove("hidden");
    }

    updateSeizureDoses();
    setCall15State("idle");
    logSeizure("ouverture protocole");
  }

  function closeProtocol() {
    if (typeof window.showMainMenu === "function") {
      window.showMainMenu();
      return;
    }

    protocol?.classList.add("hidden");
  }

  function resetSeizureProtocolWithSecurity() {
    const confirmation = window.confirm(
      "Remettre à zéro le protocole crise convulsive ?\n\nCette action réinitialise les statuts et les validations du protocole, mais conserve le journal mission."
    );

    if (!confirmation) {
      logSeizure("reset protocole crise convulsive annulé");
      return;
    }

    gravityStatus.textContent = "À évaluer";
    persistenceStatus.textContent = "À vérifier";
    acrStatus.textContent = "À vérifier";
    treatmentStatus.textContent = "En attente";

    persistentBranch?.classList.add("hidden");
    noPersistentBranch?.classList.add("hidden");
    postCrisisBranch?.classList.add("hidden");

    setCall15State("idle");

    localStorage.removeItem("pisu-counter-seizure-treatment");

    protocol.querySelectorAll(".action-done, [data-count-badge]").forEach(button => {
      button.classList.remove("action-done", "click-feedback", "attention-flash");
      delete button.dataset.clickCount;
    });

    logSeizure("protocole crise convulsive remis à zéro");
  }

  openBtn?.addEventListener("click", openProtocol);
  closeBtn?.addEventListener("click", closeProtocol);

  call15Btn?.addEventListener("click", () => {
    logSeizure("appel au 15 déclenché depuis l'application");
    setCall15State("done");
  });

  constantsBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Constantes";
    logSeizure("constantes réalisées");
  });

  severityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Gravité +";
    logSeizure("signes de gravité ou anomalie significative sur les constantes");
    setCall15State("alert");
  });

  noSeverityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Pas gravité";
    logSeizure("absence de signes de gravité");
  });

  persistentYesBtn?.addEventListener("click", () => {
    persistenceStatus.textContent = "Persistantes";
    persistentBranch?.classList.remove("hidden");
    noPersistentBranch?.classList.add("hidden");
    postCrisisBranch?.classList.add("hidden");
    logSeizure("convulsions persistantes");
    flashAttention(midazolamBtn, 4);
    flashAttention(clonazepamBtn, 4);
  });

  persistentNoBtn?.addEventListener("click", () => {
    persistenceStatus.textContent = "Arrêtées";
    persistentBranch?.classList.add("hidden");
    noPersistentBranch?.classList.remove("hidden");
    logSeizure("convulsions non persistantes / arrêtées");
  });

  stillPersistentBtn?.addEventListener("click", () => {
    persistenceStatus.textContent = "Persistantes +";
    logSeizure("persistance des convulsions après traitement");
    setCall15State("alert");
    flashAttention(report15Btn, 4);
  });

  stoppedAfterTreatmentBtn?.addEventListener("click", () => {
    persistenceStatus.textContent = "Arrêtées";
    noPersistentBranch?.classList.remove("hidden");
    logSeizure("arrêt des convulsions après traitement");
  });

  acrYesBtn?.addEventListener("click", () => {
    acrStatus.textContent = "ACR";
    gravityStatus.textContent = "Gravité +";
    logSeizure("patient en ACR : PISU ACR adulte ou enfant, initier RCP, appel 15");
    setCall15State("alert");
  });

  acrNoBtn?.addEventListener("click", () => {
    acrStatus.textContent = "Non ACR";
    postCrisisBranch?.classList.remove("hidden");
    logSeizure("patient non en ACR");
  });

  midazolamBtn?.addEventListener("click", () => {
    const doses = updateSeizureDoses();

    treatmentStatus.textContent = "Midazolam";

    logSeizure(
      `Midazolam intra-buccal sélectionné — dose rappel : ${doses.midazolamDose}`
    );
  });

  clonazepamBtn?.addEventListener("click", () => {
    const doses = updateSeizureDoses();

    treatmentStatus.textContent = "Clonazepam";

    logSeizure(
      `Clonazepam IV / KTIO sélectionné — dose calculée : ${doses.clonazepamDose}`
    );
  });

  refreshSeizureDosesBtn?.addEventListener("click", () => {
    const doses = updateSeizureDoses();
    logSeizure(
      `doses recalculées — poids : ${doses.weightKg || "non renseigné"} kg — Midazolam : ${doses.midazolamDose} — Clonazepam : ${doses.clonazepamDose}`
    );
  });

  report15Btn?.addEventListener("click", () => {
    logSeizure("bilan crise convulsive prêt pour appel au 15");
    setCall15State("report");
  });

  resetBtn?.addEventListener("click", resetSeizureProtocolWithSecurity);

  document.querySelectorAll("[data-seizure-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (
        button === constantsBtn ||
        button === severityBtn ||
        button === noSeverityBtn ||
        button === persistentYesBtn ||
        button === persistentNoBtn ||
        button === stillPersistentBtn ||
        button === stoppedAfterTreatmentBtn ||
        button === acrYesBtn ||
        button === acrNoBtn ||
        button === midazolamBtn ||
        button === clonazepamBtn ||
        button === report15Btn
      ) {
        return;
      }

      logSeizure(button.dataset.seizureAction);
    });
  });
})();
