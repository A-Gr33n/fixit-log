"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../../lib/supabase";

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Could not load user:",
            userError
          );

          setError(
            "We couldn't load your Home History."
          );

          return;
        }

        if (!user) {
          setError(
            "You need to be signed in to view Home History."
          );

          return;
        }

        const {
          data,
          error: historyError,
        } = await supabase
          .from("home_history")
          .select("*")
          .eq("user_id", user.id)
          .order("completed_date", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          });

        if (historyError) {
          console.error(
            "Could not load Home History:",
            historyError
          );

          setError(
            "We couldn't load your Home History."
          );

          return;
        }

        setHistory(data || []);
      } catch (loadError) {
        console.error(
          "Could not load Home History:",
          loadError
        );

        setError(
          "Something went wrong loading your Home History."
        );
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, []);

  function formatDate(dateString) {
    if (!dateString) {
      return "No date";
    }

    return new Date(
      `${dateString}T00:00:00`
    ).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatCost(cost) {
    if (
      cost === null ||
      cost === undefined ||
      cost === ""
    ) {
      return null;
    }

    const amount = Number(cost);

    if (Number.isNaN(amount)) {
      return null;
    }

    return `£${amount.toFixed(2)}`;
  }

  function getTypeLabel(recordType) {
    if (recordType === "maintenance") {
      return "Maintenance";
    }

    if (recordType === "repair") {
      return "Repair";
    }

    return "Home";
  }

  function getTypeIcon(recordType) {
    if (recordType === "maintenance") {
      return "🔧";
    }

    if (recordType === "repair") {
      return "🛠️";
    }

    return "✓";
  }

  const filteredHistory = useMemo(() => {
    const searchTerm = search
      .trim()
      .toLowerCase();

    return history.filter((item) => {
      const matchesSearch =
        searchTerm === "" ||
        item.title
          ?.toLowerCase()
          .includes(searchTerm) ||
        item.category
          ?.toLowerCase()
          .includes(searchTerm) ||
        item.notes
          ?.toLowerCase()
          .includes(searchTerm);

      const matchesType =
        typeFilter === "All" ||
        item.record_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [history, search, typeFilter]);

  const totalRecordedCost = useMemo(() => {
    return history.reduce((total, item) => {
      const amount = Number(item.cost);

      if (
        item.cost === null ||
        item.cost === undefined ||
        Number.isNaN(amount)
      ) {
        return total;
      }

      return total + amount;
    }, 0);
  }, [history]);

  const maintenanceCount = useMemo(() => {
    return history.filter(
      (item) =>
        item.record_type === "maintenance"
    ).length;
  }, [history]);

  const repairCount = useMemo(() => {
    return history.filter(
      (item) => item.record_type === "repair"
    ).length;
  }, [history]);

  const filtersActive =
    search.trim() !== "" ||
    typeFilter !== "All";

  function clearFilters() {
    setSearch("");
    setTypeFilter("All");
  }

  return (
    <main className="historyPage">
      <div className="historyContainer">
        <header className="historyHeader">
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

            <h1>Home History</h1>

            <p className="historySubtitle">
              A permanent record of completed
              work around your home.
            </p>
          </div>
        </header>

        {!loading && !error && history.length > 0 && (
          <section className="historySummary">
            <div className="historySummaryCard">
              <span className="historySummaryIcon">
                ✓
              </span>

              <div>
                <strong>
                  {history.length}
                </strong>

                <span>
                  {history.length === 1
                    ? "completed job"
                    : "completed jobs"}
                </span>
              </div>
            </div>

            <div className="historySummaryCard">
              <span className="historySummaryIcon">
                🔧
              </span>

              <div>
                <strong>
                  {maintenanceCount}
                </strong>

                <span>
                  Maintenance
                </span>
              </div>
            </div>

            <div className="historySummaryCard">
              <span className="historySummaryIcon">
                🛠️
              </span>

              <div>
                <strong>
                  {repairCount}
                </strong>

                <span>
                  Repairs
                </span>
              </div>
            </div>

            <div className="historySummaryCard">
              <span className="historySummaryIcon">
                £
              </span>

              <div>
                <strong>
                  £{totalRecordedCost.toFixed(2)}
                </strong>

                <span>
                  Recorded cost
                </span>
              </div>
            </div>
          </section>
        )}

        {!loading && !error && history.length > 0 && (
          <section className="historyFilters">
            <div className="historySearch">
              <label htmlFor="history-search">
                Search
              </label>

              <div className="historySearchInput">
                <span>🔎</span>

                <input
                  id="history-search"
                  type="text"
                  placeholder="Search Home History..."
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="historyFilter">
              <label htmlFor="history-type">
                Type
              </label>

              <select
                id="history-type"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All work
                </option>

                <option value="maintenance">
                  Maintenance
                </option>

                <option value="repair">
                  Repairs
                </option>
              </select>
            </div>

            {filtersActive && (
              <button
                type="button"
                className="historyClearFilters"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </section>
        )}

        {loading ? (
          <section className="historyEmptyState">
            <div className="historyEmptyIcon">
              🏠
            </div>

            <h2>
              Loading Home History...
            </h2>
          </section>
        ) : error ? (
          <section className="historyEmptyState">
            <div className="historyEmptyIcon">
              !
            </div>

            <h2>
              Couldn't load Home History
            </h2>

            <p>{error}</p>
          </section>
        ) : history.length === 0 ? (
          <section className="historyEmptyState">
            <div className="historyEmptyIcon">
              🏠
            </div>

            <h2>
              Your Home History starts here
            </h2>

            <p>
              Completed maintenance and repairs
              will build a useful record of the
              work carried out around your home.
            </p>

            <Link
              href="/maintenance"
              className="primaryButton historyEmptyButton"
            >
              View maintenance →
            </Link>
          </section>
        ) : filteredHistory.length === 0 ? (
          <section className="historyEmptyState">
            <div className="historyEmptyIcon">
              🔎
            </div>

            <h2>
              No matching history
            </h2>

            <p>
              Try changing your search or filter.
            </p>

            <button
              type="button"
              className="primaryButton historyEmptyButton"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </section>
        ) : (
          <>
            <div className="historyResultsHeader">
              <p>
                Showing{" "}
                <strong>
                  {filteredHistory.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {history.length}
                </strong>{" "}
                {history.length === 1
                  ? "record"
                  : "records"}
              </p>
            </div>

            <section className="historyTimeline">
              {filteredHistory.map((item) => {
                const cost =
                  formatCost(item.cost);

                return (
                  <article
                    className="historyTimelineItem"
                    key={item.id}
                  >
                    <div className="historyTimelineRail">
                      <span className="historyTimelineDot">
                        {getTypeIcon(
                          item.record_type
                        )}
                      </span>
                    </div>

                    <div className="historyRecordCard">
                      <div className="historyRecordTop">
                        <div>
                          <p className="historyRecordDate">
                            {formatDate(
                              item.completed_date
                            )}
                          </p>

                          <h2>
                            {item.title}
                          </h2>
                        </div>

                        <span
                          className={`historyTypeBadge ${item.record_type}`}
                        >
                          {getTypeLabel(
                            item.record_type
                          )}
                        </span>
                      </div>

                      <div className="historyRecordMeta">
                        {item.category && (
                          <span>
                            {item.category}
                          </span>
                        )}

                        {cost && (
                          <span>
                            {cost}
                          </span>
                        )}

                        <span>
                          Completed
                        </span>
                      </div>

                      {item.notes && (
                        <p className="historyRecordNotes">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}

        <nav className="dashboardNav historyBottomNav">
          <Link href="/dashboard">
            Dashboard
          </Link>

          <Link href="/maintenance">
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