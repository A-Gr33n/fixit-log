"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function EditRepairPage() {
  const params = useParams();
  const router = useRouter();

  const repairId = params.id;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [repairDate, setRepairDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRepair() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("You need to be signed in to edit a repair.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("repairs")
          .select("*")
          .eq("id", repairId)
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Could not load repair:", error);
          setError("Could not find this repair.");
          setLoading(false);
          return;
        }

        setTitle(data.title || "");
        setCategory(data.category || "");
        setRepairDate(data.repair_date || "");
        setCost(
          data.cost !== null && data.cost !== undefined
            ? String(data.cost)
            : ""
        );
        setNotes(data.notes || "");
        setCompleted(Boolean(data.completed));
      } catch (error) {
        console.error("Could not load repair:", error);
        setError("Something went wrong while loading the repair.");
      } finally {
        setLoading(false);
      }
    }

    if (repairId) {
      loadRepair();
    }
  }, [repairId]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Please enter a repair title.");
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
        setError("You need to be signed in to save this repair.");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("repairs")
        .update({
          title: title.trim(),
          category: category.trim() || null,
          repair_date: repairDate,
          cost: cost === "" ? null : Number(cost),
          notes: notes.trim() || null,
          completed,
        })
        .eq("id", repairId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Could not update repair:", updateError);
        setError("Could not save the repair. Please try again.");
        setSaving(false);
        return;
      }

      router.push("/repairs");
    } catch (error) {
      console.error("Could not update repair:", error);
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="formPage">
        <div className="formContainer">
          <Link href="/repairs" className="backLink">
            ← Repairs
          </Link>

          <div className="formHeader">
            <p className="eyebrow">YOUR HOME</p>

            <h1>Edit repair</h1>

            <p>
              Update the details of your repair.
            </p>
          </div>

          <div className="maintenanceForm">
            <p>Loading repair...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="formPage">
      <div className="formContainer">

        <Link href="/repairs" className="backLink">
          ← Repairs
        </Link>

        <header className="formHeader">
          <p className="eyebrow">YOUR HOME</p>

          <h1>Edit repair</h1>

          <p>
            Update the details of your repair.
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
                setTitle(event.target.value)
              }
              placeholder="e.g. Boiler repair"
              required
            />
          </div>

          {/* Category */}
          <div className="field">
            <label htmlFor="category">
              Category
            </label>

            <div className="categoryGrid">
              {[
                "Heating",
                "Plumbing",
                "Electrical",
                "Appliance",
                "Roofing",
                "Other",
              ].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`categoryOption ${
                    category === option ? "selected" : ""
                  }`}
                  onClick={() =>
                    setCategory(
                      category === option ? "" : option
                    )
                  }
                >
                  {option}
                </button>
              ))}
            </div>
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
                setRepairDate(event.target.value)
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
                  setCost(event.target.value)
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
                setNotes(event.target.value)
              }
              placeholder="Add any useful details about the repair..."
            />
          </div>

          {/* Completion status */}
          <div className="field">
            <label>
              Repair status
            </label>

            <button
              type="button"
              className={`categoryOption ${
                completed ? "selected" : ""
              }`}
              onClick={() =>
                setCompleted(!completed)
              }
            >
              {completed
                ? "✓ Completed"
                : "Mark as completed"}
            </button>
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
              {saving ? "Saving changes..." : "Save changes"}
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