import { useEffect, useMemo, useState } from "react";
import "./Personnel.css";

/*
 * ============================================================
 * PERSONNEL TYPE
 * ============================================================
 */

type Personnel = {
  personnel_id: number;
  rfid_uid: string;
  rank: string;
  surname: string;
  first_name: string;
  middle_initial: string | null;
  q: string | null;
  age: number | null;
  sex: string | null;
  office: string | null;
};

/*
 * ============================================================
 * HARDCODED ARDUINO RFID
 * ============================================================
 *
 * This simulates the RFID UID that will eventually
 * come from your Arduino RFID reader.
 *
 * Later, replace this with your Arduino/API value.
 */

const ARDUINO_RFID = "RFID-ARDUINO-001";

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
  const firstInitial =
    personnel.first_name?.charAt(0) ?? "";

  const lastInitial =
    personnel.surname?.charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

/*
 * ============================================================
 * PERSONNEL PAGE
 * ============================================================
 */

export default function Personnel() {
  /*
   * ============================================================
   * PERSONNEL STATE
   * ============================================================
   */

  const [personnelList, setPersonnelList] =
    useState<Personnel[]>([]);

  const [loadingPersonnel, setLoadingPersonnel] =
    useState(true);

  const [personnelError, setPersonnelError] =
    useState("");

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
   * ADD PERSONNEL MODAL
   * ============================================================
   */

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [savingPersonnel, setSavingPersonnel] =
    useState(false);

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
   * LOAD PERSONNEL
   * ============================================================
   */

  const fetchPersonnel = async () => {
    try {
      setLoadingPersonnel(true);
      setPersonnelError("");

      console.log("Fetching personnel...");

      const response = await fetch(
        "http://localhost:3000/personnel",
      );

      console.log(
        "Response status:",
        response.status,
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      const rawData = await response.json();

      console.log(
        "Raw personnel data:",
        rawData,
      );

      const data: Personnel[] =
        rawData.map((person: any) => ({
          personnel_id:
            Number(person.personnel_id),

          rfid_uid:
            person.rfid_uid,

          rank:
            person.rank,

          surname:
            person.surname,

          first_name:
            person.first_name,

          middle_initial:
            person.middle_initial,

          q:
            person.q,

          age:
            person.age,

          sex:
            person.sex,

          office:
            person.office,
        }));

      setPersonnelList(data);
    } catch (error) {
      console.error(
        "PERSONNEL FETCH ERROR:",
        error,
      );

      setPersonnelError(
        error instanceof Error
          ? error.message
          : "Unable to load personnel from the database.",
      );
    } finally {
      setLoadingPersonnel(false);
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  /*
   * ============================================================
   * FILTER PERSONNEL
   * ============================================================
   */

  const filteredPersonnel = useMemo(() => {
    const searchValue =
      search.toLowerCase().trim();

    return personnelList.filter((person) => {
      const fullName =
        getFullName(person).toLowerCase();

      const matchesSearch =
        !searchValue ||
        fullName.includes(searchValue) ||
        person.rfid_uid
          ?.toLowerCase()
          .includes(searchValue) ||
        person.rank
          ?.toLowerCase()
          .includes(searchValue) ||
        person.office
          ?.toLowerCase()
          .includes(searchValue);

      const matchesRank =
        !rankFilter ||
        person.rank === rankFilter;

      const matchesSex =
        !sexFilter ||
        person.sex === sexFilter;

      const matchesOffice =
        !officeFilter ||
        person.office === officeFilter;

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
   * STATISTICS
   * ============================================================
   */

  const totalPersonnel =
    personnelList.length;

  const malePersonnel =
    personnelList.filter(
      (person) =>
        person.sex?.toLowerCase() === "male",
    ).length;

  const femalePersonnel =
    personnelList.filter(
      (person) =>
        person.sex?.toLowerCase() === "female",
    ).length;

  const offices = useMemo(() => {
    return Array.from(
      new Set(
        personnelList
          .map((person) => person.office)
          .filter(Boolean),
      ),
    );
  }, [personnelList]);

  const ranks = useMemo(() => {
    return Array.from(
      new Set(
        personnelList
          .map((person) => person.rank)
          .filter(Boolean),
      ),
    );
  }, [personnelList]);

  /*
   * ============================================================
   * OPEN ADD PERSONNEL MODAL
   * ============================================================
   */

  const handleAddPersonnel = () => {
    /*
     * For now, this simulates the RFID UID
     * coming from the Arduino RFID reader.
     */

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

    console.log(
      "Arduino RFID detected:",
      ARDUINO_RFID,
    );
  };

  /*
   * ============================================================
   * CLOSE ADD MODAL
   * ============================================================
   */

  const handleCloseModal = () => {
    if (savingPersonnel) {
      return;
    }

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
    >,
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
    event: React.FormEvent,
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

      /*
       * Data that will be sent to the backend.
       *
       * RFID UID is currently coming from the
       * hardcoded Arduino RFID variable.
       */

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

      console.log(
        "Saving personnel:",
        personnelData,
      );

      const response = await fetch(
        "http://localhost:3000/personnel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(personnelData),
        },
      );

      if (!response.ok) {
        const errorData =
          await response.json().catch(() => null);

        throw new Error(
          errorData?.message ||
            `HTTP ${response.status}`,
        );
      }

      alert(
        "Personnel added successfully!",
      );

      setShowAddModal(false);

      /*
       * Reload personnel table.
       */

      await fetchPersonnel();
    } catch (error) {
      console.error(
        "ADD PERSONNEL ERROR:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to add personnel.",
      );
    } finally {
      setSavingPersonnel(false);
    }
  };

  /*
   * ============================================================
   * VIEW PERSONNEL
   * ============================================================
   */

  const handleViewPersonnel = (
    personnel: Personnel,
  ) => {
    console.log(
      "Selected personnel:",
      personnel,
    );
  };

  /*
   * ============================================================
   * EDIT PERSONNEL
   * ============================================================
   */

  const handleEditPersonnel = (
    personnel: Personnel,
  ) => {
    console.log(
      "Edit personnel:",
      personnel,
    );
  };

  /*
   * ============================================================
   * DELETE PERSONNEL
   * ============================================================
   */

  const handleDeletePersonnel = async (
    personnel: Personnel,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${getFullName(
        personnel,
      )}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/personnel/${personnel.personnel_id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      setPersonnelList((current) =>
        current.filter(
          (person) =>
            person.personnel_id !==
            personnel.personnel_id,
        ),
      );

      alert(
        "Personnel deleted successfully.",
      );
    } catch (error) {
      console.error(
        "DELETE PERSONNEL ERROR:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete personnel.",
      );
    }
  };

  /*
   * ============================================================
   * EXPORT PERSONNEL
   * ============================================================
   */

  const handleExport = () => {
    console.log(
      "Export personnel:",
      filteredPersonnel,
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
      },
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
      ======================================================= */}

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

          <strong>
            {currentDate}
          </strong>
        </div>
      </div>

      {/* ======================================================
          STAT CARDS
      ======================================================= */}

      <section className="personnel-stat-grid">

        <div className="personnel-stat-card">
          <div className="stat-top">
            <span>
              Total Personnel
            </span>

            <div className="stat-icon blue">
              ♙
            </div>
          </div>

          <h2>
            {totalPersonnel}
          </h2>

          <div className="stat-change positive">
            Active Records
          </div>
        </div>

        <div className="personnel-stat-card">
          <div className="stat-top">
            <span>
              Male Personnel
            </span>

            <div className="stat-icon purple">
              ♂
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
        </div>

        <div className="personnel-stat-card">
          <div className="stat-top">
            <span>
              Female Personnel
            </span>

            <div className="stat-icon green">
              ♀
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
        </div>

        <div className="personnel-stat-card">
          <div className="stat-top">
            <span>
              Search Results
            </span>

            <div className="stat-icon orange">
              ⌕
            </div>
          </div>

          <h2>
            {filteredPersonnel.length}
          </h2>

          <div className="stat-change neutral">
            Matching records
          </div>
        </div>

      </section>

      {/* ======================================================
          PERSONNEL TABLE
      ======================================================= */}

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

          <button
            className="add-personnel-button"
            onClick={handleAddPersonnel}
          >
            + Add Personnel
          </button>
        </div>

        {/* ====================================================
            SEARCH AND FILTERS
        ===================================================== */}

        <div className="personnel-filters">

          <div className="search-wrapper">
            <span>🔍</span>

            <input
              type="text"
              placeholder="Search name, RFID, rank or office..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </div>

          <select
            value={rankFilter}
            onChange={(event) =>
              setRankFilter(
                event.target.value,
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
                event.target.value,
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
                event.target.value,
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

        {/* LOADING */}

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

                {filteredPersonnel.length ===
                0 ? (

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

                  filteredPersonnel.map(
                    (personnel) => (

                      <tr
                        key={
                          personnel.personnel_id
                        }
                      >

                        {/* PERSON */}

                        <td>
                          <div className="person-cell">

                            <div className="person-avatar">
                              {getInitials(
                                personnel,
                              )}
                            </div>

                            <div>
                              <strong>
                                {getFullName(
                                  personnel,
                                )}
                              </strong>

                              <small>
                                Personnel ID #
                                {String(
                                  personnel.personnel_id,
                                ).padStart(
                                  4,
                                  "0",
                                )}
                              </small>
                            </div>

                          </div>
                        </td>

                        {/* RFID */}

                        <td>
                          <span className="rfid-badge">
                            {personnel.rfid_uid}
                          </span>
                        </td>

                        {/* RANK */}

                        <td>
                          <strong>
                            {personnel.rank}
                          </strong>
                        </td>

                        {/* Q */}

                        <td>
                          {personnel.q ??
                            "N/A"}
                        </td>

                        {/* AGE */}

                        <td>
                          {personnel.age ??
                            "N/A"}
                        </td>

                        {/* SEX */}

                        <td>
                          <span
                            className={`sex-badge ${
                              personnel.sex
                                ?.toLowerCase() ??
                              "unknown"
                            }`}
                          >
                            <span className="badge-dot" />

                            {personnel.sex ??
                              "N/A"}
                          </span>
                        </td>

                        {/* OFFICE */}

                        <td>
                          {personnel.office ??
                            "No office assigned"}
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="row-actions">

                            <button
                              title="View"
                              onClick={() =>
                                handleViewPersonnel(
                                  personnel,
                                )
                              }
                            >
                              View
                            </button>

                            <button
                              title="Edit"
                              onClick={() =>
                                handleEditPersonnel(
                                  personnel,
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              title="Delete"
                              className="delete-action"
                              onClick={() =>
                                handleDeletePersonnel(
                                  personnel,
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>
                        </td>

                      </tr>

                    ),
                  )

                )}

              </tbody>

            </table>

          </div>

        )}

        {/* TABLE FOOTER */}

        {!loadingPersonnel &&
          filteredPersonnel.length > 0 && (

            <div className="table-footer">

              <span>
                Showing{" "}
                <strong>
                  {filteredPersonnel.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {personnelList.length}
                </strong>{" "}
                personnel
              </span>

            </div>

          )}

      </section>

      {/* ======================================================
          BOTTOM GRID
      ======================================================= */}

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
              onClick={handleAddPersonnel}
            >
              <span className="quick-icon blue">
                +
              </span>

              <div>
                <strong>
                  Add Personnel
                </strong>

                <small>
                  Register a new personnel
                  record
                </small>
              </div>

              <span>›</span>
            </button>

            <button
              onClick={handleExport}
            >
              <span className="quick-icon green">
                ↓
              </span>

              <div>
                <strong>
                  Export Personnel
                </strong>

                <small>
                  Export personnel records
                </small>
              </div>

              <span>›</span>
            </button>

            <button>
              <span className="quick-icon purple">
                ▤
              </span>

              <div>
                <strong>
                  Personnel Reports
                </strong>

                <small>
                  View personnel analytics
                </small>
              </div>

              <span>›</span>
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
      ======================================================= */}

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

            {/* MODAL HEADER */}

            <div
              style={{
                padding: "24px 28px",
                borderBottom:
                  "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
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
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  Register a new personnel
                  using an RFID card.
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
                  borderRadius: "50%",
                  fontSize: "22px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>

            </div>

            {/* MODAL BODY */}

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

                {/* RFID SECTION */}

                <div
                  style={{
                    background:
                      "#eff6ff",
                    border:
                      "1px solid #bfdbfe",
                    borderRadius:
                      "12px",
                    padding: "18px",
                    marginBottom:
                      "24px",
                  }}
                >

                  <div
                    style={{
                      display: "flex",
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
                      width: "100%",
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
                    simulation:
                    {ARDUINO_RFID}
                  </small>

                </div>

                {/* FORM GRID */}

                <div
                  style={{
                    display: "grid",
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

                    <input
                      type="text"
                      name="rank"
                      placeholder="Enter rank"
                      value={
                        formData.rank
                      }
                      onChange={
                        handleFormChange
                      }
                      required
                      style={{
                        width: "100%",
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
                        width: "100%",
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
                        width: "100%",
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
                        width: "100%",
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
                        width: "100%",
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
                        width: "100%",
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
                        width: "100%",
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
                        width: "100%",
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

              {/* MODAL FOOTER */}

              <div
                style={{
                  padding:
                    "18px 28px",
                  borderTop:
                    "1px solid #e5e7eb",
                  display: "flex",
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
                    color: "#ffffff",
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

    </div>
  );
}