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

  const maintenanceTotal = maintenance.reduce(
    (total, item) => total + Number(item.estimated_cost || 0),
    0
  );

  const repairsTotal = repairs.reduce(
    (total, item) => total + Number(item.cost || 0),
    0
  );

  const total = maintenanceTotal + repairsTotal;

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
            Loading your costs...
          </div>
        ) : (
          <>
            <section className="costSummaryGrid">
              <div className="costSummaryCard total">
                <p className="eyebrow">TOTAL LOGGED</p>

                <h2>£{total.toFixed(2)}</h2>

                <p>Maintenance and repairs combined.</p>
              </div>

              <div className="costSummaryCard">
                <div className="costSummaryIcon">🔧</div>

                <p className="eyebrow">MAINTENANCE</p>

                <h2>£{maintenanceTotal.toFixed(2)}</h2>

                <p>
                  {maintenanceItems.length}{" "}
                  {maintenanceItems.length === 1
                    ? "item"
                    : "items"}{" "}
                  with a cost recorded.
                </p>
              </div>

              <div className="costSummaryCard">
                <div className="costSummaryIcon">🛠️</div>

                <p className="eyebrow">REPAIRS</p>

                <h2>£{repairsTotal.toFixed(2)}</h2>

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
                </div>
              </div>

              {allCosts.length === 0 ? (
                <div className="costsEmptyState">
                  <div className="costsEmptyIcon">💷</div>

                  <h3>No costs logged yet</h3>

                  <p>
                    Add a cost to a maintenance item or repair and
                    it will appear here.
                  </p>
                </div>
              ) : (
                <div className="costList">
                  {allCosts.map((item) => (
                    <article className="costRow" key={item.id}>
                      <div className="costRowIcon">
                        {item.type === "Repair" ? "🛠️" : "🔧"}
                      </div>

                      <div className="costRowContent">
                        <span className="costRowType">
                          {item.type}
                        </span>

                        <h3>{item.title}</h3>

                        <p>
                          {item.category} · {formatDate(item.date)}
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

            <nav className="dashboardNav costsBottomNav">
              <Link href="/dashboard">Dashboard</Link>

              <Link href="/maintenance">
                Maintenance
              </Link>

              <Link href="/repairs">
                Repairs
              </Link>

              <Link href="/costs" className="active">
                Costs
              </Link>
            </nav>
          </>
        )}
      </div>
    </main>
  );
}