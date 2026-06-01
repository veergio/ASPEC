import Image from "next/image";
import { cn } from "@/lib/utils";

interface AspecLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
  variant?: "default" | "sidebar";
}

export function AspecLogo({
  className,
  size = 36,
  withText = false,
  variant = "default",
}: AspecLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full flex-shrink-0",
          variant === "sidebar" && "bg-white p-1"
        )}
        style={{ width: size + (variant === "sidebar" ? 8 : 0), height: size + (variant === "sidebar" ? 8 : 0) }}
      >
        <Image
          src="/assets/aspec-logo.png"
          alt="ASPEC"
          width={size}
          height={size}
          className="rounded-full shadow-[0_0_24px_-6px_var(--aspec-blue)]"
          style={{ width: size, height: size }}
        />
      </div>
      {withText && (
        <span className={cn(
          "text-xl font-extrabold tracking-[0.18em]",
          variant === "sidebar" ? "text-white" : "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
        )}>
          ASPEC
        </span>
      )}
    </div>
  );
}