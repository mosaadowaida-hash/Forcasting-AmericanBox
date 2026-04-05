import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Package,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Trash2,
  Edit,
  Shield,
  Clock,
  AlertCircle,
  BarChart3,
  LogOut,
  Eye,
  CreditCard,
  Smartphone,
  UserCheck,
  DollarSign,
  History,
  ZoomIn,
  AlertTriangle,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type UserStatus = "pending" | "active" | "suspended";
type PaymentStatus = "pending" | "verified" | "rejected";

function StatusBadge({ status }: { status: UserStatus }) {
  const config = {
    pending: { label: "قيد المراجعة", className: "bg-amber-900/30 text-amber-300 border-amber-700" },
    active: { label: "مفعّل", className: "bg-green-900/30 text-green-300 border-green-700" },
    suspended: { label: "موقوف", className: "bg-red-900/30 text-red-300 border-red-700" },
  };
  const { label, className } = config[status] || config.pending;
  return <Badge variant="outline" className={className}>{label}</Badge>;
}

function PaymentBadge({ status, method }: { status: PaymentStatus | null | undefined; method: string | null | undefined }) {
  if (!method) return <span className="text-slate-600 text-xs">—</span>;
  const methodLabel = method === "instapay" ? "InstaPay" : "PayPal";
  const statusConfig = {
    pending: { label: "بانتظار التحقق", className: "bg-amber-900/30 text-amber-300 border-amber-700" },
    verified: { label: "تم التحقق", className: "bg-green-900/30 text-green-300 border-green-700" },
    rejected: { label: "مرفوض", className: "bg-red-900/30 text-red-300 border-red-700" },
  };
  const cfg = statusConfig[status as PaymentStatus] || statusConfig.pending;
  return (
    <div className="flex flex-col gap-1">
      <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
      <span className="text-slate-500 text-xs">{methodLabel}</span>
    </div>
  );
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Edit user dialog state
  const [editUser, setEditUser] = useState<{ id: number; name: string; email: string } | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  // Delete confirmation
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

  // Payment proof viewer
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);

  // Payment history modal
  const [paymentHistoryUser, setPaymentHistoryUser] = useState<{ id: number; name: string | null; email: string | null } | null>(null);
  const [selectedUserIdForPayments, setSelectedUserIdForPayments] = useState<number | null>(null);

  // Impersonation confirmation
  const [impersonateUser, setImpersonateUser] = useState<{ id: number; name: string | null; email: string | null } | null>(null);

  // Queries
  const { data: stats } = trpc.admin.getStats.useQuery();
  const { data: users = [], refetch: refetchUsers } = trpc.admin.listUsers.useQuery();
  const { data: allProducts = [], refetch: refetchProducts } = trpc.admin.listAllProducts.useQuery();
  const { data: allPaymentsData = [] } = trpc.admin.listAllPayments.useQuery();
  const { data: userPaymentsData = [] } = trpc.admin.getUserPayments.useQuery(
    { userId: selectedUserIdForPayments! },
    { enabled: selectedUserIdForPayments !== null }
  );

  // Mutations
  const approveMutation = trpc.admin.approveUser.useMutation({
    onSuccess: () => { toast.success("تم تفعيل الحساب وتأكيد الدفع"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const rejectPaymentMutation = trpc.admin.rejectPayment.useMutation({
    onSuccess: () => { toast.success("تم رفض الدفع"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const rejectMutation = trpc.admin.rejectUser.useMutation({
    onSuccess: () => { toast.success("تم رفض الطلب وحذف الحساب"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const suspendMutation = trpc.admin.suspendUser.useMutation({
    onSuccess: () => { toast.success("تم إيقاف الحساب"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const reactivateMutation = trpc.admin.reactivateUser.useMutation({
    onSuccess: () => { toast.success("تم إعادة تفعيل الحساب"); refetchUsers(); },
    onError: (e) => toast.error(e.message),
  });
  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث بيانات المستخدم");
      setEditUser(null);
      refetchUsers();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الحساب وجميع بياناته");
      setDeleteUserId(null);
      refetchUsers();
      refetchProducts();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteProductMutation = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المنتج");
      setDeleteProductId(null);
      refetchProducts();
    },
    onError: (e) => toast.error(e.message),
  });
  const impersonateMutation = trpc.admin.impersonateUser.useMutation({
    onSuccess: (data) => {
      toast.success(`جاري الدخول كـ ${data.userName || data.userEmail}...`);
      setImpersonateUser(null);
      // Reload the page to apply the new session cookie
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 800);
    },
    onError: (e) => toast.error(e.message),
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => setLocation("/login"),
  });

  const verifyPaymentMutation = trpc.admin.verifyPayment.useMutation({
    onSuccess: () => {
      toast.success("تم قبول الدفعة وتفعيل الاشتراك لمدة 30 يوم");
      refetchUsers();
      if (selectedUserIdForPayments) utils.admin.getUserPayments.invalidate({ userId: selectedUserIdForPayments });
      utils.admin.listAllPayments.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const rejectSinglePaymentMutation = trpc.admin.rejectPayment.useMutation({
    onSuccess: () => {
      toast.success("تم رفض الدفعة");
      if (selectedUserIdForPayments) utils.admin.getUserPayments.invalidate({ userId: selectedUserIdForPayments });
      utils.admin.listAllPayments.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const openPaymentHistory = (user: { id: number; name: string | null; email: string | null }) => {
    setPaymentHistoryUser(user);
    setSelectedUserIdForPayments(user.id);
  };

  const openEditUser = (user: { id: number; name: string | null; email: string | null }) => {
    setEditUser({ id: user.id, name: user.name || "", email: user.email || "" });
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditPassword("");
  };

  const handleUpdateUser = () => {
    if (!editUser) return;
    updateUserMutation.mutate({
      userId: editUser.id,
      name: editName || undefined,
      email: editEmail || undefined,
      password: editPassword || undefined,
    });
  };

  const pendingUsers = users.filter(u => u.status === "pending");
  const pendingPayments = users.filter(u => u.paymentStatus === "pending" && u.paymentMethod != null);
  const expiringSoonUsers = users.filter(u => (u as any).isExpiringSoon);

  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">لوحة تحكم المسؤول</h1>
              <p className="text-xs text-slate-400">Ads Forecasting Pro — Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/dashboard")}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <BarChart3 className="w-4 h-4 ml-1" />
              المحاكي
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 ml-1" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                    <p className="text-xs text-slate-400">إجمالي المستخدمين</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-600/20 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.pendingUsers}</p>
                    <p className="text-xs text-slate-400">قيد المراجعة</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
                    <p className="text-xs text-slate-400">مفعّلون</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.pendingPayments ?? 0}</p>
                    <p className="text-xs text-slate-400">دفعات بانتظار التحقق</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
                    <p className="text-xs text-slate-400">إجمالي المنتجات</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alerts */}
        {pendingPayments.length > 0 && (
          <Card className="bg-yellow-900/10 border-yellow-700/50 mb-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                <p className="text-yellow-300 text-sm">
                  يوجد <span className="font-bold">{pendingPayments.length}</span> دفعة جديدة في انتظار التحقق
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {pendingUsers.length > 0 && (
          <Card className="bg-amber-900/10 border-amber-700/50 mb-4">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <p className="text-amber-300 text-sm">
                  يوجد <span className="font-bold">{pendingUsers.length}</span> طلب تسجيل جديد في انتظار المراجعة
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {expiringSoonUsers.length > 0 && (
          <Card className="bg-orange-900/10 border-orange-700/50 mb-6">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <p className="text-orange-300 text-sm">
                  <span className="font-bold">{expiringSoonUsers.length}</span> مستخدم اشتراكه ينتهي خلال يومين أو أقل
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="users">
          <TabsList className="bg-slate-900 border border-slate-800 mb-6">
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
              <Users className="w-4 h-4 ml-1" />
              إدارة المستخدمين ({users.length})
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
              <CreditCard className="w-4 h-4 ml-1" />
              سجل المدفوعات ({allPaymentsData.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
              <Package className="w-4 h-4 ml-1" />
              إدارة المنتجات ({allProducts.length})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">جميع المستخدمين</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400 text-right">الاسم</TableHead>
                        <TableHead className="text-slate-400 text-right">البريد الإلكتروني</TableHead>
                        <TableHead className="text-slate-400 text-right">الدور</TableHead>
                        <TableHead className="text-slate-400 text-right">حالة الحساب</TableHead>
                        <TableHead className="text-slate-400 text-right">الاشتراك</TableHead>
                        <TableHead className="text-slate-400 text-right">حالة الدفع</TableHead>
                        <TableHead className="text-slate-400 text-right">إثبات الدفع</TableHead>
                        <TableHead className="text-slate-400 text-right">تاريخ التسجيل</TableHead>
                        <TableHead className="text-slate-400 text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="text-white font-medium">
                            <div className="flex items-center gap-2">
                              {user.role === "admin" && (
                                <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              )}
                              {user.name || "—"}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm" dir="ltr">{user.email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={user.role === "admin" ? "border-blue-700 text-blue-300 bg-blue-900/20" : "border-slate-700 text-slate-400"}>
                              {user.role === "admin" ? "مسؤول" : "مستخدم"}
                            </Badge>
                          </TableCell>
                          <TableCell><StatusBadge status={user.status as UserStatus} /></TableCell>
                          {/* Subscription column */}
                          <TableCell>
                            {(user as any).subscriptionExpiresAt ? (
                              <div className="text-xs">
                                <p className={(user as any).isExpiringSoon ? "text-orange-400 font-semibold" : "text-slate-300"}>
                                  {(user as any).daysRemaining !== null && (user as any).daysRemaining > 0
                                    ? `${(user as any).daysRemaining} يوم`
                                    : "منتهي"}
                                </p>
                                <p className="text-slate-500">{new Date((user as any).subscriptionExpiresAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric" })}</p>
                              </div>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <PaymentBadge
                              status={user.paymentStatus as PaymentStatus | null}
                              method={user.paymentMethod}
                            />
                          </TableCell>
                          <TableCell>
                            {user.paymentProofImage ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 text-xs gap-1"
                                onClick={() => setProofImageUrl(user.paymentProofImage!)}
                              >
                                <Eye className="w-3 h-3" />
                                عرض
                              </Button>
                            ) : user.paymentMethod === "paypal" ? (
                              <span className="text-slate-500 text-xs flex items-center gap-1">
                                <CreditCard className="w-3 h-3" />
                                PayPal
                              </span>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-400 text-xs">{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              {/* Approve: for pending users with payment submitted */}
                              {user.status === "pending" && user.paymentMethod && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                  onClick={() => approveMutation.mutate({ userId: user.id })}
                                  title="تفعيل الحساب وتأكيد الدفع"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {/* Reject payment */}
                              {user.status === "pending" && user.paymentStatus === "pending" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-orange-400 hover:text-orange-300 hover:bg-orange-900/20"
                                  onClick={() => rejectPaymentMutation.mutate({ userId: user.id })}
                                  title="رفض الدفع"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </Button>
                              )}
                              {/* Reject user (delete) */}
                              {user.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  onClick={() => rejectMutation.mutate({ userId: user.id })}
                                  title="رفض وحذف الحساب"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {/* Suspend */}
                              {user.status === "active" && user.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
                                  onClick={() => suspendMutation.mutate({ userId: user.id })}
                                  title="إيقاف"
                                >
                                  <Pause className="w-4 h-4" />
                                </Button>
                              )}
                              {/* Reactivate */}
                              {user.status === "suspended" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                  onClick={() => reactivateMutation.mutate({ userId: user.id })}
                                  title="إعادة تفعيل"
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
                              )}
                              {/* Payment History */}
                              {user.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20"
                                  onClick={() => openPaymentHistory(user)}
                                  title="سجل الدفعات"
                                >
                                  <History className="w-4 h-4" />
                                </Button>
                              )}
                              {/* Impersonate (active non-admin users only) */}
                              {user.status === "active" && user.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                                  onClick={() => setImpersonateUser(user)}
                                  title="الدخول كهذا المستخدم"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                              )}
                              {/* Edit */}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                onClick={() => openEditUser(user)}
                                title="تعديل"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {/* Delete */}
                              {user.role !== "admin" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  onClick={() => setDeleteUserId(user.id)}
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">سجل جميع المدفوعات</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400 text-right">المستخدم</TableHead>
                        <TableHead className="text-slate-400 text-right">طريقة الدفع</TableHead>
                        <TableHead className="text-slate-400 text-right">صورة الإثبات</TableHead>
                        <TableHead className="text-slate-400 text-right">الحالة</TableHead>
                        <TableHead className="text-slate-400 text-right">تاريخ الدفع</TableHead>
                        <TableHead className="text-slate-400 text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(allPaymentsData as any[]).map((p) => (
                        <TableRow key={p.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell>
                            <p className="text-white text-sm font-medium">{p.userName ?? "—"}</p>
                            <p className="text-slate-500 text-xs" dir="ltr">{p.userEmail ?? "—"}</p>
                          </TableCell>
                          <TableCell className="text-slate-300 text-sm">
                            {p.paymentMethod === "instapay" ? "InstaPay" : "PayPal"}
                          </TableCell>
                          <TableCell>
                            {p.proofImageUrl ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 text-xs gap-1"
                                onClick={() => setProofImageUrl(p.proofImageUrl)}
                              >
                                <ZoomIn className="w-3 h-3" />
                                عرض الصورة
                              </Button>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <PaymentBadge status={p.paymentStatus} method={p.paymentMethod} />
                          </TableCell>
                          <TableCell className="text-slate-400 text-xs">{formatDate(p.paymentDate)}</TableCell>
                          <TableCell>
                            {p.paymentStatus === "pending" && (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 text-xs gap-1"
                                  onClick={() => verifyPaymentMutation.mutate({ paymentId: p.id, userId: p.userId })}
                                  disabled={verifyPaymentMutation.isPending}
                                >
                                  <CheckCircle className="w-3 h-3" /> قبول
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs gap-1"
                                  onClick={() => rejectSinglePaymentMutation.mutate({ paymentId: p.id, userId: p.userId })}
                                  disabled={rejectSinglePaymentMutation.isPending}
                                >
                                  <XCircle className="w-3 h-3" /> رفض
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {allPaymentsData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-500 py-8">لا توجد مدفوعات بعد</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">جميع المنتجات (لجميع المستخدمين)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableHead className="text-slate-400 text-right">المنتج</TableHead>
                        <TableHead className="text-slate-400 text-right">النوع</TableHead>
                        <TableHead className="text-slate-400 text-right">السعر</TableHead>
                        <TableHead className="text-slate-400 text-right">المالك</TableHead>
                        <TableHead className="text-slate-400 text-right">تاريخ الإضافة</TableHead>
                        <TableHead className="text-slate-400 text-right">حذف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allProducts.map((product) => (
                        <TableRow key={product.id} className="border-slate-800 hover:bg-slate-800/50">
                          <TableCell className="text-white font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={product.type === "bundle" ? "border-purple-700 text-purple-300" : "border-slate-700 text-slate-400"}>
                              {product.type === "bundle" ? "باقة" : "منتج"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-slate-300">{product.originalPrice.toLocaleString()} ج.م</TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            <div>
                              <p className="text-slate-300">{product.ownerName}</p>
                              <p className="text-slate-500 text-xs" dir="ltr">{product.ownerEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-400 text-xs">{formatDate(product.createdAt)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              onClick={() => setDeleteProductId(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Proof Image Viewer */}
      <Dialog open={!!proofImageUrl} onOpenChange={() => setProofImageUrl(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>صورة إثبات الدفع</DialogTitle>
          </DialogHeader>
          {proofImageUrl && (
            <div className="mt-2">
              <img
                src={proofImageUrl}
                alt="Payment Proof"
                className="w-full rounded-xl border border-slate-700 max-h-[60vh] object-contain"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setProofImageUrl(null)} className="border-slate-700 text-slate-300">
              إغلاق
            </Button>
            {proofImageUrl && (
              <a href={proofImageUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  فتح في نافذة جديدة
                </Button>
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonation Confirmation */}
      <Dialog open={!!impersonateUser} onOpenChange={() => setImpersonateUser(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-purple-400 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              الدخول كمستخدم
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              ستدخل إلى لوحة التحكم كـ <span className="text-white font-semibold">{impersonateUser?.name || impersonateUser?.email}</span>.
              سيتم تسجيل خروجك من حساب الأدمن مؤقتاً.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-purple-900/20 border border-purple-800/50 rounded-xl p-3 text-sm text-purple-300">
            ⚠️ لإعادة الدخول كأدمن، سجّل الخروج ثم سجّل الدخول بحساب الأدمن مجدداً.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImpersonateUser(null)} className="border-slate-700 text-slate-300">
              إلغاء
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => impersonateUser && impersonateMutation.mutate({ userId: impersonateUser.id })}
              disabled={impersonateMutation.isPending}
            >
              {impersonateMutation.isPending ? "جاري الدخول..." : "تأكيد الدخول"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
            <DialogDescription className="text-slate-400">
              يمكنك تعديل الاسم والبريد الإلكتروني وكلمة المرور
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-slate-300">الاسم</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">البريد الإلكتروني</Label>
              <Input
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">كلمة المرور الجديدة (اتركها فارغة إذا لم تريد التغيير)</Label>
              <Input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-800 border-slate-700 text-white"
                dir="ltr"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)} className="border-slate-700 text-slate-300">
              إلغاء
            </Button>
            <Button
              onClick={handleUpdateUser}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={updateUserMutation.isPending}
            >
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <Dialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-red-400">تأكيد حذف الحساب</DialogTitle>
            <DialogDescription className="text-slate-400">
              سيتم حذف الحساب وجميع منتجاته وسيناريوهاته بشكل نهائي. هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUserId(null)} className="border-slate-700 text-slate-300">
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteUserId && deleteUserMutation.mutate({ userId: deleteUserId })}
              disabled={deleteUserMutation.isPending}
            >
              حذف نهائي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Modal */}
      <Dialog open={!!paymentHistoryUser} onOpenChange={() => { setPaymentHistoryUser(null); setSelectedUserIdForPayments(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-cyan-400 flex items-center gap-2">
              <History className="w-5 h-5" />
              سجل دفعات: {paymentHistoryUser?.name}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs" dir="ltr">{paymentHistoryUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {userPaymentsData.length === 0 ? (
              <p className="text-center text-slate-500 py-8">لا توجد دفعات مسجلة</p>
            ) : (
              (userPaymentsData as any[]).map((p) => (
                <div key={p.id} className="border border-slate-700 rounded-xl p-3 flex items-start justify-between gap-3 bg-slate-800/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <PaymentBadge status={p.paymentStatus} method={p.paymentMethod} />
                      <span className="text-slate-500 text-xs">{formatDate(p.paymentDate)}</span>
                    </div>
                    {p.notes && <p className="text-xs text-slate-400">ملاحظة: {p.notes}</p>}
                    {p.reviewedAt && <p className="text-xs text-slate-500">تمت المراجعة: {formatDate(p.reviewedAt)}</p>}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {p.proofImageUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 text-xs gap-1"
                        onClick={() => setProofImageUrl(p.proofImageUrl)}
                      >
                        <ZoomIn className="w-3 h-3" /> عرض
                      </Button>
                    )}
                    {p.paymentStatus === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => verifyPaymentMutation.mutate({ paymentId: p.id, userId: paymentHistoryUser!.id })}
                          disabled={verifyPaymentMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 ml-1" /> قبول
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-400 border-red-700 hover:bg-red-900/20"
                          onClick={() => rejectSinglePaymentMutation.mutate({ paymentId: p.id, userId: paymentHistoryUser!.id })}
                          disabled={rejectSinglePaymentMutation.isPending}
                        >
                          <XCircle className="w-3 h-3 ml-1" /> رفض
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPaymentHistoryUser(null); setSelectedUserIdForPayments(null); }} className="border-slate-700 text-slate-300">
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirmation */}
      <Dialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-red-400">تأكيد حذف المنتج</DialogTitle>
            <DialogDescription className="text-slate-400">
              سيتم حذف المنتج وجميع سيناريوهاته الـ 144 بشكل نهائي.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProductId(null)} className="border-slate-700 text-slate-300">
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteProductId && deleteProductMutation.mutate({ productId: deleteProductId })}
              disabled={deleteProductMutation.isPending}
            >
              حذف نهائي
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
