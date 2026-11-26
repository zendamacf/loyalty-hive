import { useState } from "react";

import { type AdminShare, listShares, type ShareScope } from "./api";
import { Pager } from "./Pager";
import { usePagedList } from "./usePagedList";

const SCOPE_LABELS: Record<ShareScope, string> = {
  card: "Individual",
  account: "Account",
};

const SCOPE_OPTIONS: { value: ShareScope | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "card", label: SCOPE_LABELS.card },
  { value: "account", label: SCOPE_LABELS.account },
];

function ShareRow({ share }: { share: AdminShare }) {
  return (
    <tr>
      <td>
        <time dateTime={share.createdAt}>
          {new Date(share.createdAt).toLocaleString()}
        </time>
      </td>
      <td>{share.ownerEmail}</td>
      <td>{share.recipientEmail}</td>
      <td>{SCOPE_LABELS[share.scope]}</td>
    </tr>
  );
}

export function SharesPage({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [scope, setScope] = useState<ShareScope | "">("");
  const { data, error, loading, offset, previousPage, nextPage } =
    usePagedList<AdminShare>({
      load: (page) => listShares({ scope: scope || undefined, ...page }),
      filterKey: scope,
      onUnauthorized,
      errorMessage: "Could not load shares.",
    });

  return (
    <section>
      <div className="toolbar">
        <h2>Shares</h2>
        <div className="filters">
          <label>
            Type
            <select
              value={scope}
              onChange={(event) =>
                setScope(event.target.value as ShareScope | "")
              }
            >
              {SCOPE_OPTIONS.map((option) => (
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
        <p className="empty">No shares.</p>
      )}

      {data && data.items.length > 0 && (
        <table aria-busy={loading}>
          <thead>
            <tr>
              <th scope="col">Shared</th>
              <th scope="col">Owner</th>
              <th scope="col">Recipient</th>
              <th scope="col">Type</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((share) => (
              <ShareRow key={share.id} share={share} />
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
