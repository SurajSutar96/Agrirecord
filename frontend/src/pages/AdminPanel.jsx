import React, { useState, useEffect } from "react";
import { 
  Users, CreditCard, Shield, Landmark, Loader2, Save, Trash2, Mail, Key,
  IndianRupee, Percent, Activity, Search, UserMinus, Plus
} from "lucide-react";
import { auth, googleProvider, signInWithPopup } from "../firebase";

export default function AdminPanel({ user, onAuthSuccess }) {
  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview"); // "overview", "users", "cards", "logs", "settings"
  const [modifyingUserId, setModifyingUserId] = useState(null);
  const [modifyCreditsVal, setModifyCreditsVal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [txStatusFilter, setTxStatusFilter] = useState("ALL"); // "ALL", "PAID", "PENDING", "FAILED"
  const [txPage, setTxPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [cardsPage, setCardsPage] = useState(1);

  const [usersTotal, setUsersTotal] = useState(0);
  const [cardsTotal, setCardsTotal] = useState(0);
  const [txTotal, setTxTotal] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({
    credit_price: 15.0,
    pkg_basic_price: 150.0,
    pkg_silver_price: 400.0,
    pkg_gold_price: 1200.0,
    support_phone: "+91 70571 07982",
    support_message: "Hi Aditya, I am facing an issue with AgriRecord."
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    setTxPage(1);
    setUsersPage(1);
    setCardsPage(1);
  }, [tab, searchTerm, txStatusFilter]);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCards: 0,
    totalRevenue: 0,
    successRate: 100,
    recentOrders: [],
    revenueChartData: [],
    cardsChartData: []
  });

  // Admin login states
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const handleGoogleAdminLogin = async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Authentication sync failed");
      }
      if (data.user.role !== "Admin") {
        throw new Error("Access denied. Admin role required. Only authorized Gmail accounts are allowed.");
      }
      localStorage.setItem("agri_record_token", data.token);
      localStorage.setItem("agri_record_user", JSON.stringify(data.user));
      if (onAuthSuccess) {
        onAuthSuccess(data.user);
      }
    } catch (err) {
      console.error("Admin Google Sign-In Error:", err);
      let friendlyMessage = err.message;
      if (err.code === "auth/popup-closed-by-user") {
        friendlyMessage = "Google login window was closed before completion.";
      }
      setLoginError(friendlyMessage || "Failed to log in as administrator.");
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    const token = localStorage.getItem("agri_record_token");
    try {
      if (tab === "overview") {
        const response = await fetch(`/api/admin/stats?token=${token}`);
        const data = await response.json();
        if (response.ok) {
          setStats(data);
        }
        
        const txResponse = await fetch(`/api/admin/transactions?token=${token}&page=${txPage}&limit=${itemsPerPage}&status=${txStatusFilter}`);
        const txData = await txResponse.json();
        if (txResponse.ok) {
          setTransactions(txData.items || []);
          setTxTotal(txData.total || 0);
        }
      } else if (tab === "users") {
        const response = await fetch(`/api/admin/users?token=${token}&page=${usersPage}&limit=${itemsPerPage}&search=${searchTerm}`);
        const data = await response.json();
        if (response.ok) {
          setUsers(data.items || []);
          setUsersTotal(data.total || 0);
        }
      } else if (tab === "cards") {
        const response = await fetch(`/api/admin/cards?token=${token}&page=${cardsPage}&limit=${itemsPerPage}&search=${searchTerm}`);
        const data = await response.json();
        if (response.ok) {
          setCards(data.items || []);
          setCardsTotal(data.total || 0);
        }
      } else if (tab === "logs") {
        const response = await fetch(`/api/admin/logs?token=${token}&limit=50`);
        const data = await response.json();
        if (response.ok) {
          setAdminLogs(data || []);
        }
      } else if (tab === "settings") {
        const SETTINGS_CACHE_KEY = "agri_settings_cache";
        const SETTINGS_TTL_MS = 60 * 60 * 1000; // 1 hour

        // Show cached settings immediately if fresh
        try {
          const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
          if (cached) {
            const { data: cachedSettings, ts } = JSON.parse(cached);
            if (cachedSettings && Date.now() - ts < SETTINGS_TTL_MS) {
              setGlobalSettings(cachedSettings);
              setLoading(false); // no spinner needed, cache hit
            }
          }
        } catch (e) { /* ignore */ }

        // Always refresh from server in background
        const response = await fetch(`/api/admin/settings?token=${token}`);
        const data = await response.json();
        if (response.ok) {
          setGlobalSettings(data);
          // Update cache
          try {
            localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
          } catch (e) { /* ignore */ }
        }
      }
    } catch (err) {
      console.error("Admin fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "Admin") {
      fetchAdminData();
    }
  }, [user, tab, txPage, usersPage, cardsPage, txStatusFilter, searchTerm]);

  const handleUpdateCredits = async (userId) => {
    const token = localStorage.getItem("agri_record_token");
    try {
      const response = await fetch("/api/admin/update-credits", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ userId, credits: Number(modifyCreditsVal) }),
      });
      const data = await response.json();
      if (response.ok) {
        window.showToast("Wallet credits updated successfully!", "success");
        setModifyingUserId(null);
        fetchAdminData();
      } else {
        window.showToast(data.detail || "Update failed", "error");
      }
    } catch (err) {
      console.error("Update credits error:", err);
    }
  };

  const handleUpdateRole = async (userId, role) => {
    const token = localStorage.getItem("agri_record_token");
    try {
      const response = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ userId, role }),
      });
      const data = await response.json();
      if (response.ok) {
        window.showToast("User role updated successfully!", "success");
        fetchAdminData();
      } else {
        window.showToast(data.detail || "Update failed", "error");
      }
    } catch (err) {
      console.error("Update role error:", err);
    }
  };

  const handleDeleteCard = async (cardId) => {
    const confirmDel = window.confirm("Are you sure you want to delete this generated farmer card record?");
    if (!confirmDel) return;
    const token = localStorage.getItem("agri_record_token");
    try {
      const response = await fetch(`/api/admin/cards/${cardId}?token=${token}`, {
        method: "DELETE",
      });
      if (response.ok) {
        window.showToast("Card record deleted successfully!", "success");
        fetchAdminData();
      } else {
        const data = await response.json();
        window.showToast(data.detail || "Delete failed", "error");
      }
    } catch (err) {
      console.error("Delete card error:", err);
    }
  };

  const handleDeleteUser = async (userId) => {
    const confirmDel = window.confirm("Are you sure you want to delete this user account? All their generated cards will be preserved but they won't be able to log in.");
    if (!confirmDel) return;
    const token = localStorage.getItem("agri_record_token");
    try {
      const response = await fetch(`/api/admin/users/${userId}?token=${token}`, {
        method: "DELETE",
      });
      if (response.ok) {
        window.showToast("User account deleted successfully!", "success");
        fetchAdminData();
      } else {
        const data = await response.json();
        window.showToast(data.detail || "Delete failed", "error");
      }
    } catch (err) {
      console.error("Delete user error:", err);
    }
  };

  if (!user || user.role !== "Admin") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md animate-in fade-in zoom-in duration-200">
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex p-3 bg-red-50 text-red-600 rounded-2xl">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Admin Login / व्यवस्थापक लॉगिन</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Authorized personnel only
            </p>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-xs font-bold mb-4">
              {loginError}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-xs font-bold text-slate-500 text-center leading-relaxed">
              Please sign in with your registered administrator Google Account (Gmail) to access the console.
            </p>
            <button
              onClick={handleGoogleAdminLogin}
              disabled={loginLoading}
              className="w-full py-3.5 bg-[#064e3b] hover:bg-[#085a44] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 hover-scale"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current mr-1" viewBox="0 0 24 24">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.072 0-5.564-2.492-5.564-5.564s2.492-5.564 5.564-5.564c1.324 0 2.506.467 3.44 1.3l2.846-2.846C18.423 4.103 15.547 3 12.24 3 6.577 3 2 7.577 2 13.24s4.577 10.24 10.24 10.24c5.795 0 10.254-4.074 10.254-10.24 0-.695-.08-1.355-.22-1.955H12.24z"/>
                  </svg>
                  <span>Sign in with Google / गूगल से लॉगिन करें</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter helper logic
  const filteredUsers = users;
  const filteredCards = cards;
  const filteredTransactions = transactions;

  const paginatedTransactions = transactions;
  const paginatedUsers = users;
  const paginatedCards = cards;

  const exportToCSV = (data, headers, filename) => {
    const csvRows = [];
    csvRows.push(headers.join(","));
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] === undefined || row[header] === null ? "" : row[header];
        const escaped = ("" + val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(","));
    }
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => encodeURIComponent(e)).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportTransactions = async () => {
    const token = localStorage.getItem("agri_record_token");
    try {
      const res = await fetch(`/api/admin/transactions?token=${token}&page=1&limit=5000&status=${txStatusFilter}`);
      const data = await res.json();
      if (res.ok && data.items) {
        exportToCSV(data.items, ["order_id", "customer_name", "customer_phone", "package_id", "amount", "status", "createdAt"], "transactions_report.csv");
      }
    } catch (e) {
      console.error(e);
      window.showToast("Failed to export transactions", "error");
    }
  };

  const handleExportUsers = async () => {
    const token = localStorage.getItem("agri_record_token");
    try {
      const res = await fetch(`/api/admin/users?token=${token}&page=1&limit=5000&search=${searchTerm}`);
      const data = await res.json();
      if (res.ok && data.items) {
        exportToCSV(data.items, ["id", "name", "mobile", "email", "role", "freeCredits"], "users_report.csv");
      }
    } catch (e) {
      console.error(e);
      window.showToast("Failed to export users", "error");
    }
  };

  const handleExportCards = async () => {
    const token = localStorage.getItem("agri_record_token");
    try {
      const res = await fetch(`/api/admin/cards?token=${token}&page=1&limit=5000&search=${searchTerm}`);
      const data = await res.json();
      if (res.ok && data.items) {
        exportToCSV(data.items, ["farmerId", "nameEnglish", "nameHindi", "dob", "gender", "mobile", "aadhaar", "state", "downloadDate"], "cards_report.csv");
      }
    } catch (e) {
      console.error(e);
      window.showToast("Failed to export cards", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 no-print transition-all duration-300">
      {/* Header Title section */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Admin Console Dashboard</h2>
          <p className="text-sm font-semibold text-slate-400">
            Monitor real-time system revenue, manage registered farmer user credentials, and audit generated identification documents.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5 text-emerald-950 font-black text-xs shadow-xs">
          <Activity className="w-4 h-4 text-emerald-700 animate-pulse" />
          <span>System Online & Secure</span>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="flex border-b border-slate-200 mb-6 gap-2 select-none flex-wrap">
        <button
          onClick={() => { setTab("overview"); setSearchTerm(""); }}
          className={`pb-3 px-5 text-xs font-black uppercase tracking-widest transition-colors border-b-3 flex items-center gap-2 cursor-pointer ${
            tab === "overview" ? "border-emerald-800 text-emerald-800" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Activity className="w-4 h-4" /> Overview stats
        </button>
        <button
          onClick={() => { setTab("users"); setSearchTerm(""); }}
          className={`pb-3 px-5 text-xs font-black uppercase tracking-widest transition-colors border-b-3 flex items-center gap-2 cursor-pointer ${
            tab === "users" ? "border-emerald-800 text-emerald-800" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Users className="w-4 h-4" /> Users ({usersTotal > 0 ? usersTotal : stats.totalUsers})
        </button>
        <button
          onClick={() => { setTab("cards"); setSearchTerm(""); }}
          className={`pb-3 px-5 text-xs font-black uppercase tracking-widest transition-colors border-b-3 flex items-center gap-2 cursor-pointer ${
            tab === "cards" ? "border-emerald-800 text-emerald-800" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Landmark className="w-4 h-4" /> Generated Cards ({cardsTotal > 0 ? cardsTotal : stats.totalCards})
        </button>
        <button
          onClick={() => { setTab("logs"); setSearchTerm(""); }}
          className={`pb-3 px-5 text-xs font-black uppercase tracking-widest transition-colors border-b-3 flex items-center gap-2 cursor-pointer ${
            tab === "logs" ? "border-emerald-800 text-emerald-800" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Shield className="w-4 h-4" /> Activity Logs
        </button>
        <button
          onClick={() => { setTab("settings"); setSearchTerm(""); }}
          className={`pb-3 px-5 text-xs font-black uppercase tracking-widest transition-colors border-b-3 flex items-center gap-2 cursor-pointer ${
            tab === "settings" ? "border-emerald-800 text-emerald-800" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Key className="w-4 h-4" /> System Settings
        </button>
      </div>

      {loading ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-emerald-700 animate-spin" />
        </div>
      ) : tab === "overview" ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Key Metrics Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="premium-card rounded-3xl p-6 bg-white space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Total Revenue</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-2xl">
                  <IndianRupee className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 leading-none">₹{stats.totalRevenue.toLocaleString("en-IN")}</h3>
                <span className="text-[10px] font-bold text-emerald-600 block mt-2 uppercase tracking-wide">Paid order transactions</span>
              </div>
            </div>

            <div className="premium-card rounded-3xl p-6 bg-white space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Registered Farmers</span>
                <div className="p-2.5 bg-blue-50 text-blue-800 rounded-2xl">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 leading-none">{stats.totalUsers}</h3>
                <span className="text-[10px] font-bold text-blue-600 block mt-2 uppercase tracking-wide">Active portal accounts</span>
              </div>
            </div>

            <div className="premium-card rounded-3xl p-6 bg-white space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cards Generated</span>
                <div className="p-2.5 bg-amber-50 text-amber-800 rounded-2xl">
                  <Landmark className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 leading-none">{stats.totalCards}</h3>
                <span className="text-[10px] font-bold text-amber-600 block mt-2 uppercase tracking-wide">Kisan Pehchan Patra</span>
              </div>
            </div>

            <div className="premium-card rounded-3xl p-6 bg-white space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Success Rate</span>
                <div className="p-2.5 bg-purple-50 text-purple-800 rounded-2xl">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-800 leading-none">{stats.successRate}%</h3>
                <span className="text-[10px] font-bold text-purple-600 block mt-2 uppercase tracking-wide">Checkout completion</span>
              </div>
            </div>
          </div>

          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DailyRevenueChart data={stats.revenueChartData || []} />
            <DailyCardsChart data={stats.cardsChartData || []} />
          </div>

          {/* Recent Checkout logs table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4 border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Recent Transactions Log</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time payment logs generated via Cashfree checkout pipeline.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportTransactions}
                  className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer hover-scale"
                >
                  Export CSV
                </button>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
                  {["ALL", "PAID", "PENDING", "FAILED"].map((status) => {
                    const isActive = txStatusFilter === status;
                    return (
                      <button
                        key={status}
                        onClick={() => setTxStatusFilter(status)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          isActive
                            ? "bg-white text-slate-800 shadow-sm border border-slate-200/50"
                            : "text-slate-400 hover:text-slate-650 border border-transparent"
                        }`}
                      >
                        {status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Customer Name / Phone</th>
                    <th className="px-6 py-4">Package</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Date Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((o) => (
                      <tr key={o.order_id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono font-bold text-slate-500">{o.order_id}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-800 font-extrabold">{o.customer_name}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">+91 {o.customer_phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-extrabold uppercase text-[10px] tracking-wide">
                          {o.package_id ? o.package_id.replace(/_/g, " ") : "Wallet Recharge"}
                        </td>
                        <td className="px-6 py-4 text-slate-900 font-black">₹{o.amount ? o.amount.toFixed(2) : "0.00"}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            o.status === "PAID" 
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                              : o.status === "FAILED" 
                              ? "bg-red-50 text-red-800 border border-red-100" 
                              : "bg-amber-50 text-amber-800 border border-amber-100"
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400">{o.createdAt}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400 font-semibold">
                        No transactions recorded for the selected status.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={txPage}
              totalItems={txTotal}
              itemsPerPage={itemsPerPage}
              onPageChange={setTxPage}
            />
          </div>
        </div>
      ) : tab === "users" ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* User Administration Header */}
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">User Administration</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Manage member accounts, assign credentials, adjust wallet balances, and configure portal roles.</p>
            </div>
          </div>

          {/* Users search controls */}
          <div className="flex justify-between items-center gap-4 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs flex-wrap">
            <div className="relative flex-1 min-w-[250px] max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user profiles by name, mobile, email..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportUsers}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer hover-scale"
              >
                Export CSV
              </button>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Total Users: {usersTotal}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Farmer Name</th>
                    <th className="px-6 py-4">Phone / Email</th>
                    <th className="px-6 py-4">Authorization</th>
                    <th className="px-6 py-4">Wallet Balance</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span>+91 {u.mobile}</span>
                            <span className="text-slate-400 font-semibold">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-1.5 font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                          >
                            <option value="User">User / सदस्य</option>
                            <option value="Admin">Admin / व्यवस्थापक</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 font-black">
                          {modifyingUserId === u.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={modifyCreditsVal}
                                onChange={(e) => setModifyCreditsVal(e.target.value)}
                                className="w-16 p-1 border border-slate-300 rounded-lg text-center"
                              />
                              <button
                                onClick={() => handleUpdateCredits(u.id)}
                                className="p-1.5 bg-[#064e3b] hover:bg-[#085a44] text-white rounded-lg shadow-xs cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-800">
                              <CreditCard className="w-4 h-4 text-emerald-600" /> {u.role === "Admin" ? "Unlimited" : `${u.freeCredits} Credits`}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-3 mt-1.5">
                          {modifyingUserId === u.id ? (
                            <button
                              onClick={() => setModifyingUserId(null)}
                              className="text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setModifyingUserId(u.id);
                                setModifyCreditsVal(u.freeCredits);
                              }}
                              className="text-emerald-700 hover:text-emerald-950 font-bold hover:underline cursor-pointer"
                            >
                              Edit Credits
                            </button>
                          )}
                          
                          {/* Account deletion trigger */}
                          {u.mobile !== "0000000000" && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer animate-in zoom-in duration-100"
                              title="Delete Account"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400 font-semibold">
                        No matching user accounts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={usersPage}
              totalItems={usersTotal}
              itemsPerPage={itemsPerPage}
              onPageChange={setUsersPage}
            />
          </div>
        </div>
      ) : tab === "cards" ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Cards search controls */}
          <div className="flex justify-between items-center gap-4 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs flex-wrap">
            <div className="relative flex-1 min-w-[250px] max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search printed cards by ID, name, mobile..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700"
              />
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportCards}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-950 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs cursor-pointer hover-scale"
              >
                Export CSV
              </button>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Total Cards: {cardsTotal}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Farmer Card ID</th>
                    <th className="px-6 py-4">Hindi / English Name</th>
                    <th className="px-6 py-4">State / District</th>
                    <th className="px-6 py-4">Aadhaar No.</th>
                    <th className="px-6 py-4">Mobile</th>
                    <th className="px-6 py-4">Created Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {paginatedCards.length > 0 ? (
                    paginatedCards.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-black text-slate-800">{c.farmerId}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col leading-tight">
                            <span className="text-sm font-black text-slate-800">{c.nameHindi}</span>
                            <span className="text-slate-400 font-semibold">{c.nameEnglish}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span>{c.state}</span>
                            <span className="text-slate-400 font-semibold">
                              {c.landDetails[0]?.district || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono">
                          {c.aadhaar.replace(/(\d{4})/g, "$1 ").trim()}
                        </td>
                        <td className="px-6 py-4">+91 {c.mobile}</td>
                        <td className="px-6 py-4 text-slate-400">{c.downloadDate}</td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteCard(c.id)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Card Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-400 font-semibold">
                        No generated cards match your query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={cardsPage}
              totalItems={cardsTotal}
              itemsPerPage={itemsPerPage}
              onPageChange={setCardsPage}
            />
          </div>
        </div>
      ) : tab === "logs" ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Administrative Activity Logs</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Audit trail of modifications, deletions, roles, and settings updates executed by administrators.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black uppercase text-slate-500 tracking-wider">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Admin Name</th>
                    <th className="px-6 py-4">Action Type</th>
                    <th className="px-6 py-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {adminLogs.length > 0 ? (
                    adminLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-slate-400 font-mono">{log.timestamp}</td>
                        <td className="px-6 py-4 text-slate-800 font-extrabold">{log.admin_name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            log.action_type === "UPDATE_SETTINGS"
                              ? "bg-blue-50 text-blue-800 border border-blue-100"
                              : log.action_type.startsWith("DELETE")
                              ? "bg-red-50 text-red-800 border border-red-100"
                              : "bg-amber-50 text-amber-800 border border-amber-100"
                          }`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">{log.description}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-slate-400 font-semibold">
                        No activity logs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-xs">
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">System Settings</h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">Configure billing prices, wallet credit conversion packages, and WhatsApp customer support messages.</p>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSavingSettings(true);
              const token = localStorage.getItem("agri_record_token");
              try {
                const response = await fetch("/api/admin/settings", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    credit_price: Number(globalSettings.credit_price),
                    pkg_basic_price: Number(globalSettings.pkg_basic_price),
                    pkg_silver_price: Number(globalSettings.pkg_silver_price),
                    pkg_gold_price: Number(globalSettings.pkg_gold_price),
                    support_phone: globalSettings.support_phone,
                    support_message: globalSettings.support_message
                  })
                });
                const resData = await response.json();
                if (response.ok) {
                  window.showToast("System settings saved successfully!", "success");
                  try {
                    localStorage.removeItem("agri_settings_cache");
                  } catch (err) {}
                } else {
                  window.showToast(resData.detail || "Failed to save settings", "error");
                }
              } catch (err) {
                console.error(err);
                window.showToast("Failed to save settings", "error");
              } finally {
                setSavingSettings(false);
              }
            }}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Price Per Credit (₹)</label>
                <input
                  type="number"
                  step="0.1"
                  value={globalSettings.credit_price}
                  onChange={(e) => setGlobalSettings({...globalSettings, credit_price: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 outline-none text-xs font-bold text-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Starter Plan Price (10 Credits)</label>
                <input
                  type="number"
                  value={globalSettings.pkg_basic_price}
                  onChange={(e) => setGlobalSettings({...globalSettings, pkg_basic_price: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 outline-none text-xs font-bold text-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Bulk Plan Price (50 Credits)</label>
                <input
                  type="number"
                  value={globalSettings.pkg_silver_price}
                  onChange={(e) => setGlobalSettings({...globalSettings, pkg_silver_price: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 outline-none text-xs font-bold text-slate-700"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Gold Plan Price (100 Credits)</label>
                <input
                  type="number"
                  value={globalSettings.pkg_gold_price}
                  onChange={(e) => setGlobalSettings({...globalSettings, pkg_gold_price: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 outline-none text-xs font-bold text-slate-700"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">WhatsApp Support Phone Number</label>
                <input
                  type="text"
                  value={globalSettings.support_phone}
                  onChange={(e) => setGlobalSettings({...globalSettings, support_phone: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 outline-none text-xs font-bold text-slate-700"
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">WhatsApp Default Support Message</label>
                <textarea
                  rows="3"
                  value={globalSettings.support_message}
                  onChange={(e) => setGlobalSettings({...globalSettings, support_message: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 outline-none text-xs font-bold text-slate-700 resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50 hover-scale"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Configurations
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl no-print select-none">
      <div className="text-xs font-bold text-slate-500">
        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
        >
          Prev
        </button>
        <div className="flex items-center gap-1.5">
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            if (totalPages > 5 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
              if (pageNum === 2 || pageNum === totalPages - 1) {
                return <span key={pageNum} className="text-slate-400 text-xs font-bold px-1">...</span>;
              }
              return null;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? "bg-[#064e3b] text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
};

const DailyRevenueChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const maxAmount = Math.max(...data.map(d => d.amount), 1);
  const chartHeight = 120;
  const barWidth = 35;
  const gap = 15;
  const paddingLeft = 40;
  const paddingTop = 20;
  const totalWidth = data.length * (barWidth + gap) + paddingLeft;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs animate-in fade-in duration-300">
      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">7-Day Revenue Trend (₹)</h4>
      <div className="overflow-x-auto">
        <svg width="100%" height={chartHeight + 50} viewBox={`0 0 ${totalWidth} ${chartHeight + 50}`} className="min-w-[320px]">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + (1 - ratio) * chartHeight;
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={totalWidth} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px] font-bold">
                  ₹{Math.round(ratio * maxAmount)}
                </text>
              </g>
            );
          })}
          
          {data.map((d, index) => {
            const barHeight = (d.amount / maxAmount) * chartHeight;
            const x = paddingLeft + index * (barWidth + gap);
            const y = chartHeight + paddingTop - barHeight;
            const dateLabel = d.date.split("-").slice(1).join("/");
            
            return (
              <g key={index} className="group cursor-pointer">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#emeraldGradient)"
                  rx="6"
                  className="transition-all duration-300 hover:fill-[#085a44]"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-emerald-800 text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ₹{d.amount}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + paddingTop + 18}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px] font-bold"
                >
                  {dateLabel}
                </text>
              </g>
            );
          })}
          
          <defs>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

const DailyCardsChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 120;
  const barWidth = 35;
  const gap = 15;
  const paddingLeft = 40;
  const paddingTop = 20;
  const totalWidth = data.length * (barWidth + gap) + paddingLeft;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs animate-in fade-in duration-300">
      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">7-Day Card Volume Trend</h4>
      <div className="overflow-x-auto">
        <svg width="100%" height={chartHeight + 50} viewBox={`0 0 ${totalWidth} ${chartHeight + 50}`} className="min-w-[320px]">
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + (1 - ratio) * chartHeight;
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={totalWidth} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px] font-bold">
                  {Math.round(ratio * maxCount)}
                </text>
              </g>
            );
          })}
          
          {data.map((d, index) => {
            const barHeight = (d.count / maxCount) * chartHeight;
            const x = paddingLeft + index * (barWidth + gap);
            const y = chartHeight + paddingTop - barHeight;
            const dateLabel = d.date.split("-").slice(1).join("/");
            
            return (
              <g key={index} className="group cursor-pointer">
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="url(#blueGradient)"
                  rx="6"
                  className="transition-all duration-300 hover:fill-blue-800"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-blue-800 text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {d.count}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + paddingTop + 18}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px] font-bold"
                >
                  {dateLabel}
                </text>
              </g>
            );
          })}
          
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};
