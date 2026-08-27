import { useEffect, useState } from "react";
import "./EnvironmentMonitoring.css";

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
 * GET /environment-monitoring/latest
 * {
 *   "temperature": 28.4,
 *   "smoke_level": 320,
 *   "status": "normal" | "smoke_detected" | "high_temperature",
 *   "sensor_id": "ENV-01",
 *   "updated_at": "2026-08-27T09:15:00.000Z" | null
 * }
 * ============================================================
 */

type ConnectionState = "connecting" | "online" | "offline";

type EnvironmentStatus =
  | "normal"
  | "smoke_detected"
  | "high_temperature";

type EnvironmentResponse = {
  temperature: number | null;
  smoke_level: number | null;
  status: EnvironmentStatus;
  sensor_id?: string;
  updated_at?: string | null;
};

/*
 * ============================================================
 * SMOKE & TEMPERATURE MONITORING PAGE
 * ============================================================
 */

export default function EnvironmentMonitoring() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");

  const [status, setStatus] =
    useState<EnvironmentStatus>("normal");

  const [temperature, setTemperature] =
    useState<number | null>(null);

  const [smokeLevel, setSmokeLevel] =
    useState<number | null>(null);

  const [sensorId, setSensorId] =
    useState<string>("");

  const [updatedAt, setUpdatedAt] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string>("");

  /*
   * ============================================================
   * POLL THE MICROCONTROLLER READING ENDPOINT
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    const checkReading = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/environment-monitoring/latest`,
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

        const data: EnvironmentResponse =
          await response.json();

        if (cancelled) {
          return;
        }

        setConnectionState("online");
        setStatus(data.status);
        setTemperature(data.temperature);
        setSmokeLevel(data.smoke_level);
        setSensorId(data.sensor_id ?? "");
        setUpdatedAt(data.updated_at ?? null);
        setErrorMessage("");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setConnectionState("offline");

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to communicate with the environment sensor."
        );
      }
    };

    checkReading();

    const interval = window.setInterval(checkReading, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const statusLabel: Record<EnvironmentStatus, string> = {
    normal: "Normal",
    smoke_detected: "Smoke Detected",
    high_temperature: "High Temperature",
  };

  const cardStatus =
    connectionState !== "online" ? connectionState : status;

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="environment-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="environment-header">

        <div>

          <div className="breadcrumb">
            Main Menu / Smoke &amp; Temperature
          </div>

          <h1>
            Smoke &amp; Temperature Monitoring
          </h1>

          <p>
            Live readings from the ESP32 smoke and
            temperature sensors.
          </p>

        </div>

      </div>

      {/* ======================================================
          LIVE STATUS CARD
      ====================================================== */}

      <section
        className={`environment-status-card status-${cardStatus}`}
      >

        <div className="environment-status-icon">
          {status === "smoke_detected"
            ? "🔥"
            : status === "high_temperature"
            ? "🌡"
            : "✓"}
        </div>

        <div className="environment-status-body">

          <span className="environment-status-label">
            SENSOR STATUS
          </span>

          <strong>
            {connectionState === "connecting"
              ? "Connecting"
              : connectionState === "offline"
              ? "Sensor Offline"
              : statusLabel[status]}
          </strong>

          <small>
            {sensorId
              ? `Sensor ID: ${sensorId}`
              : "Waiting for microcontroller connection..."}
          </small>

        </div>

      </section>

      {/* ======================================================
          READINGS
      ====================================================== */}

      <div className="environment-readings">

        <div className="environment-reading-card">

          <span className="environment-reading-label">
            TEMPERATURE
          </span>

          <strong>
            {temperature != null
              ? `${temperature.toFixed(1)} °C`
              : "—"}
          </strong>

        </div>

        <div className="environment-reading-card">

          <span className="environment-reading-label">
            SMOKE LEVEL
          </span>

          <strong>
            {smokeLevel != null ? smokeLevel : "—"}
          </strong>

        </div>

      </div>

      {updatedAt && (
        <p className="environment-updated-at">
          Last updated: {new Date(updatedAt).toLocaleString()}
        </p>
      )}

      {errorMessage && (
        <p className="environment-error-message">
          {errorMessage} — waiting for the ESP32 to report
          readings.
        </p>
      )}

    </div>
  );
}
