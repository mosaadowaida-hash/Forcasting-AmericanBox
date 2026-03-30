import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { allScenarios, allItems, getTopPerformers, getAudienceStats } from "@/data/updatedSimulationData";
import { TrendingUp, DollarSign, Target, Zap, Package } from "lucide-react";

export default function Dashboard() {
  // Ensure we have data before rendering
  if (!allItems || allItems.length === 0 || !allScenarios || allScenarios.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>جاري تحميل البيانات...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">يرجى الانتظار قليلاً</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [selectedItem, setSelectedItem] = useState(allItems[0]?.item_name || "");
  
  const itemScenarios = allScenarios.filter(s => s.item_name === selectedItem);
  const topPerformers = getTopPerformers("500k", 5) || [];
  
  // Get audience comparison data
  const audienceComparison = itemScenarios.map(s => ({
    audience: s.audience,
    cpa: s.cpa_dashboard,
    roas: s.roas,
    margin: s.margin,
    profit: s.profit_per_order,
  }));

  // Price tier analysis
  const priceTiers = {
    "منخفض (<1500)": allScenarios.filter(s => s.selling_price < 1500 && s.audience === "500k"),
    "متوسط (1500-3000)": allScenarios.filter(s => s.selling_price >= 1500 && s.selling_price <= 3000 && s.audience === "500k"),
    "مرتفع (>3000)": allScenarios.filter(s => s.selling_price > 3000 && s.audience === "500k"),
  };

  const priceAnalysis = Object.entries(priceTiers).map(([tier, items]) => ({
    tier,
    avgROAS: items.length > 0 ? Math.round((items.reduce((sum, i) => sum + i.roas, 0) / items.length) * 100) / 100 : 0,
    avgCPA: items.length > 0 ? Math.round((items.reduce((sum, i) => sum + i.cpa_dashboard, 0) / items.length)) : 0,
    avgMargin: items.length > 0 ? Math.round((items.reduce((sum, i) => sum + i.margin, 0) / items.length) * 10) / 10 : 0,
    count: items.length,
  }));

  // Type breakdown
  const typeBreakdown = {
    products: allScenarios.filter(s => s.item_type === 'product' && s.audience === "500k"),
    bundles: allScenarios.filter(s => s.item_type === 'bundle' && s.audience === "500k"),
  };

  const typeAnalysis = [
    {
      type: 'المنتجات',
      avgROAS: typeBreakdown.products.length > 0 ? Math.round((typeBreakdown.products.reduce((sum, i) => sum + i.roas, 0) / typeBreakdown.products.length) * 100) / 100 : 0,
      avgCPA: typeBreakdown.products.length > 0 ? Math.round((typeBreakdown.products.reduce((sum, i) => sum + i.cpa_dashboard, 0) / typeBreakdown.products.length)) : 0,
      avgMargin: typeBreakdown.products.length > 0 ? Math.round((typeBreakdown.products.reduce((sum, i) => sum + i.margin, 0) / typeBreakdown.products.length) * 10) / 10 : 0,
      count: typeBreakdown.products.length,
    },
    {
      type: 'الباندلز',
      avgROAS: typeBreakdown.bundles.length > 0 ? Math.round((typeBreakdown.bundles.reduce((sum, i) => sum + i.roas, 0) / typeBreakdown.bundles.length) * 100) / 100 : 0,
      avgCPA: typeBreakdown.bundles.length > 0 ? Math.round((typeBreakdown.bundles.reduce((sum, i) => sum + i.cpa_dashboard, 0) / typeBreakdown.bundles.length)) : 0,
      avgMargin: typeBreakdown.bundles.length > 0 ? Math.round((typeBreakdown.bundles.reduce((sum, i) => sum + i.margin, 0) / typeBreakdown.bundles.length) * 10) / 10 : 0,
      count: typeBreakdown.bundles.length,
    },
  ];

  const stats500k = getAudienceStats("500k") || {
    totalItems: 0,
    avgCPA: 0,
    avgROAS: 0,
    avgMargin: 0,
    avgProfit: 0,
    bestROAS: 0,
    lowestCPA: 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white shadow-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Campaign & Revenue Simulator</h1>
              <p className="mt-1 text-sm text-slate-600">مُحاكي الحملات الإعلانية والعوائد - تحليل شامل للسيناريوهات المختلفة</p>
            </div>
            <div className="text-right">
              <div className="inline-block rounded-lg bg-blue-50 px-4 py-2">
                <p className="text-xs font-medium text-blue-600">{allItems.length} منتج وباندل | 3 سيناريوهات</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="item-analysis">تحليل المنتج</TabsTrigger>
            <TabsTrigger value="comparison">المقارنة</TabsTrigger>
            <TabsTrigger value="recommendations">التوصيات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    أفضل ROAS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {allScenarios && allScenarios.length > 0 ? Math.max(...allScenarios.map(s => s.roas)).toFixed(2) : '0'}x
                  </div>
                  <p className="text-xs text-slate-500 mt-1">في سيناريو 1M</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    متوسط الربح
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {allScenarios && allScenarios.length > 0 ? Math.round(allScenarios.reduce((sum, s) => sum + s.profit_per_order, 0) / allScenarios.length) : '0'} ج.م
                  </div>
                  <p className="text-xs text-slate-500 mt-1">لكل طلب</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    متوسط الهامش
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {allScenarios && allScenarios.length > 0 ? Math.round(allScenarios.reduce((sum, s) => sum + s.margin, 0) / allScenarios.length) : '0'}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">من إجمالي الإيرادات</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    أقل CPA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {allScenarios && allScenarios.length > 0 ? Math.min(...allScenarios.map(s => s.cpa_dashboard)).toFixed(0) : '0'} ج.م
                  </div>
                  <p className="text-xs text-slate-500 mt-1">في سيناريو 1M</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>أفضل 5 منتجات وباندلز (500k جمهور)</CardTitle>
                <CardDescription>بناءً على ROAS</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topPerformers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="item_name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="roas" fill="#0066cc" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Type Analysis */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>مقارنة المنتجات والباندلز</CardTitle>
                <CardDescription>أداء المنتجات مقابل الباندلز</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {typeAnalysis.map((type) => (
                    <div key={type.type} className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        {type.type}
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">متوسط ROAS:</span>
                          <span className="font-semibold text-blue-600">{type.avgROAS.toFixed(2)}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">متوسط CPA:</span>
                          <span className="font-semibold text-slate-900">{type.avgCPA.toFixed(0)} ج.م</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">متوسط الهامش:</span>
                          <span className="font-semibold text-green-600">{type.avgMargin.toFixed(1)}%</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between">
                          <span className="text-slate-600">العدد:</span>
                          <span className="font-semibold">{type.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Tier Analysis */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>تحليل حسب فئة السعر</CardTitle>
                <CardDescription>مقارنة الأداء بين الفئات المختلفة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {priceAnalysis.map((tier) => (
                    <div key={tier.tier} className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                      <h4 className="font-semibold text-slate-900 mb-3">{tier.tier}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">متوسط ROAS:</span>
                          <span className="font-semibold text-blue-600">{tier.avgROAS.toFixed(2)}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">متوسط CPA:</span>
                          <span className="font-semibold text-slate-900">{tier.avgCPA.toFixed(0)} ج.م</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">متوسط الهامش:</span>
                          <span className="font-semibold text-green-600">{tier.avgMargin.toFixed(1)}%</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between">
                          <span className="text-slate-600">عدد المنتجات:</span>
                          <span className="font-semibold">{tier.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Item Analysis Tab */}
          <TabsContent value="item-analysis" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>اختر منتج أو باندل للتحليل</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allItems.map((item) => (
                      <SelectItem key={item.item_name} value={item.item_name}>
                        {item.item_type === 'bundle' ? '📦' : '💊'} {item.item_name} ({item.selling_price} ج.م)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Scenario Comparison Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>مقارنة CPA حسب حجم الجمهور</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={audienceComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="audience" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                      <Line type="monotone" dataKey="cpa" stroke="#0066cc" strokeWidth={2} dot={{ fill: "#0066cc", r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>مقارنة ROAS حسب حجم الجمهور</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={audienceComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="audience" />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                      <Line type="monotone" dataKey="roas" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Table */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>جميع السيناريوهات للمنتج المختار</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700">الجمهور</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">CPM</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">CPA</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">AOV</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">ROAS</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">الربح</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700">الهامش</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemScenarios.map((scenario, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-900 font-medium">{scenario.audience}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{scenario.cpm.toFixed(1)} ج.م</td>
                          <td className="py-3 px-4 text-right text-slate-600">{scenario.cpa_dashboard.toFixed(0)} ج.م</td>
                          <td className="py-3 px-4 text-right text-slate-600">{scenario.aov.toFixed(0)} ج.م</td>
                          <td className="py-3 px-4 text-right font-semibold text-blue-600">{scenario.roas.toFixed(2)}x</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">{scenario.profit_per_order.toFixed(0)} ج.م</td>
                          <td className="py-3 px-4 text-right text-slate-600">{scenario.margin.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>اختر منتج للمقارنة</CardTitle>
                <CardDescription>مقارنة السيناريوهات الثلاثة للمنتج المختار</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedItem} onValueChange={setSelectedItem}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allItems.map((item) => (
                      <SelectItem key={item.item_name} value={item.item_name}>
                        {item.item_type === 'bundle' ? '📦' : '💊'} {item.item_name} ({item.selling_price} ج.م)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Product-Specific Comparison */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>مقارنة السيناريوهات الثلاثة: {selectedItem}</CardTitle>
                <CardDescription>تأثير حجم الجمهور على جميع المقاييس الرئيسية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Three Scenario Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {itemScenarios.map((scenario) => (
                    <div key={scenario.audience} className={`rounded-lg border-2 p-4 ${
                      scenario.audience === "250k" ? "border-blue-200 bg-blue-50" :
                      scenario.audience === "500k" ? "border-amber-200 bg-amber-50" :
                      "border-green-200 bg-green-50"
                    }`}>
                      <h4 className="font-bold text-slate-900 mb-4 text-lg">
                        {scenario.audience === "250k" && "السيناريو 1: 250k"}
                        {scenario.audience === "500k" && "السيناريو 2: 500k ⭐"}
                        {scenario.audience === "1M" && "السيناريو 3: 1M"}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-300">
                          <span className="text-slate-700 font-medium">CPM</span>
                          <span className="text-lg font-bold text-slate-900">{scenario.cpm.toFixed(1)} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-300">
                          <span className="text-slate-700 font-medium">CPA Dashboard</span>
                          <span className="text-lg font-bold text-blue-600">{scenario.cpa_dashboard.toFixed(0)} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-300">
                          <span className="text-slate-700 font-medium">AOV</span>
                          <span className="text-lg font-bold text-slate-900">{scenario.aov.toFixed(0)} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-300">
                          <span className="text-slate-700 font-medium">ROAS</span>
                          <span className="text-lg font-bold text-green-600">{scenario.roas.toFixed(2)}x</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-300">
                          <span className="text-slate-700 font-medium">الربح/الطلب</span>
                          <span className="text-lg font-bold text-emerald-600">{scenario.profit_per_order.toFixed(0)} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700 font-medium">الهامش</span>
                          <span className="text-lg font-bold text-purple-600">{scenario.margin.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comparison Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {/* CPA Comparison */}
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <h4 className="font-semibold text-slate-900 mb-4">مقارنة CPA</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={itemScenarios}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="audience" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                        <Bar dataKey="cpa_dashboard" fill="#0066cc" name="CPA Dashboard" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* ROAS Comparison */}
                  <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                    <h4 className="font-semibold text-slate-900 mb-4">مقارنة ROAS</h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={itemScenarios}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="audience" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                        <Bar dataKey="roas" fill="#10b981" name="ROAS" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl">التوصيات الاستراتيجية</CardTitle>
                <CardDescription>بناءً على تحليل جميع السيناريوهات والبيانات الفعلية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recommendation 1 */}
                <div className="rounded-lg border-l-4 border-l-blue-600 bg-blue-50 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">1. استراتيجية البداية (Launch Strategy)</h3>
                  <p className="text-slate-700 mb-3">
                    ابدأ بجمهور <strong>500k</strong> (Lookalike 1%) للحصول على التوازن الأمثل بين التكلفة والجودة.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                    <li>CPM متوسط: 35-60 ج.م</li>
                    <li>متوسط ROAS: {(allScenarios.filter(s => s.audience === "500k").reduce((sum, s) => sum + s.roas, 0) / allScenarios.filter(s => s.audience === "500k").length).toFixed(2)}x</li>
                    <li>أفضل توازن بين الوصول والتحويل</li>
                  </ul>
                </div>

                {/* Recommendation 2 */}
                <div className="rounded-lg border-l-4 border-l-green-600 bg-green-50 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">2. استراتيجية التوسع (Scaling Strategy)</h3>
                  <p className="text-slate-700 mb-3">
                    بعد نجاح الحملة الأولية، انتقل إلى جمهور <strong>1M</strong> للمنتجات والباندلز ذات ROAS العالي.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                    <li>المنتجات المرشحة: {topPerformers.slice(0, 3).map(p => p.item_name.split(" ")[0]).join(", ")}</li>
                    <li>متوسط ROAS في 1M: {(allScenarios.filter(s => s.audience === "1M").reduce((sum, s) => sum + s.roas, 0) / allScenarios.filter(s => s.audience === "1M").length).toFixed(2)}x</li>
                    <li>تقليل CPA بنسبة 30-40% مقارنة بـ 500k</li>
                  </ul>
                </div>

                {/* Recommendation 3 */}
                <div className="rounded-lg border-l-4 border-l-purple-600 bg-purple-50 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">3. استراتيجية الباندلز (Bundle Strategy)</h3>
                  <p className="text-slate-700 mb-3">
                    الباندلز توفر ROAS أعلى وتشجع على شراء متعدد المنتجات.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                    <li>متوسط ROAS للباندلز: {typeAnalysis[1].avgROAS.toFixed(2)}x</li>
                    <li>متوسط ROAS للمنتجات: {typeAnalysis[0].avgROAS.toFixed(2)}x</li>
                    <li>الباندلز تحقق عائد أعلى رغم الهامش الأقل</li>
                  </ul>
                </div>

                {/* Key Metrics Summary */}
                <div className="mt-8 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
                  <h3 className="font-semibold mb-4 text-lg">ملخص المقاييس الرئيسية (500k)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-300 text-sm">أفضل ROAS</p>
                      <p className="text-2xl font-bold">{stats500k.bestROAS.toFixed(2)}x</p>
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm">أقل CPA</p>
                      <p className="text-2xl font-bold">{stats500k.lowestCPA.toFixed(0)} ج.م</p>
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm">متوسط الهامش</p>
                      <p className="text-2xl font-bold">{stats500k.avgMargin.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm">متوسط الربح</p>
                      <p className="text-2xl font-bold">{stats500k.avgProfit.toFixed(0)} ج.م</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="container text-center text-sm text-slate-600">
          <p>تم بناء هذه المحاكاة بناءً على بيانات حقيقية من American Box مع {allItems.length} منتج وباندل</p>
          <p className="mt-2">جميع الأرقام تقريبية وقابلة للتعديل حسب الأداء الفعلي</p>
        </div>
      </div>
    </div>
  );
}
