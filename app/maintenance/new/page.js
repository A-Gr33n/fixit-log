"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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

const repeatOptions = [
  { value: 1, label: "Every month" },
  { value: 3, label: "Every 3 months" },
  { value: 6, label: "Every 6 months" },
  { value: 12, label: "Every year" },
  { value: 24, label: "Every 2 years" },
];

export default function NewMaintenancePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState("Boiler");
  const [dueDate, setDueDate] =
    useState("");
  const [cost, setCost] =
    useState("");
  const [notes, setNotes] =
    useState("");

  const [recurring, setRecurring] =
    useState(false);

  const [repeatMonths, setRepeatMonths] =
    useState(12);

  const [customRepeatMonths, setCustomRepeatMonths] =
    useState("");

  const [usingCustomRepeat, setUsingCustomRepeat] =
    useState(false);

  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  function getFinalRepeatMonths() {
    if (!recurring) {
      return null;
    }

    if (usingCustomRepeat) {
      const customValue =
        Number(customRepeatMonths);

      if (
        !Number.isInteger(customValue) ||
        customValue < 1 ||
        customValue > 120
      ) {
        return null;
      }

      return customValue;
    }

    return Number(repeatMonths);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !dueDate) {
      setError(
        "Please enter a title and due date."
      );
      return;
    }

    const finalRepeatMonths =
      getFinalRepeatMonths();

    if (
      recurring &&
      finalRepeatMonths === null
    ) {
      setError(
        "Please choose a valid repeat interval between 1 and 120 months."
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
          "Please sign in before adding maintenance."
        );
        setSaving(false);
        return;
      }

      const { error: insertError } =
        await supabase
          .from("maintenance")
          .insert({
            user_id: user.id,
            title: title.trim(),
            category,
            due_date: dueDate,
            estimated_cost: cost
              ? Number(cost)
              : null,
            notes:
              notes.trim() || null,
            recurring,
            repeat_months:
              finalRepeatMonths,
          });

      if (insertError) {
        console.error(
          "Could not save maintenance:",
          insertError
        );

        setError(
          "We couldn't save this maintenance item. Please try again."
        );

        setSaving(false);
        return;
      }

      router.push("/maintenance");
    } catch (error) {
      console.error(
        "Could not save maintenance:",
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
          href="/maintenance"
          className="backLink"
        >
          ← Back to maintenance
        </Link>

        <div className="formHeader">
          <p className="eyebrow">
            ADD TO YOUR HOME
          </p>

          <h1>Add maintenance</h1>

          <p>
            Keep a record of something that
            needs doing so you don't have to
            remember it yourself.
          </p>
        </div>

        <form
          className="maintenanceForm"
          onSubmit={handleSubmit}
        >
          <label className="field">
            <span>
              What needs maintaining?
            </span>

            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
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
            <span>When is it due?</span>

            <input
              type="date"
              value={dueDate}
              onChange={(event) =>
                setDueDate(
                  event.target.value
                )
              }
            />
          </label>

          {/* RECURRING */}

          <div className="field">
            <span>
              Does this repeat?
            </span>

            <div className="recurringChoice">
              <button
                type="button"
                className={`recurringChoiceButton ${
                  !recurring
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setRecurring(false)
                }
              >
                One-off
              </button>

              <button
                type="button"
                className={`recurringChoiceButton ${
                  recurring
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setRecurring(true)
                }
              >
                ↻ Repeats
              </button>
            </div>

            {recurring && (
              <div className="recurringPanel">
                <div>
                  <strong>
                    Repeat schedule
                  </strong>

                  <p>
                    When you complete this
                    job, FixIt Log will move
                    its due date forward
                    automatically.
                  </p>
                </div>

                <div className="repeatOptions">
                  {repeatOptions.map(
                    (option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`repeatOption ${
                          !usingCustomRepeat &&
                          repeatMonths ===
                            option.value
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => {
                          setUsingCustomRepeat(
                            false
                          );

                          setRepeatMonths(
                            option.value
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    className={`repeatOption ${
                      usingCustomRepeat
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setUsingCustomRepeat(
                        true
                      )
                    }
                  >
                    Custom
                  </button>
                </div>

                {usingCustomRepeat && (
                  <label className="customRepeatField">
                    <span>
                      Repeat every
                    </span>

                    <div>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        step="1"
                        value={
                          customRepeatMonths
                        }
                        onChange={(event) =>
                          setCustomRepeatMonths(
                            event.target.value
                          )
                        }
                        placeholder="12"
                      />

                      <span>months</span>
                    </div>
                  </label>
                )}
              </div>
            )}
          </div>

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
                value={cost}
                onChange={(event) =>
                  setCost(
                    event.target.value
                  )
                }
                placeholder="0.00"
              />
            </div>
          </label>

          <label className="field">
            <span>
              Notes{" "}
              <small>(optional)</small>
            </span>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder="Anything else you want to remember..."
              rows="4"
            />
          </label>

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
              ? "Saving..."
              : "Save maintenance →"}
          </button>
        </form>
      </div>
    </main>
  );
}