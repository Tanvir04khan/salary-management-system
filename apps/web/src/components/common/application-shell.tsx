import {
  ChartNoAxesColumnIncreasing,
  LayoutDashboard,
  Menu,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: UsersRound },
  { to: "/analytics", label: "Analytics", icon: ChartNoAxesColumnIncreasing },
];

function currentPageTitle(pathname: string): string {
  if (pathname.endsWith("/edit")) return "Edit employee";
  if (pathname.endsWith("/salary")) return "Update salary";
  if (pathname.startsWith("/employees/")) return "Employee details";
  return (
    navigationItems.find((item) => item.to === pathname)?.label ?? "Workspace"
  );
}

function SidebarNavigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Main navigation" className="space-y-1">
      {navigationItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/dashboard"}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
              isActive
                ? "bg-white/12 text-white"
                : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`
          }
        >
          <Icon aria-hidden="true" className="size-[18px]" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <div className="mb-9 flex items-center gap-3 px-2">
      <div className="grid size-10 place-items-center rounded-xl bg-indigo-400/15 text-sm font-bold text-indigo-200">
        A
      </div>
      <div>
        <p className="text-sm font-semibold tracking-wide text-white">ACME</p>
        <p className="mt-0.5 text-xs text-slate-400">People operations</p>
      </div>
    </div>
  );
}

export function ApplicationShell() {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  useEffect(() => {
    setMobileNavigationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavigationOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileNavigationOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusableElements =
        mobilePanelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    mobileCloseRef.current?.focus();
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      mobileToggleRef.current?.focus();
    };
  }, [mobileNavigationOpen]);

  const pageTitle = currentPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen flex-col bg-slate-950 px-5 py-7 lg:flex">
        <SidebarBrand />
        <SidebarNavigation />
        <p className="mt-auto px-2 pt-8 text-xs text-slate-500">
          Salary management
        </p>
      </aside>

      {mobileNavigationOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/55"
            onClick={() => setMobileNavigationOpen(false)}
            type="button"
          />
          <aside
            aria-label="Primary navigation"
            aria-modal="true"
            className="relative flex h-full w-[min(18rem,85vw)] flex-col bg-slate-950 px-5 py-7 shadow-2xl"
            ref={mobilePanelRef}
            role="dialog"
          >
            <div className="mb-7 flex items-start justify-between">
              <SidebarBrand />
              <button
                aria-label="Close navigation"
                className="grid size-10 place-items-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
                onClick={() => setMobileNavigationOpen(false)}
                ref={mobileCloseRef}
                type="button"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <SidebarNavigation
              onNavigate={() => setMobileNavigationOpen(false)}
            />
            <p className="mt-auto px-2 pt-8 text-xs text-slate-500">
              Salary management
            </p>
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex h-[68px] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <button
            aria-expanded={mobileNavigationOpen}
            aria-label={
              mobileNavigationOpen ? "Close navigation" : "Open navigation"
            }
            className="grid size-10 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:hidden"
            onClick={() => setMobileNavigationOpen((open) => !open)}
            ref={mobileToggleRef}
            type="button"
          >
            {mobileNavigationOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-slate-400 sm:inline">ACME</span>
            <span
              aria-hidden="true"
              className="hidden text-slate-300 sm:inline"
            >
              /
            </span>
            <span
              aria-current="page"
              className="truncate font-medium text-slate-800"
            >
              {pageTitle}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
