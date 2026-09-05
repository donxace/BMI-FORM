import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Ruler, Scale } from "lucide-react";
import "./Kiosk.css";

/*
 * ============================================================
 * KIOSK — ONE-SCREEN-PER-STEP BMI MEASUREMENT FLOW
 * ============================================================
 *
 * A standalone, unauthenticated, full-bleed screen meant to run
 * on a physical touch kiosk next to the measuring station.
 *
 * Flow:
 *   welcome    -> tap RFID card to identify personnel
 *   identified -> confirm identity, step onto the platform
 *   height/
 *   weight     -> waits for a combined height+weight reading
 *                 from the device, with a manual fallback if
 *                 hardware is slow
 *   result     -> BMI + classification, auto-saves, then resets
 *
 * Every network endpoint used here is intentionally public
 * (no admin login) — see personnel.controller.ts /
 * bmi-assessments.controller.ts — matching how the admin
 * Measurement page's RFID-automatic mode already works.
 * ============================================================
 */

const API_BASE_URL = `http://${window.location.hostname}:3000`;

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type Classification = "Underweight" | "Normal" | "Overweight" | "Obese";

type Personnel = {
  personnel_id: number;
  rfid_uid: string;
  rank: string;
  surname: string;
  first_name: string;
  middle_initial: string | null;
  q: string | null;
  age: number | null;
  sex: string | null;
  office: string | null;
};

type RFIDResponse = {
  rfid_uid?: string | null;
  personnel?: Personnel | null;
  scan_id?: number;
};

type LiveReadingResponse = {
  height: number | null;
  weight: number | null;
  received_at: string | null;
};

type KioskStep =
  | "disclaimer"
  | "welcome"
  | "identified"
  | "height"
  | "weight"
  | "result";

// The height/weight steps share one continuous device
// session/poll (the sensor rig reports both together) — this
// just controls which single value is on screen at a time, one
// step per component, each with its own entrance animation and
// count-up.
const MEASURING_STEPS: KioskStep[] = ["height", "weight"];

/*
 * ============================================================
 * TEST MODE
 *
 * The kiosk normally waits on real hardware (an RFID reader for
 * the welcome step, the combined height/weight sensor rig for
 * the measuring step). These let a tester walk the whole flow
 * without any hardware attached. They call the SAME public
 * endpoints the real ESP32 uses, so they exercise the real flow
 * rather than a special fake-data path.
 * ============================================================
 */

// Must match a seeded rfid_uid (see database/bmi_monitoring.sql).
const TEST_RFID_UID = "RFID-1001";

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getClassification(bmi: number): Classification {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function getPNPClassification(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 23) return "Normal";
  if (bmi < 25) return "Overweight";
  if (bmi < 30) return "Obese Class I";
  return "Obese Class II";
}

function getFullName(personnel: Personnel): string {
  return [personnel.first_name, personnel.middle_initial, personnel.surname]
    .filter(Boolean)
    .join(" ");
}

function getInitials(personnel: Personnel): string {
  const first = personnel.first_name?.charAt(0) ?? "";
  const last = personnel.surname?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
}

function statusClass(status: string): string {
  return status.toLowerCase();
}

/*
 * ============================================================
 * LOCALIZATION — EN / TL toggle in the top bar switches every
 * guided-instruction string on the kiosk between these two.
 * ============================================================
 */

type Language = "en" | "tl";

const LANGUAGE_STORAGE_KEY = "kiosk-language";

const CLASSIFICATION_LABEL: Record<Language, Record<Classification, string>> = {
  en: {
    Underweight: "Underweight",
    Normal: "Normal",
    Overweight: "Overweight",
    Obese: "Obese",
  },
  tl: {
    Underweight: "Mababa sa Normal",
    Normal: "Normal",
    Overweight: "Sobra sa Timbang",
    Obese: "Obese",
  },
};

