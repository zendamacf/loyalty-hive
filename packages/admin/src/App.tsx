import { useCallback, useEffect, useState } from "react";

import { type Admin, getMe, logout } from "./api";
import { BrandRequestsPage } from "./BrandRequestsPage";
import { LoginPage } from "./LoginPage";

type Session =
  | { state: "loading" }
  | { state: "anonymous" }
  | { state: "admin"; admin: Admin };

export function App() {
  const [session, setSession] = useState<Session>({ state: "loading" });
  const [logoutError, setLogoutError] = useState(false);

  useEffect(() => {
    getMe()
      .then((admin) => setSession({ state: "admin", admin }))
      .catch(() => setSession({ state: "anonymous" }));
  }, []);

  const handleUnauthorized = useCallback(() => {
    setSession({ state: "anonymous" });
  }, []);

  async function handleLogout() {
    setLogoutError(false);
    try {
      await logout();
      setSession({ state: "anonymous" });
    } catch {
      // The cookie may still be valid, so do not show the login page.
      setLogoutError(true);
    }
  }

  if (session.state === "loading") {
    return <p className="loading">Loading…</p>;
  }

  if (session.state === "anonymous") {
    return (
      <LoginPage onLogin={(admin) => setSession({ state: "admin", admin })} />
    );
  }

  return (
    <>
      <header className="app-header">
        <h1>LoyaltyHive Admin</h1>
        <span className="who">{session.admin.email}</span>
        <button type="button" onClick={handleLogout}>
          Log out
        </button>
      </header>
      {logoutError && (
        <p className="error banner" role="alert">
          Could not log out. Try again.
        </p>
      )}
      <main>
        <BrandRequestsPage onUnauthorized={handleUnauthorized} />
      </main>
    </>
  );
}
