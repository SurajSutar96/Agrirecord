import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Wallet, LogIn, LogOut, UserCheck, Shield, Menu, X } from "lucide-react";

export default function Header({ user, onLogout, onOpenLogin, onOpenRecharge }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  return (
    <header className="sticky top-4 z-50 mx-auto my-4 w-full max-w-7xl px-4 sm:px-6 lg:px-8 no-print">
      <div className="glass-widget rounded-3xl px-6 py-1.5 shadow-lg border border-emerald-100/50">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate("/")}>
            <div className="bg-[#064e3b] p-2 rounded-xl mr-3 shadow-inner hover-scale">
              <Landmark className="w-5.5 h-5.5 text-[#cddc39]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic leading-none tracking-tight text-slate-800">
                Agri<span className="text-[#8bc34a]">record</span><span className="text-xs align-super ml-0.5 text-emerald-800 font-bold">Pro</span>
              </h1>
              <span className="text-[7.5px] uppercase font-bold tracking-[0.2em] text-slate-400 mt-1">
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
              Generator / जेनरेटर
            </Link>
            {user && (
              <Link
                to="/my-cards"
                className={`text-xs uppercase tracking-wider font-extrabold px-4 py-2 rounded-xl transition-all ${
                  location.pathname === "/my-cards" ? "bg-emerald-800/10 text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                My Cards / मेरे कार्ड
              </Link>
            )}
            {user && user.role === "Admin" && (
              <Link
                to="/admin"
                className={`text-xs uppercase tracking-wider font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all ${
                  location.pathname === "/admin" ? "bg-purple-800/10 text-purple-800 shadow-xs" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" /> Admin Dashboard
              </Link>
            )}
          </nav>

          {/* User Auth Action Items */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Wallet Balance Display */}
                <div 
                  onClick={onOpenRecharge}
                  title="Click to recharge wallet credits"
                  className="bg-emerald-800/10 border border-emerald-800/20 rounded-2xl px-3.5 py-2 flex items-center gap-1.5 text-emerald-950 font-extrabold text-xs shadow-xs hover-scale cursor-pointer hover:bg-emerald-800/20 transition-all"
                >
                  <Wallet className="w-4 h-4 text-emerald-700" />
                  <span>Wallet: {user.role === "Admin" ? "Unlimited" : `${user.freeCredits} Cr`}</span>
                </div>

                {/* Logged in User Profile Info */}
                <div className="hidden sm:flex flex-col text-right leading-none gap-0.5 px-1">
                  <span className="text-xs font-black text-slate-800">{user.name}</span>
                  <span className="text-[8.5px] text-slate-400 font-extrabold uppercase tracking-wider">
                    {user.role} Role
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-2xl hover:bg-red-50 hover:text-red-600 text-slate-600 font-bold text-xs transition-all cursor-pointer hover:border-red-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#064e3b] hover:bg-[#085a44] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md hover-scale cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Login / Signup</span>
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
              Generator / जेनरेटर
            </Link>
            {user && (
              <Link
                to="/my-cards"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xs uppercase tracking-wider font-extrabold px-4 py-2.5 rounded-xl transition-all ${
                  location.pathname === "/my-cards" ? "bg-emerald-800/10 text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                My Cards / मेरे कार्ड
              </Link>
            )}
            {user && user.role === "Admin" && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-xs uppercase tracking-wider font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  location.pathname === "/admin" ? "bg-purple-800/10 text-purple-800 shadow-xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-purple-600" /> Admin Dashboard
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
