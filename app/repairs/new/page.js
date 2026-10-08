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

export default function NewRepairPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [repairDate, setRepairDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const [attachments, setAttachments] = useState([]);
  const [documentType, setDocumentType] = useState("receipt");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  async function uploadAttachments(userId, repairId) {
    const failures = [];

    for (const attachment of attachments) {
      const { file, type } = attachment;

      const safeName = file.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      const path =
        `${userId}/repairs/${repairId}/` +
        `${crypto.randomUUID()}-${safeName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("home-documents")
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });

      if (uploadError) {
        console.error("Document upload failed:", uploadError);
        failures.push(file.name);
        continue;
      }

      const { error: documentError } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          maintenance_id: null,
          repair_id: repairId,
          document_type: type,
          file_name: file.name,
          file_path: path,
          file_type: file.type,
          file_size: file.size,
        });

      if (documentError) {
        console.error("Document record failed:", documentError);

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
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Please sign in before adding a repair.");
        return;
      }

      const { data: repair, error: insertError } =
        await supabase
          .from("repairs")
          .insert({
            user_id: user.id,
            title: title.trim(),
            category,
            repair_date: repairDate,
            cost: cost === "" ? null : Number(cost),
            notes: notes.trim() || null,
            completed: false,
          })
          .select("id")
          .single();

      if (insertError || !repair) {
        console.error("Could not save repair:", insertError);
        setError("Could not save the repair. Please try again.");
        return;
      }

      const failures = await uploadAttachments(
        user.id,
        repair.id
      );

      if (failures.length > 0) {
        setError(
          `Repair saved, but these files could not be uploaded: ` +
          `${failures.join(", ")}. Open the repair's Edit page ` +
          `to add them again.`
        );
        return;
      }

      router.push("/repairs");
    } catch (saveError) {
      console.error("Could not save repair:", saveError);
      setError(
        "Something went wrong. Check your Repairs list before trying again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="formPage">
      <div className="formContainer">
        <Link href="/repairs" className="backLink">
          ← Repairs
        </Link>

        <header className="formHeader">
          <p className="eyebrow">YOUR HOME</p>
          <h1>Add repair</h1>
          <p>
            Record a repair and keep the details,
            receipts and photos in one place.
          </p>
        </header>

        <form
          className="maintenanceForm"
          onSubmit={handleSubmit}
        >
          <div className="field">
            <label htmlFor="title">Repair title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Boiler repair"
              required
            />
          </div>

          <div className="field">
            <label>Category</label>
            <div className="categoryGrid">
              {repairCategories.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`categoryOption ${
                    category === option ? "selected" : ""
                  }`}
                  onClick={() => setCategory(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="repairDate">Repair date</label>
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

          <div className="field">
            <label htmlFor="cost">Cost (£)</label>
            <div className="costInput">
              <span>£</span>
              <input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(event) => setCost(event.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              rows="5"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add any useful details..."
            />
          </div>

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
                <label htmlFor="repairDocumentType">
                  Document type
                </label>
                <select
                  id="repairDocumentType"
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
                <label htmlFor="repairFiles">
                  Choose files
                </label>
                <input
                  id="repairFiles"
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
                        onClick={() =>
                          removeAttachment(attachment.id)
                        }
                        disabled={saving}
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

          <div className="formActions">
            <button
              type="submit"
              className="primaryButton"
              disabled={saving}
            >
              {saving
                ? "Saving repair and files..."
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