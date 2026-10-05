"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";


export default function OnboardingPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [propertyName, setPropertyName] = useState("My Home");
  const [propertyType, setPropertyType] = useState("House");
  const [yearBuilt, setYearBuilt] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (!name.trim() || !propertyName.trim()) {
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="onboardingPage">
      <div className="onboardingCard">
        <div className="logo">
          <div className="logoMark">F</div>
          <span>FixIt Log</span>
        </div>

        <div className="onboardingHeader">
          <p className="eyebrow">LET'S SET THINGS UP</p>

          <h1>Tell us about your home.</h1>

          <p>
            Just a few details and you'll be ready to start keeping track of
            your home's maintenance.
          </p>
        </div>

        <form className="onboardingForm" onSubmit={handleSubmit}>
          <label className="field">
            <span>Your name</span>

            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              autoFocus
            />
          </label>

          <label className="field">
            <span>Property name</span>

            <input
              type="text"
              value={propertyName}
              onChange={(event) => setPropertyName(event.target.value)}
              placeholder="e.g. My Home"
            />
          </label>

          <div className="field">
            <span>Property type</span>

            <div className="propertyOptions">
              {["House", "Flat / Apartment", "Other"].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`propertyOption ${
                    propertyType === option ? "selected" : ""
                  }`}
                  onClick={() => setPropertyType(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>Year built <small>(optional)</small></span>

            <input
              type="number"
              value={yearBuilt}
              onChange={(event) => setYearBuilt(event.target.value)}
              placeholder="e.g. 1998"
              min="1800"
              max={new Date().getFullYear()}
            />
          </label>

          <button
            type="submit"
            className="primaryButton"
            disabled={!name.trim() || !propertyName.trim()}
          >
            Set up my home →
          </button>
        </form>

        <p className="onboardingFooter">
          You can change these details later.
        </p>
      </div>
    </main>
  );
}