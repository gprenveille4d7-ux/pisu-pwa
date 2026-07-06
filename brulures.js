(function () {
  const openBtn = document.getElementById("openBurnsBtn");
  const closeBtn = document.getElementById("closeBurnsBtn");
  const protocol = document.getElementById("burnsProtocol");

  const call15Btn = document.getElementById("burnCall15Btn");
  const call15Status = document.getElementById("burnCall15Status");

  const acrStatus = document.getElementById("burnAcrStatus");
  const gravityStatus = document.getElementById("burnGravityStatus");
  const surfaceStatus = document.getElementById("burnSurfaceStatus");
  const reportStatus = document.getElementById("burnReportStatus");

  const burnAcrBtn = document.getElementById("burnAcrBtn");
  const burnNoAcrBtn = document.getElementById("burnNoAcrBtn");
  const burnConstantsBtn = document.getElementById("burnConstantsBtn");
  const burnSeverityBtn = document.getElementById("burnSeverityBtn");
  const burnNoSeverityBtn = document.getElementById("burnNoSeverityBtn");
  const burnSurfaceLowBtn = document.getElementById("burnSurfaceLowBtn");
  const burnSurfaceHighBtn = document.getElementById("burnSurfaceHighBtn");
  const burnEburnBtn = document.getElementById("burnEburnBtn");
  const burnPhotoReportBtn = document.getElementById("burnPhotoReportBtn");
  const burnReport15Btn = document.getElementById("burnReport15Btn");
  const resetBtn = document.getElementById("resetBurnsProtocolBtn");

  function logBurn(text) {
    if (typeof addLog === "function") {
      addLog(`Brûlures : ${text}`);
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
      "burn-call15-idle",
      "burn-call15-alert",
      "burn-call15-report",
      "burn-call15-done"
    );

    if (state === "alert") {
      call15Btn.classList.add("burn-call15-alert");
      call15Status.textContent = "Appel 15 immédiat";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "report") {
      call15Btn.classList.add("burn-call15-report");
      call15Status.textContent = "Bilan 15 à transmettre";
      flashAttention(call15Btn, 4);
      return;
    }

    if (state === "done") {
      call15Btn.classList.add("burn-call15-done");
      call15Status.textContent = "15 appelé";
      return;
    }

    call15Btn.classList.add("burn-call15-idle");
    call15Status.textContent = "15 si gravité / ACR / bilan";
  }

  function openProtocol() {
    if (!protocol) return;

    if (typeof window.showProtocolPage === "function") {
      window.showProtocolPage("burnsProtocol");
    } else {
      protocol.classList.remove("hidden");
    }

    setCall15State("idle");
    logBurn("ouverture protocole");
  }

  function closeProtocol() {
    if (typeof window.showMainMenu === "function") {
      window.showMainMenu();
      return;
    }

    protocol?.classList.add("hidden");
  }

  function resetBurnsProtocolWithSecurity() {
    const confirmation = window.confirm(
      "Remettre à zéro le protocole brûlures ?\n\nCette action réinitialise les statuts et les validations du protocole, mais conserve le journal mission."
    );

    if (!confirmation) {
      logBurn("reset protocole brûlures annulé");
      return;
    }

    acrStatus.textContent = "À vérifier";
    gravityStatus.textContent = "À évaluer";
    surfaceStatus.textContent = "SCB ?";
    reportStatus.textContent = "En cours";

    setCall15State("idle");

    protocol.querySelectorAll(".action-done").forEach(button => {
      button.classList.remove("action-done", "click-feedback", "attention-flash");
      delete button.dataset.clickCount;
    });

    logBurn("protocole brûlures remis à zéro");
  }

  openBtn?.addEventListener("click", openProtocol);
  closeBtn?.addEventListener("click", closeProtocol);

  call15Btn?.addEventListener("click", () => {
    logBurn("appel au 15 déclenché depuis l'application");
    setCall15State("done");
  });

  burnAcrBtn?.addEventListener("click", () => {
    acrStatus.textContent = "ACR";
    gravityStatus.textContent = "Gravité +";
    logBurn("ACR en contexte d'exposition aux fumées : appel 15 puis PISU ACR adulte ou enfant");
    setCall15State("alert");
  });

  burnNoAcrBtn?.addEventListener("click", () => {
    acrStatus.textContent = "Non ACR";
    logBurn("patient non en ACR");
  });

  burnConstantsBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Constantes";
    logBurn("ouverture du module constantes demandée");
    openVitalsSheet?.();
  });

  burnSeverityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Gravité +";
    logBurn("signes de gravité ou anomalie significative sur les constantes");
    setCall15State("alert");
  });

  burnNoSeverityBtn?.addEventListener("click", () => {
    gravityStatus.textContent = "Pas gravité";
    logBurn("absence de signes de gravité");
  });

  burnSurfaceLowBtn?.addEventListener("click", () => {
    surfaceStatus.textContent = "< seuil";
    logBurn("SCB adulte < 15% ou enfant < 10% : refroidissement 15 minutes avec eau à 15 degrés");
  });

  burnSurfaceHighBtn?.addEventListener("click", () => {
    surfaceStatus.textContent = "> seuil";
    gravityStatus.textContent = "Gravité +";
    logBurn("SCB adulte > 15% ou enfant > 10% : refroidissement 5 minutes maximum");
    setCall15State("alert");
  });

  burnEburnBtn?.addEventListener("click", () => {
    surfaceStatus.textContent = "E-BURN";
    logBurn("évaluation des brûlures avec E-BURN ou lien PEC du grand brûlé");
  });

  burnPhotoReportBtn?.addEventListener("click", () => {
    reportStatus.textContent = "Photos / 15";
    logBurn("envoi bilan E-BURN avec photographies au médecin régulateur / appel au 15");
    setCall15State("report");
  });

  burnReport15Btn?.addEventListener("click", () => {
    reportStatus.textContent = "Bilan prêt";
    logBurn("bilan brûlures prêt pour appel au 15");
    setCall15State("report");
  });

  resetBtn?.addEventListener("click", resetBurnsProtocolWithSecurity);

  document.querySelectorAll("[data-burn-action]").forEach(button => {
    button.addEventListener("click", () => {
      if (
        button === burnAcrBtn ||
        button === burnNoAcrBtn ||
        button === burnConstantsBtn ||
        button === burnSeverityBtn ||
        button === burnNoSeverityBtn ||
        button === burnSurfaceLowBtn ||
        button === burnSurfaceHighBtn ||
        button === burnEburnBtn ||
        button === burnPhotoReportBtn ||
        button === burnReport15Btn
      ) {
        return;
      }

      logBurn(button.dataset.burnAction);
    });
  });
})();
