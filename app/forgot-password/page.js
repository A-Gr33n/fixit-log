
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );

      if (resetError) {
        setError(
          "We couldn't send the reset email right now. Please try again shortly."
        );
        setLoading(false);
        return;
      }

      setSuccess(
        "If an account exists with this email address, you'll receive a password-reset link shortly. Please check your inbox and junk folder."
      );
    } catch (error) {
      setError(
        "Something went wrong. Please try again shortly."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="onboardingPage">
      <div className="onboardingCard">
        <div className="logo">
          <div className="logoMark">F</div>
          <span>FixIt Log</span>
        </div>

        <div className="onboardingHeader">
          <p className="eyebrow">ACCOUNT RECOVERY</p>

          <h1>Forgot your password?</h1>

          <p>
            Enter your email address and we'll send you
            a secure link to reset your password.
          </p>
        </div>

        <form
          className="onboardingForm"
          onSubmit={handleSubmit}
        >
          <label className="field">
            <span>Email address</span>

            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
                setSuccess("");
              }}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
              required
            />
          </label>

          {error && (
            <p className="formError" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="formSuccess" role="status">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="primaryButton"
            disabled={loading || !email.trim()}
          >
            {loading
              ? "Sending reset link..."
              : "Send reset link →"}
          </button>
        </form>

        <p className="onboardingFooter">
          Remembered your password?{" "}
          <Link href="/login" className="textLink">
            Back to sign in
          </Link>
        </p>

        <p className="onboardingFooter">
          <Link href="/" className="textLink">
            ← Back to FixIt Log
          </Link>
        </p>
      </div>
    </main>
  );
}
