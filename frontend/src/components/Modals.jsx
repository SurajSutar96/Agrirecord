import React, { useState } from "react";
import { CircleX, Mail, Key, Phone, User, Landmark, HelpCircle, CheckCircle, CreditCard, Lock, Check, Wallet, Loader2, ShieldAlert } from "lucide-react";
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
  const [step, setStep] = useState("packages"); // "packages", "contact_admin"
  const [selectedPkg, setSelectedPkg] = useState({ id: "pkg_10_credits", name: "10 Credits (Starter Pack)", amount: 100, credits: 10 });

  const packages = [
    { id: "pkg_1_credit", name: "1 Credit (Single Print)", amount: 15, credits: 1 },
    { id: "pkg_10_credits", name: "10 Credits (Starter Pack)", amount: 100, credits: 10, popular: true },
    { id: "pkg_50_credits", name: "50 Credits (Bulk Pack)", amount: 400, credits: 50 }
  ];

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
              {step === "packages"
                ? "Select a recharge plan / रिचार्ज प्लान चुनें"
                : "Contact Admin for Recharge / रिचार्ज के लिए संपर्क करें"}
            </p>
          </div>
        </div>

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
                onClick={() => setStep("contact_admin")}
                className="w-full py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-sm font-black rounded-xl uppercase tracking-wider transition-colors shadow-lg cursor-pointer text-center"
              >
                Proceed to Recharge / आगे बढ़ें (₹{selectedPkg.amount})
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Contact Admin to Recharge */}
        {step === "contact_admin" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Selected Package Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex justify-between items-center text-xs font-bold text-slate-700">
              <div>
                <span className="text-slate-400 block uppercase tracking-wider text-[9px]">Selected Package</span>
                <span className="font-black text-slate-800">{selectedPkg.name}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block uppercase tracking-wider text-[9px]">Credits to Add</span>
                <span className="font-black text-emerald-800 text-sm">{selectedPkg.credits} Credits (₹{selectedPkg.amount})</span>
              </div>
            </div>

            {/* Admin Details Card */}
            <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-3xl p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center shadow-inner">
                <User className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#064e3b]">Recharge Administrator / व्यवस्थापक</span>
                <h4 className="text-2xl font-black text-slate-800">Aditya Jagtap</h4>
                <p className="text-sm font-bold text-slate-500">Contact Number: <span className="text-emerald-800 font-extrabold">8788900807</span></p>
              </div>
              <p className="text-xs font-semibold text-slate-500 max-w-sm mx-auto leading-relaxed">
                Please contact Aditya Jagtap to complete your payment and recharge your account wallet.
              </p>
            </div>

            {/* Call and WhatsApp Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <a
                href="tel:8788900807"
                className="flex items-center justify-center gap-2 py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all text-center cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                Call Admin / कॉल करें
              </a>
              <a
                href={`https://wa.me/918788900807?text=${encodeURIComponent(
                  `Hi Aditya, I would like to recharge my account with the "${selectedPkg.name}" (Price: ₹${selectedPkg.amount}). Registered details - Name: ${user?.name || 'Farmer'}, Mobile: ${user?.mobile || 'N/A'}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all text-center cursor-pointer"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.488 1.459 5.416 1.46 5.561 0 10.088-4.526 10.091-10.087.001-2.693-1.045-5.225-2.946-7.128C17.3 1.503 14.77 1.459 12.008 1.459c-5.564 0-10.09 4.526-10.094 10.088-.002 1.902.501 3.762 1.458 5.378L1.879 21.62l4.768-1.258L6.647 19.16z"/>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004"/>
                </svg>
                Chat on WhatsApp / व्हाट्सएप चैट
              </a>
            </div>

            {/* Back Action */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep("packages")}
                className="px-5 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer"
              >
                Go Back / वापस जाएं
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export const PolicyModal = ({ isOpen, onClose, initialPolicy = "terms" }) => {
  const [activePolicy, setActivePolicy] = useState(initialPolicy);

  React.useEffect(() => {
    if (isOpen) setActivePolicy(initialPolicy);
  }, [isOpen, initialPolicy]);

  const policies = [
    { id: "terms", label: "Terms & Conditions", icon: "📜" },
    { id: "privacy", label: "Privacy Policy", icon: "🔒" },
    { id: "refund", label: "Refund & Cancellation", icon: "💳" },
    { id: "return", label: "Return Policy", icon: "🔄" },
    { id: "shipping", label: "Shipping Policy", icon: "🚚" },
  ];

  const policyContent = {
    terms: (
      <div className="space-y-4 text-slate-600 text-sm leading-relaxed font-medium">
        <p>This document is an electronic record in terms of Information Technology Act, 2000 and rules there under as applicable and the amended provisions pertaining to electronic records in various statutes as amended by the Information Technology Act, 2000. This electronic record is generated by a computer system and does not require any physical or digital signatures.</p>
        <p>This document is published in accordance with the provisions of Rule 3 (1) of the Information Technology (Intermediaries guidelines) Rules, 2011 that require publishing the rules and regulations, privacy policy and Terms of Use for access or usage of domain name <a href="https://agrirecord.onrender.com/" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">https://agrirecord.onrender.com/</a> ('Website'), including the related mobile site and mobile application (hereinafter referred to as 'Platform').</p>
        <p>The Platform is owned by <strong>9834212549</strong>, a company incorporated under the Companies Act, 1956 with its registered office at House of Chandrakant Sutar, Infront of ZP School, Kawali, Tq-Ausa, Dist-Latur (hereinafter referred to as 'Platform Owner', 'we', 'us', 'our').</p>
        <p>Your use of the Platform and services and tools are governed by the following terms and conditions ("Terms of Use") as applicable to the Platform including the applicable policies which are incorporated herein by way of reference. If You transact on the Platform, You shall be subject to the policies that are applicable to the Platform for such transaction. By mere use of the Platform, You shall be contracting with the Platform Owner and these terms and conditions including the policies constitute Your binding obligations, with Platform Owner. These Terms of Use relate to your use of our website, goods (as applicable) or services (as applicable) (collectively, 'Services'). Any terms and conditions proposed by You which are in addition to or which conflict with these Terms of Use are expressly rejected by the Platform Owner and shall be of no force or effect. These Terms of Use can be modified at any time without assigning any reason. It is your responsibility to periodically review these Terms of Use to stay informed of updates.</p>
        <p className="font-bold text-slate-700">For the purpose of these Terms of Use, wherever the context so requires 'you', 'your' or 'user' shall mean any natural or legal person who has agreed to become a user/buyer on the Platform.</p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 font-bold uppercase tracking-wider">
          ACCESSING, BROWSING OR OTHERWISE USING THE PLATFORM INDICATES YOUR AGREEMENT TO ALL THE TERMS AND CONDITIONS UNDER THESE TERMS OF USE, SO PLEASE READ THE TERMS OF USE CAREFULLY BEFORE PROCEEDING.
        </div>
        <p className="font-semibold text-slate-700">The use of Platform and/or availing of our Services is subject to the following Terms of Use:</p>
        <ol className="list-decimal list-outside ml-5 space-y-3 text-slate-500 font-bold text-xs">
          <li>To access and use the Services, you agree to provide true, accurate and complete information to us during and after registration, and you shall be responsible for all acts done through the use of your registered account on the Platform.</li>
          <li>Neither we nor any third parties provide any warranty or guarantee as to the accuracy, timeliness, performance, completeness or suitability of the information and materials offered on this website or through the Services, for any specific purpose. You acknowledge that such information and materials may contain inaccuracies or errors and we expressly exclude liability for any such inaccuracies or errors to the fullest extent permitted by law.</li>
          <li>Your use of our Services and the Platform is solely and entirely at your own risk and discretion for which we shall not be liable to you in any manner. You are required to independently assess and ensure that the Services meet your requirements.</li>
          <li>The contents of the Platform and the Services are proprietary to us and are licensed to us. You will not have any authority to claim any intellectual property rights, title, or interest in its contents. The contents includes and is not limited to the design, layout, look and graphics.</li>
          <li>You acknowledge that unauthorized use of the Platform and/or the Services may lead to action against you as per these Terms of Use and/or applicable laws.</li>
          <li>You agree to pay us the charges associated with availing the Services.</li>
          <li>You agree not to use the Platform and/or Services for any purpose that is unlawful, illegal or forbidden by these Terms, or Indian or local laws that might apply to you.</li>
          <li>You agree and acknowledge that website and the Services may contain links to other third party websites. On accessing these links, you will be governed by the terms of use, privacy policy and such other policies of such third party websites. These links are provided for your convenience for providing further information.</li>
          <li>You understand that upon initiating a transaction for availing the Services you are entering into a legally binding and enforceable contract with the Platform Owner for the Services.</li>
          <li>You shall indemnify and hold harmless Platform Owner, its affiliates, group companies (as applicable) and their respective officers, directors, agents, and employees, from any claim or demand, or actions including reasonable attorney's fees, made by any third party or penalty imposed due to or arising out of Your breach of this Terms of Use, Privacy Policy and other Policies, or Your violation of any law, rules or regulations or the rights (including infringement of intellectual property rights) of a third party.</li>
          <li>Notwithstanding anything contained in these Terms of Use, the parties shall not be liable for any failure to perform an obligation under these Terms if performance is prevented or delayed by a force majeure event.</li>
          <li>These Terms and any dispute or claim relating to it, or its enforceability, shall be governed by and construed in accordance with the laws of India.</li>
          <li>All disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in Latur.</li>
          <li>All concerns or communications relating to these Terms must be communicated to us using the contact information provided on this website.</li>
        </ol>
      </div>
    ),
    privacy: (
      <div className="space-y-4 text-slate-600 text-sm leading-relaxed font-medium">
        <h4 className="font-extrabold text-slate-800 text-base">Introduction</h4>
        <p>This Privacy Policy describes how <strong>9834212549</strong> and its affiliates (collectively "9834212549, we, our, us") collect, use, share, protect or otherwise process your information/personal data through our website <a href="https://agrirecord.onrender.com/" className="text-emerald-700 underline" target="_blank" rel="noopener noreferrer">https://agrirecord.onrender.com/</a> (hereinafter referred to as Platform). Please note that you may be able to browse certain sections of the Platform without registering with us. We do not offer any product/service under this Platform outside India and your personal data will primarily be stored and processed in India.</p>
        <p className="border-l-4 border-emerald-500 pl-4 bg-emerald-50/50 py-3 rounded-r-xl text-emerald-950 italic">By visiting this Platform, providing your information or availing any product/service offered on the Platform, you expressly agree to be bound by the terms and conditions of this Privacy Policy, the Terms of Use and the applicable service/product terms and conditions, and agree to be governed by the laws of India including but not limited to the laws applicable to data protection and privacy. If you do not agree, please do not use or access our Platform.</p>

        <h4 className="font-extrabold text-slate-800 text-sm mt-6">Collection</h4>
        <p>We collect your personal data when you use our Platform, services or otherwise interact with us during the course of our relationship and related information provided from time to time. Some of the information that we may collect includes but is not limited to personal data/information provided to us during sign-up/registering or using our Platform such as name, date of birth, address, telephone/mobile number, email ID and/or any such information shared as proof of identity or address. Some of the sensitive personal data may be collected with your consent, such as your bank account or credit or debit card or other payment instrument information or biometric information such as your facial features or physiological information (in order to enable use of certain features when opted for, available on the Platform) etc., all of the above being in accordance with applicable law(s).</p>
        <p>You always have the option to not provide information, by choosing not to use a particular service or feature on the Platform. We may track your behaviour, preferences, and other information that you choose to provide on our Platform. This information is compiled and analysed on an aggregated basis.</p>

        <h4 className="font-extrabold text-slate-800 text-sm mt-6">Usage</h4>
        <p>We use personal data to provide the services you request. To the extent we use your personal data to market to you, we will provide you the ability to opt-out of such uses. We use your personal data to assist sellers and business partners in handling and fulfilling orders; enhancing customer experience; to resolve disputes; troubleshoot problems; inform you about online and offline offers, products, services, and updates; customise your experience; detect and protect us against error, fraud and other criminal activity; enforce our terms and conditions; conduct marketing research, analysis and surveys; and as otherwise described to you at the time of collection of information.</p>

        <h4 className="font-extrabold text-slate-800 text-sm mt-6">Sharing</h4>
        <p>We may share your personal data internally within our group entities, our other corporate entities, and affiliates to provide you access to the services and products offered by them. These entities and affiliates may market to you as a result of such sharing unless you explicitly opt-out. We may disclose personal data to third parties such as sellers, business partners, third party service providers including logistics partners, prepaid payment instrument issuers, third-party reward programs and other payment opted by you.</p>

        <h4 className="font-extrabold text-slate-800 text-sm mt-6">Security Precautions</h4>
        <p>To protect your personal data from unauthorised access or disclosure, loss or misuse we adopt reasonable security practices and procedures. Once your information is in our possession or whenever you access your account information, we adhere to our security guidelines to protect it against unauthorised access and offer the use of a secure server. However, the transmission of information is not completely secure for reasons beyond our control. Users are responsible for ensuring the protection of login and password records for their account.</p>

        <h4 className="font-extrabold text-slate-800 text-sm mt-6">Data Deletion and Retention</h4>
        <p>You have an option to delete your account by visiting your profile and settings on our Platform, this action would result in you losing all information related to your account. We retain your personal data information for a period no longer than is required for the purpose for which it was collected or as required under any applicable law. However, we may retain data related to you if we believe it may be necessary to prevent fraud or future abuse or for other legitimate purposes.</p>

        <h4 className="font-extrabold text-slate-800 text-sm mt-6">Your Rights</h4>
        <p>You may access, rectify, and update your personal data directly through the functionalities provided on the Platform.</p>

        <h4 className="font-extrabold text-slate-800 text-sm mt-6">Consent</h4>
        <p>By visiting our Platform or by providing your information, you consent to the collection, use, storage, disclosure and otherwise processing of your information on the Platform in accordance with this Privacy Policy. You have an option to withdraw your consent that you have already provided by writing to the Grievance Officer at the contact information provided below. Please mention "Withdrawal of consent for processing personal data" in your subject line of your communication.</p>

        <h4 className="font-extrabold text-slate-800 text-sm mt-6">Changes to this Privacy Policy</h4>
        <p>Please check our Privacy Policy periodically for changes. We may update this Privacy Policy to reflect changes to our information practices. We may alert/notify you about the significant changes to the Privacy Policy, in the manner as may be required under applicable laws.</p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4">
          <h4 className="font-extrabold text-slate-800 text-sm">Grievance Officer</h4>
          <p className="text-xs text-slate-500 font-bold mt-1">Contact us: Phone: 9834212549</p>
          <p className="text-xs text-slate-500 font-bold">Time: Monday - Friday (9:00 - 18:00)</p>
        </div>
      </div>
    ),
    refund: (
      <div className="space-y-4 text-slate-600 text-sm leading-relaxed font-medium">
        <p>This refund and cancellation policy outlines how you can cancel or seek a refund for a product/service that you have purchased through the Platform. Under this policy:</p>
        <ol className="list-decimal list-outside ml-5 space-y-3 text-slate-500 font-bold text-xs">
          <li>Cancellations will only be considered if the request is made <strong className="text-emerald-700">2 days</strong> of placing the order. However, cancellation requests may not be entertained if the orders have been communicated to such sellers/merchant(s) listed on the Platform and they have initiated the process of shipping them, or the product is out for delivery. In such an event, you may choose to reject the product at the doorstep.</li>
          <li>9834212549 does not accept cancellation requests for perishable items like flowers, eatables, etc. However, the refund/replacement can be made if the user establishes that the quality of the product delivered is not good.</li>
          <li>In case of receipt of damaged or defective items, please report to our customer service team. The request would be entertained once the seller/merchant listed on the Platform, has checked and determined the same at its own end. This should be reported within <strong className="text-emerald-700">2 days</strong> of receipt of products.</li>
          <li>In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within <strong className="text-emerald-700">2 days</strong> of receiving the product. The customer service team after looking into your complaint will take an appropriate decision.</li>
          <li>In case of complaints regarding the products that come with a warranty from the manufacturers, please refer the issue to them.</li>
        </ol>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 font-bold">
          In case of any refunds approved by 9834212549, it will take <strong>24 days</strong> for the refund to be processed to you.
        </div>
      </div>
    ),
    return: (
      <div className="space-y-4 text-slate-600 text-sm leading-relaxed font-medium">
        <p>We offer refund/exchange within first <strong className="text-emerald-700">2 days</strong> from the date of your purchase. If <strong>2 days</strong> have passed since your purchase, you will not be offered a return, exchange or refund of any kind.</p>
        <p>In order to become eligible for a return or an exchange:</p>
        <ol className="list-[lower-roman] list-outside ml-5 space-y-2 text-slate-500 font-bold text-xs">
          <li>The purchased item should be unused and in the same condition as you received it.</li>
          <li>The item must have original packaging.</li>
          <li>If the item that you purchased on a sale, then the item may not be eligible for a return/exchange.</li>
        </ol>
        <p>Further, only such items are replaced by us (based on an exchange request), if such items are found defective or damaged.</p>
        <p>You agree that there may be a certain category of products/items that are exempted from returns or refunds. Such categories of the products would be identified to you at the time of purchase. For exchange/return accepted request(s) (as applicable), once your returned product/item is received and inspected by us, we will send you an email to notify you about receipt of the returned/exchanged product. Further, if the same has been approved after the quality check at our end, your request (i.e. return/exchange) will be processed in accordance with our policies.</p>
      </div>
    ),
    shipping: (
      <div className="space-y-4 text-slate-600 text-sm leading-relaxed font-medium">
        <p>The orders for the user are shipped through registered domestic courier companies and/or speed post only. Orders are shipped within <strong className="text-emerald-700">2 days</strong> from the date of the order and/or payment or as per the delivery date agreed at the time of order confirmation and delivering of the shipment, subject to courier company/post office norms.</p>
        <p>Platform Owner shall not be liable for any delay in delivery by the courier company/postal authority.</p>
        <p>Delivery of all orders will be made to the address provided by the buyer at the time of purchase. Delivery of our services will be confirmed on your email ID as specified at the time of registration.</p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-800 font-bold">
          If there are any shipping cost(s) levied by the seller or the Platform Owner (as the case be), the same is not refundable.
        </div>
      </div>
    ),
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b pb-4 border-emerald-100">
          <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-800">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">
              Policies / नीतियाँ
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Legal Information & Guidelines
            </p>
          </div>
        </div>

        {/* Policy Tab Buttons */}
        <div className="flex flex-wrap gap-2">
          {policies.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePolicy(p.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activePolicy === p.id
                  ? "bg-[#064e3b] text-white shadow-md"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Policy Content */}
        <div className="border border-slate-200 rounded-2xl p-5 max-h-[50vh] overflow-y-auto bg-slate-50/50">
          <h4 className="text-base font-extrabold text-[#064e3b] mb-4 flex items-center gap-2">
            <span className="text-lg">{policies.find(p => p.id === activePolicy)?.icon}</span>
            {policies.find(p => p.id === activePolicy)?.label}
          </h4>
          {policyContent[activePolicy]}
        </div>

        {/* Footer Note */}
        <div className="text-center pt-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            © {new Date().getFullYear()} AgriRecordPro — All Rights Reserved by SURAJ SUTAR
          </p>
        </div>
      </div>
    </Modal>
  );
};

export const ProfileModal = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [name, setName] = useState(user?.name || "");
  const [mobile, setMobile] = useState(user?.mobile || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setMobile(user.mobile || "");
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = localStorage.getItem("agri_record_token");
      const response = await fetch(`/api/users/update-profile?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile: mobile.replace(/\D/g, "") })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update profile");
      }

      localStorage.setItem("agri_record_user", JSON.stringify(data));
      if (onUpdateUser) {
        onUpdateUser(data);
      }
      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err.message || "An error occurred while updating profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b pb-4 border-emerald-100">
          <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-800">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">
              Profile Settings / प्रोफाइल सेटिंग्स
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Update your account details
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-xs font-bold">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-3 text-xs font-bold">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Full Name / आपका नाम
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Full Name"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Email Address / ईमेल (Read-Only)
            </label>
            <input
              type="email"
              disabled
              value={user?.email || ""}
              className="w-full px-4 py-3 border border-slate-100 bg-slate-50 text-slate-400 rounded-xl outline-none text-sm font-bold cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Mobile Number / मोबाइल नंबर
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                placeholder="10-Digit Mobile (Keep blank if none)"
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
              />
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-1">
              Add your mobile number so that you can login using it later. Keep it blank if you want.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-sm font-black rounded-xl uppercase tracking-wider transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving Changes..." : "Save Changes / सुरक्षित करें"}
          </button>
        </form>
      </div>
    </Modal>
  );
};
