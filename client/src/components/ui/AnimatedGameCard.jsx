import { motion } from "framer-motion";
import { BORDER_RADIUS, TRANSITIONS } from "../../design-system";

export default function AnimatedGameCard({
  title,
  subtitle,
  icon,
  modeMark,
  onClick,
  className = "",
  children,
  size = "md",
  disabled = false,
  backgroundImage,
  backgroundPosition = "center center",
  ariaLabel,
}) {
  const sizeClasses = {
    sm: "p-4 min-h-[140px]",
    md: "p-6 min-h-[200px]",
    lg: "p-8 min-h-[240px]",
  };

  const label = ariaLabel || (title ? `Play ${title}` : undefined);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        group relative overflow-visible cursor-pointer text-left w-full
        ${backgroundImage ? "bg-black/55" : "bg-zinc-900"}
        border border-zinc-800 hover:border-zinc-600
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        borderRadius: BORDER_RADIUS.lg,
        transition: TRANSITIONS.default,
      }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      whileHover={disabled ? undefined : { y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ borderRadius: BORDER_RADIUS.lg }}
        aria-hidden
      >
        {backgroundImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-no-repeat transition-transform duration-500 group-hover:scale-105"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundPosition,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/50" />
          </>
        )}
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-[inherit]">
        {(modeMark || icon) && (
          <div
            className="absolute -top-1 -right-1 z-20 flex items-center justify-center rounded-full border border-white/20 bg-zinc-950/90 p-1 shadow-[0_3px_10px_rgba(0,0,0,0.55)] backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5"
            aria-hidden
          >
            {modeMark ?? (icon && <div className="text-2xl leading-none">{icon}</div>)}
          </div>
        )}

        <div className="mt-auto space-y-1">
          {(title || subtitle) && (
            <div className="max-md:opacity-100 max-md:translate-y-0 opacity-0 translate-y-1 transition-all duration-200 md:group-hover:opacity-100 md:group-hover:translate-y-0 md:group-focus-visible:opacity-100 md:group-focus-visible:translate-y-0">
              {title && (
                <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-zinc-300/90">{subtitle}</p>
              )}
            </div>
          )}

          {children}
        </div>
      </div>
    </motion.button>
  );
}
