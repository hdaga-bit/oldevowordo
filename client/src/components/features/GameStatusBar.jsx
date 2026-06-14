import React from "react";
import { motion } from "framer-motion";
import { getModeTheme } from "../../config/mode-themes";
import { cn } from "../../lib/utils";
import { IconStatusBadge } from "../ui/IconStatusBadge";

/**
 * GameStatusBar - Unified status message and badge component
 * 
 * Displays game status, mode badges, and informational messages
 */
export function GameStatusBar({
  mode,
  status,
  message,
  badges = [],
  isMobile = false,
  className = "",
}) {
  const theme = getModeTheme(mode);
  
  if (!status && !message && badges.length === 0) return null;
  
  const containerClass = isMobile
    ? "flex flex-col items-center gap-2 text-center"
    : "flex flex-col items-center space-y-2";
  
  // Get theme color classes (using actual color values since Tailwind dynamic classes don't work)
  const getPrimaryBg = () => "glass-panel border-zinc-700/40";
  const getPrimaryText = () => "text-zinc-400";
  
  // Determine if status should be icon-only (for common waiting states)
  const getStatusType = (statusText) => {
    if (!statusText) return null;
    const lower = statusText.toLowerCase();
    if (lower.includes("waiting for host") || lower.includes("waiting for ai")) {
      return "waiting";
    }
    if (lower.includes("waiting for") && lower.includes("player")) {
      return "waitingForPlayer";
    }
    if (lower.includes("ready") || lower.includes("starting")) {
      return "ready";
    }
    return null;
  };

  const statusType = getStatusType(status);
  const useIconOnly = statusType && !status.includes("—") && !status.includes(":"); // Use icon for simple waiting states

  return (
    <div className={cn(containerClass, className)}>
      {status && (
        <motion.div
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
            getPrimaryBg(),
            isMobile ? "text-xs" : "text-sm"
          )}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {useIconOnly ? (
            <>
              <IconStatusBadge type={statusType} animated={true} size="sm" tooltip={status} />
              <span className={cn("font-medium text-white/60", isMobile ? "text-[10px]" : "text-xs")}>
                {status.replace(/^Waiting for /i, "").replace(/\.\.\./g, "")}
              </span>
            </>
          ) : (
            <span className={cn("font-medium", getPrimaryText())}>
              {status}
            </span>
          )}
        </motion.div>
      )}
      
      {message && (
        <div className={cn("text-white/70", isMobile ? "text-xs" : "text-sm")}>
          {message}
        </div>
      )}
      
      {badges.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {badges.map((badge, index) => (
            <motion.div
              key={index}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg",
                badge.variant === "info" && "glass-panel",
                badge.variant === "success" && "bg-emerald-500/20 border border-emerald-500/30",
                badge.variant === "warning" && "bg-amber-500/20 border border-amber-500/40",
                badge.variant === "error" && "bg-red-500/20 border border-red-500/30",
                badge.variant === "primary" && getPrimaryBg()
              )}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
            >
              {badge.icon && <badge.icon className={cn("w-4 h-4", badge.iconColor || "text-white/70")} />}
              <span className={cn("text-xs uppercase tracking-wide", badge.textColor || "text-white/70")}>
                {badge.label}
              </span>
              {badge.value && (
                <span className={cn("text-sm font-semibold", badge.valueColor || "text-white")}>
                  {badge.value}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GameStatusBar;

