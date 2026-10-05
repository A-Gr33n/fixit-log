"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const categories = [
  "Plumbing",
  "Electrical",
  "Heating",
  "Roof",
  "Appliance",
  "Structural",
  "Other",
];

export default function NewRepairPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Plumbing");
  const [repairDate, setRepairDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !repairDate) {
      setError("Please enter what was repaired and the repair date.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log("CURRENT USER:", user);
      console.log("USER ERROR:", userError);

      if (userError) {
        setError("We couldn't verify your account.");
        setSaving(false);
        return;
      }

      if (!user) {
        setError("Please sign in before adding a repair.");
        setSaving(false);
        return;
      }

      const repairToInsert = {
        user_id: user.id,
        title: title.trim(),
        category,
        repair_date: repairDate,
        cost: cost ? Number(cost) : null,
        notes: notes.trim() || null,
      };

      console.log("REPAIR BEING INSERTED:", repairToInsert);

      const {
        data: insertedRepair,
        error: insertError,
      } = await supabase
        .from("repairs")
        .insert(repairToInsert)
        .select()
        .single();

      console.log("INSERTED REPAIR:", insertedRepair);
      console.log("INSERT ERROR:", insertError);

      if (insertError) {
        setError(
          `Couldn't save repair: ${insertError.message}`
        );
        setSaving(false);
        return;
      }

      setSuccess(
        "Repair saved successfully. Check Supabase to confirm the row."
      );

      setSaving(false);
    } catch (error) {
      console.error("REPAIR SAVE EXCEPTION:", error);

      setError(
        error?.message ||
          "Something went wrong. Please try again."
      );

      setSaving(false);
    }
  }

  return (
    <main className="formPage">
      <div className="formContainer">
        <Link href="/repairs" className="backLink">
          ← Back to repairs
        </Link>

        <div className="formHeader">
          <p className="eyebrow">YOUR HOME</p>

          <h1>Add repair</h1>

          <p>
            Keep a record of repairs you've had done so
            you can remember what happened and what it
            cost.
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
                  onClick={() => setCategory(item)}
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

          {error && (
            <p className="formError">{error}</p>
          )}

          {success && (
            <p className="formSuccess">{success}</p>
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
              ? "Saving..."
              : "Save repair →"}
          </button>
        </form>
      </div>
    </main>
  );
}