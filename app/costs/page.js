"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function CostsPage() {
  const [maintenance, setMaintenance] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCosts() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        const [maintenanceResult, repairsResult] = await Promise.all([
          supabase
            .from("maintenance")
            .select("*")
            .eq("user_id", user.id)
            .order("due_date", { ascending: false }),

          supabase
            .from("repairs")
            .select("*")
            .eq("user_id", user.id)
            .order("repair_date", { ascending: false }),
        ]);

        if (maintenanceResult.error) {
          console.error(
            "Could not load maintenance costs:",
            maintenanceResult.error
          );
        }

        if (repairsResult.error) {
          console.error(
            "Could not load repair costs:",
            repairsResult.error
          );
        }

        setMaintenance(maintenanceResult.data || []);
        setRepairs(repairsResult.data || []);
      } catch (error) {
        console.error("Could not load costs:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCosts();
  }, []);

  const maintenanceItems = maintenance.filter(
    (item) =>
      item.estimated_cost !== null &&
      item.estimated_cost !== undefined
  );

  const repairItems = repairs.filter(
    (item) =>
      item.cost !== null &&
      item.cost !== undefined
  );

  const maintenanceTotal = maintenanceItems.reduce(
    (total, item) => total + Number(item.estimated_cost || 0),
    0
  );

  const repairsTotal = repairItems.reduce(
    (total, item) => total + Number(item.cost || 0),
    0
  );

  const total = maintenanceTotal + repairsTotal;

  const allCosts = [
    ...maintenanceItems.map((item) => ({
      id: `maintenance-${item.id}`,
      type: "Maintenance",
      title: item.title,
      category: item.category,
      date: item.due_date,
      amount: Number(item.estimated_cost || 0),
    })),

    ...repairItems.map((item) => ({
      id: `repair-${item.id}`,
      type: "Repair",
      title: item.title,
      category: item.category,
      date: item.repair_date,
      amount: Number(item.cost || 0),
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

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

  return (
    <main className="costsPage">
      <div className="costsContainer">
        <header className="costsHeader">
          <div>
            <Link href="/dashboard" className="backLink">
              ← Dashboard
            </Link>

            <p className="eyebrow">YOUR HOME</p>

            <h1>Costs</h1>

            <p className="costsSubtitle">
              Keep track of what you've spent maintaining and repairing
              your home.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="costsEmptyState">
            <div className="costsEmptyIcon">💷</div>

            <h3>Loading your costs...</h3>

            <p>
              We're getting your maintenance and repair costs ready.
            </p>
          </div>
        ) : (
          <>
            <section className="costSummaryGrid">
              <div className="costSummaryCard costSummaryMain">
                <div className="costSummaryTop">
                  <div>
                    <p className="eyebrow">TOTAL SPENDING</p>

                    <h2>£{total.toFixed(2)}</h2>
                  </div>

                  <div className="costSummaryIcon totalIcon">
                    £
                  </div>
                </div>

                <p>
                  Your total logged maintenance and repair costs.
                </p>
              </div>

              <div className="costSummaryCard">
                <div className="costSummaryTop">
                  <div>
                    <p className="eyebrow">MAINTENANCE</p>

                    <h2>£{maintenanceTotal.toFixed(2)}</h2>
                  </div>

                  <div className="costSummaryIcon">
                    🔧
                  </div>
                </div>

                <p>
                  {maintenanceItems.length}{" "}
                  {maintenanceItems.length === 1
                    ? "item"
                    : "items"}{" "}
                  with a cost recorded.
                </p>
              </div>

              <div className="costSummaryCard">
                <div className="costSummaryTop">
                  <div>
                    <p className="eyebrow">REPAIRS</p>

                    <h2>£{repairsTotal.toFixed(2)}</h2>
                  </div>

                  <div className="costSummaryIcon">
                    🛠️
                  </div>
                </div>

                <p>
                  {repairItems.length}{" "}
                  {repairItems.length === 1
                    ? "repair"
                    : "repairs"}{" "}
                  with a cost recorded.
                </p>
              </div>
            </section>

            <section className="costsSection">
              <div className="sectionHeading">
                <div>
                  <p className="eyebrow">COST HISTORY</p>

                  <h2>Where your money has gone</h2>

                  <p className="sectionDescription">
                    A record of the maintenance and repairs you've
                    logged.
                  </p>
                </div>

                {allCosts.length > 0 && (
                  <span className="costHistoryCount">
                    {allCosts.length}{" "}
                    {allCosts.length === 1
                      ? "entry"
                      : "entries"}
                  </span>
                )}
              </div>

              {allCosts.length === 0 ? (
                <div className="costsEmptyState">
                  <div className="costsEmptyIcon">💷</div>

                  <h3>No costs logged yet</h3>

                  <p>
                    Add a cost to a maintenance item or repair and
                    it will appear here.
                  </p>

                  <div className="emptyStateActions">
                    <Link
                      href="/maintenance/new"
                      className="primaryButton"
                    >
                      ＋ Add maintenance
                    </Link>

                    <Link
                      href="/repairs/new"
                      className="secondaryButton"
                    >
                      ＋ Add repair
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="costList">
                  {allCosts.map((item) => (
                    <article
                      className="costRow"
                      key={item.id}
                    >
                      <div
                        className={`costRowIcon ${
                          item.type === "Repair"
                            ? "repairCostIcon"
                            : "maintenanceCostIcon"
                        }`}
                      >
                        {item.type === "Repair"
                          ? "🛠️"
                          : "🔧"}
                      </div>

                      <div className="costRowContent">
                        <div className="costRowTop">
                          <span className="costRowType">
                            {item.type}
                          </span>
                        </div>

                        <h3>{item.title}</h3>

                        <p>
                          {item.category || "General"} ·{" "}
                          {formatDate(item.date)}
                        </p>
                      </div>

                      <strong className="costAmount">
                        £{item.amount.toFixed(2)}
                      </strong>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {allCosts.length > 0 && (
              <div className="costsActions">
                <Link
                  href="/maintenance/new"
                  className="secondaryAction"
                >
                  ＋ Add maintenance
                </Link>

                <Link
                  href="/repairs/new"
                  className="secondaryAction"
                >
                  ＋ Add repair
                </Link>
              </div>
            )}

            <nav className="dashboardNav costsBottomNav">
              <Link href="/dashboard">
                Dashboard
              </Link>

              <Link href="/maintenance">
                Maintenance
              </Link>

              <Link href="/repairs">
                Repairs
              </Link>

              <Link
                href="/costs"
                className="active"
              >
                Costs
              </Link>
            </nav>
          </>
        )}
      </div>
    </main>
  );
}