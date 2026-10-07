"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
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

const repeatOptions = [
  { value: 1, label: "Every month" },
  { value: 3, label: "Every 3 months" },
  { value: 6, label: "Every 6 months" },
  { value: 12, label: "Every year" },
  { value: 24, label: "Every 2 years" },
];

export default function EditMaintenancePage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id;

  const [title, setTitle] =
    useState("");
  const [category, setCategory] =
    useState("Boiler");
  const [dueDate, setDueDate] =
    useState("");
  const [
    estimatedCost,
    setEstimatedCost,
  ] = useState("");
  const [notes, setNotes] =
    useState("");
  const [completed, setCompleted] =
    useState(false);

  const [recurring, setRecurring] =
    useState(false);

  const [
    repeatMonths,
    setRepeatMonths,
  ] = useState(12);

  const [
    customRepeatMonths,
    setCustomRepeatMonths,
  ] = useState("");

  const [
    usingCustomRepeat,
    setUsingCustomRepeat,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadMaintenance() {
      try {
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError || !user) {
          router.push("/");
          return;
        }

        const {
          data,
          error: loadError,
        } = await supabase
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

        setCategory(
          data.category || "Boiler"
        );

        setDueDate(
          data.due_date || ""
        );

        setEstimatedCost(
          data.estimated_cost !==
            null &&
            data.estimated_cost !==
              undefined
            ? String(
                data.estimated_cost
              )
            : ""
        );

        setNotes(
          data.notes || ""
        );

        setCompleted(
          Boolean(data.completed)
        );

        const isRecurring =
          Boolean(data.recurring);

        setRecurring(isRecurring);

        const savedRepeatMonths =
          Number(
            data.repeat_months || 12
          );

        const standardOption =
          repeatOptions.some(
            (option) =>
              option.value ===
              savedRepeatMonths
          );

        if (standardOption) {
          setRepeatMonths(
            savedRepeatMonths
          );

          setUsingCustomRepeat(
            false
          );
        } else if (isRecurring) {
          setUsingCustomRepeat(
            true
          );

          setCustomRepeatMonths(
            String(
              savedRepeatMonths
            )
          );
        }
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

  function getFinalRepeatMonths() {
    if (!recurring) {
      return null;
    }

    if (usingCustomRepeat) {
      const customValue =
        Number(
          customRepeatMonths
        );

      if (
        !Number.isInteger(
          customValue
        ) ||
        customValue < 1 ||
        customValue > 120
      ) {
        return null;
      }

      return customValue;
    }

    return Number(
      repeatMonths
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (
      !title.trim() ||
      !dueDate
    ) {
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
      } =
        await supabase.auth.getUser();

      if (userError || !user) {
        setError(
          "Please sign in before editing maintenance."
        );

        setSaving(false);
        return;
      }

      const updates = {
        title: title.trim(),
        category,
        due_date: dueDate,
        estimated_cost:
          estimatedCost
            ? Number(
                estimatedCost
              )
            : null,
        notes:
          notes.trim() || null,
        completed,
        recurring,
        repeat_months:
          finalRepeatMonths,
      };

      const {
        error: updateError,
      } = await supabase
        .from("maintenance")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

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

      router.push(
        "/maintenance"
      );
    } catch (error) {
      console.error(
        "Could not update maintenance:",
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
          <p className="eyebrow">
            YOUR HOME
          </p>

          <h1>
            Edit maintenance
          </h1>

          <p>
            Correct or update the
            details for this
            maintenance item.
          </p>
        </div>

        <form
          className="maintenanceForm"
          onSubmit={handleSubmit}
        >
          <label className="field">
            <span>
              What needs doing?
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
              {categories.map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    className={`categoryOption ${
                      category === item
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setCategory(
                        item
                      )
                    }
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </div>

          <label className="field">
            <span>Due date</span>

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
                    Completing this
                    maintenance will
                    automatically schedule
                    the next due date.
                  </p>
                </div>

                <div className="repeatOptions">
                  {repeatOptions.map(
                    (option) => (
                      <button
                        key={
                          option.value
                        }
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
                        onChange={(
                          event
                        ) =>
                          setCustomRepeatMonths(
                            event
                              .target
                              .value
                          )
                        }
                        placeholder="12"
                      />

                      <span>
                        months
                      </span>
                    </div>
                  </label>
                )}
              </div>
            )}
          </div>

          <label className="field">
            <span>
              Estimated cost{" "}
              <small>
                (optional)
              </small>
            </span>

            <div className="costInput">
              <span>£</span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={
                  estimatedCost
                }
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
              Notes{" "}
              <small>
                (optional)
              </small>
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

          <div className="field">
            <span>Status</span>

            <button
              type="button"
              className={`categoryOption ${
                completed
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setCompleted(
                  !completed
                )
              }
            >
              {completed
                ? "✓ Completed"
                : "Mark as completed"}
            </button>

            {recurring && (
              <p className="recurringStatusHint">
                ↻ For recurring maintenance,
                using “Mark as completed”
                from the Maintenance page
                will schedule the next
                occurrence automatically.
              </p>
            )}
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