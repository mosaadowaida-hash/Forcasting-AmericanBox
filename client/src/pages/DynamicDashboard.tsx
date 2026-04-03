import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddProductDialog } from "@/components/AddProductDialog";
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

interface Product {
  id: string;
  name: string;
  type: 'product' | 'bundle';
  original_price: number;
  discount_two_items?: number;
  discount_three_items?: number;
  bundle_discount?: number;
  created_at: string;
}

interface Scenario {
  id: string;
  product_id: string;
  cpm: number;
  cpm_label: string;
  ctr: number;
  ctr_label: string;
  cvr: number;
  cvr_label: string;
  basket_size: number;
  basket_label: string;
  aov: number;
  revenue_per_order: number;
  cpa_dashboard: number;
  cpa_delivered: number;
  cogs: number;
  net_profit_per_order: number;
  roas: number;
}

export default function DynamicDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fmt = (n: number | undefined) => (n ?? 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchScenarios(selectedProduct);
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
      if (data.length > 0) {
        setSelectedProduct(data[0].id);
      }
    } catch (error) {
      toast.error('فشل في تحميل المنتجات');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScenarios = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/scenarios`);
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      const data = await response.json();
      setScenarios(data);
    } catch (error) {
      toast.error('فشل في تحميل السيناريوهات');
      console.error(error);
    }
  };

  const currentProduct = products.find(p => p.id === selectedProduct);
  
  const profitabilityData = scenarios.length > 0 ? [
    { name: "ربح", value: scenarios.filter(s => s.net_profit_per_order > 0).length, fill: "#10b981" },
    { name: "خسارة", value: scenarios.filter(s => s.net_profit_per_order < 0).length, fill: "#ef4444" },
  ] : [];

  const topScenarios = scenarios.sort((a, b) => b.net_profit_per_order - a.net_profit_per_order).slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 md:p-6" dir="rtl">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">محاكي الحملات - النسخة الديناميكية</h1>
          <p className="text-sm text-slate-600 mt-1">أضف منتجات جديدة وشاهد السيناريوهات تُحسب تلقائياً</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          + إضافة منتج جديد
        </Button>
      </div>

      <Card className="border-0 shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">اختر منتج للتحليل</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({fmt(p.original_price)} ج.م)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {currentProduct && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2"><CardTitle className="text-xs">نوع المنتج</CardTitle></CardHeader>
              <CardContent>
                <Badge variant={currentProduct.type === 'product' ? 'default' : 'secondary'}>
                  {currentProduct.type === 'product' ? 'منتج عادي' : 'باندل'}
                </Badge>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2"><CardTitle className="text-xs">السعر الأصلي</CardTitle></CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-slate-900">{fmt(currentProduct.original_price)}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2"><CardTitle className="text-xs">عدد السيناريوهات</CardTitle></CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-blue-600">{scenarios.length}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2"><CardTitle className="text-xs">معدل الربحية</CardTitle></CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-green-600">
                  {scenarios.length > 0 
                    ? ((scenarios.filter(s => s.net_profit_per_order > 0).length / scenarios.length) * 100).toFixed(0) + '%'
                    : '0%'}
                </div>
              </CardContent>
            </Card>
          </div>

          {scenarios.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle className="text-sm">توزيع الربحية</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={profitabilityData} cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill="#8884d8" dataKey="value">
                        {profitabilityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle className="text-sm">أفضل 5 سيناريوهات</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {topScenarios.map((s, idx) => (
                      <div key={idx} className="flex justify-between text-xs p-2 bg-slate-50 rounded">
                        <span>{s.cpm_label} / {s.ctr_label} / {s.cvr_label}</span>
                        <span className="font-bold text-green-600">{fmt(s.net_profit_per_order)} ج.م</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle className="text-sm">جميع السيناريوهات ({scenarios.length})</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs border-collapse min-w-[600px]">
                <thead className="bg-slate-100 border-b sticky top-0">
                  <tr>
                    <th className="px-2 py-2 text-right">CPM</th>
                    <th className="px-2 py-2 text-right">CTR</th>
                    <th className="px-2 py-2 text-right">CVR</th>
                    <th className="px-2 py-2 text-right">Basket</th>
                    <th className="px-2 py-2 text-right">العائد</th>
                    <th className="px-2 py-2 text-right">الربح</th>
                    <th className="px-2 py-2 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarios.map((s, idx) => (
                    <tr key={idx} className={`border-b ${s.net_profit_per_order < 0 ? 'bg-red-50' : ''}`}>
                      <td className="px-2 py-1">{s.cpm_label}</td>
                      <td className="px-2 py-1">{s.ctr_label}</td>
                      <td className="px-2 py-1">{s.cvr_label}</td>
                      <td className="px-2 py-1">{s.basket_label}</td>
                      <td className="px-2 py-1">{fmt(s.revenue_per_order)}</td>
                      <td className={`px-2 py-1 font-bold ${s.net_profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(s.net_profit_per_order)}
                      </td>
                      <td className="px-2 py-1">{s.roas.toFixed(1)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      <AddProductDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onProductAdded={() => {
          fetchProducts();
          setDialogOpen(false);
        }}
      />
    </div>
  );
}
