"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

const categories = [
  "Boiler",
  "Heating",
  "Plumbing",
  "Electrical",
  "Roof",
  "Gutters",
  "Appliance",
  "Garden",
  "Other",
];

export default function EditMaintenancePage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Boiler");
  const [dueDate, setDueDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");
  const [completed, setCompleted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMaintenance() {
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
          .from("maintenance")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (loadError) {
          console.error(
            "Could not load maintenance:",
            loadError
          );

          setError(
            "We couldn't find this maintenance item."
          );

          setLoading(false);
          return;
        }

        setTitle(data.title || "");
        setCategory(data.category || "Boiler");
        setDueDate(data.due_date || "");
        setEstimatedCost(
          data.estimated_cost !== null &&
          data.estimated_cost !== undefined
            ? String(data.estimated_cost)
            : ""
        );
        setNotes(data.notes || "");
        setCompleted(Boolean(data.completed));
      } catch (error) {
        console.error(
          "Could not load maintenance:",
          error
        );

        setError(
          "Something went wrong loading this item."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadMaintenance();
    }
  }, [id, router]);

  async function handleSubmit(event) {
  event.preventDefault();

  if (!title.trim() || !dueDate) {
    setError("Please enter a title and due date.");
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
      setError("Please sign in before editing maintenance.");
      setSaving(false);
      return;
    }

    const updates = {
      title: title.trim(),
      category,
      due_date: dueDate,
      estimated_cost: estimatedCost
        ? Number(estimatedCost)
        : null,
      notes: notes.trim() || null,
      completed,
    };

    console.log("UPDATING MAINTENANCE:", {
      id,
      user_id: user.id,
      updates,
    });

    const { data, error: updateError } = await supabase
      .from("maintenance")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    console.log("UPDATED MAINTENANCE:", data);
    console.log("UPDATE ERROR:", updateError);

    if (updateError) {
      console.error(
        "Could not update maintenance:",
        updateError
      );

      setError(
        "We couldn't save your changes. Please try again."
      );

      setSaving(false);
      return;
    }

    router.push("/maintenance");
  } catch (error) {
    console.error(
      "Could not update maintenance:",
      error
    );

    setError("Something went wrong. Please try again.");
    setSaving(false);
  }
}

  if (loading) {
    return (
      <main className="formPage">
        <div className="formContainer">
          <div className="maintenanceEmptyState">
            Loading maintenance...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="formPage">
      <div className="formContainer">
        <Link
          href="/maintenance"
          className="backLink"
        >
          ← Back to maintenance
        </Link>

        <div className="formHeader">
          <p className="eyebrow">YOUR HOME</p>

          <h1>Edit maintenance</h1>

          <p>
            Correct or update the details for this
            maintenance item.
          </p>
        </div>

        <form
          className="maintenanceForm"
          onSubmit={handleSubmit}
        >
          <label className="field">
            <span>What needs doing?</span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Boiler service"
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
            <span>Due date</span>

            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(event.target.value)
              }
            />
          </label>

          <label className="field">
            <span>
              Estimated cost{" "}
              <small>(optional)</small>
            </span>

            <div className="costInput">
              <span>£</span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={estimatedCost}
                onChange={(event) =>
                  setEstimatedCost(
                    event.target.value
                  )
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
              !dueDate ||
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