import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function SupabaseDashboard() {
  const { data: products = [], isLoading: loading } = trpc.products.list.useQuery();
  const { data: allScenarios = [] } = trpc.products.getAllScenarios.useQuery();
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    type: 'product' as 'product' | 'bundle',
    originalPrice: 0,
    discountTwoItems: 0,
    discountThreeItems: 0,
    bundleDiscount: 0,
  });

  const { data: productScenarios = [] } = trpc.products.getScenarios.useQuery(selectedProductId, {
    enabled: !!selectedProductId,
  });

  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId),
    [products, selectedProductId]
  );

  const stats = useMemo(() => {
    if (productScenarios.length === 0) return null;

    const profitable = productScenarios.filter(s => s.net_profit_per_order > 0).length;
    const avgProfit = productScenarios.reduce((sum, s) => sum + s.net_profit_per_order, 0) / productScenarios.length;
    const avgRoas = productScenarios.reduce((sum, s) => sum + s.roas, 0) / productScenarios.length;

    return {
      count: productScenarios.length,
      profitable,
      profitablePercentage: ((profitable / productScenarios.length) * 100).toFixed(1),
      avgProfit: avgProfit.toFixed(0),
      avgRoas: avgRoas.toFixed(2),
    };
  }, [productScenarios]);

  const createMutation = trpc.products.create.useMutation();
  const deleteMutation = trpc.products.delete.useMutation();

  const handleAddProduct = async () => {
    if (!formData.name || formData.originalPrice <= 0) {
      alert('الرجاء ملء جميع الحقول');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: formData.name,
        type: formData.type,
        original_price: formData.originalPrice,
        discount_two_items: formData.type === 'product' ? formData.discountTwoItems : undefined,
        discount_three_items: formData.type === 'product' ? formData.discountThreeItems : undefined,
        bundle_discount: formData.type === 'bundle' ? formData.bundleDiscount : undefined,
      });
      setFormData({
        name: '',
        type: 'product',
        originalPrice: 0,
        discountTwoItems: 0,
        discountThreeItems: 0,
        bundleDiscount: 0,
      });
      setShowAddForm(false);
      alert('تم إضافة المنتج بنجاح!');
    } catch (error) {
      alert('خطأ في إضافة المنتج');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('هل تريد حذف هذا المنتج؟')) {
      try {
        await deleteMutation.mutateAsync(productId);
        if (selectedProductId === productId) {
          setSelectedProductId('');
        }
        alert('تم حذف المنتج بنجاح!');
      } catch (error) {
        alert('خطأ في حذف المنتج');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }



  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">محاكي الحملات والإيرادات</h1>
          <p className="text-gray-600 mt-2">النسخة الديناميكية - قاعدة البيانات</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة منتج جديد
        </Button>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>إضافة منتج جديد</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">اسم المنتج</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="أدخل اسم المنتج"
                />
              </div>

              <div>
                <label className="text-sm font-medium">النوع</label>
                <Select value={formData.type} onValueChange={(type) => setFormData({ ...formData, type: type as 'product' | 'bundle' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">منتج عادي</SelectItem>
                    <SelectItem value="bundle">باندل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">السعر الأصلي (ج.م)</label>
                <Input
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) })}
                  placeholder="0"
                />
              </div>

              {formData.type === 'product' ? (
                <>
                  <div>
                    <label className="text-sm font-medium">خصم القطعتين (%)</label>
                    <Input
                      type="number"
                      value={formData.discountTwoItems}
                      onChange={(e) => setFormData({ ...formData, discountTwoItems: parseFloat(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">خصم الثلاث قطع (%)</label>
                    <Input
                      type="number"
                      value={formData.discountThreeItems}
                      onChange={(e) => setFormData({ ...formData, discountThreeItems: parseFloat(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-sm font-medium">خصم الباندل (%)</label>
                  <Input
                    type="number"
                    value={formData.bundleDiscount}
                    onChange={(e) => setFormData({ ...formData, bundleDiscount: parseFloat(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddProduct} className="bg-green-600 hover:bg-green-700">
                حفظ المنتج
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline">
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle>اختر منتج للتحليل</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger>
              <SelectValue placeholder="اختر منتج..." />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} ({product.type === 'product' ? 'منتج' : 'باندل'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Product Stats */}
      {selectedProduct && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">إجمالي السيناريوهات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">السيناريوهات الرابحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.profitable} ({stats.profitablePercentage}%)
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">متوسط الربح</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgProfit} ج.م</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">متوسط ROAS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgRoas}x</div>
              </CardContent>
            </Card>
          </div>

          {/* Product Details */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>معلومات المنتج</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingProduct(selectedProductId)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteProduct(selectedProductId)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">الاسم</p>
                  <p className="font-semibold">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">النوع</p>
                  <p className="font-semibold">{selectedProduct.type === 'product' ? 'منتج عادي' : 'باندل'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">السعر الأصلي</p>
                  <p className="font-semibold">{selectedProduct.original_price} ج.م</p>
                </div>
                {selectedProduct.type === 'product' ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">خصم القطعتين</p>
                      <p className="font-semibold">{selectedProduct.discount_two_items || 0}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">خصم الثلاث قطع</p>
                      <p className="font-semibold">{selectedProduct.discount_three_items || 0}%</p>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600">خصم الباندل</p>
                    <p className="font-semibold">{selectedProduct.bundle_discount || 0}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scenarios Table */}
          <Card>
            <CardHeader>
              <CardTitle>جميع {productScenarios.length} سيناريو</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-right py-2">CPM</th>
                      <th className="text-right py-2">CTR</th>
                      <th className="text-right py-2">CVR</th>
                      <th className="text-right py-2">Basket</th>
                      <th className="text-right py-2">AOV</th>
                      <th className="text-right py-2">الربح</th>
                      <th className="text-right py-2">CPA</th>
                      <th className="text-right py-2">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productScenarios.slice(0, 20).map((scenario, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2">{scenario.cpm_label}</td>
                        <td className="py-2">{scenario.ctr_label}</td>
                        <td className="py-2">{scenario.cvr_label}</td>
                        <td className="py-2">{scenario.basket_label}</td>
                        <td className="py-2">{scenario.aov.toFixed(0)}</td>
                        <td className={`py-2 ${scenario.net_profit_per_order > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {scenario.net_profit_per_order.toFixed(0)}
                        </td>
                        <td className="py-2">{scenario.cpa_delivered.toFixed(0)}</td>
                        <td className="py-2">{scenario.roas.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
