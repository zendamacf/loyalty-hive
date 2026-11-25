import { useEffect, useState } from "react";

import { type AdminUser, listUsers, type UserStatus } from "./api";
import { Pager } from "./Pager";
import { usePagedList } from "./usePagedList";

/** Wait time after the last key press before the search runs. */
export const SEARCH_DEBOUNCE_MS = 300;

const STATUS_OPTIONS: { value: UserStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "pending_deletion", label: "Pending deletion" },
];

const VERIFIED_OPTIONS = [
  { value: "", label: "All" },
  { value: "true", label: "Verified" },
  { value: "false", label: "Unverified" },
] as const;

type VerifiedFilter = (typeof VERIFIED_OPTIONS)[number]["value"];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <tr>
      <td>{user.email}</td>
      <td>
        <time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time>
      </td>
      <td>{user.emailVerifiedAt ? "Yes" : "No"}</td>
      <td>
        {user.deletedAt ? (
          <span
            className="status status-pending_deletion"
            title={`Deleted at ${formatDate(user.deletedAt)}`}
          >
            pending deletion
          </span>
        ) : (
          <span className="status status-active">active</span>
        )}
      </td>
    </tr>
  );
}

export function UsersPage({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | "">("");
  const [verified, setVerified] = useState<VerifiedFilter>("");

  useEffect(() => {
    const timer = setTimeout(
      () => setSearch(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, error, loading, offset, previousPage, nextPage } =
    usePagedList<AdminUser>({
      load: (page) =>
        listUsers({
          search: search || undefined,
          status: status || undefined,
          verified: verified === "" ? undefined : verified === "true",
          ...page,
        }),
      filterKey: JSON.stringify([search, status, verified]),
      onUnauthorized,
      errorMessage: "Could not load users.",
    });

  return (
    <section>
      <div className="toolbar">
        <h2>Users</h2>
        <div className="filters">
          <label>
            Search email
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as UserStatus | "")
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Email
            <select
              value={verified}
              onChange={(event) =>
                setVerified(event.target.value as VerifiedFilter)
              }
            >
              {VERIFIED_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {data && data.items.length === 0 && !loading && (
        <p className="empty">No users.</p>
      )}

      {data && data.items.length > 0 && (
        <table aria-busy={loading}>
          <thead>
            <tr>
              <th scope="col">Email</th>
              <th scope="col">Signed up</th>
              <th scope="col">Verified</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((user) => (
              <UserRow key={user.id} user={user} />
            ))}
          </tbody>
        </table>
      )}

      <Pager
        offset={offset}
        total={data?.total ?? 0}
        loading={loading}
        loaded={data !== null}
        onPrevious={previousPage}
        onNext={nextPage}
      />
    </section>
  );
}