const translations = {
  en: {
    brandTitle: "Automated BMI Assessment Kiosk",
    brandSubtitle: "ITMS Health Monitoring Station",

    disclaimerTitle: "Before You Begin",
    disclaimerBody: (
      <>
        This kiosk is intended for{" "}
        <strong>proactive health awareness</strong> and routine BMI
        monitoring only. It is <strong>not a diagnostic tool</strong> and
        does not replace professional medical evaluation. If a reading
        looks unusual or you have health concerns, please consult a
        licensed physician or your health service office.
      </>
    ),
    disclaimerContinue: "I Understand — Continue →",

    welcomeTitle: "Tap Your ID Card to Begin",
    welcomeBody:
      "Hold your RFID card near the reader to start your BMI assessment.",
    rfidNotRegistered: "That card is not registered in the system.",
    simulateTap: "Simulate Card Tap (Test)",

    identifiedGreeting: "Welcome,",
    noOffice: "No office assigned",
    identifiedInstructions:
      'Please step onto the measuring platform, then tap "Start Measurement" below.',
    notYouCancel: "Not You? Cancel",
    startMeasurement: "Start Measurement →",

    heightWaitingTitle: "Stand on the Platform",
    heightDoneTitle: "Height Captured",
    heightWaitingBody:
      "The device captures your height and weight together.",
    heightDoneBody: "Here's your recorded height.",
    howToStand: "How to stand:",
    standSteps: [
      "Step fully onto the marked platform, facing forward.",
      "Stand upright with your back straight and heels together.",
      "Keep your arms relaxed at your sides.",
      "Remain still until the reading appears below.",
    ],
    manualPrompt: "Taking too long? Enter your measurements manually:",
    labelHeight: "Height (cm)",
    labelWeight: "Weight (kg)",
    useTheseValues: "Use These Values →",
    cancel: "Cancel",
    nextWeight: "Next: Weight →",
    skipSensorWait: "Skip Sensor Wait (Test)",

    weightTitle: "Weight Captured",
    weightBody: "Here's your recorded weight.",
    tip: "Tip:",
    weightTip:
      "for the most accurate reading next time, remove heavy items from your pockets or bag beforehand.",
    seeResults: "See My Results →",

    resultTitle: "Your BMI Result",
    tileHeight: "Height",
    tileWeight: "Weight",
    tileIbw: "Ideal Body Weight",
    tileWeightToLose: "Weight to Lose",
    pnpClassification: "PNP Classification",
    whoClassification: "WHO Classification",
    saving: "Saving your assessment…",
    savedPrefix: "Assessment #",
    savedSuffix: "saved",
    saveError:
      "Could not save automatically. Please notify the health officer.",
    newMeasurement: "New Measurement →",
  },
  tl: {
    brandTitle: "Kiosk ng BMI Assessment",
    brandSubtitle: "ITMS Istasyon ng Pagsubaybay sa Kalusugan",

    disclaimerTitle: "Bago Magsimula",
    disclaimerBody: (
      <>
        Ang kiosk na ito ay para sa{" "}
        <strong>proactive na kamalayan sa kalusugan</strong> at regular na
        pagsubaybay sa BMI lamang. Hindi ito{" "}
        <strong>diagnostic tool</strong> at hindi kapalit ng propesyonal na
        pagsusuri ng doktor. Kung hindi pangkaraniwan ang resulta o may
        alalahanin ka sa kalusugan, kumonsulta sa lisensyadong doktor o sa
        inyong health service office.
      </>
    ),
    disclaimerContinue: "Nauunawaan Ko — Magpatuloy →",

    welcomeTitle: "I-tap ang Iyong ID Card Para Magsimula",
    welcomeBody:
      "Ilapit ang iyong RFID card sa reader para simulan ang iyong BMI assessment.",
    rfidNotRegistered: "Ang card na iyan ay hindi rehistrado sa sistema.",
    simulateTap: "Gayahin ang Pag-tap ng Card (Test)",

    identifiedGreeting: "Maligayang pagdating,",
    noOffice: "Walang itinalagang opisina",
    identifiedInstructions:
      'Pakitayo sa measuring platform, pagkatapos ay pindutin ang "Simulan ang Pagsukat" sa ibaba.',
    notYouCancel: "Hindi Ikaw? Kanselahin",
    startMeasurement: "Simulan ang Pagsukat →",

    heightWaitingTitle: "Tumayo sa Platform",
    heightDoneTitle: "Nakuha na ang Taas",
    heightWaitingBody: "Sabay na susukatin ng device ang iyong taas at timbang.",
    heightDoneBody: "Ito ang naitalang taas mo.",
    howToStand: "Paano Tumayo:",
    standSteps: [
      "Tumayo nang buo sa markadong platform, nakaharap sa unahan.",
      "Tumayong nakatuwid, tuwid ang likod at magkadikit ang sakong.",
      "Panatilihing relaxed ang mga braso sa tagiliran.",
      "Manatiling tahimik hanggang lumabas ang resulta sa ibaba.",
    ],
    manualPrompt: "Matagal ba? Ilagay ang iyong sukat nang manu-mano:",
    labelHeight: "Taas (cm)",
    labelWeight: "Timbang (kg)",
    useTheseValues: "Gamitin ang mga Ito →",
    cancel: "Kanselahin",
    nextWeight: "Susunod: Timbang →",
    skipSensorWait: "Laktawan ang Paghihintay (Test)",

    weightTitle: "Nakuha na ang Timbang",
    weightBody: "Ito ang naitalang timbang mo.",
    tip: "Tip:",
    weightTip:
      "para sa mas tumpak na sukat sa susunod, alisin muna ang mabibigat na bagay sa bulsa o bag.",
    seeResults: "Tingnan ang Aking Resulta →",

    resultTitle: "Resulta ng Iyong BMI",
    tileHeight: "Taas",
    tileWeight: "Timbang",
    tileIbw: "Ideal na Timbang",
    tileWeightToLose: "Timbang na Babawasan",
    pnpClassification: "PNP Classification",
    whoClassification: "WHO Classification",
    saving: "Sine-save ang iyong resulta…",
    savedPrefix: "Pagsusuri Blg. ",
    savedSuffix: "na-save na",
    saveError:
      "Hindi na-save nang awtomatiko. Mangyaring ipaalam sa health officer.",
    newMeasurement: "Bagong Pagsukat →",
  },
};

