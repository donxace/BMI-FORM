import { useEffect, useState } from "react";
import { Flame, Thermometer, CheckCircle2 } from "lucide-react";
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
   * GAUGE MATH
   * ============================================================
   */

  const TEMP_MAX = 60; // display ceiling, °C
  const TEMP_HOT = 50; // matches the backend's high_temperature threshold
  const TEMP_WARM = 35; // early-warning zone, below the actual alert

  const SMOKE_MAX = 1800; // matches the backend's smoke_detected threshold
  const SMOKE_CAUTION = 900; // early-warning zone, below the actual alert

  const tempPct = Math.max(
    0,
    Math.min(100, ((temperature ?? 0) / TEMP_MAX) * 100)
  );

  const smokePct = Math.max(
    0,
    Math.min(100, ((smokeLevel ?? 0) / SMOKE_MAX) * 100)
  );

  const tempZone =
    (temperature ?? 0) >= TEMP_HOT
      ? "hot"
      : (temperature ?? 0) >= TEMP_WARM
      ? "warm"
      : "cool";

  const smokeZone =
    (smokeLevel ?? 0) >= SMOKE_MAX
      ? "danger"
      : (smokeLevel ?? 0) >= SMOKE_CAUTION
      ? "caution"
      : "clear";

  const SMOKE_RADIUS = 50;
  const SMOKE_CIRCUMFERENCE = 2 * Math.PI * SMOKE_RADIUS;
  const smokeDashOffset =
    SMOKE_CIRCUMFERENCE * (1 - smokePct / 100);

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
          {status === "smoke_detected" ? (
            <Flame size={24} strokeWidth={2} />
          ) : status === "high_temperature" ? (
            <Thermometer size={24} strokeWidth={2} />
          ) : (
            <CheckCircle2 size={24} strokeWidth={2} />
          )}
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

        {/* ==================================================
            TEMPERATURE — ANIMATED THERMOMETER
        =================================================== */}

        <div className={`environment-reading-card zone-${tempZone}`}>

          <span className="environment-reading-label">
            TEMPERATURE
          </span>

          <div className="thermometer">

            <div className="thermometer-tube">
              <div
                className="thermometer-fill"
                style={{ height: `${tempPct}%` }}
              />
            </div>

            <div className="thermometer-bulb">
              <div className="thermometer-bulb-core" />
            </div>

          </div>

          <strong>
            {temperature != null
              ? `${temperature.toFixed(1)} °C`
              : "—"}
          </strong>

          <small className={`environment-reading-badge zone-${tempZone}`}>
            {tempZone === "hot"
              ? "High Temperature"
              : tempZone === "warm"
              ? "Elevated"
              : "Normal"}
          </small>

        </div>

        {/* ==================================================
            SMOKE LEVEL — ANIMATED RADIAL GAUGE
        =================================================== */}

        <div className={`environment-reading-card zone-${smokeZone}`}>

          <span className="environment-reading-label">
            SMOKE LEVEL
          </span>

          <div className="smoke-gauge">

            <svg viewBox="0 0 120 120" className="smoke-gauge-svg">
              <circle
                className="smoke-gauge-track"
                cx="60"
                cy="60"
                r={SMOKE_RADIUS}
              />
              <circle
                className="smoke-gauge-fill"
                cx="60"
                cy="60"
                r={SMOKE_RADIUS}
                strokeDasharray={SMOKE_CIRCUMFERENCE}
                strokeDashoffset={smokeDashOffset}
              />
            </svg>

            <div className="smoke-gauge-center">
              <strong>{smokeLevel ?? "—"}</strong>
              <small>/ {SMOKE_MAX}</small>
            </div>

            <div className="smoke-wisp wisp-1" />
            <div className="smoke-wisp wisp-2" />
            <div className="smoke-wisp wisp-3" />

          </div>

          <small className={`environment-reading-badge zone-${smokeZone}`}>
            {smokeZone === "danger"
              ? "Smoke Detected"
              : smokeZone === "caution"
              ? "Elevated"
              : "Clear"}
          </small>

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
