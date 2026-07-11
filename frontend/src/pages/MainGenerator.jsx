import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CardPreview from "../components/CardPreview";
import { 
  Plus, Trash2, Save, Download, Printer, Image, ShieldAlert,
  Loader2, CreditCard, ChevronRight, UserPlus, Lock, Play, Video
} from "lucide-react";
import { translations } from "../translations";

// List of states districts
const BIHAR_DISTRICTS = ["Araria","Arwal","Aurangabad","Banka","Begusarai","Bhagalpur","Bhojpur","Buxar","Darbhanga","East Champaran","Gaya","Gopalganj","Jamui","Jehanabad","Kaimur","Katihar","Khagaria","Kishanjganj","Lakhisarai","Madhepura","Madhubani","Munger","Muzaffarpur","Nalanda","Nawada","Patna","Purnia","Rohtas","Saharsa","Samastipur","Saran","Sheikhpura","Sheohar","Sitamarhi","Siwan","Supaul","Vaishali","West Champaran"].sort();
const UP_DISTRICTS = ["Agra","Aligarh","Ambedkar Nagar","Amethi","Amroha","Auraiya","Ayodhya","Azamgarh","Baghpat","Bahraich","Ballia","Balrampur","Banda","Bara Banki","Bareilly","Basti","Bhadohi","Bijnor","Budaun","Bulandshahr","Chandauli","Chitrakoot","Deoria","Etah","Etawah","Farrukhabad","Fatehpur","Firozabad","Gautam Buddha Nagar","Ghaziabad","Ghazipur","Gonda","Gorakhpur","Hamirpur","Hapur","Hardoi","Hathras","Jalaun","Jaunpur","Jhansi","Kannauj","Kanpur Dehat","Kanpur Nagar","Kasganj","Kaushambi","Kheri","Kushinagar","Lalitpur","Lucknow","Maharajganj","Mahoba","Mainpuri","Mathura","Mau","Meerut","Mirzapur","Moradabad","Muzaffarnagar","Pilibhit","Pratapgarh","Prayagraj","Raebareli","Rampur","Saharanpur","Sambhal","Sant Kabir Nagar","Shahjahanpur","Shamli","Shravasti","Siddharthnagar","Sitapur","Sonbhadra","Sultanpur","Unnao","Varanasi"].sort();
const MAHA_DISTRICTS = ["Ahilyanagar","Akola","Amravati","Beed","Bhandara","Buldhana","Chandrapur","Chhatrapati Sambhajinagar","Dhule","Gadchiroli","Gondia","Hingoli","Jalgaon","Jalna","Kolhapur","Latur","Mumbai City","Mumbai Suburban","Nagpur","Nanded","Nandurbar","Nashik","Dharashiv","Palghar","Parbhani","Pune","Raigad","Ratnagiri","Sangli","Satara","Sindhudurg","Solapur","Thane","Wardha","Washim","Yavatmal"].sort();
const RAJ_DISTRICTS = ["Ajmer","Alwar","Anupgarh","Balotra","Baran","Barmer","Beawar","Bharatpur","Bhilwara","Bikaner","Bundi","Chittorgarh","Churu","Dausa","Deeg","Dholpur","Didwana-Kuchaman","Dudu","Dungarpur","Gangapur City","Hanumangarh","Jaipur","Jaipur Rural","Jaisalmer","Jalore","Jhalawar","Jhunjhunu","Jodhpur","Jodhpur Rural","Karauli","Kekri","Kota","Kotputli-Behror","Nagaur","Neem Ka Thana","Phalodi","Pratapgarh","Rajsamand","Salumbar","Sanchore","Sawai Madhopur","Shahpura","Sikar","Sirohi","Sri Ganganagar","Tonk","Udaipur"].sort();

const STATE_DISTRICTS = {
  Bihar: BIHAR_DISTRICTS,
  "Uttar Pradesh": UP_DISTRICTS,
  Maharashtra: MAHA_DISTRICTS,
  Rajasthan: RAJ_DISTRICTS
};

// Cashfree script loader
const loadCashfreeSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.Cashfree) {
      resolve(window.Cashfree);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) resolve(window.Cashfree);
      else reject(new Error("Cashfree SDK failed to initialize"));
    };
    script.onerror = () => reject(new Error("Failed to load Cashfree script"));
    document.head.appendChild(script);
  });
};

