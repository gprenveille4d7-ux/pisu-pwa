"use strict";

/**
 * PISU — Synchronisation centrale de l'état patient
 * Version : patient-sync-v1
 *
 * OBJECTIF
 * -------
 * Restaurer la liaison :
 *
 * Identité patient
 *      ↓
 * Poids / âge / unité / catégorie
 *      ↓
 * Protocoles PISU
 *      ↓
 * Moteurs de calcul déjà existants
 *
 * IMPORTANT
 * ---------
 * Ce fichier NE contient AUCUNE formule médicale.
 * Il ne modifie AUCUNE dose.
 * Il force uniquement les protocoles existants à relire
 * l'état actuel du patient.
 */

(() => {
  const VERSION = "patient-sync-v1";

  const PATIENT_FIELD_IDS = [
    "patientWeight",
    "patientAge",
    "patientAgeUnit",
    "patientCategory"
  ];

  const DOSE_REFRESH_BUTTON_IDS = [
    "refreshChildAcrDosesBtn",
    "refreshSeizureDosesBtn",
    "refreshAnaphylaxisDosesBtn",
    "refreshHemorrhageDosesBtn",
    "refreshHypoglycemiaDosesBtn",
    "refreshAsthmaDosesBtn",
    "refreshAnalgesiaDosesBtn"
  ];

  const DOSE_WEIGHT_DISPLAY_IDS = [
    "childAcrWeightUsed",
    "seizureWeightUsed",
    "anaphylaxisWeightUsed",
    "hemorrhageWeightUsed",
    "hypoglycemiaWeightUsed",
    "asthmaWeightUsed",
    "analgesiaWeightUsed"
  ];

  const REFRESH_BUTTON_IDS = new Set(DOSE_REFRESH_BUTTON_IDS);

  let syncScheduled = false;
  let syncRunning = false;
  let lastSnapshotKey = "";

  function getElement(id) {
    return document.getElementById(id);
  }

  function readValue(id) {
    const element = getElement(id);

    if (!element) {
      return "";
    }

    return String(element.value ?? "").trim();
  }

  function readNumber(id) {
    const rawValue = readValue(id);

    if (rawValue === "") {
      return null;
    }

    const normalizedValue = rawValue.replace(",", ".");
    const numberValue = Number(normalizedValue);

    return Number.isFinite(numberValue)
      ? numberValue
      : null;
  }

  function getPatientSnapshot() {
    return Object.freeze({
      weightKg: readNumber("patientWeight"),
      age: readNumber("patientAge"),
      ageUnit: readValue("patientAgeUnit"),
      category: readValue("patientCategory")
    });
  }

  function createSnapshotKey(patient) {
    return JSON.stringify(patient);
  }

  function publishPatientState(patient, reason) {
    /*
     * État patient central disponible pour les futurs modules.
     */
    window.PISUPatient = Object.freeze({
      ...patient,
      version: VERSION
    });

    window.dispatchEvent(
      new CustomEvent("pisu:patient-updated", {
        detail: {
          patient,
          reason,
          version: VERSION
        }
      })
    );
  }

  function refreshExistingDoseEngines() {
    DOSE_REFRESH_BUTTON_IDS.forEach((buttonId) => {
      const button = getElement(buttonId);

      if (!button) {
        return;
      }

      /*
       * On utilise volontairement le moteur de calcul
       * du protocole concerné.
       *
       * Aucune formule médicale n'est dupliquée ici.
       */
      button.click();
    });
  }

  function validateWeightPropagation(patient) {
    if (patient.weightKg === null) {
      return;
    }

    const expectedWeight = String(patient.weightKg)
      .replace(".", ",");

    DOSE_WEIGHT_DISPLAY_IDS.forEach((displayId) => {
      const display = getElement(displayId);

      if (!display) {
        return;
      }

      const displayedValue = String(display.textContent ?? "")
        .trim()
        .replace(".", ",");

      /*
       * Contrôle technique uniquement.
       * Pas de blocage clinique ou de modification de dose.
       */
      if (
        displayedValue !== "" &&
        !displayedValue.includes(expectedWeight) &&
        !displayedValue.toLowerCase().includes("non renseign")
      ) {
        console.warn(
          `[PISU Patient Sync] Poids potentiellement désynchronisé : ${displayId}`,
          {
            patientWeightKg: patient.weightKg,
            displayedValue
          }
        );
      }
    });
  }

  function syncPatient(reason = "manual") {
    if (syncRunning) {
      return;
    }

    syncRunning = true;

    try {
      const patient = getPatientSnapshot();
      const snapshotKey = createSnapshotKey(patient);

      publishPatientState(patient, reason);

      /*
       * Même si l'état n'a pas changé, un protocole venant
       * de s'ouvrir peut avoir besoin d'être recalculé.
       */
      refreshExistingDoseEngines();

      lastSnapshotKey = snapshotKey;

      requestAnimationFrame(() => {
        validateWeightPropagation(patient);
      });
    } catch (error) {
      console.error(
        "[PISU Patient Sync] Échec de synchronisation patient",
        error
      );
    } finally {
      syncRunning = false;
    }
  }

  function schedulePatientSync(reason) {
    if (syncScheduled) {
      return;
    }

    syncScheduled = true;

    queueMicrotask(() => {
      requestAnimationFrame(() => {
        syncScheduled = false;
        syncPatient(reason);
      });
    });
  }

  function wakeLegacyPatientListeners() {
    PATIENT_FIELD_IDS.forEach((fieldId) => {
      const field = getElement(fieldId);

      if (!field) {
        return;
      }

      /*
       * Certains modules historiques peuvent écouter
       * change/input et conserver leur propre état local.
       *
       * On les force à relire le patient AVANT une action
       * protocolaire.
       */
      field.dispatchEvent(
        new Event("input", {
          bubbles: true
        })
      );

      field.dispatchEvent(
        new Event("change", {
          bubbles: true
        })
      );
    });
  }

  function isProtocolAction(element) {
    if (!(element instanceof Element)) {
      return false;
    }

    return Boolean(
      element.closest(
        [
          "button.drug",
          "[data-child-acr-action]",
          "[data-seizure-action]",
          "[data-anaphylaxis-action]",
          "[data-hemo-action]",
          "[data-hypo-action]",
          "[data-asthma-action]",
          "[data-analgesia-action]",
          "[data-smoke-action]",
          "[data-burn-action]"
        ].join(",")
      )
    );
  }

  function installPatientFieldListeners() {
    PATIENT_FIELD_IDS.forEach((fieldId) => {
      const field = getElement(fieldId);

      if (!field) {
        console.warn(
          `[PISU Patient Sync] Champ patient absent : ${fieldId}`
        );

        return;
      }

      field.addEventListener("input", () => {
        schedulePatientSync(`${fieldId}:input`);
      });

      field.addEventListener("change", () => {
        schedulePatientSync(`${fieldId}:change`);
      });
    });
  }

  function installIdentitySaveListener() {
    const saveButton = getElement("savePatientIdentityBtn");

    if (!saveButton) {
      return;
    }

    saveButton.addEventListener("click", () => {
      /*
       * app.js termine d'abord sa logique d'identité.
       * Le recalcul intervient juste après.
       */
      queueMicrotask(() => {
        schedulePatientSync("identity-saved");
      });
    });
  }

  function installProtocolSafetyCapture() {
    document.addEventListener(
      "click",
      (event) => {
        const clickedButton = event.target instanceof Element
          ? event.target.closest("button")
          : null;

        if (!clickedButton) {
          return;
        }

        if (REFRESH_BUTTON_IDS.has(clickedButton.id)) {
          return;
        }

        if (!isProtocolAction(clickedButton)) {
          return;
        }

        /*
         * CAPTURE PHASE :
         *
         * Ceci s'exécute AVANT les gestionnaires classiques
         * des boutons protocolaires.
         *
         * Le poids courant est donc réinjecté dans les anciens
         * écouteurs avant administration / traçage.
         */
        wakeLegacyPatientListeners();
        syncPatient("before-protocol-action");
      },
      true
    );
  }

  function installProtocolOpenObserver() {
    const observer = new MutationObserver((mutations) => {
      const protocolVisibilityChanged = mutations.some((mutation) => {
        if (
          mutation.type !== "attributes" ||
          mutation.attributeName !== "class"
        ) {
          return false;
        }

        const element = mutation.target;

        return (
          element instanceof HTMLElement &&
          element.id.endsWith("Protocol")
        );
      });

      if (protocolVisibilityChanged) {
        schedulePatientSync("protocol-visibility-changed");
      }
    });

    document.querySelectorAll('[id$="Protocol"]').forEach((protocol) => {
      observer.observe(protocol, {
        attributes: true,
        attributeFilter: ["class"]
      });
    });
  }

  function exposeDebugApi() {
    window.PISUPatientSync = Object.freeze({
      version: VERSION,

      getPatient() {
        return getPatientSnapshot();
      },

      sync() {
        syncPatient("debug-api");
      },

      getLastSnapshotKey() {
        return lastSnapshotKey;
      }
    });
  }

  function init() {
    installPatientFieldListeners();
    installIdentitySaveListener();
    installProtocolSafetyCapture();
    installProtocolOpenObserver();
    exposeDebugApi();

    syncPatient("initial-load");

    console.info(
      `[PISU Patient Sync] ${VERSION} chargé`,
      window.PISUPatient
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );
  } else {
    init();
  }
})();
