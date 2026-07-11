import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CardPreview from "../components/CardPreview";
import { 
  ShieldCheck, ShieldAlert, Loader2, Download, Printer, 
  Home, ExternalLink, Calendar, User, Phone, BookOpen
} from "lucide-react";

export default function VerifyCard({ lang }) {
  const { cardId } = useParams();
  const [cardData, setCardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  
  const previewRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    fetchCardDetails();
  }, [cardId]);

  const fetchCardDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/cards/${cardId}`);
      const data = await response.json();
      if (response.ok) {
        setCardData(data);
      } else {
        setError(data.detail || "Card not found / किसान कार्ड नहीं मिला");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to verification server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadPDF = async () => {
    const cardContainer = pdfRef.current;
    if (!cardContainer) {
      window.showToast?.("Preview card elements not found.", "error");
      return;
    }

    setDownloading(true);
    setStatusMessage("Rendering card to PDF...");

    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const isMobile = window.innerWidth < 768;
      const pdfScale = isMobile ? 1.5 : 2;

      // Fix color issues for html2canvas
      const convertOklchInClone = (original, clone) => {
        const oklchElements = original.querySelectorAll('*');
        const clonedElements = clone.querySelectorAll('*');
        
        oklchElements.forEach((el, index) => {
          const computedStyle = window.getComputedStyle(el);
          const clonedEl = clonedElements[index];
          if (!clonedEl) return;

          // Convert background oklch
          if (computedStyle.backgroundColor && computedStyle.backgroundColor.includes('oklch')) {
            clonedEl.style.backgroundColor = '#064e3b'; 
          }
          // Convert text oklch
          if (computedStyle.color && computedStyle.color.includes('oklch')) {
            clonedEl.style.color = '#064e3b';
          }
        });
      };

      const canvas = await html2canvas(cardContainer, {
        pixelRatio: pdfScale,
        backgroundColor: "#ffffff",
        scale: pdfScale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc, clonedEl) => {
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
      pdf.save(`Verified_FarmerCard_${cardData.farmerId}.pdf`);
      
      setStatusMessage("PDF generated successfully!");
      setTimeout(() => setStatusMessage(""), 2000);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("PDF generation failed. Please try printing the card directly.");
    } finally {
      setDownloading(false);
      setStatusMessage("");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-pulse select-none no-print">
        {/* Verification Header Skeleton */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4 shadow-sm">
          <div className="w-14 h-14 bg-slate-200 rounded-2xl shrink-0"></div>
          <div className="flex-1 space-y-3">
            <div className="flex gap-2">
              <div className="h-4 bg-slate-200 rounded-full w-16"></div>
              <div className="h-4 bg-slate-100 rounded-full w-24"></div>
            </div>
            <div className="h-6 bg-slate-200 rounded-lg w-2/3"></div>
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
        </div>

        {/* Main Grid: Card Render & Text Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card Preview Skeleton */}
          <div className="lg:col-span-8 flex flex-col items-center space-y-6">
            <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col items-center">
              <div className="w-[600px] h-[380px] bg-slate-50 border border-slate-200 rounded-none flex flex-col justify-between p-5 relative">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                    <div className="space-y-1.5">
                      <div className="h-3 bg-slate-200 rounded w-24"></div>
                      <div className="h-2 bg-slate-100 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                </div>
                
                <div className="flex gap-4 items-center justify-between my-2">
                  <div className="w-28 h-28 bg-slate-200 rounded-2xl shrink-0"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3.5 bg-slate-150 rounded w-1/2"></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-3 bg-slate-100 rounded w-full"></div>
                      <div className="h-3 bg-slate-100 rounded w-full"></div>
                    </div>
                  </div>
                  <div className="w-20 h-20 bg-slate-200 rounded-xl shrink-0"></div>
                </div>

                <div className="h-10 bg-slate-200 rounded-xl w-full"></div>
              </div>
            </div>
          </div>

          {/* Right Summary Details Skeleton */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-5">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-150 rounded-xl shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-2 bg-slate-100 rounded w-1/3"></div>
                    <div className="h-3.5 bg-slate-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="h-11 bg-slate-200 rounded-xl w-full"></div>
              <div className="h-11 bg-slate-200 rounded-xl w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-red-100 rounded-3xl p-8 shadow-lg text-center space-y-6 animate-in fade-in duration-200">
          <div className="inline-flex p-4 bg-red-50 text-red-600 rounded-2xl">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">Verification Failed</h2>
            <p className="text-xs font-bold text-red-500 uppercase tracking-wider">
              अमान्य या नकली किसान कार्ड
            </p>
            <p className="text-sm font-semibold text-slate-500 pt-2 leading-relaxed">
              The card ID scanned is either invalid, deleted, or did not match any official records.
            </p>
          </div>

          <div className="pt-4">
            <Link 
              to="/" 
              className="w-full inline-flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-950 text-white text-xs font-black rounded-xl uppercase tracking-wider transition-colors shadow-md"
            >
              <Home className="w-4 h-4" /> Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Visual Overlay Loading */}
      {downloading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center z-[9999] text-white">
          <Loader2 className="w-12 h-12 animate-spin text-[#cddc39] mb-4" />
          <p className="text-base font-bold animate-pulse">{statusMessage}</p>
        </div>
      )}

      {/* Verification Header */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4 shadow-sm no-print">
        <div className="p-3 bg-emerald-500 text-white rounded-2xl animate-bounce">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="text-center sm:text-left space-y-1">
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
            <span className="bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
              Verified
            </span>
            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider">
              Official Record
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight leading-tight">
            Kisan Pehchan Patra Verified Successfully
          </h2>
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            किसान पहचान पत्र सफलतापूर्वक सत्यापित किया गया
          </p>
        </div>
      </div>

      {/* Main Grid: Card Render & Text Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Printable/Visually interactive card preview */}
        <div className="lg:col-span-8 flex flex-col items-center space-y-6">
          <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex flex-col items-center">
            <div ref={previewRef} className="w-full">
              <CardPreview data={cardData} previewRef={previewRef} />
            </div>

            {/* Actions panel */}
            <div className="flex gap-4 mt-6 w-full no-print">
              <button
                onClick={downloadPDF}
                className="flex-1 py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-xs font-black rounded-xl uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl uppercase tracking-wider transition-colors border border-slate-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        </div>

        {/* Text Breakdown details panel */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-6 no-print">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Farmer Details Summary</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">विवरण सारांश</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-xl mt-0.5">
                <User className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Name / नाम</span>
                <span className="text-sm font-black text-slate-800">{cardData.nameEnglish}</span>
                <span className="text-xs font-bold text-slate-500 block">{cardData.nameHindi}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-xl mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">DOB & Gender / जन्म तिथि और लिंग</span>
                <span className="text-sm font-bold text-slate-800">{cardData.dob} ({cardData.gender})</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-xl mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Mobile / मोबाइल</span>
                <span className="text-sm font-bold text-slate-800">+91 {cardData.mobile}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-xl mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Land Details count / भूमि रिकॉर्ड संख्या</span>
                <span className="text-sm font-bold text-slate-800">
                  {cardData.landDetails?.length || 0} Plot(s) / भूखंड
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Hidden printable page component for high resolution prints */}
      <div className="print-only" style={{ display: 'none' }}>
        <div ref={pdfRef} className="print-sheet" style={{ width: "210mm", padding: "15mm", backgroundColor: "#ffffff" }}>
          <div className="flex flex-col items-center">
            <CardPreview data={cardData} forceFullScale={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
