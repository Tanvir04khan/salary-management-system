import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api-client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.statusCode !== null) {
          return error.statusCode >= 500 && failureCount < 1;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
