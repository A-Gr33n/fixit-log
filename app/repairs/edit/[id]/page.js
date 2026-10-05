"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

const categories = [
  "Plumbing",
  "Electrical",
  "Heating",
  "Roof",
  "Appliance",
  "Structural",
  "Other",
];

export default function EditRepairPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Plumbing");
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
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/");
          return;
        }

        const { data, error: loadError } = await supabase
          .from("repairs")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (loadError) {
          console.error(
            "Could not load repair:",
            loadError
          );

          setError(
            "We couldn't find this repair."
          );

          setLoading(false);
          return;
        }

        setTitle(data.title || "");
        setCategory(data.category || "Plumbing");
        setRepairDate(data.repair_date || "");

        setCost(
          data.cost !== null &&
          data.cost !== undefined
            ? String(data.cost)
            : ""
        );

        setNotes(data.notes || "");
        setCompleted(Boolean(data.completed));
      } catch (error) {
        console.error(
          "Could not load repair:",
          error
        );

        setError(
          "Something went wrong loading this repair."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadRepair();
    }
  }, [id, router]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !repairDate) {
      setError(
        "Please enter a repair title and date."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(
          "Please sign in before editing this repair."
        );
        setSaving(false);
        return;
      }

      const updates = {
        title: title.trim(),
        category,
        repair_date: repairDate,
        cost: cost ? Number(cost) : null,
        notes: notes.trim() || null,
        completed,
      };

      const { error: updateError } = await supabase
        .from("repairs")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error(
          "Could not update repair:",
          updateError
        );

        setError(
          "We couldn't save your changes. Please try again."
        );

        setSaving(false);
        return;
      }

      router.push("/repairs");
    } catch (error) {
      console.error(
        "Could not update repair:",
        error
      );

      setError(
        "Something went wrong. Please try again."
      );

      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="formPage">
        <div className="formContainer">
          <div className="maintenanceEmptyState">
            Loading repair...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="formPage">
      <div className="formContainer">
        <Link
          href="/repairs"
          className="backLink"
        >
          ← Back to repairs
        </Link>

        <div className="formHeader">
          <p className="eyebrow">YOUR HOME</p>

          <h1>Edit repair</h1>

          <p>
            Correct or update the details for this
            repair.
          </p>
        </div>

        <form
          className="maintenanceForm"
          onSubmit={handleSubmit}
        >
          <label className="field">
            <span>What needed repairing?</span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Leaking kitchen tap"
              autoFocus
            />
          </label>

          <div className="field">
            <span>Category</span>

            <div className="categoryGrid">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`categoryOption ${
                    category === item
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setCategory(item)
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>When was it repaired?</span>

            <input
              type="date"
              value={repairDate}
              onChange={(event) =>
                setRepairDate(event.target.value)
              }
            />
          </label>

          <label className="field">
            <span>
              Cost <small>(optional)</small>
            </span>

            <div className="costInput">
              <span>£</span>

              <input
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
          </label>

          <label className="field">
            <span>
              Notes <small>(optional)</small>
            </span>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Anything else you want to remember..."
              rows="4"
            />
          </label>

          <div className="field">
            <span>Status</span>

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

          {error && (
            <p className="formError">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primaryButton"
            disabled={
              !title.trim() ||
              !repairDate ||
              saving
            }
          >
            {saving
              ? "Saving changes..."
              : "Save changes →"}
          </button>
        </form>
      </div>
    </main>
  );
}