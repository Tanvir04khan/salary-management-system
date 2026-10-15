import { useUser } from "@clerk/react";
import { useEffect, useRef, useState } from "react";
import { hasHrManagerRole } from "../../utils/auth";

type RefreshResult = { key: string; status: "ready" | "failed" };

export function useRefreshedHrRole(refreshKey: string) {
  const { isLoaded, isSignedIn, user } = useUser();
  const userRef = useRef(user);
  const [refreshResult, setRefreshResult] = useState<RefreshResult>();
  userRef.current = user;

  const checkKey = user ? `${user.id}:${refreshKey}` : refreshKey;

  useEffect(() => {
    const currentUser = userRef.current;
    if (!isLoaded || !isSignedIn || !currentUser) return;

    let active = true;
    const key = `${currentUser.id}:${refreshKey}`;
    setRefreshResult(undefined);
    void currentUser
      .reload()
      .then(() => {
        if (active) setRefreshResult({ key, status: "ready" });
      })
      .catch(() => {
        if (active) setRefreshResult({ key, status: "failed" });
      });

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, user?.id, refreshKey]);

  const result =
    refreshResult?.key === checkKey ? refreshResult.status : undefined;
  const hasCachedHrManagerRole = hasHrManagerRole(user?.publicMetadata.role);

  return {
    isLoaded,
    isSignedIn,
    hasHrManagerRole: hasCachedHrManagerRole,
    isRefreshing:
      isSignedIn === true && result === undefined && !hasCachedHrManagerRole,
    refreshFailed: result === "failed" && !hasCachedHrManagerRole,
  };
}
