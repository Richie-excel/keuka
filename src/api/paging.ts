import type { PageParams } from "@/interfaces";

export const DEFAULT_PAGE_SIZE = 10;

export function toServerPage(uiPage: number): number {
  return Math.max(0, uiPage - 1);
}

export function fromServerPage(serverPage: number): number {
  return serverPage + 1;
}

export function buildPageQuery(params: PageParams = {}): string {
  const search = new URLSearchParams();

  if (params.page !== undefined) {
    search.set("page", String(toServerPage(params.page)));
  }
  if (params.size !== undefined) {
    search.set("size", String(params.size));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function withPageQuery(path: string, params: PageParams = {}): string {
  const query = buildPageQuery(params);
  if (!query) return path;
  return path.includes("?")
    ? `${path}&${query.slice(1)}`
    : `${path}${query}`;
}

export function withQueryParam(
  path: string,
  name: string,
  value: string | undefined,
): string {
  if (value === undefined || value === "") return path;
  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
}
