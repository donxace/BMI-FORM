import { useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import {
  Search,
  Users,
  Mars,
  Venus,
  UserPlus,
  Download,
  FileText,
  ChevronRight,
  QrCode,
  Printer,
} from "lucide-react";
import "./Personnel.css";
import StatDrilldownModal, {
  type DrilldownRow,
} from "../components/StatDrilldownModal";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type Personnel = {
  personnel_id: number;
  rfid_uid: string;
  is_claimed: boolean;
  rank: string;
  surname: string;
  first_name: string;
  middle_initial: string | null;
  q: string | null;
  age: number | null;
  sex: string | null;
  office: string | null;
};

type Rank = {
  rank_id: number;
  rank_name: string;
  hierarchy_level: number;
};

/*
 * ============================================================
 * HARDCODED ARDUINO RFID
 * ============================================================
 */

const ARDUINO_RFID = "RFID-ARDUINO-002";

/*
 * ============================================================
 * HELPER FUNCTIONS
 * ============================================================
 */

function getFullName(personnel: Personnel) {
  return [
    personnel.first_name,
    personnel.middle_initial,
    personnel.surname,
  ]
    .filter(Boolean)
    .join(" ");
}

function getInitials(personnel: Personnel) {
  const firstInitial = personnel.first_name?.charAt(0) ?? "";
  const lastInitial = personnel.surname?.charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

/*
 * ============================================================
 * PERSONNEL PAGE
 * ============================================================
 */

export default function Personnel() {
  // bmi_viewer can't add or edit; only bmi_admin can delete (the one
  // irreversible action here) — same pattern as Hardware Inventory. The
  // backend rejects the requests anyway; hiding the buttons avoids a
  // confusing 401.
  const bmiRole = localStorage.getItem("userRole");
  const canEdit = bmiRole === "bmi_admin" || bmiRole === "bmi_editor" || bmiRole === "admin";
  const canDelete = bmiRole === "bmi_admin" || bmiRole === "admin";

  /*
   * ============================================================
   * URL SEARCH PARAMETERS
   * ============================================================
   */

  const [searchParams, setSearchParams] = useSearchParams();

  /*
   * ============================================================
   * PERSONNEL & RANKS STATE
   * ============================================================
   */

  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [availableRanks, setAvailableRanks] = useState<Rank[]>([]);
  const [loadingPersonnel, setLoadingPersonnel] = useState(true);
  const [personnelError, setPersonnelError] = useState("");

  // Stat card drill-down modal ("who are these numbers")
  const [activeStat, setActiveStat] = useState<
    "total" | "male" | "female" | "search" | null
  >(null);

  /*
   * ============================================================
   * SEARCH / FILTER STATE
   * ============================================================
   */

  const [search, setSearch] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [sexFilter, setSexFilter] = useState("");
  const [officeFilter, setOfficeFilter] = useState("");

  /*
   * ============================================================
   * PAGINATION STATE
   * ============================================================
   */

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rankFilter, sexFilter, officeFilter]);

  /*
   * ============================================================
   * ADD PERSONNEL MODAL
   * ============================================================
   */

  /*
   * ============================================================
   * EDIT PERSONNEL MODAL STATE
   * ============================================================
   */
  const [showEditModal, setShowEditModal] = useState(false);
  // The "View" action reuses this same modal in a read-only state,
  // rather than duplicating the whole field layout — it was previously
  // a stub that only logged to the console and showed nothing.
  const [viewOnlyMode, setViewOnlyMode] = useState(false);
  const [editingPersonnelId, setEditingPersonnelId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    rfid_uid: "",
    rank: "",
    surname: "",
    first_name: "",
    middle_initial: "",
    q: "",
    age: "",
    sex: "",
    office: "",
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [savingPersonnel, setSavingPersonnel] = useState(false);

  /*
   * ============================================================
   * QR BADGE MODAL STATE
   *
   * Renders a personnel's rfid_uid as a scannable QR code — the
   * counterpart to the camera-based QR scanner in Measurement.tsx,
   * which decodes the same rfid_uid and posts it to the identical
   * POST /personnel/rfid/scan endpoint a physical RFID tap uses.
   * ============================================================
   */
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrPersonnel, setQrPersonnel] = useState<Personnel | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrError, setQrError] = useState("");

  /*
   * ============================================================
   * PROVISION RFID CARD
   *
   * Registers a bare rfid_uid ahead of time (e.g. handing out
   * physical stickers) so personnel can later claim it
   * themselves at login — fill in their own name/rank/PIN via
   * the "Use Badge ID" / scan flow on the Login page.
   * ============================================================
   */

  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionRfidUid, setProvisionRfidUid] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState("");
  const [provisionScanStatus, setProvisionScanStatus] = useState<
    "waiting" | "detected"
  >("waiting");

  /*
   * While the modal is open, poll the same RFID endpoint the
   * ESP32 reader reports to, so tapping a blank card on the
   * reader fills in its UID automatically instead of the admin
   * having to know/type it (blank stickers have no visible ID).
   */

  useEffect(() => {
    if (!showProvisionModal) {
      return;
    }

    setProvisionScanStatus("waiting");
    setProvisionRfidUid("");

    let cancelled = false;

    // Whatever scan_id is already "latest" the instant the modal
    // opens is stale — a leftover from some earlier tap, not
    // something the admin just scanned. Baseline it on the first
    // poll (without acting on it) so only a scan_id that shows up
    // AFTER that auto-fills the field.
    let baselineScanId: number | null | undefined = undefined;

    const checkRfid = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/personnel/rfid/latest`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        if (!response.ok || cancelled) {
          return;
        }

        const data = await response.json();

        if (baselineScanId === undefined) {
          baselineScanId = data.scan_id ?? null;
          return;
        }

        if (!data.rfid_uid || data.scan_id === baselineScanId) {
          return;
        }

        setProvisionRfidUid(data.rfid_uid);
        setProvisionScanStatus("detected");
        setProvisionError(
          data.personnel
            ? "This card is already assigned to someone — scan a blank one, or edit the UID above."
            : ""
        );
      } catch (err) {
        console.error("PROVISION RFID SCAN POLL ERROR:", err);
      }
    };

    checkRfid();

    const interval = window.setInterval(checkRfid, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [showProvisionModal]);

  /*
   * ============================================================
   * ADD PERSONNEL FORM
   * ============================================================
   */

  const [formData, setFormData] = useState({
    rfid_uid: "",
    rank: "",
    surname: "",
    first_name: "",
    middle_initial: "",
    q: "",
    age: "",
    sex: "",
    office: "",
  });

  /*
   * ============================================================
   * LOAD RANKS FROM DATABASE
   * ============================================================
   */

  const fetchRanks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/ranks`);
      
      if (response.ok) {
        const data: Rank[] = await response.json();
        setAvailableRanks(data);
      }
    } catch (error) {
      console.error("FAILED TO FETCH RANKS:", error);
    }
  };

  /*
   * ============================================================
   * LOAD PERSONNEL
   * ============================================================
   */

  const fetchPersonnel = async () => {
    try {
      setLoadingPersonnel(true);
      setPersonnelError("");

      const response = await fetch(`${API_BASE_URL}/personnel`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const rawData = await response.json();

      const data: Personnel[] = rawData.map((person: any) => ({
        personnel_id: Number(person.personnel_id),
        rfid_uid: person.rfid_uid,
        is_claimed: person.is_claimed !== false,
        rank: person.rank || "N/A",
        surname: person.surname,
        first_name: person.first_name,
        middle_initial: person.middle_initial,
        q: person.q,
        age: person.age,
        sex: person.sex,
        office: person.office,
      }));

      setPersonnelList(data);
    } catch (error) {
      console.error("PERSONNEL FETCH ERROR:", error);

      setPersonnelError(
        error instanceof Error
          ? error.message
          : "Unable to load personnel from the database."
      );
    } finally {
      setLoadingPersonnel(false);
    }
  };

  /*
   * ============================================================
   * INITIAL LOAD
   * ============================================================
   */

  useEffect(() => {
    fetchRanks();
    fetchPersonnel();
  }, []);

  /*
   * ============================================================
   * FILTER PERSONNEL
   * ============================================================
   */

  const filteredPersonnel = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return personnelList.filter((person) => {
      const fullName = getFullName(person).toLowerCase();

      const matchesSearch =
        !searchValue ||
        fullName.includes(searchValue) ||
        person.rfid_uid?.toLowerCase().includes(searchValue) ||
        person.rank?.toLowerCase().includes(searchValue) ||
        person.office?.toLowerCase().includes(searchValue);

      const matchesRank = !rankFilter || person.rank === rankFilter;

      const matchesSex = !sexFilter || person.sex === sexFilter;

      const matchesOffice =
        !officeFilter || person.office === officeFilter;

      return (
        matchesSearch &&
        matchesRank &&
        matchesSex &&
        matchesOffice
      );
    });
  }, [
    personnelList,
    search,
    rankFilter,
    sexFilter,
    officeFilter,
  ]);

  /*
   * ============================================================
   * PAGINATION
   * ============================================================
   */

  const totalPages =
    Math.ceil(filteredPersonnel.length / itemsPerPage) || 1;

  const paginatedPersonnel = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPersonnel.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPersonnel, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  /*
   * ============================================================
   * STATISTICS
   * ============================================================
   */

  const totalPersonnel = personnelList.length;

  const malePersonnel = personnelList.filter(
    (person) => person.sex?.toLowerCase() === "male"
  ).length;

  const femalePersonnel = personnelList.filter(
    (person) => person.sex?.toLowerCase() === "female"
  ).length;

  /*
   * ============================================================
   * STAT CARD DRILL-DOWN LISTS ("who are these numbers")
   *
   * Rows are built lazily (only for the currently open modal,
   * inside useMemo) instead of eagerly for all four categories
   * on every render -- otherwise every keystroke in the search
   * box would re-map the personnel list four times over.
   * ============================================================
   */

  const statMeta = {
    total: {
      title: "Total Personnel",
      subtitle: `${totalPersonnel} active records`,
    },
    male: {
      title: "Male Personnel",
      subtitle: `${malePersonnel} male personnel`,
    },
    female: {
      title: "Female Personnel",
      subtitle: `${femalePersonnel} female personnel`,
    },
    search: {
      title: "Search Results",
      subtitle: `${filteredPersonnel.length} matching records`,
    },
  } as const;

  const activeStatRows = useMemo((): DrilldownRow[] => {
    if (!activeStat) {
      return [];
    }

    const toRow = (person: Personnel): DrilldownRow => ({
      id: person.personnel_id,
      initials: getInitials(person),
      title: `${person.rank} ${getFullName(person)}`.trim(),
      subtitle: person.office || "No office assigned",
      metaText: `ID #${String(person.personnel_id).padStart(4, "0")}`,
    });

    switch (activeStat) {
      case "total":
        return personnelList.map(toRow);
      case "male":
        return personnelList
          .filter((p) => p.sex?.toLowerCase() === "male")
          .map(toRow);
      case "female":
        return personnelList
          .filter((p) => p.sex?.toLowerCase() === "female")
          .map(toRow);
      case "search":
        return filteredPersonnel.map(toRow);
      default:
        return [];
    }
  }, [activeStat, personnelList, filteredPersonnel]);

  const offices = useMemo(() => {
    return Array.from(
      new Set(
        personnelList
          .map((person) => person.office)
          .filter(Boolean)
      )
    );
  }, [personnelList]);

  const ranks = useMemo(() => {
    let rankSet: string[];

    if (availableRanks.length > 0) {
      rankSet = availableRanks.map((r) => r.rank_name);
    } else {
      rankSet = Array.from(
        new Set(
          personnelList
            .map((person) => person.rank)
            .filter(Boolean)
        )
      );
    }

    if (!rankSet.includes("N/A")) {
      rankSet.push("N/A");
    }

    return rankSet;
  }, [availableRanks, personnelList]);

  /*
   * ============================================================
   * OPEN ADD PERSONNEL MODAL
   * ============================================================
   */

  const handleAddPersonnel = () => {
    setFormData({
      rfid_uid: ARDUINO_RFID,
      rank: "",
      surname: "",
      first_name: "",
      middle_initial: "",
      q: "",
      age: "",
      sex: "",
      office: "",
    });

    setShowAddModal(true);
  };

  /*
   * ============================================================
   * OPEN MODAL FROM DASHBOARD
   *
   * Dashboard navigates to:
   *
   * /Personnel?add=true
   *
   * This effect detects ?add=true and opens the modal.
   * ============================================================
   */

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      setFormData({
        rfid_uid: ARDUINO_RFID,
        rank: "",
        surname: "",
        first_name: "",
        middle_initial: "",
        q: "",
        age: "",
        sex: "",
        office: "",
      });

      setShowAddModal(true);

      // Remove ?add=true from the URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  /*
   * ============================================================
   * CLOSE ADD MODAL
   * ============================================================
   */

  const handleCloseModal = () => {
    if (savingPersonnel) return;

    setShowAddModal(false);
  };

  /*
   * ============================================================
   * FORM INPUT
   * ============================================================
   */

  const handleFormChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
   * ============================================================
   * SAVE PERSONNEL
   * ============================================================
   */

  const handleSavePersonnel = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!formData.rfid_uid) {
      alert("RFID UID is required.");
      return;
    }

    if (!formData.rank) {
      alert("Please select a rank.");
      return;
    }

    if (!formData.surname) {
      alert("Please enter the surname.");
      return;
    }

    if (!formData.first_name) {
      alert("Please enter the first name.");
      return;
    }

    if (!formData.sex) {
      alert("Please select the sex.");
      return;
    }

    try {
      setSavingPersonnel(true);

      const personnelData = {
        rfid_uid: formData.rfid_uid,
        rank: formData.rank,
        surname: formData.surname,
        first_name: formData.first_name,
        middle_initial:
          formData.middle_initial || null,
        q: formData.q || null,
        age: formData.age
          ? Number(formData.age)
          : null,
        sex: formData.sex,
        office: formData.office || null,
      };

      const response = await fetch(
        `${API_BASE_URL}/personnel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify(personnelData),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message ||
            `HTTP ${response.status}`
        );
      }

      alert("Personnel added successfully!");

      setShowAddModal(false);

      await fetchPersonnel();
    } catch (error) {
      console.error(
        "ADD PERSONNEL ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to add personnel."
      );
    } finally {
      setSavingPersonnel(false);
    }
  };

  const handleProvisionSubmit = async (
    event: SyntheticEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setProvisionError("");

    if (!provisionRfidUid.trim()) {
      setProvisionError("Please enter the RFID UID printed on the card.");
      return;
    }

    try {
      setProvisioning(true);

      const response = await fetch(
        `${API_BASE_URL}/personnel/provision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            rfid_uid: provisionRfidUid.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => null);

        throw new Error(
          errorData?.message || `HTTP ${response.status}`
        );
      }

      setShowProvisionModal(false);
      setProvisionRfidUid("");

      await fetchPersonnel();
    } catch (error) {
      console.error("PROVISION RFID ERROR:", error);

      setProvisionError(
        error instanceof Error
          ? error.message
          : "Failed to provision this RFID card."
      );
    } finally {
      setProvisioning(false);
    }
  };

  /*
   * ============================================================
   * VIEW / EDIT / DELETE PERSONNEL
   * ============================================================
   */

  const populatePersonnelForm = (personnel: Personnel) => {
    setEditingPersonnelId(personnel.personnel_id);
    setEditFormData({
      rfid_uid: personnel.rfid_uid || "",
      rank: personnel.rank === "N/A" ? "" : personnel.rank || "",
      surname: personnel.surname || "",
      first_name: personnel.first_name || "",
      middle_initial: personnel.middle_initial || "",
      q: personnel.q || "",
      age: personnel.age !== null ? String(personnel.age) : "",
      sex: personnel.sex || "",
      office: personnel.office || "",
    });
  };

  // Opens the same modal as Edit, but read-only — this used to just
  // console.log and show nothing to the user.
  const handleViewPersonnel = (personnel: Personnel) => {
    populatePersonnelForm(personnel);
    setViewOnlyMode(true);
    setShowEditModal(true);
  };

  /*
   * ============================================================
   * VIEW / DOWNLOAD / PRINT QR BADGE
   * ============================================================
   */

  const handleViewQr = async (personnel: Personnel) => {
    setQrPersonnel(personnel);
    setQrDataUrl("");
    setQrError("");
    setShowQrModal(true);

    try {
      const dataUrl = await QRCode.toDataURL(personnel.rfid_uid, {
        width: 320,
        margin: 2,
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Failed to generate QR code.");
    }
  };

  const handleCloseQrModal = () => {
    setShowQrModal(false);
    setQrPersonnel(null);
    setQrDataUrl("");
    setQrError("");
  };

  const handlePrintQr = () => {
    if (!qrPersonnel || !qrDataUrl) return;

    const printWindow = window.open("", "_blank", "width=420,height=560");
    if (!printWindow) return;

    const doc = printWindow.document;
    doc.title = `Personnel Badge — ${getFullName(qrPersonnel)}`;

    const style = doc.createElement("style");
    style.textContent = `
      body { font-family: Arial, sans-serif; text-align: center; padding: 32px 16px; }
      img { width: 260px; height: 260px; }
      h2 { margin: 18px 0 4px; font-size: 18px; }
      p { margin: 0; color: #555; font-size: 13px; }
    `;
    doc.head.appendChild(style);

    const img = doc.createElement("img");
    img.src = qrDataUrl;
    img.alt = "QR badge";

    const heading = doc.createElement("h2");
    heading.textContent = getFullName(qrPersonnel);

    const idLine = doc.createElement("p");
    idLine.textContent = `Personnel ID #${String(qrPersonnel.personnel_id).padStart(4, "0")}`;

    const uidLine = doc.createElement("p");
    uidLine.textContent = qrPersonnel.rfid_uid;

    doc.body.append(img, heading, idLine, uidLine);

    printWindow.focus();
    img.onload = () => printWindow.print();
  };

  /*
    * ============================================================
    * OPEN / CLOSE / SUBMIT EDIT MODAL
    * ============================================================
    */

    const handleEditPersonnel = (personnel: Personnel) => {
      populatePersonnelForm(personnel);
      setViewOnlyMode(false);
      setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
      if (savingPersonnel) return;
      setShowEditModal(false);
      setViewOnlyMode(false);
      setEditingPersonnelId(null);
    };

    const handleEditFormChange = (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
      const { name, value } = event.target;
      setEditFormData((current) => ({
        ...current,
        [name]: value,
      }));
    };

    const handleUpdatePersonnel = async (event: React.FormEvent) => {
      event.preventDefault();

      if (!editingPersonnelId) return;

      if (!editFormData.rank) {
        alert("Please select a rank.");
        return;
      }
      if (!editFormData.surname) {
        alert("Please enter the surname.");
        return;
      }
      if (!editFormData.first_name) {
        alert("Please enter the first name.");
        return;
      }
      if (!editFormData.sex) {
        alert("Please select the sex.");
        return;
      }

      try {
        setSavingPersonnel(true);

        const updatedData = {
          rfid_uid: editFormData.rfid_uid,
          rank: editFormData.rank,
          surname: editFormData.surname,
          first_name: editFormData.first_name,
          middle_initial: editFormData.middle_initial || null,
          q: editFormData.q || null,
          age: editFormData.age ? Number(editFormData.age) : null,
          sex: editFormData.sex,
          office: editFormData.office || null,
        };

        const response = await fetch(
          `${API_BASE_URL}/personnel/${editingPersonnelId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
            body: JSON.stringify(updatedData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `HTTP ${response.status}`);
        }

        alert("Personnel updated successfully!");
        setShowEditModal(false);
        setEditingPersonnelId(null);

        await fetchPersonnel();
      } catch (error) {
        console.error("UPDATE PERSONNEL ERROR:", error);
        alert(
          error instanceof Error ? error.message : "Failed to update personnel."
        );
      } finally {
        setSavingPersonnel(false);
      }
    };

  const handleDeletePersonnel = async (
    personnel: Personnel
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${getFullName(
        personnel
      )}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/personnel/${personnel.personnel_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`
        );
      }

      setPersonnelList((current) =>
        current.filter(
          (person) =>
            person.personnel_id !==
            personnel.personnel_id
        )
      );

      alert(
        "Personnel deleted successfully."
      );
    } catch (error) {
      console.error(
        "DELETE PERSONNEL ERROR:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete personnel."
      );
    }
  };

  /*
   * ============================================================
   * EXPORT
   * ============================================================
   */

  const handleExport = () => {
    console.log(
      "Export personnel:",
      filteredPersonnel
    );
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
      }
    );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="personnel-page">

      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div className="personnel-header">
        <div>
          <div className="breadcrumb">
            Main Menu / Personnel
          </div>

          <h1>
            Personnel Management
          </h1>

          <p>
            Manage and maintain registered
            personnel records.
          </p>
        </div>

        <div className="header-date">
          <span>TODAY</span>
          <strong>{currentDate}</strong>
        </div>
      </div>

      {/* ======================================================
          STAT CARDS
          ====================================================== */}

      <section className="personnel-stat-grid">

        <button
          type="button"
          className="personnel-stat-card sdm-card-trigger"
          onClick={() => setActiveStat("total")}
        >
          <div className="stat-top">
            <span>Total Personnel</span>

            <div className="stat-icon blue">
              <Users size={18} strokeWidth={2} />
            </div>
          </div>

          <h2>
            {totalPersonnel}
          </h2>

          <div className="stat-change positive">
            Active Records
          </div>

          <span className="sdm-view-hint">View list →</span>
        </button>

        <button
          type="button"
          className="personnel-stat-card sdm-card-trigger"
          onClick={() => setActiveStat("male")}
        >
          <div className="stat-top">
            <span>Male Personnel</span>

            <div className="stat-icon purple">
              <Mars size={18} strokeWidth={2} />
            </div>
          </div>

          <h2>
            {malePersonnel}
          </h2>

          <div className="stat-change neutral">
            {totalPersonnel > 0
              ? `${(
                  (malePersonnel /
                    totalPersonnel) *
                  100
                ).toFixed(1)}%`
              : "0%"}{" "}
            <span>
              of personnel
            </span>
          </div>

          <span className="sdm-view-hint">View list →</span>
        </button>

        <button
          type="button"
          className="personnel-stat-card sdm-card-trigger"
          onClick={() => setActiveStat("female")}
        >
          <div className="stat-top">
            <span>Female Personnel</span>

            <div className="stat-icon green">
              <Venus size={18} strokeWidth={2} />
            </div>
          </div>

          <h2>
            {femalePersonnel}
          </h2>

          <div className="stat-change neutral">
            {totalPersonnel > 0
              ? `${(
                  (femalePersonnel /
                    totalPersonnel) *
                  100
                ).toFixed(1)}%`
              : "0%"}{" "}
            <span>
              of personnel
            </span>
          </div>

          <span className="sdm-view-hint">View list →</span>
        </button>

        <button
          type="button"
          className="personnel-stat-card sdm-card-trigger"
          onClick={() => setActiveStat("search")}
        >
          <div className="stat-top">
            <span>Search Results</span>

            <div className="stat-icon orange">
              <Search size={18} strokeWidth={2} />
            </div>
          </div>

          <h2>
            {filteredPersonnel.length}
          </h2>

          <div className="stat-change neutral">
            Matching records
          </div>

          <span className="sdm-view-hint">View list →</span>
        </button>

      </section>

      {activeStat && (
        <StatDrilldownModal
          title={statMeta[activeStat].title}
          subtitle={statMeta[activeStat].subtitle}
          rows={activeStatRows}
          emptyMessage="No personnel found."
          onClose={() => setActiveStat(null)}
        />
      )}

      {/* ======================================================
          EDIT PERSONNEL MODAL
          ====================================================== */}

      {showEditModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseEditModal();
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "700px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: 700,
                  }}
                >
                  {viewOnlyMode ? "View Personnel" : "Edit Personnel"}
                </h2>
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  {viewOnlyMode
                    ? `Registered personnel details for ID #${editingPersonnelId}.`
                    : `Modify registered personnel details for ID #${editingPersonnelId}.`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={savingPersonnel}
                style={{
                  border: "none",
                  background: "#f3f4f6",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  fontSize: "22px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* MODAL FORM */}
            <form onSubmit={handleUpdatePersonnel}>
              <div style={{ padding: "28px" }}>
                {/* RFID READONLY */}
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "18px",
                    marginBottom: "24px",
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      marginBottom: "6px",
                      fontWeight: 600,
                      color: "#475569",
                    }}
                  >
                    RFID CARD UID
                  </label>
                  <input
                    type="text"
                    name="rfid_uid"
                    value={editFormData.rfid_uid}
                    readOnly
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 14px",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      background: "#f1f5f9",
                      fontWeight: 600,
                      color: "#334155",
                    }}
                  />
                </div>

                {/* FORM FIELDS GRID */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "18px",
                  }}
                >
                  {/* RANK */}
                  <div>
                    <label style={{ display: "block", marginBottom: "7px", fontWeight: 600 }}>
                      Rank *
                    </label>
                    <select
                      name="rank"
                      value={editFormData.rank}
                      onChange={handleEditFormChange}
                      disabled={viewOnlyMode}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 13px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        background: "#ffffff",
                      }}
                    >
                      <option value="">Select PNP Rank</option>
                      <option value="N/A">N/A</option>
                      {availableRanks.map((r) => (
                        <option key={r.rank_id} value={r.rank_name}>
                          {r.rank_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SURNAME */}
                  <div>
                    <label style={{ display: "block", marginBottom: "7px", fontWeight: 600 }}>
                      Surname *
                    </label>
                    <input
                      type="text"
                      name="surname"
                      value={editFormData.surname}
                      onChange={handleEditFormChange}
                      disabled={viewOnlyMode}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 13px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>

                  {/* FIRST NAME */}
                  <div>
                    <label style={{ display: "block", marginBottom: "7px", fontWeight: 600 }}>
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={editFormData.first_name}
                      onChange={handleEditFormChange}
                      disabled={viewOnlyMode}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 13px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>

                  {/* MIDDLE INITIAL */}
                  <div>
                    <label style={{ display: "block", marginBottom: "7px", fontWeight: 600 }}>
                      Middle Initial
                    </label>
                    <input
                      type="text"
                      name="middle_initial"
                      maxLength={2}
                      value={editFormData.middle_initial}
                      onChange={handleEditFormChange}
                      disabled={viewOnlyMode}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 13px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>

                  {/* Q */}
                  <div>
                    <label style={{ display: "block", marginBottom: "7px", fontWeight: 600 }}>
                      Q
                    </label>
                    <input
                      type="text"
                      name="q"
                      value={editFormData.q}
                      onChange={handleEditFormChange}
                      disabled={viewOnlyMode}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 13px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>

                  {/* AGE */}
                  <div>
                    <label style={{ display: "block", marginBottom: "7px", fontWeight: 600 }}>
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      min="1"
                      max="120"
                      value={editFormData.age}
                      onChange={handleEditFormChange}
                      disabled={viewOnlyMode}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 13px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>

                  {/* SEX */}
                  <div>
                    <label style={{ display: "block", marginBottom: "7px", fontWeight: 600 }}>
                      Sex *
                    </label>
                    <select
                      name="sex"
                      value={editFormData.sex}
                      onChange={handleEditFormChange}
                      disabled={viewOnlyMode}
                      required
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 13px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        background: "#ffffff",
                      }}
                    >
                      <option value="">Select sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* OFFICE */}
                  <div>
                    <label style={{ display: "block", marginBottom: "7px", fontWeight: 600 }}>
                      Office
                    </label>
                    <input
                      type="text"
                      name="office"
                      value={editFormData.office}
                      onChange={handleEditFormChange}
                      disabled={viewOnlyMode}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "11px 13px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div
                style={{
                  padding: "18px 28px",
                  borderTop: "1px solid #e5e7eb",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={savingPersonnel}
                  style={{
                    padding: "11px 20px",
                    border: "1px solid #d1d5db",
                    background: "#ffffff",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {viewOnlyMode ? "Close" : "Cancel"}
                </button>

                {!viewOnlyMode && (
                  <button
                    type="submit"
                    disabled={savingPersonnel}
                    style={{
                      padding: "11px 22px",
                      border: "none",
                      background: "#2563eb",
                      color: "#ffffff",
                      borderRadius: "8px",
                      cursor: savingPersonnel ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      opacity: savingPersonnel ? 0.7 : 1,
                    }}
                  >
                    {savingPersonnel ? "Updating..." : "Update Personnel"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================
          PERSONNEL TABLE
          ====================================================== */}

      <section className="personnel-card">

        <div className="section-header">
          <div>
            <span className="section-number">
              01
            </span>

            <div>
              <h2>
                Personnel Records
              </h2>

              <p>
                View and manage registered
                personnel.
              </p>
            </div>
          </div>

          <div className="personnel-header-actions">

            {canEdit && (
              <>
                {/* PROVISION RFID CARD */}

                <button
                  className="provision-rfid-button"
                  onClick={() => {
                    setProvisionError("");
                    setProvisionRfidUid("");
                    setShowProvisionModal(true);
                  }}
                >
                  + Provision RFID Card
                </button>

                {/* NORMAL ADD BUTTON */}

                <button
                  className="add-personnel-button"
                  onClick={handleAddPersonnel}
                >
                  + Add Personnel
                </button>
              </>
            )}

          </div>
        </div>

        {/* ====================================================
            SEARCH AND FILTERS
            ==================================================== */}

        <div className="personnel-filters">

          <div className="search-wrapper">
            <span><Search size={14} strokeWidth={2} /></span>

            <input
              type="text"
              placeholder="Search name, RFID, rank or office..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={rankFilter}
            onChange={(event) =>
              setRankFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Ranks
            </option>

            {ranks.map((rank) => (
              <option
                key={rank}
                value={rank}
              >
                {rank}
              </option>
            ))}
          </select>

          <select
            value={sexFilter}
            onChange={(event) =>
              setSexFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Sex
            </option>

            <option value="Male">
              Male
            </option>

            <option value="Female">
              Female
            </option>
          </select>

          <select
            value={officeFilter}
            onChange={(event) =>
              setOfficeFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Offices
            </option>

            {offices.map((office) => (
              <option
                key={office}
                value={office ?? ""}
              >
                {office}
              </option>
            ))}
          </select>

        </div>

        {/* ERROR */}

        {personnelError && (
          <div className="personnel-error">
            <strong>
              Unable to load personnel
            </strong>

            <span>
              {personnelError}
            </span>
          </div>
        )}

        {/* ====================================================
            TABLE
            ==================================================== */}

        {loadingPersonnel ? (
          <div className="personnel-loading">
            <div className="loading-spinner" />
            <p>
              Loading personnel...
            </p>
          </div>
        ) : (
          <div className="table-container">

            <table>

              <thead>
                <tr>
                  <th>
                    PERSONNEL
                  </th>

                  <th>
                    RFID
                  </th>

                  <th>
                    RANK
                  </th>

                  <th>
                    Q
                  </th>

                  <th>
                    AGE
                  </th>

                  <th>
                    SEX
                  </th>

                  <th>
                    OFFICE
                  </th>

                  <th>
                    ACTIONS
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredPersonnel.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="empty-table"
                    >
                      <div>
                        <strong>
                          No personnel found
                        </strong>

                        <span>
                          Try changing your
                          search or filters.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPersonnel.map(
                    (personnel) => (
                      <tr
                        key={
                          personnel.personnel_id
                        }
                      >

                        <td>
                          <div className="person-cell">

                            <div className="person-avatar">
                              {personnel.is_claimed
                                ? getInitials(personnel)
                                : "—"}
                            </div>

                            <div>

                              {personnel.is_claimed ? (
                                <strong>
                                  {getFullName(
                                    personnel
                                  )}
                                </strong>
                              ) : (
                                <span className="unclaimed-badge">
                                  Awaiting Registration
                                </span>
                              )}

                              <small>
                                Personnel ID #
                                {String(
                                  personnel.personnel_id
                                ).padStart(
                                  4,
                                  "0"
                                )}
                              </small>

                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="rfid-badge">
                            {personnel.rfid_uid}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {personnel.rank}
                          </strong>
                        </td>

                        <td>
                          {personnel.q ??
                            "N/A"}
                        </td>

                        <td>
                          {personnel.age ??
                            "N/A"}
                        </td>

                        <td>
                          <span
                            className={`sex-badge ${
                              personnel.sex?.toLowerCase() ??
                              "unknown"
                            }`}
                          >
                            <span className="badge-dot" />

                            {personnel.sex ??
                              "N/A"}
                          </span>
                        </td>

                        <td>
                          {personnel.office ??
                            "No office assigned"}
                        </td>

                        <td>
                          <div className="row-actions">

                            <button
                              title="View"
                              onClick={() =>
                                handleViewPersonnel(
                                  personnel
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              title="QR Badge"
                              onClick={() =>
                                handleViewQr(
                                  personnel
                                )
                              }
                            >
                              QR
                            </button>

                            {canEdit && (
                              <button
                                title="Edit"
                                onClick={() =>
                                  handleEditPersonnel(
                                    personnel
                                  )
                                }
                              >
                                Edit
                              </button>
                            )}

                            {canDelete && (
                              <button
                                title="Delete"
                                className="delete-action"
                                onClick={() =>
                                  handleDeletePersonnel(
                                    personnel
                                  )
                                }
                              >
                                Delete
                              </button>
                            )}

                          </div>
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

        {/* MODERN PAGINATION CONTROLS */}

        {!loadingPersonnel &&
          filteredPersonnel.length > itemsPerPage && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing{" "}
                <strong>
                  {(currentPage - 1) * itemsPerPage + 1}
                </strong>{" "}
                to{" "}
                <strong>
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredPersonnel.length
                  )}
                </strong>{" "}
                of <strong>{filteredPersonnel.length}</strong> entries
              </div>

              <div className="pagination-controls">
                {/* Previous Button */}
                <button
                  className="btn-modern-nav"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous Page"
                >
                  <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Previous</span>
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                  )
                  .reduce<(number | string)[]>((acc, page, idx, src) => {
                    if (
                      idx > 0 &&
                      page - (src[idx - 1] as number) > 1
                    ) {
                      acc.push("...");
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, index) =>
                    typeof item === "number" ? (
                      <button
                        key={item}
                        className={`pagination-btn ${
                          currentPage === item ? "active" : ""
                        }`}
                        onClick={() => handlePageChange(item)}
                      >
                        {item}
                      </button>
                    ) : (
                      <span
                        key={`ellipsis-${index}`}
                        className="pagination-ellipsis"
                      >
                        •••
                      </span>
                    )
                  )}

                {/* Next Button */}
                <button
                  className="btn-modern-nav btn-next"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next Page"
                >
                  <span>Next</span>
                  <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}

      </section>

      {/* ======================================================
          BOTTOM GRID
          ====================================================== */}

      <section className="personnel-bottom-grid">

        {/* QUICK ACTIONS */}

        <div className="personnel-card">

          <div className="small-card-header">
            <div>

              <h3>
                Quick Actions
              </h3>

              <p>
                Frequently used personnel
                functions
              </p>

            </div>
          </div>

          <div className="quick-actions">

            <button
              onClick={
                handleAddPersonnel
              }
            >
              <span className="quick-icon blue">
                <UserPlus size={16} strokeWidth={2} />
              </span>

              <div>
                <strong>
                  Add Personnel
                </strong>

                <small>
                  Register a new
                  personnel record
                </small>
              </div>

              <span><ChevronRight size={16} strokeWidth={2} /></span>
            </button>

            <button
              onClick={handleExport}
            >
              <span className="quick-icon green">
                <Download size={16} strokeWidth={2} />
              </span>

              <div>
                <strong>
                  Export Personnel
                </strong>

                <small>
                  Export personnel
                  records
                </small>
              </div>

              <span><ChevronRight size={16} strokeWidth={2} /></span>
            </button>

            <button>
              <span className="quick-icon purple">
                <FileText size={16} strokeWidth={2} />
              </span>

              <div>
                <strong>
                  Personnel Reports
                </strong>

                <small>
                  View personnel
                  analytics
                </small>
              </div>

              <span><ChevronRight size={16} strokeWidth={2} /></span>
            </button>

          </div>
        </div>

        {/* PERSONNEL SUMMARY */}

        <div className="personnel-card">

          <div className="small-card-header">
            <div>

              <h3>
                Personnel Summary
              </h3>

              <p>
                Current database records
              </p>

            </div>
          </div>

          <div className="summary-list">

            <div>
              <span>
                Total Personnel
              </span>

              <strong>
                {totalPersonnel}
              </strong>
            </div>

            <div>
              <span>
                Male
              </span>

              <strong>
                {malePersonnel}
              </strong>
            </div>

            <div>
              <span>
                Female
              </span>

              <strong>
                {femalePersonnel}
              </strong>
            </div>

            <div>
              <span>
                Offices
              </span>

              <strong>
                {offices.length}
              </strong>
            </div>

          </div>

          <button
            className="full-report-button"
            onClick={() => {
              setSearch("");
              setRankFilter("");
              setSexFilter("");
              setOfficeFilter("");
            }}
          >
            Clear All Filters →
          </button>

        </div>

      </section>


  

      {/* ======================================================
          ADD PERSONNEL MODAL
          ====================================================== */}

      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseModal();
            }
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "700px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >

            {/* ==================================================
                MODAL HEADER
                ================================================== */}

            <div
              style={{
                padding:
                  "24px 28px",
                borderBottom:
                  "1px solid #e5e7eb",
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "space-between",
              }}
            >

              <div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: 700,
                  }}
                >
                  Add Personnel
                </h2>

                <p
                  style={{
                    margin:
                      "6px 0 0",
                    color:
                      "#6b7280",
                    fontSize:
                      "14px",
                  }}
                >
                  Register a new
                  personnel using
                  an RFID card.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseModal
                }
                disabled={
                  savingPersonnel
                }
                style={{
                  border: "none",
                  background:
                    "#f3f4f6",
                  width: "38px",
                  height: "38px",
                  borderRadius:
                    "50%",
                  fontSize:
                    "22px",
                  cursor:
                    "pointer",
                }}
              >
                ×
              </button>

            </div>

            {/* ==================================================
                MODAL BODY
                ================================================== */}

            <form
              onSubmit={
                handleSavePersonnel
              }
            >

              <div
                style={{
                  padding: "28px",
                }}
              >

                {/* RFID */}

                <div
                  style={{
                    background:
                      "#eff6ff",
                    border:
                      "1px solid #bfdbfe",
                    borderRadius:
                      "12px",
                    padding:
                      "18px",
                    marginBottom:
                      "24px",
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      marginBottom:
                        "10px",
                    }}
                  >

                    <strong
                      style={{
                        color:
                          "#1d4ed8",
                      }}
                    >
                      RFID CARD
                    </strong>

                    <span
                      style={{
                        fontSize:
                          "12px",
                        background:
                          "#dcfce7",
                        color:
                          "#166534",
                        padding:
                          "5px 9px",
                        borderRadius:
                          "20px",
                        fontWeight: 600,
                      }}
                    >
                      RFID DETECTED
                    </span>

                  </div>

                  <input
                    type="text"
                    name="rfid_uid"
                    value={
                      formData.rfid_uid
                    }
                    readOnly
                    style={{
                      width:
                        "100%",
                      boxSizing:
                        "border-box",
                      padding:
                        "12px 14px",
                      border:
                        "1px solid #93c5fd",
                      borderRadius:
                        "8px",
                      background:
                        "#ffffff",
                      fontWeight: 600,
                      color:
                        "#1e3a8a",
                    }}
                  />

                  <small
                    style={{
                      display:
                        "block",
                      marginTop:
                        "8px",
                      color:
                        "#64748b",
                    }}
                  >
                    Arduino RFID
                    simulation:{" "}
                    {ARDUINO_RFID}
                  </small>

                </div>

                {/* FORM GRID */}

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "18px",
                  }}
                >

                  {/* RANK */}

                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        fontWeight: 600,
                      }}
                    >
                      Rank *
                    </label>

                    <select
                      name="rank"
                      value={
                        formData.rank
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        padding:
                          "11px 13px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "8px",
                        background:
                          "#ffffff",
                      }}
                    >

                      <option value="">
                        Select PNP Rank
                      </option>

                      <option value="N/A">
                        N/A
                      </option>

                      {availableRanks.map(
                        (r) => (
                          <option
                            key={
                              r.rank_id
                            }
                            value={
                              r.rank_name
                            }
                          >
                            {
                              r.rank_name
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  {/* SURNAME */}

                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        fontWeight: 600,
                      }}
                    >
                      Surname *
                    </label>

                    <input
                      type="text"
                      name="surname"
                      placeholder="Enter surname"
                      value={
                        formData.surname
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        padding:
                          "11px 13px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "8px",
                      }}
                    />

                  </div>

                  {/* FIRST NAME */}

                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        fontWeight: 600,
                      }}
                    >
                      First Name *
                    </label>

                    <input
                      type="text"
                      name="first_name"
                      placeholder="Enter first name"
                      value={
                        formData.first_name
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        padding:
                          "11px 13px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "8px",
                      }}
                    />

                  </div>

                  {/* MIDDLE INITIAL */}

                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        fontWeight: 600,
                      }}
                    >
                      Middle Initial
                    </label>

                    <input
                      type="text"
                      name="middle_initial"
                      placeholder="M."
                      maxLength={2}
                      value={
                        formData.middle_initial
                      }
                      onChange={
                        handleFormChange
                      }
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        padding:
                          "11px 13px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "8px",
                      }}
                    />

                  </div>

                  {/* Q */}

                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        fontWeight: 600,
                      }}
                    >
                      Q
                    </label>

                    <input
                      type="text"
                      name="q"
                      placeholder="Enter Q"
                      value={
                        formData.q
                      }
                      onChange={
                        handleFormChange
                      }
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        padding:
                          "11px 13px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "8px",
                      }}
                    />

                  </div>

                  {/* AGE */}

                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        fontWeight: 600,
                      }}
                    >
                      Age
                    </label>

                    <input
                      type="number"
                      name="age"
                      placeholder="Enter age"
                      min="1"
                      max="120"
                      value={
                        formData.age
                      }
                      onChange={
                        handleFormChange
                      }
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        padding:
                          "11px 13px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "8px",
                      }}
                    />

                  </div>

                  {/* SEX */}

                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        fontWeight: 600,
                      }}
                    >
                      Sex *
                    </label>

                    <select
                      name="sex"
                      value={
                        formData.sex
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        padding:
                          "11px 13px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "8px",
                        background:
                          "#ffffff",
                      }}
                    >

                      <option value="">
                        Select sex
                      </option>

                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                    </select>

                  </div>

                  {/* OFFICE */}

                  <div>

                    <label
                      style={{
                        display:
                          "block",
                        marginBottom:
                          "7px",
                        fontWeight: 600,
                      }}
                    >
                      Office
                    </label>

                    <input
                      type="text"
                      name="office"
                      placeholder="Enter office"
                      value={
                        formData.office
                      }
                      onChange={
                        handleFormChange
                      }
                      style={{
                        width:
                          "100%",
                        boxSizing:
                          "border-box",
                        padding:
                          "11px 13px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "8px",
                      }}
                    />

                  </div>

                </div>

              </div>

              {/* ==================================================
                  MODAL FOOTER
                  ================================================== */}

              <div
                style={{
                  padding:
                    "18px 28px",
                  borderTop:
                    "1px solid #e5e7eb",
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap: "12px",
                }}
              >

                <button
                  type="button"
                  onClick={
                    handleCloseModal
                  }
                  disabled={
                    savingPersonnel
                  }
                  style={{
                    padding:
                      "11px 20px",
                    border:
                      "1px solid #d1d5db",
                    background:
                      "#ffffff",
                    borderRadius:
                      "8px",
                    cursor:
                      "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    savingPersonnel
                  }
                  style={{
                    padding:
                      "11px 22px",
                    border: "none",
                    background:
                      "#2563eb",
                    color:
                      "#ffffff",
                    borderRadius:
                      "8px",
                    cursor:
                      savingPersonnel
                        ? "not-allowed"
                        : "pointer",
                    fontWeight: 600,
                    opacity:
                      savingPersonnel
                        ? 0.7
                        : 1,
                  }}
                >
                  {savingPersonnel
                    ? "Saving..."
                    : "Save Personnel"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================================
          PROVISION RFID CARD MODAL
      ====================================================== */}

      {showProvisionModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowProvisionModal(false);
            }
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
              padding: "28px",
            }}
          >

            <h2
              style={{
                margin: "0 0 6px",
                fontSize: "18px",
                fontWeight: 700,
                color: "#172033",
              }}
            >
              Provision RFID Card
            </h2>

            <p
              style={{
                margin: "0 0 16px",
                fontSize: "13px",
                color: "#667085",
                lineHeight: 1.5,
              }}
            >
              Registers a blank card's UID so its holder can
              claim it themselves later — filling in their own
              name, rank, and PIN on the Login page.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
                padding: "10px 12px",
                borderRadius: "8px",
                border:
                  provisionScanStatus === "detected"
                    ? "1px solid #bbf7d0"
                    : "1px solid #dbeafe",
                background:
                  provisionScanStatus === "detected"
                    ? "#f0fdf4"
                    : "#eff6ff",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  background:
                    provisionScanStatus === "detected"
                      ? "#16a34a"
                      : "#2563eb",
                }}
              />

              <span
                style={{
                  fontSize: "12px",
                  color:
                    provisionScanStatus === "detected"
                      ? "#15803d"
                      : "#1d4ed8",
                }}
              >
                {provisionScanStatus === "detected"
                  ? "Card detected — UID filled in below."
                  : "Waiting for a card on the RFID reader..."}
              </span>
            </div>

            <form onSubmit={handleProvisionSubmit}>

              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#536071",
                }}
              >
                RFID UID
              </label>

              <input
                type="text"
                placeholder="Tap a card on the reader to fill this in automatically"
                value={provisionRfidUid}
                readOnly
                disabled={provisioning}
                style={{
                  width: "100%",
                  height: "42px",
                  padding: "0 12px",
                  border: "1px solid #dce2ea",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  outline: "none",
                  background: "#f9fafb",
                  color: "#374151",
                  cursor: "not-allowed",
                }}
              />

              {provisionError && (
                <p
                  style={{
                    margin: "10px 0 0",
                    fontSize: "12px",
                    color: "#dc2626",
                  }}
                >
                  {provisionError}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "22px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  disabled={provisioning}
                  style={{
                    padding: "10px 18px",
                    border: "1px solid #dce2ea",
                    borderRadius: "8px",
                    background: "#ffffff",
                    color: "#536071",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={provisioning}
                  style={{
                    padding: "10px 18px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                    opacity: provisioning ? 0.6 : 1,
                  }}
                >
                  {provisioning ? "Provisioning..." : "Provision Card"}
                </button>
              </div>

            </form>

          </div>

        </div>
      )}

      {/* ======================================================
          QR BADGE MODAL
          ====================================================== */}

      {showQrModal && qrPersonnel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseQrModal();
            }
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div
              style={{
                padding: "24px 28px",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <QrCode size={20} strokeWidth={2} />
                  QR Badge
                </h2>
                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#6b7280",
                    fontSize: "13px",
                  }}
                >
                  {getFullName(qrPersonnel)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseQrModal}
                style={{
                  border: "none",
                  background: "#f3f4f6",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  fontSize: "20px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "14px",
              }}
            >
              {qrError ? (
                <p style={{ color: "#dc2626", fontSize: "13px", textAlign: "center" }}>{qrError}</p>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR badge for ${getFullName(qrPersonnel)}`}
                  style={{ width: "220px", height: "220px", borderRadius: "10px", border: "1px solid #e5e7eb" }}
                />
              ) : (
                <div style={{ width: "220px", height: "220px", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "13px" }}>
                  Generating...
                </div>
              )}

              <div style={{ textAlign: "center" }}>
                <strong style={{ display: "block", fontSize: "14px", color: "#172033" }}>
                  Personnel ID #{String(qrPersonnel.personnel_id).padStart(4, "0")}
                </strong>
                <span style={{ display: "block", marginTop: "4px", fontSize: "12px", color: "#6b7280", fontFamily: "monospace" }}>
                  {qrPersonnel.rfid_uid}
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <a
                  href={qrDataUrl || undefined}
                  download={qrDataUrl ? `badge-${qrPersonnel.rfid_uid}.png` : undefined}
                  aria-disabled={!qrDataUrl}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    padding: "10px 14px",
                    border: "1px solid #dce2ea",
                    borderRadius: "8px",
                    background: "#ffffff",
                    color: qrDataUrl ? "#273247" : "#b7bec9",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                    cursor: qrDataUrl ? "pointer" : "not-allowed",
                    pointerEvents: qrDataUrl ? "auto" : "none",
                  }}
                >
                  <Download size={14} strokeWidth={2} />
                  Download
                </a>

                <button
                  type="button"
                  onClick={handlePrintQr}
                  disabled={!qrDataUrl}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    padding: "10px 14px",
                    border: "none",
                    borderRadius: "8px",
                    background: "#2563eb",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: qrDataUrl ? "pointer" : "not-allowed",
                    opacity: qrDataUrl ? 1 : 0.6,
                  }}
                >
                  <Printer size={14} strokeWidth={2} />
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}