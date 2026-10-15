import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Scale,
  ShieldAlert,
  Thermometer,
  HardDrive,
  ArrowRight,
} from "lucide-react";
import "./Home.css";
import { IT_ASSETS_LOGIN_PATH } from "../utils/itAssetsSession";

type SystemOption = {
  key: string;
  title: string;
  description: string;
  icon: typeof Scale;
  accent: "blue";
  path: string;
};

const OPTIONS: SystemOption[] = [
  {
    key: "bmi",
    title: "BMI System",
    description: "Personnel measurement, assessments, and reports.",
    icon: Scale,
    accent: "blue",
    path: "/login",
  },
  {
    key: "intrusion",
    title: "Intrusion Detection",
    description: "Facility security monitoring and alerts.",
    icon: ShieldAlert,
    accent: "blue",
    path: "/security/intrusion-login",
  },
  {
    key: "environment",
    title: "Environment Monitoring",
    description: "Smoke and temperature sensor readings.",
    icon: Thermometer,
    accent: "blue",
    path: "/security/environment-login",
  },
  {
    key: "it-assets",
    title: "IT Asset Management",
    description:
      "Hardware inventory and PC health & security in one place: every device, who holds it, and whether each computer is scanned and safe.",
    icon: HardDrive,
    accent: "blue",
    path: IT_ASSETS_LOGIN_PATH,
  },
];

// How long the leaving-fade plays before the route actually changes —
// keep in sync with the .home-leaving transition duration in Home.css.
const LEAVE_TRANSITION_MS = 220;

export default function Home() {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState(OPTIONS[0].key);
  const [leaving, setLeaving] = useState(false);

  const selected =
    OPTIONS.find((option) => option.key === selectedKey) ?? OPTIONS[0];
  const SelectedIcon = selected.icon;

  const handleSignIn = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => navigate(selected.path), LEAVE_TRANSITION_MS);
  };

  return (
    <div className={`home-container ${leaving ? "home-leaving" : ""}`}>
      <header className="home-topbar">
        <img
          src="/PNPC-LOGO.png"
          alt="Philippine National Police"
          className="home-topbar-logo"
        />

        <div className="home-topbar-text">
          <span className="home-topbar-eyebrow">
            Philippine National Police
          </span>
          <span className="home-topbar-title">ITMS Department</span>
        </div>

        <img
          src="/PNP-ITMS-LOGO.png"
          alt="PNP ITMS"
          className="home-topbar-logo"
        />
      </header>

      <div className="home-chooser">
        <nav className="home-list" aria-label="Choose a system">
          <p className="home-list-heading">Choose a system</p>

          {OPTIONS.map(({ key, title, icon: Icon, accent }) => (
            <button
              key={key}
              type="button"
              className={`home-list-item home-list-item-${accent} ${
                key === selectedKey ? "active" : ""
              }`}
              aria-pressed={key === selectedKey}
              onClick={() => setSelectedKey(key)}
            >
              <span className="home-list-icon">
                <Icon size={20} strokeWidth={1.75} />
              </span>
              <span className="home-list-label">{title}</span>
            </button>
          ))}
        </nav>

        <section
          className={`home-preview home-preview-${selected.accent}`}
          key={selected.key}
        >
          <span className="home-preview-icon">
            <SelectedIcon size={40} strokeWidth={1.5} />
          </span>

          <h1 className="home-preview-title">{selected.title}</h1>
          <p className="home-preview-desc">{selected.description}</p>

          <button
            type="button"
            className="home-preview-cta"
            onClick={handleSignIn}
          >
            Sign In
            <ArrowRight size={18} strokeWidth={2} />
          </button>
        </section>
      </div>
    </div>
  );
}
