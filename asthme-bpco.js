(function () {
  const openBtn = document.getElementById("openAsthmaBpcoBtn");
  const closeBtn = document.getElementById("closeAsthmaBpcoBtn");
  const protocol = document.getElementById("asthmaBpcoProtocol");

  const call15Btn = document.getElementById("asthmaCall15Btn");
  const call15Status = document.getElementById("asthmaCall15Status");

  const gravityStatus = document.getElementById("asthmaGravityStatus");
  const typeStatus = document.getElementById("asthmaTypeStatus");
  const oxygenStatus = document.getElementById("asthmaOxygenStatus");
  const aerosolStatus = document.getElementById("asthmaAerosolStatus");

  const constantsBtn = document.getElementById("asthmaConstantsBtn");
  const typeAsthmaBtn = document.getElementById("asthmaTypeAsthmaBtn");
  const typeBpcoBtn = document.getElementById("asthmaTypeBpcoBtn");
  const severityBtn = document.getElementById("asthmaSeverityBtn");
  const noSeverityBtn = document.getElementById("asthmaNoSeverityBtn");
  const oxygenBtn = document.getElementById("asthmaOxygenBtn");
  const highFlowBtn = document.getElementById("asthmaHighFlowBtn");
  const aerosolBtn = document.getElementById("asthmaAerosolBtn");
  const spo2InsufficientBtn = document.getElementById("asthmaSpo2InsufficientBtn");

  const weightUsed = document.getElementById("asthmaWeightUsed");
  const ageUsed = document.getElementById("asthmaAgeUsed");
  const terbutalineDoseEl = document.getElementById("asthmaTerbutalineDose");
  const ipratropiumDoseEl = document.getElementById("asthmaIpratropiumDose");
  const methylpredDoseEl = document.getElementById("asthmaMethylpredDose");
  const refreshDosesBtn = document.getElementById("refreshAsthmaDosesBtn");

  const terbutalineBtn = document.getElementById("asthmaTerbutalineBtn");
  const ipratropiumBtn = document.getElementById("asthmaIpratropiumBtn");
  const methylpredBtn = document.getElementById("asthmaMethylpredBtn");
  const report15Btn = document.getElementById("asthmaReport15Btn");
  const resetBtn = document.getElementById("resetAsthmaBpcoProtocolBtn");

  let selectedType = "";

  function logAsthma(text) {
    if (typeof addLog === "function") {
      addLog(`Asthme/BPCO : ${text}`);
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
      "asthma-call15-idle",
      "asthma-call15-alert",
      "asthma-call15-report",
      "asthma-call15-done"
    );

    if (state === "alert") {
      call15Btn.classList.add("asthma-call15-alert");
      call15Status.textContent = "Appel 15 immédiat";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "report") {
      call15Btn.classList.add("asthma-call15-report");
      call15Status.textContent = "Bilan 15 à transmettre";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "done") {
      call15Btn.classList.add("asthma-call15-done");
      call15Status.textContent = "15 appelé";
      return;
    }

    call15Btn.classList.add("asthma-call15-idle");
    call15Status.textContent = "15 si gravité / O2 > 8 L/min / bilan";
  }

  function formatMg(value) {
    if (!Number.isFinite(value)) return "Non calculable";
    const rounded = Math.round(value * 100) / 100;
    return `${rounded.toString().replace(".", ",")} mg`;
  }

  function updateAsthmaDoses() {
    const weightKg = window.pisuPatient?.getWeightKg?.() || null;
    const ageYears = window.pisuPatient?.getAgeYears?.() ?? null;
    const category = window.pisuPatient?.getCategory?.() || "";

    let terbutalineDose = "Poids à renseigner";
    let ipratropiumDose = "Âge à renseigner";
    let methylpredDose = "Poids à renseigner";

    if (weightKg) {
      terbutalineDose = weightKg < 20 ? "2,5 mg" : "5 mg";

      const adultMethylpred = weightKg * 1;
      const pediatricMethylpred = Math.min(weightKg * 2, 80);

      if (selectedType === "bpco") {
        methylpredDose = `BPCO : après avis médical — rappel ${formatMg(adultMethylpred)}`;
      } else if (category && category !== "adulte") {
        methylpredDose = `${formatMg(pediatricMethylpred)} max 80 mg`;
      } else {
        methylpredDose = `${formatMg(adultMethylpred)}`;
      }
    }

    if (category === "adulte") {
      ipratropiumDose = "0,5 mg";
    } else if (ageYears !== null) {
      if (ageYears > 6) {
        ipratropiumDose = "0,5 mg";
      } else if (ageYears > 2) {
        ipratropiumDose = "0,25 mg";
      } else {
        ipratropiumDose = "< 2 ans : avis médical";
      }
    }

    if (weightUsed) {
      weightUsed.textContent = weightKg ? `${weightKg} kg` : "Non renseigné";
    }

    if (ageUsed) {
      ageUsed.textContent = ageYears !== null ? `${ageYears} ans` : "Non renseigné";
    }

    if (terbutalineDoseEl) {
      terbutalineDoseEl.textContent = terbutalineDose;
    }

    if (ipratropiumDoseEl) {
      ipratropiumDoseEl.textContent = ipratropiumDose;
    }

    if (methylpredDoseEl) {
      methylpredDoseEl.textContent = methylpredDose;
    }

    return {
      weightKg,
      ageYears,
      terbutalineDose,
      ipratropiumDose,
      methylpredDose
    };
  }

  function openProtocol() {
    if (!protocol) return;

    if (typeof window.showProtocolPage === "function") {
      window.showProtocolPage("asthmaBpcoProtocol");
    } else {
      protocol.classList.remove("hidden");
    }

    updateAsthmaDoses();
    setCall15State("idle");
    logAsthma("ouverture protocole");
  }

  function closeProtocol() {
    if (typeof window.showMainMenu === "function") {
      window.showMainMenu();
      return;
    }

    protocol?.classList.add("hidden");
  }

  function resetAsthmaProtocolWithSecurity() {
    const confirmation = window.confirm(
      "Remettre à zéro le protocole asthme / BPCO ?\n\nCette action réinitialise les statuts et les validations du protocole, mais conserve le journal mission."
    );

    if (!confirmation) {
      logAsthma("reset protocole asthme / BPCO annulé");
      return;
    }

    selectedType = "";

    gravityStatus.textContent = "À évaluer";
    typeStatus.textContent = "À choisir";
    oxygenStatus.textContent = "À faire";
    aerosolStatus.textContent = "En attente";

    localStorage.removeItem("pisu-counter-asthma-terbutaline");
    localStorage.removeItem("pisu-counter-asthma-ipratropium");
    localStorage.removeItem("pisu-counter-asthma-methylpred");

    setCall15State("idle");

    protocol.querySelectorAll(".action-done, [data-count-badge]").forEach(button => {
      button.classList.remove("action-done", "click-feedback", "attention-flash");
      delete button.dataset.clickCount;
    });

    updateAsthmaDoses();

    logAsthma("protocole asthme / BPCO remis à zéro");
  }

  openBtn?.addEventListener("click", openProtocol);
  closeBtn?.addEventListener("click", closeProtocol);

  call15Btn?.addEventListener("click", () => {
    logAsthma("appel au 15 déclenché depuis l’application");
    setCall15State("done");
  });

  constantsBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Constantes";
    logAsthma("constantes réalisées avec DEP si asthme disponible");
  });

  typeAsthmaBtn?.addEventListener("click", () => {
    selectedType = "asthme";
    typeStatus.textContent = "Asthme";
    logAsthma("type sélectionné : asthme");
    updateAsthmaDoses();
  });

  typeBpcoBtn?.addEventListener("click", () => {
    selectedType = "bpco";
    typeStatus.textContent = "BPCO";
    logAsthma("type sélectionné : BPCO");
    updateAsthmaDoses();
  });

  severityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Gravité +";
    logAsthma("signes de gravité ou anomalie significative sur les constantes");
    setCall15State("alert");
  });

  noSeverityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Pas gravité";
    logAsthma("absence de signes de gravité");
  });

  oxygenBtn?.addEventListener("click", () => {
    oxygenStatus.textContent = selectedType === "bpco" ? "88-92%" : "94-98%";
    logAsthma("oxygénothérapie mise en place selon cible SpO2");
  });

  highFlowBtn?.addEventListener("click", () => {
    oxygenStatus.textContent = "> 8 L/min";
    logAsthma("débit nécessaire > 8 L/min pour atteindre la cible SpO2 : appel au 15");
    setCall15State("alert");
  });

  aerosolBtn?.addEventListener("click", () => {
    aerosolStatus.textContent = "En cours";
    logAsthma("aérosolothérapie continue première heure débutée");
    updateAsthmaDoses();
    flashAttention(terbutalineBtn, 4);
    flashAttention(ipratropiumBtn, 4);
  });

  spo2InsufficientBtn?.addEventListener("click", () => {
    aerosolStatus.textContent = "SpO2 insuff.";
    logAsthma("SpO2 insuffisante malgré aérosol : lunettes sous masque et appel au 15");
    setCall15State("alert");
  });

  refreshDosesBtn?.addEventListener("click", () => {
    const doses = updateAsthmaDoses();
    logAsthma(
      `doses recalculées — poids : ${doses.weightKg || "non renseigné"} kg — âge : ${doses.ageYears ?? "non renseigné"} ans — Terbutaline : ${doses.terbutalineDose} — Ipratropium : ${doses.ipratropiumDose} — Méthylprednisolone : ${doses.methylpredDose}`
    );
  });

  terbutalineBtn?.addEventListener("click", () => {
    const doses = updateAsthmaDoses();
    aerosolStatus.textContent = "Terbut.";
    logAsthma(`Terbutaline / Bricanyl sélectionnée — dose rappel : ${doses.terbutalineDose}`);
  });

  ipratropiumBtn?.addEventListener("click", () => {
    const doses = updateAsthmaDoses();
    aerosolStatus.textContent = "Atrovent";
    logAsthma(`Ipratropium / Atrovent sélectionné — dose rappel : ${doses.ipratropiumDose}`);
  });

  methylpredBtn?.addEventListener("click", () => {
    const doses = updateAsthmaDoses();
    logAsthma(`Méthylprednisolone sélectionnée — dose rappel : ${doses.methylpredDose}`);
  });

  report15Btn?.addEventListener("click", () => {
    logAsthma("bilan exacerbation asthme / BPCO prêt pour appel au 15");
    setCall15State("report");
  });

  resetBtn?.addEventListener("click", resetAsthmaProtocolWithSecurity);

  document.querySelectorAll("[data-asthma-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (
        button === constantsBtn ||
        button === typeAsthmaBtn ||
        button === typeBpcoBtn ||
        button === severityBtn ||
        button === noSeverityBtn ||
        button === oxygenBtn ||
        button === highFlowBtn ||
        button === aerosolBtn ||
        button === spo2InsufficientBtn ||
        button === terbutalineBtn ||
        button === ipratropiumBtn ||
        button === methylpredBtn ||
        button === report15Btn
      ) {
        return;
      }

      logAsthma(button.dataset.asthmaAction);
    });
  });
})();
