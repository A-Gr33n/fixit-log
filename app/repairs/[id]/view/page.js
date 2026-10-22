
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

const documentTypeLabels = {
  receipt: "Receipt",
  invoice: "Invoice",
  warranty: "Warranty",
  manual: "Manual",
  photo: "Photo",
  other: "Other",
};

function formatDate(dateString) {
  if (!dateString) return "Not recorded";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatCost(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not recorded";
  }

  return `£${Number(value).toFixed(2)}`;
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ViewRepairPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [repair, setRepair] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] =
    useState(true);

  const [error, setError] = useState("");
  const [documentError, setDocumentError] =
    useState("");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadRepair() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (cancelled) return;

        if (userError || !user) {
          router.push("/");
          return;
        }

        const {
          data,
          error: loadError,
        } = await supabase
          .from("repairs")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (cancelled) return;

        if (loadError || !data) {
          setError("We couldn't find this repair.");
          return;
        }

        setRepair(data);

        const {
          data: documentData,
          error: documentsError,
        } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .eq("repair_id", id)
          .order("created_at", {
            ascending: false,
          });

        if (cancelled) return;

        if (documentsError) {
          console.error(
            "Could not load repair documents:",
            documentsError
          );

          setDocumentError(
            "We couldn't load the attached files."
          );
        } else {
          setDocuments(documentData || []);
        }
      } catch (loadError) {
        console.error(
          "Could not load repair:",
          loadError
        );

        if (!cancelled) {
          setError(
            "Something went wrong loading this repair."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setDocumentsLoading(false);
        }
      }
    }

    loadRepair();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  async function handleViewDocument(documentItem) {
    setDocumentError("");

    // Open a blank tab immediately so mobile
    // browsers recognise the user's tap.
    const newTab = window.open(
      "about:blank",
      "_blank"
    );

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

      if (signedUrlError || !data?.signedUrl) {
        if (newTab && !newTab.closed) {
          newTab.close();
        }

        console.error(
          "Could not open repair document:",
          signedUrlError
        );

        setDocumentError(
          "We couldn't open that file. Please try again."
        );

        return;
      }

      if (newTab && !newTab.closed) {
        newTab.opener = null;
        newTab.location.replace(
          data.signedUrl
        );
      } else {
        window.location.assign(
          data.signedUrl
        );
      }
    } catch (viewError) {
      if (newTab && !newTab.closed) {
        newTab.close();
      }

      console.error(
        "Could not open repair document:",
        viewError
      );

      setDocumentError(
        "Something went wrong opening the file."
      );
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

  if (error || !repair) {
    return (
      <main className="formPage">
        <div className="formContainer">
          <Link
            href="/repairs"
            className="backLink"
          >
            ← Back to repairs
          </Link>

          <p className="formError">
            {error || "Repair not found."}
          </p>
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
          <p className="eyebrow">
            YOUR HOME
          </p>

          <h1>{repair.title}</h1>

          <p>
            View your repair details and
            saved documents.
          </p>
        </div>

        {/* REPAIR DETAILS */}

        <section className="maintenanceForm">
          <div className="field">
            <span>Category</span>
            <strong>
              {repair.category || "Not recorded"}
            </strong>
          </div>

          <div className="field">
            <span>Status</span>
            <strong>
              {repair.completed
                ? "Completed"
                : "Open"}
            </strong>
          </div>

          <div className="field">
            <span>Repair date</span>
            <strong>
              {formatDate(repair.repair_date)}
            </strong>
          </div>

          <div className="field">
            <span>Cost</span>
            <strong>
              {formatCost(repair.cost)}
            </strong>
          </div>

          <div className="field">
            <span>Notes</span>

            <p
              style={{
                whiteSpace: "pre-wrap",
              }}
            >
              {repair.notes || "No notes added."}
            </p>
          </div>

          <Link
            href={`/repairs/${id}/edit`}
            className="primaryButton"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Edit repair →
          </Link>
        </section>

        {/* DOCUMENTS & RECEIPTS */}

        <section className="documentsSection">
          <div className="documentsHeader">
            <div>
              <p className="eyebrow">
                DOCUMENTS & RECEIPTS
              </p>

              <h2>
                Files for this job
              </h2>

              <p>
                View your saved photos,
                receipts, invoices,
                warranties and manuals.
              </p>
            </div>

            <span className="documentsCount">
              {documents.length}
            </span>
          </div>

          {documentError && (
            <p className="documentError">
              {documentError}
            </p>
          )}

          {documentsLoading ? (
            <div className="documentsEmpty">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="documentsEmpty">
              <span>📄</span>

              <div>
                <strong>
                  No documents yet
                </strong>

                <p>
                  Any files attached to
                  this repair will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="documentsList">
              {documents.map(
                (documentItem) => (
                  <div
                    className="documentCard"
                    key={documentItem.id}
                  >
                    <div className="documentFileIcon">
                      {documentItem.file_type ===
                      "application/pdf"
                        ? "PDF"
                        : "📷"}
                    </div>

                    <div className="documentDetails">
                      <strong>
                        {documentItem.file_name}
                      </strong>

                      <div className="documentMeta">
                        <span>
                          {documentTypeLabels[
                            documentItem.document_type
                          ] || "Other"}
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
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
