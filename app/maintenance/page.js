"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../../lib/supabase";

export default function MaintenancePage() {
  const [
    maintenance,
    setMaintenance,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [
    updatingId,
    setUpdatingId,
  ] = useState(null);

  const [search, setSearch] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("All");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  async function loadMaintenance() {
    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } =
        await supabase
          .from("maintenance")
          .select("*")
          .eq(
            "user_id",
            user.id
          )
          .order("due_date", {
            ascending: true,
          });

      if (error) {
        console.error(
          "Could not load maintenance:",
          error
        );
        return;
      }

      setMaintenance(
        data || []
      );
    } catch (error) {
      console.error(
        "Could not load maintenance:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMaintenance();
  }, []);

  function addMonthsToDate(
    dateString,
    months
  ) {
    const parts =
      dateString.split("-");

    const year =
      Number(parts[0]);

    const month =
      Number(parts[1]);

    const day =
      Number(parts[2]);

    const target =
      new Date(
        year,
        month - 1 + months,
        1
      );

    const lastDay =
      new Date(
        target.getFullYear(),
        target.getMonth() + 1,
        0
      ).getDate();

    target.setDate(
      Math.min(
        day,
        lastDay
      )
    );

    const finalYear =
      target.getFullYear();

    const finalMonth =
      String(
        target.getMonth() + 1
      ).padStart(2, "0");

    const finalDay =
      String(
        target.getDate()
      ).padStart(2, "0");

    return `${finalYear}-${finalMonth}-${finalDay}`;
  }

  function getTodayString() {
    const today =
      new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        today.getDate()
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  async function createHistoryRecord(
    item,
    completedDate
  ) {
    const {
      error: historyError,
    } = await supabase
      .from("home_history")
      .insert({
        user_id:
          item.user_id,

        record_type:
          "maintenance",

        source_id:
          item.id,

        title:
          item.title,

        category:
          item.category || null,

        completed_date:
          completedDate,

        cost:
          item.estimated_cost !==
            null &&
          item.estimated_cost !==
            undefined
            ? Number(
                item.estimated_cost
              )
            : null,

        notes:
          item.notes || null,
      });

    if (historyError) {
      console.error(
        "Could not create history record:",
        historyError
      );

      return false;
    }

    return true;
  }

  async function toggleCompleted(
    item
  ) {
    setUpdatingId(
      item.id
    );

    setActionMessage("");
    setActionError("");

    /*
      RECURRING MAINTENANCE

      Record the completed occurrence
      in Home History first.

      Then move the live maintenance
      item to its next due date.
    */
    if (
      item.recurring &&
      !item.completed &&
      item.repeat_months
    ) {
      const completedDate =
        getTodayString();

      const historySaved =
        await createHistoryRecord(
          item,
          completedDate
        );

      if (!historySaved) {
        setActionError(
          "We couldn't save this completion to Home History, so the next occurrence was not scheduled."
        );

        setUpdatingId(null);
        return;
      }

      const nextDueDate =
        addMonthsToDate(
          item.due_date,
          Number(
            item.repeat_months
          )
        );

      const { error } =
        await supabase
          .from("maintenance")
          .update({
            completed: false,

            due_date:
              nextDueDate,

            last_completed_date:
              completedDate,
          })
          .eq(
            "id",
            item.id
          )
          .eq(
            "user_id",
            item.user_id
          );

      if (error) {
        console.error(
          "Could not update recurring maintenance:",
          error
        );

        setActionError(
          "The completion was added to Home History, but we couldn't schedule the next occurrence."
        );

        setUpdatingId(null);
        return;
      }

      setMaintenance(
        (current) =>
          current
            .map(
              (
                maintenanceItem
              ) =>
                maintenanceItem.id ===
                item.id
                  ? {
                      ...maintenanceItem,

                      completed:
                        false,

                      due_date:
                        nextDueDate,

                      last_completed_date:
                        completedDate,
                    }
                  : maintenanceItem
            )
            .sort(
              (a, b) =>
                new Date(
                  `${a.due_date}T00:00:00`
                ) -
                new Date(
                  `${b.due_date}T00:00:00`
                )
            )
      );

      setActionMessage(
        `"${item.title}" completed and saved to Home History. Next due ${formatDate(
          nextDueDate
        )}.`
      );

      setUpdatingId(null);
      return;
    }

    /*
      ONE-OFF MAINTENANCE

      When completing it, create
      its permanent history record.
    */
    if (!item.completed) {
      const completedDate =
        getTodayString();

      const historySaved =
        await createHistoryRecord(
          item,
          completedDate
        );

      if (!historySaved) {
        setActionError(
          "We couldn't save this completion to Home History, so the maintenance item was left open."
        );

        setUpdatingId(null);
        return;
      }

      const updates = {
        completed: true,

        last_completed_date:
          completedDate,
      };

      const { error } =
        await supabase
          .from("maintenance")
          .update(updates)
          .eq(
            "id",
            item.id
          )
          .eq(
            "user_id",
            item.user_id
          );

      if (error) {
        console.error(
          "Could not complete maintenance:",
          error
        );

        setActionError(
          "The completion was added to Home History, but we couldn't update the maintenance item."
        );

        setUpdatingId(null);
        return;
      }

      setMaintenance(
        (current) =>
          current.map(
            (
              maintenanceItem
            ) =>
              maintenanceItem.id ===
              item.id
                ? {
                    ...maintenanceItem,
                    ...updates,
                  }
                : maintenanceItem
          )
      );

      setActionMessage(
        `"${item.title}" completed and saved to Home History.`
      );

      setUpdatingId(null);
      return;
    }

    /*
      REOPEN A COMPLETED
      ONE-OFF ITEM

      This changes the live record
      back to open.

      We intentionally do not delete
      its historical completion.
    */

    const { error } =
      await supabase
        .from("maintenance")
        .update({
          completed: false,
          last_completed_date:
            null,
        })
        .eq(
          "id",
          item.id
        )
        .eq(
          "user_id",
          item.user_id
        );

    if (error) {
      console.error(
        "Could not reopen maintenance:",
        error
      );

      setActionError(
        "We couldn't reopen this maintenance item."
      );

      setUpdatingId(null);
      return;
    }

    setMaintenance(
      (current) =>
        current.map(
          (
            maintenanceItem
          ) =>
            maintenanceItem.id ===
            item.id
              ? {
                  ...maintenanceItem,
                  completed:
                    false,
                  last_completed_date:
                    null,
                }
              : maintenanceItem
        )
    );

    setActionMessage(
      `"${item.title}" reopened.`
    );

    setUpdatingId(null);
  }

 async function deleteMaintenance(
  item
) {
  const confirmed =
    window.confirm(
      `Remove "${item.title}"? This cannot be undone.`
    );

  if (!confirmed) {
    return;
  }

  setUpdatingId(item.id);

  setActionMessage("");
  setActionError("");

  try {
    /*
      Find any documents attached
      to this maintenance item.
    */

    const {
      data: documents,
      error: documentsError,
    } = await supabase
      .from("documents")
      .select(
        "id, file_path"
      )
      .eq(
        "maintenance_id",
        item.id
      )
      .eq(
        "user_id",
        item.user_id
      );

    if (documentsError) {
      console.error(
        "Could not check maintenance documents:",
        documentsError
      );

      setActionError(
        "We couldn't check this maintenance item's documents, so it was not removed."
      );

      setUpdatingId(null);
      return;
    }


    /*
      Remove the actual files from
      Supabase Storage first.
    */

    if (
      documents &&
      documents.length > 0
    ) {
      const filePaths =
        documents
          .map(
            (document) =>
              document.file_path
          )
          .filter(Boolean);

      if (
        filePaths.length > 0
      ) {
        const {
          error: storageError,
        } =
          await supabase.storage
            .from(
              "home-documents"
            )
            .remove(
              filePaths
            );

        if (storageError) {
          console.error(
            "Could not remove maintenance files:",
            storageError
          );

          setActionError(
            "We couldn't remove this maintenance item's documents, so the maintenance item was left in place."
          );

          setUpdatingId(null);
          return;
        }
      }
    }


    /*
      Delete the maintenance item.

      The documents table rows are
      automatically removed by the
      database relationship.
    */

    const {
      error: deleteError,
    } = await supabase
      .from("maintenance")
      .delete()
      .eq(
        "id",
        item.id
      )
      .eq(
        "user_id",
        item.user_id
      );

    if (deleteError) {
      console.error(
        "Could not delete maintenance:",
        deleteError
      );

      setActionError(
        "We couldn't remove this maintenance item."
      );

      setUpdatingId(null);
      return;
    }


    setMaintenance(
      (current) =>
        current.filter(
          (
            maintenanceItem
          ) =>
            maintenanceItem.id !==
            item.id
        )
    );


    setActionMessage(
      `"${item.title}" removed.`
    );

  } catch (deleteCatchError) {
    console.error(
      "Could not delete maintenance:",
      deleteCatchError
    );

    setActionError(
      "Something went wrong while removing this maintenance item."
    );

  } finally {
    setUpdatingId(null);
  }
}

  function formatDate(
    dateString
  ) {
    if (!dateString) {
      return "No date";
    }

    return new Date(
      `${dateString}T00:00:00`
    ).toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getStatus(
    item
  ) {
    if (item.completed) {
      return "Completed";
    }

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const dueDate =
      new Date(
        `${item.due_date}T00:00:00`
      );

    if (dueDate < today) {
      return "Overdue";
    }

    return "Upcoming";
  }

  function getRepeatLabel(
    months
  ) {
    const value =
      Number(months);

    if (value === 1) {
      return "Every month";
    }

    if (value === 3) {
      return "Every 3 months";
    }

    if (value === 6) {
      return "Every 6 months";
    }

    if (value === 12) {
      return "Every year";
    }

    if (value === 24) {
      return "Every 2 years";
    }

    return `Every ${value} months`;
  }

  const categories =
    useMemo(() => {
      const uniqueCategories =
        maintenance
          .map(
            (item) =>
              item.category
          )
          .filter(Boolean);

      return [
        ...new Set(
          uniqueCategories
        ),
      ].sort();
    }, [maintenance]);

  const filteredMaintenance =
    useMemo(() => {
      const searchTerm =
        search
          .trim()
          .toLowerCase();

      return maintenance.filter(
        (item) => {
          const status =
            getStatus(item);

          const matchesSearch =
            searchTerm === "" ||
            item.title
              ?.toLowerCase()
              .includes(
                searchTerm
              ) ||
            item.notes
              ?.toLowerCase()
              .includes(
                searchTerm
              ) ||
            item.category
              ?.toLowerCase()
              .includes(
                searchTerm
              );

          const matchesCategory =
            categoryFilter ===
              "All" ||
            item.category ===
              categoryFilter;

          const matchesStatus =
            statusFilter ===
              "All" ||
            status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
          );
        }
      );
    }, [
      maintenance,
      search,
      categoryFilter,
      statusFilter,
    ]);

  const filtersActive =
    search.trim() !== "" ||
    categoryFilter !==
      "All" ||
    statusFilter !==
      "All";

  function clearFilters() {
    setSearch("");
    setCategoryFilter(
      "All"
    );
    setStatusFilter(
      "All"
    );
  }

  return (
    <main className="maintenancePage">
      <div className="maintenanceContainer">
        <header className="maintenancePageHeader">
          <div>
            <Link
              href="/dashboard"
              className="backLink"
            >
              ← Dashboard
            </Link>

            <p className="eyebrow">
              YOUR HOME
            </p>

            <h1>
              Maintenance
            </h1>

            <p className="maintenanceSubtitle">
              Keep track of
              everything your home
              needs.
            </p>
          </div>

          <Link
            href="/maintenance/new"
            className="maintenanceAddButton"
          >
            ＋ Add maintenance
          </Link>
        </header>

        {actionMessage && (
          <div className="recurringSuccess">
            <span>✓</span>

            <p>
              {actionMessage}
            </p>
          </div>
        )}

        {actionError && (
          <div className="historyActionError">
            <span>!</span>

            <p>
              {actionError}
            </p>
          </div>
        )}

        {loading ? (
          <div className="maintenanceEmptyState">
            Loading your
            maintenance...
          </div>
        ) : maintenance.length ===
          0 ? (
          <div className="maintenanceEmptyState">
            <div className="maintenanceEmptyIcon">
              🔧
            </div>

            <h2>
              Nothing logged yet
            </h2>

            <p>
              Add your first
              maintenance item and
              FixIt Log will keep it
              organised for you.
            </p>

            <Link
              href="/maintenance/new"
              className="primaryButton maintenanceEmptyButton"
            >
              Add maintenance →
            </Link>
          </div>
        ) : (
          <>
            <section className="maintenanceFilters">
              <div className="maintenanceSearch">
                <label htmlFor="maintenance-search">
                  Search
                </label>

                <div className="maintenanceSearchInput">
                  <span>
                    🔎
                  </span>

                  <input
                    id="maintenance-search"
                    type="text"
                    placeholder="Search maintenance..."
                    value={search}
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event
                          .target
                          .value
                      )
                    }
                  />
                </div>
              </div>

              <div className="maintenanceFilter">
                <label htmlFor="maintenance-category">
                  Category
                </label>

                <select
                  id="maintenance-category"
                  value={
                    categoryFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setCategoryFilter(
                      event
                        .target
                        .value
                    )
                  }
                >
                  <option value="All">
                    All categories
                  </option>

                  {categories.map(
                    (
                      category
                    ) => (
                      <option
                        value={
                          category
                        }
                        key={
                          category
                        }
                      >
                        {
                          category
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="maintenanceFilter">
                <label htmlFor="maintenance-status">
                  Status
                </label>

                <select
                  id="maintenance-status"
                  value={
                    statusFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setStatusFilter(
                      event
                        .target
                        .value
                    )
                  }
                >
                  <option value="All">
                    All statuses
                  </option>

                  <option value="Upcoming">
                    Upcoming
                  </option>

                  <option value="Overdue">
                    Overdue
                  </option>

                  <option value="Completed">
                    Completed
                  </option>
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="clearFiltersButton"
                  onClick={
                    clearFilters
                  }
                >
                  Clear filters
                </button>
              )}
            </section>

            <div className="maintenanceResultsHeader">
              <p>
                Showing{" "}
                <strong>
                  {
                    filteredMaintenance.length
                  }
                </strong>{" "}
                of{" "}
                <strong>
                  {
                    maintenance.length
                  }
                </strong>{" "}
                {maintenance.length ===
                1
                  ? "item"
                  : "items"}
              </p>
            </div>

            {filteredMaintenance.length ===
            0 ? (
              <div className="maintenanceEmptyState">
                <div className="maintenanceEmptyIcon">
                  🔎
                </div>

                <h2>
                  No matching
                  maintenance
                </h2>

                <p>
                  Try changing your
                  search or filters
                  to find what you're
                  looking for.
                </p>

                <button
                  type="button"
                  className="primaryButton maintenanceEmptyButton"
                  onClick={
                    clearFilters
                  }
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <section className="maintenancePageList">
                {filteredMaintenance.map(
                  (item) => {
                    const status =
                      getStatus(
                        item
                      );

                    return (
                      <article
                        className={`maintenanceItemCard ${
                          item.completed
                            ? "completed"
                            : ""
                        }`}
                        key={
                          item.id
                        }
                      >
                        <div className="maintenanceItemIcon">
                          {item.recurring
                            ? "↻"
                            : "🔧"}
                        </div>

                        <div className="maintenanceItemMain">
                          <div className="maintenanceItemTop">
                            <div>
                              <p className="maintenanceCategory">
                                {
                                  item.category
                                }
                              </p>

                              <h2>
                                {
                                  item.title
                                }
                              </h2>
                            </div>

                            <span
                              className={`maintenanceStatus ${status
                                .toLowerCase()
                                .replace(
                                  " ",
                                  "-"
                                )}`}
                            >
                              {
                                status
                              }
                            </span>
                          </div>

                          <div className="maintenanceItemDetails">
                            <span>
                              📅{" "}
                              {formatDate(
                                item.due_date
                              )}
                            </span>

                            {item.recurring &&
                              item.repeat_months && (
                                <span className="recurringMeta">
                                  ↻{" "}
                                  {getRepeatLabel(
                                    item.repeat_months
                                  )}
                                </span>
                              )}

                            {item.estimated_cost !==
                              null &&
                              item.estimated_cost !==
                                undefined && (
                                <span>
                                  💷 £
                                  {Number(
                                    item.estimated_cost
                                  ).toFixed(
                                    2
                                  )}
                                </span>
                              )}
                          </div>

                          {item.last_completed_date &&
                            item.recurring && (
                              <p className="lastCompletedText">
                                Last
                                completed{" "}
                                {formatDate(
                                  item.last_completed_date
                                )}
                              </p>
                            )}

                          {item.notes && (
                            <p className="maintenanceNotes">
                              {
                                item.notes
                              }
                            </p>
                          )}

                          <div className="maintenanceItemActions">
                            <Link
                              href={`/maintenance/edit/${item.id}`}
                              className="editButton"
                            >
                              Edit
                            </Link>

                            <button
                              type="button"
                              className="completeButton"
                              onClick={() =>
                                toggleCompleted(
                                  item
                                )
                              }
                              disabled={
                                updatingId ===
                                item.id
                              }
                            >
                              {updatingId ===
                              item.id
                                ? "Updating..."
                                : item.recurring &&
                                  !item.completed
                                ? "✓ Complete & schedule next"
                                : item.completed
                                ? "Mark as open"
                                : "Mark as completed"}
                            </button>

                            <button
                              type="button"
                              className="deleteButton"
                              onClick={() =>
                                deleteMaintenance(
                                  item
                                )
                              }
                              disabled={
                                updatingId ===
                                item.id
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </section>
            )}
          </>
        )}

        <nav className="dashboardNav maintenanceBottomNav">
          <Link href="/dashboard">
            Dashboard
          </Link>

          <Link
            href="/maintenance"
            className="active"
          >
            Maintenance
          </Link>

          <Link href="/repairs">
            Repairs
          </Link>

          <Link href="/costs">
            Costs
          </Link>
        </nav>
      </div>
    </main>
  );
}