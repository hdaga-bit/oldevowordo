import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { DONATE_URL, isDonateEnabled, SITE_NAME } from "../config/site";

/**
 * Opens Paystack Payment Page in a new tab. Hidden when VITE_PAYSTACK_DONATE_URL is unset.
 */
export default function DonateButton({
  variant = "link",
  className,
  label = "Donate",
}) {
  if (!isDonateEnabled()) return null;

  const shared = cn(
    "inline-flex items-center gap-1.5 transition",
    variant === "link" && "text-inherit hover:text-white/90",
    variant === "button" &&
      "px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 text-sm font-medium w-full justify-center",
    className,
  );

  return (
    <a
      href={DONATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={shared}
      aria-label={`Donate to support ${SITE_NAME}`}
    >
      <img
        src="/paystack.png"
        alt=""
        aria-hidden
        className={cn(
          "shrink-0 object-contain",
          variant === "button" ? "h-5 w-auto max-w-[5rem]" : "h-4 w-auto max-w-[3.5rem]",
        )}
      />
      <Heart className="w-3.5 h-3.5 shrink-0 opacity-80" aria-hidden />
      {label}
    </a>
  );
}
