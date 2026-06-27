import React from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FileText, ShieldAlert, CreditCard, RotateCcw, Truck, 
  ArrowLeft, ChevronRight, HelpCircle, Mail 
} from "lucide-react";

const POLICIES = {
  "about-us": {
    id: "about-us",
    title: "About Us",
    titleHindi: "हमारे बारे में",
    icon: HelpCircle,
    path: "/about-us",
  },
  "contact-us": {
    id: "contact-us",
    title: "Contact Us",
    titleHindi: "संपर्क करें",
    icon: Mail,
    path: "/contact-us",
  },
  terms: {
    id: "terms",
    title: "Terms & Conditions",
    titleHindi: "नियम और शर्तें",
    icon: FileText,
    path: "/terms",
  },
  "privacy-policy": {
    id: "privacy-policy",
    title: "Privacy Policy",
    titleHindi: "गोपनीयता नीति",
    icon: ShieldAlert,
    path: "/privacy-policy",
  },
  "refund-policy": {
    id: "refund-policy",
    title: "Refund & Cancellation Policy",
    titleHindi: "वापसी और रद्दीकरण नीति",
    icon: CreditCard,
    path: "/refund-policy",
  },
  "return-policy": {
    id: "return-policy",
    title: "Return Policy",
    titleHindi: "वापसी नीति",
    icon: RotateCcw,
    path: "/return-policy",
  },
  "shipping-policy": {
    id: "shipping-policy",
    title: "Shipping Policy",
    titleHindi: "शिपिंग नीति",
    icon: Truck,
    path: "/shipping-policy",
  },
};

const POLICY_LIST = Object.values(POLICIES);