/*
 * ============================================================
 * COUNT-UP HOOK — animates a number climbing to its target
 * ============================================================
 */

function useCountUp(target: number, active: boolean, durationMs = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, durationMs]);

  return value;
}

/*
 * ============================================================
 * MAIN COMPONENT
 * ============================================================
 */

export default function Kiosk() {
  const [step, setStep] = useState<KioskStep>("disclaimer");

  const [clock, setClock] = useState(new Date());

  /* ---------------- LANGUAGE (EN / TL) ---------------- */

  const [language, setLanguage] = useState<Language>(() => {
    try {
      return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "tl"
        ? "tl"
        : "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // ignore — falls back to English next load
    }
  }, [language]);

  const t = translations[language];

  /* ---------------- RFID / IDENTIFICATION ---------------- */

  const [personnel, setPersonnel] = useState<Personnel | null>(null);
  const [rfidError, setRfidError] = useState("");
  // Tracks the last scan_id already handled, not the rfid_uid — the
  // same card can be legitimately re-tapped with an identical uid,
  // and comparing uids alone would make that repeat tap invisible.
  // Starts at undefined (not null) so the very first poll can tell
  // "nothing scanned yet" apart from "whatever the backend already
  // remembers from before this kiosk was even loaded" — otherwise a
  // stale scan from an earlier session would auto-identify someone
  // the instant the welcome screen appears.
  const ignoredScanId = useRef<number | null | undefined>(undefined);

  /* ---------------- HEIGHT / WEIGHT ---------------- */

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [readingReceived, setReadingReceived] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const lastAppliedReadingAt = useRef<string | null>(null);

  /* ---------------- SAVE / RESET ---------------- */

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedAssessmentId, setSavedAssessmentId] = useState<number | null>(
    null
  );
  const [resetSeconds, setResetSeconds] = useState(15);

  /*
   * ============================================================
   * CLOCK
   * ============================================================
   */

  useEffect(() => {
    const interval = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  /*
   * ============================================================
   * WELCOME — POLL FOR AN RFID TAP
   * ============================================================
   */

  useEffect(() => {
    if (step !== "welcome") {
      return;
    }

    let cancelled = false;

    const checkRfid = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/personnel/rfid/latest`,
          { cache: "no-store" }
        );

        if (!response.ok || cancelled) {
          return;
        }

        const data: RFIDResponse = await response.json();

        if (ignoredScanId.current === undefined) {
          // First poll ever — whatever's already "latest" is stale
          // leftover from before this kiosk loaded, not a fresh tap.
          ignoredScanId.current = data.scan_id ?? null;
          return;
        }

        if (!data.rfid_uid || data.scan_id === ignoredScanId.current) {
          return;
        }

        ignoredScanId.current = data.scan_id ?? null;

        if (!data.personnel) {
          setRfidError("not_registered");
          return;
        }

        setRfidError("");
        setPersonnel(data.personnel);
        setStep("identified");
      } catch {
        // Kiosk stays on the welcome screen; the next poll retries.
      }
    };

    checkRfid();
    const interval = window.setInterval(checkRfid, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [step]);

  /*
   * ============================================================
   * MEASURING — SESSION START/END + LIVE READING POLL
   *
   * One continuous session/poll spans the height/weight steps
   * (the sensor rig reports both together) — keyed on
   * isMeasuring rather than the exact step so it doesn't restart
   * as the user moves between those two screens, only when
   * entering/leaving the group.
   * ============================================================
   */

  const isMeasuring = MEASURING_STEPS.includes(step);

  useEffect(() => {
    if (!isMeasuring) {
      return;
    }

    lastAppliedReadingAt.current = null;
    setReadingReceived(false);
    setManualEntry(false);

    fetch(`${API_BASE_URL}/bmi-assessments/session/start`, {
      method: "POST",
    }).catch(() => {});

    let cancelled = false;

    const checkReading = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/bmi-assessments/reading/latest`,
          { cache: "no-store" }
        );

        if (!response.ok || cancelled) {
          return;
        }

        const data: LiveReadingResponse = await response.json();

        if (
          !data.received_at ||
          data.received_at === lastAppliedReadingAt.current
        ) {
          return;
        }

        lastAppliedReadingAt.current = data.received_at;

        if (data.height != null) setHeight(String(data.height));
        if (data.weight != null) setWeight(String(data.weight));

        setReadingReceived(true);
      } catch {
        // retried on the next tick
      }
    };

    checkReading();
    const interval = window.setInterval(checkReading, 1000);

    // After 20s of silence from the device, offer manual entry.
    const manualTimeout = window.setTimeout(() => {
      if (!cancelled) setManualEntry(true);
    }, 20000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(manualTimeout);

      fetch(`${API_BASE_URL}/bmi-assessments/session/end`, {
        method: "POST",
      }).catch(() => {});
    };
  }, [isMeasuring]);

  /*
   * ============================================================
   * RESULT — BMI + CLASSIFICATION, AUTO-SAVE, THEN AUTO-RESET
   * ============================================================
   */

  const bmi = (() => {
    const h = Number(height);
    const w = Number(weight);
    if (!h || !w) return null;
    const m = h / 100;
    return w / (m * m);
  })();

  const ibw = (() => {
    const h = Number(height);
    if (!h) return null;
    const m = h / 100;
    return 22 * m * m;
  })();

  const weightToLose = (() => {
    const w = Number(weight);
    if (!w || ibw == null) return 0;
    return w > ibw ? w - ibw : 0;
  })();

  const classification = bmi !== null ? getClassification(bmi) : null;
  const pnpClassification = bmi !== null ? getPNPClassification(bmi) : null;

  useEffect(() => {
    if (step !== "result" || !personnel || bmi === null) {
      return;
    }

    let cancelled = false;
    setSaving(true);
    setSaveError("");

    const assessment = {
      personnel_id: personnel.personnel_id,
      height: Number(height),
      weight: Number(weight),
      waist: null,
      hip: null,
      wrist: null,
      bmi: Number(bmi.toFixed(2)),
      ibw: ibw != null ? Number(ibw.toFixed(2)) : null,
      weight_to_lose: Number(weightToLose.toFixed(2)),
      pnp_classification: pnpClassification,
      who_classification: classification,
      assessment_date: new Date().toISOString().split("T")[0],
      unit_representative: null,
      health_service_representative: null,
      encoder: "Kiosk",
    };

    fetch(`${API_BASE_URL}/bmi-assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assessment),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error("Unable to save this assessment.");
        }
        if (!cancelled) {
          setSavedAssessmentId(Number(data.assessment_id) || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSaveError(
            "Could not save automatically. Please notify the health officer."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSaving(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (step !== "result") {
      return;
    }

    setResetSeconds(15);

    const interval = window.setInterval(() => {
      setResetSeconds((s) => {
        if (s <= 1) {
          resetKiosk();
          return 15;
        }
        return s - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /*
   * ============================================================
   * RESET
   * ============================================================
   */

  const resetKiosk = () => {
    // Leave ignoredScanId as-is: it already points at the scan_id
    // that got us here, so the kiosk won't loop back into the same
    // person until a genuinely new tap bumps scan_id again.
    setPersonnel(null);
    setRfidError("");
    setHeight("");
    setWeight("");
    setReadingReceived(false);
    setManualEntry(false);
    setSaving(false);
    setSaveError("");
    setSavedAssessmentId(null);
    setStep("disclaimer");
  };

  /*
   * ============================================================
   * TEST MODE SHORTCUTS
   * ============================================================
   */

  // Posts to the same public endpoint the real ESP32 RFID reader
  // uses — the welcome step's own poll picks it up within ~1s.
  const simulateRfidTap = () => {
    fetch(`${API_BASE_URL}/personnel/rfid/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfid_uid: TEST_RFID_UID }),
    }).catch(() => {});
  };

  // Skips waiting on the height/weight sensor rig by filling in
  // plausible sample values, same as if a reading had arrived.
  const simulateReading = () => {
    setHeight("165.0");
    setWeight("60.0");
    setReadingReceived(true);
  };

  /*
   * ============================================================
   * COUNT-UP VALUES
   * ============================================================
   */

  // Each metric only animates while its OWN step is on screen, so
  // the count-up replays fresh every time the user lands on it.
  const heightCountUp = useCountUp(
    Number(height) || 0,
    step === "height" && readingReceived
  );
  const weightCountUp = useCountUp(Number(weight) || 0, step === "weight");

  const stepIndex = [
    "welcome",
    "identified",
    "height",
    "weight",
    "result",
  ].indexOf(step);

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="kiosk-page">
      <div className="kiosk-bg">
        <span className="kiosk-blob blob-1" />
        <span className="kiosk-blob blob-2" />
        <span className="kiosk-blob blob-3" />
      </div>

      <div className="kiosk-frame">
        {/* ==================================================
            TOP BAR
        =================================================== */}

        <header className="kiosk-topbar">
          <div className="kiosk-brand">
            <div className="kiosk-brand-logo">PNP</div>
            <div>
              <strong>{t.brandTitle}</strong>
              <small>{t.brandSubtitle}</small>
            </div>
          </div>

          <div className="kiosk-topbar-right">
            <div
              className="kiosk-lang-toggle"
              role="group"
              aria-label="Language / Wika"
            >
              <button
                type="button"
                className={language === "en" ? "active" : ""}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
              <button
                type="button"
                className={language === "tl" ? "active" : ""}
                onClick={() => setLanguage("tl")}
              >
                TL
              </button>
            </div>

            <div className="kiosk-clock">
              {clock.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </header>

        {/* ==================================================
            STAGE
        =================================================== */}

        <main className="kiosk-stage">
          <div className="kiosk-step" key={step}>
            {/* ------------------------------------------------
                DISCLAIMER
            ------------------------------------------------- */}

            {step === "disclaimer" && (
              <div className="kiosk-disclaimer">
                <div className="kiosk-disclaimer-icon"><AlertTriangle size={32} strokeWidth={2} /></div>

                <h1>{t.disclaimerTitle}</h1>

                <p className="kiosk-instructions">{t.disclaimerBody}</p>

                <div className="kiosk-actions">
                  <button
                    className="kiosk-primary-button"
                    onClick={() => setStep("welcome")}
                  >
                    {t.disclaimerContinue}
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------
                WELCOME
            ------------------------------------------------- */}

            {step === "welcome" && (
              <div className="kiosk-welcome">
                <div className="kiosk-rfid-icon">
                  <span className="kiosk-rfid-wave wave-1" />
                  <span className="kiosk-rfid-wave wave-2" />
                  <span className="kiosk-rfid-card">
                    <span className="kiosk-rfid-chip" />
                  </span>
                </div>

                <h1>{t.welcomeTitle}</h1>
                <p>{t.welcomeBody}</p>

                {rfidError && (
                  <div className="kiosk-toast error">
                    {t.rfidNotRegistered}
                  </div>
                )}

                <button
                  type="button"
                  className="kiosk-test-skip"
                  onClick={simulateRfidTap}
                >
                  {t.simulateTap}
                </button>
              </div>
            )}

            {/* ------------------------------------------------
                IDENTIFIED
            ------------------------------------------------- */}

            {step === "identified" && personnel && (
              <div className="kiosk-identified">
                <div className="kiosk-avatar">{getInitials(personnel)}</div>

                <h1>
                  {t.identifiedGreeting} {personnel.rank}{" "}
                  {getFullName(personnel)}
                </h1>

                <p className="kiosk-subtitle">
                  {personnel.office || t.noOffice}
                </p>

                <div className="kiosk-instructions">
                  {t.identifiedInstructions}
                </div>

                <div className="kiosk-actions">
                  <button
                    className="kiosk-secondary-button"
                    onClick={resetKiosk}
                  >
                    {t.notYouCancel}
                  </button>

                  <button
                    className="kiosk-primary-button"
                    onClick={() => setStep("height")}
                  >
                    {t.startMeasurement}
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------
                HEIGHT — waits on the sensor rig (or manual
                entry after 20s); weight arrives with it, but
                only height is shown while waiting.
            ------------------------------------------------- */}

            {step === "height" && (
              <div className="kiosk-metric-step">
                <h1>
                  {readingReceived ? t.heightDoneTitle : t.heightWaitingTitle}
                </h1>

                <p>
                  {readingReceived ? t.heightDoneBody : t.heightWaitingBody}
                </p>

                {!readingReceived && (
                  <div className="kiosk-instructions kiosk-guide">
                    <strong>{t.howToStand}</strong>
                    <ol>
                      {t.standSteps.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="kiosk-platform">
                  <div
                    className={`kiosk-platform-icon ${
                      readingReceived ? "done" : "scanning"
                    }`}
                  >
                    <span className="kiosk-scan-line" />
                    <Ruler size={40} strokeWidth={2} />
                  </div>

                  <div className="kiosk-metric-value">
                    {readingReceived ? heightCountUp.toFixed(1) : "—"}
                    <small> cm</small>
                  </div>
                </div>

                {!readingReceived && manualEntry && (
                  <div className="kiosk-manual-entry">
                    <p>{t.manualPrompt}</p>

                    <div className="kiosk-manual-fields">
                      <label>
                        {t.labelHeight}
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="0.0"
                        />
                      </label>

                      <label>
                        {t.labelWeight}
                        <input
                          type="number"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="0.0"
                        />
                      </label>
                    </div>

                    <button
                      className="kiosk-primary-button"
                      disabled={!height || !weight}
                      onClick={() => setReadingReceived(true)}
                    >
                      {t.useTheseValues}
                    </button>
                  </div>
                )}

                <div className="kiosk-actions">
                  <button
                    className="kiosk-secondary-button"
                    onClick={resetKiosk}
                  >
                    {t.cancel}
                  </button>

                  {readingReceived && (
                    <button
                      className="kiosk-primary-button"
                      onClick={() => setStep("weight")}
                    >
                      {t.nextWeight}
                    </button>
                  )}
                </div>

                {!readingReceived && (
                  <button
                    type="button"
                    className="kiosk-test-skip"
                    onClick={simulateReading}
                  >
                    {t.skipSensorWait}
                  </button>
                )}
              </div>
            )}

            {/* ------------------------------------------------
                WEIGHT — value already captured together with
                height; just its own animated reveal.
            ------------------------------------------------- */}

            {step === "weight" && (
              <div className="kiosk-metric-step">
                <h1>{t.weightTitle}</h1>
                <p>{t.weightBody}</p>

                <div className="kiosk-platform">
                  <div className="kiosk-platform-icon done">
                    <Scale size={40} strokeWidth={2} />
                  </div>

                  <div className="kiosk-metric-value">
                    {weightCountUp.toFixed(1)}
                    <small> kg</small>
                  </div>
                </div>

                <div className="kiosk-instructions kiosk-guide kiosk-guide-tip">
                  <strong>{t.tip}</strong> {t.weightTip}
                </div>

                <div className="kiosk-actions">
                  <button
                    className="kiosk-secondary-button"
                    onClick={resetKiosk}
                  >
                    {t.cancel}
                  </button>

                  <button
                    className="kiosk-primary-button"
                    onClick={() => setStep("result")}
                  >
                    {t.seeResults}
                  </button>
                </div>
              </div>
            )}

            {/* ------------------------------------------------
                RESULT
            ------------------------------------------------- */}

            {step === "result" && bmi !== null && classification && (
              <div className="kiosk-result">
                <h1>{t.resultTitle}</h1>

                <div
                  className={`kiosk-status-ring ${
                    classification === "Normal" ? "celebrate" : ""
                  }`}
                >
                  <div
                    className={`kiosk-status-icon ${statusClass(
                      classification
                    )}`}
                  >
                    {bmi.toFixed(1)}
                  </div>
                </div>

                <div
                  className={`kiosk-classification-badge ${statusClass(
                    classification
                  )}`}
                >
                  <span className="dot" />
                  {CLASSIFICATION_LABEL[language][classification]}
                  <small> · kg/m²</small>
                </div>

                <div className="kiosk-result-grid kiosk-result-grid-4">
                  <div className="kiosk-result-tile">
                    <span>{t.tileHeight}</span>
                    <strong>{height ? `${Number(height).toFixed(1)} cm` : "—"}</strong>
                  </div>

                  <div className="kiosk-result-tile">
                    <span>{t.tileWeight}</span>
                    <strong>{weight ? `${Number(weight).toFixed(1)} kg` : "—"}</strong>
                  </div>

                  <div className="kiosk-result-tile">
                    <span>{t.tileIbw}</span>
                    <strong>{ibw != null ? `${ibw.toFixed(1)} kg` : "—"}</strong>
                  </div>

                  <div className="kiosk-result-tile">
                    <span>{t.tileWeightToLose}</span>
                    <strong>{weightToLose ? `${weightToLose.toFixed(1)} kg` : "—"}</strong>
                  </div>
                </div>

                <div className="kiosk-classification-row">
                  <span>
                    {t.pnpClassification}: <strong>{pnpClassification}</strong>
                  </span>
                  <span>
                    {t.whoClassification}:{" "}
                    <strong>
                      {CLASSIFICATION_LABEL[language][classification]}
                    </strong>
                  </span>
                </div>

                <div className="kiosk-save-status">
                  {saving && <span>{t.saving}</span>}
                  {!saving && savedAssessmentId && (
                    <span className="ok">
                      ✓ {t.savedPrefix}
                      {String(savedAssessmentId).padStart(4, "0")}{" "}
                      {t.savedSuffix}
                    </span>
                  )}
                  {!saving && saveError && (
                    <span className="error">{t.saveError}</span>
                  )}
                </div>

                <div className="kiosk-reset-row">
                  <div className="kiosk-reset-ring">
                    <svg viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="17" className="ring-track" />
                      <circle
                        cx="20"
                        cy="20"
                        r="17"
                        className="ring-progress"
                        style={{
                          strokeDashoffset: `${
                            (1 - resetSeconds / 15) * 2 * Math.PI * 17
                          }px`,
                        }}
                      />
                    </svg>
                    <span>{resetSeconds}</span>
                  </div>

                  <button className="kiosk-primary-button" onClick={resetKiosk}>
                    {t.newMeasurement}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* ==================================================
            STEP INDICATOR
        =================================================== */}

        <footer className="kiosk-dots">
          {["welcome", "identified", "height", "weight", "result"].map(
            (s, i) => (
              <span
                key={s}
                className={`kiosk-dot ${i <= stepIndex ? "active" : ""} ${
                  i === stepIndex ? "current" : ""
                }`}
              />
            )
          )}
        </footer>
      </div>
    </div>
  );
}
