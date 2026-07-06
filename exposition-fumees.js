(function () {
  const openBtn = document.getElementById("openSmokeExposureBtn");
  const closeBtn = document.getElementById("closeSmokeExposureBtn");
  const protocol = document.getElementById("smokeExposureProtocol");

  const call15Btn = document.getElementById("smokeCall15Btn");
  const call15Status = document.getElementById("smokeCall15Status");

  const acrStatus = document.getElementById("smokeAcrStatus");
  const gravityStatus = document.getElementById("smokeGravityStatus");
  const oxygenStatus = document.getElementById("smokeOxygenStatus");
  const toxicStatus = document.getElementById("smokeToxicStatus");

  const smokeAcrBtn = document.getElementById("smokeAcrBtn");
  const smokeNoAcrBtn = document.getElementById("smokeNoAcrBtn");
  const smokeConstantsBtn = document.getElementById("smokeConstantsBtn");
  const smokeSeverityBtn = document.getElementById("smokeSeverityBtn");
  const smokeNoSeverityBtn = document.getElementById("smokeNoSeverityBtn");
  const smokeOxygenBtn = document.getElementById("smokeOxygenBtn");
  const smokeCoSuspectedBtn = document.getElementById("smokeCoSuspectedBtn");
  const smokeCnSuspectedBtn = document.getElementById("smokeCnSuspectedBtn");
  const smokeCnSeverityBtn = document.getElementById("smokeCnSeverityBtn");
  const smokeReport15Btn = document.getElementById("smokeReport15Btn");
  const resetBtn = document.getElementById("resetSmokeExposureProtocolBtn");

  function logSmoke(text) {
    if (typeof addLog === "function") {
      addLog(`Exposition aux fumées : ${text}`);
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
      "smoke-call15-idle",
      "smoke-call15-alert",
      "smoke-call15-report",
      "smoke-call15-done"
    );

    if (state === "alert") {
      call15Btn.classList.add("smoke-call15-alert");
      call15Status.textContent = "Appel 15 immédiat";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "report") {
      call15Btn.classList.add("smoke-call15-report");
      call15Status.textContent = "Bilan 15 à transmettre";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "done") {
      call15Btn.classList.add("smoke-call15-done");
      call15Status.textContent = "15 appelé";
      return;
    }

    call15Btn.classList.add("smoke-call15-idle");
    call15Status.textContent = "15 si gravité / ACR / bilan";
  }

  function openProtocol() {
    if (!protocol) return;

    if (typeof window.showProtocolPage === "function") {
      window.showProtocolPage("smokeExposureProtocol");
    } else {
      protocol.classList.remove("hidden");
    }

    setCall15State("idle");
    logSmoke("ouverture protocole");
  }

  function closeProtocol() {
    if (typeof window.showMainMenu === "function") {
      window.showMainMenu();
      return;
    }

    protocol?.classList.add("hidden");
  }

  function resetSmokeExposureProtocolWithSecurity() {
    const confirmation = window.confirm(
      "Remettre à zéro le protocole exposition aux fumées ?\n\nCette action réinitialise les statuts et les validations du protocole, mais conserve le journal mission."
    );

    if (!confirmation) {
      logSmoke("reset protocole exposition aux fumées annulé");
      return;
    }

    acrStatus.textContent = "À vérifier";
    gravityStatus.textContent = "À évaluer";
    oxygenStatus.textContent = "À faire";
    toxicStatus.textContent = "À évaluer";

    setCall15State("idle");

    protocol.querySelectorAll(".action-done").forEach(button => {
      button.classList.remove("action-done", "click-feedback", "attention-flash");
      delete button.dataset.clickCount;
    });

    logSmoke("protocole exposition aux fumées remis à zéro");
  }

  openBtn?.addEventListener("click", openProtocol);
  closeBtn?.addEventListener("click", closeProtocol);

  call15Btn?.addEventListener("click", () => {
    logSmoke("appel au 15 déclenché depuis l'application");
    setCall15State("done");
  });

  smokeAcrBtn?.addEventListener("click", () => {
    acrStatus.textContent = "ACR";
    gravityStatus.textContent = "Gravité +";
    oxygenStatus.textContent = "BAVU 15 L";
    toxicStatus.textContent = "Cyanokit ?";
    logSmoke("ACR en contexte d'exposition aux fumées : appel 15 puis PISU ACR adulte ou enfant");
    setCall15State("alert");
  });

  smokeNoAcrBtn?.addEventListener("click", () => {
    acrStatus.textContent = "Non ACR";
    logSmoke("patient non en ACR");
  });

  smokeConstantsBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Constantes";
    logSmoke("ouverture du module constantes demandée ; attention SpO2 faussement rassurante");
    openVitalsSheet?.();
  });

  smokeSeverityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Gravité +";
    logSmoke("signes de gravité ou anomalie significative sur les constantes");
    setCall15State("alert");
  });

  smokeNoSeverityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Pas gravité";
    logSmoke("absence de signes de gravité");
  });

  smokeOxygenBtn?.addEventListener("click", () => {
    oxygenStatus.textContent = "15 L/min";
    logSmoke("oxygénothérapie 15 L/min");
  });

  smokeCoSuspectedBtn?.addEventListener("click", () => {
    toxicStatus.textContent = "CO ?";
    oxygenStatus.textContent = "15 L/min";
    logSmoke("suspicion intoxication CO : O2 15 L/min à maintenir quelle que soit la SpO2");
  });

  smokeCnSuspectedBtn?.addEventListener("click", () => {
    toxicStatus.textContent = "CN ?";
    logSmoke("suspicion intoxication cyanures");
  });

  smokeCnSeverityBtn?.addEventListener("click", () => {
    toxicStatus.textContent = "CN +";
    gravityStatus.textContent = "Gravité +";
    logSmoke("signes de gravité cyanures présents : appel 15 pour discussion Hydroxocobalamine / Cyanokit");
    setCall15State("alert");
  });

  smokeReport15Btn?.addEventListener("click", () => {
    logSmoke("bilan exposition aux fumées prêt pour appel au 15");
    setCall15State("report");
  });

  resetBtn?.addEventListener("click", resetSmokeExposureProtocolWithSecurity);

  document.querySelectorAll("[data-smoke-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (
        button === smokeAcrBtn ||
        button === smokeNoAcrBtn ||
        button === smokeConstantsBtn ||
        button === smokeSeverityBtn ||
        button === smokeNoSeverityBtn ||
        button === smokeOxygenBtn ||
        button === smokeCoSuspectedBtn ||
        button === smokeCnSuspectedBtn ||
        button === smokeCnSeverityBtn ||
        button === smokeReport15Btn
      ) {
        return;
      }

      logSmoke(button.dataset.smokeAction);
    });
  });
})();
