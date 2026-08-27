import { useEffect, useState } from "react";
import "./IntrusionDetection.css";

/*
 * ============================================================
 * CONFIG
 * ============================================================
 */

const API_BASE_URL = `http://${window.location.hostname}:3000`;

/*
 * ============================================================
 * TYPES
 *
 * Expected shape of the microcontroller status endpoint,
 * once the ESP32 laser sensor is wired up:
 *
 * GET /intrusion-detection/latest
 * {
 *   "status": "clear" | "triggered",
 *   "sensor_id": "LASER-01",
 *   "triggered_at": "2026-08-27T09:15:00.000Z" | null
 * }
 * ============================================================
 */

type SensorStatus =
  | "connecting"
  | "clear"
  | "triggered"
  | "offline";

type IntrusionResponse = {
  status: "clear" | "triggered";
  sensor_id?: string;
  triggered_at?: string | null;
};

/*
 * ============================================================
 * INTRUSION DETECTION PAGE
 * ============================================================
 */

export default function IntrusionDetection() {
  const [sensorStatus, setSensorStatus] =
    useState<SensorStatus>("connecting");

  const [sensorId, setSensorId] =
    useState<string>("");

  const [lastTriggeredAt, setLastTriggeredAt] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string>("");

  const [acknowledged, setAcknowledged] =
    useState(false);

  /*
   * ============================================================
   * POLL THE MICROCONTROLLER STATUS ENDPOINT
   *
   * Mirrors the RFID polling pattern used on the Measurement
   * page: every second, ask the backend for the latest reading
   * from the ESP32. The backend endpoint itself is not built
   * yet, so failed requests are treated as "offline" rather
   * than a hard error.
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    const checkSensor = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/intrusion-detection/latest`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Sensor service HTTP ${response.status}`
          );
        }

        const data: IntrusionResponse =
          await response.json();

        if (cancelled) {
          return;
        }

        setSensorStatus(data.status);
        setSensorId(data.sensor_id ?? "");
        setErrorMessage("");

        if (data.status === "triggered") {
          setLastTriggeredAt(
            data.triggered_at ?? new Date().toISOString()
          );
          setAcknowledged(false);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setSensorStatus("offline");

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to communicate with the intrusion sensor."
        );
      }
    };

    checkSensor();

    const interval = window.setInterval(checkSensor, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const acknowledgeAlert = () => {
    setAcknowledged(true);
  };

  const statusLabel: Record<SensorStatus, string> = {
    connecting: "Connecting",
    clear: "Clear",
    triggered: "Intrusion Detected",
    offline: "Sensor Offline",
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="intrusion-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="intrusion-header">

        <div>

          <div className="breadcrumb">
            Main Menu / Intrusion Detection
          </div>

          <h1>
            Laser Intrusion Detection
          </h1>

          <p>
            Live status of the ESP32 laser-based
            intrusion sensor.
          </p>

        </div>

      </div>

      {/* ======================================================
          LIVE STATUS CARD
      ====================================================== */}

      <section
        className={`intrusion-status-card status-${sensorStatus}`}
      >

        <div className="intrusion-status-icon">
          {sensorStatus === "triggered" ? "⚠" : "⚡"}
        </div>

        <div className="intrusion-status-body">

          <span className="intrusion-status-label">
            SENSOR STATUS
          </span>

          <strong>
            {statusLabel[sensorStatus]}
          </strong>

          <small>
            {sensorId
              ? `Sensor ID: ${sensorId}`
              : "Waiting for microcontroller connection..."}
          </small>

        </div>

        {sensorStatus === "triggered" &&
          !acknowledged && (
            <button
              className="intrusion-ack-button"
              onClick={acknowledgeAlert}
            >
              Acknowledge Alert
            </button>
          )}

      </section>

      {lastTriggeredAt && (
        <p className="intrusion-last-triggered">
          Last triggered:{" "}
          {new Date(lastTriggeredAt).toLocaleString()}
        </p>
      )}

      {errorMessage && (
        <p className="intrusion-error-message">
          {errorMessage} — the backend endpoint for this
          sensor has not been implemented yet.
        </p>
      )}

    </div>
  );
}
