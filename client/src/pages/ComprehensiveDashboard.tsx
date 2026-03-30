import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { allScenarios, productRanking, overallStats } from "@/data/comprehensiveData";
import type { Scenario } from "@/data/comprehensiveData";

export default function ComprehensiveDashboard() {
  const [selectedProduct, setSelectedProduct] = useState(productRanking[0]?.item_name || "");

  // Get unique filter values from actual data
  const uniqueCPMs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.cpm_label))), []);
  const uniqueCTRs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.ctr_label))), []);
  const uniqueCVRs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.cvr_label))), []);
  const uniqueBaskets = useMemo(() => Array.from(new Set(allScenarios.map(s => s.basket_label))), []);

  const [selectedCPM, setSelectedCPM] = useState(uniqueCPMs[1] || uniqueCPMs[0] || "");
  const [selectedCTR, setSelectedCTR] = useState(uniqueCTRs[1] || uniqueCTRs[0] || "");
  const [selectedCVR, setSelectedCVR] = useState(uniqueCVRs[1] || uniqueCVRs[0] || "");
  const [selectedBasket, setSelectedBasket] = useState(uniqueBaskets[0] || "");

  // Filter scenarios for the Scenarios & Filters tabs
  const filteredScenarios = useMemo(() => allScenarios.filter(s =>
    s.cpm_label === selectedCPM &&
    s.ctr_label === selectedCTR &&
    s.cvr_label === selectedCVR &&
    s.basket_label === selectedBasket
  ), [selectedCPM, selectedCTR, selectedCVR, selectedBasket]);

  // Product-specific scenarios
  const productScenarios = useMemo(() => allScenarios.filter(s => s.item_name === selectedProduct), [selectedProduct]);
  const selectedProductRanking = productRanking.find(p => p.item_name === selectedProduct);

  // Chart data: top 5 products by median profit
  const topProducts = useMemo(() => productRanking.slice(0, 5).map(p => ({
    name: p.item_name.length > 25 ? p.item_name.substring(0, 25) + "..." : p.item_name,
    profit: p.profit_median,
    roas: p.roas_median,
  })), []);

  // Profitability pie chart
  const profitabilityChart = useMemo(() => [
    { name: "ربح", value: overallStats.profitableScenarios, fill: "#10b981" },
    { name: "خسارة", value: overallStats.lossScenarios, fill: "#ef4444" },
  ], []);

  // CPM comparison for selected product
  const cpmComparison = useMemo(() => {
    return productScenarios
      .filter(s => s.ctr_label === (uniqueCTRs[1] || "") && s.cvr_label === (uniqueCVRs[1] || "") && s.basket_label === (uniqueBaskets[0] || ""))
      .map(s => ({
        name: s.cpm_label,
        "الربح/أوردر": s.net_profit_per_order,
        "العائد/أوردر": s.revenue_per_order,
        "CPA Delivered": s.cpa_delivered,
      }));
  }, [productScenarios, uniqueCTRs, uniqueCVRs, uniqueBaskets]);

  const fmt = (n: number | undefined) => (n ?? 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          محاكي الحملات والإيرادات - النسخة الشاملة
        </h1>
        <p className="text-slate-600">
          تحليل {overallStats.totalScenarios.toLocaleString()} سيناريو ({overallStats.totalProducts} منتج/باندل &times; 144 سيناريو) - جميع الأرقام <strong>لكل طلب واحد مُسلَّم</strong>
        </p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-sm">إجمالي السيناريوهات</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">{overallStats.totalScenarios.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{overallStats.totalProducts} منتج &times; 144 سيناريو</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-sm">معدل الربحية</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-600">{overallStats.profitabilityRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-500 mt-1">{overallStats.profitableScenarios.toLocaleString()} سيناريو رابح</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-sm">الربح الوسيط / أوردر</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-600">{fmt(overallStats.medianProfit)} ج.م</div>
            <p className="text-xs text-slate-500 mt-1">لكل طلب مُسلَّم</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-sm">ROAS الوسيط</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{overallStats.medianRoas.toFixed(2)}x</div>
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

        {/* ========== Overview Tab ========== */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader><CardTitle>توزيع الربحية (جميع السيناريوهات)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={profitabilityChart} cx="50%" cy="50%" labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                      outerRadius={80} dataKey="value">
                      {profitabilityChart.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader><CardTitle>أفضل 5 منتجات (الربح الوسيط / أوردر)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} fontSize={11} />
                    <YAxis />
                    <Tooltip formatter={(v: number) => `${v.toLocaleString()} ج.م`} />
                    <Bar dataKey="profit" fill="#10b981" name="الربح/أوردر" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== Scenarios Tab ========== */}
        <TabsContent value="scenarios" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Select value={selectedCPM} onValueChange={setSelectedCPM}>
              <SelectTrigger><SelectValue placeholder="CPM" /></SelectTrigger>
              <SelectContent>{uniqueCPMs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedCTR} onValueChange={setSelectedCTR}>
              <SelectTrigger><SelectValue placeholder="CTR" /></SelectTrigger>
              <SelectContent>{uniqueCTRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedCVR} onValueChange={setSelectedCVR}>
              <SelectTrigger><SelectValue placeholder="CVR" /></SelectTrigger>
              <SelectContent>{uniqueCVRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedBasket} onValueChange={setSelectedBasket}>
              <SelectTrigger><SelectValue placeholder="Basket" /></SelectTrigger>
              <SelectContent>{uniqueBaskets.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>السيناريوهات المطابقة ({filteredScenarios.length} منتج) - لكل طلب مُسلَّم واحد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" style={{ tableLayout: "fixed" }}>
                  <thead className="bg-slate-100 border-b-2 border-slate-300 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "200px" }}>المنتج</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>السعر</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>AOV</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "100px" }}>CPA Dashboard</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "100px" }}>CPA Delivered</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "100px" }}>Max CPA</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>العائد/أوردر</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>COGS/أوردر</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>الربح/أوردر</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "60px" }}>ROAS</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScenarios
                      .sort((a, b) => b.net_profit_per_order - a.net_profit_per_order)
                      .map((s, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${s.status === 'خسارة' ? 'bg-red-50' : s.status === 'ربح' ? 'hover:bg-green-50' : 'hover:bg-yellow-50'}`}>
                        <td className="px-3 py-2 truncate" title={s.item_name}>{s.item_name.substring(0, 35)}</td>
                        <td className="px-3 py-2 text-slate-600">{fmt(s.selling_price)}</td>
                        <td className="px-3 py-2 font-medium">{fmt(s.aov)}</td>
                        <td className="px-3 py-2">{fmt(s.cpa_dashboard)}</td>
                        <td className="px-3 py-2 font-medium text-orange-600">{fmt(s.cpa_delivered)}</td>
                        <td className="px-3 py-2 text-blue-600">{fmt(s.max_cpa_allowed)}</td>
                        <td className="px-3 py-2 text-blue-700 font-medium">{fmt(s.revenue_per_order)}</td>
                        <td className="px-3 py-2 text-slate-500">{fmt(s.cogs_per_order)}</td>
                        <td className={`px-3 py-2 font-bold ${s.net_profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(s.net_profit_per_order)}</td>
                        <td className="px-3 py-2 font-semibold">{s.roas.toFixed(1)}x</td>
                        <td className="px-3 py-2">
                          <Badge variant={s.status === 'ربح' ? 'default' : s.status === 'نقطة التعادل' ? 'secondary' : 'destructive'}>
                            {s.status}
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

        {/* ========== Ranking Tab ========== */}
        <TabsContent value="ranking" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>ترتيب المنتجات حسب الربحية (لكل طلب مُسلَّم واحد)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" style={{ tableLayout: "fixed" }}>
                  <thead className="bg-slate-100 border-b-2 border-slate-300 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "40px" }}>#</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "200px" }}>المنتج</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "60px" }}>النوع</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>السعر</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "100px" }}>العائد الوسيط</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "100px" }}>الربح الوسيط</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>ROAS الوسيط</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>Max CPA</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>معدل الربحية</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>رابح/خاسر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productRanking.map((p) => (
                      <tr key={p.rank} className={`border-b border-slate-100 ${p.profit_median < 0 ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-3 py-2 font-bold text-blue-600">#{p.rank}</td>
                        <td className="px-3 py-2 truncate" title={p.item_name}>{p.item_name.substring(0, 40)}</td>
                        <td className="px-3 py-2">
                          <Badge variant={p.item_type === 'bundle' ? 'default' : 'secondary'}>
                            {p.item_type === 'bundle' ? 'باندل' : 'منتج'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{fmt(p.selling_price)} ج.م</td>
                        <td className="px-3 py-2 text-blue-600 font-medium">{fmt(p.revenue_median)} ج.م</td>
                        <td className={`px-3 py-2 font-bold ${p.profit_median >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(p.profit_median)} ج.م</td>
                        <td className="px-3 py-2 font-semibold">{p.roas_median.toFixed(1)}x</td>
                        <td className="px-3 py-2 text-blue-600">{fmt(p.max_cpa_allowed)} ج.م</td>
                        <td className="px-3 py-2">
                          <Badge variant={p.profitability_rate > 80 ? 'default' : p.profitability_rate > 50 ? 'secondary' : 'destructive'}>
                            {p.profitability_rate.toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs">{p.profit_scenarios}/{p.loss_scenarios}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Product Analysis Tab ========== */}
        <TabsContent value="product" className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle>اختر منتج للتحليل التفصيلي</CardTitle></CardHeader>
            <CardContent>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {productRanking.map((p) => (
                    <SelectItem key={p.item_name} value={p.item_name}>
                      #{p.rank} - {p.item_name} ({fmt(p.selling_price)} ج.م)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedProductRanking && (
            <>
              {/* Product KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">سعر البيع</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-slate-900">{fmt(selectedProductRanking.selling_price)} ج.م</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">العائد الوسيط / أوردر</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-blue-600">{fmt(selectedProductRanking.revenue_median)} ج.م</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">الربح الوسيط / أوردر</CardTitle></CardHeader>
                  <CardContent>
                    <div className={`text-xl font-bold ${selectedProductRanking.profit_median >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmt(selectedProductRanking.profit_median)} ج.م
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">ROAS الوسيط</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-blue-600">{selectedProductRanking.roas_median.toFixed(2)}x</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">Max CPA المسموح</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-orange-600">{fmt(selectedProductRanking.max_cpa_allowed)} ج.م</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">معدل الربحية</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-green-600">{selectedProductRanking.profitability_rate.toFixed(0)}%</div>
                    <p className="text-xs text-slate-500">{selectedProductRanking.profit_scenarios} رابح / {selectedProductRanking.loss_scenarios} خاسر</p>
                  </CardContent>
                </Card>
              </div>

              {/* Best/Worst Scenarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-0 shadow-lg border-l-4 border-l-green-500">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-green-700">أفضل سيناريو</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-600 mb-2">{selectedProductRanking.best_scenario}</p>
                    <div className="flex gap-4">
                      <div><span className="text-xs text-slate-500">الربح:</span> <span className="font-bold text-green-600">{fmt(selectedProductRanking.best_profit)} ج.م</span></div>
                      <div><span className="text-xs text-slate-500">ROAS:</span> <span className="font-bold text-green-600">{selectedProductRanking.best_roas.toFixed(1)}x</span></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg border-l-4 border-l-red-500">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-red-700">أسوأ سيناريو</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-xs text-slate-600 mb-2">{selectedProductRanking.worst_scenario}</p>
                    <div className="flex gap-4">
                      <div><span className="text-xs text-slate-500">الربح:</span> <span className="font-bold text-red-600">{fmt(selectedProductRanking.worst_profit)} ج.م</span></div>
                      <div><span className="text-xs text-slate-500">ROAS:</span> <span className="font-bold text-red-600">{selectedProductRanking.worst_roas.toFixed(1)}x</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CPM Comparison Chart */}
              {cpmComparison.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader><CardTitle>مقارنة تكلفة CPM (Good CTR + Good CVR + Single Item)</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={cpmComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(v: number) => `${v.toLocaleString()} ج.م`} />
                        <Legend />
                        <Bar dataKey="الربح/أوردر" fill="#10b981" />
                        <Bar dataKey="العائد/أوردر" fill="#3b82f6" />
                        <Bar dataKey="CPA Delivered" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* All 144 scenarios for this product */}
              <Card className="border-0 shadow-lg">
                <CardHeader><CardTitle>جميع 144 سيناريو لهذا المنتج (لكل طلب مُسلَّم واحد)</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-xs border-collapse" style={{ tableLayout: "fixed" }}>
                      <thead className="bg-slate-100 border-b-2 border-slate-300 sticky top-0 z-10">
                        <tr>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "90px" }}>CPM</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "80px" }}>CTR</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "80px" }}>CVR</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "80px" }}>Basket</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "70px" }}>AOV</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "80px" }}>CPA Dash.</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "80px" }}>CPA Del.</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "80px" }}>Max CPA</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "70px" }}>العائد</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "70px" }}>COGS</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "70px" }}>الربح</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "50px" }}>ROAS</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "60px" }}>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productScenarios
                          .sort((a, b) => b.net_profit_per_order - a.net_profit_per_order)
                          .map((s, idx) => (
                          <tr key={idx} className={`border-b border-slate-50 ${s.status === 'خسارة' ? 'bg-red-50' : ''}`}>
                            <td className="px-2 py-1">{s.cpm_label}</td>
                            <td className="px-2 py-1">{s.ctr_label}</td>
                            <td className="px-2 py-1">{s.cvr_label}</td>
                            <td className="px-2 py-1">{s.basket_label}</td>
                            <td className="px-2 py-1">{fmt(s.aov)}</td>
                            <td className="px-2 py-1">{fmt(s.cpa_dashboard)}</td>
                            <td className="px-2 py-1 text-orange-600">{fmt(s.cpa_delivered)}</td>
                            <td className="px-2 py-1 text-blue-600">{fmt(s.max_cpa_allowed)}</td>
                            <td className="px-2 py-1">{fmt(s.revenue_per_order)}</td>
                            <td className="px-2 py-1 text-slate-500">{fmt(s.cogs_per_order)}</td>
                            <td className={`px-2 py-1 font-bold ${s.net_profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(s.net_profit_per_order)}</td>
                            <td className="px-2 py-1">{s.roas.toFixed(1)}x</td>
                            <td className="px-2 py-1">
                              <Badge className="text-[10px] px-1" variant={s.status === 'ربح' ? 'default' : s.status === 'نقطة التعادل' ? 'secondary' : 'destructive'}>
                                {s.status}
                              </Badge>
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
        </TabsContent>

        {/* ========== Filters Tab ========== */}
        <TabsContent value="filters" className="space-y-6">
          <Card className="border-0 shadow-lg p-4">
            <CardHeader><CardTitle>تصفية متقدمة - اختر السيناريو</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">تكلفة CPM</label>
                  <Select value={selectedCPM} onValueChange={setSelectedCPM}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{uniqueCPMs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">معدل النقر CTR</label>
                  <Select value={selectedCTR} onValueChange={setSelectedCTR}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{uniqueCTRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">معدل التحويل CVR</label>
                  <Select value={selectedCVR} onValueChange={setSelectedCVR}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{uniqueCVRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">حجم السلة</label>
                  <Select value={selectedBasket} onValueChange={setSelectedBasket}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{uniqueBaskets.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtered results table */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>النتائج ({filteredScenarios.length} منتج) - {selectedCPM} + {selectedCTR} + {selectedCVR} + {selectedBasket}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" style={{ tableLayout: "fixed" }}>
                  <thead className="bg-slate-100 border-b-2 border-slate-300 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "200px" }}>المنتج</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>السعر</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>AOV</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>CPA Dash.</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>CPA Del.</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>Max CPA</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>العائد/أوردر</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>COGS/أوردر</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>الربح/أوردر</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "60px" }}>ROAS</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "70px" }}>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScenarios
                      .sort((a, b) => b.net_profit_per_order - a.net_profit_per_order)
                      .map((s, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${s.status === 'خسارة' ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-3 py-2 truncate" title={s.item_name}>{s.item_name.substring(0, 35)}</td>
                        <td className="px-3 py-2">{fmt(s.selling_price)}</td>
                        <td className="px-3 py-2">{fmt(s.aov)}</td>
                        <td className="px-3 py-2">{fmt(s.cpa_dashboard)}</td>
                        <td className="px-3 py-2 text-orange-600 font-medium">{fmt(s.cpa_delivered)}</td>
                        <td className="px-3 py-2 text-blue-600">{fmt(s.max_cpa_allowed)}</td>
                        <td className="px-3 py-2 text-blue-700 font-medium">{fmt(s.revenue_per_order)}</td>
                        <td className="px-3 py-2 text-slate-500">{fmt(s.cogs_per_order)}</td>
                        <td className={`px-3 py-2 font-bold ${s.net_profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(s.net_profit_per_order)}</td>
                        <td className="px-3 py-2 font-semibold">{s.roas.toFixed(1)}x</td>
                        <td className="px-3 py-2">
                          <Badge variant={s.status === 'ربح' ? 'default' : s.status === 'نقطة التعادل' ? 'secondary' : 'destructive'}>
                            {s.status}
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
      </Tabs>
    </div>
  );
}
