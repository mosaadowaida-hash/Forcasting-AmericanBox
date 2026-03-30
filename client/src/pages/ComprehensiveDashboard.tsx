import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ScatterChart, Scatter, PieChart, Pie, Cell
} from "recharts";
import {
  allScenarios, productRanking, getProductScenarios, getScenariosByFilters,
  getUniqueCPMScenarios, getUniqueCTRScenarios, getUniqueCVRScenarios,
  getUniqueBasketScenarios, getStatistics, getTopProfitableProducts
} from "@/data/comprehensiveData";
import { TrendingUp, DollarSign, Target, Zap, Package, TrendingDown } from "lucide-react";

export default function ComprehensiveDashboard() {
  const [selectedProduct, setSelectedProduct] = useState(productRanking[0]?.product_name || "");
  const [selectedCPM, setSelectedCPM] = useState("Medium CPM Cost");
  const [selectedCTR, setSelectedCTR] = useState("Good CTR");
  const [selectedCVR, setSelectedCVR] = useState("Good CVR");
  const [selectedBasket, setSelectedBasket] = useState("Fair Basket Size");

  const stats = getStatistics();
  const filteredScenarios = getScenariosByFilters({
    cpmScenario: selectedCPM,
    ctrScenario: selectedCTR,
    cvrScenario: selectedCVR,
    basketScenario: selectedBasket,
  });

  const productScenarios = getProductScenarios(selectedProduct);
  const selectedScenario = productScenarios.find(
    s => s.cpm_scenario === selectedCPM && s.ctr_scenario === selectedCTR &&
         s.cvr_scenario === selectedCVR && s.basket_scenario === selectedBasket
  );

  const selectedProductRanking = productRanking.find(p => p.product_name === selectedProduct);

  // Chart data for scenario comparison
  const scenarioComparison = productScenarios
    .filter(s => s.ctr_scenario === "Good CTR" && s.cvr_scenario === "Good CVR")
    .map(s => ({
      name: `${s.cpm_scenario.split(' ')[0]} CPM`,
      profit: s.profit_per_order,
      roas: s.roas,
      cpa: s.cpa_dashboard,
    }));

  const profitabilityChart = [
    { name: "Profit", value: stats.profitScenarios, fill: "#10b981" },
    { name: "Break Even", value: stats.breakEvenScenarios, fill: "#f59e0b" },
    { name: "Loss", value: stats.lossScenarios, fill: "#ef4444" },
  ];

  const topProducts = getTopProfitableProducts(5).map(p => ({
    name: p.product_name.substring(0, 20),
    profit: p.median_profit,
    roas: p.median_roas,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          محاكي الحملات والإيرادات - النسخة الشاملة
        </h1>
        <p className="text-slate-600">
          تحليل 6,048 سيناريو (144 سيناريو × 42 منتج) بدقة شديدة
        </p>
      </div>

      {/* Global Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">إجمالي السيناريوهات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.totalScenarios.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">42 منتج × 144 سيناريو</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">معدل الربحية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.profitabilityRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">{stats.profitScenarios + stats.breakEvenScenarios} سيناريو رابح</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">متوسط الربح</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">{stats.avgProfit.toLocaleString()} ج.م</div>
            <p className="text-xs text-slate-500 mt-1">لكل طلب</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">متوسط ROAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.avgROAS}x</div>
            <p className="text-xs text-slate-500 mt-1">العائد على الإنفاق</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-white border border-slate-200">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="scenarios">السيناريوهات</TabsTrigger>
          <TabsTrigger value="ranking">ترتيب المنتجات</TabsTrigger>
          <TabsTrigger value="product-analysis">تحليل المنتج</TabsTrigger>
          <TabsTrigger value="filters">تصفية متقدمة</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profitability Distribution */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>توزيع الربحية</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={profitabilityChart} cx="50%" cy="50%" labelLine={false} label dataKey="value">
                      {profitabilityChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top 5 Products */}
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
                    <Bar dataKey="profit" fill="#3b82f6" name="الربح (ج.م)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Scenario Comparison */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>مقارنة السيناريوهات (Good CTR & CVR)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scenarioComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="profit" fill="#10b981" name="الربح (ج.م)" />
                  <Bar yAxisId="right" dataKey="roas" fill="#3b82f6" name="ROAS" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>تصفية السيناريوهات</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">CPM</label>
                <Select value={selectedCPM} onValueChange={setSelectedCPM}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueCPMScenarios().map(cpm => (
                      <SelectItem key={cpm} value={cpm}>{cpm}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">CTR</label>
                <Select value={selectedCTR} onValueChange={setSelectedCTR}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueCTRScenarios().map(ctr => (
                      <SelectItem key={ctr} value={ctr}>{ctr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">CVR</label>
                <Select value={selectedCVR} onValueChange={setSelectedCVR}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueCVRScenarios().map(cvr => (
                      <SelectItem key={cvr} value={cvr}>{cvr}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Basket Size</label>
                <Select value={selectedBasket} onValueChange={setSelectedBasket}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getUniqueBasketScenarios().map(basket => (
                      <SelectItem key={basket} value={basket}>{basket}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Scenarios Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>السيناريوهات المطابقة ({filteredScenarios.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-right font-medium">المنتج</th>
                      <th className="px-4 py-2 text-right font-medium">CPA</th>
                      <th className="px-4 py-2 text-right font-medium">ROAS</th>
                      <th className="px-4 py-2 text-right font-medium">الربح</th>
                      <th className="px-4 py-2 text-right font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScenarios.slice(0, 20).map((scenario, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2">{scenario.item_name.substring(0, 30)}</td>
                        <td className="px-4 py-2">{scenario.cpa_dashboard} ج.م</td>
                        <td className="px-4 py-2 font-semibold">{scenario.roas}x</td>
                        <td className="px-4 py-2 text-green-600 font-semibold">{scenario.profit_per_order} ج.م (ربح)</td>
                        <td className="px-4 py-2">
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
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-right font-medium">الترتيب</th>
                      <th className="px-4 py-2 text-right font-medium">المنتج</th>
                      <th className="px-4 py-2 text-right font-medium">الربح الوسيط</th>
                      <th className="px-4 py-2 text-right font-medium">ROAS الوسيط</th>
                      <th className="px-4 py-2 text-right font-medium">معدل الربحية %</th>
                      <th className="px-4 py-2 text-right font-medium">السعر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productRanking.map((product) => (
                      <tr key={product.rank} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-2 font-bold text-blue-600">#{product.rank}</td>
                        <td className="px-4 py-2">{product.product_name.substring(0, 40)}</td>
                        <td className="px-4 py-2 text-green-600 font-semibold">{product.median_profit} ج.م</td>
                        <td className="px-4 py-2 font-semibold">{product.median_roas}x</td>
                        <td className="px-4 py-2">
                          <Badge variant={product.profitability_rate > 95 ? 'default' : 'secondary'}>
                            {product.profitability_rate}%
                          </Badge>
                        </td>
                        <td className="px-4 py-2">{product.selling_price} ج.م</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Analysis Tab */}
        <TabsContent value="product-analysis" className="space-y-6">
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
                    <SelectItem key={product.product_name} value={product.product_name}>
                      #{product.rank} - {product.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedProductRanking && (
            <>
              {/* Product Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">الربح الوسيط</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{selectedProductRanking.median_profit} ج.م</div>
                    <p className="text-xs text-slate-500 mt-1">الربح الفعلي بعد التكاليف</p>
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
                    <CardTitle className="text-sm">CPA الوسيط</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedProductRanking.median_cpa} ج.م</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">معدل الربحية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{selectedProductRanking.profitability_rate}%</div>
                  </CardContent>
                </Card>
              </div>

              {/* Market Category */}
              {selectedProductRanking.market_research && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle>بحث السوق - {selectedProductRanking.market_category}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-600">الطلب</p>
                        <p className="text-lg font-bold">{selectedProductRanking.market_research.demand}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">معدل النمو</p>
                        <p className="text-lg font-bold">{selectedProductRanking.market_research.growth}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">مستوى المنافسة</p>
                        <p className="text-lg font-bold">{selectedProductRanking.market_research.competition}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600">حساسية السعر</p>
                        <p className="text-lg font-bold">{selectedProductRanking.market_research.price_sensitivity}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">الجمهور المستهدف</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProductRanking.market_research.target_audience?.map((audience: string) => (
                          <Badge key={audience} variant="secondary">{audience}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Advanced Filters Tab */}
        <TabsContent value="filters" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>تصفية متقدمة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">يمكنك تحديد السيناريوهات المخصصة أعلاه وسيتم عرض النتائج في تبويب السيناريوهات</p>
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <p className="font-medium">السيناريو المختار حالياً:</p>
                <ul className="text-sm space-y-1">
                  <li>CPM: {selectedCPM}</li>
                  <li>CTR: {selectedCTR}</li>
                  <li>CVR: {selectedCVR}</li>
                  <li>Basket Size: {selectedBasket}</li>
                </ul>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  عدد السيناريوهات المطابقة: <span className="font-bold">{filteredScenarios.length}</span> من أصل {stats.totalScenarios}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
