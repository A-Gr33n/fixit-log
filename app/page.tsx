import Link from "next/link";

export default function Home() {
  return (
    <main className="welcomePage">
      <div className="welcomeCard">
        <div className="logo">
          <div className="logoMark">F</div>
          <span>FixIt Log</span>
        </div>

        <div className="welcomeContent">
          <p className="eyebrow">YOUR HOME, ORGANISED</p>

          <h1>Never forget what your home needs.</h1>

          <p className="welcomeSubtitle">
            Keep track of repairs, servicing, maintenance and costs —
            all in one place.
          </p>

          <div className="welcomeFeatures">
            <div className="feature">
              <span>🔧</span>

              <div>
                <strong>Track repairs</strong>
                <small>Keep a record of work that needs doing.</small>
              </div>
            </div>

            <div className="feature">
              <span>📅</span>

              <div>
                <strong>Remember maintenance</strong>
                <small>Know what's coming up and what's overdue.</small>
              </div>
            </div>

            <div className="feature">
              <span>💷</span>

              <div>
                <strong>Keep track of costs</strong>
                <small>See what you've spent maintaining your home.</small>
              </div>
            </div>
          </div>

         <div className="welcomeActions">
  <Link
    href="/signup"
    className="primaryButton welcomeSignupButton"
  >
    Create my FixIt Log →
  </Link>

  <Link
    href="/login"
    className="signInButton welcomeSignInButton"
  >
    Already have an account? Sign in
  </Link>
</div>
        </div>

        <p className="welcomeFooter">
          A simple place to keep your home's history.
        </p>
      </div>
    </main>
  );
}