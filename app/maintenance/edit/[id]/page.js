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


const maxFileSize =
  10 * 1024 * 1024;


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


  // DOCUMENTS

  const [documents, setDocuments] =
    useState([]);

  const [
    documentsLoading,
    setDocumentsLoading,
  ] = useState(true);

  const [
    documentType,
    setDocumentType,
  ] = useState("receipt");

  const [
    selectedFile,
    setSelectedFile,
  ] = useState(null);

  const [
    uploadingDocument,
    setUploadingDocument,
  ] = useState(false);

  const [
    deletingDocumentId,
    setDeletingDocumentId,
  ] = useState(null);

  const [
    documentError,
    setDocumentError,
  ] = useState("");

  const [
    documentMessage,
    setDocumentMessage,
  ] = useState("");


  // LOAD MAINTENANCE

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

          return;
        }

        setTitle(
          data.title || ""
        );

        setCategory(
          data.category || "Boiler"
        );

        setDueDate(
          data.due_date || ""
        );

        setEstimatedCost(
          data.estimated_cost !== null &&
          data.estimated_cost !== undefined
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

        setRecurring(
          isRecurring
        );

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
      } catch (loadCatchError) {
        console.error(
          "Could not load maintenance:",
          loadCatchError
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


  // LOAD DOCUMENTS

  async function loadDocuments() {
    try {
      setDocumentsLoading(true);
      setDocumentError("");

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError || !user) {
        setDocumentError(
          "Please sign in to view documents."
        );

        return;
      }

      const {
        data,
        error: loadError,
      } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq(
          "maintenance_id",
          id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (loadError) {
        console.error(
          "Could not load documents:",
          loadError
        );

        setDocumentError(
          "We couldn't load your documents."
        );

        return;
      }

      setDocuments(
        data || []
      );
    } catch (loadCatchError) {
      console.error(
        "Could not load documents:",
        loadCatchError
      );

      setDocumentError(
        "Something went wrong loading documents."
      );
    } finally {
      setDocumentsLoading(false);
    }
  }


  useEffect(() => {
    if (id) {
      loadDocuments();
    }
  }, [id]);


  // RECURRING

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


  // SAVE MAINTENANCE

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
        title:
          title.trim(),

        category,

        due_date:
          dueDate,

        estimated_cost:
          estimatedCost
            ? Number(
                estimatedCost
              )
            : null,

        notes:
          notes.trim() ||
          null,

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
        .eq(
          "user_id",
          user.id
        );

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
    } catch (saveError) {
      console.error(
        "Could not update maintenance:",
        saveError
      );

      setError(
        "Something went wrong. Please try again."
      );

      setSaving(false);
    }
  }


  // FILE SELECTION

  function handleFileChange(event) {
    const file =
      event.target.files?.[0] ||
      null;

    setDocumentError("");
    setDocumentMessage("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      !allowedFileTypes.includes(
        file.type
      )
    ) {
      setSelectedFile(null);

      setDocumentError(
        "Please choose a JPEG, PNG, WebP or PDF file."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      maxFileSize
    ) {
      setSelectedFile(null);

      setDocumentError(
        "The file must be 10 MB or smaller."
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }


  // UPLOAD DOCUMENT

  async function handleDocumentUpload() {
    if (!selectedFile) {
      setDocumentError(
        "Please choose a file to upload."
      );

      return;
    }

    setUploadingDocument(true);
    setDocumentError("");
    setDocumentMessage("");

    let uploadedPath =
      null;

    try {
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError || !user) {
        setDocumentError(
          "Please sign in before uploading a document."
        );

        return;
      }

      const safeFileName =
        selectedFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

      const uniqueFileName =
        `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

      const filePath =
        `${user.id}/maintenance/${id}/${uniqueFileName}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from(
          "home-documents"
        )
        .upload(
          filePath,
          selectedFile,
          {
            cacheControl:
              "3600",

            upsert: false,

            contentType:
              selectedFile.type,
          }
        );

      if (uploadError) {
        console.error(
          "Could not upload document:",
          uploadError
        );

        setDocumentError(
          `Upload failed: ${
            uploadError.message ||
            "Please try again."
          }`
        );

        return;
      }

      uploadedPath =
        filePath;

      const {
        error: insertError,
      } = await supabase
        .from("documents")
        .insert({
          user_id:
            user.id,

          maintenance_id:
            id,

          repair_id:
            null,

          document_type:
            documentType,

          file_name:
            selectedFile.name,

          file_path:
            filePath,

          file_type:
            selectedFile.type,

          file_size:
            selectedFile.size,
        });

      if (insertError) {
        console.error(
          "Could not save document record:",
          insertError
        );

        await supabase.storage
          .from(
            "home-documents"
          )
          .remove([
            filePath,
          ]);

        setDocumentError(
          `The file uploaded, but its record could not be saved: ${
            insertError.message ||
            "Please try again."
          }`
        );

        return;
      }

      setSelectedFile(
        null
      );

      setDocumentType(
        "receipt"
      );

      const fileInput =
        document.getElementById(
          "maintenanceDocumentFile"
        );

      if (fileInput) {
        fileInput.value =
          "";
      }

      setDocumentMessage(
        "Document uploaded successfully."
      );

      await loadDocuments();
    } catch (uploadCatchError) {
      console.error(
        "Could not upload document:",
        uploadCatchError
      );

      if (uploadedPath) {
        await supabase.storage
          .from(
            "home-documents"
          )
          .remove([
            uploadedPath,
          ]);
      }

      setDocumentError(
        `Something went wrong uploading the document: ${
          uploadCatchError?.message ||
          "Please try again."
        }`
      );
    } finally {
      setUploadingDocument(
        false
      );
    }
  }


  // VIEW DOCUMENT

  async function handleViewDocument(
    documentItem
  ) {
    setDocumentError("");
    setDocumentMessage("");

    try {
      const {
        data,
        error: signedUrlError,
      } = await supabase.storage
        .from(
          "home-documents"
        )
        .createSignedUrl(
          documentItem.file_path,
          60
        );

      if (
        signedUrlError ||
        !data?.signedUrl
      ) {
        console.error(
          "Could not open document:",
          signedUrlError
        );

        setDocumentError(
          `We couldn't open that document${
            signedUrlError?.message
              ? `: ${signedUrlError.message}`
              : "."
          }`
        );

        return;
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (viewError) {
      console.error(
        "Could not open document:",
        viewError
      );

      setDocumentError(
        "Something went wrong opening the document."
      );
    }
  }


  // DELETE DOCUMENT

  async function handleDeleteDocument(
    documentItem
  ) {
    const confirmed =
      window.confirm(
        `Delete "${documentItem.file_name}"? This cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setDeletingDocumentId(
      documentItem.id
    );

    setDocumentError("");
    setDocumentMessage("");

    try {
      const {
        error: storageError,
      } = await supabase.storage
        .from(
          "home-documents"
        )
        .remove([
          documentItem.file_path,
        ]);

      if (storageError) {
        console.error(
          "Could not delete stored file:",
          storageError
        );

        setDocumentError(
          `We couldn't delete that file: ${
            storageError.message ||
            "Please try again."
          }`
        );

        return;
      }

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        setDocumentError(
          "The file was removed, but the document record could not be cleared because you are no longer signed in."
        );

        return;
      }

      const {
        error: deleteError,
      } = await supabase
        .from("documents")
        .delete()
        .eq(
          "id",
          documentItem.id
        )
        .eq(
          "user_id",
          user.id
        );

      if (deleteError) {
        console.error(
          "Could not delete document record:",
          deleteError
        );

        setDocumentError(
          `The file was removed, but its document record could not be deleted: ${
            deleteError.message ||
            "Please try again."
          }`
        );

        return;
      }

      setDocuments(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              documentItem.id
          )
      );

      setDocumentMessage(
        "Document deleted."
      );
    } catch (deleteCatchError) {
      console.error(
        "Could not delete document:",
        deleteCatchError
      );

      setDocumentError(
        "Something went wrong deleting the document."
      );
    } finally {
      setDeletingDocumentId(
        null
      );
    }
  }


  function formatFileSize(
    bytes
  ) {
    const size =
      Number(bytes || 0);

    if (size < 1024) {
      return `${size} B`;
    }

    if (
      size <
      1024 * 1024
    ) {
      return `${(
        size / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }


  function getDocumentTypeLabel(
    value
  ) {
    return (
      documentTypes.find(
        (item) =>
          item.value ===
          value
      )?.label ||
      "Other"
    );
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


        {/* MAINTENANCE FORM */}

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
            <span>
              Category
            </span>

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
            <span>
              Due date
            </span>

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
                  setRecurring(
                    false
                  )
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
                  setRecurring(
                    true
                  )
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
                    automatically
                    schedule the next
                    due date.
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
                        {
                          option.label
                        }
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
              <span>
                £
              </span>

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
            <span>
              Status
            </span>

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
                ↻ For recurring
                maintenance, using
                “Mark as completed”
                from the Maintenance
                page will schedule the
                next occurrence
                automatically.
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


        {/* =================================
            DOCUMENTS & RECEIPTS
            OUTSIDE THE MAINTENANCE FORM
           ================================= */}

        <div className="documentsSection">

          <div className="documentsHeader">

            <div>
              <p className="eyebrow">
                DOCUMENTS & RECEIPTS
              </p>

              <h2>
                Files for this job
              </h2>

              <p>
                Keep receipts,
                invoices, warranties,
                manuals and photos
                with this maintenance
                record.
              </p>
            </div>

            <span className="documentsCount">
              {documents.length}
            </span>

          </div>


          <div className="documentUploadPanel">

            <label className="field">
              <span>
                Document type
              </span>

              <select
                value={
                  documentType
                }
                onChange={(event) =>
                  setDocumentType(
                    event.target.value
                  )
                }
              >
                {documentTypes.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {
                        item.label
                      }
                    </option>
                  )
                )}
              </select>
            </label>


            <label className="field">
              <span>
                Choose file
              </span>

              <input
                id="maintenanceDocumentFile"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                onChange={
                  handleFileChange
                }
              />

              <small className="documentHint">
               JPEG, PNG or PDF. Maximum 10 MB.
              </small>
            </label>


            {selectedFile && (
              <div className="selectedDocument">

                <span>
                  📎
                </span>

                <div>
                  <strong>
                    {
                      selectedFile.name
                    }
                  </strong>

                  <small>
                    {formatFileSize(
                      selectedFile.size
                    )}
                  </small>
                </div>

              </div>
            )}


            <button
              type="button"
              className="documentUploadButton"
              onClick={
                handleDocumentUpload
              }
              disabled={
                !selectedFile ||
                uploadingDocument
              }
            >
              {uploadingDocument
                ? "Uploading..."
                : "Upload document"}
            </button>

          </div>


          {documentError && (
            <p className="documentError">
              {documentError}
            </p>
          )}


          {documentMessage && (
            <p className="documentSuccess">
              {documentMessage}
            </p>
          )}


          {documentsLoading ? (
            <div className="documentsEmpty">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="documentsEmpty">

              <span>
                📄
              </span>

              <div>
                <strong>
                  No documents yet
                </strong>

                <p>
                  Files uploaded for
                  this maintenance job
                  will appear here.
                </p>
              </div>

            </div>
          ) : (
            <div className="documentsList">

              {documents.map(
                (documentItem) => (
                  <div
                    className="documentCard"
                    key={
                      documentItem.id
                    }
                  >

                    <div className="documentFileIcon">
                      {documentItem.file_type ===
                      "application/pdf"
                        ? "PDF"
                        : "📷"}
                    </div>


                    <div className="documentDetails">

                      <strong>
                        {
                          documentItem.file_name
                        }
                      </strong>

                      <div className="documentMeta">

                        <span>
                          {getDocumentTypeLabel(
                            documentItem.document_type
                          )}
                        </span>

                        <span>
                          {formatFileSize(
                            documentItem.file_size
                          )}
                        </span>

                      </div>

                    </div>


                    <div className="documentActions">

                      <button
                        type="button"
                        onClick={() =>
                          handleViewDocument(
                            documentItem
                          )
                        }
                      >
                        View
                      </button>


                      <button
                        type="button"
                        className="documentDeleteButton"
                        disabled={
                          deletingDocumentId ===
                          documentItem.id
                        }
                        onClick={() =>
                          handleDeleteDocument(
                            documentItem
                          )
                        }
                      >
                        {deletingDocumentId ===
                        documentItem.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </div>
    </main>
  );
}