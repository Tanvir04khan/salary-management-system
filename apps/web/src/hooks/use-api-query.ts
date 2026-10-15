import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  requestApi,
  type ApiQueryParams,
} from "../utils/api-client";

type ApiQueryOptions<TData> = Omit<
  UseQueryOptions<TData, Error, TData, QueryKey>,
  "queryKey" | "queryFn" | "enabled"
> & {
  path: string;
  params?: ApiQueryParams;
  queryKey?: QueryKey;
  enabled?: boolean;
};

export function createApiQueryKey(
  path: string,
  params?: ApiQueryParams,
): QueryKey {
  const sortedParams = Object.fromEntries(
    Object.entries(params ?? {})
      .filter(([, value]) => value !== undefined && value !== null)
      .sort(([left], [right]) => left.localeCompare(right)),
  );
  return ["api", path, sortedParams];
}

export function useApiQuery<TData>({
  path,
  params,
  queryKey,
  enabled = true,
  ...queryOptions
}: ApiQueryOptions<TData>) {
  const stableKey = queryKey ?? createApiQueryKey(path, params);

  return useQuery<TData, Error>({
    ...queryOptions,
    queryKey: stableKey,
    enabled,
    queryFn: ({ signal }) => requestApi<TData>(path, { params, signal }),
  });
}
