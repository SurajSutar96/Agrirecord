import React, { useState, useEffect, useRef } from "react";
import { Loader2, Plus, Download, Printer, AlertCircle, Trash2, CreditCard, ChevronRight, FileText, Calendar, DollarSign, CheckCircle2, XCircle } from "lucide-react";
import CardPreview from "../components/CardPreview";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { translations } from "../translations";

export default function Dashboard({ user, lang }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState("cards"); // "cards", "recharges"
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [cardsPage, setCardsPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const previewRef = useRef(null);
  const pdfRef = useRef(null);

  useEffect(() => {
    setCardsPage(1);
    setPaymentsPage(1);
  }, [activeTab]);

  const itemsPerPage = 10;
  const paginatedCards = cards.slice((cardsPage - 1) * itemsPerPage, cardsPage * itemsPerPage);
  const paginatedPayments = payments.slice((paymentsPage - 1) * itemsPerPage, paymentsPage * itemsPerPage);

  useEffect(() => {
    fetchCards();
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;
    setPaymentsLoading(true);
    const token = localStorage.getItem("agri_record_token");
    try {
      const response = await fetch(`/api/my-payments?token=${token}`);
      const data = await response.json();
      if (response.ok) {
        setPayments(data);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "recharges") {
      fetchPayments();
    }
  }, [activeTab, user]);

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

  const [printTarget, setPrintTarget] = useState("card");

  const handlePrint = () => {
    setPrintTarget("card");
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintInvoice = (invoice) => {
    setViewingInvoice(invoice);
    setPrintTarget("invoice");
    setTimeout(() => {
      window.print();
    }, 100);
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
      window.showToast("Failed to render PDF.", "error");
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
        window.showToast("Card deleted successfully!", "success");
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
        window.showToast(data.detail || "Failed to delete card", "error");
      }
    } catch (err) {
      console.error("Delete card error:", err);
      window.showToast("Failed to delete card.", "error");
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

      {/* Dashboard Title Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border border-emerald-100 rounded-3xl bg-white p-4 sm:p-6 shadow-xs gap-3 no-print">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">
            {translations[lang].dashboardTitle}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-slate-400">
            {lang === "mr" ? "तुमची शेतकरी ओळखपत्रे व्यवस्थापित करा आणि रीचार्ज इतिहास पावती डाउनलोड करा." : lang === "hi" ? "अपने किसान पहचान पत्र प्रबंधित करें और रिचार्ज रसीदें डाउनलोड करें।" : "Manage your generated farmer cards and download recharge receipts."}
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 mb-6 gap-6 no-print">
        <button
          onClick={() => setActiveTab("cards")}
          className={`pb-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === "cards"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          {translations[lang].myCardsTab} ({cards.length})
        </button>
        <button
          onClick={() => setActiveTab("recharges")}
          className={`pb-3 text-xs sm:text-sm font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeTab === "recharges"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          {translations[lang].rechargesTab}
        </button>
      </div>

      {activeTab === "cards" ? (
        cards.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto no-print">
            <div className="inline-flex p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
              <AlertCircle className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800">{translations[lang].noCards}</h3>
            <p className="text-sm font-semibold text-slate-400 leading-relaxed">
              {translations[lang].noCardsDesc}
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#064e3b] hover:bg-[#085a44] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> {translations[lang].createFirstCard}
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start no-print">
            {/* Left Cards List */}
            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">{translations[lang].savedRecords}</h4>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {paginatedCards.map((card) => (
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
              <Pagination
                currentPage={cardsPage}
                totalItems={cards.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCardsPage}
              />
            </div>

            {/* Right Selected Card Preview & Actions */}
            <div className="lg:col-span-8 space-y-6">
              {selectedCard && (
                <>
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center">
                    <div className="w-full border-b pb-3 mb-6 flex justify-between items-center">
                      <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wider">
                        {translations[lang].cardDetails}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteCard(selectedCard.id)}
                          className="p-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                          title="Delete Card"
                        >
                          <Trash2 className="w-4 h-4" /> {translations[lang].deleteCard}
                        </button>
                        <button
                          onClick={handleDownload}
                          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        >
                          <Download className="w-4 h-4 text-emerald-800" /> {translations[lang].downloadPdf}
                        </button>
                        <button
                          onClick={handlePrint}
                          className="p-2 bg-[#064e3b] hover:bg-[#085a44] text-white rounded-xl transition-all shadow-md flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        >
                          <Printer className="w-4 h-4" /> {translations[lang].printCard}
                        </button>
                      </div>
                    </div>

                    <CardPreview data={selectedCard} previewRef={previewRef} />
                  </div>
                </>
              )}
            </div>
          </div>
        )
      ) : (
        /* Recharge Payments History Tab content */
        <div className="space-y-6">
          {paymentsLoading ? (
            <div className="min-h-[250px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-emerald-700 animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto no-print">
              <div className="inline-flex p-4 bg-slate-50 border border-slate-100 rounded-full text-slate-400">
                <CreditCard className="w-12 h-12" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800">{translations[lang].noPayments}</h3>
              <p className="text-sm font-semibold text-slate-400 leading-relaxed">
                {translations[lang].noPaymentsDesc}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs no-print">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b">
                    <tr>
                      <th className="px-6 py-4">{translations[lang].paymentDate}</th>
                      <th className="px-6 py-4">{translations[lang].orderId}</th>
                      <th className="px-6 py-4">{translations[lang].package}</th>
                      <th className="px-6 py-4">{translations[lang].amount}</th>
                      <th className="px-6 py-4">{translations[lang].status}</th>
                      <th className="px-6 py-4 text-right">{translations[lang].receipt}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {paginatedPayments.map((p) => {
                      const isPaid = p.status === "PAID" || p.status === "SUCCESS";
                      const isFailed = p.status === "FAILED";
                      const formattedDate = p.createdAt ? new Date(p.createdAt).toLocaleString() : "N/A";
                      
                      return (
                        <tr key={p.order_id || p.orderId} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{formattedDate}</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-[10px] text-slate-500">
                            {p.order_id || p.orderId}
                          </td>
                          <td className="px-6 py-4">
                            {p.package_id === "pkg_basic" ? "Basic Plan (10 Credits)" : p.package_id === "pkg_silver" ? "Silver Plan (30 Credits)" : p.package_id === "pkg_gold" ? "Gold Plan (100 Credits)" : "Wallet Top-up"}
                          </td>
                          <td className="px-6 py-4 font-extrabold text-slate-800">
                            ₹{p.amount || 0}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isPaid 
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                : isFailed 
                                ? "bg-red-50 text-red-800 border border-red-100"
                                : "bg-amber-50 text-amber-800 border border-amber-100"
                            }`}>
                              {isPaid 
                                ? translations[lang].paidSuccess 
                                : isFailed 
                                ? translations[lang].paymentFailed 
                                : translations[lang].paymentPending
                              }
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isPaid && (
                              <button
                                onClick={() => setViewingInvoice(p)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-xs"
                              >
                                <FileText className="w-3.5 h-3.5" /> {translations[lang].viewReceipt}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={paymentsPage}
                totalItems={payments.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setPaymentsPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Invoice Modal Overlay */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xs sm:text-base font-extrabold text-slate-800 uppercase tracking-wider">
                {translations[lang].receipt}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintInvoice(viewingInvoice)}
                  className="px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#085a44] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> {translations[lang].printReceipt}
                </button>
                <button
                  onClick={() => setViewingInvoice(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-slate-200 cursor-pointer"
                >
                  {translations[lang].close}
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <PrintableInvoice invoice={viewingInvoice} user={user} lang={lang} />
            </div>
          </div>
        </div>
      )}

      {/* Printable template */}
      {printTarget === "card" && selectedCard && (
        <div className="hidden print-only">
          <CardPreview data={selectedCard} forceFullScale={true} />
        </div>
      )}

      {printTarget === "invoice" && viewingInvoice && (
        <div className="hidden print-only">
          <PrintableInvoice invoice={viewingInvoice} user={user} lang={lang} />
        </div>
      )}

      {/* PDF Capture Only Card wrapper (never scaled, invisible, offscreen) */}
      {printTarget === "card" && selectedCard && (
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

const PrintableInvoice = ({ invoice, user, lang }) => {
  const formattedDate = invoice.createdAt ? new Date(invoice.createdAt).toLocaleString() : "N/A";
  const amount = invoice.amount || 0;
  const planName = invoice.package_id === "pkg_basic" 
    ? (lang === "mr" ? "बेसिक प्लॅन (१० क्रेडिट)" : lang === "hi" ? "बेसिक प्लान (10 क्रेडिट)" : "Basic Plan (10 Credits)") 
    : invoice.package_id === "pkg_silver" 
    ? (lang === "mr" ? "सिल्व्हर प्लॅन (३० क्रेडिट)" : lang === "hi" ? "सिल्वर प्लान (30 क्रेडिट)" : "Silver Plan (30 Credits)") 
    : invoice.package_id === "pkg_gold" 
    ? (lang === "mr" ? "गोल्ड प्लॅन (१०० क्रेडिट)" : lang === "hi" ? "गोल्ड प्लान (100 क्रेडिट)" : "Gold Plan (100 Credits)") 
    : (lang === "mr" ? "वॉलेट रिचार्ज" : lang === "hi" ? "वॉलेट रिचार्ज" : "Wallet Recharge");

  return (
    <div className="bg-white p-8 max-w-3xl mx-auto border border-slate-200 rounded-3xl" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Title */}
      <div className="flex justify-between items-start border-b pb-6 mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-1.5">
            Agri<span className="text-[#8bc34a]">record</span><span className="text-xs align-super ml-0.5 text-emerald-800 font-bold">Pro</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Farmer Identity Systems / शेतकरी ओळखपत्र प्रणाली</p>
        </div>
        <div className="text-right">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">{translations[lang].invoiceHeader}</h2>
          <p className="text-xs font-bold text-emerald-800 mt-1">{translations[lang].paidSuccess}</p>
        </div>
      </div>

      {/* Invoice details */}
      <div className="grid grid-cols-2 gap-6 text-xs mb-8">
        <div>
          <h4 className="font-extrabold uppercase tracking-widest text-slate-400 text-[10px] mb-2">{translations[lang].billedTo}</h4>
          <p className="font-black text-slate-800 text-sm">{invoice.customer_name || user?.name || "Premium User"}</p>
          <p className="font-bold text-slate-500 mt-1">Mobile: {invoice.customer_phone || user?.mobile || "N/A"}</p>
          <p className="font-bold text-slate-400 text-[10px] mt-0.5">Cust ID: {invoice.customer_id || user?.uid || "N/A"}</p>
        </div>
        <div className="text-right">
          <h4 className="font-extrabold uppercase tracking-widest text-slate-400 text-[10px] mb-2">{translations[lang].platformOwner}</h4>
          <p className="font-black text-slate-800 text-sm">Aditya Jagtap (AgriRecordPro)</p>
          <p className="font-bold text-slate-500 mt-1">Registered Office: Latur, Maharashtra</p>
          <p className="font-bold text-slate-500">Support WhatsApp: +91 87889 00807</p>
        </div>
      </div>

      {/* Payment details */}
      <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-3 text-xs gap-4 mb-8">
        <div>
          <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">{lang === "mr" ? "दिनांक आणि वेळ" : lang === "hi" ? "दिनांक और समय" : "Date & Time"}</span>
          <span className="font-bold text-slate-800">{formattedDate}</span>
        </div>
        <div>
          <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">{lang === "mr" ? "ऑर्डर आयडी" : lang === "hi" ? "ऑर्डर आईडी" : "Order ID"}</span>
          <span className="font-mono text-slate-800 text-[10px]">{invoice.order_id || invoice.orderId}</span>
        </div>
        <div className="text-right">
          <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">{lang === "mr" ? "पेमेंट रेफरन्स" : lang === "hi" ? "पेमेंट रेफरेंस" : "Payment Reference"}</span>
          <span className="font-mono text-slate-800 text-[10px]">{invoice.payment_id || invoice.paymentId || "Online Gateway"}</span>
        </div>
      </div>

      {/* Transaction Details Table */}
      <table className="min-w-full divide-y divide-slate-200 text-xs mb-8">
        <thead>
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
            <th className="pb-3 text-left">{lang === "mr" ? "तपशील" : lang === "hi" ? "विवरण" : "Description"}</th>
            <th className="pb-3 text-right">{lang === "mr" ? "प्रमाण" : lang === "hi" ? "मात्रा" : "Quantity"}</th>
            <th className="pb-3 text-right">{lang === "mr" ? "दर" : lang === "hi" ? "दर" : "Unit Price"}</th>
            <th className="pb-3 text-right">{lang === "mr" ? "एकूण रक्कम" : lang === "hi" ? "कुल राशि" : "Total Amount"}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
          <tr>
            <td className="py-4 text-left">
              <p className="font-black text-slate-800">{planName}</p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Wallet Recharge Credits (₹15/credit)</p>
            </td>
            <td className="py-4 text-right">1</td>
            <td className="py-4 text-right">₹{amount}</td>
            <td className="py-4 text-right text-slate-900 font-black">₹{amount}</td>
          </tr>
        </tbody>
      </table>

      {/* Total Section */}
      <div className="border-t pt-4 flex justify-between items-center mb-8">
        <div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{lang === "mr" ? "पेमेंट मोड" : lang === "hi" ? "भुगतान का प्रकार" : "Payment Mode"}</p>
          <p className="text-xs font-extrabold text-slate-800 mt-1">Online Payment (UPI/Cards/Net Banking)</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-black uppercase text-slate-400 mr-4">{lang === "mr" ? "एकूण रक्कम:" : lang === "hi" ? "कुल देय राशि:" : "Grand Total:"}</span>
          <span className="text-xl font-black text-emerald-800">₹{amount}.00</span>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="border-t pt-6 text-center text-[10px] font-semibold text-slate-400 leading-relaxed">
        <p>This is a computer generated invoice and does not require a physical signature.</p>
        <p className="mt-1">For any queries regarding this transaction, contact support@agrirecord.pro or WhatsApp +91 87889 00807</p>
        <p className="font-bold text-emerald-700 mt-4 uppercase tracking-widest">Thank you / धन्यवाद / आभारी आहोत!</p>
      </div>
    </div>
  );
};

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-3xl no-print select-none">
      <div className="text-xs font-bold text-slate-500">
        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
        >
          Prev
        </button>
        <div className="flex items-center gap-1.5">
          {[...Array(totalPages)].map((_, i) => {
            const pageNum = i + 1;
            if (totalPages > 5 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
              if (pageNum === 2 || pageNum === totalPages - 1) {
                return <span key={pageNum} className="text-slate-400 text-xs font-bold px-1">...</span>;
              }
              return null;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer ${
                  currentPage === pageNum
                    ? "bg-[#064e3b] text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
};
