import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type PageContainerProps = HTMLAttributes<HTMLDivElement>;

export function PageContainer({ className = "", ...props }: PageContainerProps) {
  return <div className={cn("space-y-6", className)} {...props} />;
}
