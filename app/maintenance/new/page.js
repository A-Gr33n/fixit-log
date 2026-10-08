"use client";

import { useState } from "react";
import Link from "next/link";
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

const documentTypes = [
  { value: "receipt", label: "Receipt" },
  { value: "invoice", label: "Invoice" },
  { value: "warranty", label: "Warranty" },
  { value: "manual", label: "Manual" },
  { value: "photo", label: "Photo" },
  { value: "other", label: "Other" },
];

const allowedFileTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const maxFileSize = 10 * 1024 * 1024;

export default function NewMaintenancePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Boiler");
  const [dueDate, setDueDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const [recurring, setRecurring] = useState(false);
  const [repeatMonths, setRepeatMonths] = useState(12);
  const [customRepeatMonths, setCustomRepeatMonths] =
    useState("");
  const [usingCustomRepeat, setUsingCustomRepeat] =
    useState(false);

  const [attachments, setAttachments] = useState([]);
  const [documentType, setDocumentType] =
    useState("receipt");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function getFinalRepeatMonths() {
    if (!recurring) return null;

    if (usingCustomRepeat) {
      const value = Number(customRepeatMonths);

      if (
        customRepeatMonths.trim() === "" ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > 120
      ) {
        return null;
      }

      return value;
    }

    return Number(repeatMonths);
  }

  function handleAddFiles(event) {
    const files = Array.from(event.target.files || []);
    setError("");

    const invalid = files.find(
      (file) =>
        !allowedFileTypes.includes(file.type) ||
        file.size > maxFileSize
    );

    if (invalid) {
      setError(
        "Only JPG, PNG and PDF files up to 10 MB are allowed."
      );
      event.target.value = "";
      return;
    }

    setAttachments((current) => [
      ...current,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        type: documentType,
      })),
    ]);

    event.target.value = "";
  }

  function removeAttachment(id) {
    setAttachments((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  async function uploadAttachments(userId, maintenanceId) {
    const failures = [];

    for (const attachment of attachments) {
      const { file, type } = attachment;

      const safeName = file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const path =
        `${userId}/maintenance/${maintenanceId}/` +
        `${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("home-documents")
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });

      if (uploadError) {
        console.error(
          "Maintenance document upload failed:",
          uploadError
        );
        failures.push(file.name);
        continue;
      }

      const { error: documentError } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          maintenance_id: maintenanceId,
          repair_id: null,
          document_type: type,
          file_name: file.name,
          file_path: path,
          file_type: file.type,
          file_size: file.size,
        });

      if (documentError) {
        console.error(
          "Maintenance document record failed:",
          documentError
        );

        await supabase.storage
          .from("home-documents")
          .remove([path]);

        failures.push(file.name);
      }
    }

    return failures;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    setError("");

    if (!title.trim() || !dueDate) {
      setError("Please enter a title and due date.");
      return;
    }

    const finalRepeatMonths = getFinalRepeatMonths();

    if (recurring && finalRepeatMonths === null) {
      setError(
        "Please choose a valid repeat interval between 1 and 120 months."
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Please sign in before adding maintenance.");
        return;
      }

      const { data: maintenanceItem, error: insertError } =
        await supabase
          .from("maintenance")
          .insert({
            user_id: user.id,
            title: title.trim(),
            category,
            due_date: dueDate,
            estimated_cost:
              cost === "" ? null : Number(cost),
            notes: notes.trim() || null,
            recurring,
            repeat_months: finalRepeatMonths,
          })
          .select("id")
          .single();

      if (insertError || !maintenanceItem) {
        console.error(
          "Could not save maintenance:",
          insertError
        );

        setError(
          "We couldn't save this maintenance item. Please try again."
        );
        return;
      }

      const failures = await uploadAttachments(
        user.id,
        maintenanceItem.id
      );

      if (failures.length > 0) {
        setError(
          `Maintenance saved, but these files could not be uploaded: ` +
          `${failures.join(", ")}. Open the maintenance item's ` +
          `Edit page to add them again.`
        );
        return;
      }

      router.push("/maintenance");
    } catch (saveError) {
      console.error(
        "Could not save maintenance:",
        saveError
      );

      setError(
        "Something went wrong. Check your Maintenance list before trying again."
      );
    } finally {
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

        <header className="formHeader">
          <p className="eyebrow">ADD TO YOUR HOME</p>
          <h1>Add maintenance</h1>
          <p>
            Keep a record of something that needs doing
            so you don't have to remember it yourself.
          </p>
        </header>

        <form
          className="maintenanceForm"
          onSubmit={handleSubmit}
        >
          <label className="field">
            <span>What needs maintaining?</span>
            <input
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Boiler service"
              autoFocus
              required
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
              onChange={(event) =>
                setDueDate(event.target.value)
              }
              required
            />
          </label>

          <div className="field">
            <span>Does this repeat?</span>

            <div className="recurringChoice">
              <button
                type="button"
                className={`recurringChoiceButton ${
                  !recurring ? "selected" : ""
                }`}
                onClick={() => setRecurring(false)}
              >
                One-off
              </button>

              <button
                type="button"
                className={`recurringChoiceButton ${
                  recurring ? "selected" : ""
                }`}
                onClick={() => setRecurring(true)}
              >
                ↻ Repeats
              </button>
            </div>

            {recurring && (
              <div className="recurringPanel">
                <div>
                  <strong>Repeat schedule</strong>
                  <p>
                    When you complete this job, FixIt Log
                    will move its due date forward automatically.
                  </p>
                </div>

                <div className="repeatOptions">
                  {repeatOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`repeatOption ${
                        !usingCustomRepeat &&
                        repeatMonths === option.value
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        setUsingCustomRepeat(false);
                        setRepeatMonths(option.value);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    className={`repeatOption ${
                      usingCustomRepeat ? "selected" : ""
                    }`}
                    onClick={() =>
                      setUsingCustomRepeat(true)
                    }
                  >
                    Custom
                  </button>
                </div>

                {usingCustomRepeat && (
                  <label className="customRepeatField">
                    <span>Repeat every</span>
                    <div>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        step="1"
                        value={customRepeatMonths}
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
              Estimated cost <small>(optional)</small>
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

          <section className="documentsSection">
            <div className="documentsHeader">
              <div>
                <p className="eyebrow">DOCUMENTS & RECEIPTS</p>
                <h2>Attach files</h2>
                <p>
                  Add receipts, invoices, warranties,
                  manuals or photos before saving.
                </p>
              </div>

              <span className="documentsCount">
                {attachments.length}
              </span>
            </div>

            <div className="documentUploadPanel">
              <div className="field">
                <label htmlFor="maintenanceDocumentType">
                  Document type
                </label>

                <select
                  id="maintenanceDocumentType"
                  value={documentType}
                  onChange={(event) =>
                    setDocumentType(event.target.value)
                  }
                >
                  {documentTypes.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="maintenanceFiles">
                  Choose files
                </label>

                <input
                  id="maintenanceFiles"
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={handleAddFiles}
                />

                <small className="documentHint">
                  Optional. JPG, PNG or PDF.
                  Maximum 10 MB per file.
                </small>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="documentsList">
                {attachments.map((attachment) => (
                  <div
                    className="documentCard"
                    key={attachment.id}
                  >
                    <div className="documentFileIcon">
                      {attachment.file.type ===
                      "application/pdf"
                        ? "PDF"
                        : "📷"}
                    </div>

                    <div className="documentDetails">
                      <strong>
                        {attachment.file.name}
                      </strong>

                      <div className="documentMeta">
                        <span>
                          {documentTypes.find(
                            (type) =>
                              type.value === attachment.type
                          )?.label}
                        </span>
                      </div>
                    </div>

                    <div className="documentActions">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          removeAttachment(attachment.id)
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {error && (
            <p className="formError" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primaryButton"
            disabled={!title.trim() || !dueDate || saving}
          >
            {saving
              ? "Saving maintenance and files..."
              : "Save maintenance →"}
          </button>
        </form>
      </div>
    </main>
  );
}