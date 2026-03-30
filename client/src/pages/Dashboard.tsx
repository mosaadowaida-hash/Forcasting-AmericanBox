import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell } from "recharts";
import { allScenarios, products } from "@/data/simulationData";
import { TrendingUp, DollarSign, Target, Zap } from "lucide-react";

export default function Dashboard() {
  const [selectedProduct, setSelectedProduct] = useState(products[0].name);
  const [selectedMetric, setSelectedMetric] = useState("roas");

  const productScenarios = allScenarios.filter(s => s.product === selectedProduct);
  
  // Get top performers
  const topPerformers = allScenarios
    .filter(s => s.audience === "500k")
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 5);

  // Audience comparison data
  const audienceComparison = allScenarios
    .filter(s => s.product === selectedProduct)
    .map(s => ({
      audience: s.audience,
      cpa: s.cpaDashboard,
      roas: s.roas,
      margin: s.margin,
      profit: s.profitPerOrder,
    }));

  // Price tier analysis
  const priceTiers = {
    "Low (<1500)": allScenarios.filter(s => s.price < 1500 && s.audience === "500k"),
    "Medium (1500-3000)": allScenarios.filter(s => s.price >= 1500 && s.price <= 3000 && s.audience === "500k"),
    "High (>3000)": allScenarios.filter(s => s.price > 3000 && s.audience === "500k"),
  };

  const priceAnalysis = Object.entries(priceTiers).map(([tier, items]) => ({
    tier,
    avgROAS: Math.round((items.reduce((sum, i) => sum + i.roas, 0) / items.length) * 100) / 100,
    avgCPA: Math.round((items.reduce((sum, i) => sum + i.cpaDashboard, 0) / items.length) * 100) / 100,
    avgMargin: Math.round((items.reduce((sum, i) => sum + i.margin, 0) / items.length) * 100) / 100,
    count: items.length,
  }));

  // Scenario comparison for selected product
  const scenarioData = productScenarios.map(s => ({
    audience: s.audience,
    cpa: s.cpaDashboard,
    roas: s.roas,
    profit: s.profitPerOrder,
    margin: s.margin,
  }));

  const colors = ["#0066cc", "#0052a3", "#003d7a", "#4da6ff", "#0099ff"];

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
                <p className="text-xs font-medium text-blue-600">30 منتج | 3 سيناريوهات</p>
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
            <TabsTrigger value="product-analysis">تحليل المنتج</TabsTrigger>
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
                    {Math.max(...allScenarios.map(s => s.roas)).toFixed(2)}x
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
                    {Math.round(allScenarios.reduce((sum, s) => sum + s.profitPerOrder, 0) / allScenarios.length)} ج.م
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
                    {Math.round(allScenarios.reduce((sum, s) => sum + s.margin, 0) / allScenarios.length)}%
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
                    {Math.min(...allScenarios.map(s => s.cpaDashboard)).toFixed(0)} ج.م
                  </div>
                  <p className="text-xs text-slate-500 mt-1">في سيناريو 1M</p>
                </CardContent>
              </Card>
            </div>

            {/* Top Performers */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>أفضل 5 منتجات (500k جمهور)</CardTitle>
                <CardDescription>بناءً على ROAS</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topPerformers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="product" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                    <Bar dataKey="roas" fill="#0066cc" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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

          {/* Product Analysis Tab */}
          <TabsContent value="product-analysis" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>اختر منتج للتحليل</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.name} value={p.name}>
                        {p.name} ({p.price} ج.م)
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
                      {productScenarios.map((scenario, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-3 px-4 text-slate-900 font-medium">{scenario.audience}</td>
                          <td className="py-3 px-4 text-right text-slate-600">{scenario.cpm.toFixed(1)} ج.م</td>
                          <td className="py-3 px-4 text-right text-slate-600">{scenario.cpaDashboard.toFixed(0)} ج.م</td>
                          <td className="py-3 px-4 text-right text-slate-600">{scenario.aov.toFixed(0)} ج.م</td>
                          <td className="py-3 px-4 text-right font-semibold text-blue-600">{scenario.roas.toFixed(2)}x</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">{scenario.profitPerOrder.toFixed(0)} ج.م</td>
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
                <CardTitle>مقارنة السيناريوهات الثلاثة</CardTitle>
                <CardDescription>تحليل تأثير حجم الجمهور على الأداء</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="rounded-lg border border-slate-200 p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                    <h4 className="font-semibold text-slate-900 mb-4">السيناريو 1: 250k</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">CPM:</span>
                        <span className="font-semibold">50-90 ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">متوسط CPA:</span>
                        <span className="font-semibold text-blue-600">{Math.round(allScenarios.filter(s => s.audience === "250k").reduce((sum, s) => sum + s.cpaDashboard, 0) / allScenarios.filter(s => s.audience === "250k").length)} ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">متوسط ROAS:</span>
                        <span className="font-semibold text-green-600">{(allScenarios.filter(s => s.audience === "250k").reduce((sum, s) => sum + s.roas, 0) / allScenarios.filter(s => s.audience === "250k").length).toFixed(2)}x</span>
                      </div>
                      <p className="text-xs text-slate-600 pt-2 border-t border-slate-200 mt-2">جمهور مستهدف بدقة، تكلفة أعلى</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4 bg-gradient-to-br from-amber-50 to-amber-100">
                    <h4 className="font-semibold text-slate-900 mb-4">السيناريو 2: 500k ⭐</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">CPM:</span>
                        <span className="font-semibold">35-60 ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">متوسط CPA:</span>
                        <span className="font-semibold text-blue-600">{Math.round(allScenarios.filter(s => s.audience === "500k").reduce((sum, s) => sum + s.cpaDashboard, 0) / allScenarios.filter(s => s.audience === "500k").length)} ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">متوسط ROAS:</span>
                        <span className="font-semibold text-green-600">{(allScenarios.filter(s => s.audience === "500k").reduce((sum, s) => sum + s.roas, 0) / allScenarios.filter(s => s.audience === "500k").length).toFixed(2)}x</span>
                      </div>
                      <p className="text-xs text-slate-600 pt-2 border-t border-slate-200 mt-2">التوازن الأمثل</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4 bg-gradient-to-br from-green-50 to-green-100">
                    <h4 className="font-semibold text-slate-900 mb-4">السيناريو 3: 1M</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">CPM:</span>
                        <span className="font-semibold">25-40 ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">متوسط CPA:</span>
                        <span className="font-semibold text-blue-600">{Math.round(allScenarios.filter(s => s.audience === "1M").reduce((sum, s) => sum + s.cpaDashboard, 0) / allScenarios.filter(s => s.audience === "1M").length)} ج.م</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">متوسط ROAS:</span>
                        <span className="font-semibold text-green-600">{(allScenarios.filter(s => s.audience === "1M").reduce((sum, s) => sum + s.roas, 0) / allScenarios.filter(s => s.audience === "1M").length).toFixed(2)}x</span>
                      </div>
                      <p className="text-xs text-slate-600 pt-2 border-t border-slate-200 mt-2">جمهور واسع، تكلفة أقل</p>
                    </div>
                  </div>
                </div>

                {/* Comparison Chart */}
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    {
                      name: "250k",
                      cpa: Math.round(allScenarios.filter(s => s.audience === "250k").reduce((sum, s) => sum + s.cpaDashboard, 0) / allScenarios.filter(s => s.audience === "250k").length),
                      roas: Math.round((allScenarios.filter(s => s.audience === "250k").reduce((sum, s) => sum + s.roas, 0) / allScenarios.filter(s => s.audience === "250k").length) * 100) / 100,
                    },
                    {
                      name: "500k",
                      cpa: Math.round(allScenarios.filter(s => s.audience === "500k").reduce((sum, s) => sum + s.cpaDashboard, 0) / allScenarios.filter(s => s.audience === "500k").length),
                      roas: Math.round((allScenarios.filter(s => s.audience === "500k").reduce((sum, s) => sum + s.roas, 0) / allScenarios.filter(s => s.audience === "500k").length) * 100) / 100,
                    },
                    {
                      name: "1M",
                      cpa: Math.round(allScenarios.filter(s => s.audience === "1M").reduce((sum, s) => sum + s.cpaDashboard, 0) / allScenarios.filter(s => s.audience === "1M").length),
                      roas: Math.round((allScenarios.filter(s => s.audience === "1M").reduce((sum, s) => sum + s.roas, 0) / allScenarios.filter(s => s.audience === "1M").length) * 100) / 100,
                    },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip contentStyle={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="cpa" fill="#0066cc" name="متوسط CPA (ج.م)" radius={[8, 8, 0, 0]} />
                    <Bar yAxisId="right" dataKey="roas" fill="#10b981" name="متوسط ROAS" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl">التوصيات الاستراتيجية</CardTitle>
                <CardDescription>بناءً على تحليل السيناريوهات والبيانات الفعلية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recommendation 1 */}
                <div className="rounded-lg border-l-4 border-l-blue-600 bg-blue-50 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">1. استراتيجية البداية (Launch Strategy)</h3>
                  <p className="text-slate-700 mb-3">
                    ابدأ بجمهور <strong>500k</strong> (Lookalike 1%) للحصول على التوازن الأمثل بين التكلفة والجودة.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                    <li>CPM متوسط: 35-60 ج.م (أقل من 250k، أعلى من 1M)</li>
                    <li>متوسط ROAS: {(allScenarios.filter(s => s.audience === "500k").reduce((sum, s) => sum + s.roas, 0) / allScenarios.filter(s => s.audience === "500k").length).toFixed(2)}x</li>
                    <li>أفضل توازن بين الوصول والتحويل</li>
                  </ul>
                </div>

                {/* Recommendation 2 */}
                <div className="rounded-lg border-l-4 border-l-green-600 bg-green-50 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">2. استراتيجية التوسع (Scaling Strategy)</h3>
                  <p className="text-slate-700 mb-3">
                    بعد نجاح الحملة الأولية، انتقل إلى جمهور <strong>1M</strong> للمنتجات ذات ROAS العالي.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                    <li>المنتجات المرشحة: {topPerformers.slice(0, 3).map(p => p.product.split(" ")[0]).join(", ")}</li>
                    <li>متوسط ROAS في 1M: {(allScenarios.filter(s => s.audience === "1M").reduce((sum, s) => sum + s.roas, 0) / allScenarios.filter(s => s.audience === "1M").length).toFixed(2)}x</li>
                    <li>تقليل CPA بنسبة 30-40% مقارنة بـ 500k</li>
                  </ul>
                </div>

                {/* Recommendation 3 */}
                <div className="rounded-lg border-l-4 border-l-purple-600 bg-purple-50 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">3. تحسين وسيلة الدفع (Payment Optimization)</h3>
                  <p className="text-slate-700 mb-3">
                    التركيز على الدفع المسبق (Transfer + Card) يرفع معدل التسليم من 85% إلى 95%.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                    <li>تقليل CPA الفعلي بنسبة 10-15%</li>
                    <li>تقديم خصم 5% للتحويل المباشر و 3% للكارت</li>
                    <li>الحفاظ على سياسة 10% ديبوزيت للـ COD</li>
                  </ul>
                </div>

                {/* Recommendation 4 */}
                <div className="rounded-lg border-l-4 border-l-amber-600 bg-amber-50 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">4. هيكلة العروض (Offer Structure)</h3>
                  <p className="text-slate-700 mb-3">
                    استخدام الـ Upsell والشحن المجاني لرفع AOV وتحسين الأرباح.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                    <li>عرض "قطعتين" بخصم 10% لرفع AOV</li>
                    <li>عرض "3 قطع" بخصم 15% للمنتجات الاستهلاكية</li>
                    <li>شحن مجاني تلقائياً للطلبات أكثر من 3000 ج.م</li>
                  </ul>
                </div>

                {/* Recommendation 5 */}
                <div className="rounded-lg border-l-4 border-l-red-600 bg-red-50 p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">5. استراتيجية المنتجات (Product Strategy)</h3>
                  <p className="text-slate-700 mb-3">
                    تركيز الإنفاق على المنتجات ذات الأداء العالية والهامش الجيد.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                    <li>أفضل المنتجات: {topPerformers.slice(0, 3).map(p => p.product.split(" ")[0]).join(", ")}</li>
                    <li>متوسط ROAS للمنتجات الأفضل: {(topPerformers.reduce((sum, p) => sum + p.roas, 0) / topPerformers.length).toFixed(2)}x</li>
                    <li>متوسط الهامش: {Math.round(topPerformers.reduce((sum, p) => sum + p.margin, 0) / topPerformers.length)}%</li>
                  </ul>
                </div>

                {/* Key Metrics Summary */}
                <div className="mt-8 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
                  <h3 className="font-semibold mb-4 text-lg">ملخص المقاييس الرئيسية</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-300 text-sm">أفضل ROAS</p>
                      <p className="text-2xl font-bold">{Math.max(...allScenarios.map(s => s.roas)).toFixed(2)}x</p>
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm">أقل CPA</p>
                      <p className="text-2xl font-bold">{Math.min(...allScenarios.map(s => s.cpaDashboard)).toFixed(0)} ج.م</p>
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm">أعلى هامش</p>
                      <p className="text-2xl font-bold">{Math.max(...allScenarios.map(s => s.margin)).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-slate-300 text-sm">متوسط الربح</p>
                      <p className="text-2xl font-bold">{Math.round(allScenarios.reduce((sum, s) => sum + s.profitPerOrder, 0) / allScenarios.length)} ج.م</p>
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
          <p>تم بناء هذه المحاكاة بناءً على بيانات حقيقية من متجر American Box وسلوك السوق المصري عالي القيمة</p>
          <p className="mt-2">جميع الأرقام تقريبية وقابلة للتعديل حسب الأداء الفعلي</p>
        </div>
      </div>
    </div>
  );
}
