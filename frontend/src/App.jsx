import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Header from "./components/Header";
import MainGenerator from "./pages/MainGenerator";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import PolicyPage from "./pages/PolicyPage";
import { RechargeModal, ProfileModal } from "./components/Modals";
import { Landmark, HelpCircle, Mail, ShieldAlert, FileText, Truck, RotateCcw, CreditCard } from "lucide-react";
import { auth, googleProvider, signInWithPopup } from "./firebase";

export default function App() {
  const [user, setUser] = useState(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("agri_record_token");
    localStorage.removeItem("agri_record_user");
    setUser(null);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleGoogleLogin = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Authentication sync failed");
      }

      localStorage.setItem("agri_record_token", data.token);
      localStorage.setItem("agri_record_user", JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        alert(err.message || "Google Sign-In failed. Please try again.");
      }
    }
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("agri_record_user");
    const token = localStorage.getItem("agri_record_token");
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        // Verify session validity with backend on mount
        fetch(`/api/auth/me?token=${token}`)
          .then(res => {
            if (res.ok) {
              return res.json();
            } else {
              handleLogout();
              return null;
            }
          })
          .then(freshUser => {
            if (freshUser) {
              localStorage.setItem("agri_record_user", JSON.stringify(freshUser));
              setUser(freshUser);
            }
          })
          .catch(() => handleLogout());
      } catch (e) {
        console.error("Failed to parse user session:", e);
        handleLogout();
      }
    }

    // Set up global event listener to open login directly from child pages
    const openLoginListener = () => handleGoogleLogin();
    window.addEventListener("open_login_modal", openLoginListener);
    return () => window.removeEventListener("open_login_modal", openLoginListener);
  }, []);

  // Screenshot & screen capture protection (desktop only, no blur)
  useEffect(() => {
    // Block right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Block keyboard shortcuts for screenshots & dev tools
    const handleKeyDown = (e) => {
      // PrintScreen key
      if (e.key === "PrintScreen") {
        e.preventDefault();
        navigator.clipboard.writeText("").catch(() => {});
        return false;
      }
      // Ctrl+Shift+S (Windows Snipping), Ctrl+Shift+I (DevTools), F12
      if (
        (e.ctrlKey && e.shiftKey && (e.key === "S" || e.key === "s" || e.key === "I" || e.key === "i")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "p")
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleUpdateCredits = (creditDiff) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, freeCredits: prev.freeCredits + creditDiff };
      localStorage.setItem("agri_record_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#f0f4f2] no-select screen-protected">
        {/* Navigation Header */}
        <Header 
          user={user} 
          onLogout={handleLogout} 
          onOpenLogin={handleGoogleLogin} 
          onOpenRecharge={() => setRechargeOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
        />

        {/* Dynamic Route Pages */}
        <div className="flex-1">
          <Routes>
            <Route 
              path="/" 
              element={
                <MainGenerator 
                  user={user} 
                  onAuthSuccess={handleAuthSuccess} 
                  onUpdateCredits={handleUpdateCredits} 
                  onOpenRecharge={() => setRechargeOpen(true)}
                />
              } 
            />
            <Route 
              path="/my-cards" 
              element={<Dashboard user={user} />} 
            />
            <Route 
              path="/admin" 
              element={<AdminPanel user={user} onAuthSuccess={handleAuthSuccess} />} 
            />
            <Route path="/:policyType" element={<PolicyPage />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 no-print">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-800" />
              <span>&copy; {new Date().getFullYear()} AgriRecordPro. All Rights Reserved by SURAJ SUTAR.</span>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-end">
              <Link to="/terms" className="hover:text-slate-600 transition-colors flex items-center gap-1">
                <FileText className="w-4 h-4" /> Terms & Conditions
              </Link>
              <Link to="/privacy-policy" className="hover:text-slate-600 transition-colors flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" /> Privacy Policy
              </Link>
              <Link to="/refund-policy" className="hover:text-slate-600 transition-colors flex items-center gap-1">
                <CreditCard className="w-4 h-4" /> Refund & Cancellation
              </Link>
              <Link to="/return-policy" className="hover:text-slate-600 transition-colors flex items-center gap-1">
                <RotateCcw className="w-4 h-4" /> Return Policy
              </Link>
              <Link to="/shipping-policy" className="hover:text-slate-600 transition-colors flex items-center gap-1">
                <Truck className="w-4 h-4" /> Shipping Policy
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-end">
              <Link 
                to="/about-us"
                className="hover:text-slate-600 transition-colors flex items-center gap-1"
              >
                <HelpCircle className="w-4 h-4" /> About Us
              </Link>
              <Link 
                to="/contact-us"
                className="hover:text-slate-600 transition-colors flex items-center gap-1"
              >
                <Mail className="w-4 h-4" /> Support Helpdesk
              </Link>
            </div>
          </div>
        </footer>

        {/* Google Sign-in Handled Directly */}



        {/* Recharge Wallet Modal */}
        <RechargeModal 
          isOpen={rechargeOpen} 
          onClose={() => setRechargeOpen(false)} 
          user={user} 
          onUpdateCredits={handleUpdateCredits}
        />

        {/* Profile Settings Modal */}
        <ProfileModal
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={user}
          onUpdateUser={(updatedUser) => setUser(updatedUser)}
        />


      </div>
    </Router>
  );
}
