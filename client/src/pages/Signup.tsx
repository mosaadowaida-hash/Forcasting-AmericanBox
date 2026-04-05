import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, BarChart3, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("يرجى ملء جميع الحقول");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    if (password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }

    signupMutation.mutate({ name, email, password });
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-2xl">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600/20 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">تم إنشاء الحساب بنجاح!</h2>
              <p className="text-slate-400 mb-6 leading-relaxed">
                تم استلام طلب التسجيل الخاص بك. سيقوم المسؤول بمراجعة حسابك وتفعيله في أقرب وقت ممكن.
              </p>
              <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-6 text-right">
                <p className="text-amber-300 text-sm font-medium">⏳ حسابك قيد المراجعة</p>
                <p className="text-amber-400/70 text-xs mt-1">
                  ستتمكن من تسجيل الدخول بعد موافقة المسؤول
                </p>
              </div>
              <Button
                onClick={() => setLocation("/login")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                العودة لتسجيل الدخول
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Campaign Simulator</h1>
          <p className="text-slate-400 text-sm mt-1">إنشاء حساب جديد</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-xl">إنشاء حساب جديد</CardTitle>
            <CardDescription className="text-slate-400">
              سيتم مراجعة حسابك من قبل المسؤول قبل التفعيل
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="bg-red-900/30 border-red-700 text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">الاسم</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                  autoComplete="email"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="8 أحرف على الأقل"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                  autoComplete="new-password"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">تأكيد كلمة المرور</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="أعد إدخال كلمة المرور"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                  autoComplete="new-password"
                  dir="ltr"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={signupMutation.isPending}
              >
                {signupMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  "إنشاء الحساب"
                )}
              </Button>

              <p className="text-slate-400 text-sm text-center">
                لديك حساب بالفعل؟{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                  تسجيل الدخول
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
