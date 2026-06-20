import React, { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Download, Printer, AlertCircle, Trash2 } from "lucide-react";
import CardPreview from "../components/CardPreview";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Dashboard({ user }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const previewRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    fetchCards();
  }, [user]);

  const fetchCards = async () => {
    if (!user) return;
    const token = localStorage.getItem("agri_record_token");
    try {
      const response = await fetch(`/api/cards/my-cards?token=${token}`);
      const data = await response.json();
      if (response.ok) {
        setCards(data);
        if (data.length > 0) {
          setSelectedCard(data[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch cards:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

  const handleDownload = async () => {
    const cardContainer = pdfRef.current;
    if (!selectedCard || !cardContainer) return;
    setGeneratingPdf(true);

    try {
      // Use lower resolution on mobile to prevent memory issues
      const isMobile = window.innerWidth < 768;
      const pdfScale = isMobile ? 1.5 : 2;

      // Wait for fonts to load completely to avoid fallback font scaling shifts
      if (document.fonts) {
        await document.fonts.ready;
      }

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
      pdf.save(`FarmerCard_${selectedCard.farmerId || "Saved"}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert("Failed to render PDF.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this card? This action is irreversible.");
    if (!confirmDelete) return;
    
    const token = localStorage.getItem("agri_record_token");
    try {
      const response = await fetch(`/api/cards/${cardId}?token=${token}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Card deleted successfully!");
        // Refresh cards
        const updatedCards = cards.filter(c => c.id !== cardId);
        setCards(updatedCards);
        if (updatedCards.length > 0) {
          setSelectedCard(updatedCards[0]);
        } else {
          setSelectedCard(null);
        }
      } else {
        const data = await response.json();
        alert(data.detail || "Failed to delete card");
      }
    } catch (err) {
      console.error("Delete card error:", err);
      alert("Failed to delete card.");
    }
  };



  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {generatingPdf && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center z-[9999] text-white no-print">
          <Loader2 className="w-12 h-12 animate-spin text-[#cddc39] mb-4" />
          <p className="text-base font-bold">Generating card PDF...</p>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center no-print">
        <h2 className="text-2xl font-black text-slate-800">My Cards / मेरे पहचान पत्र ({cards.length})</h2>
      </div>

      {cards.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto no-print">
          <div className="inline-flex p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
            <AlertCircle className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800">No Cards Generated Yet</h3>
          <p className="text-sm font-semibold text-slate-400 leading-relaxed">
            You haven't generated or saved any cards under this account yet. Go to the Card Generator to create your first Farmer ID card.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Create Farmer Card
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print">
          {/* Left Cards List */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Saved Records</h4>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {cards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className={`p-4 border rounded-2xl bg-white shadow-xs cursor-pointer hover:border-emerald-300 transition-all flex items-center gap-4 ${
                    selectedCard?.id === card.id ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-200"
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    {card.photoUrl ? (
                      <img src={card.photoUrl} alt="Farmer" className="w-full h-full object-cover" />
                    ) : (
                      <Landmark className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-extrabold text-sm text-slate-800 truncate">{card.nameEnglish}</h5>
                    <p className="text-xs text-slate-400 font-bold truncate mt-0.5">{card.farmerId}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                        {card.state}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">{card.downloadDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Selected Card Preview & Actions */}
          <div className="lg:col-span-8 space-y-6">
            {selectedCard && (
              <>
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center">
                  <div className="w-full border-b pb-3 mb-6 flex justify-between items-center">
                    <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">
                      Farmer Card Details
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteCard(selectedCard.id)}
                        className="p-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        title="Delete Card"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Card
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-emerald-800" /> Download PDF
                      </button>
                      <button
                        onClick={handlePrint}
                        className="p-2 bg-[#064e3b] hover:bg-[#085a44] text-white rounded-xl transition-all shadow-md flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                      >
                        <Printer className="w-4 h-4" /> Print Card
                      </button>
                    </div>
                  </div>

                  <CardPreview data={selectedCard} previewRef={previewRef} />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Printable template */}
      {selectedCard && (
        <div className="hidden print-only">
          <CardPreview data={selectedCard} forceFullScale={true} />
        </div>
      )}

      {/* PDF Capture Only Card wrapper (never scaled, invisible, offscreen) */}
      {selectedCard && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div ref={pdfRef} style={{ width: "600px", height: "800px" }}>
            <CardPreview data={selectedCard} forceFullScale={true} />
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Landmark SVG proxy component
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
