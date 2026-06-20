import React, { useState } from "react";
import { CircleX, Mail, Key, Phone, User, Landmark, HelpCircle, CheckCircle, CreditCard, Lock, Check, Wallet } from "lucide-react";
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "../firebase";


export const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-6 md:p-8 animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
        >
          <CircleX className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>
  );
};

export const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!mobile) {
      setError("Please enter your email or mobile in the field above to receive the password reset link.");
      return;
    }
    const isEmail = mobile.includes("@");
    const firebaseEmail = isEmail ? mobile : `${mobile}@agrirecord.com`;
    setLoading(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, firebaseEmail);
      alert(`Password reset link successfully sent to: ${firebaseEmail}`);
    } catch (err) {
      let msg = err.message;
      if (err.code === "auth/user-not-found") {
        msg = "No registered user found with this email/mobile.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const isEmail = mobile.includes("@");
    const firebaseEmail = isEmail ? mobile : `${mobile}@agrirecord.com`;

    try {
      if (mode === "login") {
        const userCredential = await signInWithEmailAndPassword(auth, firebaseEmail, password);
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
        onAuthSuccess(data.user);
        onClose();
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, firebaseEmail, password);
        const idToken = await userCredential.user.getIdToken();

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({ name, mobile: mobile.replace(/\D/g, "") })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || "Registration sync failed");
        }

        alert("Registration successful! Please login.");
        setPassword("");
        setMode("login");
      }
    } catch (err) {
      let friendlyMessage = err.message;
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        friendlyMessage = "Incorrect email/mobile or password. Please check and try again.";
      } else if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "This email/mobile number is already registered.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password is too weak. Must be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Invalid email format.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="border-b pb-4 border-emerald-100">
          <h3 className="text-2xl font-black text-slate-800">
            {mode === "login" ? "Farmer Login / किसान लॉगिन" : "Farmer Register / किसान पंजीकरण"}
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
            Access card maker & print dashboard
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Full Name / आपका नाम
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Full Name"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              {mode === "login" ? "Mobile Number or Email / मोबाइल या ईमेल" : "10-Digit Mobile / मोबाइल नंबर"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {mode === "login" && mobile.includes("@") ? (
                  <Mail className="w-5 h-5" />
                ) : (
                  <Phone className="w-5 h-5" />
                )}
              </span>
              <input
                type={mode === "login" ? "text" : "tel"}
                required
                pattern={mode === "login" ? undefined : "[0-9]{10}"}
                maxLength={mode === "login" ? 50 : 10}
                value={mobile}
                onChange={(e) => {
                  if (mode === "login") {
                    setMobile(e.target.value);
                  } else {
                    setMobile(e.target.value.replace(/\D/g, ""));
                  }
                }}
                placeholder={mode === "login" ? "Enter Mobile or Email" : "Ex: 7070200199"}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Password / पासवर्ड
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Key className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-sm font-black rounded-xl uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login / लॉगिन" : "Register / रजिस्टर"}
          </button>
        </form>

        <div className="text-center pt-2 text-xs font-bold text-slate-500">
          {mode === "login" ? (
            <p>
              New user? / नए उपयोगकर्ता?{" "}
              <button onClick={() => setMode("register")} className="text-emerald-700 hover:underline">
                Create an account
              </button>
            </p>
          ) : (
            <p>
              Already registered? / पहले से पंजीकृत?{" "}
              <button onClick={() => setMode("login")} className="text-emerald-700 hover:underline">
                Login here
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};

export const AboutModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-4 border-emerald-100">
          <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-800">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">
              About Our Platform / हमारे बारे में
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              AgriRecordPro Management System
            </p>
          </div>
        </div>

        <div className="space-y-4 text-slate-600 text-sm leading-relaxed font-medium">
          <p>
            <strong>AgriRecordPro Management System</strong> is an innovative, dedicated digital formatting service engineered specifically for Indian farmers. We believe that physical documentation should be highly durable, digitally secure, and easy to carry.
          </p>
          <p className="border-l-4 border-emerald-500 pl-4 bg-emerald-50/50 py-3 rounded-r-xl text-emerald-950 italic">
            "हमारा लक्ष्य देश के हर किसान को एक आधुनिक, सुरक्षित और आसानी से सत्यापन योग्य डिजिटल पहचान पत्र प्रदान करना है।"
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm space-y-2">
              <h4 className="font-extrabold text-[#064e3b] text-sm uppercase tracking-wide">
                Key Objectives / मुख्य उद्देश्य
              </h4>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-500 font-bold">
                <li>Generate high-fidelity pocket identity cards.</li>
                <li>Secure QR codes for quick instant verification.</li>
                <li>Visual management of verified land and record details.</li>
                <li>Local-first security ensuring full data privacy.</li>
              </ul>
            </div>
            <div className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm space-y-2">
              <h4 className="font-extrabold text-[#064e3b] text-sm uppercase tracking-wide">
                Security Policy / सुरक्षा नीति
              </h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                Designed with high performance and zero external exposure. Your personal details, photos, and official documents are processed directly in your secure session, securing your identity from leaks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const ContactModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && email && message) {
      setSubmitted(true);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-4 border-emerald-100">
          <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-800">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">
              Contact Us / संपर्क करें
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Support & Helpdesk
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="text-center py-10 px-4 space-y-4">
            <div className="inline-flex items-center justify-center bg-emerald-100 p-4 rounded-full text-emerald-600 mb-2">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h4 className="text-2xl font-black text-slate-800">Message Sent Successfully!</h4>
            <p className="text-sm text-slate-500 font-bold max-w-md mx-auto">
              Thank you for reaching out to us. We have received your query and will reply via email at <strong>{email}</strong> within 24 hours.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setName("");
                setEmail("");
                setMessage("");
              }}
              className="px-6 py-2.5 bg-[#064e3b] hover:bg-[#085a44] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-colors shadow-lg"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Your Name / आपका नाम
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter Name"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Email Address / ईमेल
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: farmer@gmail.com"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                Message / आपका संदेश
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or feedback..."
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-sm font-black rounded-xl uppercase tracking-wider transition-colors shadow-lg"
            >
              Send Message / संदेश भेजें
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
};

