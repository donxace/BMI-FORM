import { useEffect } from "react";
import "./StatDrilldownModal.css";

/*
 * ============================================================
 * STAT DRILLDOWN MODAL
 *
 * Shared "who are these numbers" drill-down used by any stat
 * card across the app (Dashboard, Analytics, Personnel,
 * Assessment, Report). Pass it a title/subtitle and a flat list
 * of rows -- it doesn't know or care what kind of stat it is.
 * ============================================================
 */

export type DrilldownRow = {
  id: string | number;
  initials: string;
  title: string;
  subtitle?: string;
  metaText?: string;
  value?: string;
  valueUnit?: string;
  badgeLabel?: string;
  badgeClass?: string;
};

export default function StatDrilldownModal({
  title,
  subtitle,
  rows,
  emptyMessage = "No records found.",
  onClose,
}: {
  title: string;
  subtitle?: string;
  rows: DrilldownRow[];
  emptyMessage?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="sdm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="sdm-panel">
        <div className="sdm-header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          <button
            type="button"
            className="sdm-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="sdm-body">
          {rows.length === 0 ? (
            <div className="sdm-empty">{emptyMessage}</div>
          ) : (
            rows.map((row) => (
              <div className="sdm-row" key={row.id}>
                <div className="sdm-person">
                  <div className="sdm-avatar">{row.initials}</div>
                  <div className="sdm-person-text">
                    <strong>{row.title}</strong>
                    {row.subtitle && <small>{row.subtitle}</small>}
                  </div>
                </div>

                <div className="sdm-meta-group">
                  {row.metaText && (
                    <span className="sdm-meta-text">{row.metaText}</span>
                  )}

                  {row.value && (
                    <span className="sdm-value">
                      {row.value}
                      {row.valueUnit && <small> {row.valueUnit}</small>}
                    </span>
                  )}

                  {row.badgeLabel && (
                    <span className={`sdm-badge ${row.badgeClass ?? ""}`}>
                      <span className="sdm-badge-dot" />
                      {row.badgeLabel}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
