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

  const [search, setSearch] =
    useState("");

  const [rankFilter, setRankFilter] =
    useState("");

  const [sexFilter, setSexFilter] =
    useState("");

  const [officeFilter, setOfficeFilter] =
    useState("");

  /*
   * ============================================================
   * LOAD PERSONNEL FROM DATABASE
   * ============================================================
   */

  useEffect(() => {

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

        console.log(
          "Response OK:",
          response.ok,
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

        console.log(
          "Is array:",
          Array.isArray(rawData),
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

        console.log(
          "Converted personnel data:",
          data,
        );

        setPersonnelList(data);

      } catch (error) {

        console.error(
          "PERSONNEL FETCH ERROR:",
          error,
        );

        if (error instanceof TypeError) {

          console.error(
            "This is probably a network/CORS/fetch URL problem.",
          );

        }

        setPersonnelError(
          error instanceof Error
            ? error.message
            : "Unable to load personnel from the database.",
        );

      } finally {

        setLoadingPersonnel(false);

      }

    };

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

  const offices =
    useMemo(() => {

      return Array.from(
        new Set(
          personnelList
            .map((person) => person.office)
            .filter(Boolean),
        ),
      );

    }, [personnelList]);

  const ranks =
    useMemo(() => {

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
   * ADD PERSONNEL
   * ============================================================
   */

  const handleAddPersonnel = () => {

    console.log(
      "Add personnel clicked",
    );

    /*
     * Connect this button to your
     * Add Personnel modal/page.
     */

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

    /*
     * CSV / Excel export can be
     * implemented here later.
     */

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

          <span>
            TODAY
          </span>

          <strong>
            {currentDate}
          </strong>

        </div>

      </div>

      {/* ======================================================
          STAT CARDS
      ======================================================= */}

      <section className="personnel-stat-grid">

        {/* TOTAL */}

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

        {/* MALE */}

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

        {/* FEMALE */}

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

        {/* FILTERED */}

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

        {/* CARD HEADER */}

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

          {/* SEARCH */}

          <div className="search-wrapper">

            <span>
              🔍
            </span>

            <input
              type="text"
              placeholder="Search name, RFID, rank or office..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

          </div>

          {/* RANK */}

          <select
            value={rankFilter}
            onChange={(event) =>
              setRankFilter(event.target.value)
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

          {/* SEX */}

          <select
            value={sexFilter}
            onChange={(event) =>
              setSexFilter(event.target.value)
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

          {/* OFFICE */}

          <select
            value={officeFilter}
            onChange={(event) =>
              setOfficeFilter(event.target.value)
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

        {/* ====================================================
            ERROR
        ===================================================== */}

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
            LOADING
        ===================================================== */}

        {loadingPersonnel ? (

          <div className="personnel-loading">

            <div className="loading-spinner" />

            <p>
              Loading personnel...
            </p>

          </div>

        ) : (

          /* ==================================================
             TABLE
          ================================================== */

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

        {/* ====================================================
            TABLE FOOTER
        ===================================================== */}

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

              <span>
                ›
              </span>

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

              <span>
                ›
              </span>

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

              <span>
                ›
              </span>

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

    </div>

  );
}
