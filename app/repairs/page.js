"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewRepairPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [repairDate, setRepairDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Get the currently signed-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Could not get current user:", userError);
        setError("We couldn't verify your account. Please sign in again.");
        setLoading(false);
        return;
      }

      if (!user) {
        setError("You need to be signed in to add a repair.");
        setLoading(false);
        return;
      }

      // Save the repair
      const { error: insertError } = await supabase
        .from("repairs")
        .insert({
          user_id: user.id,
          title: title.trim(),
          category: category.trim(),
          repair_date: repairDate,
          cost: cost === "" ? null : Number(cost),
          notes: notes.trim() || null,
          completed,
        });

      if (insertError) {
        console.error("Could not save repair:", insertError);
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // Repair saved successfully.
      // Take the user straight back to the dashboard.
      router.push("/dashboard");
    } catch (error) {
      console.error("Could not save repair:", error);

      setError(
        "Something went wrong while saving the repair. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <main className="maintenancePage">
      <div className="maintenanceContainer">
        <header className="maintenancePageHeader">
          <div>
            <Link href="/repairs" className="backLink">
              ← Repairs
            </Link>

            <p className="eyebrow">YOUR HOME</p>

            <h1>Add repair</h1>

            <p className="maintenanceSubtitle">
              Record a repair and keep the details in one place.
            </p>
          </div>
        </header>

        <form
          className="onboardingForm"
          onSubmit={handleSubmit}
        >
          <label className="field">
            <span>Repair title</span>

            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Boiler repair"
              required
            />
          </label>

          <label className="field">
            <span>Category</span>

            <input
              type="text"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              placeholder="e.g. Heating"
              required
            />
          </label>

          <label className="field">
            <span>Repair date</span>

            <input
              type="date"
              value={repairDate}
              onChange={(event) =>
                setRepairDate(event.target.value)
              }
              required
            />
          </label>

          <label className="field">
            <span>Cost (£)</span>

            <input
              type="number"
              value={cost}
              onChange={(event) =>
                setCost(event.target.value)
              }
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </label>

          <label className="field">
            <span>Notes</span>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Add any useful details about the repair..."
              rows={5}
            />
          </label>

          <label className="field">
            <span>Repair status</span>

            <div className="checkboxRow">
              <input
                type="checkbox"
                checked={completed}
                onChange={(event) =>
                  setCompleted(event.target.checked)
                }
              />

              <span>Mark this repair as completed</span>
            </div>
          </label>

          {error && (
            <p className="formError">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primaryButton"
            disabled={loading}
          >
            {loading
              ? "Saving repair..."
              : "Save repair →"}
          </button>
        </form>

        <p className="onboardingFooter">
          <Link href="/repairs" className="textLink">
            ← Back to repairs
          </Link>
        </p>
      </div>
    </main>
  );
}