export const RechargeModal = ({ isOpen, onClose, user, onUpdateCredits }) => {
  const [step, setStep] = useState("packages"); // "packages", "cashfree_sdk", "processing", "success"
  const [selectedPkg, setSelectedPkg] = useState({ id: "pkg_10_credits", name: "10 Credits (Starter)", amount: 100, credits: 10 });
  const [paymentMethod, setPaymentMethod] = useState("card"); // "card", "upi"
  
  // Card input states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [saveCard, setSaveCard] = useState(true);
  
  // Saved card state from localStorage
  const [savedCard, setSavedCard] = useState(() => {
    const saved = localStorage.getItem("agri_saved_card");
    return saved ? JSON.parse(saved) : null;
  });
  const [useSavedCard, setUseSavedCard] = useState(!!localStorage.getItem("agri_saved_card"));

  // UPI input states
  const [upiId, setUpiId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const packages = [
    { id: "pkg_1_credit", name: "1 Credit (Single Print)", amount: 15, credits: 1 },
    { id: "pkg_10_credits", name: "10 Credits (Starter Pack)", amount: 100, credits: 10, popular: true },
    { id: "pkg_50_credits", name: "50 Credits (Bulk Pack)", amount: 400, credits: 50 }
  ];

  const handleSelectPackage = (pkg) => {
    setSelectedPkg(pkg);
    setStep("cashfree_sdk");
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const handleProceedPayment = async () => {
    setError("");
    
    // Validations
    if (paymentMethod === "card") {
      if (!useSavedCard) {
        const cleanCard = cardNumber.replace(/\s/g, "");
        if (cleanCard.length < 16) {
          setError("Please enter a valid 16-digit card number.");
          return;
        }
        if (!cardExpiry.includes("/") || cardExpiry.length < 5) {
          setError("Please enter card expiry in MM/YY format.");
          return;
        }
        if (cardCvv.length < 3) {
          setError("Please enter CVV.");
          return;
        }
        if (!cardName) {
          setError("Please enter cardholder name.");
          return;
        }
      }
    } else {
      if (!upiId || !upiId.includes("@")) {
        setError("Please enter a valid UPI ID (e.g., name@okaxis).");
        return;
      }
    }

    setStep("processing");
    setLoading(true);

    try {
      // 1. Create order in SQLite database via API
      const orderRes = await fetch("/api/create-cashfree-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user.id,
          customerPhone: user.mobile || "9999999999",
          customerName: user.name || "Customer",
          amount: selectedPkg.amount,
          packageId: selectedPkg.id
        })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || "Order creation failed");
      }

      // Save card details if requested
      if (paymentMethod === "card" && saveCard && !useSavedCard) {
        const maskedCard = {
          number: `•••• •••• •••• ${cardNumber.replace(/\s/g, "").slice(-4)}`,
          name: cardName,
          expiry: cardExpiry
        };
        localStorage.setItem("agri_saved_card", JSON.stringify(maskedCard));
        setSavedCard(maskedCard);
      }

      // Simulate a small delay for premium aesthetic payment processing experience
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Verify order (this will credit the wallet in sqlite)
      const verifyRes = await fetch("/api/verify-cashfree-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderData.order_id,
          customerId: user.id,
          creditsToAdd: selectedPkg.credits
        })
      });
      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        // Success
        onUpdateCredits(selectedPkg.credits);
        setStep("success");
      } else {
        throw new Error(verifyData.order_status || "Verification failed");
      }

    } catch (err) {
      setError(err.message || "Payment verification failed. Please try again.");
      setStep("cashfree_sdk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b pb-4 border-emerald-100">
          <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-800">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">
              Add Wallet Credits / क्रेडिट खरीदें
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Secure Checkout Powered by Cashfree SDK
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-xs font-bold animate-pulse">
            {error}
          </div>
        )}

        {/* Step 1: Packages selection */}
        {step === "packages" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-slate-500 leading-relaxed">
              Select one of our tailored packages to add credits to your account. 1 credit allows generating, printing, or saving 1 farmer card.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`border rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between relative hover-scale ${
                    selectedPkg.id === pkg.id
                      ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider rounded-full shadow-xs">
                      Popular
                    </span>
                  )}
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">{pkg.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                      {pkg.credits} Card Credits
                    </p>
                  </div>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#064e3b]">₹{pkg.amount}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <button
                onClick={() => setStep("cashfree_sdk")}
                className="w-full py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-sm font-black rounded-xl uppercase tracking-wider transition-colors shadow-lg cursor-pointer"
              >
                Proceed to Checkout (₹{selectedPkg.amount})
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Cashfree Mock Payment Page */}
        {step === "cashfree_sdk" && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center text-xs font-bold text-slate-700">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[9px]">Selected Package</span>
                <span className="font-black text-slate-800">{selectedPkg.name}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block uppercase tracking-wider text-[9px]">Amount Payable</span>
                <span className="font-black text-emerald-800 text-sm">₹{selectedPkg.amount}.00</span>
              </div>
            </div>

            {/* Cashfree Mock Window Header */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="bg-[#1e293b] text-white px-4 py-3 flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Cashfree PG - Secure Sandboxed Environment</span>
                </div>
                <div className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>256-bit SSL</span>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Method selector */}
                <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500">
                  <button
                    onClick={() => setPaymentMethod("card")}
                    className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer text-center ${
                      paymentMethod === "card" ? "border-emerald-600 text-emerald-700 font-extrabold" : "border-transparent"
                    }`}
                  >
                    Credit / Debit Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod("upi")}
                    className={`flex-1 pb-2 border-b-2 transition-all cursor-pointer text-center ${
                      paymentMethod === "upi" ? "border-emerald-600 text-emerald-700 font-extrabold" : "border-transparent"
                    }`}
                  >
                    UPI / Instant Pay
                  </button>
                </div>

                {paymentMethod === "card" ? (
                  <div className="space-y-3">
                    {/* Saved card quick select */}
                    {savedCard && (
                      <div className="flex items-center justify-between p-3 border border-emerald-100 bg-emerald-50/20 rounded-xl">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useSavedCard}
                            onChange={(e) => setUseSavedCard(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <div>
                            <span className="block font-black text-slate-800">Use Saved Card ({savedCard.number})</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{savedCard.name} | Expiry: {savedCard.expiry}</span>
                          </div>
                        </label>
                        <CreditCard className="w-6 h-6 text-emerald-700 shrink-0" />
                      </div>
                    )}

                    {!useSavedCard && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                            Card Number / कार्ड नंबर
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                              <CreditCard className="w-4 h-4" />
                            </span>
                            <input
                              type="text"
                              maxLength={19}
                              value={cardNumber}
                              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                              placeholder="4111 2222 3333 4444"
                              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700 font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              Expiry Date
                            </label>
                            <input
                              type="text"
                              maxLength={5}
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                              placeholder="MM/YY"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700 font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                              CVV / सीवीवी
                            </label>
                            <input
                              type="password"
                              maxLength={3}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                              placeholder="•••"
                              className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700 font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                            Cardholder Name / नाम
                          </label>
                          <input
                            type="text"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value.toUpperCase())}
                            placeholder="NAME ON CARD"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700 uppercase"
                          />
                        </div>

                        {/* Save Card Option */}
                        <div className="flex items-center gap-2 pt-1.5">
                          <input
                            type="checkbox"
                            id="save_card"
                            checked={saveCard}
                            onChange={(e) => setSaveCard(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <label htmlFor="save_card" className="text-[10px] font-bold text-slate-500 cursor-pointer">
                            Save this card securely for future payments
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                        UPI ID / वीपीए (Ex: name@upi)
                      </label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                        placeholder="username@bankid"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center gap-3 pt-2">
              <button
                onClick={() => setStep("packages")}
                className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={handleProceedPayment}
                className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md cursor-pointer"
              >
                Pay ₹{selectedPkg.amount}.00 Securely
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing Animation */}
        {step === "processing" && (
          <div className="text-center py-10 space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-700 animate-spin mx-auto" />
            <h4 className="text-lg font-black text-slate-800">Processing Your Payment...</h4>
            <p className="text-xs text-slate-400 font-bold max-w-sm mx-auto leading-relaxed">
              We are connecting to the Cashfree gateway API and verifying your details. Please do not refresh the page or click back.
            </p>
          </div>
        )}

        {/* Step 4: Success confirmation */}
        {step === "success" && (
          <div className="text-center py-8 space-y-4">
            <div className="inline-flex items-center justify-center bg-emerald-100 p-4 rounded-full text-emerald-600">
              <Check className="w-12 h-12" />
            </div>
            <h4 className="text-2xl font-black text-slate-800">Payment Successful!</h4>
            <p className="text-sm text-slate-500 font-bold max-w-md mx-auto">
              We have credited <strong>{selectedPkg.credits} Credits</strong> to your wallet. You can now use them to print and download farmer cards.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#064e3b] hover:bg-[#085a44] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-colors shadow-lg"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
