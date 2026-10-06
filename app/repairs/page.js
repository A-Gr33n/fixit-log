"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function RepairsPage() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  async function loadRepairs() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("repairs")
        .select("*")
        .eq("user_id", user.id)
        .order("repair_date", { ascending: false });

      if (error) {
        console.error("Could not load repairs:", error);
        return;
      }

      setRepairs(data || []);
    } catch (error) {
      console.error("Could not load repairs:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRepairs();
  }, []);

  async function toggleCompleted(repair) {
    setUpdatingId(repair.id);

    const { error } = await supabase
      .from("repairs")
      .update({ completed: !repair.completed })
      .eq("id", repair.id)
      .eq("user_id", repair.user_id);

    if (error) {
      console.error("Could not update repair:", error);
      setUpdatingId(null);
      return;
    }

    setRepairs((current) =>
      current.map((item) =>
        item.id === repair.id
          ? { ...item, completed: !repair.completed }
          : item
      )
    );

    setUpdatingId(null);
  }

  async function deleteRepair(repair) {
    const confirmed = window.confirm(
      `Remove "${repair.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setUpdatingId(repair.id);

    const { error } = await supabase
      .from("repairs")
      .delete()
      .eq("id", repair.id)
      .eq("user_id", repair.user_id);

    if (error) {
      console.error("Could not delete repair:", error);
      setUpdatingId(null);
      return;
    }

    setRepairs((current) =>
      current.filter((item) => item.id !== repair.id)
    );

    setUpdatingId(null);
  }

  function formatDate(dateString) {
    if (!dateString) return "No date";

    return new Date(`${dateString}T00:00:00`).toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatCost(cost) {
    if (cost === null || cost === undefined || cost === "") {
      return "Not recorded";
    }

    return `£${Number(cost).toFixed(2)}`;
  }

  return (
    <main className="repairsPage">
      <div className="repairsContainer">

        {/* Header */}
        <header className="repairsHeader">
          <Link href="/dashboard" className="repairsBackLink">
            ← Dashboard
          </Link>

          <div className="repairsHeaderContent">
            <p className="repairsEyebrow">YOUR HOME</p>

            <h1>Repairs</h1>

            <p className="repairsSubtitle">
              Keep a record of repairs, costs and work completed
              on your home.
            </p>
          </div>

          <Link
            href="/repairs/new"
            className="repairsAddButton"
          >
            <span className="repairsAddIcon">+</span>
            Add repair
          </Link>
        </header>

        {/* Main content */}
        <section className="repairsContent">

          {loading ? (
            <div className="repairsEmpty">
              <div className="repairsEmptyIcon">🔧</div>

              <h2>Loading repairs...</h2>

              <p>
                Your repair records will appear here.
              </p>
            </div>
          ) : repairs.length === 0 ? (
            <div className="repairsEmpty">
              <div className="repairsEmptyIcon">🔧</div>

              <h2>No repairs logged yet</h2>

              <p>
                Add your first repair to keep a record of work
                carried out on your home.
              </p>

              <Link
                href="/repairs/new"
                className="repairsEmptyButton"
              >
                Add your first repair
              </Link>
            </div>
          ) : (
            <>
              {/* Section heading */}
              <div className="repairsSectionHeader">
                <div>
                  <p className="repairsEyebrow">
                    REPAIR HISTORY
                  </p>

                  <h2>Your repairs</h2>
                </div>

                <span className="repairsCount">
                  {repairs.length}{" "}
                  {repairs.length === 1 ? "repair" : "repairs"}
                </span>
              </div>

              {/* Repair cards */}
              <div className="repairsList">
                {repairs.map((repair) => (
                  <article
                    className={`repairCard ${
                      repair.completed
                        ? "repairCardCompleted"
                        : ""
                    }`}
                    key={repair.id}
                  >
                    {/* Card top */}
                    <div className="repairCardTop">

                      <div className="repairIcon">
                        🔧
                      </div>

                      <div className="repairMainInfo">
                        <div className="repairTitleRow">
                          <h3>{repair.title}</h3>

                          <span
                            className={`repairStatus ${
                              repair.completed
                                ? "repairStatusCompleted"
                                : "repairStatusOpen"
                            }`}
                          >
                            {repair.completed
                              ? "Completed"
                              : "Open"}
                          </span>
                        </div>

                        <p className="repairMeta">
                          {repair.category || "Repair"}
                          <span>•</span>
                          {formatDate(repair.repair_date)}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="repairDetails">

                      <div className="repairDetail">
                        <span className="repairDetailLabel">
                          STATUS
                        </span>

                        <strong>
                          {repair.completed
                            ? "Completed"
                            : "Open"}
                        </strong>
                      </div>

                      <div className="repairDetail">
                        <span className="repairDetailLabel">
                          COST
                        </span>

                        <strong>
                          {formatCost(repair.cost)}
                        </strong>
                      </div>

                      <div className="repairDetail">
                        <span className="repairDetailLabel">
                          DATE
                        </span>

                        <strong>
                          {formatDate(repair.repair_date)}
                        </strong>
                      </div>
                    </div>

                    {/* Notes */}
                    {repair.notes && (
                      <div className="repairNotes">
                        <span className="repairDetailLabel">
                          NOTES
                        </span>

                        <p>{repair.notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="repairActions">

                      <Link
                        href={`/repairs/${repair.id}/edit`}
                        className="repairEditButton"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        className="repairCompleteButton"
                        onClick={() =>
                          toggleCompleted(repair)
                        }
                        disabled={
                          updatingId === repair.id
                        }
                      >
                        {updatingId === repair.id
                          ? "Updating..."
                          : repair.completed
                          ? "Mark as open"
                          : "Mark complete"}
                      </button>

                      <button
                        type="button"
                        className="repairDeleteButton"
                        onClick={() =>
                          deleteRepair(repair)
                        }
                        disabled={
                          updatingId === repair.id
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Bottom navigation */}
        <nav className="repairsNavigation">
          <Link href="/dashboard">
            Dashboard
          </Link>

          <Link href="/maintenance">
            Maintenance
          </Link>

          <Link
            href="/repairs"
            className="repairsNavigationActive"
          >
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