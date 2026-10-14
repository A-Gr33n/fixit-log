
export const metadata = {
  title: "Privacy Policy | FixIt Log",
  description: "Learn how FixIt Log handles and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <main style={{
      maxWidth: "850px",
      margin: "0 auto",
      padding: "40px 20px",
      lineHeight: "1.8",
      color: "#1f2937",
    }}>
      <h1>Privacy Policy</h1>

      <p><strong>FixIt Log</strong></p>
      <p><strong>Last updated:</strong> 14 October 2026</p>

      <h2>1. Who We Are</h2>
      <p>
        FixIt Log is a home maintenance tracking website operated by
        Aaron Green, an individual based in the United Kingdom.
        The operator is the data controller for personal information
        collected through FixIt Log.
      </p>
      <p>
        For privacy questions, contact{" "}
        <a href="mailto:privacy@fixit-log.co.uk">
          privacy@fixit-log.co.uk
        </a>.
      </p>

      <h2>2. Information We Collect</h2>
      <ul>
        <li>Account information, including your email address.</li>
        <li>Home information you choose to enter.</li>
        <li>Maintenance tasks, dates, notes and repair records.</li>
        <li>Uploaded photos, receipts, warranties and documents.</li>
        <li>Technical information such as IP addresses and server logs.</li>
      </ul>
      <p>
        Please avoid uploading unnecessary sensitive personal or
        financial information.
      </p>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To create and manage your account.</li>
        <li>To let you sign in securely.</li>
        <li>To save and display your maintenance and repair records.</li>
        <li>To store and retrieve documents you upload.</li>
        <li>To send essential account emails.</li>
        <li>To maintain website security and reliability.</li>
        <li>To respond to support and privacy requests.</li>
      </ul>
      <p>
        We do not currently send marketing emails or maintenance
        reminder emails.
      </p>

      <h2>4. Legal Basis for Processing</h2>
      <p>
        Under UK data protection law, we rely on contractual necessity
        to provide the service, legitimate interests to maintain
        security and reliability, and legal obligations where applicable.
        We will seek consent where the law requires it.
      </p>

      <h2>5. Service Providers</h2>
      <ul>
        <li>
          <strong>Supabase:</strong> Account authentication, database
          storage and uploaded file storage. Our Supabase project is
          hosted in Ireland.
        </li>
        <li>
          <strong>Vercel:</strong> Website hosting and related
          technical processing.
        </li>
        <li>
          <strong>Resend:</strong> Delivery of account-related emails.
        </li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>6. Uploaded Documents</h2>
      <p>
        Documents and photos are intended to be private to the account
        that uploaded them. We use authentication and access controls
        to help protect your information. No online service can
        guarantee absolute security.
      </p>

      <h2>7. How Long We Keep Information</h2>
      <p>
        We generally keep your account information, maintenance
        records, repair records and uploaded documents while your
        account remains active.
      </p>
      <p>
        When you permanently delete your account, FixIt Log is designed
        to delete its associated records and uploaded documents.
        Some information may remain temporarily in provider backups
        or security logs, or where retention is legally required.
      </p>

      <h2>8. Deleting Your Account</h2>
      <p>
        You can permanently delete your account through the Settings
        page. Account deletion is irreversible.
      </p>
      <p>
        You can also contact privacy@fixit-log.co.uk with questions
        about deleting your information.
      </p>

      <h2>9. Your Privacy Rights</h2>
      <p>
        Depending on the circumstances, you may have rights to access,
        correct, delete, restrict or receive a copy of your personal
        information, and to object to certain processing.
      </p>
      <p>
        To exercise your rights, email{" "}
        <a href="mailto:privacy@fixit-log.co.uk">
          privacy@fixit-log.co.uk
        </a>.
      </p>
      <p>
        You can also complain to the UK Information Commissioner's
        Office at{" "}
        <a href="https://ico.org.uk">
          ico.org.uk
        </a>.
      </p>

      <h2>10. Cookies and Tracking</h2>
      <p>
        FixIt Log uses technology needed for website operation and
        account sign-in. We do not currently use advertising tracking,
        affiliate tracking or visitor analytics.
      </p>

      <h2>11. International Data Transfers</h2>
      <p>
        Our Supabase project is hosted in Ireland. Other service
        providers may process information in different countries.
        Where required, appropriate data protection safeguards apply.
      </p>

      <h2>12. Children's Privacy</h2>
      <p>
        FixIt Log is not specifically designed for children.
        Please contact us if you believe a child has provided
        personal information inappropriately.
      </p>

      <h2>13. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy as the website changes.
        The date at the top will be updated when changes are made.
      </p>

      <h2>14. Contact</h2>
      <p>
        <strong>FixIt Log</strong>
        <br />
        Operator: Aaron Green
        <br />
        United Kingdom
        <br />
        Email:{" "}
        <a href="mailto:privacy@fixit-log.co.uk">
          privacy@fixit-log.co.uk
        </a>
      </p>
    </main>
  );
}
