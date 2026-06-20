import React, { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CardPreview from "../components/CardPreview";
import { 
  Plus, Trash2, Save, Download, Printer, Image, ShieldAlert,
  Loader2, CreditCard, ChevronRight, UserPlus, Lock
} from "lucide-react";

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

export default function MainGenerator({ user, onAuthSuccess, onUpdateCredits, onOpenRecharge }) {
  const previewRef = useRef(null);
  const pdfRef = useRef(null);
  
  // Basic Info Form State
  const [formData, setFormData] = useState({
    nameHindi: "विवेक कुमार",
    nameEnglish: "VIVEK KUMAR",
    dob: "15/08/1990",
    gender: "Male",
    mobile: "9988776655",
    aadhaar: "123456789012",
    farmerId: "",
    address: "ग्राम - रामपुर, पोस्ट - रामपुर, सुपौल, बिहार - 852131",
    photoUrl: "",
    downloadDate: "",
    state: "Bihar",
    cardColor: "default",
    landDetails: [
      { id: "1", district: "Supaul", subDistrict: "Supaul", village: "Rampur", mOwnerNo: "452", khasra: "1256", area: "0.45 Hec" }
    ]
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [step, setStep] = useState(1);

  // Form is locked when user is not logged in OR has 0 credits (and is not admin)
  const isFormLocked = !user || (user.role !== "Admin" && user.freeCredits === 0);

  // Generate random Farmer ID on mount or state change
  useEffect(() => {
    if (!formData.farmerId) {
      generateRandomFarmerId();
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
      alert("At least one land details record is required.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      landDetails: prev.landDetails.filter(land => land.id !== id)
    }));
  };

  // Local File Upload parsing
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview base64 immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, photoUrl: event.target.result }));
    };
    reader.readAsDataURL(file);

    // Also upload to server in background if token exists
    const token = localStorage.getItem("agri_record_token");
    if (token) {
      const uploadData = new FormData();
      uploadData.append("file", file);
      try {
        const response = await fetch("/api/upload-photo", {
          method: "POST",
          body: uploadData
        });
        const res = await response.json();
        if (response.ok) {
          setFormData(prev => ({ ...prev, photoUrl: res.photoUrl }));
        }
      } catch (err) {
        console.error("Photo upload failed:", err);
      }
    }
  };

  // Checkout and wallet validation logic
  const handleAction = async (actionType) => {
    if (!user) {
      alert("कृपया कार्ड को प्रिंट या सहेजने के लिए पहले लॉगिन करें। (Please login first to print or save cards).");
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
      alert("आपके वॉलेट में 0 क्रेडिट हैं। कृपया आगे बढ़ने के लिए क्रेडिट खरीदें। (You have 0 credits. Please purchase credits to proceed.)");
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
      alert("Credit validation failed. Action cancelled.");
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
      alert("किसान पहचान पत्र डेटाबेस में सफलतापूर्वक सहेजा गया! (Card saved successfully)");
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
      alert("Preview card elements not found.");
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
      alert("PDF generation failed. Try printing card directly or use Chrome desktop.");
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
            Digital Kisan Card Generator
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-400">
            Generate, preview, and download custom, printable Farmer ID Cards.
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
                  {!user ? "Login Required / लॉगिन आवश्यक" : "Form Locked / फॉर्म बंद"}
                </p>
                <p className="text-xs font-bold text-slate-500 text-center max-w-xs leading-relaxed">
                  {!user
                    ? "Please sign in to your account to access the card generator and start creating Farmer ID cards."
                    : "Your wallet balance is ₹0. Please recharge your wallet with credits to start filling card details."
                  }
                </p>
              </div>
              {user && (
                <button
                  type="button"
                  onClick={onOpenRecharge}
                  className="cursor-pointer px-5 py-2.5 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800"
                >
                  <CreditCard className="w-4 h-4" /> Recharge Wallet / क्रेडिट खरीदें
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
              <span className={`text-xs font-extrabold uppercase tracking-wider transition-colors ${step === 1 ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"}`}>Basic Info</span>
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
              <span className={`text-xs font-extrabold uppercase tracking-wider transition-colors ${step === 2 ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"}`}>Photo & Addr</span>
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
              <span className={`text-xs font-extrabold uppercase tracking-wider transition-colors ${step === 3 ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"}`}>Land Details</span>
            </button>
          </div>

          {/* Stepper Content */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-left duration-200">
              <div className="border-b pb-2 border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                  Basic Details / मूल विवरण
                </h3>
              </div>

              {/* District & Card Color Schemes settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    State / राज्य
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700 bg-white"
                  >
                    <option value="Bihar">Bihar / बिहार</option>
                    <option value="Uttar Pradesh">Uttar Pradesh / उत्तर प्रदेश</option>
                    <option value="Maharashtra">Maharashtra / महाराष्ट्र</option>
                    <option value="Rajasthan">Rajasthan / राजस्थान</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Card Theme Color / कार्ड का रंग
                  </label>
                  <select
                    name="cardColor"
                    value={formData.cardColor}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700 bg-white"
                  >
                    <option value="default">Default / राज्य आधारित</option>
                    <option value="green">Green / हरा</option>
                    <option value="blue">Blue / नीला</option>
                    <option value="orange">Orange / नारंगी</option>
                    <option value="red">Red / लाल</option>
                    <option value="purple">Purple / बैंगनी</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Farmer ID / किसान आईडी
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
                    Regen
                  </button>
                </div>
              </div>

              {/* Hindi Name & English Name details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Name (Hindi) / नाम (हिंदी)
                  </label>
                  <input
                    type="text"
                    name="nameHindi"
                    value={formData.nameHindi}
                    onChange={handleInputChange}
                    placeholder="उदा: विवेक कुमार"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Name (English) / नाम (अंग्रेजी)
                  </label>
                  <input
                    type="text"
                    name="nameEnglish"
                    value={formData.nameEnglish}
                    onChange={handleInputChange}
                    placeholder="Ex: VIVEK KUMAR"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700 uppercase"
                  />
                </div>
              </div>

              {/* DOB & Gender & Aadhaar & Mobile details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Date of Birth / जन्म तिथि
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
                    Gender / लिंग
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700 bg-white"
                  >
                    <option value="Male">Male / पुरुष</option>
                    <option value="Female">Female / महिला</option>
                    <option value="Other">Other / अन्य</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Aadhaar Number / आधार संख्या
                  </label>
                  <input
                    type="text"
                    name="aadhaar"
                    maxLength={12}
                    value={formData.aadhaar}
                    onChange={(e) => setFormData(prev => ({ ...prev, aadhaar: e.target.value.replace(/\D/g, "") }))}
                    placeholder="12 Digit Aadhaar"
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Mobile Number / मोबाइल
                  </label>
                  <input
                    type="text"
                    name="mobile"
                    maxLength={10}
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, "") }))}
                    placeholder="10 Digit Mobile"
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
                  Photo & Address / फोटो और पता
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
                    Upload Portrait / फोटो अपलोड करें
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="w-full text-xs font-bold text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#064e3b] file:text-white hover:file:bg-[#085a44] file:cursor-pointer transition-colors"
                  />
                  <p className="text-[10px] font-semibold text-slate-400 leading-tight">
                    Recommended: 3:4 aspect ratio passport size. Background processing mirrors uploads.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Permanent Address / स्थायी पता
                </label>
                <textarea
                  name="address"
                  rows={4}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter Full Address"
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none text-sm font-bold text-slate-700 resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right duration-200">
              <div className="border-b pb-2 border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                  Land Records / भूमि का विवरण (Max 8)
                </h3>
                <button
                  type="button"
                  onClick={addLandRow}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer hover-scale"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Plot
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
                          District
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
                          Sub-District
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
                          Village
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
                          Khata (Owner No.)
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
                          Khasra (Plot)
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
                          Area
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
                Live Card Preview / पूर्वावलोकन
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
              Action Desk / कार्रवाई पैनल
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <button
                type="button"
                onClick={() => handleAction("save")}
                className="py-2.5 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] sm:text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm cursor-pointer border border-slate-200"
              >
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Save</span><span className="sm:hidden">Save</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction("pdf")}
                className="py-2.5 sm:py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-[10px] sm:text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#cddc39]" /> PDF
              </button>

              <button
                type="button"
                onClick={() => handleAction("print")}
                className="py-2.5 sm:py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-[10px] sm:text-xs font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1 sm:gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Print
              </button>
            </div>
            
            {user && user.role !== "Admin" && user.freeCredits === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-950 text-xs font-bold leading-relaxed">
                <CreditCard className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                <div>
                  <p>Wallet balance is 0. Generative printing costs 1 credit (₹15).</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">Payment is processed securely via Cashfree Gateway.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
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
