export function hasHrManagerRole(role: unknown): boolean {
  return typeof role === "string" && role.toUpperCase() === "HR_MANAGER";
}
