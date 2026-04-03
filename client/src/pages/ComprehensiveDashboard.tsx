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
import marketResearchMapData from "@/data/market_research_map.json";
const marketResearchMap = marketResearchMapData as Record<string, any>;

export default function ComprehensiveDashboard() {
  const [selectedProduct, setSelectedProduct] = useState(productRanking[0]?.item_name || "");

  const uniqueCPMs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.cpm_label))), []);
  const uniqueCTRs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.ctr_label))), []);
  const uniqueCVRs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.cvr_label))), []);
  const uniqueBaskets = useMemo(() => Array.from(new Set(allScenarios.map(s => s.basket_label))), []);

  const [selectedCPM, setSelectedCPM] = useState(uniqueCPMs[1] || uniqueCPMs[0] || "");
  const [selectedCTR, setSelectedCTR] = useState(uniqueCTRs[1] || uniqueCTRs[0] || "");
  const [selectedCVR, setSelectedCVR] = useState(uniqueCVRs[1] || uniqueCVRs[0] || "");
  const [selectedBasket, setSelectedBasket] = useState(uniqueBaskets[0] || "");

  const filteredScenarios = useMemo(() => allScenarios.filter(s =>
    s.cpm_label === selectedCPM &&
    s.ctr_label === selectedCTR &&
    s.cvr_label === selectedCVR &&
    s.basket_label === selectedBasket
  ), [selectedCPM, selectedCTR, selectedCVR, selectedBasket]);

  const productScenarios = useMemo(() => allScenarios.filter(s => s.item_name === selectedProduct), [selectedProduct]);
  const selectedProductRanking = productRanking.find(p => p.item_name === selectedProduct);

  const topProducts = useMemo(() => productRanking.slice(0, 5).map(p => ({
    name: p.item_name.length > 20 ? p.item_name.substring(0, 20) + "..." : p.item_name,
    profit: p.profit_median,
    roas: p.roas_median,
  })), []);

  const profitabilityChart = useMemo(() => [
    { name: "ربح", value: overallStats.profitableScenarios, fill: "#10b981" },
    { name: "خسارة", value: overallStats.lossScenarios, fill: "#ef4444" },
  ], []);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-3 sm:p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="mb-4 sm:mb-6 md:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
          محاكي الحملات والإيرادات - النسخة الشاملة
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          تحليل {overallStats.totalScenarios.toLocaleString()} سيناريو ({overallStats.totalProducts} منتج/باندل &times; 144 سيناريو) - جميع الأرقام <strong>لكل طلب واحد مُسلَّم</strong>
        </p>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6"><CardTitle className="text-[10px] sm:text-xs md:text-sm">إجمالي السيناريوهات</CardTitle></CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">{overallStats.totalScenarios.toLocaleString()}</div>
            <p className="text-[9px] sm:text-xs text-slate-500 mt-1">{overallStats.totalProducts} منتج &times; 144 سيناريو</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6"><CardTitle className="text-[10px] sm:text-xs md:text-sm">معدل الربحية</CardTitle></CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">{overallStats.profitabilityRate.toFixed(1)}%</div>
            <p className="text-[9px] sm:text-xs text-slate-500 mt-1">{overallStats.profitableScenarios.toLocaleString()} سيناريو رابح</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6"><CardTitle className="text-[10px] sm:text-xs md:text-sm">الربح الوسيط / أوردر</CardTitle></CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">{fmt(overallStats.medianProfit)} ج.م</div>
            <p className="text-[9px] sm:text-xs text-slate-500 mt-1">لكل طلب مُسلَّم</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6"><CardTitle className="text-[10px] sm:text-xs md:text-sm">ROAS الوسيط</CardTitle></CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600">{overallStats.medianRoas.toFixed(2)}x</div>
            <p className="text-[9px] sm:text-xs text-slate-500 mt-1">العائد على الإنفاق</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="text-[9px] sm:text-xs md:text-sm py-1.5 sm:py-2 px-1 sm:px-3">نظرة عامة</TabsTrigger>
          <TabsTrigger value="scenarios" className="text-[9px] sm:text-xs md:text-sm py-1.5 sm:py-2 px-1 sm:px-3">السيناريوهات</TabsTrigger>
          <TabsTrigger value="ranking" className="text-[9px] sm:text-xs md:text-sm py-1.5 sm:py-2 px-1 sm:px-3">ترتيب المنتجات</TabsTrigger>
          <TabsTrigger value="product" className="text-[9px] sm:text-xs md:text-sm py-1.5 sm:py-2 px-1 sm:px-3">تحليل المنتج</TabsTrigger>
          <TabsTrigger value="filters" className="text-[9px] sm:text-xs md:text-sm py-1.5 sm:py-2 px-1 sm:px-3">تصفية متقدمة</TabsTrigger>
        </TabsList>

        {/* ========== Overview Tab ========== */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">توزيع الربحية (جميع السيناريوهات)</CardTitle></CardHeader>
              <CardContent className="px-3 sm:px-6">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={profitabilityChart} cx="50%" cy="50%" labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                      outerRadius={70} dataKey="value">
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
              <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">أفضل 5 منتجات (الربح الوسيط / أوردر)</CardTitle></CardHeader>
              <CardContent className="px-3 sm:px-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-20} textAnchor="end" height={80} fontSize={10} />
                    <YAxis fontSize={10} />
                    <Tooltip formatter={(v: number) => `${v.toLocaleString()} ج.م`} />
                    <Bar dataKey="profit" fill="#10b981" name="الربح/أوردر" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ========== Scenarios Tab ========== */}
        <TabsContent value="scenarios" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4">
            <Select value={selectedCPM} onValueChange={setSelectedCPM}>
              <SelectTrigger className="text-xs sm:text-sm"><SelectValue placeholder="CPM" /></SelectTrigger>
              <SelectContent>{uniqueCPMs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedCTR} onValueChange={setSelectedCTR}>
              <SelectTrigger className="text-xs sm:text-sm"><SelectValue placeholder="CTR" /></SelectTrigger>
              <SelectContent>{uniqueCTRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedCVR} onValueChange={setSelectedCVR}>
              <SelectTrigger className="text-xs sm:text-sm"><SelectValue placeholder="CVR" /></SelectTrigger>
              <SelectContent>{uniqueCVRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedBasket} onValueChange={setSelectedBasket}>
              <SelectTrigger className="text-xs sm:text-sm"><SelectValue placeholder="Basket" /></SelectTrigger>
              <SelectContent>{uniqueBaskets.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-base">السيناريوهات المطابقة ({filteredScenarios.length} منتج) - لكل طلب مُسلَّم واحد</CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-3 md:px-6">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] sm:text-xs md:text-sm border-collapse min-w-[700px]">
                  <thead className="bg-slate-100 border-b-2 border-slate-300 sticky top-0">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">المنتج</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">السعر</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">AOV</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">CPA Dashboard</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">CPA Delivered</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">العائد/أوردر</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">COGS/أوردر</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">الربح/أوردر</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">ROAS</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScenarios
                      .sort((a, b) => b.net_profit_per_order - a.net_profit_per_order)
                      .map((s, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${s.status === 'خسارة' ? 'bg-red-50' : s.status === 'ربح' ? 'hover:bg-green-50' : 'hover:bg-yellow-50'}`}>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 truncate max-w-[120px] sm:max-w-[200px]" title={s.item_name}>{s.item_name}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-slate-600 whitespace-nowrap">{fmt(s.selling_price)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 font-medium whitespace-nowrap">{fmt(s.aov)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">{fmt(s.cpa_dashboard)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 font-medium text-orange-600 whitespace-nowrap">{fmt(s.cpa_delivered)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-blue-700 font-medium whitespace-nowrap">{fmt(s.revenue_per_order)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-slate-500 whitespace-nowrap">{fmt(s.cogs_per_order)}</td>
                        <td className={`px-2 sm:px-3 py-1.5 sm:py-2 font-bold whitespace-nowrap ${s.net_profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(s.net_profit_per_order)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold whitespace-nowrap">{s.roas.toFixed(1)}x</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                          <Badge className="text-[8px] sm:text-[10px] px-1 sm:px-2" variant={s.status === 'ربح' ? 'default' : s.status === 'نقطة التعادل' ? 'secondary' : 'destructive'}>
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
        <TabsContent value="ranking" className="space-y-4 sm:space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-sm sm:text-base">ترتيب المنتجات حسب الربحية (لكل طلب مُسلَّم واحد)</CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-3 md:px-6">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] sm:text-xs md:text-sm border-collapse min-w-[650px]">
                  <thead className="bg-slate-100 border-b-2 border-slate-300 sticky top-0">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">#</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">المنتج</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">النوع</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">السعر</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">العائد الوسيط</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">الربح الوسيط</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">ROAS الوسيط</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">معدل الربحية</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">رابح/خاسر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productRanking.map((p) => (
                      <tr key={p.rank} className={`border-b border-slate-100 ${p.profit_median < 0 ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 font-bold text-blue-600">#{p.rank}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 truncate max-w-[120px] sm:max-w-[200px]" title={p.item_name}>{p.item_name}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                          <Badge className="text-[8px] sm:text-[10px]" variant={p.item_type === 'bundle' ? 'default' : 'secondary'}>
                            {p.item_type === 'bundle' ? 'باندل' : 'منتج'}
                          </Badge>
                        </td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">{fmt(p.selling_price)} ج.م</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-blue-600 font-medium whitespace-nowrap">{fmt(p.revenue_median)} ج.م</td>
                        <td className={`px-2 sm:px-3 py-1.5 sm:py-2 font-bold whitespace-nowrap ${p.profit_median >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(p.profit_median)} ج.م</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold whitespace-nowrap">{p.roas_median.toFixed(1)}x</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                          <Badge className="text-[8px] sm:text-[10px]" variant={p.profitability_rate > 80 ? 'default' : p.profitability_rate > 50 ? 'secondary' : 'destructive'}>
                            {p.profitability_rate.toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-[9px] sm:text-xs whitespace-nowrap">{p.profit_scenarios}/{p.loss_scenarios}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== Product Analysis Tab ========== */}
        <TabsContent value="product" className="space-y-4 sm:space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">اختر منتج للتحليل التفصيلي</CardTitle></CardHeader>
            <CardContent className="px-3 sm:px-6">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-1 px-3 sm:px-4 pt-3 sm:pt-4"><CardTitle className="text-[10px] sm:text-xs">سعر البيع</CardTitle></CardHeader>
                  <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900">{fmt(selectedProductRanking.selling_price)} ج.م</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-1 px-3 sm:px-4 pt-3 sm:pt-4"><CardTitle className="text-[10px] sm:text-xs">العائد الوسيط / أوردر</CardTitle></CardHeader>
                  <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="text-base sm:text-lg md:text-xl font-bold text-blue-600">{fmt(selectedProductRanking.revenue_median)} ج.م</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-1 px-3 sm:px-4 pt-3 sm:pt-4"><CardTitle className="text-[10px] sm:text-xs">الربح الوسيط / أوردر</CardTitle></CardHeader>
                  <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className={`text-base sm:text-lg md:text-xl font-bold ${selectedProductRanking.profit_median >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmt(selectedProductRanking.profit_median)} ج.م
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-1 px-3 sm:px-4 pt-3 sm:pt-4"><CardTitle className="text-[10px] sm:text-xs">ROAS الوسيط</CardTitle></CardHeader>
                  <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="text-base sm:text-lg md:text-xl font-bold text-blue-600">{selectedProductRanking.roas_median.toFixed(2)}x</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-1 px-3 sm:px-4 pt-3 sm:pt-4"><CardTitle className="text-[10px] sm:text-xs">معدل الربحية</CardTitle></CardHeader>
                  <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="text-base sm:text-lg md:text-xl font-bold text-green-600">{selectedProductRanking.profitability_rate.toFixed(0)}%</div>
                    <p className="text-[9px] sm:text-xs text-slate-500">{selectedProductRanking.profit_scenarios} رابح / {selectedProductRanking.loss_scenarios} خاسر</p>
                  </CardContent>
                </Card>
              </div>

              {/* Best/Worst Scenarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <Card className="border-0 shadow-lg border-r-4 border-r-green-500">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6"><CardTitle className="text-xs sm:text-sm text-green-700">أفضل سيناريو</CardTitle></CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <p className="text-[10px] sm:text-xs text-slate-600 mb-2">{selectedProductRanking.best_scenario}</p>
                    <div className="flex gap-3 sm:gap-4 flex-wrap">
                      <div><span className="text-[10px] sm:text-xs text-slate-500">الربح:</span> <span className="font-bold text-green-600 text-xs sm:text-sm">{fmt(selectedProductRanking.best_profit)} ج.م</span></div>
                      <div><span className="text-[10px] sm:text-xs text-slate-500">ROAS:</span> <span className="font-bold text-green-600 text-xs sm:text-sm">{selectedProductRanking.best_roas.toFixed(1)}x</span></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg border-r-4 border-r-red-500">
                  <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6"><CardTitle className="text-xs sm:text-sm text-red-700">أسوأ سيناريو</CardTitle></CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <p className="text-[10px] sm:text-xs text-slate-600 mb-2">{selectedProductRanking.worst_scenario}</p>
                    <div className="flex gap-3 sm:gap-4 flex-wrap">
                      <div><span className="text-[10px] sm:text-xs text-slate-500">الربح:</span> <span className="font-bold text-red-600 text-xs sm:text-sm">{fmt(selectedProductRanking.worst_profit)} ج.م</span></div>
                      <div><span className="text-[10px] sm:text-xs text-slate-500">ROAS:</span> <span className="font-bold text-red-600 text-xs sm:text-sm">{selectedProductRanking.worst_roas.toFixed(1)}x</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CPM Comparison Chart */}
              {cpmComparison.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">مقارنة تكلفة CPM (Good CTR + Good CVR + Single Item)</CardTitle></CardHeader>
                  <CardContent className="px-1 sm:px-3 md:px-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={cpmComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip formatter={(v: number) => `${v.toLocaleString()} ج.م`} />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="الربح/أوردر" fill="#10b981" />
                        <Bar dataKey="العائد/أوردر" fill="#3b82f6" />
                        <Bar dataKey="CPA Delivered" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* All 144 Scenarios Table */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">جميع 144 سيناريو لهذا المنتج (لكل طلب مُسلَّم واحد) - {filteredScenarios.length} سيناريو مطابق</CardTitle></CardHeader>
                <CardContent className="px-0 sm:px-3 md:px-6">
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-[9px] sm:text-[10px] md:text-xs border-collapse min-w-[700px]">
                      <thead className="bg-slate-100 border-b-2 border-slate-300 sticky top-0 z-10">
                        <tr>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">CPM</th>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">CTR</th>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">CVR</th>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">Basket</th>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">AOV</th>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">CPA Dash.</th>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">CPA Del.</th>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">العائد</th>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">COGS</th>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">الربح</th>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">ROAS</th>
                          <th className="px-1.5 sm:px-2 py-2 text-right font-semibold whitespace-nowrap">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredScenarios
                          .sort((a, b) => b.net_profit_per_order - a.net_profit_per_order)
                          .map((s, idx) => (
                          <tr key={idx} className={`border-b border-slate-50 ${s.status === 'خسارة' ? 'bg-red-50' : ''}`}>
                            <td className="px-1.5 sm:px-2 py-1">{s.cpm_label}</td>
                            <td className="px-1.5 sm:px-2 py-1">{s.ctr_label}</td>
                            <td className="px-1.5 sm:px-2 py-1">{s.cvr_label}</td>
                            <td className="px-1.5 sm:px-2 py-1">{s.basket_label}</td>
                            <td className="px-1.5 sm:px-2 py-1 whitespace-nowrap">{fmt(s.aov)}</td>
                            <td className="px-1.5 sm:px-2 py-1 whitespace-nowrap">{fmt(s.cpa_dashboard)}</td>
                            <td className="px-1.5 sm:px-2 py-1 text-orange-600 whitespace-nowrap">{fmt(s.cpa_delivered)}</td>
                            <td className="px-1.5 sm:px-2 py-1 whitespace-nowrap">{fmt(s.revenue_per_order)}</td>
                            <td className="px-1.5 sm:px-2 py-1 text-slate-500 whitespace-nowrap">{fmt(s.cogs_per_order)}</td>
                            <td className={`px-1.5 sm:px-2 py-1 font-bold whitespace-nowrap ${s.net_profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(s.net_profit_per_order)}</td>
                            <td className="px-1.5 sm:px-2 py-1 whitespace-nowrap">{s.roas.toFixed(1)}x</td>
                            <td className="px-1.5 sm:px-2 py-1">
                              <Badge className="text-[7px] sm:text-[9px] px-0.5 sm:px-1" variant={s.status === 'ربح' ? 'default' : s.status === 'نقطة التعادل' ? 'secondary' : 'destructive'}>
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

              {/* Filter Section */}
              <Card className="border-0 shadow-lg mt-4 sm:mt-6">
                <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">تصفية السيناريوهات</CardTitle></CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                    <div>
                      <label className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-700 mb-1 block">CPM</label>
                      <Select value={selectedCPM} onValueChange={setSelectedCPM}>
                        <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{uniqueCPMs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-700 mb-1 block">CTR</label>
                      <Select value={selectedCTR} onValueChange={setSelectedCTR}>
                        <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{uniqueCTRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-700 mb-1 block">CVR</label>
                      <Select value={selectedCVR} onValueChange={setSelectedCVR}>
                        <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{uniqueCVRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-700 mb-1 block">Basket Size</label>
                      <Select value={selectedBasket} onValueChange={setSelectedBasket}>
                        <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>{uniqueBaskets.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Market Research Section */}
              {marketResearchMap[selectedProduct] && (
                <Card className="border-0 shadow-lg mt-4 sm:mt-6 border-l-4 border-l-blue-500">
                  <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">بيانات السوق والأبحاث</CardTitle></CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">معدل الطلب</p>
                        <p className="text-sm font-bold text-slate-900">{marketResearchMap[selectedProduct].demand}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">مستوى المنافسة</p>
                        <p className="text-sm font-bold text-slate-900">{marketResearchMap[selectedProduct].competition}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">حساسية السعر</p>
                        <p className="text-sm font-bold text-slate-900">{marketResearchMap[selectedProduct].price_sensitivity}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">حجم السوق</p>
                        <p className="text-sm font-bold text-slate-900">{marketResearchMap[selectedProduct].market_size}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">معدل النمو</p>
                        <p className="text-sm font-bold text-slate-900">{marketResearchMap[selectedProduct].growth}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">الجمهور المستهدف</p>
                        <p className="text-sm font-bold text-slate-900">{marketResearchMap[selectedProduct].target_audience?.join(', ') || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ========== Filters Tab ========== */}
        <TabsContent value="filters" className="space-y-4 sm:space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">تصفية متقدمة - اختر السيناريو</CardTitle></CardHeader>
            <CardContent className="px-3 sm:px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-700 mb-1 block">تكلفة CPM</label>
                  <Select value={selectedCPM} onValueChange={setSelectedCPM}>
                    <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{uniqueCPMs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-700 mb-1 block">معدل النقر CTR</label>
                  <Select value={selectedCTR} onValueChange={setSelectedCTR}>
                    <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{uniqueCTRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-700 mb-1 block">معدل التحويل CVR</label>
                  <Select value={selectedCVR} onValueChange={setSelectedCVR}>
                    <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{uniqueCVRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs md:text-sm font-medium text-slate-700 mb-1 block">حجم السلة</label>
                  <Select value={selectedBasket} onValueChange={setSelectedBasket}>
                    <SelectTrigger className="text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{uniqueBaskets.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="px-3 sm:px-6">
              <CardTitle className="text-xs sm:text-sm md:text-base">النتائج ({filteredScenarios.length} منتج) - {selectedCPM} + {selectedCTR} + {selectedCVR} + {selectedBasket}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-3 md:px-6">
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] sm:text-xs md:text-sm border-collapse min-w-[650px]">
                  <thead className="bg-slate-100 border-b-2 border-slate-300 sticky top-0">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">المنتج</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">السعر</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">AOV</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">CPA Dash.</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">CPA Del.</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">العائد/أوردر</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">COGS/أوردر</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">الربح/أوردر</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">ROAS</th>
                      <th className="px-2 sm:px-3 py-2 sm:py-3 text-right font-semibold whitespace-nowrap">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScenarios
                      .sort((a, b) => b.net_profit_per_order - a.net_profit_per_order)
                      .map((s, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${s.status === 'خسارة' ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 truncate max-w-[120px] sm:max-w-[200px]" title={s.item_name}>{s.item_name}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">{fmt(s.selling_price)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">{fmt(s.aov)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">{fmt(s.cpa_dashboard)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-orange-600 font-medium whitespace-nowrap">{fmt(s.cpa_delivered)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-blue-700 font-medium whitespace-nowrap">{fmt(s.revenue_per_order)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-slate-500 whitespace-nowrap">{fmt(s.cogs_per_order)}</td>
                        <td className={`px-2 sm:px-3 py-1.5 sm:py-2 font-bold whitespace-nowrap ${s.net_profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(s.net_profit_per_order)}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 font-semibold whitespace-nowrap">{s.roas.toFixed(1)}x</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                          <Badge className="text-[8px] sm:text-[10px] px-1 sm:px-2" variant={s.status === 'ربح' ? 'default' : s.status === 'نقطة التعادل' ? 'secondary' : 'destructive'}>
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
