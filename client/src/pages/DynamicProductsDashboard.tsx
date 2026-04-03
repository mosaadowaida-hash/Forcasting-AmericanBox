import { useState, useMemo } from "react";
import { AddProductDialog } from "@/components/AddProductDialog";
import { ProductManagementDialog } from "@/components/ProductManagementDialog";
import { useLocalProducts, Product } from "@/hooks/useLocalProducts";
import { Button } from "@/components/ui/button";
import { Settings, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

export default function DynamicProductsDashboard() {
  const { products: customProducts, scenarios: customScenarios, deleteProduct, updateProduct } = useLocalProducts();
  const [selectedProductId, setSelectedProductId] = useState(customProducts[0]?.id || "");
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [managementDialogOpen, setManagementDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get scenarios for selected product
  const productScenarios = useMemo(() => 
    customScenarios.filter(s => s.product_id === selectedProductId),
    [selectedProductId, customScenarios]
  );

  // Get unique filter values
  const uniqueCPMs = useMemo(() => Array.from(new Set(productScenarios.map(s => s.cpm_label))), [productScenarios]);
  const uniqueCTRs = useMemo(() => Array.from(new Set(productScenarios.map(s => s.ctr_label))), [productScenarios]);
  const uniqueCVRs = useMemo(() => Array.from(new Set(productScenarios.map(s => s.cvr_label))), [productScenarios]);
  const uniqueBaskets = useMemo(() => Array.from(new Set(productScenarios.map(s => s.basket_label))), [productScenarios]);

  // Initialize with first values
  const [selectedCPM, setSelectedCPM] = useState(uniqueCPMs[0] || "");
  const [selectedCTR, setSelectedCTR] = useState(uniqueCTRs[0] || "");
  const [selectedCVR, setSelectedCVR] = useState(uniqueCVRs[0] || "");
  const [selectedBasket, setSelectedBasket] = useState(uniqueBaskets[0] || "");

  // Filter to get exactly ONE scenario
  const filteredScenarios = useMemo(() => productScenarios.filter(s =>
    s.cpm_label === selectedCPM &&
    s.ctr_label === selectedCTR &&
    s.cvr_label === selectedCVR &&
    s.basket_label === selectedBasket
  ), [selectedCPM, selectedCTR, selectedCVR, selectedBasket, productScenarios]);

  const selectedProduct = customProducts.find(p => p.id === selectedProductId);

  // Profitability stats
  const profitableCount = productScenarios.filter(s => s.net_profit_per_order > 0).length;
  const lossCount = productScenarios.filter(s => s.net_profit_per_order < 0).length;

  const fmt = (n: number | undefined) => (n ?? 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 });

  if (customProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">المنتجات الديناميكية</h1>
            <p className="text-slate-600 mb-6">لم تقم بإضافة أي منتجات حتى الآن</p>
            <Button onClick={() => setAddProductDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
              + إضافة منتج جديد
            </Button>
          </div>
        </div>
        <AddProductDialog 
          open={addProductDialogOpen} 
          onOpenChange={setAddProductDialogOpen}
          onProductAdded={() => setRefreshKey(prev => prev + 1)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">المنتجات الديناميكية</h1>
          <p className="text-sm text-slate-600 mt-1">إدارة المنتجات المخصصة ({customProducts.length} منتج × 144 سيناريو)</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setManagementDialogOpen(true)} className="bg-slate-600 hover:bg-slate-700 text-white whitespace-nowrap">
            <Settings className="w-4 h-4 ml-2" />تعديل
          </Button>
          <Button onClick={() => setAddProductDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap">
            + إضافة منتج
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">إجمالي السيناريوهات</p>
              <p className="text-2xl font-bold text-slate-900">{productScenarios.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">سيناريوهات رابحة</p>
              <p className="text-2xl font-bold text-green-600">{profitableCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">سيناريوهات خاسرة</p>
              <p className="text-2xl font-bold text-red-600">{lossCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600">معدل الربحية</p>
              <p className="text-2xl font-bold text-blue-600">{((profitableCount / productScenarios.length) * 100).toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Selection */}
      <Card className="border-0 shadow-lg mb-6">
        <CardHeader>
          <CardTitle>اختر منتج</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {customProducts.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} ({product.type === 'bundle' ? 'باندل' : 'منتج'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Product Info */}
      {selectedProduct && (
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle>معلومات المنتج</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-600">الاسم</p>
                <p className="font-semibold">{selectedProduct.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">النوع</p>
                <p className="font-semibold">{selectedProduct.type === 'bundle' ? 'باندل' : 'منتج عادي'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">السعر الأصلي</p>
                <p className="font-semibold">{fmt(selectedProduct.original_price)} ج.م</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">الخصومات</p>
                <p className="font-semibold">
                  {selectedProduct.type === 'bundle' 
                    ? `${selectedProduct.bundle_discount}%` 
                    : `2x: ${selectedProduct.discount_two_items}%, 3x: ${selectedProduct.discount_three_items}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-0 shadow-lg mb-6">
        <CardHeader>
          <CardTitle>فلتر السيناريوهات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-slate-600">CPM</label>
              <Select value={selectedCPM} onValueChange={setSelectedCPM}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCPMs.map(cpm => (
                    <SelectItem key={cpm} value={cpm}>{cpm}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-600">CTR</label>
              <Select value={selectedCTR} onValueChange={setSelectedCTR}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCTRs.map(ctr => (
                    <SelectItem key={ctr} value={ctr}>{ctr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-600">CVR</label>
              <Select value={selectedCVR} onValueChange={setSelectedCVR}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCVRs.map(cvr => (
                    <SelectItem key={cvr} value={cvr}>{cvr}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-600">Basket Size</label>
              <Select value={selectedBasket} onValueChange={setSelectedBasket}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueBaskets.map(basket => (
                    <SelectItem key={basket} value={basket}>{basket}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Details */}
      {filteredScenarios.length > 0 && (
        <Card className="border-0 shadow-lg mb-6">
          <CardHeader>
            <CardTitle>تفاصيل السيناريو</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-2 py-2 text-right">AOV</th>
                    <th className="px-2 py-2 text-right">CPA Dashboard</th>
                    <th className="px-2 py-2 text-right">CPA Delivered</th>
                    <th className="px-2 py-2 text-right">Revenue</th>
                    <th className="px-2 py-2 text-right">COGS</th>
                    <th className="px-2 py-2 text-right">Net Profit</th>
                    <th className="px-2 py-2 text-right">ROAS</th>
                    <th className="px-2 py-2 text-right">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScenarios.map((s, idx) => (
                    <tr key={idx} className="border-b border-slate-50">
                      <td className="px-2 py-2">{fmt(s.aov)}</td>
                      <td className="px-2 py-2">{fmt(s.cpa_dashboard)}</td>
                      <td className="px-2 py-2 text-orange-600">{fmt(s.cpa_delivered)}</td>
                      <td className="px-2 py-2">{fmt(s.revenue_per_order)}</td>
                      <td className="px-2 py-2 text-slate-500">{fmt(s.cogs)}</td>
                      <td className={`px-2 py-2 font-bold ${s.net_profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(s.net_profit_per_order)}
                      </td>
                      <td className="px-2 py-2">{s.roas.toFixed(2)}x</td>
                      <td className="px-2 py-2">
                        <Badge variant={s.net_profit_per_order > 0 ? 'default' : 'destructive'}>
                          {s.net_profit_per_order > 0 ? 'ربح' : 'خسارة'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddProductDialog 
        open={addProductDialogOpen} 
        onOpenChange={setAddProductDialogOpen}
        onProductAdded={() => setRefreshKey(prev => prev + 1)}
      />

      {selectedProduct && (
        <ProductManagementDialog
          product={selectedProduct}
          open={managementDialogOpen}
          onOpenChange={setManagementDialogOpen}
          onProductUpdated={() => setRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  );
}
