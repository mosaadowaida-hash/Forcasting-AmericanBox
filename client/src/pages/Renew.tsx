import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  Loader2,
  CheckCircle2,
  Copy,
  Upload,
  X,
  CreditCard,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

type PaymentMethod = "instapay" | "paypal";

const INSTAPAY_NUMBER = "01099425354";
const SUBSCRIPTION_PRICE = 29;
const PAYPAL_PAYMENT_URL = "https://www.paypal.com/ncp/payment/MZ98H57G7R852";

export default function Renew() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("instapay");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [paypalDone, setPaypalDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const meMutation = trpc.auth.me.useQuery(undefined, { retry: false });
  const submitPaymentMutation = trpc.auth.submitPayment.useMutation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => { window.location.href = "/login"; },
  });

  const userId = meMutation.data?.id;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }
    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!userId) return;
    setError("");

    if (paymentMethod === "instapay" && !proofFile) {
      setError("يرجى رفع صورة إثبات التحويل");
      return;
    }

    try {
      let proofImageBase64: string | undefined;
      let proofImageMimeType: string | undefined;

      if (paymentMethod === "instapay" && proofFile) {
        const arrayBuffer = await proofFile.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < uint8Array.length; i++) {
          binary += String.fromCharCode(uint8Array[i]);
        }
        proofImageBase64 = btoa(binary);
        proofImageMimeType = proofFile.type;
      }

      await submitPaymentMutation.mutateAsync({
        userId,
        paymentMethod,
        proofImageBase64,
        proofImageMimeType,
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إرسال بيانات الدفع");
    }
  }

  function copyNumber() {
    navigator.clipboard.writeText(INSTAPAY_NUMBER);
    toast.success("تم نسخ الرقم");
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-900/30 border border-green-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">تم إرسال طلب التجديد</h1>
          <p className="text-slate-400 mb-6">
            سيتم مراجعة الدفع من قِبل الأدمن وتفعيل حسابك خلال فترة قصيرة.
          </p>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4" dir="rtl">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-6">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-xl">Ads Forecasting Pro</span>
      </Link>

      {/* Expired Banner */}
      <div className="w-full max-w-md mb-6">
        <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-300 font-semibold text-sm">اشتراكك انتهى</p>
            <p className="text-red-400/80 text-xs mt-1">
              لاستمرار الوصول إلى Ads Forecasting Pro، يرجى تجديد اشتراكك الشهري.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-1">تجديد الاشتراك</h1>
        <p className="text-slate-400 text-sm mb-4">اختر طريقة الدفع لتجديد اشتراكك</p>

        {/* Price badge */}
        <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/50 rounded-full px-4 py-1.5 mb-6">
          <span className="text-blue-300 font-bold text-lg">${SUBSCRIPTION_PRICE}</span>
          <span className="text-slate-400 text-sm">/ شهرياً</span>
        </div>

        {error && (
          <Alert className="mb-4 border-red-900/50 bg-red-950/30">
            <AlertDescription className="text-red-400 text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Payment Method Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setPaymentMethod("instapay")}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              paymentMethod === "instapay"
                ? "border-blue-500 bg-blue-950/40"
                : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
            }`}
          >
            <Smartphone className={`w-6 h-6 ${paymentMethod === "instapay" ? "text-blue-400" : "text-slate-400"}`} />
            <span className={`text-sm font-semibold ${paymentMethod === "instapay" ? "text-blue-300" : "text-slate-400"}`}>
              InstaPay
            </span>
          </button>
          <button
            onClick={() => setPaymentMethod("paypal")}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              paymentMethod === "paypal"
                ? "border-blue-500 bg-blue-950/40"
                : "border-slate-700 bg-slate-800/40 hover:border-slate-600"
            }`}
          >
            <CreditCard className={`w-6 h-6 ${paymentMethod === "paypal" ? "text-blue-400" : "text-slate-400"}`} />
            <span className={`text-sm font-semibold ${paymentMethod === "paypal" ? "text-blue-300" : "text-slate-400"}`}>
              PayPal
            </span>
          </button>
        </div>

        {/* InstaPay Flow */}
        {paymentMethod === "instapay" && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
              <p className="text-slate-400 text-xs mb-2">حوّل ${SUBSCRIPTION_PRICE} على رقم InstaPay:</p>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-lg font-bold flex-1" dir="ltr">{INSTAPAY_NUMBER}</span>
                <button
                  onClick={copyNumber}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-300" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-slate-300 text-sm font-medium mb-2">ارفع صورة إثبات التحويل</p>
              {proofPreview ? (
                <div className="relative">
                  <img
                    src={proofPreview}
                    alt="إثبات التحويل"
                    className="w-full h-40 object-cover rounded-xl border border-slate-700"
                  />
                  <button
                    onClick={() => { setProofFile(null); setProofPreview(null); }}
                    className="absolute top-2 left-2 w-7 h-7 bg-red-900/80 hover:bg-red-800 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-slate-700 hover:border-blue-600 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-6 h-6 text-slate-500" />
                  <span className="text-slate-500 text-sm">اضغط لرفع الصورة</span>
                  <span className="text-slate-600 text-xs">JPG, PNG — حتى 5 ميجابايت</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* PayPal Flow */}
        {paymentMethod === "paypal" && (
          <div className="space-y-4">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-sm mb-3">
                ادفع ${SUBSCRIPTION_PRICE} عبر PayPal، ثم ارجع وأكّد الدفع
              </p>
              <a
                href={PAYPAL_PAYMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                ادفع عبر PayPal
              </a>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={paypalDone}
                onChange={e => setPaypalDone(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-blue-500"
              />
              <span className="text-slate-300 text-sm">أكّدت إتمام الدفع عبر PayPal</span>
            </label>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={
            submitPaymentMutation.isPending ||
            (paymentMethod === "paypal" && !paypalDone) ||
            !userId
          }
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-6 gap-2"
        >
          {submitPaymentMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</>
          ) : (
            "إرسال طلب التجديد"
          )}
        </Button>

        <div className="mt-4 text-center">
          <button
            onClick={() => logoutMutation.mutate()}
            className="text-slate-500 hover:text-slate-400 text-sm transition-colors"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}
