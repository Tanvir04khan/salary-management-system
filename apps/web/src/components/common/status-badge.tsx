type StatusBadgeProps = {
  status: "ACTIVE" | "INACTIVE";
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const active = status === "ACTIVE";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
      }`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${active ? "bg-emerald-600" : "bg-red-500"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
