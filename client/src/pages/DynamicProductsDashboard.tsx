'use client';
import { useState, useMemo, useEffect } from 'react';
import { AddProductDialog } from "@/components/AddProductDialog";
import { ProductManagementDialog } from "@/components/ProductManagementDialog";
import { useLocalProductsContext } from "@/contexts/LocalProductsContext";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

export default function DynamicProductsDashboard() {
  const { products: customProducts, scenarios: customScenarios, isLoaded } = useLocalProductsContext();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [managementDialogOpen, setManagementDialogOpen] = useState(false);

  // Update selectedProductId when products load
  useEffect(() => {
    if (isLoaded && customProducts.length > 0 && !selectedProductId) {
      setSelectedProductId(customProducts[0].id);
    }
  }, [isLoaded, customProducts, selectedProductId]);

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
  const [selectedCPM, setSelectedCPM] = useState("");
  const [selectedCTR, setSelectedCTR] = useState("");
  const [selectedCVR, setSelectedCVR] = useState("");
  const [selectedBasket, setSelectedBasket] = useState("");

  // Update filter defaults when unique values change
  useEffect(() => {
    if (uniqueCPMs.length > 0 && !selectedCPM) setSelectedCPM(uniqueCPMs[0]);
    if (uniqueCTRs.length > 0 && !selectedCTR) setSelectedCTR(uniqueCTRs[0]);
    if (uniqueCVRs.length > 0 && !selectedCVR) setSelectedCVR(uniqueCVRs[0]);
    if (uniqueBaskets.length > 0 && !selectedBasket) setSelectedBasket(uniqueBaskets[0]);
  }, [uniqueCPMs, uniqueCTRs, uniqueCVRs, uniqueBaskets, selectedCPM, selectedCTR, selectedCVR, selectedBasket]);

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

  if (!isLoaded || customProducts.length === 0) {
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
              <p className="text-2xl font-bold text-blue-600">{productScenarios.length > 0 ? ((profitableCount / productScenarios.length) * 100).toFixed(1) : 0}%</p>
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
              <SelectValue placeholder="اختر منتج" />
            </SelectTrigger>
            <SelectContent>
              {customProducts.map(product => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} - {product.type === 'product' ? 'منتج عادي' : 'باندل'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="scenarios" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scenarios">السيناريوهات</TabsTrigger>
          <TabsTrigger value="analysis">التحليل</TabsTrigger>
        </TabsList>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>جميع السيناريوهات ({productScenarios.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div>
                  <label className="text-sm font-medium">CPM</label>
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
                  <label className="text-sm font-medium">CTR</label>
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
                  <label className="text-sm font-medium">CVR</label>
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
                  <label className="text-sm font-medium">Basket Size</label>
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

              {filteredScenarios.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-2 text-right">CPM</th>
                        <th className="p-2 text-right">CTR</th>
                        <th className="p-2 text-right">CVR</th>
                        <th className="p-2 text-right">Basket</th>
                        <th className="p-2 text-right">AOV</th>
                        <th className="p-2 text-right">Revenue</th>
                        <th className="p-2 text-right">CPA</th>
                        <th className="p-2 text-right">Profit</th>
                        <th className="p-2 text-right">ROAS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScenarios.map(scenario => (
                        <tr key={scenario.id} className="border-b hover:bg-slate-50">
                          <td className="p-2">{scenario.cpm_label}</td>
                          <td className="p-2">{scenario.ctr_label}</td>
                          <td className="p-2">{scenario.cvr_label}</td>
                          <td className="p-2">{scenario.basket_label}</td>
                          <td className="p-2">{fmt(scenario.aov)}</td>
                          <td className="p-2">{fmt(scenario.revenue_per_order)}</td>
                          <td className="p-2">{fmt(scenario.cpa_delivered)}</td>
                          <td className={`p-2 font-bold ${scenario.net_profit_per_order > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {fmt(scenario.net_profit_per_order)}
                          </td>
                          <td className="p-2">{scenario.roas.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>توزيع الربحية</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'رابح', value: profitableCount, fill: '#10b981' },
                      { name: 'خاسر', value: lossCount, fill: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddProductDialog 
        open={addProductDialogOpen} 
        onOpenChange={setAddProductDialogOpen}
      />
    </div>
  );
}
