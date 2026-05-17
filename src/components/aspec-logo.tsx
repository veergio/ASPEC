import Image from "next/image";
import { cn } from "@/lib/utils";

interface AspecLogoProps {
  className?: string;
  size?: number;
  withText?: boolean;
}

export function AspecLogo({
  className,
  size = 36,
  withText = false,
}: AspecLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/assets/aspec-logo.png"
        alt="ASPEC"
        width={size}
        height={size}
        className="rounded-full shadow-[0_0_24px_-6px_var(--aspec-blue)]"
        style={{ width: size, height: size }}
      />

      {withText && (
        <span className="text-xl font-extrabold tracking-[0.18em] text-white">
          ASPEC
        </span>
      )}
    </div>
  );
}