function AboutContent() {
  return (
    <div className="space-y-5 text-slate-600 text-sm leading-relaxed font-medium">
      <p>
        <strong>AgriRecordPro</strong> is a digital formatting utility portal owned and operated by{" "}
        <strong>SURAJ SUTAR</strong>. Our primary objective is to assist Indian farmers in formatting, 
        organizing, and digitizing their land records and identity cards into clean, printable pocket formats.
      </p>
      <p>
        We understand the difficulties farmers face in carrying bulky, vulnerable paper land documents 
        and official details. Our portal provides a simplified tool to enter these records and generate 
        high-fidelity, portable identity formats complete with a verification QR code.
      </p>
      <p className="border-l-4 border-emerald-500 pl-4 bg-emerald-50/50 py-3 rounded-r-xl text-emerald-950 italic">
        "हमारा लक्ष्य प्रत्येक भारतीय किसान को उनकी भूमि के रिकॉर्ड और पहचान पत्र को एक आधुनिक, सुरक्षित और ले जाने में आसान डिजिटल प्रारूप में व्यवस्थित करने में सहायता करना है।"
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="p-4 border border-slate-100 rounded-2xl bg-white shadow-xs space-y-2">
          <h4 className="font-extrabold text-[#064e3b] text-sm uppercase tracking-wide">
            Our Vision / हमारा विजन
          </h4>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            To bridge the gap between traditional paperwork and modern digital tools for rural India, 
            ensuring every farmer has secure, ready access to their credentials on their mobile devices.
          </p>
        </div>
        <div className="p-4 border border-slate-100 rounded-2xl bg-white shadow-xs space-y-2">
          <h4 className="font-extrabold text-[#064e3b] text-sm uppercase tracking-wide">
            Compliance / अनुपालन
          </h4>
          <p className="text-xs text-slate-500 font-bold leading-relaxed">
            We are fully committed to data security and RBI guidelines. All processing is transparent, 
            securely encrypted, and compliant with standard payment aggregator verification models.
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactContent() {
  return (
    <div className="space-y-5 text-slate-600 text-sm leading-relaxed font-medium">
      <p>
        If you have any questions, feedback, or need support regarding card generation, credit recharges, 
        or other services, please contact us. We are dedicated to responding to all queries within 24–48 hours.
      </p>

      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 space-y-4">
        <h4 className="font-extrabold text-[#064e3b] text-base border-b pb-2 border-emerald-100 uppercase tracking-wider">
          Merchant Contact Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[9px] mb-0.5">Legal Entity Name / व्यापारी का नाम</span>
            <span className="text-slate-800 text-sm">SURAJ SUTAR</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[9px] mb-0.5">Brand Name / ब्रांड नाम</span>
            <span className="text-slate-800 text-sm">AgriRecordPro</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-slate-400 block uppercase tracking-wider text-[9px] mb-0.5">Registered Office Address / कार्यालय का पता</span>
            <span className="text-slate-800 leading-normal">
              House of Chandrakant Sutar, Infront of ZP School, Kawali, Taluka-Ausa, District-Latur, Maharashtra - 413520
            </span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[9px] mb-0.5">Customer Support Phone / फ़ोन नंबर</span>
            <a href="tel:+919834212549" className="text-emerald-700 hover:underline text-sm">+91 9834212549</a>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[9px] mb-0.5">Support Email / ईमेल पता</span>
            <a href="mailto:surajsutar8154@gmail.com" className="text-emerald-700 hover:underline text-sm">surajsutar8154@gmail.com</a>
          </div>
          <div>
            <span className="text-slate-400 block uppercase tracking-wider text-[9px] mb-0.5">Support Timings / सहायता का समय</span>
            <span className="text-slate-800">Monday - Friday (9:00 AM - 6:00 PM IST)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <div className="space-y-5 text-slate-600 text-sm leading-relaxed font-medium">
      <p>
        This document is an electronic record in terms of Information Technology Act, 2000 and rules
        there under as applicable and the amended provisions pertaining to electronic records in
        various statutes as amended by the Information Technology Act, 2000. This electronic record
        is generated by a computer system and does not require any physical or digital signatures.
      </p>
      <p>
        This document is published in accordance with the provisions of Rule 3 (1) of the
        Information Technology (Intermediaries guidelines) Rules, 2011 that require publishing the
        rules and regulations, privacy policy and Terms of Use for access or usage of domain name{" "}
        <a
          href="https://agrirecord.onrender.com/"
          className="text-emerald-700 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://agrirecord.onrender.com/
        </a>{" "}
        ('Website'), including the related mobile site and mobile application (hereinafter referred
        to as 'Platform').
      </p>
      <p>
        The Platform is owned by <strong>SURAJ SUTAR</strong>, with its registered office address at 
        House of Chandrakant Sutar, Infront of ZP School, Kawali, Taluka-Ausa, District-Latur, 
        Maharashtra - 413520 (hereinafter referred to as 'Platform Owner', 'we', 'us', 'our').
      </p>
      <p>
        Your use of the Platform and services and tools are governed by the following terms and
        conditions ("Terms of Use") as applicable to the Platform including the applicable policies
        which are incorporated herein by way of reference. If You transact on the Platform, You shall
        be subject to the policies that are applicable to the Platform for such transaction. By mere
        use of the Platform, You shall be contracting with the Platform Owner and these terms and
        conditions including the policies constitute Your binding obligations, with Platform Owner.
        These Terms of Use relate to your use of our website, goods (as applicable) or services (as
        applicable) (collectively, 'Services'). Any terms and conditions proposed by You which are
        in addition to or which conflict with these Terms of Use are expressly rejected by the
        Platform Owner and shall be of no force or effect. These Terms of Use can be modified at any
        time without assigning any reason. It is your responsibility to periodically review these
        Terms of Use to stay informed of updates.
      </p>
      <p className="font-bold text-slate-700">
        For the purpose of these Terms of Use, wherever the context so requires 'you', 'your' or
        'user' shall mean any natural or legal person who has agreed to become a user/buyer on the
        Platform.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 font-bold uppercase tracking-wider">
        ACCESSING, BROWSING OR OTHERWISE USING THE PLATFORM INDICATES YOUR AGREEMENT TO ALL THE
        TERMS AND CONDITIONS UNDER THESE TERMS OF USE, SO PLEASE READ THE TERMS OF USE CAREFULLY
        BEFORE PROCEEDING.
      </div>

      <p className="font-semibold text-slate-700">
        The use of Platform and/or availing of our Services is subject to the following Terms of Use:
      </p>
      <ol className="list-decimal list-outside ml-5 space-y-3 text-slate-500 font-bold text-xs">
        <li>
          To access and use the Services, you agree to provide true, accurate and complete
          information to us during and after registration, and you shall be responsible for all acts
          done through the use of your registered account on the Platform.
        </li>
        <li>
          Neither we nor any third parties provide any warranty or guarantee as to the accuracy,
          timeliness, performance, completeness or suitability of the information and materials
          offered on this website or through the Services, for any specific purpose. You acknowledge
          that such information and materials may contain inaccuracies or errors and we expressly
          exclude liability for any such inaccuracies or errors to the fullest extent permitted by
          law.
        </li>
        <li>
          Your use of our Services and the Platform is solely and entirely at your own risk and
          discretion for which we shall not be liable to you in any manner. You are required to
          independently assess and ensure that the Services meet your requirements.
        </li>
        <li>
          The contents of the Platform and the Services are proprietary to us and are licensed to us.
          You will not have any authority to claim any intellectual property rights, title, or
          interest in its contents. The contents includes and is not limited to the design, layout,
          look and graphics.
        </li>
        <li>
          You acknowledge that unauthorized use of the Platform and/or the Services may lead to
          action against you as per these Terms of Use and/or applicable laws.
        </li>
        <li>You agree to pay us the charges associated with availing the Services.</li>
        <li>
          You agree not to use the Platform and/or Services for any purpose that is unlawful, illegal
          or forbidden by these Terms, or Indian or local laws that might apply to you.
        </li>
        <li>
          You agree and acknowledge that website and the Services may contain links to other third
          party websites. On accessing these links, you will be governed by the terms of use, privacy
          policy and such other policies of such third party websites. These links are provided for
          your convenience for providing further information.
        </li>
        <li>
          You understand that upon initiating a transaction for availing the Services you are
          entering into a legally binding and enforceable contract with the Platform Owner for the
          Services.
        </li>
        <li>
          You shall indemnify and hold harmless Platform Owner, its affiliates, group companies (as
          applicable) and their respective officers, directors, agents, and employees, from any claim
          or demand, or actions including reasonable attorney's fees, made by any third party or
          penalty imposed due to or arising out of Your breach of this Terms of Use, Privacy Policy
          and other Policies, or Your violation of any law, rules or regulations or the rights
          (including infringement of intellectual property rights) of a third party.
        </li>
        <li>
          Notwithstanding anything contained in these Terms of Use, the parties shall not be liable
          for any failure to perform an obligation under these Terms if performance is prevented or
          delayed by a force majeure event.
        </li>
        <li>
          These Terms and any dispute or claim relating to it, or its enforceability, shall be
          governed by and construed in accordance with the laws of India.
        </li>
        <li>
          All disputes arising out of or in connection with these Terms shall be subject to the
          exclusive jurisdiction of the courts in Latur, Maharashtra.
        </li>
        <li>
          All concerns or communications relating to these Terms must be communicated to us using
          the contact information provided on this website.
        </li>
      </ol>
    </div>
  );
}

function PrivacyContent() {
  return (
    <div className="space-y-5 text-slate-600 text-sm leading-relaxed font-medium">
      <h4 className="font-extrabold text-slate-800 text-base">Introduction</h4>
      <p>
        This Privacy Policy describes how <strong>SURAJ SUTAR</strong> (collectively "we, our, us") 
        collect, use, share, protect or otherwise process your information/personal data through our website{" "}
        <a
          href="https://agrirecord.onrender.com/"
          className="text-emerald-700 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          https://agrirecord.onrender.com/
        </a>{" "}
        (hereinafter referred to as Platform). Please note that you may be able to browse certain
        sections of the Platform without registering with us. We do not offer any product/service
        under this Platform outside India and your personal data will primarily be stored and
        processed in India.
      </p>
      <p className="border-l-4 border-emerald-500 pl-4 bg-emerald-50/50 py-3 rounded-r-xl text-emerald-950 italic">
        By visiting this Platform, providing your information or availing any product/service offered
        on the Platform, you expressly agree to be bound by the terms and conditions of this Privacy
        Policy, the Terms of Use and the applicable service/product terms and conditions, and agree
        to be governed by the laws of India including but not limited to the laws applicable to data
        protection and privacy. If you do not agree, please do not use or access our Platform.
      </p>

      <h4 className="font-extrabold text-slate-800 text-sm mt-6">Collection</h4>
      <p>
        We collect your personal data when you use our Platform, services or otherwise interact with
        us during the course of our relationship and related information provided from time to time.
        Some of the information that we may collect includes but is not limited to personal
        data/information provided to us during sign-up/registering or using our Platform such as
        name, date of birth, address, telephone/mobile number, email ID and/or any such information
        shared as proof of identity or address. Some of the sensitive personal data may be collected
        with your consent, such as your bank account or credit or debit card or other payment
        instrument information or biometric information such as your facial features or physiological
        information (in order to enable use of certain features when opted for, available on the
        Platform) etc., all of the above being in accordance with applicable law(s).
      </p>

      <h4 className="font-extrabold text-slate-800 text-sm mt-6">Usage</h4>
      <p>
        We use personal data to provide the services you request. To the extent we use your personal
        data to market to you, we will provide you the ability to opt-out of such uses. We use your
        personal data to assist sellers and business partners in handling and fulfilling orders;
        enhancing customer experience; to resolve disputes; troubleshoot problems; inform you about
        online and offline offers, products, services, and updates; customise your experience; detect
        and protect us against error, fraud and other criminal activity; enforce our terms and
        conditions; conduct marketing research, analysis and surveys; and as otherwise described to
        you at the time of collection of information.
      </p>

      <h4 className="font-extrabold text-slate-800 text-sm mt-6">Sharing</h4>
      <p>
        We may share your personal data internally within our group entities, our other corporate
        entities, and affiliates to provide you access to the services and products offered by them.
        We may disclose personal data to third parties such as sellers, business partners, third 
        party service providers including logistics partners, prepaid payment instrument issuers, and 
        payment gateways selected by you to fulfill orders and process payments.
      </p>

      <h4 className="font-extrabold text-slate-800 text-sm mt-6">Security Precautions</h4>
      <p>
        To protect your personal data from unauthorised access or disclosure, loss or misuse we adopt
        reasonable security practices and procedures. Once your information is in our possession or
        whenever you access your account information, we adhere to our security guidelines to protect
        it against unauthorised access and offer the use of a secure server. However, the
        transmission of information is not completely secure for reasons beyond our control. Users are
        responsible for ensuring the protection of login and password records for their account.
      </p>

      <h4 className="font-extrabold text-slate-800 text-sm mt-6">Data Deletion and Retention</h4>
      <p>
        You have an option to delete your account by visiting your profile and settings on our
        Platform. We retain your personal data information for a period no longer than is required 
        for the purpose for which it was collected or as required under any applicable law.
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4">
        <h4 className="font-extrabold text-slate-800 text-sm">Grievance Officer</h4>
        <p className="text-xs text-slate-500 font-bold mt-1">Name: SURAJ SUTAR</p>
        <p className="text-xs text-slate-500 font-bold">Email: surajsutar8154@gmail.com</p>
        <p className="text-xs text-slate-500 font-bold">Contact Phone: +91 9834212549</p>
        <p className="text-xs text-slate-500 font-bold">Address: House of Chandrakant Sutar, Infront of ZP School, Kawali, Taluka-Ausa, District-Latur, Maharashtra - 413520</p>
      </div>
    </div>
  );
}

function RefundContent() {
  return (
    <div className="space-y-5 text-slate-600 text-sm leading-relaxed font-medium">
      <p>
        This refund and cancellation policy outlines how you can cancel or seek a refund for a
        product/service that you have purchased through the Platform. Under this policy:
      </p>
      <ol className="list-decimal list-outside ml-5 space-y-3 text-slate-500 font-bold text-xs">
        <li>
          Cancellations will only be considered if the request is made within{" "}
          <strong className="text-emerald-700">2 days</strong> of placing the order. However,
          cancellation requests may not be processed if you have already consumed/deducted the wallet 
          credits to generate a farmer identity card.
        </li>
        <li>
          In case of receipt of failed credit recharges (amount deducted from your account but credits 
          not updated in the wallet), please report to our customer support team with the transaction reference. 
          The issue will be resolved, or a refund will be processed back to the original payment source.
        </li>
        <li>
          If you are unsatisfied with the digital service quality or formatting tools, please bring 
          it to the notice of our customer service within <strong className="text-emerald-700">2 days</strong> of receiving the service. 
          The customer service team will look into your concern and make an appropriate decision.
        </li>
      </ol>
      <div className="bg-[#064e3b]/5 border border-[#064e3b]/10 rounded-xl p-4 text-xs text-slate-800 font-bold mt-4">
        <span className="text-[#064e3b] uppercase tracking-wide block mb-1">Refund Processing Time</span>
        Once a refund is approved by AgriRecordPro (SURAJ SUTAR), the refund transaction is initiated. 
        It will take <strong className="text-emerald-800 font-black">5 to 7 working days</strong> for the refund amount to reflect in your original payment method (bank account, card, or UPI wallet) as per standard payment gateway schedules.
      </div>
    </div>
  );
}

function ReturnContent() {
  return (
    <div className="space-y-5 text-slate-600 text-sm leading-relaxed font-medium">
      <p>
        We offer refund/exchange within the first <strong className="text-emerald-700">2 days</strong> from the date of your purchase. If <strong>2 days</strong> have passed since your purchase, you will not be offered a return, exchange, or refund of any kind.
      </p>
      <p>
        Since AgriRecordPro provides digital credit formatting services, physical returns are not 
        applicable. However, if a user experiences billing errors or transaction failures:
      </p>
      <ol className="list-decimal list-outside ml-5 space-y-2 text-slate-500 font-bold text-xs">
        <li>The request should be raised within 2 days of the purchase date.</li>
        <li>The purchased wallet credits should remain unused on the account to be eligible for a refund.</li>
      </ol>
      <p>
        Once a dispute is validated and approved by customer support, standard refund processing 
        times apply, and the corresponding digital credits will be revoked from your account wallet.
      </p>
    </div>
  );
}

function ShippingContent() {
  return (
    <div className="space-y-5 text-slate-600 text-sm leading-relaxed font-medium">
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-900 font-bold mb-4">
        <span className="text-[#064e3b] uppercase tracking-wide block mb-1 font-black">Digital Service Delivery Policy</span>
        AgriRecordPro is a digital identity card formatting SaaS utility. We do not ship physical products. 
        All card services, wallet credit additions, and formatted PDF printouts are delivered digitally online.
      </div>
      
      <p className="font-semibold text-slate-700">Delivery Guidelines:</p>
      <ul className="list-disc list-inside space-y-2 text-xs text-slate-500 font-bold">
        <li>
          <strong>Wallet Credits:</strong> Added instantly to your account dashboard upon successful payment verification.
        </li>
        <li>
          <strong>PDF Generation and Download:</strong> Instant download link is generated immediately on your dashboard after entering the details and submitting the card.
        </li>
        <li>
          <strong>Shipping Charges:</strong> There are ₹0.00 shipping fees or delivery fees since no physical courier shipment is required.
        </li>
        <li>
          <strong>Delivery Tracking:</strong> Transaction history and active balances are visible on the secure "Wallet" section of your dashboard.
        </li>
      </ul>
    </div>
  );
}

const CONTENT_MAP = {
  "about-us": AboutContent,
  "contact-us": ContactContent,
  terms: TermsContent,
  "privacy-policy": PrivacyContent,
  "refund-policy": RefundContent,
  "return-policy": ReturnContent,
  "shipping-policy": ShippingContent,
};

export default function PolicyPage() {
  const { policyType } = useParams();
  const policy = POLICIES[policyType];
  const ContentComponent = CONTENT_MAP[policyType];

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [policyType]);

  if (!policy || !ContentComponent) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-black text-slate-800">Page Not Found</h2>
        <p className="text-sm text-slate-500 font-bold mt-2">
          The requested page does not exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 mt-6 px-5 py-2.5 bg-[#064e3b] hover:bg-[#085a44] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Go Home
        </Link>
      </div>
    );
  }

  const IconComponent = policy.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Navigation */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-700 uppercase tracking-wider transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home / होम पर वापस जाएं
      </Link>

      {/* Policy Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-[#064e3b] via-[#065f46] to-[#047857] px-6 sm:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/15 backdrop-blur-xs p-3 rounded-2xl">
              <IconComponent className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {policy.title}
              </h1>
              <p className="text-emerald-200 text-sm font-bold mt-0.5">{policy.titleHindi}</p>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="border-b border-slate-100 px-6 sm:px-8 py-3 bg-slate-50/50 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {POLICY_LIST.map((p) => {
              const PIcon = p.icon;
              const isActive = p.id === policyType;
              return (
                <Link
                  key={p.id}
                  to={p.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#064e3b] text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <PIcon className="w-3 h-3" />
                  {p.title}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Policy Content */}
        <div className="px-6 sm:px-8 py-8 animate-in fade-in duration-200">
          <ContentComponent />
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 sm:px-8 py-4 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              © {new Date().getFullYear()} AgriRecordPro — All Rights Reserved by SURAJ SUTAR
            </p>
            <div className="flex gap-3">
              {POLICY_LIST.filter((p) => p.id !== policyType)
                .slice(0, 3)
                .map((p) => (
                  <Link
                    key={p.id}
                    to={p.path}
                    className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 uppercase tracking-wider flex items-center gap-1 transition-colors"
                  >
                    {p.title} <ChevronRight className="w-3 h-3" />
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
