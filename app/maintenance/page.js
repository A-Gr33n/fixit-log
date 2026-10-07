"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  async function loadMaintenance() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("maintenance")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Could not load maintenance:", error);
        return;
      }

      setMaintenance(data || []);
    } catch (error) {
      console.error("Could not load maintenance:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMaintenance();
  }, []);

  async function toggleCompleted(item) {
    setUpdatingId(item.id);

    const { error } = await supabase
      .from("maintenance")
      .update({
        completed: !item.completed,
      })
      .eq("id", item.id)
      .eq("user_id", item.user_id);

    if (error) {
      console.error("Could not update maintenance:", error);
      setUpdatingId(null);
      return;
    }

    setMaintenance((current) =>
      current.map((maintenanceItem) =>
        maintenanceItem.id === item.id
          ? {
              ...maintenanceItem,
              completed: !item.completed,
            }
          : maintenanceItem
      )
    );

    setUpdatingId(null);
  }

  async function deleteMaintenance(item) {
    const confirmed = window.confirm(
      `Remove "${item.title}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setUpdatingId(item.id);

    const { error } = await supabase
      .from("maintenance")
      .delete()
      .eq("id", item.id)
      .eq("user_id", item.user_id);

    if (error) {
      console.error("Could not delete maintenance:", error);
      setUpdatingId(null);
      return;
    }

    setMaintenance((current) =>
      current.filter(
        (maintenanceItem) => maintenanceItem.id !== item.id
      )
    );

    setUpdatingId(null);
  }

  function formatDate(dateString) {
    if (!dateString) {
      return "No date";
    }

    return new Date(`${dateString}T00:00:00`).toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getStatus(item) {
    if (item.completed) {
      return "Completed";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(`${item.due_date}T00:00:00`);

    if (dueDate < today) {
      return "Overdue";
    }

    return "Upcoming";
  }

  const categories = useMemo(() => {
    const uniqueCategories = maintenance
      .map((item) => item.category)
      .filter(Boolean);

    return [...new Set(uniqueCategories)].sort();
  }, [maintenance]);

  const filteredMaintenance = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    return maintenance.filter((item) => {
      const status = getStatus(item);

      const matchesSearch =
        searchTerm === "" ||
        item.title?.toLowerCase().includes(searchTerm) ||
        item.notes?.toLowerCase().includes(searchTerm) ||
        item.category?.toLowerCase().includes(searchTerm);

      const matchesCategory =
        categoryFilter === "All" ||
        item.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [maintenance, search, categoryFilter, statusFilter]);

  const filtersActive =
    search.trim() !== "" ||
    categoryFilter !== "All" ||
    statusFilter !== "All";

  function clearFilters() {
    setSearch("");
    setCategoryFilter("All");
    setStatusFilter("All");
  }

  return (
    <main className="maintenancePage">
      <div className="maintenanceContainer">
        <header className="maintenancePageHeader">
          <div>
            <Link href="/dashboard" className="backLink">
              ← Dashboard
            </Link>

            <p className="eyebrow">YOUR HOME</p>

            <h1>Maintenance</h1>

            <p className="maintenanceSubtitle">
              Keep track of everything your home needs.
            </p>
          </div>

          <Link
            href="/maintenance/new"
            className="maintenanceAddButton"
          >
            ＋ Add maintenance
          </Link>
        </header>

        {loading ? (
          <div className="maintenanceEmptyState">
            Loading your maintenance...
          </div>
        ) : maintenance.length === 0 ? (
          <div className="maintenanceEmptyState">
            <div className="maintenanceEmptyIcon">🔧</div>

            <h2>Nothing logged yet</h2>

            <p>
              Add your first maintenance item and FixIt Log will keep it
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
                  <span>🔎</span>

                  <input
                    id="maintenance-search"
                    type="text"
                    placeholder="Search maintenance..."
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
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
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(event.target.value)
                  }
                >
                  <option value="All">All categories</option>

                  {categories.map((category) => (
                    <option
                      value={category}
                      key={category}
                    >
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="maintenanceFilter">
                <label htmlFor="maintenance-status">
                  Status
                </label>

                <select
                  id="maintenance-status"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                >
                  <option value="All">All statuses</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              {filtersActive && (
                <button
                  type="button"
                  className="clearFiltersButton"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              )}
            </section>

            <div className="maintenanceResultsHeader">
              <p>
                Showing{" "}
                <strong>
                  {filteredMaintenance.length}
                </strong>{" "}
                of{" "}
                <strong>{maintenance.length}</strong>{" "}
                {maintenance.length === 1
                  ? "item"
                  : "items"}
              </p>
            </div>

            {filteredMaintenance.length === 0 ? (
              <div className="maintenanceEmptyState">
                <div className="maintenanceEmptyIcon">
                  🔎
                </div>

                <h2>No matching maintenance</h2>

                <p>
                  Try changing your search or filters to find what
                  you're looking for.
                </p>

                <button
                  type="button"
                  className="primaryButton maintenanceEmptyButton"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <section className="maintenancePageList">
                {filteredMaintenance.map((item) => {
                  const status = getStatus(item);

                  return (
                    <article
                      className={`maintenanceItemCard ${
                        item.completed ? "completed" : ""
                      }`}
                      key={item.id}
                    >
                      <div className="maintenanceItemIcon">
                        🔧
                      </div>

                      <div className="maintenanceItemMain">
                        <div className="maintenanceItemTop">
                          <div>
                            <p className="maintenanceCategory">
                              {item.category}
                            </p>

                            <h2>{item.title}</h2>
                          </div>

                          <span
                            className={`maintenanceStatus ${status
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          >
                            {status}
                          </span>
                        </div>

                        <div className="maintenanceItemDetails">
                          <span>
                            📅 {formatDate(item.due_date)}
                          </span>

                          {item.estimated_cost !== null &&
                            item.estimated_cost !== undefined && (
                              <span>
                                💷 £
                                {Number(
                                  item.estimated_cost
                                ).toFixed(2)}
                              </span>
                            )}
                        </div>

                        {item.notes && (
                          <p className="maintenanceNotes">
                            {item.notes}
                          </p>
                        )}

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
                            toggleCompleted(item)
                          }
                          disabled={updatingId === item.id}
                        >
                          {updatingId === item.id
                            ? "Updating..."
                            : item.completed
                            ? "Mark as open"
                            : "Mark as completed"}
                        </button>

                        <button
                          type="button"
                          className="deleteButton"
                          onClick={() =>
                            deleteMaintenance(item)
                          }
                          disabled={updatingId === item.id}
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}

        <nav className="dashboardNav maintenanceBottomNav">
          <Link href="/dashboard">Dashboard</Link>

          <Link
            href="/maintenance"
            className="active"
          >
            Maintenance
          </Link>

          <Link href="/repairs">Repairs</Link>

          <Link href="/costs">Costs</Link>
        </nav>
      </div>
    </main>
  );
}