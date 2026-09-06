import { useEffect, useMemo, useState } from "react";
import { Flame, Thermometer, CheckCircle2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./EnvironmentMonitoring.css";

/*
 * ============================================================
 * CHART COLORS
 *
 * Categorical slots (not the status palette) — a trend line is
 * an identity/magnitude encoding, not a state indicator, so it
 * stays independent of the red/orange/green used by the status
 * badges and gauges elsewhere on this page.
 * ============================================================
 */

const CHART_SURFACE = "#fcfcfb";
const CHART_GRID = "#e1e0d9";
const CHART_MUTED = "#898781";
const TEMP_COLOR = "#2a78d6"; // categorical slot 1 (blue)
const SMOKE_COLOR = "#eb6834"; // categorical slot 2 (orange)

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

type EnvironmentLogEntry = {
  log_id: number;
  sensor_id: string | null;
  status: EnvironmentStatus;
  temperature: number | string | null;
  smoke_level: number | null;
  event_time: string;
  created_at: string;
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

  const [logs, setLogs] =
    useState<EnvironmentLogEntry[]>([]);

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

  /*
   * ============================================================
   * ALERT LOG HISTORY
   *
   * Every status transition (entering/leaving smoke_detected or
   * high_temperature) is logged on the backend (environment_logs
   * table). Poll it at a slower interval than the live status,
   * since it's just a history list.
   * ============================================================
   */

  useEffect(() => {
    let cancelled = false;

    const fetchLogs = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/environment-monitoring/logs?limit=20`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${localStorage.getItem("environmentAuthToken")}`,
            },
            cache: "no-store",
          }
        );

        if (!response.ok || cancelled) {
          return;
        }

        const data: EnvironmentLogEntry[] =
          await response.json();

        if (!cancelled) {
          setLogs(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("ENVIRONMENT LOG FETCH ERROR:", error);
        }
      }
    };

    fetchLogs();

    const interval = window.setInterval(fetchLogs, 5000);

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
   * CHART DATA
   *
   * Logs come back newest-first; the chart reads left-to-right
   * chronologically, so reverse them.
   * ============================================================
   */

  const chartData = useMemo(
    () =>
      [...logs].reverse().map((entry) => ({
        time: new Date(entry.event_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        temperature:
          entry.temperature != null ? Number(entry.temperature) : null,
        smoke_level: entry.smoke_level,
      })),
    [logs]
  );

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
   * TREND CARD (single-axis small multiple)
   *
   * Temperature and smoke live on wildly different scales, so
   * each gets its own single-axis chart rather than one chart
   * with two y-scales. Each is a single series, so no legend box
   * — the title plus a small color dot next to it name the line.
   * ============================================================
   */

  const renderTrendCard = ({
    title,
    dataKey,
    color,
    currentValue,
    chartData: series,
  }: {
    title: string;
    dataKey: "temperature" | "smoke_level";
    color: string;
    currentValue: string;
    unit: string;
    chartData: typeof chartData;
  }) => (
    <section className="environment-trend-card" key={dataKey}>

      <div className="environment-trend-header">
        <div className="environment-trend-title">
          <span
            className="environment-trend-dot"
            style={{ background: color }}
          />
          {title}
        </div>

        <strong className="environment-trend-value">
          {currentValue}
        </strong>
      </div>

      {series.length === 0 ? (

        <p className="environment-log-empty">
          No data to chart yet.
        </p>

      ) : (

        <div style={{ width: "100%", height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`fill-${dataKey}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={color}
                    stopOpacity={0.18}
                  />
                  <stop
                    offset="100%"
                    stopColor={color}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke={CHART_GRID}
                strokeDasharray="0"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                stroke={CHART_MUTED}
                tickLine={false}
                axisLine={{ stroke: CHART_GRID }}
                style={{ fontSize: "10px" }}
                minTickGap={24}
              />

              <YAxis
                stroke={CHART_MUTED}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickCount={4}
                style={{ fontSize: "10px" }}
                width={40}
              />

              <Tooltip
                cursor={{ stroke: CHART_GRID, strokeWidth: 1 }}
                contentStyle={{
                  background: "#172033",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "11px",
                  padding: "8px 10px",
                }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#ffffff" }}
              />

              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                fill={`url(#fill-${dataKey})`}
                dot={{
                  r: 4,
                  fill: color,
                  stroke: CHART_SURFACE,
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 5,
                  fill: color,
                  stroke: CHART_SURFACE,
                  strokeWidth: 2,
                }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      )}

    </section>
  );

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

      {/* ======================================================
          RECENT ACTIVITY LOG + TREND CHART
      ====================================================== */}

      <div className="environment-activity-layout">

        <section className="environment-log-card">

          <h2>
            Recent Activity
          </h2>

          {logs.length === 0 ? (

            <p className="environment-log-empty">
              No alerts logged yet.
            </p>

          ) : (

            <div className="environment-log-table-wrapper">
              <table className="environment-log-table">

                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Temperature</th>
                    <th>Smoke Level</th>
                    <th>Sensor</th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((entry) => (

                    <tr key={entry.log_id}>

                      <td>
                        {new Date(
                          entry.event_time
                        ).toLocaleString()}
                      </td>

                      <td>
                        <span
                          className={`environment-log-badge ${entry.status}`}
                        >
                          {statusLabel[entry.status]}
                        </span>
                      </td>

                      <td>
                        {entry.temperature != null
                          ? `${Number(entry.temperature).toFixed(1)} °C`
                          : "—"}
                      </td>

                      <td>
                        {entry.smoke_level ?? "—"}
                      </td>

                      <td>
                        {entry.sensor_id || "—"}
                      </td>

                    </tr>

                  ))}
                </tbody>

              </table>
            </div>

          )}

        </section>

        <div className="environment-trend-column">

          {renderTrendCard({
            title: "Temperature Trend",
            dataKey: "temperature",
            color: TEMP_COLOR,
            currentValue:
              temperature != null ? `${temperature.toFixed(1)}°C` : "—",
            unit: "°C",
            chartData,
          })}

          {renderTrendCard({
            title: "Smoke Level Trend",
            dataKey: "smoke_level",
            color: SMOKE_COLOR,
            currentValue: smokeLevel != null ? String(smokeLevel) : "—",
            unit: "",
            chartData,
          })}

        </div>

      </div>

    </div>
  );
}
