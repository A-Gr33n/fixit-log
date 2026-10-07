"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const propertyTypes = [
  "Detached",
  "Semi-detached",
  "Terraced",
  "Flat / Apartment",
  "Bungalow",
  "Cottage",
  "Other",
];

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  const [homeName, setHomeName] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [moveInDate, setMoveInDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

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
            "We couldn't load your account."
          );

          return;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("home_profiles")
          .select(
            "home_name, property_type, move_in_date"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Could not load home details:",
            profileError
          );

          setError(
            "We couldn't load your home details."
          );

          return;
        }

        if (profile) {
          setHomeName(
            profile.home_name || ""
          );

          setPropertyType(
            profile.property_type || ""
          );

          setMoveInDate(
            profile.move_in_date || ""
          );
        }
      } catch (error) {
        console.error(
          "Could not load settings:",
          error
        );

        setError(
          "Something went wrong loading your settings."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router]);

  async function handleSaveHome(event) {
    event.preventDefault();

    if (!user) {
      setError(
        "You need to be signed in to save your home details."
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: saveError } =
        await supabase
          .from("home_profiles")
          .upsert(
            {
              user_id: user.id,
              home_name:
                homeName.trim() || null,
              property_type:
                propertyType || null,
              move_in_date:
                moveInDate || null,
              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            }
          );

      if (saveError) {
        console.error(
          "Could not save home details:",
          saveError
        );

        setError(
          "We couldn't save your home details. Please try again."
        );

        return;
      }

      setSuccess(
        "Home details saved."
      );
    } catch (error) {
      console.error(
        "Could not save home details:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    setError("");
    setSuccess("");

    try {
      const {
        error: signOutError,
      } = await supabase.auth.signOut();

      if (signOutError) {
        console.error(
          "Could not sign out:",
          signOutError
        );

        setError(
          "We couldn't sign you out. Please try again."
        );

        setSigningOut(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      console.error(
        "Could not sign out:",
        error
      );

      setError(
        "Something went wrong while signing out."
      );

      setSigningOut(false);
    }
  }

  return (
    <main className="settingsPage">
      <div className="settingsContainer">

        <Link
          href="/dashboard"
          className="settingsBackLink"
        >
          ← Dashboard
        </Link>

        <header className="settingsHeader">
          <p className="eyebrow">
            FIXIT LOG
          </p>

          <h1>Settings</h1>

          <p>
            Manage your home and account.
          </p>
        </header>

        {loading ? (
          <div className="settingsCard">
            <p className="settingsLoading">
              Loading your settings...
            </p>
          </div>
        ) : (
          <div className="settingsSections">

            {/* ACCOUNT */}

            <section className="settingsCard">
              <div className="settingsCardHeader">
                <div className="settingsIcon">
                  👤
                </div>

                <div>
                  <p className="settingsLabel">
                    ACCOUNT
                  </p>

                  <h2>
                    Your account
                  </h2>
                </div>
              </div>

              <div className="settingsAccountRow">
                <div>
                  <span className="settingsFieldLabel">
                    Email address
                  </span>

                  <p className="settingsEmail">
                    {user?.email ||
                      "Email unavailable"}
                  </p>
                </div>
              </div>
            </section>


            {/* HOME DETAILS */}

            <section className="settingsCard">
              <div className="settingsCardHeader">
                <div className="settingsIcon">
                  🏠
                </div>

                <div>
                  <p className="settingsLabel">
                    YOUR HOME
                  </p>

                  <h2>
                    Home details
                  </h2>
                </div>
              </div>

              <p className="settingsDescription">
                Add a few details to make
                FixIt Log feel more specific
                to your home.
              </p>

              <form
                className="settingsHomeForm"
                onSubmit={handleSaveHome}
              >
                <label className="settingsField">
                  <span>
                    Home name
                  </span>

                  <input
                    type="text"
                    value={homeName}
                    onChange={(event) => {
                      setHomeName(
                        event.target.value
                      );

                      setSuccess("");
                    }}
                    placeholder="e.g. Our Home"
                    maxLength={60}
                  />

                  <small>
                    A friendly name for your
                    home.
                  </small>
                </label>


                <label className="settingsField">
                  <span>
                    Property type
                  </span>

                  <select
                    value={propertyType}
                    onChange={(event) => {
                      setPropertyType(
                        event.target.value
                      );

                      setSuccess("");
                    }}
                  >
                    <option value="">
                      Select property type
                    </option>

                    {propertyTypes.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}
                  </select>
                </label>


                <label className="settingsField">
                  <span>
                    Move-in date
                  </span>

                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(event) => {
                      setMoveInDate(
                        event.target.value
                      );

                      setSuccess("");
                    }}
                  />

                  <small>
                    Optional — useful for
                    building a history of
                    your home.
                  </small>
                </label>


                <button
                  type="submit"
                  className="settingsSaveButton"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save home details"}
                </button>
              </form>
            </section>


            {/* REMINDERS */}

            <section className="settingsCard">
              <div className="settingsCardHeader">
                <div className="settingsIcon">
                  🔔
                </div>

                <div>
                  <p className="settingsLabel">
                    PREFERENCES
                  </p>

                  <h2>
                    Reminders
                  </h2>
                </div>
              </div>

              <p className="settingsDescription">
                Maintenance reminders will
                be added here in a future
                update.
              </p>

              <div className="settingsComingSoon">
                <div>
                  <strong>
                    Maintenance reminders
                  </strong>

                  <span>
                    Get reminded when
                    maintenance is coming up.
                  </span>
                </div>

                <span className="settingsSoonBadge">
                  Coming soon
                </span>
              </div>
            </section>


            {/* ABOUT */}

            <section className="settingsCard">
              <div className="settingsCardHeader">
                <div className="settingsIcon">
                  🛠️
                </div>

                <div>
                  <p className="settingsLabel">
                    ABOUT
                  </p>

                  <h2>
                    FixIt Log
                  </h2>
                </div>
              </div>

              <p className="settingsDescription">
                A simple place to keep track
                of your home's maintenance,
                repairs and costs.
              </p>
            </section>


            {/* SIGN OUT */}

            <section
              className="
                settingsCard
                settingsSignOutCard
              "
            >
              <div>
                <p className="settingsLabel">
                  SESSION
                </p>

                <h2>
                  Sign out
                </h2>

                <p className="settingsDescription">
                  Sign out of FixIt Log on
                  this device.
                </p>
              </div>

              <button
                type="button"
                className="settingsSignOutButton"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut
                  ? "Signing out..."
                  : "Sign out"}
              </button>
            </section>


            {/* SUCCESS / ERROR */}

            {success && (
              <p className="settingsSuccess">
                ✓ {success}
              </p>
            )}

            {error && (
              <p className="settingsError">
                {error}
              </p>
            )}

          </div>
        )}


        {/* BOTTOM NAVIGATION */}

        <nav
          className="
            dashboardNav
            settingsBottomNav
          "
        >
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