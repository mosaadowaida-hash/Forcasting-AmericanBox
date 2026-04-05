import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, DollarSign, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const utils = trpc.useUtils();
  const { data: products = [], isLoading } = trpc.products.list.useQuery();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState({
    name: '', type: 'product' as 'product' | 'bundle',
    originalPrice: 0, discountTwoItems: 10, discountThreeItems: 15, bundleDiscount: 0,
  });

  const { data: productScenarios = [] } = trpc.products.getScenarios.useQuery(
    selectedProductId!, { enabled: selectedProductId !== null }
  );

  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId), [products, selectedProductId]
  );

  const stats = useMemo(() => {
    if (productScenarios.length === 0) return null;
    const profitable = productScenarios.filter(s => s.netProfitPerOrder > 0).length;
    const avgProfit = productScenarios.reduce((sum, s) => sum + s.netProfitPerOrder, 0) / productScenarios.length;
    const avgRoas = productScenarios.reduce((sum, s) => sum + s.roas, 0) / productScenarios.length;
    const maxProfit = Math.max(...productScenarios.map(s => s.netProfitPerOrder));
    const minProfit = Math.min(...productScenarios.map(s => s.netProfitPerOrder));
    return {
      count: productScenarios.length, profitable,
      profitablePercentage: ((profitable / productScenarios.length) * 100).toFixed(1),
      avgProfit: avgProfit.toFixed(0), avgRoas: avgRoas.toFixed(2),
      maxProfit: maxProfit.toFixed(0), minProfit: minProfit.toFixed(0),
    };
  }, [productScenarios]);

  const profitDistribution = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'ربح', value: stats.profitable, fill: '#22c55e' },
      { name: 'خسارة', value: stats.count - stats.profitable, fill: '#ef4444' },
    ];
  }, [stats]);

  const profitByBasket = useMemo(() => {
    if (productScenarios.length === 0) return [];
    const groups = new Map<string, number[]>();
    productScenarios.forEach(s => {
      if (!groups.has(s.basketLabel)) groups.set(s.basketLabel, []);
      groups.get(s.basketLabel)!.push(s.netProfitPerOrder);
    });
    return Array.from(groups.entries()).map(([label, profits]) => ({
      name: label, avgProfit: Math.round(profits.reduce((a, b) => a + b, 0) / profits.length),
    }));
  }, [productScenarios]);

  const createMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.products.getAllScenarios.invalidate();
      utils.products.getOverviewStats.invalidate();
      utils.products.getRanking.invalidate();
      setShowAddDialog(false);
      resetForm();
      toast.success('تم إضافة المنتج بنجاح وحساب 144 سيناريو');
    },
    onError: (err) => toast.error('خطأ: ' + err.message),
  });

  const updateMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      if (selectedProductId) utils.products.getScenarios.invalidate(selectedProductId);
      utils.products.getAllScenarios.invalidate();
      utils.products.getOverviewStats.invalidate();
      utils.products.getRanking.invalidate();
      setShowEditDialog(false);
      toast.success('تم تعديل المنتج وإعادة حساب 144 سيناريو');
    },
    onError: (err) => toast.error('خطأ: ' + err.message),
  });

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.products.getAllScenarios.invalidate();
      utils.products.getOverviewStats.invalidate();
      utils.products.getRanking.invalidate();
      setSelectedProductId(null);
      setShowDeleteDialog(false);
      toast.success('تم حذف المنتج وجميع سيناريوهاته');
    },
    onError: (err) => toast.error('خطأ: ' + err.message),
  });

  function resetForm() {
    setFormData({ name: '', type: 'product', originalPrice: 0, discountTwoItems: 10, discountThreeItems: 15, bundleDiscount: 0 });
  }

  function openEditDialog() {
    if (!selectedProduct) return;
    setFormData({
      name: selectedProduct.name,
      type: selectedProduct.type as 'product' | 'bundle',
      originalPrice: selectedProduct.originalPrice,
      discountTwoItems: selectedProduct.discountTwoItems ?? 10,
      discountThreeItems: selectedProduct.discountThreeItems ?? 15,
      bundleDiscount: selectedProduct.bundleDiscount ?? 0,
    });
    setShowEditDialog(true);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل البيانات من قاعدة البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ads Forecasting Pro</h1>
          <p className="text-gray-600 mt-1">{products.length} منتج | {products.length * 144} سيناريو</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> إضافة منتج جديد
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>اختر منتج للتحليل</CardTitle></CardHeader>
        <CardContent>
          <Select value={selectedProductId !== null ? String(selectedProductId) : ''} onValueChange={(v) => setSelectedProductId(Number(v))}>
            <SelectTrigger><SelectValue placeholder="اختر منتج..." /></SelectTrigger>
            <SelectContent>
              {products.map(p => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name} ({p.type === 'product' ? 'منتج' : 'باندل'}) - {p.originalPrice} ج.م
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProduct && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-gray-600">إجمالي السيناريوهات</CardTitle>
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.count}</div>
                <p className="text-xs text-gray-500">3 CPM × 4 CTR × 3 CVR × 4 Basket</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-gray-600">السيناريوهات الرابحة</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.profitable} ({stats.profitablePercentage}%)</div>
                <p className="text-xs text-gray-500">من إجمالي {stats.count} سيناريو</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-gray-600">متوسط الربح</CardTitle>
                <DollarSign className="w-4 h-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgProfit} ج.م</div>
                <p className="text-xs text-gray-500">الأقصى: {stats.maxProfit} | الأدنى: {stats.minProfit}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-gray-600">متوسط ROAS</CardTitle>
                <TrendingDown className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgRoas}x</div>
                <p className="text-xs text-gray-500">العائد على الإنفاق الإعلاني</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>معلومات المنتج</CardTitle>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={openEditDialog}><Edit2 className="w-4 h-4 ml-1" /> تعديل</Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)}><Trash2 className="w-4 h-4 ml-1" /> حذف</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-sm text-gray-600">الاسم</p><p className="font-semibold">{selectedProduct.name}</p></div>
                <div><p className="text-sm text-gray-600">النوع</p><p className="font-semibold">{selectedProduct.type === 'product' ? 'منتج عادي' : 'باندل'}</p></div>
                <div><p className="text-sm text-gray-600">السعر الأصلي</p><p className="font-semibold">{selectedProduct.originalPrice} ج.م</p></div>
                {selectedProduct.type === 'product' ? (
                  <div><p className="text-sm text-gray-600">خصم القطعتين / الثلاث</p><p className="font-semibold">{selectedProduct.discountTwoItems ?? 10}% / {selectedProduct.discountThreeItems ?? 15}%</p></div>
                ) : (
                  <div><p className="text-sm text-gray-600">خصم الباندل</p><p className="font-semibold">{selectedProduct.bundleDiscount ?? 0}%</p></div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">توزيع الربح والخسارة</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={profitDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {profitDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">متوسط الربح حسب Basket Size</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={profitByBasket}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgProfit" fill="#3b82f6" name="متوسط الربح (ج.م)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>جميع {productScenarios.length} سيناريو</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-right py-3 px-2">CPM</th>
                      <th className="text-right py-3 px-2">CTR</th>
                      <th className="text-right py-3 px-2">CVR</th>
                      <th className="text-right py-3 px-2">Basket</th>
                      <th className="text-right py-3 px-2">AOV</th>
                      <th className="text-right py-3 px-2">CPA Dashboard</th>
                      <th className="text-right py-3 px-2">CPA Delivered</th>
                      <th className="text-right py-3 px-2">العائد</th>
                      <th className="text-right py-3 px-2">الربح</th>
                      <th className="text-right py-3 px-2">ROAS</th>
                      <th className="text-right py-3 px-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productScenarios.map((s, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 text-xs">{s.cpmLabel}</td>
                        <td className="py-2 px-2 text-xs">{s.ctrLabel}</td>
                        <td className="py-2 px-2 text-xs">{s.cvrLabel}</td>
                        <td className="py-2 px-2 text-xs">{s.basketLabel}</td>
                        <td className="py-2 px-2">{s.aov.toFixed(0)}</td>
                        <td className="py-2 px-2">{s.cpaDashboard.toFixed(0)}</td>
                        <td className="py-2 px-2">{s.cpaDelivered.toFixed(0)}</td>
                        <td className="py-2 px-2">{s.revenuePerOrder.toFixed(0)}</td>
                        <td className={`py-2 px-2 font-semibold ${s.netProfitPerOrder > 0 ? 'text-green-600' : 'text-red-600'}`}>{s.netProfitPerOrder.toFixed(0)}</td>
                        <td className="py-2 px-2">{s.roas.toFixed(2)}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${s.status === 'ربح' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة منتج جديد</DialogTitle>
            <DialogDescription>أدخل بيانات المنتج وسيتم حساب 144 سيناريو تلقائياً</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">اسم المنتج</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="أدخل اسم المنتج" /></div>
            <div>
              <label className="text-sm font-medium">النوع</label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as 'product' | 'bundle' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="product">منتج عادي</SelectItem><SelectItem value="bundle">باندل</SelectItem></SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">السعر الأصلي (ج.م)</label><Input type="number" value={formData.originalPrice || ''} onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })} /></div>
            {formData.type === 'product' ? (
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">خصم القطعتين (%)</label><Input type="number" value={formData.discountTwoItems} onChange={(e) => setFormData({ ...formData, discountTwoItems: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="text-sm font-medium">خصم الثلاث قطع (%)</label><Input type="number" value={formData.discountThreeItems} onChange={(e) => setFormData({ ...formData, discountThreeItems: parseFloat(e.target.value) || 0 })} /></div>
              </div>
            ) : (
              <div><label className="text-sm font-medium">خصم الباندل (%)</label><Input type="number" value={formData.bundleDiscount} onChange={(e) => setFormData({ ...formData, bundleDiscount: parseFloat(e.target.value) || 0 })} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending || !formData.name || formData.originalPrice <= 0}>
              {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ المنتج'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل المنتج</DialogTitle>
            <DialogDescription>عدّل بيانات المنتج وسيتم إعادة حساب 144 سيناريو تلقائياً</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium">اسم المنتج</label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
            <div>
              <label className="text-sm font-medium">النوع</label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as 'product' | 'bundle' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="product">منتج عادي</SelectItem><SelectItem value="bundle">باندل</SelectItem></SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">السعر الأصلي (ج.م)</label><Input type="number" value={formData.originalPrice || ''} onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })} /></div>
            {formData.type === 'product' ? (
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium">خصم القطعتين (%)</label><Input type="number" value={formData.discountTwoItems} onChange={(e) => setFormData({ ...formData, discountTwoItems: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="text-sm font-medium">خصم الثلاث قطع (%)</label><Input type="number" value={formData.discountThreeItems} onChange={(e) => setFormData({ ...formData, discountThreeItems: parseFloat(e.target.value) || 0 })} /></div>
              </div>
            ) : (
              <div><label className="text-sm font-medium">خصم الباندل (%)</label><Input type="number" value={formData.bundleDiscount} onChange={(e) => setFormData({ ...formData, bundleDiscount: parseFloat(e.target.value) || 0 })} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>إلغاء</Button>
            <Button onClick={() => updateMutation.mutate({ id: selectedProductId!, ...formData })} disabled={updateMutation.isPending || !formData.name || formData.originalPrice <= 0}>
              {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف "{selectedProduct?.name}"؟ سيتم حذف المنتج وجميع سيناريوهاته الـ 144 بشكل نهائي.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={() => deleteMutation.mutate(selectedProductId!)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف المنتج'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
