"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
 const [maintenance, setMaintenance] = useState([]);
const [repairs, setRepairs] = useState([]);
const [homeName, setHomeName] = useState("My Home");
const [loading, setLoading] = useState(true);
const [dashboardError, setDashboardError] = useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setDashboardError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Could not get current user:", userError);

        setDashboardError(
          "We couldn't load your account. Please sign in again."
        );

        setLoading(false);
        return;
      }

      if (!user) {
        setDashboardError(
          "You need to be signed in to view your dashboard."
        );

        setLoading(false);
        return;
      }

      console.log("Dashboard user:", user.id);

      // Load the user's saved home name
const {
  data: homeProfile,
  error: homeProfileError,
} = await supabase
  .from("home_profiles")
  .select("home_name")
  .eq("user_id", user.id)
  .maybeSingle();

if (homeProfileError) {
  console.error(
    "Could not load home profile:",
    homeProfileError
  );
}

if (homeProfile?.home_name) {
  setHomeName(homeProfile.home_name);
} else {
  setHomeName("My Home");
}

      // Load maintenance belonging to the current user
      const { data: maintenanceData, error: maintenanceError } =
        await supabase
          .from("maintenance")
          .select("*")
          .eq("user_id", user.id)
          .order("due_date", { ascending: true });

      // Load repairs belonging to the current user
      const { data: repairsData, error: repairsError } =
        await supabase
          .from("repairs")
          .select("*")
          .eq("user_id", user.id)
          .order("repair_date", { ascending: false });

      if (maintenanceError) {
        console.error(
          "Could not load maintenance:",
          maintenanceError
        );
      }

      if (repairsError) {
        console.error(
          "Could not load repairs:",
          repairsError
        );
      }

      if (maintenanceError || repairsError) {
        setDashboardError(
          "Some dashboard information could not be loaded."
        );
      }

      setMaintenance(maintenanceData || []);
      setRepairs(repairsData || []);
    } catch (error) {
      console.error("Could not load dashboard:", error);

      setDashboardError(
        "Something went wrong loading your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    // Refresh dashboard whenever the user returns to this page/tab.
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        loadDashboard();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = maintenance.filter((item) => {
    if (!item.due_date) {
      return false;
    }

    const dueDate = new Date(
      `${item.due_date}T00:00:00`
    );

    return dueDate < today && !item.completed;
  });

  const upcoming = maintenance.filter((item) => {
    if (!item.due_date) {
      return false;
    }

    const dueDate = new Date(
      `${item.due_date}T00:00:00`
    );

    return dueDate >= today && !item.completed;
  });

  const openMaintenance = maintenance.filter(
    (item) => !item.completed
  ).length;

  const openRepairs = repairs.filter(
    (item) => !item.completed
  ).length;

  const maintenanceCost = maintenance.reduce(
    (total, item) =>
      total + Number(item.estimated_cost || 0),
    0
  );

  const repairCost = repairs.reduce(
    (total, item) =>
      total + Number(item.cost || 0),
    0
  );

  const totalCost = maintenanceCost + repairCost;

  function formatDate(dateString) {
    if (!dateString) {
      return "Date not recorded";
    }

    return new Date(
      `${dateString}T00:00:00`
    ).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getDueText(dateString) {
    if (!dateString) {
      return "No due date";
    }

    const dueDate = new Date(
      `${dateString}T00:00:00`
    );

    const difference = Math.round(
      (dueDate - today) /
        (1000 * 60 * 60 * 24)
    );

    if (difference < 0) {
      const days = Math.abs(difference);

      return `Due ${days} ${
        days === 1 ? "day" : "days"
      } ago`;
    }

    if (difference === 0) {
      return "Due today";
    }

    return `Due in ${difference} ${
      difference === 1 ? "day" : "days"
    }`;
  }

  return (
    <main className="dashboardPage">
      <div className="dashboardContainer">

        {/* HEADER */}
        <header className="dashboardHeader">
          <div>
            <div className="logo dashboardLogo">
              <div className="logoMark">F</div>
              <span>FixIt Log</span>
            </div>

            <p className="eyebrow">YOUR HOME</p>

            <h1>{homeName}</h1>

            <p className="dashboardSubtitle">
              Here's what needs your attention.
            </p>
          </div>

         <div className="dashboardHeaderActions">
  <div className="dashboardHomeIcon">
    🏠
  </div>

  <Link
    href="/settings"
    className="settingsButton"
  >
    ⚙ Settings
  </Link>
</div>
        </header>

        {/* LOADING */}
        {loading ? (
          <div className="dashboardLoading">
            Loading your home...
          </div>
        ) : (
          <>
            {/* ERROR */}
            {dashboardError && (
              <div className="dashboardEmptyCard">
                <div className="attentionIcon">
                  ⚠️
                </div>

                <div>
                  <h3>Something needs attention</h3>

                  <p>{dashboardError}</p>
                </div>
              </div>
            )}

            {/* NEEDS ATTENTION */}
            <section className="dashboardSection">
              <div className="sectionHeading">
                <div>
                  <p className="eyebrow">
                    NEEDS ATTENTION
                  </p>

                  <h2>Keep things up to date</h2>
                </div>
              </div>

              {overdue.length === 0 ? (
                <div className="dashboardEmptyCard">
                  <div className="attentionIcon">
                    ✓
                  </div>

                  <div>
                    <h3>Nothing overdue</h3>

                    <p>
                      Your maintenance is up to date.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="attentionGrid">
                  {overdue.slice(0, 2).map((item) => (
                    <div
                      className="attentionCard overdue"
                      key={item.id}
                    >
                      <div className="attentionIcon">
                        ⚠️
                      </div>

                      <div>
                        <span className="statusLabel">
                          OVERDUE
                        </span>

                        <h3>{item.title}</h3>

                        <p>
                          {getDueText(item.due_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* UPCOMING MAINTENANCE */}
            <section className="dashboardSection">
              <div className="sectionHeading">
                <div>
                  <p className="eyebrow">
                    COMING UP
                  </p>

                  <h2>
                    Upcoming maintenance
                  </h2>
                </div>

                <Link
                  href="/maintenance"
                  className="textLink"
                >
                  View all →
                </Link>
              </div>

              {upcoming.length === 0 ? (
                <div className="dashboardEmptyCard">
                  <div className="maintenanceIcon">
                    📅
                  </div>

                  <div>
                    <h3>
                      No upcoming maintenance
                    </h3>

                    <p>
                      Add something you need to
                      remember.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="maintenanceList">
                  {upcoming
                    .slice(0, 3)
                    .map((item) => (
                      <div
                        className="maintenanceRow"
                        key={item.id}
                      >
                        <div className="maintenanceIcon">
                          🔧
                        </div>

                        <div className="maintenanceContent">
                          <strong>
                            {item.title}
                          </strong>

                          <span>
                            {getDueText(
                              item.due_date
                            )}
                          </span>
                        </div>

                        <span className="rowArrow">
                          →
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </section>

            {/* RECENT REPAIRS */}
            <section className="dashboardSection">
              <div className="sectionHeading">
                <div>
                  <p className="eyebrow">
                    RECENT REPAIRS
                  </p>

                  <h2>
                    What you've had fixed
                  </h2>
                </div>

                <Link
                  href="/repairs"
                  className="textLink"
                >
                  View all →
                </Link>
              </div>

              {repairs.length === 0 ? (
                <div className="dashboardEmptyCard">
                  <div className="maintenanceIcon">
                    🔧
                  </div>

                  <div>
                    <h3>
                      No repairs logged yet
                    </h3>

                    <p>
                      Repairs you record will
                      appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="maintenanceList">
                  {repairs
                    .slice(0, 3)
                    .map((repair) => (
                      <div
                        className="maintenanceRow"
                        key={repair.id}
                      >
                        <div className="maintenanceIcon">
                          🔧
                        </div>

                        <div className="maintenanceContent">
                          <strong>
                            {repair.title}
                          </strong>

                          <span>
                            {repair.cost !== null &&
                            repair.cost !== undefined
                              ? `£${Number(
                                  repair.cost
                                ).toFixed(2)} · `
                              : ""}

                            {formatDate(
                              repair.repair_date
                            )}
                          </span>
                        </div>

                        <span className="rowArrow">
                          →
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </section>

            {/* COSTS + OPEN ITEMS */}
            <section className="dashboardBottomGrid">

              <div className="dashboardInfoCard">
                <div className="dashboardInfoIcon">
                  💷
                </div>

                <div>
                  <p className="eyebrow">
                    TOTAL LOGGED
                  </p>

                  <h2>
                    £{totalCost.toFixed(2)}
                  </h2>

                  <p>
                    Maintenance and repair costs
                    you've recorded.
                  </p>

                  <Link
                    href="/costs"
                    className="textLink"
                  >
                    View costs →
                  </Link>
                </div>
              </div>

              <div className="dashboardInfoCard">
                <div className="dashboardInfoIcon">
                  🔧
                </div>

                <div>
                  <p className="eyebrow">
                    OPEN ITEMS
                  </p>

                  <h2>
                    {openMaintenance +
                      openRepairs}
                  </h2>

                  <p>
                    Maintenance and repairs still
                    needing attention.
                  </p>

                  <Link
                    href="/maintenance"
                    className="textLink"
                  >
                    View maintenance →
                  </Link>
                </div>
              </div>

            </section>

            {/* ADD MAINTENANCE */}
            <Link
              href="/maintenance/new"
              className="dashboardAddButton"
            >
              <span>＋</span>
              Add maintenance
            </Link>

            {/* NAVIGATION */}
            <nav className="dashboardNav">
              <Link
                href="/dashboard"
                className="active"
              >
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
          </>
        )}
      </div>
    </main>
  );
}