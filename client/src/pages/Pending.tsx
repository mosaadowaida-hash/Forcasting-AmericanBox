import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, LogOut, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

export default function Pending() {
  const [, setLocation] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => setLocation("/login"),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
        </div>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm shadow-2xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-600/20 rounded-full mb-4">
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">حسابك قيد المراجعة</h2>
            <p className="text-slate-400 mb-6 leading-relaxed">
              تم استلام طلب التسجيل الخاص بك. سيقوم المسؤول بمراجعة حسابك وتفعيله في أقرب وقت ممكن.
            </p>
            <div className="bg-amber-900/20 border border-amber-700/50 rounded-lg p-4 mb-6 text-right">
              <p className="text-amber-300 text-sm font-medium">⏳ في انتظار موافقة المسؤول</p>
              <p className="text-amber-400/70 text-xs mt-1">
                ستتمكن من الوصول إلى لوحة التحكم بعد تفعيل حسابك
              </p>
            </div>
            <Button
              onClick={() => logoutMutation.mutate()}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="w-4 h-4 mr-2" />
              تسجيل الخروج
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
