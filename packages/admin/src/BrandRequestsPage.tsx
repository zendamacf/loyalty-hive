import { useEffect, useState } from "react";

import {
  type AdminBrandRequest,
  ApiError,
  type BrandRequestList,
  type BrandRequestStatus,
  listBrandRequests,
} from "./api";

export const PAGE_SIZE = 50;

const STATUS_OPTIONS: { value: BrandRequestStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

/** Shows a link only for http(s) URLs. Other values are user input, so show them as text. */
function RequestUrl({ url }: { url: string }) {
  let safe = false;
  try {
    const { protocol } = new URL(url);
    safe = protocol === "http:" || protocol === "https:";
  } catch {
    safe = false;
  }
  if (!safe) return <span>{url}</span>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {url}
    </a>
  );
}

function RequestRow({ request }: { request: AdminBrandRequest }) {
  return (
    <tr>
      <td>
        <time dateTime={request.createdAt}>
          {new Date(request.createdAt).toLocaleString()}
        </time>
      </td>
      <td>{request.requestedName}</td>
      <td className="url">
        <RequestUrl url={request.url} />
      </td>
      <td>{request.notes ?? ""}</td>
      <td>
        <span className={`status status-${request.status}`}>
          {request.status}
        </span>
      </td>
      <td>{request.user.email}</td>
    </tr>
  );
}

export function BrandRequestsPage({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
  const [status, setStatus] = useState<BrandRequestStatus | "">("pending");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<BrandRequestList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listBrandRequests({
      status: status || undefined,
      limit: PAGE_SIZE,
      offset,
    })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          onUnauthorized();
          return;
        }
        setError("Could not load brand requests.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, offset, onUnauthorized]);

  const total = data?.total ?? 0;
  const first = total === 0 ? 0 : offset + 1;
  const last = Math.min(offset + PAGE_SIZE, total);

  return (
    <section>
      <div className="toolbar">
        <h2>Brand requests</h2>
        <label>
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as BrandRequestStatus | "");
              setOffset(0);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {data && data.items.length === 0 && !loading && (
        <p className="empty">No brand requests.</p>
      )}

      {data && data.items.length > 0 && (
        <table aria-busy={loading}>
          <thead>
            <tr>
              <th scope="col">Requested</th>
              <th scope="col">Name</th>
              <th scope="col">URL</th>
              <th scope="col">Notes</th>
              <th scope="col">Status</th>
              <th scope="col">Requested by</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((request) => (
              <RequestRow key={request.id} request={request} />
            ))}
          </tbody>
        </table>
      )}

      <nav className="pager" aria-label="Pages">
        <span>
          {loading && !data ? "Loading…" : `${first}–${last} of ${total}`}
        </span>
        <button
          type="button"
          disabled={loading || offset === 0}
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={loading || offset + PAGE_SIZE >= total}
          onClick={() => setOffset(offset + PAGE_SIZE)}
        >
          Next
        </button>
      </nav>
    </section>
  );
}
