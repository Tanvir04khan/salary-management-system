import { Navigate, Outlet, useLocation } from "react-router-dom";
import { RouteLoading } from "../../components/common/route-loading";
import { useRefreshedHrRole } from "./use-refreshed-hr-role";

export function HrManagerRoute() {
  const location = useLocation();
  const { isLoaded, isSignedIn, hasHrManagerRole, isRefreshing, refreshFailed } = useRefreshedHrRole(location.pathname);

  if (!isLoaded) return <RouteLoading />;
  if (!isSignedIn) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  if (isRefreshing) return <RouteLoading />;
  if (refreshFailed) {
    return <Navigate to="/unauthorized" replace state={{ reason: "verification" }} />;
  }
  if (!hasHrManagerRole) {
    return <Navigate to="/unauthorized" replace state={{ reason: "role" }} />;
  }
  return <Outlet />;
}
