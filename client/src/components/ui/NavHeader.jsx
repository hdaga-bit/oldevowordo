import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  ChevronDown,
  Settings,
  Trophy,
  LogOut,
  LogIn,
  User,
  Share2,
  MessageSquare,
} from "lucide-react";
import FeedbackModal from "../FeedbackModal";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import ProfileModal from "../ProfileModal";
import BrandLogo from "../BrandLogo";
import PlayerAvatar from "../PlayerAvatar";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

export default function NavHeader({
  onHomeClick,
  right = null,
  modeLabel = null,
  roomId = null,
  profileMenuVariant = "default",
  reconnecting = false,
  reconnectAttempt = 0,
}) {
  const [copied, setCopied] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [profileView, setProfileView] = useState("profile");
  const [menuOpen, setMenuOpen] = useState(false);
  const copyResetTimeout = useRef(null);
  const menuRef = useRef(null);
  const { user, isAuthenticated, isAnonymous, isLoading, login, logout } = useAuth();

  const handleCopyRoomId = async () => {
    if (!roomId) return;

    const inviteUrl = window.location.href;
    const shareTitle = "Join my EvoWordo room!";
    const shareText = `Join my game — room code: ${roomId.toUpperCase()}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: inviteUrl });
      } else {
        await navigator.clipboard?.writeText?.(inviteUrl);
      }
      setCopied(true);
      if (copyResetTimeout.current) clearTimeout(copyResetTimeout.current);
      copyResetTimeout.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // User cancelled share or clipboard not available — try copying code as fallback
      try {
        await navigator.clipboard?.writeText?.(roomId);
        setCopied(true);
        if (copyResetTimeout.current) clearTimeout(copyResetTimeout.current);
        copyResetTimeout.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silently fail
      }
    }
  };

  useEffect(() => {
    setCopied(false);
  }, [roomId]);

  useEffect(() => {
    return () => {
      if (copyResetTimeout.current) {
        clearTimeout(copyResetTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickAway = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickAway);
    return () => document.removeEventListener("click", handleClickAway);
  }, [menuOpen]);

  const storedName =
    typeof window !== "undefined"
      ? window.localStorage?.getItem("wp.lastName")?.trim()
      : "";
  const displayName =
    (user?.displayName && user.displayName.trim()) ||
    storedName ||
    (!isAnonymous ? "Player" : "Guest");

  const handleOpenProfileModal = useCallback((view = "profile") => {
    setProfileView(view);
    setShowProfile(true);
    setMenuOpen(false);
  }, []);

  const menuItems = useMemo(() => {
    const customiseItem = {
      key: "customise",
      label: "Customise",
      icon: Settings,
      action: () => handleOpenProfileModal("customise"),
    };

    const feedbackItem = {
      key: "feedback",
      label: "Send feedback",
      icon: MessageSquare,
      action: () => {
        setMenuOpen(false);
        setShowFeedback(true);
      },
    };

    if (!isAuthenticated) {
      return [
        {
          key: "profile",
          label: "Profile",
          icon: User,
          action: () => handleOpenProfileModal("profile"),
        },
        {
          key: "achievements",
          label: "Achievements",
          icon: Trophy,
          action: () => handleOpenProfileModal("achievements"),
        },
        customiseItem,
        feedbackItem,
        {
          key: "signin",
          label: "Sign in",
          icon: LogIn,
          action: () => {
            setMenuOpen(false);
            login();
          },
        },
      ];
    }

    const authItems = [
      {
        key: "profile",
        label: "Profile",
        icon: User,
        action: () => handleOpenProfileModal("profile"),
      },
      {
        key: "achievements",
        label: "Achievements",
        icon: Trophy,
        action: () => handleOpenProfileModal("achievements"),
      },
      customiseItem,
      feedbackItem,
      {
        key: "logout",
        label: "Log out",
        icon: LogOut,
        action: () => {
          setMenuOpen(false);
          logout();
        },
      },
    ];

    if (profileMenuVariant === "game") {
      return authItems;
    }

    return authItems;
  }, [handleOpenProfileModal, isAuthenticated, login, logout, profileMenuVariant]);

  return (
    <motion.nav
      className="sticky top-0 z-[100] border-b border-zinc-800/60 glass-panel"
      style={{
        boxShadow: "0 1px 0 0 rgba(0, 0, 0, 0.25)",
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 relative">
          <motion.button
            type="button"
            onClick={(event) => onHomeClick?.(event)}
            className="flex items-center gap-3 hover:opacity-90 active:scale-[0.98] transition"
            whileHover={{ scale: 1.02 }}
            aria-label="Go to Home"
          >
            <BrandLogo size="md" textClassName="hidden md:inline" />
            <span className="sr-only">EvoWordo Home</span>
          </motion.button>

          {modeLabel && (
            <div className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 hidden sm:flex items-center">
              <p className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-white/70 text-center">
                {modeLabel}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-4">
            {reconnecting && (
              <motion.div
                className="flex items-center gap-2 text-xs font-medium text-amber-400 border border-amber-500/30 rounded-full px-3 h-9 bg-amber-500/10 backdrop-blur"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <LoadingSpinner size="sm" variant="white" />
                <span className="hidden sm:inline">
                  {reconnectAttempt > 0
                    ? `Reconnecting… Attempt ${reconnectAttempt}`
                    : "Reconnecting…"}
                </span>
                <span className="sm:hidden">
                  {reconnectAttempt > 0 ? `Attempt ${reconnectAttempt}` : "Reconnecting"}
                </span>
              </motion.div>
            )}
            {roomId && (
              <div className="flex items-center gap-2 text-xs font-medium text-white/80 border border-white/15 rounded-full pl-3 pr-1 h-9 bg-white/5 backdrop-blur">
                <span className="font-mono tracking-wider uppercase">{roomId}</span>
                <button
                  type="button"
                  onClick={handleCopyRoomId}
                  className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition flex items-center justify-center"
                  aria-label={copied ? "Link copied!" : "Share invite link"}
                  title={copied ? "Copied!" : "Share invite link"}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : typeof navigator !== "undefined" && navigator.share ? (
                    <Share2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="sr-only">
                    {copied ? "Link copied!" : "Share invite link"}
                  </span>
                </button>
              </div>
            )}
            {right}

            <div className="relative z-[110]" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isLoading) return;
                  setMenuOpen((open) => !open);
                }}
                className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 pl-1 pr-2 py-1 md:pl-1.5 md:pr-3 md:py-1.5 transition hover:bg-white/10"
                aria-label="Open profile menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <PlayerAvatar
                  avatarKey={user?.profileAvatar}
                  colour={user?.profileColour}
                  name={displayName}
                  size={34}
                />
                <ChevronDown
                  className={`w-3.5 h-3.5 text-white/50 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-md shadow-lg overflow-hidden z-[120]"
                    role="menu"
                  >
                    {menuItems.map(({ key, label, icon: Icon, action }) => (
                      <button
                        key={key}
                        type="button"
                        role="menuitem"
                        onClick={(e) => {
                          e.stopPropagation();
                          action();
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition text-left ${
                          key === "logout"
                            ? "text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            : "text-white/80 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        open={showProfile}
        onOpenChange={setShowProfile}
        view={profileView}
      />
      <FeedbackModal open={showFeedback} onOpenChange={setShowFeedback} />
    </motion.nav>
  );
}
