import { useState } from "react";

import {
  type AdminBrandRequest,
  type BrandRequestStatus,
  listBrandRequests,
} from "./api";
import { Pager } from "./Pager";
import { usePagedList } from "./usePagedList";

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
  const { data, error, loading, offset, previousPage, nextPage } =
    usePagedList<AdminBrandRequest>({
      load: (page) =>
        listBrandRequests({ status: status || undefined, ...page }),
      filterKey: status,
      onUnauthorized,
      errorMessage: "Could not load brand requests.",
    });

  return (
    <section>
      <div className="toolbar">
        <h2>Brand requests</h2>
        <div className="filters">
          <label>
            Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as BrandRequestStatus | "")
              }
            >
              {STATUS_OPTIONS.map((option) => (
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
