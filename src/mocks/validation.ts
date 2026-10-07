import type { PageRequest } from '../api/contracts';

const PAGINATION_CONFIG = { defaultPageSize: 5, maxPageSize: 50 } as const;

function isPositiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

export function parsePage(params: URLSearchParams): PageRequest | undefined {
  const page = Number(params.get('page') ?? 1);
  const pageSize = Number(
    params.get('pageSize') ?? PAGINATION_CONFIG.defaultPageSize,
  );
  if (!isPositiveInteger(page) || !isPositiveInteger(pageSize)) {
    return undefined;
  }
  if (pageSize > PAGINATION_CONFIG.maxPageSize) {
    return undefined;
  }
  return { page, pageSize };
}
