import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import {
  requestApi,
  type HttpMethod,
} from "../utils/api-client";

type ApiMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "mutationFn"
> & {
  method: Exclude<HttpMethod, "GET">;
  path: string;
  body?: (variables: TVariables) => unknown;
  invalidateQueries?: QueryKey[] | ((variables: TVariables) => QueryKey[]);
};

export function useApiMutation<TData, TVariables = void>({
  method,
  path,
  body,
  invalidateQueries = [],
  onSuccess,
  ...mutationOptions
}: ApiMutationOptions<TData, TVariables>) {
  const client = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    ...mutationOptions,
    mutationFn: (variables) => requestApi<TData>(path, {
      method,
      body: body ? body(variables) : variables,
    }),
    onSuccess: async (data, variables, onMutateResult, context) => {
      const queryKeys = typeof invalidateQueries === "function"
        ? invalidateQueries(variables)
        : invalidateQueries;
      await Promise.all(
        queryKeys.map((queryKey) =>
          client.invalidateQueries({ queryKey }),
        ),
      );
      await onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
