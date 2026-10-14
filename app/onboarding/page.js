
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function OnboardingPage() {
  const router = useRouter();

  const [propertyName, setPropertyName] = useState("My Home");
  const [propertyType, setPropertyType] = useState("House");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanPropertyName = propertyName.trim();

    if (!cleanPropertyName || saving) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError(
          "Your session has expired. Please sign in again."
        );
        return;
      }

      const { error: saveError } = await supabase
        .from("home_profiles")
        .upsert(
          {
            user_id: user.id,
            home_name: cleanPropertyName,
            property_type: propertyType,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id",
          }
        );

      if (saveError) {
        throw saveError;
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Could not save home details:", err);

      setError(
        "We couldn't save your home details. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="onboardingPage">
      <div className="onboardingCard">
        <div className="logo">
          <div className="logoMark">F</div>
          <span>FixIt Log</span>
        </div>

        <div className="onboardingHeader">
          <p className="eyebrow">LET'S SET THINGS UP</p>

          <h1>Tell us about your home.</h1>

          <p>
            Just two quick details and you'll be ready
            to start keeping track of your home's maintenance.
          </p>
        </div>

        <form
          className="onboardingForm"
          onSubmit={handleSubmit}
        >
          <label className="field">
            <span>Property name</span>

            <input
              type="text"
              value={propertyName}
              onChange={(event) => {
                setPropertyName(event.target.value);
                setError("");
              }}
              placeholder="e.g. My Home"
              autoFocus
              required
              disabled={saving}
            />
          </label>

          <div className="field">
            <span>Property type</span>

            <div className="propertyOptions">
              {["House", "Flat / Apartment", "Other"].map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    className={`propertyOption ${
                      propertyType === option
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {
                      setPropertyType(option);
                      setError("");
                    }}
                    disabled={saving}
                  >
                    {option}
                  </button>
                )
              )}
            </div>
          </div>

          {error && (
            <p
              className="formError"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primaryButton"
            disabled={!propertyName.trim() || saving}
          >
            {saving
              ? "Saving your home..."
              : "Set up my home →"}
          </button>
        </form>

        <p className="onboardingFooter">
          You can change these details later in Settings.
        </p>
      </div>
    </main>
  );
}
