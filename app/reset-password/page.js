
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [checkingLink, setCheckingLink] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function checkRecoveryLink() {
      const url = new URL(window.location.href);

      const errorDescription =
        url.searchParams.get("error_description");

      if (errorDescription) {
        if (active) {
          setError(
            "This password-reset link is invalid or has expired. Please request a new one."
          );
          setCheckingLink(false);
        }
        return;
      }

      const code = url.searchParams.get("code");

      if (code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          if (active) {
            setError(
              "This password-reset link is invalid or has expired. Please request a new one."
            );
            setCheckingLink(false);
          }
          return;
        }

        window.history.replaceState(
          {},
          "",
          window.location.pathname
        );
      }

      const { data, error: sessionError } =
        await supabase.auth.getSession();

      if (!active) return;

      if (sessionError || !data.session) {
        setError(
          "Your password-reset link is invalid or has expired. Please request a new one."
        );
        setCanReset(false);
      } else {
        setCanReset(true);
      }

      setCheckingLink(false);
    }

    checkRecoveryLink();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError(
        "Your new password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        setError(
          updateError.message ||
            "We couldn't update your password. Please try again."
        );
        return;
      }

      setSuccess(
        "Your password has been updated successfully. You can now sign in."
      );

      setCanReset(false);
      setPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch {
      setError(
        "Something went wrong. Please try again."
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

          <h1>Create a new password.</h1>

          <p>
            Choose a new password for your FixIt Log
            account.
          </p>
        </div>

        {checkingLink && (
          <p>Checking your password-reset link...</p>
        )}

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

        {!checkingLink && canReset && (
          <form
            className="onboardingForm"
            onSubmit={handleSubmit}
          >
            <label className="field">
              <span>New password</span>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <label className="field">
              <span>Confirm new password</span>

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                placeholder="Enter your new password again"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </label>

            <button
              type="submit"
              className="primaryButton"
              disabled={loading}
            >
              {loading
                ? "Updating password..."
                : "Update password →"}
            </button>
          </form>
        )}

        {!checkingLink && !canReset && !success && (
          <p className="onboardingFooter">
            <Link
              href="/forgot-password"
              className="textLink"
            >
              Request a new reset link
            </Link>
          </p>
        )}

        <p className="onboardingFooter">
          <Link href="/login" className="textLink">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
