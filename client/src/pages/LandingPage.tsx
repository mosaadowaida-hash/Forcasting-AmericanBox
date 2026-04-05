import { Link } from "wouter";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  DollarSign,
  Activity,
  ShieldCheck,
  Star,
  Users,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Animated counter hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

// ─── Intersection observer hook ──────────────────────────────────────────────
function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ─── Stat card with animated counter ─────────────────────────────────────────
function StatCard({ value, suffix, label, started }: { value: number; suffix: string; label: string; started: boolean }) {
  const count = useCountUp(value, 1800, started);
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-black text-white mb-1">
        {count.toLocaleString()}<span className="text-blue-400">{suffix}</span>
      </div>
      <div className="text-slate-400 text-sm font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  description,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <div className="group relative bg-slate-900/60 border border-slate-800 rounded-2xl p-6 hover:border-slate-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/40">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${accent}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const statsRef = useInView(0.2);
  const featuresRef = useInView(0.1);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden" dir="rtl">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">CampaignSim</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-slate-800">
                تسجيل الدخول
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4">
                ابدأ مجاناً
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-4 sm:px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-indigo-600/8 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-800/60 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-blue-300 text-xs font-semibold tracking-wide uppercase">أداة الـ Performance Marketers الأولى عربياً</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-6 tracking-tight">
            <span className="text-white">اعرف قبل ما تصرف</span>
            <br />
            <span className="bg-gradient-to-l from-blue-400 via-blue-300 to-indigo-400 bg-clip-text text-transparent">
              هل حملتك هتكسب أو تخسر؟
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-slate-300 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            محاكي الحملات يحسب لك <strong className="text-white">144 سيناريو</strong> لكل منتج —
            بناءً على CPM وCTR وCVR وحجم السلة —
            فتعرف بالضبط متى تكون في <span className="text-green-400 font-semibold">ربح</span> ومتى في <span className="text-red-400 font-semibold">خسارة</span>، قبل ما تصرف جنيه واحد.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-base px-8 py-6 rounded-xl shadow-lg shadow-blue-900/40 transition-all hover:shadow-blue-800/60 hover:scale-105 gap-2 w-full sm:w-auto"
              >
                <span>سجّل حسابك الآن</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                size="lg"
                className="border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white bg-transparent font-semibold text-base px-8 py-6 rounded-xl w-full sm:w-auto"
              >
                تسجيل الدخول
              </Button>
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-slate-500 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> لا يوجد بطاقة ائتمان</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> بياناتك معزولة وآمنة</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> نتائج فورية بدون تعقيد</span>
          </div>
        </div>

        {/* Dashboard preview mockup */}
        <div className="relative max-w-5xl mx-auto mt-16">
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
            {/* Fake browser bar */}
            <div className="bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-slate-700/60">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4 bg-slate-700/60 rounded-md h-6 flex items-center px-3">
                <span className="text-slate-400 text-xs" dir="ltr">campsimdash.manus.space/dashboard</span>
              </div>
            </div>
            {/* Mock dashboard content */}
            <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "إجمالي المنتجات", val: "42", color: "text-blue-400" },
                  { label: "سيناريوهات الربح", val: "2,184", color: "text-green-400" },
                  { label: "أعلى ROAS", val: "8.4×", color: "text-yellow-400" },
                  { label: "أفضل هامش ربح", val: "31.5%", color: "text-purple-400" },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                    <div className={`text-xl font-black ${item.color}`}>{item.val}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
              {/* Fake table rows */}
              <div className="bg-slate-800/40 rounded-xl border border-slate-700/40 overflow-hidden">
                <div className="grid grid-cols-5 gap-2 px-4 py-2 border-b border-slate-700/40 text-slate-500 text-xs font-medium">
                  <span>المنتج</span><span>CPM</span><span>CTR</span><span>ROAS</span><span>الحالة</span>
                </div>
                {[
                  ["American Box Premium", "47.5", "1.50%", "5.2×", "ربح"],
                  ["Bundle Pack Pro", "32.5", "1.25%", "3.8×", "ربح"],
                  ["Single Item Basic", "70.0", "1.00%", "1.4×", "خسارة"],
                ].map(([name, cpm, ctr, roas, status]) => (
                  <div key={name} className="grid grid-cols-5 gap-2 px-4 py-2.5 border-b border-slate-700/20 text-sm">
                    <span className="text-slate-300 truncate">{name}</span>
                    <span className="text-slate-400">{cpm}</span>
                    <span className="text-slate-400">{ctr}</span>
                    <span className="text-blue-400 font-semibold">{roas}</span>
                    <span className={`font-semibold text-xs ${status === "ربح" ? "text-green-400" : "text-red-400"}`}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-blue-600/15 blur-2xl rounded-full" />
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef.ref} className="py-20 px-4 sm:px-6 border-y border-slate-800/60 bg-slate-900/30">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard value={144} suffix="+" label="سيناريو لكل منتج" started={statsRef.inView} />
          <StatCard value={6048} suffix="" label="سيناريو جاهز" started={statsRef.inView} />
          <StatCard value={42} suffix="+" label="منتج محلل" started={statsRef.inView} />
          <StatCard value={100} suffix="%" label="دقة الحسابات" started={statsRef.inView} />
        </div>
      </section>

      {/* ── PROBLEM / AGITATION ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
            كم مرة صرفت على حملة<br />
            <span className="text-red-400">وطلعت بالخسارة؟</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-8">
            المشكلة مش في الإعلان — المشكلة إنك بتشغّل الحملة <strong className="text-white">وانت مش عارف الأرقام</strong> اللي بتحكم الربح والخسارة.
            CPM عالي + CTR منخفض = خسارة مضمونة. لكن كام بالضبط؟ ومتى بتبدأ تكسب؟
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-right">
            {[
              { pain: "بتخمّن الـ ROAS", fix: "شوف الـ ROAS الفعلي لكل سيناريو قبل ما تشغّل" },
              { pain: "مش عارف break-even", fix: "احسب نقطة التعادل بالضبط لكل منتج" },
              { pain: "بتقارن بالحدس", fix: "قارن 42 منتج في ثواني بالأرقام الحقيقية" },
            ].map((item) => (
              <div key={item.pain} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-red-400 text-lg mt-0.5">✗</span>
                  <span className="text-slate-400 text-sm">{item.pain}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 text-lg mt-0.5">✓</span>
                  <span className="text-slate-300 text-sm font-medium">{item.fix}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={featuresRef.ref} className="py-20 px-4 sm:px-6 bg-slate-900/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              كل اللي تحتاجه في مكان واحد
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              مش مجرد أرقام — ده نظام تفكير كامل للـ Performance Marketer المحترف
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={Target}
              title="144 سيناريو لكل منتج"
              description="3 مستويات CPM × 4 مستويات CTR × 3 مستويات CVR × 4 أحجام سلة = 144 سيناريو محسوب تلقائياً."
              accent="bg-blue-950 text-blue-400"
            />
            <FeatureCard
              icon={TrendingUp}
              title="ROAS & Break-Even فوري"
              description="شوف الـ ROAS الفعلي ونقطة التعادل لكل سيناريو — وقرر بثقة قبل ما تصرف."
              accent="bg-green-950 text-green-400"
            />
            <FeatureCard
              icon={BarChart3}
              title="مقارنة شاملة للمنتجات"
              description="رتّب كل منتجاتك حسب الربحية، وشوف مين الأقوى أداءً في لحظة."
              accent="bg-purple-950 text-purple-400"
            />
            <FeatureCard
              icon={Activity}
              title="تصفية متقدمة"
              description="فلتر السيناريوهات حسب CPM أو CTR أو CVR أو الحالة (ربح/خسارة) أو هامش الربح."
              accent="bg-orange-950 text-orange-400"
            />
            <FeatureCard
              icon={DollarSign}
              title="إدارة المنتجات"
              description="أضف منتجاتك وعدّل أسعارها والخصومات — والسيناريوهات بتتحسب تلقائياً."
              accent="bg-yellow-950 text-yellow-400"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="بياناتك معزولة تماماً"
              description="كل مستخدم يشوف بياناته بس — نظام multi-tenant كامل يحمي خصوصيتك."
              accent="bg-slate-800 text-slate-300"
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              3 خطوات وانت جاهز
            </h2>
          </div>
          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "سجّل حسابك",
                desc: "أنشئ حسابك في أقل من دقيقة. بعد مراجعة الأدمن هتوصلك موافقة التفعيل.",
                icon: Users,
              },
              {
                step: "02",
                title: "أضف منتجاتك",
                desc: "ادخل اسم المنتج وسعره وخصوماته — والنظام يحسب 144 سيناريو تلقائياً.",
                icon: LayoutDashboard,
              },
              {
                step: "03",
                title: "قرّر بثقة",
                desc: "شوف الـ ROAS وهامش الربح ونقطة التعادل لكل سيناريو — وشغّل حملتك بأمان.",
                icon: TrendingUp,
              },
            ].map((item, i) => (
              <div key={item.step} className="flex gap-5 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-950 border border-blue-800/60 rounded-xl flex items-center justify-center">
                  <span className="text-blue-400 font-black text-sm">{item.step}</span>
                </div>
                <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-blue-400" />
                    <h3 className="text-white font-bold">{item.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden sm:flex flex-col items-center justify-center w-6 pt-6">
                    <ChevronRight className="w-4 h-4 text-slate-700 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL / SOCIAL PROOF ── */}
      <section className="py-16 px-4 sm:px-6 bg-slate-900/30 border-y border-slate-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="flex justify-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
            </div>
            <blockquote className="text-xl sm:text-2xl font-bold text-white max-w-2xl mx-auto leading-relaxed">
              "أول مرة في حياتي أشغّل حملة وأنا عارف بالضبط هشتغل على أنهي سيناريو — وفّرت على نفسي آلاف الجنيهات."
            </blockquote>
            <p className="text-slate-500 mt-4 text-sm">— American Box · عميل موثّق</p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/8 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            جاهز تشتغل بالأرقام<br />
            <span className="text-blue-400">مش بالخمسة؟</span>
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            سجّل حسابك دلوقتي وابدأ تحلّل منتجاتك في دقائق.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-base px-10 py-6 rounded-xl shadow-lg shadow-blue-900/40 hover:shadow-blue-800/60 hover:scale-105 transition-all gap-2 w-full sm:w-auto"
              >
                <span>سجّل حسابك مجاناً</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="ghost"
                size="lg"
                className="text-slate-400 hover:text-white font-semibold text-base px-8 py-6 w-full sm:w-auto"
              >
                عندي حساب بالفعل ←
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/60 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-400 font-semibold text-sm">CampaignSim</span>
          </div>
          <p className="text-slate-600 text-xs">
            محاكي الحملات والإيرادات — كل الحقوق محفوظة {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-4 text-slate-500 text-xs">
            <Link href="/login" className="hover:text-slate-300 transition-colors">تسجيل الدخول</Link>
            <Link href="/signup" className="hover:text-slate-300 transition-colors">إنشاء حساب</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
