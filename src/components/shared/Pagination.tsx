interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const PAGINATION_CONFIG = { pageSize: 5 } as const;

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        className="round-button previous-page"
        aria-label="Previous"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      ></button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        className="round-button next-page"
        aria-label="Next"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      ></button>
    </nav>
  );
}
