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

  // Default filter values matching actual data keys
  const uniqueCPMs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.cpm_scenario))), []);
  const uniqueCTRs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.ctr_scenario))), []);
  const uniqueCVRs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.cvr_scenario))), []);
  const uniqueBaskets = useMemo(() => Array.from(new Set(allScenarios.map(s => s.basket_scenario))), []);

  const [selectedCPM, setSelectedCPM] = useState(uniqueCPMs[1] || uniqueCPMs[0] || "");
  const [selectedCTR, setSelectedCTR] = useState(uniqueCTRs[1] || uniqueCTRs[0] || "");
  const [selectedCVR, setSelectedCVR] = useState(uniqueCVRs[1] || uniqueCVRs[0] || "");
  const [selectedBasket, setSelectedBasket] = useState(uniqueBaskets[2] || uniqueBaskets[0] || "");

  // Filter scenarios for the Filters tab
  const filteredScenarios = useMemo(() => allScenarios.filter(s =>
    s.cpm_scenario === selectedCPM &&
    s.ctr_scenario === selectedCTR &&
    s.cvr_scenario === selectedCVR &&
    s.basket_scenario === selectedBasket
  ), [selectedCPM, selectedCTR, selectedCVR, selectedBasket]);

  // Product-specific scenarios
  const productScenarios = useMemo(() => allScenarios.filter(s => s.item_name === selectedProduct), [selectedProduct]);
  const selectedProductRanking = productRanking.find(p => p.item_name === selectedProduct);

  // Chart data: top 5 products
  const topProducts = useMemo(() => productRanking.slice(0, 5).map(p => ({
    name: p.item_name.length > 25 ? p.item_name.substring(0, 25) + "..." : p.item_name,
    profit: p.median_profit,
    roas: p.median_roas,
  })), []);

  // Profitability pie chart
  const profitabilityChart = useMemo(() => [
    { name: "Profit", value: allScenarios.filter(s => s.profit_per_order > 0).length, fill: "#10b981" },
    { name: "Break Even", value: allScenarios.filter(s => Math.abs(s.profit_per_order) < 1).length, fill: "#f59e0b" },
    { name: "Loss", value: allScenarios.filter(s => s.profit_per_order < -1).length, fill: "#ef4444" },
  ], []);

  // CPM comparison for selected product
  const cpmComparison = useMemo(() => {
    const goodCTR = uniqueCTRs[1] || "Good CTR";
    const goodCVR = uniqueCVRs[1] || "Good CVR";
    const fairBasket = uniqueBaskets[2] || "Fair Basket";
    return productScenarios
      .filter(s => s.ctr_scenario === goodCTR && s.cvr_scenario === goodCVR && s.basket_scenario === fairBasket)
      .map(s => ({
        name: s.cpm_scenario,
        "الربح/أوردر": s.profit_per_order,
        "العائد/أوردر": s.revenue_per_order,
        "CPA Delivered": s.cpa_delivered,
      }));
  }, [productScenarios, uniqueCTRs, uniqueCVRs, uniqueBaskets]);

  const fmt = (n: number) => n?.toLocaleString("ar-EG", { maximumFractionDigits: 0 }) || "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
          محاكي الحملات والإيرادات - النسخة الشاملة
        </h1>
        <p className="text-slate-600">
          تحليل {overallStats.totalScenarios.toLocaleString()} سيناريو ({overallStats.totalProducts} منتج/باندل × 144 سيناريو) - جميع الأرقام <strong>لكل طلب واحد</strong>
        </p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-sm">إجمالي السيناريوهات</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-slate-900">{overallStats.totalScenarios.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{overallStats.totalProducts} منتج × 144 سيناريو</p>
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
              <CardTitle>السيناريوهات المطابقة ({filteredScenarios.length} منتج) - لكل طلب واحد</CardTitle>
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
                      .sort((a, b) => b.profit_per_order - a.profit_per_order)
                      .map((s, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${s.status === 'Loss' ? 'bg-red-50' : s.status === 'Profit' ? 'hover:bg-green-50' : 'hover:bg-yellow-50'}`}>
                        <td className="px-3 py-2 truncate" title={s.item_name}>{s.item_name.substring(0, 35)}</td>
                        <td className="px-3 py-2 text-slate-600">{fmt(s.selling_price)}</td>
                        <td className="px-3 py-2 font-medium">{fmt(s.aov)}</td>
                        <td className="px-3 py-2">{fmt(s.cpa_dashboard)}</td>
                        <td className="px-3 py-2 font-medium text-orange-600">{fmt(s.cpa_delivered)}</td>
                        <td className="px-3 py-2 text-blue-600">{fmt(s.max_cpa_allowed)}</td>
                        <td className="px-3 py-2 text-blue-700 font-medium">{fmt(s.revenue_per_order)}</td>
                        <td className="px-3 py-2 text-slate-500">{fmt(s.cogs_per_order)}</td>
                        <td className={`px-3 py-2 font-bold ${s.profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(s.profit_per_order)}</td>
                        <td className="px-3 py-2 font-semibold">{s.roas.toFixed(1)}x</td>
                        <td className="px-3 py-2">
                          <Badge variant={s.status === 'Profit' ? 'default' : s.status === 'Break Even' ? 'secondary' : 'destructive'}>
                            {s.status === 'Profit' ? 'ربح' : s.status === 'Loss' ? 'خسارة' : 'تعادل'}
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
              <CardTitle>ترتيب المنتجات حسب الربحية (لكل طلب واحد)</CardTitle>
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
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>الهامش %</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "100px" }}>العائد الوسيط</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "100px" }}>الربح الوسيط</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>ROAS الوسيط</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>معدل الربحية</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "80px" }}>رابح/خاسر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productRanking.map((p) => (
                      <tr key={p.rank} className={`border-b border-slate-100 ${p.median_profit < 0 ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-3 py-2 font-bold text-blue-600">#{p.rank}</td>
                        <td className="px-3 py-2 truncate" title={p.item_name}>{p.item_name.substring(0, 40)}</td>
                        <td className="px-3 py-2">
                          <Badge variant={p.item_type === 'bundle' ? 'default' : 'secondary'}>
                            {p.item_type === 'bundle' ? 'باندل' : 'منتج'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{fmt(p.selling_price)} ج.م</td>
                        <td className="px-3 py-2">{p.margin_pct.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-blue-600 font-medium">{fmt(p.median_revenue)} ج.م</td>
                        <td className={`px-3 py-2 font-bold ${p.median_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(p.median_profit)} ج.م</td>
                        <td className="px-3 py-2 font-semibold">{p.median_roas.toFixed(1)}x</td>
                        <td className="px-3 py-2">
                          <Badge variant={p.profitability_rate > 80 ? 'default' : p.profitability_rate > 50 ? 'secondary' : 'destructive'}>
                            {p.profitability_rate.toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-xs">{p.profit_count}/{p.loss_count}</td>
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">سعر البيع</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-slate-900">{fmt(selectedProductRanking.selling_price)} ج.م</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">العائد الوسيط / أوردر</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-blue-600">{fmt(selectedProductRanking.median_revenue)} ج.م</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">الربح الوسيط / أوردر</CardTitle></CardHeader>
                  <CardContent>
                    <div className={`text-xl font-bold ${selectedProductRanking.median_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmt(selectedProductRanking.median_profit)} ج.م
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">ROAS الوسيط</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-blue-600">{selectedProductRanking.median_roas.toFixed(2)}x</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">معدل الربحية</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-green-600">{selectedProductRanking.profitability_rate.toFixed(0)}%</div>
                    <p className="text-xs text-slate-500">{selectedProductRanking.profit_count} رابح / {selectedProductRanking.loss_count} خاسر</p>
                  </CardContent>
                </Card>
              </div>

              {/* CPM Comparison Chart */}
              {cpmComparison.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader><CardTitle>مقارنة تكلفة CPM (Good CTR + Good CVR + Fair Basket)</CardTitle></CardHeader>
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
                <CardHeader><CardTitle>جميع 144 سيناريو لهذا المنتج (لكل طلب واحد)</CardTitle></CardHeader>
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
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "80px" }}>CPA Del.</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "80px" }}>Max CPA</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "70px" }}>العائد</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "70px" }}>الربح</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "50px" }}>ROAS</th>
                          <th className="px-2 py-2 text-right font-semibold" style={{ width: "60px" }}>الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productScenarios
                          .sort((a, b) => b.profit_per_order - a.profit_per_order)
                          .map((s, idx) => (
                          <tr key={idx} className={`border-b border-slate-50 ${s.status === 'Loss' ? 'bg-red-50' : ''}`}>
                            <td className="px-2 py-1">{s.cpm_scenario}</td>
                            <td className="px-2 py-1">{s.ctr_scenario}</td>
                            <td className="px-2 py-1">{s.cvr_scenario}</td>
                            <td className="px-2 py-1">{s.basket_scenario}</td>
                            <td className="px-2 py-1">{fmt(s.aov)}</td>
                            <td className="px-2 py-1 text-orange-600">{fmt(s.cpa_delivered)}</td>
                            <td className="px-2 py-1 text-blue-600">{fmt(s.max_cpa_allowed)}</td>
                            <td className="px-2 py-1">{fmt(s.revenue_per_order)}</td>
                            <td className={`px-2 py-1 font-bold ${s.profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(s.profit_per_order)}</td>
                            <td className="px-2 py-1">{s.roas.toFixed(1)}x</td>
                            <td className="px-2 py-1">
                              <Badge className="text-[10px] px-1" variant={s.status === 'Profit' ? 'default' : s.status === 'Break Even' ? 'secondary' : 'destructive'}>
                                {s.status === 'Profit' ? 'ربح' : s.status === 'Loss' ? 'خسارة' : 'تعادل'}
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
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>CPA Del.</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>Max CPA</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "90px" }}>الربح/أوردر</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "60px" }}>ROAS</th>
                      <th className="px-3 py-3 text-right font-semibold" style={{ width: "70px" }}>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScenarios
                      .sort((a, b) => b.profit_per_order - a.profit_per_order)
                      .map((s, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${s.status === 'Loss' ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-3 py-2 truncate" title={s.item_name}>{s.item_name.substring(0, 35)}</td>
                        <td className="px-3 py-2">{fmt(s.selling_price)}</td>
                        <td className="px-3 py-2">{fmt(s.aov)}</td>
                        <td className="px-3 py-2 text-orange-600 font-medium">{fmt(s.cpa_delivered)}</td>
                        <td className="px-3 py-2 text-blue-600">{fmt(s.max_cpa_allowed)}</td>
                        <td className={`px-3 py-2 font-bold ${s.profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(s.profit_per_order)}</td>
                        <td className="px-3 py-2 font-semibold">{s.roas.toFixed(1)}x</td>
                        <td className="px-3 py-2">
                          <Badge variant={s.status === 'Profit' ? 'default' : s.status === 'Break Even' ? 'secondary' : 'destructive'}>
                            {s.status === 'Profit' ? 'ربح' : s.status === 'Loss' ? 'خسارة' : 'تعادل'}
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
