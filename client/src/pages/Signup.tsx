import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Copy,
  Upload,
  X,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

type Step = "account" | "payment" | "done";
type PaymentMethod = "instapay" | "paypal";

const INSTAPAY_NUMBER = "01099425354";
const SUBSCRIPTION_PRICE = 29;
const PAYPAL_PAYMENT_URL = "https://www.paypal.com/ncp/payment/MZ98H57G7R852";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("account");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("instapay");
  const [createdUserId, setCreatedUserId] = useState<number | null>(null);

  // Step 1: Account fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // Step 2: Payment proof
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [paypalDone, setPaypalDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const signupMutation = trpc.auth.signup.useMutation();
  const submitPaymentMutation = trpc.auth.submitPayment.useMutation();

  const stepIndex = (s: Step) => ["account", "payment", "done"].indexOf(s);

  // ── Step 1: Create Account ─────────────────────────────────────────────────
  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("كلمة المرور غير متطابقة");
      return;
    }

    try {
      const result = await signupMutation.mutateAsync({ name, email, password });
      setCreatedUserId(result.userId);
      setStep("payment");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("already registered")) {
        setError("هذا البريد الإلكتروني مسجل بالفعل");
      } else {
        setError(msg || "حدث خطأ، يرجى المحاولة مرة أخرى");
      }
    }
  }

  // ── Handle proof image selection ──────────────────────────────────────────
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

  // ── Step 2: Submit Payment ─────────────────────────────────────────────────
  async function handleSubmitPayment() {
    if (!createdUserId) return;
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
        userId: createdUserId,
        paymentMethod,
        proofImageBase64,
        proofImageMimeType,
      });

      setStep("done");
    } catch (err: any) {
      setError(err?.message || "حدث خطأ أثناء إرسال بيانات الدفع");
    }
  }

  function copyNumber() {
    navigator.clipboard.writeText(INSTAPAY_NUMBER);
    toast.success("تم نسخ الرقم");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4" dir="rtl">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-xl">Ads Forecasting Pro</span>
      </Link>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(["account", "payment", "done"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step === s
                ? "bg-blue-600 text-white"
                : stepIndex(step) > i
                  ? "bg-green-600 text-white"
                  : "bg-slate-800 text-slate-500"
            }`}>
              {stepIndex(step) > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            {i < 2 && (
              <div className={`w-8 h-0.5 ${stepIndex(step) > i ? "bg-green-600" : "bg-slate-700"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md">
        {/* ── STEP 1: Account Info ── */}
        {step === "account" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-white mb-1">إنشاء حساب جديد</h1>
            <p className="text-slate-400 text-sm mb-6">الخطوة 1 من 2 — بيانات الحساب</p>

            {error && (
              <Alert className="mb-4 border-red-900/50 bg-red-950/30">
                <AlertDescription className="text-red-400 text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">الاسم الكامل</Label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="اسمك الكامل"
                  required
                  minLength={2}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">البريد الإلكتروني</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  dir="ltr"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    required
                    minLength={8}
                    dir="ltr"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-slate-300 text-sm mb-1.5 block">تأكيد كلمة المرور</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="أعد كتابة كلمة المرور"
                  required
                  dir="ltr"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-2 gap-2"
              >
                {signupMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</>
                ) : (
                  <><span>التالي: اختيار طريقة الدفع</span><ArrowLeft className="w-4 h-4" /></>
                )}
              </Button>
            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
              عندك حساب بالفعل؟{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                سجّل الدخول
              </Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: Payment ── */}
        {step === "payment" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-white mb-1">اختر طريقة الدفع</h1>
            <p className="text-slate-400 text-sm mb-2">الخطوة 2 من 2 — الاشتراك الشهري</p>

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

            {/* Payment method tabs */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={() => setPaymentMethod("instapay")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "instapay"
                    ? "border-blue-500 bg-blue-950/40 text-white"
                    : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                }`}
              >
                <Smartphone className="w-6 h-6" />
                <span className="text-sm font-semibold">InstaPay / محفظة</span>
              </button>
              <button
                onClick={() => setPaymentMethod("paypal")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "paypal"
                    ? "border-blue-500 bg-blue-950/40 text-white"
                    : "border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-600"
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-sm font-semibold">PayPal</span>
              </button>
            </div>

            {/* InstaPay section */}
            {paymentMethod === "instapay" && (
              <div className="space-y-4">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <p className="text-slate-300 text-sm mb-3 font-medium">
                    حوّل ${SUBSCRIPTION_PRICE} على الرقم التالي:
                  </p>
                  <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-3 border border-slate-700">
                    <span className="text-white font-bold text-xl tracking-wider flex-1" dir="ltr">
                      {INSTAPAY_NUMBER}
                    </span>
                    <button onClick={copyNumber} className="text-blue-400 hover:text-blue-300 transition-colors">
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">InstaPay أو محفظة فودافون / اتصالات / أورنج</p>
                </div>

                {/* Proof upload */}
                <div>
                  <p className="text-slate-300 text-sm font-medium mb-2">ارفع صورة إثبات التحويل:</p>
                  {proofPreview ? (
                    <div className="relative">
                      <img
                        src={proofPreview}
                        alt="Proof"
                        className="w-full h-40 object-cover rounded-xl border border-slate-700"
                      />
                      <button
                        onClick={() => { setProofFile(null); setProofPreview(null); }}
                        className="absolute top-2 left-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-all"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-sm">اضغط لرفع الصورة</span>
                      <span className="text-xs text-slate-500">JPG, PNG — حتى 5MB</span>
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

            {/* PayPal section */}
            {paymentMethod === "paypal" && (
              <div className="space-y-4">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <p className="text-slate-300 text-sm mb-4 font-medium">
                    ادفع ${SUBSCRIPTION_PRICE} عبر PayPal:
                  </p>
                  <div className="flex justify-center">
                    <a
                      href={PAYPAL_PAYMENT_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setPaypalDone(true)}
                      className="inline-flex items-center gap-2 bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold px-8 py-3 rounded-xl transition-all"
                    >
                      <CreditCard className="w-5 h-5" />
                      <span>ادفع عبر PayPal</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-slate-500 text-xs text-center mt-3">
                    ستُفتح صفحة PayPal في نافذة جديدة
                  </p>
                </div>

                {/* Confirmation after PayPal */}
                <div
                  onClick={() => setPaypalDone(!paypalDone)}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    paypalDone
                      ? "border-green-600 bg-green-950/30"
                      : "border-slate-700 bg-slate-800/40"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    paypalDone ? "border-green-500 bg-green-600" : "border-slate-600"
                  }`}>
                    {paypalDone && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-slate-300 text-sm">أكّدت إتمام عملية الدفع عبر PayPal</span>
                </div>
              </div>
            )}

            {/* Submit button */}
            <Button
              onClick={handleSubmitPayment}
              disabled={
                submitPaymentMutation.isPending ||
                (paymentMethod === "instapay" && !proofFile) ||
                (paymentMethod === "paypal" && !paypalDone)
              }
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl mt-6 gap-2"
            >
              {submitPaymentMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /><span>تأكيد وإرسال للمراجعة</span></>
              )}
            </Button>

            <p className="text-slate-500 text-xs text-center mt-3">
              سيتم مراجعة حسابك وتفعيله خلال 24 ساعة
            </p>
          </div>
        )}

        {/* ── STEP 3: Done ── */}
        {step === "done" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-950 border border-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">تم الإرسال بنجاح!</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              تم استلام طلبك وبيانات الدفع. حسابك الآن{" "}
              <span className="text-yellow-400 font-semibold">قيد المراجعة</span>{" "}
              وسيتم تفعيله بعد التأكد من الدفع.
            </p>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 mb-6 text-right">
              <p className="text-slate-300 text-sm font-medium mb-1">📧 البريد المسجل:</p>
              <p className="text-white text-sm" dir="ltr">{email}</p>
            </div>

            <Link href="/login">
              <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl">
                الذهاب لصفحة تسجيل الدخول
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
