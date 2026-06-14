import { useCallback, useEffect } from "react";
import { useErrorNotification } from "../contexts/ErrorNotificationContext";

function severityForMessage(message) {
  const lower = message.toLowerCase();
  if (
    lower.includes("fail") ||
    lower.includes("invalid") ||
    lower.includes("not found") ||
    lower.includes("error") ||
    lower.includes("must be")
  ) {
    return "error";
  }
  if (lower.includes("success") || lower.includes("copied") || lower.includes("started")) {
    return "success";
  }
  if (lower.includes("wait") || lower.includes("reconnect")) {
    return "warning";
  }
  return "info";
}

/** Mirrors setMsg into global toast notifications (visible on all screens). */
export function useGameMessageNotify(msg, setMsg) {
  const { showNotification } = useErrorNotification();

  useEffect(() => {
    if (!msg) return;
    showNotification(msg, severityForMessage(msg), { duration: 2800 });
  }, [msg, showNotification]);

  const notify = useCallback(
    (message, severity) => {
      if (!message) {
        setMsg("");
        return;
      }
      setMsg(message);
      showNotification(message, severity || severityForMessage(message), { duration: 2800 });
    },
    [setMsg, showNotification],
  );

  return notify;
}
