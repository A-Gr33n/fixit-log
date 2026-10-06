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

  return (
    <main className="maintenancePage">
      <div className="maintenanceContainer">
        <header className="maintenancePageHeader">
          <div>
            <Link href="/dashboard" className="backLink">
              ← Dashboard
            </Link>

            <p className="eyebrow">YOUR HOME</p>

            <h1>Repairs</h1>

            <p className="maintenanceSubtitle">
              Keep a record of repairs, costs and work completed on
              your home.
            </p>
          </div>
        </header>

        <div className="pageActions">
          <Link
            href="/repairs/new"
            className="primaryButton"
          >
            ＋ Add repair
          </Link>
        </div>

        {loading ? (
          <div className="maintenanceEmptyState">
            <div className="maintenanceIcon">🔧</div>

            <div>
              <h2>Loading repairs...</h2>
              <p>
                Your repair records will appear here.
              </p>
            </div>
          </div>
        ) : repairs.length === 0 ? (
          <div className="maintenanceEmptyState">
            <div className="maintenanceIcon">🔧</div>

            <div>
              <h2>No repairs logged yet</h2>

              <p>
                Add your first repair to keep a record of work
                carried out on your home.
              </p>

              <Link
                href="/repairs/new"
                className="textLink"
              >
                Add a repair →
              </Link>
            </div>
          </div>
        ) : (
          <section className="maintenanceListPage">
            <div className="sectionHeading">
              <div>
                <p className="eyebrow">REPAIR HISTORY</p>
                <h2>Your repairs</h2>
              </div>
            </div>

            <div className="maintenanceList">
              {repairs.map((repair) => (
                <article
                  className="maintenanceItem"
                  key={repair.id}
                >
                  <div className="maintenanceItemTop">
                    <div className="maintenanceIcon">
                      🔧
                    </div>

                    <div className="maintenanceContent">
                      <strong>{repair.title}</strong>

                      <span>
                        {repair.category || "Repair"} ·{" "}
                        {formatDate(repair.repair_date)}
                      </span>
                    </div>
                  </div>

                  <div className="maintenanceDetails">
                    <div className="maintenanceDetail">
                      <span className="detailLabel">
                        STATUS
                      </span>

                      <strong>
                        {repair.completed
                          ? "Completed"
                          : "Open"}
                      </strong>
                    </div>

                    <div className="maintenanceDetail">
                      <span className="detailLabel">
                        COST
                      </span>

                      <strong>
                        {repair.cost !== null &&
                        repair.cost !== undefined
                          ? `£${Number(repair.cost).toFixed(
                              2
                            )}`
                          : "Not recorded"}
                      </strong>
                    </div>
                  </div>

                  {repair.notes && (
                    <div className="maintenanceNotes">
                      <span className="detailLabel">
                        NOTES
                      </span>

                      <p>{repair.notes}</p>
                    </div>
                  )}

                  <div className="maintenanceItemActions">
                    <Link
                      href={`/repairs/${repair.id}/edit`}
                      className="editButton"
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      className="completeButton"
                      onClick={() =>
                        toggleCompleted(repair)
                      }
                      disabled={updatingId === repair.id}
                    >
                      {updatingId === repair.id
                        ? "Updating..."
                        : repair.completed
                        ? "Mark as open"
                        : "Mark complete"}
                    </button>

                    <button
                      type="button"
                      className="deleteButton"
                      onClick={() =>
                        deleteRepair(repair)
                      }
                      disabled={updatingId === repair.id}
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <nav className="dashboardNav">
          <Link href="/dashboard">
            Dashboard
          </Link>

          <Link href="/maintenance">
            Maintenance
          </Link>

          <Link
            href="/repairs"
            className="active"
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