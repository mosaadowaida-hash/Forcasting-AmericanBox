import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell
} from "recharts";
import { allScenarios, productRanking, overallStats } from "@/data/comprehensiveData";
import { TrendingUp, DollarSign, Target, Zap } from "lucide-react";

export default function ComprehensiveDashboard() {
  const [selectedProduct, setSelectedProduct] = useState(productRanking[0]?.item_name || "");
  const [selectedCPM, setSelectedCPM] = useState("Medium CPM Cost");
  const [selectedCTR, setSelectedCTR] = useState("Good CTR");
  const [selectedCVR, setSelectedCVR] = useState("Good CVR");
  const [selectedBasket, setSelectedBasket] = useState("Fair Basket Size");

  // Get unique filter values
  const uniqueCPMs = Array.from(new Set(allScenarios.map(s => s.cpm_scenario)));
  const uniqueCTRs = Array.from(new Set(allScenarios.map(s => s.ctr_scenario)));
  const uniqueCVRs = Array.from(new Set(allScenarios.map(s => s.cvr_scenario)));
  const uniqueBaskets = Array.from(new Set(allScenarios.map(s => s.basket_scenario)));

  // Filter scenarios
  const filteredScenarios = allScenarios.filter(s =>
    s.cpm_scenario === selectedCPM &&
    s.ctr_scenario === selectedCTR &&
    s.cvr_scenario === selectedCVR &&
    s.basket_scenario === selectedBasket
  );

  // Product scenarios
  const productScenarios = allScenarios.filter(s => s.item_name === selectedProduct);
  const selectedProductRanking = productRanking.find(p => p.item_name === selectedProduct);

  // Chart data
  const topProducts = productRanking.slice(0, 5).map(p => ({
    name: p.item_name.substring(0, 20),
    profit: p.median_profit,
    roas: p.median_roas,
  }));

  const profitabilityChart = [
    { name: "Profit", value: allScenarios.filter(s => s.profit > 0).length, fill: "#10b981" },
    { name: "Break Even", value: allScenarios.filter(s => s.profit === 0).length, fill: "#f59e0b" },
    { name: "Loss", value: allScenarios.filter(s => s.profit < 0).length, fill: "#ef4444" },
  ];

  const cpmComparison = productScenarios
    .filter(s => s.ctr_scenario === "Good CTR" && s.cvr_scenario === "Good CVR")
    .map(s => ({
      name: s.cpm_scenario.split(' ')[0],
      profit: s.profit,
      revenue: s.revenue,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          محاكي الحملات والإيرادات - النسخة الشاملة
        </h1>
        <p className="text-slate-600">
          تحليل {overallStats.totalScenarios.toLocaleString()} سيناريو ({overallStats.totalProducts} منتج × 144 سيناريو)
        </p>
      </div>

      {/* Global Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">إجمالي السيناريوهات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{overallStats.totalScenarios.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{overallStats.totalProducts} منتج × 144 سيناريو</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">معدل الربحية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{overallStats.profitabilityRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">{overallStats.profitableScenarios} سيناريو رابح</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">متوسط الربح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{overallStats.medianProfit.toFixed(0)} ج.م</div>
            <p className="text-xs text-slate-500 mt-1">لكل طلب</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">متوسط ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{overallStats.medianRoas.toFixed(2)}x</div>
            <p className="text-xs text-slate-500 mt-1">العائد على الإنفاق</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="scenarios">السيناريوهات</TabsTrigger>
          <TabsTrigger value="ranking">ترتيب المنتجات</TabsTrigger>
          <TabsTrigger value="product">تحليل المنتج</TabsTrigger>
          <TabsTrigger value="filters">تصفية متقدمة</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>توزيع الربحية</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={profitabilityChart}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {profitabilityChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>أفضل 5 منتجات (الربح الوسيط)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="profit" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>السيناريوهات المطابقة ({filteredScenarios.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-right font-medium w-40">المنتج</th>
                      <th className="px-4 py-2 text-right font-medium w-20">CPA</th>
                      <th className="px-4 py-2 text-right font-medium w-16">ROAS</th>
                      <th className="px-4 py-2 text-right font-medium w-24">الربح</th>
                      <th className="px-4 py-2 text-right font-medium w-20">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScenarios.slice(0, 20).map((scenario, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 w-40">{scenario.item_name.substring(0, 30)}</td>
                        <td className="px-4 py-2 w-20">{scenario.cpa_dashboard} ج.م</td>
                        <td className="px-4 py-2 font-semibold w-16">{scenario.roas}x</td>
                        <td className="px-4 py-2 text-green-600 font-semibold w-24">{scenario.profit} ج.م</td>
                        <td className="px-4 py-2 w-20">
                          <Badge variant={scenario.status === 'Profit' ? 'default' : scenario.status === 'Break Even' ? 'secondary' : 'destructive'}>
                            {scenario.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>ترتيب المنتجات حسب الربحية</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-right font-medium w-12">الترتيب</th>
                      <th className="px-4 py-2 text-right font-medium w-40">المنتج</th>
                      <th className="px-4 py-2 text-right font-medium w-24">العائد الوسيط</th>
                      <th className="px-4 py-2 text-right font-medium w-24">الربح الوسيط</th>
                      <th className="px-4 py-2 text-right font-medium w-20">ROAS الوسيط</th>
                      <th className="px-4 py-2 text-right font-medium w-24">معدل الربحية %</th>
                      <th className="px-4 py-2 text-right font-medium w-20">السعر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productRanking.map((product) => (
                      <tr key={product.rank} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 font-bold text-blue-600 w-12">#{product.rank}</td>
                        <td className="px-4 py-2 w-40">{product.item_name.substring(0, 40)}</td>
                        <td className="px-4 py-2 text-blue-600 font-semibold w-24">{product.median_revenue} ج.م</td>
                        <td className="px-4 py-2 text-green-600 font-semibold w-24">{product.median_profit} ج.م</td>
                        <td className="px-4 py-2 font-semibold w-20">{product.median_roas}x</td>
                        <td className="px-4 py-2 w-24">
                          <Badge variant={product.profitability_rate > 95 ? 'default' : 'secondary'}>
                            {product.profitability_rate}%
                          </Badge>
                        </td>
                        <td className="px-4 py-2 w-20">{product.selling_price} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Analysis Tab */}
        <TabsContent value="product" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>اختر منتج للتحليل</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productRanking.map((product) => (
                    <SelectItem key={product.item_name} value={product.item_name}>
                      #{product.rank} - {product.item_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedProductRanking && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">العائد الوسيط</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{selectedProductRanking.median_revenue} ج.م</div>
                    <p className="text-xs text-slate-500 mt-1">ما يدفعه العميل</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">الربح الوسيط</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{selectedProductRanking.median_profit} ج.م</div>
                    <p className="text-xs text-slate-500 mt-1">بعد التكاليف</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">ROAS الوسيط</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{selectedProductRanking.median_roas}x</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">معدل الربحية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{selectedProductRanking.profitability_rate}%</div>
                    <p className="text-xs text-slate-500 mt-1">{selectedProductRanking.profit_count} من {selectedProductRanking.total_scenarios}</p>
                  </CardContent>
                </Card>
              </div>

              {cpmComparison.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>مقارنة CPM (Good CTR & CVR)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cpmComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="profit" fill="#10b981" name="الربح" />
                        <Bar dataKey="revenue" fill="#3b82f6" name="العائد" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Filters Tab */}
        <TabsContent value="filters" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">CPM</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCPM} onValueChange={setSelectedCPM}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCPMs.map((cpm) => (
                      <SelectItem key={cpm} value={cpm}>{cpm}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">CTR</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCTR} onValueChange={setSelectedCTR}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCTRs.map((ctr) => (
                      <SelectItem key={ctr} value={ctr}>{ctr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">CVR</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedCVR} onValueChange={setSelectedCVR}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueCVRs.map((cvr) => (
                      <SelectItem key={cvr} value={cvr}>{cvr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-sm">Basket Size</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedBasket} onValueChange={setSelectedBasket}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueBaskets.map((basket) => (
                      <SelectItem key={basket} value={basket}>{basket}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
