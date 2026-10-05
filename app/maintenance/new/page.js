"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const categories = [
  "Boiler",
  "Plumbing",
  "Electrical",
  "Garden",
  "Appliances",
  "Other",
];

export default function NewMaintenancePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Boiler");
  const [dueDate, setDueDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !dueDate) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Please sign in before adding maintenance.");
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("maintenance")
        .insert({
          user_id: user.id,
          title: title.trim(),
          category,
          due_date: dueDate,
          estimated_cost: cost ? Number(cost) : null,
          notes: notes.trim() || null,
        });

      if (insertError) {
        console.error("Could not save maintenance:", insertError);
        setError("We couldn't save this maintenance item. Please try again.");
        setSaving(false);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Could not save maintenance:", error);
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  return (
    <main className="formPage">
      <div className="formContainer">
        <Link href="/dashboard" className="backLink">
          ← Back to dashboard
        </Link>

        <div className="formHeader">
          <p className="eyebrow">ADD TO YOUR HOME</p>
          <h1>Add maintenance</h1>
          <p>
            Keep a record of something that needs doing so you don't have to
            remember it yourself.
          </p>
        </div>

        <form className="maintenanceForm" onSubmit={handleSubmit}>
          <label className="field">
            <span>What needs maintaining?</span>

            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
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
                    category === item ? "selected" : ""
                  }`}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>When is it due?</span>

            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>

          <label className="field">
            <span>
              Estimated cost <small>(optional)</small>
            </span>

            <div className="costInput">
              <span>£</span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
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
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything else you want to remember..."
              rows="4"
            />
          </label>

          {error && <p className="formError">{error}</p>}

          <button
            type="submit"
            className="primaryButton"
            disabled={!title.trim() || !dueDate || saving}
          >
            {saving ? "Saving..." : "Save maintenance →"}
          </button>
        </form>
      </div>
    </main>
  );
}