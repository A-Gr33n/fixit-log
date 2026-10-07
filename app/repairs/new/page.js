"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const repairCategories = [
  "Heating",
  "Plumbing",
  "Electrical",
  "Appliance",
  "Roofing",
  "Other",
];

export default function NewRepairPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [repairDate, setRepairDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a repair title.");
      return;
    }

    if (!category) {
      setError("Please choose a repair category.");
      return;
    }

    if (!repairDate) {
      setError("Please enter the repair date.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(
          "You need to be signed in to add a repair."
        );
        setSaving(false);
        return;
      }

      const { error: insertError } =
        await supabase
          .from("repairs")
          .insert({
            user_id: user.id,
            title: title.trim(),
            category: category,
            repair_date: repairDate,
            cost:
              cost === ""
                ? null
                : Number(cost),
            notes:
              notes.trim() || null,
            completed: false,
          });

      if (insertError) {
        console.error(
          "Could not save repair:",
          insertError
        );

        setError(
          "Could not save the repair. Please try again."
        );

        setSaving(false);
        return;
      }

      router.push("/repairs");
    } catch (error) {
      console.error(
        "Could not save repair:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );

      setSaving(false);
    }
  }

  return (
    <main className="formPage">
      <div className="formContainer">
        <Link
          href="/repairs"
          className="backLink"
        >
          ← Repairs
        </Link>

        <header className="formHeader">
          <p className="eyebrow">
            YOUR HOME
          </p>

          <h1>Add repair</h1>

          <p>
            Record a repair and keep
            the details in one place.
          </p>
        </header>

        <form
          className="maintenanceForm"
          onSubmit={handleSubmit}
        >
          {/* Repair title */}
          <div className="field">
            <label htmlFor="title">
              Repair title
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="e.g. Boiler repair"
              required
            />
          </div>

          {/* Category */}
          <div className="field">
            <label>
              Category
            </label>

            <div className="categoryGrid">
              {repairCategories.map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    className={`categoryOption ${
                      category ===
                      option
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setCategory(
                        option
                      )
                    }
                  >
                    {option}
                  </button>
                )
              )}
            </div>

            {!category && (
              <p
                style={{
                  margin:
                    "8px 0 0",
                  fontSize:
                    "12px",
                  opacity: 0.7,
                }}
              >
                Choose one category.
              </p>
            )}
          </div>

          {/* Repair date */}
          <div className="field">
            <label htmlFor="repairDate">
              Repair date
            </label>

            <input
              id="repairDate"
              type="date"
              value={repairDate}
              onChange={(event) =>
                setRepairDate(
                  event.target.value
                )
              }
              required
            />
          </div>

          {/* Cost */}
          <div className="field">
            <label htmlFor="cost">
              Cost (£)
            </label>

            <div className="costInput">
              <span>£</span>

              <input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(event) =>
                  setCost(
                    event.target.value
                  )
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="field">
            <label htmlFor="notes">
              Notes
            </label>

            <textarea
              id="notes"
              rows="5"
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder="Add any useful details about the repair..."
            />
          </div>

          {/* Error */}
          {error && (
            <p className="formError">
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="formActions">
            <button
              type="submit"
              className="primaryButton"
              disabled={saving}
            >
              {saving
                ? "Saving repair..."
                : "Save repair"}
            </button>

            <Link
              href="/repairs"
              className="secondaryButton"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}