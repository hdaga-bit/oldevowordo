import { useCallback, useEffect, useState } from "react";
import GradientBackground from "../components/ui/GradientBackground";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { useAppNavigation } from "../hooks/useAppNavigation";
import {
  fetchAdminMe,
  fetchAdminStats,
  fetchLiveOpsSummary,
  fetchLiveOpsEvents,
  fetchEventRuns,
  fetchAdminPlayers,
  fetchAdminFeedback,
} from "../api/adminApi";
import AdminDashboardShell from "./admin/AdminDashboardShell";
import EventHistoryPanel from "./admin/EventHistoryPanel";
import EventManagementPanel from "./admin/EventManagementPanel";
import FeedbackPanel from "./admin/FeedbackPanel";
import LiveEventMonitor from "./admin/LiveEventMonitor";
import LiveOpsOverview from "./admin/LiveOpsOverview";
import PlayerInsightsPanel from "./admin/PlayerInsightsPanel";

export default function AdminScreen() {
  const { login, isAuthenticated } = useAuth();
  const { navigateHome } = useAppNavigation();

  const [tab, setTab] = useState("overview");
  const [gateLoading, setGateLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState(null);

  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);
  const [events, setEvents] = useState([]);
  const [runs, setRuns] = useState([]);
  const [players, setPlayers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkGate = useCallback(async () => {
    setGateLoading(true);
    setError("");
    try {
      const profile = await fetchAdminMe();
      setIsAdmin(Boolean(profile.isAdmin));
      setAdminEmail(profile.email);
    } catch {
      setIsAdmin(false);
      setAdminEmail(null);
    } finally {
      setGateLoading(false);
    }
  }, []);

  useEffect(() => {
    checkGate();
  }, [checkGate, isAuthenticated]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsData, summaryData] = await Promise.all([
        fetchAdminStats(),
        fetchLiveOpsSummary(),
      ]);
      setStats(statsData);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchLiveOpsEvents();
      setEvents(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMonitor = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchLiveOpsSummary();
      setSummary(data);
    } catch (err) {
      setError(err.message || "Failed to load live monitor");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchEventRuns({ limit: 100 });
      setRuns(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load event history");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPlayers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminPlayers({ limit: 50 });
      setPlayers(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load players");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminFeedback({ limit: 50 });
      setFeedback(data.items || []);
    } catch (err) {
      setError(err.message || "Failed to load feedback");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    if (tab === "overview") loadOverview();
    if (tab === "events") loadEvents();
    if (tab === "monitor") loadMonitor();
    if (tab === "players") loadPlayers();
    if (tab === "history") loadRuns();
    if (tab === "feedback") loadFeedback();
  }, [isAdmin, tab, loadOverview, loadEvents, loadMonitor, loadPlayers, loadRuns, loadFeedback]);

  const refreshCurrent = () => {
    if (tab === "overview") return loadOverview();
    if (tab === "events") return loadEvents();
    if (tab === "monitor") return loadMonitor();
    if (tab === "players") return loadPlayers();
    if (tab === "history") return loadRuns();
    if (tab === "feedback") return loadFeedback();
  };

  if (gateLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" variant="primary" text="Checking access…" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Admin access required</h1>
        <p className="text-white/60 text-sm mb-6">
          Sign in with an authorized account to manage events and view analytics.
        </p>
        <button
          type="button"
          onClick={() => login()}
          className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-200"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <GradientBackground className="min-h-screen pb-16">
      <AdminDashboardShell
        adminEmail={adminEmail}
        tab={tab}
        onTabChange={setTab}
        onRefresh={refreshCurrent}
        onBack={navigateHome}
        error={error}
      >
        {tab === "overview" ? <LiveOpsOverview stats={stats} summary={summary} loading={loading} /> : null}
        {tab === "events" ? (
          <EventManagementPanel events={events} loading={loading} onReload={loadEvents} onError={setError} />
        ) : null}
        {tab === "monitor" ? <LiveEventMonitor summary={summary} loading={loading} /> : null}
        {tab === "players" ? (
          <PlayerInsightsPanel players={players} setPlayers={setPlayers} loading={loading} onError={setError} />
        ) : null}
        {tab === "history" ? <EventHistoryPanel runs={runs} loading={loading} /> : null}
        {tab === "feedback" ? (
          <FeedbackPanel feedback={feedback} loading={loading} onReload={loadFeedback} onError={setError} />
        ) : null}
      </AdminDashboardShell>
    </GradientBackground>
  );
}
