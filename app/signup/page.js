"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";


export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    console.log("========== SIGNUP BUTTON CLICKED ==========");

    setError("");
    setSuccess("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords don't match.");
      return;
    }

    setLoading(true);

    console.log("Sending signup request to Supabase...");

    try {
      const {
        data,
        error: signUpError,
      } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (signUpError) {
        console.error("========== SIGNUP ERROR ==========");
        console.error("Message:", signUpError.message);
        console.error("Status:", signUpError.status);
        console.error("Code:", signUpError.code);
        console.error("===================================");

      if (signUpError.code === "user_already_exists") {
  setError(
    "An account with this email already exists. Please sign in instead."
  );
} else {
  setError(
    signUpError.message ||
      "We couldn't create your account. Please try again."
  );
}

        setLoading(false);
        return;
      }

      console.log("========== SIGNUP SUCCESS ==========");
      console.log("User:", data.user);
      console.log("Session:", data.session);
      console.log("====================================");

      if (!data.user) {
        setError(
          "Supabase did not return a user. Please try again."
        );

        setLoading(false);
        return;
      }

      if (!data.session) {
        setSuccess(
          "Account created successfully. Please check your email to confirm your account, then sign in."
        );

        setLoading(false);
        return;
      }

      console.log("Account created and signed in.");
      console.log("Going to onboarding...");

      router.push("/onboarding");
    } catch (error) {
      console.error("========== SIGNUP FAILED ==========");
      console.error(error);
      console.error("===================================");

      setError(
        "Something went wrong while creating your account. Please try again."
      );

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
          <p className="eyebrow">GET STARTED</p>

          <h1>Create your FixIt Log.</h1>

          <p>
            Create an account and start keeping your home's
            history in one place.
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

          <label className="field">
            <span>Password</span>

            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
                setSuccess("");
              }}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
          </label>

          <label className="field">
            <span>Confirm password</span>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError("");
                setSuccess("");
              }}
              placeholder="Enter your password again"
              autoComplete="new-password"
              required
            />
          </label>

          {error && (
            <p className="formError">
              {error}
            </p>
          )}

          {success && (
            <p className="formSuccess">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="primaryButton"
            onClick={() => {
              console.log("CREATE ACCOUNT CLICKED");
            }}
          >
            {loading
              ? "Creating account..."
              : "Create account →"}
          </button>
        </form>

        <p className="onboardingFooter">
          Already have an account?{" "}
          <Link
            href="/login"
            className="textLink"
          >
            Sign in
          </Link>
        </p>

        <p className="onboardingFooter">
          <Link
            href="/"
            className="textLink"
          >
            ← Back to FixIt Log
          </Link>
        </p>
      </div>
    </main>
  );
}