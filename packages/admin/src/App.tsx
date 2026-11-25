import { useCallback, useEffect, useState } from "react";
import { AppTitle } from "./AppTitle";
import { type Admin, getMe, logout } from "./api";
import { BrandRequestsPage } from "./BrandRequestsPage";
import { LoginPage } from "./LoginPage";
import { pathForRoute, type Route, useRoute } from "./router";
import { UsersPage } from "./UsersPage";

const NAV: { route: Route; label: string }[] = [
  { route: "brand-requests", label: "Brand requests" },
  { route: "users", label: "Users" },
];

type Session =
  | { state: "loading" }
  | { state: "anonymous" }
  | { state: "admin"; admin: Admin };

export function App() {
  const [session, setSession] = useState<Session>({ state: "loading" });
  const [logoutError, setLogoutError] = useState(false);
  const [route, navigate] = useRoute();

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
        <AppTitle />
        <nav className="main-nav" aria-label="Main">
          {NAV.map((item) => (
            <a
              key={item.route}
              href={pathForRoute(item.route)}
              aria-current={route === item.route ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                navigate(item.route);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
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
        {route === "users" ? (
          <UsersPage onUnauthorized={handleUnauthorized} />
        ) : (
          <BrandRequestsPage onUnauthorized={handleUnauthorized} />
        )}
      </main>
    </>
  );
}
