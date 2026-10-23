type QueryValue = string | number | boolean | null | undefined;

export function buildQueryParams(values: Record<string, QueryValue>): string {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    const normalized = key === "keyword" && typeof value === "string" ? value.trim() : value;
    if (normalized === "") return;
    params.set(key, String(normalized));
  });

  return params.toString();
}

export function withQuery(endpoint: string, values: Record<string, QueryValue>): string {
  const query = buildQueryParams(values);
  return query ? `${endpoint}?${query}` : endpoint;
}
