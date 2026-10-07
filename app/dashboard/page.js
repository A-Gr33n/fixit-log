"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const [maintenance, setMaintenance] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [homeName, setHomeName] = useState("My Home");

  const [remindersEnabled, setRemindersEnabled] =
    useState(true);

  const [reminderDays, setReminderDays] =
    useState(7);

  const [loading, setLoading] = useState(true);

  const [dashboardError, setDashboardError] =
    useState("");

  async function loadDashboard() {
    try {
      setLoading(true);
      setDashboardError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Could not get current user:",
          userError
        );

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

      // =========================================
      // LOAD HOME + REMINDER SETTINGS
      // =========================================

      const {
        data: homeProfile,
        error: homeProfileError,
      } = await supabase
        .from("home_profiles")
        .select(
          `
            home_name,
            reminders_enabled,
            reminder_days
          `
        )
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

      setRemindersEnabled(
        homeProfile?.reminders_enabled ?? true
      );

      setReminderDays(
        Number(
          homeProfile?.reminder_days || 7
        )
      );

      // =========================================
      // LOAD MAINTENANCE
      // =========================================

      const {
        data: maintenanceData,
        error: maintenanceError,
      } = await supabase
        .from("maintenance")
        .select("*")
        .eq("user_id", user.id)
        .order("due_date", {
          ascending: true,
        });

      // =========================================
      // LOAD REPAIRS
      // =========================================

      const {
        data: repairsData,
        error: repairsError,
      } = await supabase
        .from("repairs")
        .select("*")
        .eq("user_id", user.id)
        .order("repair_date", {
          ascending: false,
        });

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

      if (
        maintenanceError ||
        repairsError
      ) {
        setDashboardError(
          "Some dashboard information could not be loaded."
        );
      }

      setMaintenance(
        maintenanceData || []
      );

      setRepairs(
        repairsData || []
      );
    } catch (error) {
      console.error(
        "Could not load dashboard:",
        error
      );

      setDashboardError(
        "Something went wrong loading your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
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

  // =========================================
  // DASHBOARD DATA
  // =========================================

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = maintenance.filter(
    (item) => {
      if (!item.due_date) {
        return false;
      }

      const dueDate = new Date(
        `${item.due_date}T00:00:00`
      );

      return (
        dueDate < today &&
        !item.completed
      );
    }
  );

  const upcoming = maintenance.filter(
    (item) => {
      if (!item.due_date) {
        return false;
      }

      const dueDate = new Date(
        `${item.due_date}T00:00:00`
      );

      return (
        dueDate >= today &&
        !item.completed
      );
    }
  );

  const openMaintenance =
    maintenance.filter(
      (item) => !item.completed
    ).length;

  const openRepairs = repairs.filter(
    (item) => !item.completed
  ).length;

  const maintenanceCost =
    maintenance.reduce(
      (total, item) =>
        total +
        Number(
          item.estimated_cost || 0
        ),
      0
    );

  const repairCost = repairs.reduce(
    (total, item) =>
      total +
      Number(item.cost || 0),
    0
  );

  const totalCost =
    maintenanceCost + repairCost;

  // =========================================
  // DATE HELPERS
  // =========================================

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

  function getDaysDifference(
    dateString
  ) {
    if (!dateString) {
      return null;
    }

    const targetDate = new Date(
      `${dateString}T00:00:00`
    );

    if (
      Number.isNaN(
        targetDate.getTime()
      )
    ) {
      return null;
    }

    targetDate.setHours(
      0,
      0,
      0,
      0
    );

    const millisecondsPerDay =
      1000 * 60 * 60 * 24;

    return Math.round(
      (targetDate - today) /
        millisecondsPerDay
    );
  }

  function getDueText(dateString) {
    const difference =
      getDaysDifference(dateString);

    if (difference === null) {
      return "No due date";
    }

    if (difference < 0) {
      const days =
        Math.abs(difference);

      return `Due ${days} ${
        days === 1
          ? "day"
          : "days"
      } ago`;
    }

    if (difference === 0) {
      return "Due today";
    }

    if (difference === 1) {
      return "Due tomorrow";
    }

    return `Due in ${difference} days`;
  }

  function getOverdueDetail(
    daysOverdue
  ) {
    if (daysOverdue === 1) {
      return "Overdue by 1 day";
    }

    return `Overdue by ${daysOverdue} days`;
  }

  function getUpcomingDetail(
    daysUntilDue
  ) {
    if (daysUntilDue === 0) {
      return "Due today";
    }

    if (daysUntilDue === 1) {
      return "Due tomorrow";
    }

    return `Due in ${daysUntilDue} days`;
  }

  function getRepairAgeDetail(
    daysOpen
  ) {
    if (daysOpen === null) {
      return "Open repair";
    }

    if (daysOpen <= 0) {
      return "Logged today";
    }

    if (daysOpen === 1) {
      return "Open for 1 day";
    }

    return `Open for ${daysOpen} days`;
  }

  // =========================================
  // MAINTENANCE REMINDERS
  // =========================================

  const maintenanceReminders =
    remindersEnabled
      ? maintenance
          .filter((item) => {
            if (
              !item.due_date ||
              item.completed
            ) {
              return false;
            }

            const daysUntilDue =
              getDaysDifference(
                item.due_date
              );

            if (
              daysUntilDue === null
            ) {
              return false;
            }

            /*
              Reminders only include
              today and future dates.

              Overdue jobs already have
              their own Needs Attention
              section.
            */
            return (
              daysUntilDue >= 0 &&
              daysUntilDue <=
                reminderDays
            );
          })
          .sort((a, b) => {
            return (
              new Date(
                `${a.due_date}T00:00:00`
              ) -
              new Date(
                `${b.due_date}T00:00:00`
              )
            );
          })
      : [];

  // =========================================
  // HOME HEALTH
  // =========================================

  const overduePenalty =
    overdue.length * 12;

  const repairPenalty =
    openRepairs * 8;

  const upcomingPenalty =
    upcoming.length * 2;

  const homeHealthScore = Math.max(
    0,
    Math.min(
      100,
      100 -
        overduePenalty -
        repairPenalty -
        upcomingPenalty
    )
  );

  function getHomeHealthStatus(
    score
  ) {
    if (score >= 90) {
      return {
        label: "Excellent",
        message:
          "Your logged home maintenance is in great shape.",
        className: "excellent",
      };
    }

    if (score >= 75) {
      return {
        label: "Good",
        message:
          "Your home is looking good, with a few things to keep an eye on.",
        className: "good",
      };
    }

    if (score >= 50) {
      return {
        label: "Needs attention",
        message:
          "A few logged jobs need your attention.",
        className: "attention",
      };
    }

    return {
      label: "Action needed",
      message:
        "Several logged jobs need your attention.",
      className: "action",
    };
  }

  const homeHealth =
    getHomeHealthStatus(
      homeHealthScore
    );

  const attentionCount =
    overdue.length + openRepairs;

  // =========================================
  // WHAT TO DO NEXT
  // SMART PRIORITISATION
  // =========================================

  const overdueActions =
    overdue.map((item) => {
      const daysDifference =
        getDaysDifference(
          item.due_date
        );

      const daysOverdue =
        daysDifference !== null
          ? Math.max(
              1,
              -daysDifference
            )
          : 1;

      const urgency =
        100 +
        Math.min(
          daysOverdue,
          60
        );

      return {
        id: `maintenance-overdue-${item.id}`,
        type: "maintenance",
        status: "Overdue",
        title: item.title,
        detail:
          getOverdueDetail(
            daysOverdue
          ),
        href: `/maintenance/edit/${item.id}`,
        urgency,
        sortDate:
          item.due_date || "",
      };
    });

  const openRepairActions =
    repairs
      .filter(
        (repair) =>
          !repair.completed
      )
      .map((repair) => {
        const repairDate =
          repair.repair_date ||
          null;

        const daysDifference =
          repairDate
            ? getDaysDifference(
                repairDate
              )
            : null;

        const daysOpen =
          daysDifference !== null
            ? Math.max(
                0,
                -daysDifference
              )
            : null;

        const agePenalty =
          daysOpen !== null
            ? Math.min(
                daysOpen,
                50
              )
            : 0;

        const urgency =
          75 + agePenalty;

        return {
          id: `repair-open-${repair.id}`,
          type: "repair",
          status: "Open repair",
          title: repair.title,
          detail:
            getRepairAgeDetail(
              daysOpen
            ),
          href: `/repairs/${repair.id}/edit`,
          urgency,
          sortDate:
            repairDate || "",
        };
      });

  const upcomingActions =
    upcoming.map((item) => {
      const daysDifference =
        getDaysDifference(
          item.due_date
        );

      const daysUntilDue =
        daysDifference !== null
          ? Math.max(
              0,
              daysDifference
            )
          : 30;

      const urgency =
        70 -
        Math.min(
          daysUntilDue,
          60
        );

      return {
        id: `maintenance-upcoming-${item.id}`,
        type: "maintenance",
        status: "Coming up",
        title: item.title,
        detail:
          getUpcomingDetail(
            daysUntilDue
          ),
        href: `/maintenance/edit/${item.id}`,
        urgency,
        sortDate:
          item.due_date || "",
      };
    });

  const nextActions = [
    ...overdueActions,
    ...openRepairActions,
    ...upcomingActions,
  ]
    .sort((a, b) => {
      if (
        b.urgency !== a.urgency
      ) {
        return (
          b.urgency - a.urgency
        );
      }

      if (
        a.sortDate &&
        b.sortDate
      ) {
        return (
          new Date(a.sortDate) -
          new Date(b.sortDate)
        );
      }

      return 0;
    })
    .slice(0, 3);

  // =========================================
  // PAGE
  // =========================================

  return (
    <main className="dashboardPage">
      <div className="dashboardContainer">

        {/* HEADER */}

        <header className="dashboardHeader">
          <div>
            <div className="logo dashboardLogo">
              <div className="logoMark">
                F
              </div>

              <span>
                FixIt Log
              </span>
            </div>

            <p className="eyebrow">
              YOUR HOME
            </p>

            <h1>{homeName}</h1>

            <p className="dashboardSubtitle">
              Here's what needs your
              attention.
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
                  <h3>
                    Something needs
                    attention
                  </h3>

                  <p>
                    {dashboardError}
                  </p>
                </div>
              </div>
            )}

            {/* HOME HEALTH */}

            <section
              className={`homeHealthCard ${homeHealth.className}`}
            >
              <div className="homeHealthScore">
                <span className="homeHealthNumber">
                  {homeHealthScore}
                </span>

                <span className="homeHealthOutOf">
                  / 100
                </span>
              </div>

              <div className="homeHealthContent">
                <p className="eyebrow">
                  HOME HEALTH
                </p>

                <h2>
                  {homeHealth.label}
                </h2>

                <p className="homeHealthMessage">
                  {homeHealth.message}
                </p>

                <div className="homeHealthStats">
                  <span>
                    <strong>
                      {overdue.length}
                    </strong>{" "}
                    overdue
                  </span>

                  <span>
                    <strong>
                      {openRepairs}
                    </strong>{" "}
                    open repairs
                  </span>

                  <span>
                    <strong>
                      {upcoming.length}
                    </strong>{" "}
                    coming up
                  </span>
                </div>

                {attentionCount > 0 ? (
                  <p className="homeHealthAttention">
                    {attentionCount}{" "}
                    {attentionCount === 1
                      ? "item needs"
                      : "items need"}{" "}
                    your attention.
                  </p>
                ) : (
                  <p className="homeHealthAttention">
                    ✓ Nothing currently
                    needs urgent attention.
                  </p>
                )}
              </div>
            </section>

            {/* MAINTENANCE REMINDERS */}

            {remindersEnabled && (
              <section className="reminderSection">
                <div className="sectionHeading">
                  <div>
                    <p className="eyebrow">
                      MAINTENANCE REMINDERS
                    </p>

                    <h2>
                      {maintenanceReminders.length >
                      0
                        ? `${
                            maintenanceReminders.length
                          } ${
                            maintenanceReminders.length ===
                            1
                              ? "job is"
                              : "jobs are"
                          } getting close`
                        : "Nothing due soon"}
                    </h2>

                    <p className="reminderDescription">
                      Showing maintenance
                      due within your{" "}
                      {reminderDays}-day
                      reminder window.
                    </p>
                  </div>

                  <Link
                    href="/settings"
                    className="textLink"
                  >
                    Settings →
                  </Link>
                </div>

                {maintenanceReminders.length ===
                0 ? (
                  <div className="reminderEmpty">
                    <div className="reminderIcon">
                      🔔
                    </div>

                    <div>
                      <strong>
                        You're clear for now
                      </strong>

                      <p>
                        No maintenance is due
                        within the next{" "}
                        {reminderDays}{" "}
                        {reminderDays === 1
                          ? "day"
                          : "days"}.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="reminderList">
                    {maintenanceReminders.map(
                      (item) => (
                        <Link
                          href={`/maintenance/edit/${item.id}`}
                          className="reminderCard"
                          key={item.id}
                        >
                          <div className="reminderIcon">
                            🔔
                          </div>

                          <div className="reminderContent">
                            <span className="reminderBadge">
                              DUE SOON
                            </span>

                            <strong>
                              {item.title}
                            </strong>

                            <span>
                              {getDueText(
                                item.due_date
                              )}
                            </span>
                          </div>

                          <span className="reminderArrow">
                            →
                          </span>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </section>
            )}

            {/* WHAT TO DO NEXT */}

            <section className="nextActionsSection">
              <div className="sectionHeading">
                <div>
                  <p className="eyebrow">
                    WHAT TO DO NEXT
                  </p>

                  <h2>
                    Your next priorities
                  </h2>

                  <p className="nextActionsDescription">
                    Based on the
                    maintenance and
                    repairs you've logged.
                  </p>
                </div>
              </div>

              {nextActions.length === 0 ? (
                <div className="nextActionsEmpty">
                  <div className="nextActionsEmptyIcon">
                    ✓
                  </div>

                  <div>
                    <h3>
                      You're all caught up
                    </h3>

                    <p>
                      Nothing you've logged
                      currently needs your
                      attention.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="nextActionsList">
                  {nextActions.map(
                    (action, index) => (
                      <Link
                        href={action.href}
                        className="nextActionCard"
                        key={action.id}
                      >
                        <div className="nextActionNumber">
                          {index + 1}
                        </div>

                        <div className="nextActionContent">
                          <div className="nextActionTop">
                            <span
                              className={`nextActionStatus ${
                                action.status ===
                                "Overdue"
                                  ? "overdue"
                                  : action.type ===
                                    "repair"
                                  ? "repair"
                                  : "upcoming"
                              }`}
                            >
                              {action.status}
                            </span>
                          </div>

                          <h3>
                            {action.title}
                          </h3>

                          <p>
                            {action.detail}
                          </p>
                        </div>

                        <span className="nextActionArrow">
                          →
                        </span>
                      </Link>
                    )
                  )}
                </div>
              )}
            </section>

            {/* NEEDS ATTENTION */}

            <section className="dashboardSection">
              <div className="sectionHeading">
                <div>
                  <p className="eyebrow">
                    NEEDS ATTENTION
                  </p>

                  <h2>
                    Keep things up to date
                  </h2>
                </div>
              </div>

              {overdue.length === 0 ? (
                <div className="dashboardEmptyCard">
                  <div className="attentionIcon">
                    ✓
                  </div>

                  <div>
                    <h3>
                      Nothing overdue
                    </h3>

                    <p>
                      Your maintenance is
                      up to date.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="attentionGrid">
                  {overdue
                    .slice(0, 2)
                    .map((item) => (
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

                          <h3>
                            {item.title}
                          </h3>

                          <p>
                            {getDueText(
                              item.due_date
                            )}
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
                      No upcoming
                      maintenance
                    </h3>

                    <p>
                      Add something you
                      need to remember.
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
                            {repair.cost !==
                              null &&
                            repair.cost !==
                              undefined
                              ? `£${Number(
                                  repair.cost
                                ).toFixed(
                                  2
                                )} · `
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
                    Maintenance and repair
                    costs you've recorded.
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
                    Maintenance and repairs
                    still needing attention.
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

            {/* HOME HISTORY */}

<Link
  href="/history"
  className="dashboardHistoryCard"
>
  <div className="dashboardHistoryIcon">
    🏠
  </div>

  <div className="dashboardHistoryContent">
    <p className="eyebrow">
      HOME HISTORY
    </p>

    <h2>
      Your home's record
    </h2>

    <p>
      See completed maintenance,
      repairs and the costs you've
      recorded over time.
    </p>
  </div>

  <span className="dashboardHistoryArrow">
    →
  </span>
</Link>

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