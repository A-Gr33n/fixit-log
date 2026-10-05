"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="onboardingPage">
      <div className="onboardingCard">
        <div className="logo">
          <div className="logoMark">F</div>
          <span>FixIt Log</span>
        </div>

        <div className="onboardingHeader">
          <p className="eyebrow">WELCOME BACK</p>

          <h1>Sign in to FixIt Log.</h1>

          <p>
            Pick up where you left off and keep your home organised.
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
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span>Password</span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="formError">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primaryButton"
            disabled={
              loading ||
              !email.trim() ||
              !password
            }
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>
        </form>

        <p className="onboardingFooter">
          Don't have an account?{" "}
          <Link href="/signup" className="textLink">
            Create one
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