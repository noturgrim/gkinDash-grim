import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import {
  Trash2,
  AlertTriangle,
  Key,
  MessageSquare,
  Settings,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Home,
  Users,
  TrendingUp,
  Shield,
  Activity,
  Database,
  Mail,
  Send,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import adminService from "../../services/adminService";
import emailSettingsService from "../../services/emailSettingsService";
import { useNotifications } from "../../context/NotificationContext";
import { PasscodeManager } from "./passcode-manager";
import { RoleBasedPeopleManager } from "./role-based-people-manager";
import { DefaultRolesManager } from "./default-roles-manager";
import { RoleEmailManager } from "./role-email-manager";
import { Link } from "react-router-dom";

/**
 * Wrapper that keeps default roles state shared between
 * DefaultRolesManager and RoleBasedPeopleManager
 */
function ServiceAssignmentsTab() {
  const [roleNames, setRoleNames] = useState(null);

  return (
    <div className="space-y-8">
      <DefaultRolesManager onRolesChange={setRoleNames} />
      <RoleBasedPeopleManager roles={roleNames} />
    </div>
  );
}

/**
 * Admin Tools component for administrative operations
 */
export function AdminTools() {
  const [activeTab, setActiveTab] = useState("messages");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stats, setStats] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [emailSettings, setEmailSettings] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});
  const [testEmail, setTestEmail] = useState("");
  const [error, setError] = useState(null);
  const { refreshMentions } = useNotifications();

  // Load stats on component mount
  useEffect(() => {
    if (activeTab === "messages") {
      fetchMessageStats();
      // Also fetch system status for the quick stats
      fetchSystemStatus();
    } else if (activeTab === "settings") {
      fetchSystemStatus();
      fetchEmailSettings();
    }
  }, [activeTab]);

  // Fetch email settings
  const fetchEmailSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await emailSettingsService.getEmailSettings();

      if (response && response.settings) {
        setEmailSettings(response.settings);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Email settings fetch error:", error);
      setError(error.message || "Failed to fetch email settings");
      setEmailSettings([]);
    } finally {
      setLoading(false);
    }
  };

  // Update email settings
  const updateEmailSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const settingsToUpdate = emailSettings.map((setting) => ({
        setting_name: setting.setting_name,
        setting_value: setting.setting_value,
        is_encrypted: setting.is_encrypted,
      }));

      await emailSettingsService.updateEmailSettings(settingsToUpdate);

      alert("Email settings updated successfully!");
      fetchEmailSettings(); // Refresh settings
    } catch (error) {
      setError(error.message || "Failed to update email settings");
    } finally {
      setLoading(false);
    }
  };

  // Test email configuration
  const testEmailConfiguration = async () => {
    if (!testEmail) {
      setError("Please enter a test email address");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await emailSettingsService.testEmailSettings(testEmail);
      alert("Test email sent successfully! Check your inbox.");
    } catch (error) {
      setError(error.message || "Failed to send test email");
    } finally {
      setLoading(false);
    }
  };

  // Handle email setting change
  const handleEmailSettingChange = (index, value) => {
    const updatedSettings = [...emailSettings];
    updatedSettings[index].setting_value = value;
    setEmailSettings(updatedSettings);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (settingName) => {
    setShowPasswords((prev) => ({
      ...prev,
      [settingName]: !prev[settingName],
    }));
  };

  // Fetch system status
  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.getSystemStatus();

      if (response && response.status) {
        setSystemStatus(response.status);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("System status fetch error:", error);
      setError(error.message || "Failed to fetch system status");
      // Set default status to prevent UI errors
      setSystemStatus({
        server: { status: "unknown", uptime: 0 },
        database: { status: "unknown", connected: false },
      });
    } finally {
      setLoading(false);
    }
  };

  // Tab options
  const tabs = [
    {
      id: "messages",
      label: "Messages",
      icon: MessageSquare,
      description: "Manage system messages and data",
    },
    {
      id: "passcodes",
      label: "Passcodes",
      icon: Key,
      description: "Configure access codes",
    },
    {
      id: "people",
      label: "Service Assignments",
      icon: Users,
      description: "Manage assignable people",
    },
    {
      id: "role-emails",
      label: "Role Emails",
      icon: Mail,
      description: "Configure role email addresses",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      description: "System and email configuration",
    },
  ];

  // Handle clearing all messages
  const handleClearMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call the API to clear messages
      const response = await adminService.clearAllMessages();

      // Reset confirmation dialog
      setShowConfirm(false);

      // Refresh mentions to update UI
      refreshMentions();

      // Show success message
      alert("All messages have been cleared successfully.");

      // Refresh stats
      fetchMessageStats();
    } catch (error) {
      setError(error.message || "Failed to clear messages");
    } finally {
      setLoading(false);
    }
  };

  // Fetch message statistics
  const fetchMessageStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminService.getMessageStats();

      // Make sure we have valid stats data
      if (response && response.stats) {
        setStats({
          messageCount: response.stats.messageCount || 0,
          mentionCount: response.stats.mentionCount || 0,
          topUsers: response.stats.topUsers || [],
        });
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
      setError(error.message || "Failed to fetch message statistics");
      // Set default empty stats to prevent UI errors
      setStats({
        messageCount: 0,
        mentionCount: 0,
        topUsers: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Render the Messages tab content
  const renderMessagesTab = () => {
    const serverOnline = systemStatus?.server?.status === "online";

    return (
      <div className="space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Messages",
              value: stats ? stats.messageCount.toLocaleString() : "—",
              icon: MessageSquare,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
            },
            {
              label: "Mentions",
              value: stats ? stats.mentionCount.toLocaleString() : "—",
              icon: AlertTriangle,
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              label: "Active Users",
              value: stats?.topUsers ? stats.topUsers.length : "—",
              icon: Users,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              label: "Server",
              value: systemStatus ? (serverOnline ? "Online" : "Offline") : "—",
              icon: Activity,
              color: serverOnline ? "text-green-600" : "text-red-500",
              bg: serverOnline ? "bg-green-50" : "bg-red-50",
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-3"
            >
              <div
                className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-400 truncate">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics + Danger Zone side-by-side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Top Users */}
          <div className="lg:col-span-3 bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-800">
                  Top Active Users
                </h3>
              </div>
              <button
                onClick={fetchMessageStats}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>

            <div className="p-4">
              {loading && !stats ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                </div>
              ) : stats?.topUsers?.length > 0 ? (
                <div className="space-y-2">
                  {stats.topUsers.map((user, index) => {
                    const maxCount = Math.max(
                      ...stats.topUsers.map((u) => u.message_count),
                    );
                    const percentage = (user.message_count / maxCount) * 100;

                    return (
                      <div key={index} className="flex items-center gap-3 py-2">
                        <span className="w-5 text-center text-xs font-semibold text-slate-400 flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 truncate">
                              {user.username || "Unknown"}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 ml-2 flex-shrink-0">
                              {user.message_count.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1">
                            <div
                              className="h-1 rounded-full bg-indigo-400 transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Database className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-sm text-slate-400">No activity data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="lg:col-span-2 bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
              <Trash2 className="w-4 h-4 text-red-400" />
              <h3 className="text-sm font-semibold text-slate-800">
                Danger Zone
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Permanently deletes all messages, mentions, and related data.
                This cannot be undone.
              </p>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {!showConfirm ? (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Messages
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    Are you sure? This will permanently remove everything.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearMessages}
                      disabled={loading}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60"
                    >
                      {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      {loading ? "Deleting…" : "Confirm"}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      disabled={loading}
                      className="flex-1 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the Passcodes tab content
  const renderPasscodesTab = () => {
    return <PasscodeManager isEmbedded={true} />;
  };

  // Render the People tab content
  const renderPeopleTab = () => {
    return <ServiceAssignmentsTab />;
  };

  // Render the Role Emails tab content
  const renderRoleEmailsTab = () => {
    return <RoleEmailManager />;
  };

  // Render the Settings tab content
  const renderSettingsTab = () => {
    // Helper function to format uptime
    const formatUptime = (seconds) => {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);

      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    };

    return (
      <div className="space-y-4">
        {/* Email Configuration */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Email Configuration
                </h3>
                <p className="text-xs text-slate-400">
                  SMTP settings for system notifications
                </p>
              </div>
            </div>
            <button
              onClick={fetchEmailSettings}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Refresh
            </button>
          </div>

          <div className="p-6 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {emailSettings.length > 0 ? (
              <>
                {/* SMTP Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {emailSettings.map((setting, index) => (
                    <div key={setting.setting_name} className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide capitalize">
                        {setting.setting_name
                          .replace("smtp_", "")
                          .replace(/_/g, " ")}
                      </label>
                      {setting.setting_name.includes("password") ? (
                        <div className="relative">
                          <input
                            type={
                              showPasswords[setting.setting_name]
                                ? "text"
                                : "password"
                            }
                            value={
                              setting.setting_value === "••••••••"
                                ? ""
                                : setting.setting_value
                            }
                            onChange={(e) =>
                              handleEmailSettingChange(index, e.target.value)
                            }
                            placeholder={
                              setting.setting_value === "••••••••"
                                ? "Enter new password"
                                : ""
                            }
                            className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              togglePasswordVisibility(setting.setting_name)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPasswords[setting.setting_name] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      ) : setting.setting_name === "smtp_secure" ? (
                        <select
                          value={setting.setting_value}
                          onChange={(e) =>
                            handleEmailSettingChange(index, e.target.value)
                          }
                          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
                        >
                          <option value="true">Yes (SSL/TLS)</option>
                          <option value="false">No (Plain)</option>
                        </select>
                      ) : (
                        <input
                          type={
                            setting.setting_name === "smtp_port"
                              ? "number"
                              : "text"
                          }
                          value={setting.setting_value}
                          onChange={(e) =>
                            handleEmailSettingChange(index, e.target.value)
                          }
                          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Save + Test row */}
                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    onClick={updateEmailSettings}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors shadow-sm disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save Settings
                      </>
                    )}
                  </button>

                  <div className="flex gap-2 flex-1">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="Test email address…"
                      className="flex-1 px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <button
                      onClick={testEmailConfiguration}
                      disabled={loading || !testEmail}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      Test
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                Click Refresh to load SMTP settings.
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Activity className="w-4 h-4 text-slate-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  System Health
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time server & database status
                </p>
              </div>
            </div>
            <button
              onClick={fetchSystemStatus}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 border border-slate-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Refresh
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Server */}
              {(() => {
                const online = systemStatus?.server?.status === "online";
                return (
                  <div
                    className={`rounded-xl border p-5 flex items-center gap-4 ${online ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${online ? "bg-emerald-100" : "bg-red-100"}`}
                    >
                      <Activity
                        className={`w-5 h-5 ${online ? "text-emerald-600" : "text-red-600"}`}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Server
                      </p>
                      <p
                        className={`text-sm font-bold ${online ? "text-emerald-700" : "text-red-700"}`}
                      >
                        {online
                          ? "Online"
                          : systemStatus?.server?.status === "offline"
                            ? "Offline"
                            : "Unknown"}
                      </p>
                      {systemStatus?.server?.uptime && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Uptime: {formatUptime(systemStatus.server.uptime)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Database */}
              {(() => {
                const connected = systemStatus?.database?.connected;
                return (
                  <div
                    className={`rounded-xl border p-5 flex items-center gap-4 ${connected ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${connected ? "bg-blue-100" : "bg-red-100"}`}
                    >
                      <Database
                        className={`w-5 h-5 ${connected ? "text-blue-600" : "text-red-600"}`}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Database
                      </p>
                      <p
                        className={`text-sm font-bold ${connected ? "text-blue-700" : "text-red-700"}`}
                      >
                        {connected
                          ? "Connected"
                          : systemStatus?.database?.status === "disconnected"
                            ? "Disconnected"
                            : "Unknown"}
                      </p>
                      {systemStatus?.database?.error && (
                        <p className="text-xs text-red-500 mt-0.5">
                          {systemStatus.database.error}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {systemStatus?.server?.timestamp && (
              <p className="text-xs text-slate-400 text-center mt-4">
                Last checked:{" "}
                {new Date(systemStatus.server.timestamp).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Get the active tab content
  const getActiveTabContent = () => {
    switch (activeTab) {
      case "messages":
        return renderMessagesTab();
      case "passcodes":
        return renderPasscodesTab();
      case "people":
        return renderPeopleTab();
      case "role-emails":
        return renderRoleEmailsTab();
      case "settings":
        return renderSettingsTab();
      default:
        return renderMessagesTab();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-900">
              Admin Tools
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5" />
            Administrator
          </div>
        </div>
      </div>

      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Admin Control Center
              </h1>
              <p className="text-slate-500 text-sm">
                System management, monitoring &amp; configuration
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="transition-all duration-200">
          {getActiveTabContent()}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-4 border-t border-slate-200">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Restricted to authorized administrators only
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
