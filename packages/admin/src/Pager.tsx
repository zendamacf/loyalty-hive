import { PAGE_SIZE } from "./usePagedList";

export function Pager({
  offset,
  total,
  loading,
  loaded,
  onPrevious,
  onNext,
}: {
  offset: number;
  total: number;
  loading: boolean;
  loaded: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const first = total === 0 ? 0 : offset + 1;
  const last = Math.min(offset + PAGE_SIZE, total);

  return (
    <nav className="pager" aria-label="Pages">
      <span>
        {loading && !loaded ? "Loading…" : `${first}–${last} of ${total}`}
      </span>
      <button
        type="button"
        disabled={loading || offset === 0}
        onClick={onPrevious}
      >
        Previous
      </button>
      <button
        type="button"
        disabled={loading || offset + PAGE_SIZE >= total}
        onClick={onNext}
      >
        Next
      </button>
    </nav>
  );
}
