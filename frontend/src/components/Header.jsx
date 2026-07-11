import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Wallet, LogIn, LogOut, UserCheck, Shield, Menu, X, Globe, Video, Sprout } from "lucide-react";
import { translations } from "../translations";

export default function Header({ user, onLogout, onOpenLogin, onOpenRecharge, onOpenProfile, lang, onSetLang }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <header className="sticky top-2 sm:top-4 z-50 mx-auto my-2 sm:my-4 w-full max-w-7xl px-2 sm:px-6 lg:px-8 no-print">
      <div className="glass-widget rounded-2xl sm:rounded-3xl px-3 sm:px-6 py-1.5 shadow-lg border border-emerald-100/50">
        <div className="flex justify-between items-center h-12 sm:h-14">
          {/* Logo */}
          <div className="flex items-center cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate("/")}>
            <div className="bg-[#064e3b] p-1.5 sm:p-2 rounded-lg sm:rounded-xl mr-2 sm:mr-3 shadow-inner hover-scale flex items-center justify-center">
              <Sprout className="w-4 h-4 sm:w-5.5 sm:h-5.5 text-[#cddc39]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-xl font-black italic leading-none tracking-tight text-slate-800">
                Agri<span className="text-[#8bc34a]">record</span><span className="text-xs align-super ml-0.5 text-emerald-800 font-bold">Pro</span>
              </h1>
              <span className="hidden sm:block text-[7.5px] uppercase font-bold tracking-[0.2em] text-slate-400 mt-1">
                Farmer Identity Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className={`text-xs uppercase tracking-wider font-extrabold px-4 py-2 rounded-xl transition-all ${
                location.pathname === "/" ? "bg-emerald-800/10 text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {translations[lang].home}
            </Link>
            {user && (
              <Link
                to="/my-cards"
                className={`text-xs uppercase tracking-wider font-extrabold px-4 py-2 rounded-xl transition-all ${
                  location.pathname === "/my-cards" ? "bg-emerald-800/10 text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {translations[lang].myCards}
              </Link>
            )}
            {user && user.role === "Admin" && (
              <Link
                to="/admin"
                className={`text-xs uppercase tracking-wider font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                  location.pathname === "/admin" ? "bg-purple-800/10 text-purple-800 shadow-xs" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" /> {translations[lang].adminPanel}
              </Link>
            )}
            <Link
              to="/#video-guides"
              onClick={(e) => {
                if (location.pathname === "/") {
                  e.preventDefault();
                  const element = document.getElementById("video-guides");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }
              }}
              className="text-xs uppercase tracking-wider font-extrabold px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
              <span>{lang === "mr" ? "व्हिडिओ मार्गदर्शक" : lang === "hi" ? "वीडियो गाइड" : "Video Guide"}</span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
              </span>
            </Link>
          </nav>

          {/* User Auth Action Items */}
          <div className="flex items-center gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative flex items-center select-none no-print">
              <select
                value={lang}
                onChange={(e) => onSetLang(e.target.value)}
                className="bg-white/80 border border-slate-200 rounded-xl pl-2.5 pr-6 py-1.5 text-xs font-black text-slate-700 outline-none cursor-pointer focus:ring-4 focus:ring-emerald-100 hover:bg-slate-50 transition-all appearance-none"
              >
                <option value="en">EN</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
            </div>

            {user ? (
              <>
                {/* Wallet Balance Display */}
                <div 
                  onClick={onOpenRecharge}
                  title="Click to recharge wallet credits"
                  className="bg-emerald-800/10 border border-emerald-800/20 rounded-xl sm:rounded-2xl px-2 sm:px-3.5 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-1.5 text-emerald-950 font-extrabold text-[10px] sm:text-xs shadow-xs hover-scale cursor-pointer hover:bg-emerald-800/20 transition-all"
                >
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                  <span className="hidden sm:inline">{translations[lang].wallet}: {user.role === "Admin" ? "Unlimited" : `${user.freeCredits} Cr`}</span>
                  <span className="sm:hidden">{user.role === "Admin" ? "∞" : user.freeCredits}</span>
                </div>

                {/* Logged in User Profile Info */}
                <div 
                  onClick={onOpenProfile}
                  className="hidden sm:flex flex-col text-right leading-none gap-0.5 px-1 cursor-pointer group"
                  title="Click to view profile / edit mobile"
                >
                  <span className="text-xs font-black text-slate-800 group-hover:text-emerald-700 transition-colors">{user.name}</span>
                  <span className="text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wider group-hover:text-emerald-600 transition-colors">
                    {user.role} {user.mobile ? `• ${user.mobile}` : "• Add Phone"}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-200 rounded-xl sm:rounded-2xl hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold text-xs transition-all cursor-pointer hover:border-red-100"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{translations[lang].logout}</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 p-2 sm:px-5 sm:py-2.5 bg-white border border-emerald-800/10 hover:bg-emerald-50/50 hover:border-emerald-800/20 text-[#064e3b] font-black text-xs uppercase tracking-wider sm:tracking-widest rounded-xl sm:rounded-2xl transition-all shadow-xs hover-scale cursor-pointer"
              >
                {/* Colored Google G Logo */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span className="hidden sm:inline">{translations[lang].login}</span>
              </button>
            )}

            {/* Mobile Hamburger menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5.5 h-5.5" /> : <Menu className="w-5.5 h-5.5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 flex flex-col gap-2 mt-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`text-xs uppercase tracking-wider font-extrabold px-4 py-2.5 rounded-xl transition-all ${
                location.pathname === "/" ? "bg-emerald-800/10 text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {translations[lang].home}
            </Link>
            <Link
              to="/#video-guides"
              onClick={(e) => {
                setMobileMenuOpen(false);
                if (location.pathname === "/") {
                  e.preventDefault();
                  const element = document.getElementById("video-guides");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth" });
                  }
                }
              }}
              className="text-xs uppercase tracking-wider font-extrabold px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-700 flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5 text-emerald-700 animate-pulse" />
              <span>{lang === "mr" ? "व्हिडिओ मार्गदर्शक" : lang === "hi" ? "वीडियो गाइड" : "Video Guide"}</span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
              </span>
            </Link>
            {user && (
              <Link
                to="/my-cards"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xs uppercase tracking-wider font-extrabold px-4 py-2.5 rounded-xl transition-all ${
                  location.pathname === "/my-cards" ? "bg-emerald-800/10 text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {translations[lang].myCards}
              </Link>
            )}
            {user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfile();
                }}
                className="text-xs uppercase tracking-wider font-extrabold px-4 py-2.5 rounded-xl text-left text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                {translations[lang].profile} {user.mobile ? `(${user.mobile})` : "(Add Phone)"}
              </button>
            )}
            {user && user.role === "Admin" && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xs uppercase tracking-wider font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  location.pathname === "/admin" ? "bg-purple-800/10 text-purple-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" /> {translations[lang].adminPanel}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// Inline Landmark SVG proxy component if lucide icon fails to import
const Landmark = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="2" y1="22" x2="22" y2="22"></line>
    <line x1="12" y1="2" x2="12" y2="22"></line>
    <polyline points="4 22 4 10 12 5 20 10 20 22"></polyline>
  </svg>
);
