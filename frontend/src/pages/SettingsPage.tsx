import { useState } from "react";
import "./SettingsPage.css";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type SettingsState = {
  systemName: string;
  organization: string;
  administratorName: string;
  administratorRole: string;

  emailNotifications: boolean;
  assessmentNotifications: boolean;
  reportNotifications: boolean;

  autoRefresh: boolean;
  compactTable: boolean;

  defaultClassification: "WHO" | "PNP";
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";

  apiUrl: string;
};

/*
 * ============================================================
 * SETTINGS PAGE
 * ============================================================
 */

export default function Settings() {
  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  const [settings, setSettings] =
    useState<SettingsState>({
      systemName: "BMI Monitoring System",
      organization: "PNP Health Service",
      administratorName: "Administrator",
      administratorRole: "Health Service",

      emailNotifications: true,
      assessmentNotifications: true,
      reportNotifications: false,

      autoRefresh: true,
      compactTable: false,

      defaultClassification: "WHO",
      dateFormat: "MM/DD/YYYY",

      apiUrl: "http://localhost:3000",
    });

  const [saved, setSaved] =
    useState(false);

  /*
   * ============================================================
   * UPDATE SETTING
   * ============================================================
   */

  const updateSetting = <
    K extends keyof SettingsState
  >(
    key: K,
    value: SettingsState[K],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  /*
   * ============================================================
   * SAVE SETTINGS
   * ============================================================
   */

  const saveSettings = () => {
    localStorage.setItem(
      "bmi_system_settings",
      JSON.stringify(settings),
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 3000);
  };

  /*
   * ============================================================
   * RESET SETTINGS
   * ============================================================
   */

  const resetSettings = () => {
    const defaultSettings: SettingsState = {
      systemName: "BMI Monitoring System",
      organization: "PNP Health Service",
      administratorName: "Administrator",
      administratorRole: "Health Service",

      emailNotifications: true,
      assessmentNotifications: true,
      reportNotifications: false,

      autoRefresh: true,
      compactTable: false,

      defaultClassification: "WHO",
      dateFormat: "MM/DD/YYYY",

      apiUrl: "http://localhost:3000",
    };

    setSettings(defaultSettings);
    setSaved(false);
  };

  /*
   * ============================================================
   * CURRENT DATE
   * ============================================================
   */

  const currentDate =
    new Date().toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="settings-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="settings-header">

        <div>

          <div className="breadcrumb">
            Main Menu / Settings
          </div>

          <h1>
            System Settings
          </h1>

          <p>
            Configure your BMI Monitoring System,
            account preferences, reports, and
            system behavior.
          </p>

        </div>

        <div className="settings-date">

          <span>
            TODAY
          </span>

          <strong>
            {currentDate}
          </strong>

        </div>

      </div>

      {/* ======================================================
          STATUS BAR
      ====================================================== */}

      <section className="settings-status-card">

        <div className="settings-status-left">

          <div className="settings-status-icon">
            ✓
          </div>

          <div>

            <span>
              SYSTEM STATUS
            </span>

            <strong>
              All Services Operational
            </strong>

            <small>
              BMI system is connected and ready
              for use.
            </small>

          </div>

        </div>

        <div className="settings-online">

          <i />

          Online

        </div>

      </section>

      {/* ======================================================
          SETTINGS GRID
      ====================================================== */}

      <div className="settings-layout">

        {/* ====================================================
            LEFT COLUMN
        ==================================================== */}

        <div className="settings-main">

          {/* ==================================================
              SYSTEM INFORMATION
          ================================================== */}

          <section className="settings-card">

            <div className="settings-section-header">

              <div className="settings-section-title">

                <span className="settings-section-number">
                  01
                </span>

                <div>

                  <h2>
                    System Information
                  </h2>

                  <p>
                    Configure the basic information
                    displayed throughout the system.
                  </p>

                </div>

              </div>

            </div>

            <div className="settings-form-grid">

              <div className="settings-field">

                <label>
                  SYSTEM NAME
                </label>

                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(event) =>
                    updateSetting(
                      "systemName",
                      event.target.value,
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  ORGANIZATION
                </label>

                <input
                  type="text"
                  value={settings.organization}
                  onChange={(event) =>
                    updateSetting(
                      "organization",
                      event.target.value,
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  ADMINISTRATOR NAME
                </label>

                <input
                  type="text"
                  value={
                    settings.administratorName
                  }
                  onChange={(event) =>
                    updateSetting(
                      "administratorName",
                      event.target.value,
                    )
                  }
                />

              </div>

              <div className="settings-field">

                <label>
                  ROLE
                </label>

                <input
                  type="text"
                  value={
                    settings.administratorRole
                  }
                  onChange={(event) =>
                    updateSetting(
                      "administratorRole",
                      event.target.value,
                    )
                  }
                />

              </div>

            </div>

          </section>

          {/* ==================================================
              NOTIFICATIONS
          ================================================== */}

          <section className="settings-card">

            <div className="settings-section-header">

              <div className="settings-section-title">

                <span className="settings-section-number">
                  02
                </span>

                <div>

                  <h2>
                    Notifications
                  </h2>

                  <p>
                    Control which system events
                    generate notifications.
                  </p>

                </div>

              </div>

            </div>

            <div className="settings-options">

              <div className="settings-option">

                <div className="settings-option-icon blue">
                  !
                </div>

                <div className="settings-option-content">

                  <strong>
                    Email Notifications
                  </strong>

                  <small>
                    Receive important system
                    notifications and updates.
                  </small>

                </div>

                <label className="settings-switch">

                  <input
                    type="checkbox"
                    checked={
                      settings.emailNotifications
                    }
                    onChange={(event) =>
                      updateSetting(
                        "emailNotifications",
                        event.target.checked,
                      )
                    }
                  />

                  <span />

                </label>

              </div>

              <div className="settings-option">

                <div className="settings-option-icon green">
                  ✓
                </div>

                <div className="settings-option-content">

                  <strong>
                    Assessment Notifications
                  </strong>

                  <small>
                    Notify administrators when
                    new BMI assessments are recorded.
                  </small>

                </div>

                <label className="settings-switch">

                  <input
                    type="checkbox"
                    checked={
                      settings.assessmentNotifications
                    }
                    onChange={(event) =>
                      updateSetting(
                        "assessmentNotifications",
                        event.target.checked,
                      )
                    }
                  />

                  <span />

                </label>

              </div>

              <div className="settings-option">

                <div className="settings-option-icon purple">
                  XLS
                </div>

                <div className="settings-option-content">

                  <strong>
                    Report Notifications
                  </strong>

                  <small>
                    Receive notifications when
                    reports are generated.
                  </small>

                </div>

                <label className="settings-switch">

                  <input
                    type="checkbox"
                    checked={
                      settings.reportNotifications
                    }
                    onChange={(event) =>
                      updateSetting(
                        "reportNotifications",
                        event.target.checked,
                      )
                    }
                  />

                  <span />

                </label>

              </div>

            </div>

          </section>

          {/* ==================================================
              DISPLAY
          ================================================== */}

          <section className="settings-card">

            <div className="settings-section-header">

              <div className="settings-section-title">

                <span className="settings-section-number">
                  03
                </span>

                <div>

                  <h2>
                    Display & Behavior
                  </h2>

                  <p>
                    Configure how information is
                    displayed throughout the system.
                  </p>

                </div>

              </div>

            </div>

            <div className="settings-form-grid">

              <div className="settings-field">

                <label>
                  DEFAULT CLASSIFICATION
                </label>

                <select
                  value={
                    settings.defaultClassification
                  }
                  onChange={(event) =>
                    updateSetting(
                      "defaultClassification",
                      event.target.value as
                        | "WHO"
                        | "PNP",
                    )
                  }
                >

                  <option value="WHO">
                    WHO Classification
                  </option>

                  <option value="PNP">
                    PNP Classification
                  </option>

                </select>

              </div>

              <div className="settings-field">

                <label>
                  DATE FORMAT
                </label>

                <select
                  value={settings.dateFormat}
                  onChange={(event) =>
                    updateSetting(
                      "dateFormat",
                      event.target.value as
                        | "MM/DD/YYYY"
                        | "DD/MM/YYYY"
                        | "YYYY-MM-DD",
                    )
                  }
                >

                  <option value="MM/DD/YYYY">
                    MM/DD/YYYY
                  </option>

                  <option value="DD/MM/YYYY">
                    DD/MM/YYYY
                  </option>

                  <option value="YYYY-MM-DD">
                    YYYY-MM-DD
                  </option>

                </select>

              </div>

            </div>

            <div className="settings-options settings-options-spaced">

              <div className="settings-option">

                <div className="settings-option-icon blue">
                  ↻
                </div>

                <div className="settings-option-content">

                  <strong>
                    Automatic Refresh
                  </strong>

                  <small>
                    Automatically refresh dashboard
                    and assessment data.
                  </small>

                </div>

                <label className="settings-switch">

                  <input
                    type="checkbox"
                    checked={
                      settings.autoRefresh
                    }
                    onChange={(event) =>
                      updateSetting(
                        "autoRefresh",
                        event.target.checked,
                      )
                    }
                  />

                  <span />

                </label>

              </div>

              <div className="settings-option">

                <div className="settings-option-icon teal">
                  ≡
                </div>

                <div className="settings-option-content">

                  <strong>
                    Compact Tables
                  </strong>

                  <small>
                    Display more records by reducing
                    table spacing.
                  </small>

                </div>

                <label className="settings-switch">

                  <input
                    type="checkbox"
                    checked={
                      settings.compactTable
                    }
                    onChange={(event) =>
                      updateSetting(
                        "compactTable",
                        event.target.checked,
                      )
                    }
                  />

                  <span />

                </label>

              </div>

            </div>

          </section>

          {/* ==================================================
              API / CONNECTION
          ================================================== */}

          <section className="settings-card">

            <div className="settings-section-header">

              <div className="settings-section-title">

                <span className="settings-section-number">
                  04
                </span>

                <div>

                  <h2>
                    System Connection
                  </h2>

                  <p>
                    Configure the connection between
                    the frontend and BMI backend service.
                  </p>

                </div>

              </div>

            </div>

            <div className="settings-field">

              <label>
                BACKEND API URL
              </label>

              <input
                type="text"
                value={settings.apiUrl}
                onChange={(event) =>
                  updateSetting(
                    "apiUrl",
                    event.target.value,
                  )
                }
              />

              <small className="settings-field-help">
                Example: http://localhost:3000
              </small>

            </div>

            <div className="connection-status">

              <div className="connection-indicator">

                <i />

                <div>

                  <strong>
                    Backend Service
                  </strong>

                  <small>
                    Connected to BMI API
                  </small>

                </div>

              </div>

              <span>
                ONLINE
              </span>

            </div>

          </section>

        </div>

        {/* ====================================================
            RIGHT COLUMN
        ==================================================== */}

        <aside className="settings-sidebar">

          {/* ==================================================
              ACCOUNT
          ================================================== */}

          <section className="settings-card account-card">

            <div className="account-avatar">
              AD
            </div>

            <span className="account-label">
              CURRENT ACCOUNT
            </span>

            <h3>
              {settings.administratorName}
            </h3>

            <p>
              {settings.administratorRole}
            </p>

            <div className="account-status">

              <i />

              Active Administrator

            </div>

          </section>

          {/* ==================================================
              SYSTEM MODULES
          ================================================== */}

          <section className="settings-card">

            <div className="small-card-header">

              <h3>
                System Modules
              </h3>

              <p>
                Current service status
              </p>

            </div>

            <div className="module-list">

              <div className="module-item">

                <div>
                  <strong>
                    Dashboard
                  </strong>

                  <small>
                    Monitoring
                  </small>
                </div>

                <span className="module-online">
                  Online
                </span>

              </div>

              <div className="module-item">

                <div>
                  <strong>
                    Measurements
                  </strong>

                  <small>
                    BMI recording
                  </small>
                </div>

                <span className="module-online">
                  Online
                </span>

              </div>

              <div className="module-item">

                <div>
                  <strong>
                    Assessments
                  </strong>

                  <small>
                    BMI evaluation
                  </small>
                </div>

                <span className="module-online">
                  Online
                </span>

              </div>

              <div className="module-item">

                <div>
                  <strong>
                    Reports
                  </strong>

                  <small>
                    Excel generation
                  </small>
                </div>

                <span className="module-online">
                  Online
                </span>

              </div>

              <div className="module-item">

                <div>
                  <strong>
                    Analytics
                  </strong>

                  <small>
                    Data analysis
                  </small>
                </div>

                <span className="module-online">
                  Online
                </span>

              </div>

            </div>

          </section>

          {/* ==================================================
              QUICK INFORMATION
          ================================================== */}

          <section className="settings-card">

            <div className="small-card-header">

              <h3>
                System Information
              </h3>

              <p>
                Current application details
              </p>

            </div>

            <div className="system-info-list">

              <div>
                <span>
                  Version
                </span>

                <strong>
                  v1.0.0
                </strong>
              </div>

              <div>
                <span>
                  Database
                </span>

                <strong>
                  MySQL
                </strong>
              </div>

              <div>
                <span>
                  Backend
                </span>

                <strong>
                  NestJS
                </strong>
              </div>

              <div>
                <span>
                  Frontend
                </span>

                <strong>
                  React + Vite
                </strong>
              </div>

              <div>
                <span>
                  Export
                </span>

                <strong>
                  Excel XLSX
                </strong>
              </div>

            </div>

          </section>

        </aside>

      </div>

      {/* ======================================================
          ACTION BAR
      ====================================================== */}

      <section className="settings-actions-card">

        <div>

          <strong>
            Save System Settings
          </strong>

          <span>
            Changes will be saved to this browser.
          </span>

        </div>

        <div className="settings-actions">

          <button
            className="settings-reset-button"
            onClick={resetSettings}
          >
            Reset
          </button>

          <button
            className="settings-save-button"
            onClick={saveSettings}
          >
            <span>
              ✓
            </span>

            Save Changes
          </button>

        </div>

      </section>

      {saved && (

        <div className="settings-save-message">

          <span>
            ✓
          </span>

          Settings saved successfully.

        </div>

      )}

    </div>
  );
}