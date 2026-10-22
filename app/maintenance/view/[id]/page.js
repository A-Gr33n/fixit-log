
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
  if (value === null || value === undefined || value === "") {
    return "Not recorded";
  }

  return `£${Number(value).toFixed(2)}`;
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);

  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getRepeatLabel(months) {
  const value = Number(months);

  if (!value) return "Repeat interval not recorded";
  if (value === 1) return "Every month";
  if (value === 12) return "Every year";
  if (value === 24) return "Every 2 years";

  return `Every ${value} months`;
}

function getStatus(item) {
  if (item.completed) return "Completed";
  if (!item.due_date) return "Upcoming";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${item.due_date}T00:00:00`);

  return dueDate < today ? "Overdue" : "Upcoming";
}

export default function ViewMaintenancePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [maintenance, setMaintenance] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [error, setError] = useState("");
  const [documentError, setDocumentError] = useState("");

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadRecord() {
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

        const { data, error: loadError } = await supabase
          .from("maintenance")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

        if (cancelled) return;

        if (loadError || !data) {
          setError("We couldn't find this maintenance item.");
          return;
        }

        setMaintenance(data);

        const {
          data: documentData,
          error: documentsError,
        } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .eq("maintenance_id", id)
          .order("created_at", { ascending: false });

        if (cancelled) return;

        if (documentsError) {
          console.error(
            "Could not load maintenance documents:",
            documentsError
          );
          setDocumentError("We couldn't load the attached files.");
        } else {
          setDocuments(documentData || []);
        }
      } catch (loadError) {
        console.error("Could not load maintenance:", loadError);

        if (!cancelled) {
          setError("Something went wrong loading this record.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setDocumentsLoading(false);
        }
      }
    }

    loadRecord();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  async function handleViewDocument(documentItem) {
    setDocumentError("");

    // Open the tab immediately so mobile browsers allow it.
    const newTab = window.open("about:blank", "_blank");

    try {
      const { data, error: signedUrlError } =
        await supabase.storage
          .from("home-documents")
          .createSignedUrl(documentItem.file_path, 60);

      if (signedUrlError || !data?.signedUrl) {
        if (newTab && !newTab.closed) newTab.close();

        console.error(
          "Could not open maintenance document:",
          signedUrlError
        );

        setDocumentError(
          "We couldn't open that file. Please try again."
        );
        return;
      }

      if (newTab && !newTab.closed) {
        newTab.opener = null;
        newTab.location.replace(data.signedUrl);
      } else {
        window.location.assign(data.signedUrl);
      }
    } catch (viewError) {
      if (newTab && !newTab.closed) newTab.close();

      console.error(
        "Could not open maintenance document:",
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
            Loading maintenance...
          </div>
        </div>
      </main>
    );
  }

  if (error || !maintenance) {
    return (
      <main className="formPage">
        <div className="formContainer">
          <Link href="/maintenance" className="backLink">
            ← Back to maintenance
          </Link>

          <p className="formError">
            {error || "Maintenance item not found."}
          </p>
        </div>
      </main>
    );
  }

  const status = getStatus(maintenance);

  return (
    <main className="formPage">
      <div className="formContainer">
        <Link href="/maintenance" className="backLink">
          ← Back to maintenance
        </Link>

        <div className="formHeader">
          <p className="eyebrow">YOUR HOME</p>
          <h1>{maintenance.title}</h1>
          <p>
            View your maintenance details and saved documents.
          </p>
        </div>

        <section className="maintenanceForm">
          <div className="field">
            <span>Category</span>
            <strong>{maintenance.category || "Not recorded"}</strong>
          </div>

          <div className="field">
            <span>Status</span>
            <strong>{status}</strong>
          </div>

          <div className="field">
            <span>Due date</span>
            <strong>{formatDate(maintenance.due_date)}</strong>
          </div>

          <div className="field">
            <span>Maintenance type</span>
            <strong>
              {maintenance.recurring
                ? "Recurring maintenance"
                : "One-off maintenance"}
            </strong>
          </div>

          {maintenance.recurring && (
            <div className="field">
              <span>Repeat schedule</span>
              <strong>
                {getRepeatLabel(maintenance.repeat_months)}
              </strong>
            </div>
          )}

          {maintenance.last_completed_date && (
            <div className="field">
              <span>Last completed</span>
              <strong>
                {formatDate(maintenance.last_completed_date)}
              </strong>
            </div>
          )}

          <div className="field">
            <span>Estimated cost</span>
            <strong>
              {formatCost(maintenance.estimated_cost)}
            </strong>
          </div>

          <div className="field">
            <span>Notes</span>
            <p style={{ whiteSpace: "pre-wrap" }}>
              {maintenance.notes || "No notes added."}
            </p>
          </div>

          <Link
        href={`/maintenance/edit/${id}`}
       className="primaryButton"
        style={{
        display: "flex",
         alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        textDecoration: "none",
        }}
      >
      Edit maintenance →
</Link>
        </section>

        <section className="documentsSection">
          <div className="documentsHeader">
            <div>
              <p className="eyebrow">DOCUMENTS & RECEIPTS</p>
              <h2>Files for this job</h2>
              <p>
                View your saved photos, receipts, invoices,
                warranties and manuals.
              </p>
            </div>

            <span className="documentsCount">
              {documents.length}
            </span>
          </div>

          {documentError && (
            <p className="documentError">{documentError}</p>
          )}

          {documentsLoading ? (
            <div className="documentsEmpty">
              Loading documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="documentsEmpty">
              <span>📄</span>
              <div>
                <strong>No documents yet</strong>
                <p>
                  Any files attached to this maintenance
                  record will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="documentsList">
              {documents.map((documentItem) => (
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
                        handleViewDocument(documentItem)
                      }
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
