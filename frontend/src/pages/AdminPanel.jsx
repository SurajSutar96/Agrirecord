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
  const [tab, setTab] = useState("overview"); // "overview", "users", or "cards"
  const [modifyingUserId, setModifyingUserId] = useState(null);
  const [modifyCreditsVal, setModifyCreditsVal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCards: 0,
    totalRevenue: 0,
    successRate: 100,
    recentOrders: []
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


  useEffect(() => {
    if (user && user.role === "Admin") {
      fetchAdminData();
    }
  }, [user, tab]);

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
      } else if (tab === "users") {
        const response = await fetch(`/api/admin/users?token=${token}`);
        const data = await response.json();
        if (response.ok) {
          setUsers(data);
        }
      } else {
        const response = await fetch(`/api/admin/cards?token=${token}`);
        const data = await response.json();
        if (response.ok) {
          setCards(data);
        }
      }
    } catch (err) {
      console.error("Admin fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

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
        alert("Wallet credits updated successfully!");
        setModifyingUserId(null);
        fetchAdminData();
      } else {
        alert(data.detail || "Update failed");
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
        alert("User role updated successfully!");
        fetchAdminData();
      } else {
        alert(data.detail || "Update failed");
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
        alert("Card record deleted successfully!");
        fetchAdminData();
      } else {
        const data = await response.json();
        alert(data.detail || "Delete failed");
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
        alert("User account deleted successfully!");
        fetchAdminData();
      } else {
        const data = await response.json();
        alert(data.detail || "Delete failed");
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
  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.mobile.includes(searchTerm) || 
    (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCards = cards.filter((c) => 
    c.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nameHindi.includes(searchTerm) || 
    c.farmerId.includes(searchTerm) ||
    c.mobile.includes(searchTerm)
  );

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
      <div className="flex border-b border-slate-200 mb-6 gap-2 select-none">
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
          <Users className="w-4 h-4" /> Users ({users.length > 0 ? users.length : stats.totalUsers})
        </button>
        <button
          onClick={() => { setTab("cards"); setSearchTerm(""); }}
          className={`pb-3 px-5 text-xs font-black uppercase tracking-widest transition-colors border-b-3 flex items-center gap-2 cursor-pointer ${
            tab === "cards" ? "border-emerald-800 text-emerald-800" : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Landmark className="w-4 h-4" /> Generated Cards ({cards.length > 0 ? cards.length : stats.totalCards})
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

          {/* Recent Checkout logs table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Recent Transactions Log</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time payment logs generated via Cashfree checkout pipeline.</p>
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
                  {stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((o) => (
                      <tr key={o.order_id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono font-bold text-slate-500">{o.order_id}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-slate-800 font-extrabold">{o.customer_name}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">+91 {o.customer_phone}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-extrabold uppercase text-[10px] tracking-wide">{o.package_id.replace(/_/g, " ")}</td>
                        <td className="px-6 py-4 text-slate-900 font-black">₹{o.amount.toFixed(2)}</td>
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
                        No transactions recorded yet in database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
          <div className="flex justify-between items-center gap-4 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
            <div className="relative flex-1 max-w-md">
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
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Displaying {filteredUsers.length} Users
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
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800">{u.name}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{u.id}</span>
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
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Cards search controls */}
          <div className="flex justify-between items-center gap-4 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xs">
            <div className="relative flex-1 max-w-md">
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
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Displaying {filteredCards.length} Generated Cards
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
                  {filteredCards.length > 0 ? (
                    filteredCards.map((c) => (
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
          </div>
        </div>
      )}
    </div>
  );
}
