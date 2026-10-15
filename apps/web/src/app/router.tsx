import { lazy, Suspense, type ReactNode } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { ApplicationShell } from "../components/common/application-shell";
import { RouteLoading } from "../components/common/route-loading";
import { NotFoundScreen } from "../screens/not-found/NotFoundScreen";
import { RouteErrorScreen } from "../screens/not-found/RouteErrorScreen";

const DashboardScreen = lazy(() => import("../screens/dashboard/DashboardScreen"));
const EmployeesScreen = lazy(() => import("../screens/employees/EmployeesScreen"));
const NewEmployeeScreen = lazy(() => import("../screens/employees/NewEmployeeScreen"));
const EmployeeDetailsScreen = lazy(() => import("../screens/employee-details/EmployeeDetailsScreen"));
const EditEmployeeScreen = lazy(() => import("../screens/employee-details/EditEmployeeScreen"));
const EmployeeSalaryScreen = lazy(() => import("../screens/employee-details/EmployeeSalaryScreen"));
const AnalyticsScreen = lazy(() => import("../screens/analytics/AnalyticsScreen"));

function withLoadingFallback(element: ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{element}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <ApplicationShell />,
    errorElement: <RouteErrorScreen />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: "dashboard",
        element: withLoadingFallback(<DashboardScreen />),
      },
      {
        path: "employees",
        element: withLoadingFallback(<EmployeesScreen />),
      },
      {
        path: "employees/new",
        element: withLoadingFallback(<NewEmployeeScreen />),
      },
      {
        path: "employees/:employeeId/edit",
        element: withLoadingFallback(<EditEmployeeScreen />),
      },
      {
        path: "employees/:employeeId/salary",
        element: withLoadingFallback(<EmployeeSalaryScreen />),
      },
      {
        path: "employees/:employeeId",
        element: withLoadingFallback(<EmployeeDetailsScreen />),
      },
      {
        path: "analytics",
        element: withLoadingFallback(<AnalyticsScreen />),
      },
      { path: "*", element: <NotFoundScreen /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
