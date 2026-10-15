import { QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { ClerkProvider } from "@clerk/react";
import { queryClient } from "../utils/query-client";
import { AuthSessionBridge } from "../components/common/auth-session-bridge";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AppProviders({ children }: PropsWithChildren) {
  if (!publishableKey) {
    return <div className="p-8 text-sm text-red-700">Set VITE_CLERK_PUBLISHABLE_KEY in apps/web/.env to start the application.</div>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <QueryClientProvider client={queryClient}>
        <AuthSessionBridge>{children}</AuthSessionBridge>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
