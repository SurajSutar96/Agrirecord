import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Header from "./components/Header";
import MainGenerator from "./pages/MainGenerator";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import PolicyPage from "./pages/PolicyPage";
import VerifyCard from "./pages/VerifyCard";
import { RechargeModal, ProfileModal } from "./components/Modals";
import { Landmark, HelpCircle, Mail, ShieldAlert, FileText, CreditCard } from "lucide-react";
import { auth, googleProvider, signInWithPopup } from "./firebase";
import { ToastContainer } from "./components/Toast";


export default function App() {
  const [user, setUser] = useState(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem("agri_record_lang") || "en");

  const handleSetLang = (newLang) => {
    localStorage.setItem("agri_record_lang", newLang);
    setLang(newLang);
  };

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
        window.showToast(err.message || "Google Sign-In failed. Please try again.", "error");
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
          lang={lang}
          onSetLang={handleSetLang}
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
                  lang={lang}
                />
              } 
            />
            <Route 
              path="/my-cards" 
              element={<Dashboard user={user} lang={lang} />} 
            />
            <Route 
              path="/admin" 
              element={<AdminPanel user={user} onAuthSuccess={handleAuthSuccess} />} 
            />
            <Route 
              path="/verify/:cardId" 
              element={<VerifyCard lang={lang} />} 
            />
            <Route path="/:policyType" element={<PolicyPage />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 no-print">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-800" />
              <span>&copy; {new Date().getFullYear()} AgriRecordPro. All Rights Reserved by Aditya Jagtap.</span>
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
          lang={lang}
        />

        {/* Profile Settings Modal */}
        <ProfileModal
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          user={user}
          onUpdateUser={(updatedUser) => setUser(updatedUser)}
        />

        {/* Global Toast Notifications */}
        <ToastContainer />


        {/* Floating WhatsApp Support Widget */}
        <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-center gap-1.5 no-print select-none">
          <a
            href={`https://wa.me/917057107982?text=${encodeURIComponent(
              `Hi Aditya, I need support / assistance on AgriRecordPro. Registered details - Name: ${user?.name || 'Farmer'}, Mobile: ${user?.mobile || 'N/A'}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] hover:scale-110 shadow-lg text-white flex items-center justify-center transition-all duration-300 cursor-pointer"
            title="Chat with support on WhatsApp"
          >
            <svg className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.416 1.46 5.561 0 10.088-4.526 10.091-10.087.001-2.693-1.045-5.225-2.946-7.128C17.3 1.503 14.77 1.459 12.008 1.459c-5.564 0-10.09 4.526-10.094 10.088-.002 1.902.501 3.762 1.458 5.378L1.879 21.62l4.768-1.258L6.647 19.16z"/>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004"/>
            </svg>
          </a>
          <span className="text-[10px] sm:text-xs font-black text-slate-500 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-slate-100 shadow-md uppercase tracking-widest leading-none text-center">
            Support
          </span>
        </div>

      </div>
    </Router>
  );
}
