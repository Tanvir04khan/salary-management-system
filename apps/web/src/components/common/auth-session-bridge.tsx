import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, type PropsWithChildren } from "react";
import { setSessionTokenProvider } from "../../utils/api-client";

export function AuthSessionBridge({ children }: PropsWithChildren) {
  const { getToken, isSignedIn, userId } = useAuth();
  const queryClient = useQueryClient();
  const previousUserId = useRef<string | null | undefined>(undefined);

  setSessionTokenProvider(getToken);

  useEffect(() => {
    if (previousUserId.current !== undefined && previousUserId.current !== userId) {
      queryClient.clear();
    }
    previousUserId.current = userId;
    if (!isSignedIn) queryClient.clear();
  }, [isSignedIn, queryClient, userId]);

  useEffect(() => {
    setSessionTokenProvider(getToken);
    return () => setSessionTokenProvider(undefined);
  }, [getToken]);

  return children;
}
