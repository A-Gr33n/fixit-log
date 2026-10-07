"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";


const categories = [
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


const maxFileSize =
  10 * 1024 * 1024;


export default function EditRepairPage() {
  const params = useParams();
  const router = useRouter();

  const repairId = params.id;


  // REPAIR

  const [title, setTitle] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [repairDate, setRepairDate] =
    useState("");

  const [cost, setCost] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [completed, setCompleted] =
    useState(false);

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


  // LOAD REPAIR

  useEffect(() => {
    async function loadRepair() {
      try {
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError || !user) {
          setError(
            "You need to be signed in to edit a repair."
          );

          return;
        }

        const {
          data,
          error: loadError,
        } = await supabase
          .from("repairs")
          .select("*")
          .eq("id", repairId)
          .eq("user_id", user.id)
          .single();

        if (loadError) {
          console.error(
            "Could not load repair:",
            loadError
          );

          setError(
            "Could not find this repair."
          );

          return;
        }

        setTitle(
          data.title || ""
        );

        setCategory(
          data.category || ""
        );

        setRepairDate(
          data.repair_date || ""
        );

        setCost(
          data.cost !== null &&
          data.cost !== undefined
            ? String(data.cost)
            : ""
        );

        setNotes(
          data.notes || ""
        );

        setCompleted(
          Boolean(data.completed)
        );
      } catch (loadCatchError) {
        console.error(
          "Could not load repair:",
          loadCatchError
        );

        setError(
          "Something went wrong while loading the repair."
        );
      } finally {
        setLoading(false);
      }
    }

    if (repairId) {
      loadRepair();
    }
  }, [repairId]);


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
        .eq("repair_id", repairId)
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (loadError) {
        console.error(
          "Could not load repair documents:",
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
        "Could not load repair documents:",
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
    if (repairId) {
      loadDocuments();
    }
  }, [repairId]);


  // SAVE REPAIR

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError(
        "Please enter a repair title."
      );

      return;
    }

    if (!category) {
      setError(
        "Please choose a category."
      );

      return;
    }

    if (!repairDate) {
      setError(
        "Please enter the repair date."
      );

      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (userError || !user) {
        setError(
          "You need to be signed in to save this repair."
        );

        setSaving(false);
        return;
      }

      const {
        error: updateError,
      } = await supabase
        .from("repairs")
        .update({
          title:
            title.trim(),

          category,

          repair_date:
            repairDate,

          cost:
            cost === ""
              ? null
              : Number(cost),

          notes:
            notes.trim() ||
            null,

          completed,
        })
        .eq("id", repairId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error(
          "Could not update repair:",
          updateError
        );

        setError(
          "Could not save the repair. Please try again."
        );

        setSaving(false);
        return;
      }

      router.push(
        "/repairs"
      );
    } catch (saveError) {
      console.error(
        "Could not update repair:",
        saveError
      );

      setError(
        "Something went wrong. Please try again."
      );

      setSaving(false);
    }
  }


  // CHOOSE DOCUMENT

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

    let uploadedPath = null;

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


      // Make the filename safe for Storage.

      const safeFileName =
        selectedFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );


      // Give every upload a unique name.

      const uniqueFileName =
        `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;


      // IMPORTANT:
      // first folder is the user's ID.
      // This matches the Storage security policies.

      const filePath =
        `${user.id}/repair/${repairId}/${uniqueFileName}`;


      // Upload the actual file.

      const {
        error: uploadError,
      } = await supabase.storage
        .from("home-documents")
        .upload(
          filePath,
          selectedFile,
          {
            cacheControl: "3600",
            upsert: false,
            contentType:
              selectedFile.type,
          }
        );


      if (uploadError) {
        console.error(
          "Could not upload repair document:",
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


      uploadedPath = filePath;


      // Save the file information
      // in the documents table.

      const {
        error: insertError,
      } = await supabase
        .from("documents")
        .insert({
          user_id:
            user.id,

          maintenance_id:
            null,

          repair_id:
            repairId,

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
          "Could not save repair document record:",
          insertError
        );


        // Remove the Storage file if
        // the database row failed.

        await supabase.storage
          .from("home-documents")
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


      // Clear the upload box.

      setSelectedFile(null);

      setDocumentType(
        "receipt"
      );


      const fileInput =
        document.getElementById(
          "repairDocumentFile"
        );

      if (fileInput) {
        fileInput.value = "";
      }


      setDocumentMessage(
        "Document uploaded successfully."
      );


      // Refresh document list.

      await loadDocuments();

    } catch (uploadCatchError) {
      console.error(
        "Could not upload repair document:",
        uploadCatchError
      );


      // Clean up Storage if needed.

      if (uploadedPath) {
        await supabase.storage
          .from("home-documents")
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
        .from("home-documents")
        .createSignedUrl(
          documentItem.file_path,
          60
        );


      if (
        signedUrlError ||
        !data?.signedUrl
      ) {
        console.error(
          "Could not open repair document:",
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
        "Could not open repair document:",
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
      // Delete actual file first.

      const {
        error: storageError,
      } = await supabase.storage
        .from("home-documents")
        .remove([
          documentItem.file_path,
        ]);


      if (storageError) {
        console.error(
          "Could not delete repair file:",
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


      // Delete database record.

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
          "Could not delete repair document record:",
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
        "Could not delete repair document:",
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


  // FILE SIZE

  function formatFileSize(bytes) {
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


  // DOCUMENT TYPE LABEL

  function getDocumentTypeLabel(
    value
  ) {
    return (
      documentTypes.find(
        (item) =>
          item.value === value
      )?.label ||
      "Other"
    );
  }


  // LOADING

  if (loading) {
    return (
      <main className="formPage">

        <div className="formContainer">

          <Link
            href="/repairs"
            className="backLink"
          >
            ← Repairs
          </Link>

          <div className="formHeader">

            <p className="eyebrow">
              YOUR HOME
            </p>

            <h1>
              Edit repair
            </h1>

            <p>
              Update the details of
              your repair.
            </p>

          </div>

          <div className="maintenanceForm">
            <p>
              Loading repair...
            </p>
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
          ← Repairs
        </Link>


        <header className="formHeader">

          <p className="eyebrow">
            YOUR HOME
          </p>

          <h1>
            Edit repair
          </h1>

          <p>
            Update the details of
            your repair.
          </p>

        </header>


        {/* ================================
            REPAIR FORM
            ================================ */}

        <form
          className="maintenanceForm"
          onSubmit={handleSubmit}
        >

          {/* REPAIR TITLE */}

          <div className="field">

            <label htmlFor="title">
              Repair title
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="e.g. Boiler repair"
              required
            />

          </div>


          {/* CATEGORY */}

          <div className="field">

            <label>
              Category
            </label>

            <div className="categoryGrid">

              {categories.map(
                (option) => (

                  <button
                    key={option}
                    type="button"
                    className={`categoryOption ${
                      category === option
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setCategory(
                        option
                      )
                    }
                  >
                    {option}
                  </button>

                )
              )}

            </div>

          </div>


          {/* REPAIR DATE */}

          <div className="field">

            <label htmlFor="repairDate">
              Repair date
            </label>

            <input
              id="repairDate"
              type="date"
              value={repairDate}
              onChange={(event) =>
                setRepairDate(
                  event.target.value
                )
              }
              required
            />

          </div>


          {/* COST */}

          <div className="field">

            <label htmlFor="cost">
              Cost (£)
            </label>

            <div className="costInput">

              <span>
                £
              </span>

              <input
                id="cost"
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

          </div>


          {/* NOTES */}

          <div className="field">

            <label htmlFor="notes">
              Notes
            </label>

            <textarea
              id="notes"
              rows="5"
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              placeholder="Add any useful details about the repair..."
            />

          </div>


          {/* COMPLETION STATUS */}

          <div className="field">

            <label>
              Repair status
            </label>

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

          </div>


          {/* ERROR */}

          {error && (
            <p className="formError">
              {error}
            </p>
          )}


          {/* BUTTONS */}

          <div className="formActions">

            <button
              type="submit"
              className="primaryButton"
              disabled={saving}
            >
              {saving
                ? "Saving changes..."
                : "Save changes"}
            </button>


            <Link
              href="/repairs"
              className="secondaryButton"
            >
              Cancel
            </Link>

          </div>

        </form>


        {/* ================================
            DOCUMENTS & RECEIPTS

            IMPORTANT:
            This is outside the repair form.
            ================================ */}

        <div className="documentsSection">

          <div className="documentsHeader">

            <div>

              <p className="eyebrow">
                DOCUMENTS & RECEIPTS
              </p>

              <h2>
                Files for this repair
              </h2>

              <p>
                Keep receipts,
                invoices, warranties,
                manuals and photos
                with this repair
                record.
              </p>

            </div>


            <span className="documentsCount">
              {documents.length}
            </span>

          </div>


          {/* UPLOAD BOX */}

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
                      {item.label}
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
                id="repairDocumentFile"
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


            {/* SELECTED FILE */}

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


            {/* UPLOAD BUTTON */}

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


          {/* DOCUMENT ERROR */}

          {documentError && (

            <p className="documentError">
              {documentError}
            </p>

          )}


          {/* DOCUMENT SUCCESS */}

          {documentMessage && (

            <p className="documentSuccess">
              {documentMessage}
            </p>

          )}


          {/* DOCUMENT LIST */}

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
                  this repair will
                  appear here.
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