export default function MainGenerator({ user, onAuthSuccess, onUpdateCredits, onOpenRecharge, lang }) {
  const previewRef = useRef(null);
  const pdfRef = useRef(null);
  
  // Basic Info Form State
  const [formData, setFormData] = useState({
    nameHindi: "आदित्य जगताप",
    nameEnglish: "ADITYA JAGTAP",
    dob: "15/08/1990",
    gender: "Male",
    mobile: "8888888888",
    aadhaar: "123456789012",
    farmerId: "",
    address: "Village: Varvand, Taluka: Daund, District: Pune, Maharashtra, 412215",
    photoUrl: "",
    downloadDate: "",
    state: "Maharashtra",
    cardColor: "default",
    landDetails: [
      { id: "1", district: "Pune", subDistrict: "Daund", village: "Varvand", mOwnerNo: "452", khasra: "1256", area: "0.45 Hec" }
    ]
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [step, setStep] = useState(1);
  const [activeVideoGuide, setActiveVideoGuide] = useState(null);

  // Form is locked when user is not logged in OR has 0 credits (and is not admin)
  const isFormLocked = !user || (user.role !== "Admin" && user.freeCredits === 0);

  // Generate random Farmer ID on mount or state change
  useEffect(() => {
    if (!formData.farmerId) {
      generateRandomFarmerId();
    }

    // Scroll to video guide if hash is set
    if (window.location.hash === "#video-guides") {
      setTimeout(() => {
        const element = document.getElementById("video-guides");
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  }, []);

  const generateRandomFarmerId = () => {
    // ID format: XXX-XX-XXXX-XXX or similar (e.g. 123-45-6789-012)
    const part1 = Math.floor(100 + Math.random() * 900);
    const part2 = Math.floor(10 + Math.random() * 90);
    const part3 = Math.floor(1000 + Math.random() * 9000);
    const part4 = Math.floor(100 + Math.random() * 900);
    const newId = `${part1}-${part2}-${part3}-${part4}`;
    setFormData(prev => ({ ...prev, farmerId: newId }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // State selection updates district list automatically
  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    const defaultDistrict = STATE_DISTRICTS[selectedState][0] || "";
    setFormData(prev => ({
      ...prev,
      state: selectedState,
      landDetails: prev.landDetails.map(land => ({ ...land, district: defaultDistrict }))
    }));
  };

  // Land Details dynamic rows management
  const handleLandRowChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      landDetails: prev.landDetails.map(land => 
        land.id === id ? { ...land, [field]: value } : land
      )
    }));
  };

  const addLandRow = () => {
    const currentDistricts = STATE_DISTRICTS[formData.state] || [];
    const newRow = {
      id: Date.now().toString(),
      district: currentDistricts[0] || "",
      subDistrict: "",
      village: "",
      mOwnerNo: "",
      khasra: "",
      area: ""
    };
    setFormData(prev => ({ ...prev, landDetails: [...prev.landDetails, newRow] }));
  };

  const removeLandRow = (id) => {
    if (formData.landDetails.length <= 1) {
      window.showToast("At least one land details record is required.", "warning");
      return;
    }
    setFormData(prev => ({
      ...prev,
      landDetails: prev.landDetails.filter(land => land.id !== id)
    }));
  };

  // Local File Upload parsing with client-side compression to avoid Render's ephemeral disk wipes
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Constrain photo size for card display (120px x 150px layout area)
        // Max bounds of 250x300 keeps size below 20KB while preserving crisp rendering resolution
        const maxWidth = 250;
        const maxHeight = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to high-efficiency Jpeg at 75% quality
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        setFormData(prev => ({ ...prev, photoUrl: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Checkout and wallet validation logic
  const handleAction = async (actionType) => {
    if (!user) {
      window.showToast("कृपया कार्ड को प्रिंट या सहेजने के लिए पहले लॉगिन करें। (Please login first to print or save cards).", "warning");
      // Trigger login modal hook (handled via App.jsx state)
      const event = new CustomEvent("open_login_modal");
      window.dispatchEvent(event);
      return;
    }

    // Bypass check for admins
    if (user.role === "Admin") {
      await executeAction(actionType);
      return;
    }

    // Wallet credit check
    if (user.freeCredits > 0) {
      // Deduct 1 credit in SQLite and execute
      await executeActionWithCreditDeduction(actionType);
    } else {
      // Wallet empty: open the Recharge Modal to allow adding credits
      window.showToast("आपके वॉलेट में 0 क्रेडिट हैं। कृपया आगे बढ़ने के लिए क्रेडिट खरीदें। (You have 0 credits. Please purchase credits to proceed.)", "warning");
      if (onOpenRecharge) {
        onOpenRecharge();
      }
    }
  };

  const executeActionWithCreditDeduction = async (actionType) => {
    setActionLoading(true);
    setStatusMessage("Processing credit deduction...");
    const token = localStorage.getItem("agri_record_token");
    
    try {
      // Call secure deduct-credit api
      const res = await fetch("/api/users/deduct-credit", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}` 
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        // Update user state locally
        onUpdateCredits(-1); // deduct 1
        await executeAction(actionType);
      } else {
        throw new Error(data.detail || "Credit deduction failed");
      }
    } catch (err) {
      window.showToast("Credit validation failed. Action cancelled.", "error");
      setActionLoading(false);
      setStatusMessage("");
    }
  };

  const executeAction = async (actionType) => {
    setStatusMessage("Saving card details to local database...");
    const token = localStorage.getItem("agri_record_token");

    // Pre-save card details
    try {
      const response = await fetch("/api/cards/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          downloadDate: new Date().toLocaleDateString("en-GB")
        })
      });
      const resData = await response.json();
      if (!response.ok) {
        console.error("Card save fail:", resData.detail);
      }
    } catch (err) {
      console.error("Database save connection exception:", err);
    }

    if (actionType === "save") {
      window.showToast("किसान पहचान पत्र डेटाबेस में सफलतापूर्वक सहेजा गया! (Card saved successfully)", "success");
      setActionLoading(false);
      setStatusMessage("");
    } else if (actionType === "pdf") {
      setStatusMessage("Generating PDF. Please wait...");
      await downloadPDF();
    } else if (actionType === "print") {
      setStatusMessage("Launching Print Dialog...");
      setTimeout(() => {
        setActionLoading(false);
        setStatusMessage("");
        window.print();
      }, 1000);
    }
  };

  const convertCssColorToRgb = (cssColor) => {
    if (!cssColor) return cssColor;
    if (cssColor.includes('oklch')) {
      try {
        const oklchRegex = /oklch\([^)]+\)/g;
        let result = cssColor;
        const matches = cssColor.match(oklchRegex);
        if (matches) {
          const canvas = document.createElement('canvas');
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            matches.forEach(match => {
              ctx.clearRect(0, 0, 1, 1);
              ctx.fillStyle = match;
              ctx.fillRect(0, 0, 1, 1);
              const data = ctx.getImageData(0, 0, 1, 1).data;
              const rgbStr = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
              result = result.replace(match, rgbStr);
            });
          }
        }
        return result;
      } catch (e) {
        return cssColor;
      }
    }
    return cssColor;
  };

  // Recursively convert all oklch computed styles to hex/rgb before html2canvas capture
  const convertOklchInClone = (sourceEl, cloneEl) => {
    try {
      const computed = window.getComputedStyle(sourceEl);
      const propsToFix = ['color', 'background-color', 'border-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color', 'outline-color', 'box-shadow'];
      propsToFix.forEach(prop => {
        const val = computed.getPropertyValue(prop);
        if (val && val.includes('oklch')) {
          const resolved = convertCssColorToRgb(val);
          cloneEl.style.setProperty(prop, resolved, 'important');
        }
      });
    } catch(e) { /* skip non-element nodes */ }
    
    const sourceChildren = sourceEl.children || [];
    const cloneChildren = cloneEl.children || [];
    for (let i = 0; i < sourceChildren.length; i++) {
      if (cloneChildren[i]) {
        convertOklchInClone(sourceChildren[i], cloneChildren[i]);
      }
    }
  };

  // jsPDF + html2canvas generation
  const downloadPDF = async () => {
    const cardContainer = pdfRef.current;
    if (!cardContainer) {
      window.showToast("Preview card elements not found.", "error");
      setActionLoading(false);
      setStatusMessage("");
      return;
    }

    try {
      setStatusMessage("Rendering card to PDF...");

      // Wait for fonts to load completely to avoid fallback font scaling shifts
      if (document.fonts) {
        await document.fonts.ready;
      }

      // Use lower resolution on mobile to prevent memory issues
      const isMobile = window.innerWidth < 768;
      const pdfScale = isMobile ? 1.5 : 2;

      const canvas = await html2canvas(cardContainer, {
        pixelRatio: pdfScale,
        backgroundColor: "#ffffff",
        scale: pdfScale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc, clonedEl) => {
          // Fix oklch colors in the cloned DOM that html2canvas creates
          convertOklchInClone(cardContainer, clonedEl);
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      const padding = 15;
      const printWidth = pdfWidth - padding * 2;
      const printHeight = (canvasHeight * printWidth) / canvasWidth;

      pdf.addImage(imgData, "PNG", padding, 15, printWidth, printHeight);
      pdf.save(`FarmerCard_${formData.farmerId || "Download"}.pdf`);
      
      setStatusMessage("PDF generated and downloaded!");
      setTimeout(() => setStatusMessage(""), 2000);
    } catch (err) {
      console.error("PDF download failed:", err);
      window.showToast("PDF generation failed. Try printing card directly or use Chrome desktop.", "error");
    } finally {
      setActionLoading(false);
      setStatusMessage("");
    }
  };

  const currentDistricts = STATE_DISTRICTS[formData.state] || [];

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Visual Overlay Loading */}
      {actionLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center z-[9999] text-white">
          <Loader2 className="w-12 h-12 animate-spin text-[#cddc39] mb-4" />
          <p className="text-base font-bold animate-pulse">{statusMessage}</p>
        </div>
      )}

      {/* Hero Welcome banner */}
      <div className="mb-4 sm:mb-8 flex flex-col md:flex-row md:items-center md:justify-between border border-emerald-100 rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-6 shadow-xs gap-3 sm:gap-4 no-print">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            {translations[lang].title}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-400">
            {translations[lang].subtitle}
          </p>
        </div>
      </div>

      {/* Grid Layout splits Form & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side Inputs Form */}
        <form className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md space-y-5 sm:space-y-6 no-print transition-all duration-300 relative">
          {/* Locked Form Overlay: not logged in OR credits = 0 */}
          {isFormLocked && (
            <div className="absolute inset-0 z-30 bg-white/85 backdrop-blur-[3px] rounded-3xl flex flex-col items-center justify-center gap-4 cursor-not-allowed">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-2 ${
                !user
                  ? "bg-slate-100 border-slate-300"
                  : "bg-amber-100 border-amber-300"
              }`}>
                <Lock className={`w-8 h-8 ${!user ? "text-slate-600" : "text-amber-700"}`} />
              </div>
              <div className="text-center px-6">
                <p className="text-sm font-black text-slate-800 uppercase tracking-wider mb-1">
                  {!user 
                    ? (lang === "mr" ? "लॉगिन आवश्यक आहे" : lang === "hi" ? "लॉगिन आवश्यक है" : "Login Required") 
                    : (lang === "mr" ? "फॉर्म बंद आहे" : lang === "hi" ? "फॉर्म बंद है" : "Form Locked")
                  }
                </p>
                <p className="text-xs font-bold text-slate-500 text-center max-w-xs leading-relaxed">
                  {!user
                    ? (lang === "mr" ? "शेतकरी ओळखपत्र बनवणे सुरू करण्यासाठी कृपया तुमच्या खात्यात लॉगिन करा." : lang === "hi" ? "किसान पहचान पत्र बनाना शुरू करने के लिए कृपया अपने खाते में लॉगिन करें।" : "Please sign in to your account to access the card generator and start creating Farmer ID cards.")
                    : (lang === "mr" ? "तुमच्या वॉलेटमध्ये 0 क्रेडिट आहे. कृपया ओळखपत्र बनवणे सुरू करण्यासाठी क्रेडिट रिचार्ज करा." : lang === "hi" ? "आपके वॉलेट में 0 क्रेडिट हैं। कृपया किसान पहचान पत्र बनाना शुरू करने के लिए क्रेडिट रिचार्ज करें।" : "Your wallet balance is 0 credits. Please recharge your wallet with credits to start filling card details.")
                  }
                </p>
              </div>
              {!user && (
                <div className="flex flex-col gap-2 w-full max-w-xs px-6 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      const event = new CustomEvent("open_login_modal");
                      window.dispatchEvent(event);
                    }}
                    className="cursor-pointer w-full px-5 py-3 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 bg-[#064e3b] hover:bg-[#085a44]"
                  >
                    <UserPlus className="w-4 h-4 text-[#cddc39]" /> {lang === "mr" ? "गूगल द्वारे लॉगिन करा" : lang === "hi" ? "गूगल से लॉगिन करें" : "Sign In with Google"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVideoGuide("login")}
                    className="cursor-pointer w-full px-5 py-2.5 text-slate-700 text-xs font-extrabold rounded-xl uppercase tracking-wider transition-all border border-slate-300 hover:bg-slate-50 bg-white flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-800 fill-emerald-850" /> {lang === "mr" ? "व्हिडिओ मार्गदर्शक पहा" : lang === "hi" ? "वीडियो गाइड देखें" : "Watch Video Guide"}
                  </button>
                </div>
              )}
              {user && (
                <button
                  type="button"
                  onClick={onOpenRecharge}
                  className="cursor-pointer px-5 py-2.5 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800"
                >
                  <CreditCard className="w-4 h-4" /> {lang === "mr" ? "वॉलेट रिचार्ज करा" : lang === "hi" ? "वॉलेट रिचार्ज करें" : "Recharge Wallet"}
                </button>
              )}
            </div>
          )}
          {/* Stepper Header */}
          <div className="flex justify-between items-center mb-4 border-b pb-4 border-slate-100 select-none">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step === 1 ? "bg-[#064e3b] text-white shadow-md scale-110" : "bg-emerald-50 text-[#064e3b] hover:bg-emerald-100"
              }`}>1</span>
              <span className={`text-xs font-extrabold uppercase tracking-wider transition-colors ${step === 1 ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"}`}>
                {lang === "mr" ? "मूल माहिती" : lang === "hi" ? "मूल जानकारी" : "Basic Info"}
              </span>
            </button>
            <div className="h-[2px] flex-1 mx-3 bg-slate-100"></div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step === 2 ? "bg-[#064e3b] text-white shadow-md scale-110" : "bg-emerald-50 text-[#064e3b] hover:bg-emerald-100"
              }`}>2</span>
              <span className={`text-xs font-extrabold uppercase tracking-wider transition-colors ${step === 2 ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"}`}>
                {lang === "mr" ? "फोटो आणि पत्ता" : lang === "hi" ? "फोटो और पता" : "Photo & Addr"}
              </span>
            </button>
            <div className="h-[2px] flex-1 mx-3 bg-slate-100"></div>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                step === 3 ? "bg-[#064e3b] text-white shadow-md scale-110" : "bg-emerald-50 text-[#064e3b] hover:bg-emerald-100"
              }`}>3</span>
              <span className={`text-xs font-extrabold uppercase tracking-wider transition-colors ${step === 3 ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"}`}>
                {lang === "mr" ? "जमिनीचा तपशील" : lang === "hi" ? "भूमि विवरण" : "Land Details"}
              </span>
            </button>
          </div>

          {/* Stepper Content */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left duration-200">
              <div className="border-b pb-2 border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                  {lang === "mr" ? "मूल तपशील" : lang === "hi" ? "मूल विवरण" : "Basic Details"}
                </h3>
              </div>

              {/* District & Card Color Schemes settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {translations[lang].state}
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700 bg-white"
                  >
                    <option value="Maharashtra">{lang === "mr" || lang === "hi" ? "महाराष्ट्र" : "Maharashtra"}</option>
                    <option value="Bihar">{lang === "mr" || lang === "hi" ? "बिहार" : "Bihar"}</option>
                    <option value="Uttar Pradesh">{lang === "mr" || lang === "hi" ? "उत्तर प्रदेश" : "Uttar Pradesh"}</option>
                    <option value="Rajasthan">{lang === "mr" || lang === "hi" ? "राजस्थान" : "Rajasthan"}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {lang === "mr" ? "कार्ड थीम रंग" : lang === "hi" ? "कार्ड थीम रंग" : "Card Theme Color"}
                  </label>
                  <select
                    name="cardColor"
                    value={formData.cardColor}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700 bg-white"
                  >
                    <option value="default">{lang === "mr" ? "मूळ / राज्य आधारित" : lang === "hi" ? "डिफ़ॉल्ट / राज्य आधारित" : "Default"}</option>
                    <option value="green">{lang === "mr" || lang === "hi" ? "हरा" : "Green"}</option>
                    <option value="blue">{lang === "mr" || lang === "hi" ? "नीला" : "Blue"}</option>
                    <option value="orange">{lang === "mr" || lang === "hi" ? "नारंगी" : "Orange"}</option>
                    <option value="red">{lang === "mr" || lang === "hi" ? "लाल" : "Red"}</option>
                    <option value="purple">{lang === "mr" || lang === "hi" ? "बैंगनी" : "Purple"}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {lang === "mr" ? "शेतकरी आयडी" : lang === "hi" ? "किसान आईडी" : "Farmer ID"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="farmerId"
                    value={formData.farmerId}
                    onChange={handleInputChange}
                    placeholder="ID Card Number"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={generateRandomFarmerId}
                    className="px-4 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    {lang === "mr" ? "पुन्हा बनवा" : lang === "hi" ? "पुनः बनाएं" : "Regen"}
                  </button>
                </div>
              </div>

              {/* Hindi Name & English Name details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {translations[lang].nameLocal}
                  </label>
                  <input
                    type="text"
                    name="nameHindi"
                    value={formData.nameHindi}
                    onChange={handleInputChange}
                    placeholder={translations[lang].nameLocalPlaceholder}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {translations[lang].nameEng}
                  </label>
                  <input
                    type="text"
                    name="nameEnglish"
                    value={formData.nameEnglish}
                    onChange={handleInputChange}
                    placeholder={translations[lang].nameEngPlaceholder}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700 uppercase"
                  />
                </div>
              </div>

              {/* DOB & Gender & Aadhaar & Mobile details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {lang === "mr" ? "जन्म तारीख" : lang === "hi" ? "जन्म तिथि" : "Date of Birth"}
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={(() => {
                      // Convert DD/MM/YYYY to YYYY-MM-DD for native date input
                      if (!formData.dob) return "";
                      const parts = formData.dob.split("/");
                      if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                      return formData.dob;
                    })()}
                    onChange={(e) => {
                      // Convert YYYY-MM-DD from date picker back to DD/MM/YYYY for display
                      const val = e.target.value;
                      if (val) {
                        const [y, m, d] = val.split("-");
                        setFormData(prev => ({ ...prev, dob: `${d}/${m}/${y}` }));
                      } else {
                        setFormData(prev => ({ ...prev, dob: "" }));
                      }
                    }}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {translations[lang].gender}
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700 bg-white"
                  >
                    <option value="Male">{lang === "mr" ? "पुरुष" : lang === "hi" ? "पुरुष" : "Male"}</option>
                    <option value="Female">{lang === "mr" ? "महिला" : lang === "hi" ? "महिला" : "Female"}</option>
                    <option value="Other">{lang === "mr" ? "इतर" : lang === "hi" ? "अन्य" : "Other"}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {translations[lang].aadhaar}
                  </label>
                  <input
                    type="text"
                    name="aadhaar"
                    maxLength={12}
                    value={formData.aadhaar}
                    onChange={(e) => setFormData(prev => ({ ...prev, aadhaar: e.target.value.replace(/\D/g, "") }))}
                    placeholder={translations[lang].aadhaarPlaceholder}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {translations[lang].mobile}
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, "") }))}
                    placeholder={translations[lang].mobilePlaceholder}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right duration-200">
              <div className="border-b pb-2 border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                  {lang === "mr" ? "फोटो आणि पत्ता" : lang === "hi" ? "फोटो और पता" : "Photo & Address"}
                </h3>
              </div>

              {/* Photo upload and crop */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <div className="md:col-span-4">
                  <div className="w-28 h-36 border border-slate-200 rounded-2xl overflow-hidden bg-white flex items-center justify-center mx-auto shadow-sm relative group hover:border-emerald-500 transition-colors">
                    {formData.photoUrl ? (
                      <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                </div>
                <div className="md:col-span-8 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    {translations[lang].photo}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="w-full text-xs font-bold text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#064e3b] file:text-white hover:file:bg-[#085a44] file:cursor-pointer transition-colors"
                  />
                  <p className="text-[10px] font-semibold text-slate-400 leading-tight">
                    {translations[lang].photoHelp}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  {lang === "mr" ? "कायमचा पत्ता" : lang === "hi" ? "स्थायी पता" : "Permanent Address"}
                </label>
                <textarea
                  name="address"
                  rows={4}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder={lang === "mr" ? "पूर्ण पत्ता टाका..." : lang === "hi" ? "पूरा पता दर्ज करें..." : "Enter Full Address"}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700 resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right duration-200">
              <div className="border-b pb-2 border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                  {lang === "mr" ? "जमिनीचा तपशील" : lang === "hi" ? "भूमि का विवरण" : "Land Records"} (Max 8)
                </h3>
                <button
                  type="button"
                  onClick={addLandRow}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer hover-scale"
                >
                  <Plus className="w-3.5 h-3.5" /> {lang === "mr" ? "प्लॉट जोडा" : lang === "hi" ? "प्लॉट जोड़ें" : "Add Plot"}
                </button>
              </div>

              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {formData.landDetails.map((land) => (
                  <div 
                    key={land.id} 
                    className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 space-y-3 relative group transition-all hover:bg-slate-50"
                  >
                    <button
                      type="button"
                      onClick={() => removeLandRow(land.id)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pr-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                          {translations[lang].district}
                        </label>
                        <select
                          value={land.district}
                          onChange={(e) => handleLandRowChange(land.id, "district", e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700 bg-white"
                        >
                          {currentDistricts.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                          {lang === "mr" ? "तालुका" : lang === "hi" ? "तहसील / तालुका" : "Sub-District"}
                        </label>
                        <input
                          type="text"
                          value={land.subDistrict}
                          onChange={(e) => handleLandRowChange(land.id, "subDistrict", e.target.value)}
                          placeholder="Tehsil"
                          className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                          {translations[lang].village}
                        </label>
                        <input
                          type="text"
                          value={land.village}
                          onChange={(e) => handleLandRowChange(land.id, "village", e.target.value)}
                          placeholder="Village"
                          className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                          {lang === "mr" ? "खातेदार क्रमांक" : lang === "hi" ? "खाता संख्या" : "Khata (Owner No.)"}
                        </label>
                        <input
                          type="text"
                          value={land.mOwnerNo}
                          onChange={(e) => handleLandRowChange(land.id, "mOwnerNo", e.target.value)}
                          placeholder="Khata No"
                          className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                          {lang === "mr" ? "खसरा / गट क्रमांक" : lang === "hi" ? "खसरा संख्या" : "Khasra (Plot)"}
                        </label>
                        <input
                          type="text"
                          value={land.khasra}
                          onChange={(e) => handleLandRowChange(land.id, "khasra", e.target.value)}
                          placeholder="Khasra No"
                          className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                          {translations[lang].area}
                        </label>
                        <input
                          type="text"
                          value={land.area}
                          onChange={(e) => handleLandRowChange(land.id, "area", e.target.value)}
                          placeholder="Ex: 0.45 Hec"
                          className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-xs font-bold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}
      </form>

        {/* Right Side Live Card Preview & Action buttons */}
        <div className="lg:col-span-6 flex flex-col gap-5">
          <div className="bg-white border border-slate-200 border-l-4 border-l-emerald-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm no-print">
            <div className="border-b pb-3 mb-5 flex justify-between items-center">
              <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">
                {lang === "mr" ? "थेट ओळखपत्र पूर्वावलोकन" : lang === "hi" ? "लाइव कार्ड पूर्वावलोकन" : "Live Card Preview"}
              </h3>
              <span className="text-[10px] px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full font-black text-emerald-800 uppercase tracking-wider">
                Card size: 600px x 380px
              </span>
            </div>
            
            {/* Live rendering */}
            <CardPreview data={formData} previewRef={previewRef} isDraft={true} />
          </div>

          {/* Document Operations Controls Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 no-print">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">
              {lang === "mr" ? "कारवाई पॅनेल" : lang === "hi" ? "कार्रवाई पैनल" : "Action Desk"}
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => handleAction("save")}
                className="py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] sm:text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm cursor-pointer border border-slate-200"
              >
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>{lang === "mr" ? "जतन करा" : lang === "hi" ? "सहेजें" : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("pdf")}
                className="py-2.5 sm:py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-[10px] sm:text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#cddc39]" /> <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("print")}
                className="py-2.5 sm:py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-[10px] sm:text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span>{lang === "mr" ? "प्रिंट करा" : lang === "hi" ? "प्रिंट" : "Print"}</span>
              </button>
            </div>
            
            {user && user.role !== "Admin" && user.freeCredits === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-950 text-xs font-bold leading-relaxed">
                <CreditCard className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <p>{lang === "mr" ? "तुमचे वॉलेट क्रेडिट 0 आहे. ओळखपत्र प्रिंट करण्यासाठी 1 क्रेडिट (₹15) लागेल." : lang === "hi" ? "आपका वॉलेट बैलेंस 0 है। आईडी कार्ड प्रिंट करने के लिए 1 क्रेडिट (₹15) खर्च होता है।" : "Wallet balance is 0. Generative printing costs 1 credit (₹15)."}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">{lang === "mr" ? "पेमेंट प्रक्रिया सुरक्षितपणे पूर्ण केली जाते." : lang === "hi" ? "भुगतान सुरक्षित रूप से संसाधित किया जाता है।" : "Payment is processed securely via Cashfree Gateway."}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Video Guides Section */}
      <div id="video-guides" className="mt-12 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm no-print">
        <div className="border-b pb-4 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-800">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-wider">
                Video Help Guides / वीडियो सहायता गाइड
              </h3>
              <p className="text-xs text-slate-400 font-bold">
                Learn how to log in, recharge your wallet, and create professional ID cards step-by-step.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Login & Recharge */}
          <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-md hover:border-emerald-100">
            <div className="space-y-2">
              <span className="text-[9px] px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full font-black text-emerald-800 uppercase tracking-wider">
                Guide 1
              </span>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mt-2">
                Account Login / Creation & Wallet Recharge Guide
              </h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                यह वीडियो गाइड आपको दिखाएगी कि गूगल से कैसे लॉगिन करें, नया अकाउंट कैसे सेटअप करें, और वॉलेट में सुरक्षित रूप से क्रेडिट कैसे जोड़ें।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveVideoGuide("login")}
              className="cursor-pointer w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Play className="w-4 h-4 text-[#cddc39] fill-[#cddc39]" /> Watch Video / वीडियो देखें
            </button>
          </div>

          {/* Card 2: Farmer ID Creation */}
          <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all hover:shadow-md hover:border-emerald-100">
            <div className="space-y-2">
              <span className="text-[9px] px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full font-black text-emerald-800 uppercase tracking-wider">
                Guide 2
              </span>
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mt-2">
                Farmer ID Card Creation & Printing Guide
              </h4>
              <p className="text-xs text-slate-500 font-bold leading-relaxed">
                यह वीडियो आपको फार्म भरने की प्रक्रिया, भूमि विवरण (land details) जोड़ने, कार्ड का रंग बदलने, और कार्ड को पीडीएफ/प्रिंट करने की पूरी जानकारी देगा।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveVideoGuide("creation")}
              className="cursor-pointer w-full py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
            >
              <Play className="w-4 h-4 text-[#cddc39] fill-[#cddc39]" /> Watch Video / वीडियो देखें
            </button>
          </div>
        </div>
      </div>

      {/* Video Guide Modal */}
      {activeVideoGuide && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] no-print animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 max-w-4xl w-full flex flex-col gap-4 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setActiveVideoGuide(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors p-1 bg-slate-100 hover:bg-slate-200 rounded-full"
            >
              <Plus className="w-6 h-6 rotate-45" />
            </button>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider border-b pb-3">
              {activeVideoGuide === "login"
                ? "Account Login/Creation & Recharge Guide / लॉगिन और रिचार्ज वीडियो गाइड"
                : "Farmer ID Card Creation Guide / कार्ड बनाने की वीडियो गाइड"}
            </h3>
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-950">
              <iframe
                src={
                  activeVideoGuide === "login"
                    ? "https://drive.google.com/file/d/1yLIiky1BgN4P7hqms6jZnWXm5N8OY0fS/preview"
                    : "https://drive.google.com/file/d/1zJHw6uyXLqMNV8E8lYeqmnHvLxHPiiAp/preview"
                }
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveVideoGuide(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-xl uppercase tracking-wider transition-all"
              >
                Close / बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Printable Only Card wrapper */}
      <div className="hidden print-only">
        <CardPreview data={formData} forceFullScale={true} />
      </div>

      {/* PDF Capture Only Card wrapper (never scaled, invisible, offscreen) */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div ref={pdfRef} style={{ width: "600px", height: "800px" }}>
          <CardPreview data={formData} forceFullScale={true} />
        </div>
      </div>
    </main>
  );
}
