import { useNavigate } from "react-router-dom";
import {
  Scale,
  ShieldAlert,
  Thermometer,
  HardDrive,
  Cpu,
  ArrowRight,
} from "lucide-react";
import "./Home.css";

type SystemOption = {
  key: string;
  title: string;
  description: string;
  icon: typeof Scale;
  accent: "blue" | "red" | "green" | "purple" | "teal";
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
    accent: "red",
    path: "/security/intrusion-detection",
  },
  {
    key: "environment",
    title: "Environment Monitoring",
    description: "Smoke and temperature sensor readings.",
    icon: Thermometer,
    accent: "green",
    path: "/security/environment-monitoring",
  },
  {
    key: "inventory",
    title: "Hardware Inventory",
    description: "Computer hardware inventory system.",
    icon: HardDrive,
    accent: "purple",
    path: "/inventory",
  },
  {
    key: "pc-info",
    title: "PC Information System",
    description: "Per-machine hardware and security assessment reports.",
    icon: Cpu,
    accent: "teal",
    path: "/pc-info",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-brand-header">
          <img
            src="/PNPC-LOGO.png"
            alt="Philippine National Police"
            className="home-logo"
          />

          <div className="home-brand-text">
            <span className="home-brand-eyebrow">Philippine National Police</span>
            <h2 className="home-brand-title">ITMS Department</h2>
            <span className="home-brand-subtitle">
              Information Technology Management Service
            </span>
          </div>

          <img
            src="/PNP-ITMS-LOGO.png"
            alt="PNP ITMS"
            className="home-logo"
          />
        </div>

        <div className="home-header">
          <h1>Choose a system</h1>
          <p>Select where you'd like to sign in</p>
        </div>

        <div className="home-grid">
          {OPTIONS.map(({ key, title, description, icon: Icon, accent, path }) => (
            <button
              key={key}
              type="button"
              className={`home-card home-card-${accent}`}
              onClick={() => navigate(path)}
            >
              <span className="home-card-icon">
                <Icon size={26} strokeWidth={1.75} />
              </span>

              <span className="home-card-title">{title}</span>
              <span className="home-card-desc">{description}</span>

              <span className="home-card-arrow">
                <ArrowRight size={20} strokeWidth={1.75} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
