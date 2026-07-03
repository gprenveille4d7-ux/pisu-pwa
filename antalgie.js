(function () {
  const openBtn = document.getElementById("openAnalgesiaBtn");
  const closeBtn = document.getElementById("closeAnalgesiaBtn");
  const protocol = document.getElementById("analgesiaProtocol");

  const call15Btn = document.getElementById("analgesiaCall15Btn");
  const call15Status = document.getElementById("analgesiaCall15Status");

  const gravityStatus = document.getElementById("analgesiaGravityStatus");
  const painStatus = document.getElementById("analgesiaPainStatus");
  const routeStatus = document.getElementById("analgesiaRouteStatus");
  const treatmentStatus = document.getElementById("analgesiaTreatmentStatus");

  const constantsBtn = document.getElementById("analgesiaConstantsBtn");
  const severityBtn = document.getElementById("analgesiaSeverityBtn");
  const noSeverityBtn = document.getElementById("analgesiaNoSeverityBtn");
  const painfulGestureBtn = document.getElementById("analgesiaPainfulGestureBtn");
  const noPainfulGestureBtn = document.getElementById("analgesiaNoPainfulGestureBtn");
  const vvpBtn = document.getElementById("analgesiaVvpBtn");

  const weightUsed = document.getElementById("analgesiaWeightUsed");
  const ageUsed = document.getElementById("analgesiaAgeUsed");
  const paracetamolDoseEl = document.getElementById("analgesiaParacetamolDose");
  const morphineDoseEl = document.getElementById("analgesiaMorphineDose");
  const meopaDoseEl = document.getElementById("analgesiaMeopaDose");
  const refreshDosesBtn = document.getElementById("refreshAnalgesiaDosesBtn");

  const moderatePainBtn = document.getElementById("analgesiaModeratePainBtn");
  const severePainBtn = document.getElementById("analgesiaSeverePainBtn");
  const paracetamolBtn = document.getElementById("analgesiaParacetamolBtn");
  const morphineBtn = document.getElementById("analgesiaMorphineBtn");
  const meopaBtn = document.getElementById("analgesiaMeopaBtn");
  const report15Btn = document.getElementById("analgesiaReport15Btn");
  const resetBtn = document.getElementById("resetAnalgesiaProtocolBtn");

  function logAnalgesia(text) {
    if (typeof addLog === "function") {
      addLog(`Antalgie : ${text}`);
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
      "analgesia-call15-idle",
      "analgesia-call15-alert",
      "analgesia-call15-report",
      "analgesia-call15-done"
    );

    if (state === "alert") {
      call15Btn.classList.add("analgesia-call15-alert");
      call15Status.textContent = "Appel 15 immédiat";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "report") {
      call15Btn.classList.add("analgesia-call15-report");
      call15Status.textContent = "Bilan 15 à transmettre";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "done") {
      call15Btn.classList.add("analgesia-call15-done");
      call15Status.textContent = "15 appelé";
      return;
    }

    call15Btn.classList.add("analgesia-call15-idle");
    call15Status.textContent = "15 si gravité / bilan";
  }

  function formatMg(value) {
    if (!Number.isFinite(value)) return "Non calculable";
    const rounded = Math.round(value * 100) / 100;
    return `${rounded.toString().replace(".", ",")} mg`;
  }

  function updateAnalgesiaDoses() {
    const weightKg = window.pisuPatient?.getWeightKg?.() || null;
    const ageYears = window.pisuPatient?.getAgeYears?.() ?? null;
    const category = window.pisuPatient?.getCategory?.() || "";

    const isPediatric = category && category !== "adulte";

    let paracetamolDose = "Poids / âge à renseigner";
    let morphineDose = "Poids / âge à renseigner";
    let meopaDose = "Adulte 9 L/min / pédiatrique 6 L/min";

    if (category === "adulte") {
      paracetamolDose = "1 g toutes les 6 h";

      if (weightKg) {
        morphineDose = weightKg < 60
          ? "2 mg toutes les 5 min jusqu’à EN < 6, max 10 mg"
          : "3 mg toutes les 5 min jusqu’à EN < 6, max 10 mg";
      }

      meopaDose = "9 L/min";
    }

    if (isPediatric) {
      if (weightKg) {
        paracetamolDose = `${formatMg(weightKg * 15)} toutes les 6 h`;

        const morphineLoad = Math.min(weightKg * 0.1, 3);
        const morphineReinjection = weightKg * 0.02;

        morphineDose = `Charge ${formatMg(morphineLoad)} max 3 mg ; puis ${formatMg(morphineReinjection)}/5 min, 2 réinjections max`;
      }

      meopaDose = "6 L/min";
    }

    if (weightUsed) {
      weightUsed.textContent = weightKg ? `${weightKg} kg` : "Non renseigné";
    }

    if (ageUsed) {
      ageUsed.textContent = ageYears !== null ? `${ageYears} ans` : "Non renseigné";
    }

    if (paracetamolDoseEl) {
      paracetamolDoseEl.textContent = paracetamolDose;
    }

    if (morphineDoseEl) {
      morphineDoseEl.textContent = morphineDose;
    }

    if (meopaDoseEl) {
      meopaDoseEl.textContent = meopaDose;
    }

    return {
      weightKg,
      ageYears,
      category,
      paracetamolDose,
      morphineDose,
      meopaDose
    };
  }

  function openProtocol() {
    if (!protocol) return;

    if (typeof window.showProtocolPage === "function") {
      window.showProtocolPage("analgesiaProtocol");
    } else {
      protocol.classList.remove("hidden");
    }

    updateAnalgesiaDoses();
    setCall15State("idle");
    logAnalgesia("ouverture protocole");
  }

  function closeProtocol() {
    if (typeof window.showMainMenu === "function") {
      window.showMainMenu();
      return;
    }

    protocol?.classList.add("hidden");
  }

  function resetAnalgesiaProtocolWithSecurity() {
    const confirmation = window.confirm(
      "Remettre à zéro le protocole antalgie ?\n\nCette action réinitialise les statuts et les validations du protocole, mais conserve le journal mission."
    );

    if (!confirmation) {
      logAnalgesia("reset protocole antalgie annulé");
      return;
    }

    gravityStatus.textContent = "À évaluer";
    painStatus.textContent = "EN ?";
    routeStatus.textContent = "À choisir";
    treatmentStatus.textContent = "En attente";

    localStorage.removeItem("pisu-counter-analgesia-paracetamol");
    localStorage.removeItem("pisu-counter-analgesia-morphine");
    localStorage.removeItem("pisu-counter-analgesia-meopa");

    setCall15State("idle");

    protocol.querySelectorAll(".action-done, [data-count-badge]").forEach(button => {
      button.classList.remove("action-done", "click-feedback", "attention-flash");
      delete button.dataset.clickCount;
    });

    updateAnalgesiaDoses();

    logAnalgesia("protocole antalgie remis à zéro");
  }

  openBtn?.addEventListener("click", openProtocol);
  closeBtn?.addEventListener("click", closeProtocol);

  call15Btn?.addEventListener("click", () => {
    logAnalgesia("appel au 15 déclenché depuis l’application");
    setCall15State("done");
  });

  constantsBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Constantes";
    logAnalgesia("constantes réalisées avec EN ou EVS");
  });

  severityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Gravité +";
    logAnalgesia("signes de gravité ou anomalie significative sur les constantes");
    setCall15State("alert");
  });

  noSeverityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Pas gravité";
    logAnalgesia("absence de signes de gravité");
  });

  painfulGestureBtn?.addEventListener("click", () => {
    painStatus.textContent = "Geste prévu";
    logAnalgesia("geste douloureux prévisible : préparer antalgie et MEOPA avant le geste");
    flashAttention(meopaBtn, 4);
  });

  noPainfulGestureBtn?.addEventListener("click", () => {
    painStatus.textContent = "Pas geste";
    logAnalgesia("absence de geste douloureux prévisible");
  });

  vvpBtn?.addEventListener("click", () => {
    routeStatus.textContent = "VVP";
    logAnalgesia("VVP garde-veine mise en place");
  });

  moderatePainBtn?.addEventListener("click", () => {
    painStatus.textContent = "EN < 6";
    treatmentStatus.textContent = "Paracétamol";
    logAnalgesia("douleur modérée EN < 6");
    updateAnalgesiaDoses();
    flashAttention(paracetamolBtn, 4);
  });

  severePainBtn?.addEventListener("click", () => {
    painStatus.textContent = "EN ≥ 6";
    treatmentStatus.textContent = "Morphine";
    logAnalgesia("douleur sévère EN ≥ 6");
    updateAnalgesiaDoses();
    flashAttention(morphineBtn, 4);
  });

  refreshDosesBtn?.addEventListener("click", () => {
    const doses = updateAnalgesiaDoses();
    logAnalgesia(
      `doses recalculées — poids : ${doses.weightKg || "non renseigné"} kg — âge : ${doses.ageYears ?? "non renseigné"} ans — Paracétamol : ${doses.paracetamolDose} — Morphine : ${doses.morphineDose} — MEOPA : ${doses.meopaDose}`
    );
  });

  paracetamolBtn?.addEventListener("click", () => {
    const doses = updateAnalgesiaDoses();
    treatmentStatus.textContent = "Paracétamol";
    logAnalgesia(`Paracétamol sélectionné — dose rappel : ${doses.paracetamolDose}`);
  });

  morphineBtn?.addEventListener("click", () => {
    const doses = updateAnalgesiaDoses();
    treatmentStatus.textContent = "Morphine";
    logAnalgesia(`Morphine sélectionnée — dose rappel : ${doses.morphineDose}`);
  });

  meopaBtn?.addEventListener("click", () => {
    const doses = updateAnalgesiaDoses();
    treatmentStatus.textContent = "MEOPA";
    logAnalgesia(`MEOPA / Kalinox sélectionné — débit rappel : ${doses.meopaDose} — attendre 3 à 5 min avant geste douloureux`);
  });

  report15Btn?.addEventListener("click", () => {
    logAnalgesia("bilan antalgie prêt pour appel au 15");
    setCall15State("report");
  });

  resetBtn?.addEventListener("click", resetAnalgesiaProtocolWithSecurity);

  document.querySelectorAll("[data-analgesia-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (
        button === constantsBtn ||
        button === severityBtn ||
        button === noSeverityBtn ||
        button === painfulGestureBtn ||
        button === noPainfulGestureBtn ||
        button === vvpBtn ||
        button === moderatePainBtn ||
        button === severePainBtn ||
        button === paracetamolBtn ||
        button === morphineBtn ||
        button === meopaBtn ||
        button === report15Btn
      ) {
        return;
      }

      logAnalgesia(button.dataset.analgesiaAction);
    });
  });
})();
