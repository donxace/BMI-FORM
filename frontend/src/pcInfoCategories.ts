import {
  Info,
  ClipboardList,
  Cpu,
  CircuitBoard,
  MemoryStick,
  MonitorCog,
  HardDrive,
  AppWindow,
  ShieldCheck,
  Network,
  Radar,
  type LucideIcon,
} from "lucide-react";

// One entry per distinct Table-1 ("PC Information Details") category in
// security_assessment_findings — the raw category strings come straight
// from the FOREN CSV (backend/scripts/import-security-assessment.js).
// Table 2 ("PC Connection Status") has no categories at all, and Table 3
// ("Component Status") is its own single checklist page — see
// PcInfoConnections.tsx / PcInfoComponentStatus.tsx — so neither belongs
// in this list even though a couple of Table 3's category names
// (SECURITY, SYSTEM) happen to overlap with Table 1's.
export type PcInfoCategoryMeta = {
  category: string;
  slug: string;
  label: string;
  icon: LucideIcon;
};

export const PC_INFO_CATEGORIES: PcInfoCategoryMeta[] = [
  { category: "SYSTEM", slug: "system", label: "System", icon: Info },
  { category: "ASSESSMENT", slug: "assessment", label: "Assessment Meta", icon: ClipboardList },
  { category: "CPU", slug: "cpu", label: "CPU", icon: Cpu },
  { category: "MOTHERBOARD", slug: "motherboard", label: "Motherboard", icon: CircuitBoard },
  { category: "RAM", slug: "ram", label: "RAM", icon: MemoryStick },
  { category: "GPU", slug: "gpu", label: "GPU", icon: MonitorCog },
  { category: "STORAGE", slug: "storage", label: "Storage", icon: HardDrive },
  { category: "OPERATING SYSTEM", slug: "operating-system", label: "Operating System", icon: AppWindow },
  { category: "SECURITY", slug: "security", label: "Security", icon: ShieldCheck },
  { category: "NETWORK", slug: "network", label: "Network", icon: Network },
  { category: "NETWORK INTEGRITY", slug: "network-integrity", label: "Network Integrity", icon: Radar },
];

export function categoryForSlug(slug: string): PcInfoCategoryMeta | undefined {
  return PC_INFO_CATEGORIES.find((c) => c.slug === slug);
}
