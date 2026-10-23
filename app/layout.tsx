
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FixIt Log",
  description:
    "Keep track of home maintenance, repairs and important documents in one place.",
  verification: {
    google: <meta name="google-site-verification" content="4ADXsI7fyGi_PivIZf-uo9m3Df0GrwKz-cVvO2AMZZ0" />,
  },
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex-1">{children}</div>
      
<footer
  style={{
    width: "100%",
    boxSizing: "border-box",
    padding: "28px 20px",
    backgroundColor: "#f8faf9",
    borderTop: "1px solid #e2e8e5",
    textAlign: "center",
    color: "#475569",
    fontSize: "14px",
  }}
>
  <div
    style={{
      maxWidth: "1100px",
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "12px",
    }}
  >
    <p
      style={{
        margin: 0,
        fontSize: "17px",
        fontWeight: 700,
        color: "#26332d",
      }}
    >
      FixIt Log
    </p>

    <p style={{ margin: 0 }}>
      Keep your home maintenance organised.
    </p>

    <nav
      aria-label="Footer navigation"
      style={{
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "24px",
      }}
    >
      <Link
        href="/privacy"
        style={{
          color: "#26332d",
          textDecoration: "underline",
        }}
      >
        Privacy Policy
      </Link>

      <a
        href="mailto:privacy@fixit-log.co.uk"
        style={{
          color: "#26332d",
          textDecoration: "underline",
        }}
      >
        Contact
      </a>
    </nav>

    <p
      style={{
        margin: 0,
        fontSize: "12px",
        color: "#64748b",
      }}
    >
      © {new Date().getFullYear()} FixIt Log
    </p>
  </div>
</footer>

      </body>
    </html>
  );
}

