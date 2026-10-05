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
      .update({
        completed: !repair.completed,
      })
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
          ? {
              ...item,
              completed: !repair.completed,
            }
          : item
      )
    );

    setUpdatingId(null);
  }

  async function deleteRepair(repair) {
  const confirmed = window.confirm(
    `Remove "${repair.title}"? This cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

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
    return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
              Keep a record of repairs and what they cost.
            </p>
          </div>

          <Link
            href="/repairs/new"
            className="maintenanceAddButton"
          >
            ＋ Add repair
          </Link>
        </header>

        {loading ? (
          <div className="maintenanceEmptyState">
            Loading your repairs...
          </div>
        ) : repairs.length === 0 ? (
          <div className="maintenanceEmptyState">
            <div className="maintenanceEmptyIcon">🔧</div>

            <h2>No repairs logged yet</h2>

            <p>
              Add your first repair and FixIt Log will keep the details in one
              place.
            </p>

            <Link
              href="/repairs/new"
              className="primaryButton maintenanceEmptyButton"
            >
              Add repair →
            </Link>
          </div>
        ) : (
          <section className="maintenancePageList">
            {repairs.map((repair) => (
              <article
                className={`maintenanceItemCard ${
                  repair.completed ? "completed" : ""
                }`}
                key={repair.id}
              >
                <div className="maintenanceItemIcon">🔧</div>

                <div className="maintenanceItemMain">
                  <div className="maintenanceItemTop">
                    <div>
                      <p className="maintenanceCategory">
                        {repair.category}
                      </p>

                      <h2>{repair.title}</h2>
                    </div>

                    <span
                      className={`maintenanceStatus ${
                        repair.completed ? "completed" : "upcoming"
                      }`}
                    >
                      {repair.completed ? "Completed" : "Open"}
                    </span>
                  </div>

                  <div className="maintenanceItemDetails">
                    <span>
                      📅 {formatDate(repair.repair_date)}
                    </span>

                    {repair.cost !== null &&
                      repair.cost !== undefined && (
                        <span>
                          💷 £{Number(repair.cost).toFixed(2)}
                        </span>
                      )}
                  </div>

                  {repair.notes && (
                    <p className="maintenanceNotes">{repair.notes}</p>
                  )}

                <Link
                href={`/repairs/edit/${repair.id}`}
                className="editButton" >
                Edit
                </Link>



                  <button
                    type="button"
                    className="completeButton"
                    onClick={() => toggleCompleted(repair)}
                    disabled={updatingId === repair.id}
                  >
                    {updatingId === repair.id
                      ? "Updating..."
                      : repair.completed
                      ? "Mark as open"
                      : "Mark as completed"}
                  </button>

                                  <button
  type="button"
  className="deleteButton"
  onClick={() => deleteRepair(repair)}
  disabled={updatingId === repair.id}
>
  Remove
</button>
                </div>
              </article>
            ))}
          </section>
        )}

        <nav className="dashboardNav maintenanceBottomNav">
          <Link href="/dashboard">Dashboard</Link>

          <Link href="/maintenance">Maintenance</Link>

          <Link href="/repairs" className="active">
            Repairs
          </Link>

          <Link href="/costs">Costs</Link>
        </nav>
      </div>
    </main>
  );
}