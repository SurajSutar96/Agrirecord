import React, { useRef, useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { CheckCircle2, Shield, CalendarDays, User, Phone, MapPin, Landmark } from "lucide-react";

// State emblems configuration
const STATE_THEMES = [
  {
    name: "Bihar",
    hindiName: "बिहार",
    englishGovt: "Govt. of Bihar",
    hindiGovt: "Bihar Sarkar",
    logoUrl: "/bihar-seal.png",
    primaryColor: "#064e3b",
    secondaryColor: "#8bc34a",
    accentColor: "#cddc39",
    gradientFrom: "#064e3b",
    gradientVia: "#085a44",
    gradientTo: "#064e3b",
    lightBg: "#f0fdf4",
    lightBorder: "#dcfce7"
  },
  {
    name: "Uttar Pradesh",
    hindiName: "उत्तर प्रदेश",
    englishGovt: "Govt. of Uttar Pradesh",
    hindiGovt: "Uttar Pradesh Shasan",
    logoUrl: "/up-seal.png",
    primaryColor: "#7c2d12",
    secondaryColor: "#f97316",
    accentColor: "#facc15",
    gradientFrom: "#7c2d12",
    gradientVia: "#9a3412",
    gradientTo: "#7c2d12",
    lightBg: "#fff7ed",
    lightBorder: "#ffedd5"
  },
  {
    name: "Maharashtra",
    hindiName: "महाराष्ट्र",
    englishGovt: "Govt. of Maharashtra",
    hindiGovt: "Maharashtra Shasan",
    logoUrl: "/maharashtra-seal.png",
    primaryColor: "#7c2d12",
    secondaryColor: "#ea580c",
    accentColor: "#facc15",
    gradientFrom: "#7c2d12",
    gradientVia: "#ea580c",
    gradientTo: "#7c2d12",
    lightBg: "#fff7ed",
    lightBorder: "#ffedd5"
  },
  {
    name: "Rajasthan",
    hindiName: "राजस्थान",
    englishGovt: "Govt. of Rajasthan",
    hindiGovt: "Rajasthan Sarkar",
    logoUrl: "/rajasthan-seal.png",
    primaryColor: "#064e3b",
    secondaryColor: "#8bc34a",
    accentColor: "#cddc39",
    gradientFrom: "#064e3b",
    gradientVia: "#085a44",
    gradientTo: "#064e3b",
    lightBg: "#f0fdf4",
    lightBorder: "#dcfce7"
  }
];

export default function CardPreview({ data, forceFullScale = false, previewRef, isDraft = false }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  // Find theme of selected state
  const stateTheme = STATE_THEMES.find((theme) => theme.name === data.state) || STATE_THEMES[0];
  const watermarkUrl = "/farmer-logo.png";

  // Compute color options based on selected cardColor override or default
  const theme = (() => {
    if (!data.cardColor || data.cardColor === "default") {
      return {
        primaryColor: stateTheme.primaryColor,
        secondaryColor: stateTheme.secondaryColor,
        accentColor: stateTheme.accentColor,
        gradientFrom: stateTheme.gradientFrom,
        gradientVia: stateTheme.gradientVia,
        gradientTo: stateTheme.gradientTo,
        lightBg: stateTheme.lightBg,
        lightBorder: stateTheme.lightBorder,
      };
    }
    
    switch (data.cardColor) {
      case "green":
        return {
          primaryColor: "#064e3b",
          secondaryColor: "#8bc34a",
          accentColor: "#cddc39",
          gradientFrom: "#064e3b",
          gradientVia: "#085a44",
          gradientTo: "#064e3b",
          lightBg: "#f0fdf4",
          lightBorder: "#dcfce7",
        };
      case "red":
        return {
          primaryColor: "#7f1d1d",
          secondaryColor: "#ef4444",
          accentColor: "#fca5a5",
          gradientFrom: "#7f1d1d",
          gradientVia: "#991b1b",
          gradientTo: "#7f1d1d",
          lightBg: "#fef2f2",
          lightBorder: "#fee2e2",
        };
      case "orange":
        return {
          primaryColor: "#7c2d12",
          secondaryColor: "#ea580c",
          accentColor: "#facc15",
          gradientFrom: "#7c2d12",
          gradientVia: "#ea580c",
          gradientTo: "#7c2d12",
          lightBg: "#fff7ed",
          lightBorder: "#ffedd5",
        };
      case "blue":
        return {
          primaryColor: "#1e3a8a",
          secondaryColor: "#0ea5e9",
          accentColor: "#bae6fd",
          gradientFrom: "#1e3a8a",
          gradientVia: "#0ea5e9",
          gradientTo: "#1e3a8a",
          lightBg: "#f0f9ff",
          lightBorder: "#e0f2fe",
        };
      case "purple":
        return {
          primaryColor: "#581c87",
          secondaryColor: "#a855f7",
          accentColor: "#d8b4fe",
          gradientFrom: "#581c87",
          gradientVia: "#6b21a8",
          gradientTo: "#581c87",
          lightBg: "#faf5ff",
          lightBorder: "#f3e8ff",
        };
      default:
        return {
          primaryColor: stateTheme.primaryColor,
          secondaryColor: stateTheme.secondaryColor,
          accentColor: stateTheme.accentColor,
          gradientFrom: stateTheme.gradientFrom,
          gradientVia: stateTheme.gradientVia,
          gradientTo: stateTheme.gradientTo,
          lightBg: stateTheme.lightBg,
          lightBorder: stateTheme.lightBorder,
        };
    }
  })();

  // Handle auto scaling based on viewport width
  useEffect(() => {
    if (forceFullScale) {
      setScale(1);
      return;
    }
    const updateScale = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.offsetWidth - 32;
        if (parentWidth < 600) {
          setScale(parentWidth / 600);
        } else {
          setScale(1);
        }
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [forceFullScale]);

  const issueDate = !data.downloadDate || data.downloadDate === "0" || data.downloadDate.trim() === ""
    ? new Date().toLocaleDateString("en-GB")
    : data.downloadDate;

  // Format QR Code value
  const landList = data.landDetails || [];
  const landSummary = landList
    .filter((l) => l.district || l.mOwnerNo || l.khasra)
    .map((l, i) => `P${i + 1}: ${l.district}/${l.subDistrict}, Khata:${l.mOwnerNo}, Khasra:${l.khasra}, Area:${l.area}`)
    .join(" | ");

  const qrText = `Name: ${data.nameEnglish}
ID: ${data.farmerId}
DOB: ${data.dob}
Mob: ${data.mobile}
Addr: ${data.address}
Land: ${landSummary}
Issued: ${issueDate}`;

  // Helper for dynamic table sizes based on rows count
  const getTableSizeStyles = (count) => {
    if (count <= 2) {
      return { text: "text-[12px]", headerText: "text-[12px]", padding: "px-3 py-1.5", headerPadding: "px-3 py-1.5" };
    } else if (count <= 4) {
      return { text: "text-[11px]", headerText: "text-[11px]", padding: "px-2.5 py-1", headerPadding: "px-2.5 py-1" };
    } else if (count <= 6) {
      return { text: "text-[10px]", headerText: "text-[10px]", padding: "px-2 py-0.5", headerPadding: "px-2 py-0.5" };
    } else {
      return { text: "text-[9px]", headerText: "text-[9px]", padding: "px-1.5 py-0.5", headerPadding: "px-1.5 py-0.5" };
    }
  };

  const sliceLandList = landList.slice(0, 8);
  const tableStyles = getTableSizeStyles(sliceLandList.length);

  const activeScale = forceFullScale ? 1 : scale;

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center card-preview-container">
      <div
        ref={previewRef}
        className={`w-full flex flex-col items-center gap-8 ${forceFullScale ? "print-force-scale" : "no-print"}`}
        style={{
          transform: `scale(${activeScale})`,
          transformOrigin: "top center",
          height: "800px",
          marginBottom: `${-800 * (1 - activeScale)}px`
        }}
      >
        {/* FRONT CARD */}
        <div className="card-ratio bg-white h2c-bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden border border-slate-200 h2c-border-slate-200 relative card-pattern select-none" style={{ width: "600px", height: "380px", boxSizing: "border-box" }}>
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-0">
            <img src={watermarkUrl} alt="Watermark" className="w-[300px] h-[300px] object-contain grayscale" />
          </div>

          {/* Top Line accent */}
          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: theme.secondaryColor }}></div>

          {/* Header Bar */}
          <div
            className="text-white px-5 py-3 flex justify-between items-center shadow-sm relative z-10"
            style={{ backgroundColor: theme.primaryColor, height: "68px", boxSizing: "border-box" }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white h2c-bg-white p-2 rounded-lg shadow-inner flex items-center justify-center" style={{ width: "40px", height: "40px", boxSizing: "border-box" }}>
                <Shield className="w-8 h-8" style={{ color: theme.primaryColor }} />
              </div>
              <div className="flex flex-col justify-center gap-1">
                <h1 className="text-[20px] font-black italic tracking-tight leading-none" style={{ margin: 0, padding: 0 }}>
                  Agri<span style={{ color: theme.accentColor }}>record</span>
                </h1>
                <span className="text-[9px] uppercase font-bold tracking-[0.15em] opacity-80 block" style={{ margin: 0, padding: 0 }}>
                  Farmer Information Card
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end justify-center gap-1 mr-2">
                <span className="text-[12px] font-bold uppercase tracking-tighter" style={{ color: theme.accentColor, lineHeight: "1.1" }}>
                  {stateTheme.hindiName}
                </span>
                <span className="text-[9px] font-semibold text-white/70 h2c-text-white-70 uppercase" style={{ lineHeight: "1" }}>
                  {stateTheme.name}
                </span>
              </div>
              <div className="bg-white h2c-bg-white p-1 rounded-full shadow-lg flex items-center justify-center" style={{ width: "40px", height: "40px", boxSizing: "border-box" }}>
                <img src={stateTheme.logoUrl} alt="State Emblem" className="w-8 h-8 object-contain" />
              </div>
            </div>
          </div>

          {/* Main Card Body */}
          <div className="flex p-5 gap-6 relative z-10" style={{ height: "248px", boxSizing: "border-box" }}>
            {/* Left Photo & Verification */}
            <div className="flex flex-col gap-3 items-center">
              <div
                className="w-[120px] h-[150px] border-[3px] rounded-md overflow-hidden bg-gray-50 h2c-bg-gray-50 flex items-center justify-center shadow-lg relative"
                style={{ borderColor: theme.primaryColor }}
              >
                {data.photoUrl ? (
                  <img src={data.photoUrl} alt="Farmer" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-300 h2c-text-gray-300 w-16 h-16 flex items-center justify-center">
                    <User className="w-12 h-12" />
                  </div>
                )}
                {/* Government Stamp Overlay */}
                <div
                  className="absolute bottom-1 right-1 text-white p-1 rounded-full shadow-xs"
                  style={{ backgroundColor: theme.secondaryColor }}
                >
                  <img src={stateTheme.logoUrl} className="w-3.5 h-3.5 brightness-0 invert" alt="seal" />
                </div>
              </div>

              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 h2c-text-emerald-700 opacity-80" />
                <span className="text-[9px] font-black text-emerald-950/70 h2c-text-emerald-950-70 uppercase tracking-tighter mt-0.5">
                  Verified Member
                </span>
              </div>
            </div>

            {/* Middle Data Fields */}
            <div className="flex-1 flex flex-col justify-start pt-1">
              <div className="mb-4">
                <span className="text-[11px] font-extrabold uppercase block tracking-widest" style={{ color: theme.primaryColor }}>
                  Name / नाम
                </span>
                <div className="flex flex-col leading-tight mt-1">
                  <span className="text-2xl font-black text-slate-900 h2c-text-slate-900">{data.nameHindi}</span>
                  <span className="text-base font-bold text-slate-500 h2c-text-slate-500 uppercase tracking-wide">
                    {data.nameEnglish}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase leading-tight" style={{ color: theme.primaryColor }}>
                    Date of Birth / जन्म तिथि
                  </span>
                  <span className="text-sm font-bold text-slate-800 h2c-text-slate-800">{data.dob}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase leading-tight" style={{ color: theme.primaryColor }}>
                    Gender / लिंग
                  </span>
                  <span className="text-sm font-bold text-slate-800 h2c-text-slate-800">{data.gender}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase leading-tight" style={{ color: theme.primaryColor }}>
                    Aadhaar No. / आधार
                  </span>
                  <span className="text-sm font-bold text-slate-800 h2c-text-slate-800">
                    {data.aadhaar.replace(/(\d{4})/g, "$1 ").trim()}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase leading-tight" style={{ color: theme.primaryColor }}>
                    Mobile / मोबाइल
                  </span>
                  <span className="text-sm font-bold text-slate-800 h2c-text-slate-800">+91 {data.mobile}</span>
                </div>
              </div>
            </div>

            {/* Right QR Code & Issue Date */}
            <div className="flex flex-col items-end justify-between py-1" style={{ height: "208px", boxSizing: "border-box" }}>
              <div className="bg-white h2c-bg-white p-1.5 rounded-xl shadow-md border border-gray-100 h2c-border-gray-100 mt-1">
                <QRCodeCanvas value={qrText} size={85} level="M" includeMargin={false} />
              </div>
              <div className="flex items-center gap-1.5 pb-1">
                <span className="text-[9px] font-black text-slate-400 h2c-text-slate-400 uppercase tracking-widest">Issue Date:</span>
                <span className="text-[10px] font-black text-slate-600 h2c-text-slate-600 tracking-wider">{issueDate}</span>
              </div>
            </div>
          </div>

          {/* Bottom Banner */}
          <div
            className="absolute bottom-0 left-0 right-0 text-white pt-3 pb-3 flex justify-center items-center shadow-[0_-8px_25px_rgba(0,0,0,0.2)] z-10 border-t"
            style={{
              background: `linear-gradient(to right, ${theme.gradientFrom}, ${theme.gradientVia}, ${theme.gradientTo})`,
              borderColor: `${theme.accentColor}40`
            }}
          >
            <div className="absolute left-6 opacity-20">
              <Landmark className="w-8 h-8" style={{ color: theme.accentColor }} />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-3xl font-black tracking-[0.3em] drop-shadow-xl text-white h2c-text-white font-mono leading-none">
                {data.farmerId}
              </span>
              <div className="flex items-center gap-3">
                <span className="w-8 h-[1px]" style={{ backgroundColor: `${theme.accentColor}30` }}></span>
                <span className="text-[8px] font-black uppercase tracking-[0.25em] drop-shadow-sm whitespace-nowrap" style={{ color: theme.accentColor }}>
                  Digital Farmer ID / डिजिटल किसान आईडी
                </span>
                <span className="w-8 h-[1px]" style={{ backgroundColor: `${theme.accentColor}30` }}></span>
              </div>
            </div>
            <div className="absolute right-6 opacity-20 rotate-12">
              <Shield className="w-8 h-8" style={{ color: theme.accentColor }} />
            </div>
          </div>

          {isDraft && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100] select-none overflow-hidden">
              <div 
                className="text-red-600/15 font-black text-6xl uppercase tracking-[0.25em] select-none pointer-events-none whitespace-nowrap rotate-[-30deg]"
                style={{
                  textShadow: "1px 1px 0 rgba(255,255,255,0.4)"
                }}
              >
                AgriRecord Draft
              </div>
            </div>
          )}
        </div>

        {/* BACK CARD */}
        <div className="card-ratio bg-white h2c-bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-3xl overflow-hidden border border-slate-200 h2c-border-slate-200 p-5 flex flex-col relative card-pattern select-none" style={{ width: "600px", height: "380px", boxSizing: "border-box" }}>
          {/* Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none z-0">
            <img src={watermarkUrl} alt="Watermark" className="w-[300px] h-[300px] object-contain grayscale" />
          </div>

          <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: theme.secondaryColor }}></div>

          {/* Header Row */}
          <div className="flex justify-between items-start mb-1 border-b pb-1.5 relative z-10" style={{ borderColor: theme.lightBorder, height: "55px", overflow: "hidden" }}>
            <div className="flex-1 pr-12">
              <h3 className="font-black text-[11px] mb-0.5 uppercase tracking-widest" style={{ color: theme.primaryColor, lineHeight: "1.4" }}>
                Permanent Address / स्थायी पता
              </h3>
              <p className="text-[11px] text-slate-800 h2c-text-slate-800 leading-tight font-bold" style={{ lineHeight: "1.2", height: "26px", overflow: "hidden", display: "block" }}>{data.address}</p>
            </div>
            <div className="flex flex-col items-end">
              <img src={stateTheme.logoUrl} className="w-10 h-10 opacity-20 grayscale" alt="seal" style={{ marginTop: "-2px" }} />
            </div>
          </div>

          {/* Land records block */}
          <div className="flex-1 overflow-hidden relative z-10 flex flex-col mt-2" style={{ height: "210px" }}>
            <h3 className="font-black text-[11px] mb-1.5 uppercase tracking-widest flex items-center gap-2" style={{ color: theme.primaryColor, lineHeight: "1.4" }}>
              <Shield className="w-3.5 h-3.5 text-emerald-800 h2c-text-emerald-800" /> Land Records / भूमि का विवरण
            </h3>
            
            <div className="rounded-xl overflow-hidden border h2c-border-slate-200 shadow-xs bg-white/50 h2c-bg-white-50" style={{ borderColor: theme.lightBorder, height: "180px", overflow: "hidden" }}>
              <table className="w-full text-left border-collapse" style={{ tableLayout: "fixed", width: "100%" }}>
                <thead>
                  <tr
                    className={`font-black border-b ${tableStyles.headerText}`}
                    style={{ backgroundColor: theme.lightBg, color: theme.primaryColor, borderColor: theme.lightBorder }}
                  >
                    <th className={tableStyles.headerPadding} style={{ width: "17%" }}>District</th>
                    <th className={tableStyles.headerPadding} style={{ width: "17%" }}>Sub-Dist</th>
                    <th className={tableStyles.headerPadding} style={{ width: "18%" }}>Village</th>
                    <th className={tableStyles.headerPadding} style={{ width: "14%" }}>Khata</th>
                    <th className={tableStyles.headerPadding} style={{ width: "14%" }}>Khasra</th>
                    <th className={`${tableStyles.headerPadding} text-right`} style={{ width: "20%" }}>Area</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${tableStyles.text}`} style={{ borderColor: theme.lightBorder }}>
                  {sliceLandList.length > 0 ? (
                    sliceLandList.map((row, idx) => (
                      <tr
                        key={row.id}
                        style={{
                          backgroundColor: idx % 2 === 0 ? "rgba(255, 255, 255, 0.7)" : `${theme.lightBg}40`
                        }}
                      >
                        <td className={`${tableStyles.padding} text-slate-900 h2c-text-slate-900 font-bold truncate`}>{row.district || "-"}</td>
                        <td className={`${tableStyles.padding} text-slate-800 h2c-text-slate-800 font-medium truncate`}>{row.subDistrict || "-"}</td>
                        <td className={`${tableStyles.padding} text-slate-800 h2c-text-slate-800 font-medium truncate`}>{row.village || "-"}</td>
                        <td className={`${tableStyles.padding} text-slate-950 h2c-text-slate-900 font-black truncate`}>{row.mOwnerNo || "-"}</td>
                        <td className={`${tableStyles.padding} text-slate-950 h2c-text-slate-900 font-black truncate`}>{row.khasra || "-"}</td>
                        <td className={`${tableStyles.padding} text-right font-black truncate`} style={{ color: theme.primaryColor }}>
                          {row.area || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-xs font-bold text-slate-400 h2c-text-slate-400">
                        No Land details recorded / भूमि का विवरण दर्ज नहीं है
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer / footer (absolutely positioned at the bottom inside card padding) */}
          <div className="absolute bottom-[20px] left-[20px] right-[20px] flex justify-between items-end border-t pt-2 z-10" style={{ borderColor: theme.lightBorder, height: "45px", boxSizing: "border-box" }}>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-black uppercase" style={{ color: theme.primaryColor, lineHeight: "1" }}>
                  Issued On: {issueDate}
                </span>
              </div>
              <span className="text-[8px] text-slate-500 h2c-text-slate-500 font-bold uppercase block" style={{ lineHeight: "1.2" }}>
                PRIVATE DOCUMENT - NOT A GOVERNMENT IDENTITY CARD
              </span>
              <span className="text-[7.5px] text-slate-500 h2c-text-slate-500 font-medium uppercase italic block" style={{ lineHeight: "1.2" }}>
                निजी दस्तावेज़ - यह कोई सरकारी पहचान पत्र नहीं है।
              </span>
            </div>
            <div className="flex gap-2 opacity-15 pb-1">
              <Shield className="w-4 h-4" style={{ color: theme.primaryColor }} />
              <Shield className="w-4 h-4" style={{ color: theme.primaryColor }} />
            </div>
          </div>

          {isDraft && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100] select-none overflow-hidden">
              <div 
                className="text-red-600/15 font-black text-6xl uppercase tracking-[0.25em] select-none pointer-events-none whitespace-nowrap rotate-[-30deg]"
                style={{
                  textShadow: "1px 1px 0 rgba(255,255,255,0.4)"
                }}
              >
                AgriRecord Draft
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
