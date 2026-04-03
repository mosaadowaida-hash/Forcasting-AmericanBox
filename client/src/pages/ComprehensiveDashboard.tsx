import { useState, useMemo } from "react";
import { AddProductDialog } from "@/components/AddProductDialog";
import { ProductManagementDialog } from "@/components/ProductManagementDialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
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
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [managementDialogOpen, setManagementDialogOpen] = useState(false);

  // First get all scenarios for the selected product
  const productScenarios = useMemo(() => allScenarios.filter(s => s.item_name === selectedProduct), [selectedProduct]);

  // Then get unique values from ONLY the selected product's scenarios
  const uniqueCPMs = useMemo(() => Array.from(new Set(productScenarios.map(s => s.cpm_label))), [productScenarios]);
  const uniqueCTRs = useMemo(() => Array.from(new Set(productScenarios.map(s => s.ctr_label))), [productScenarios]);
  const uniqueCVRs = useMemo(() => Array.from(new Set(productScenarios.map(s => s.cvr_label))), [productScenarios]);
  const uniqueBaskets = useMemo(() => Array.from(new Set(productScenarios.map(s => s.basket_label))), [productScenarios]);

  // Initialize with first values
  const [selectedCPM, setSelectedCPM] = useState(uniqueCPMs[0] || "");
  const [selectedCTR, setSelectedCTR] = useState(uniqueCTRs[0] || "");
  const [selectedCVR, setSelectedCVR] = useState(uniqueCVRs[0] || "");
  const [selectedBasket, setSelectedBasket] = useState(uniqueBaskets[0] || "");

  // Filter to get exactly ONE scenario that matches all criteria
  const filteredScenarios = useMemo(() => productScenarios.filter(s =>
    s.cpm_label === selectedCPM &&
    s.ctr_label === selectedCTR &&
    s.cvr_label === selectedCVR &&
    s.basket_label === selectedBasket
  ), [selectedCPM, selectedCTR, selectedCVR, selectedBasket, productScenarios]);

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
      .filter(s => s.ctr_label === (uniqueCTRs[0] || "") && s.cvr_label === (uniqueCVRs[0] || "") && s.basket_label === (uniqueBaskets[0] || ""))
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
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">محاكي الحملات والإيرادات - النسخة الشاملة</h1>
          <p className="text-sm text-slate-600 mt-1">تحليل 6,048 سيناريو (42 منتج/باندل × 144 سيناريو) - جميع الأرقام لكل طلب واحد مُسلَّم</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setManagementDialogOpen(true)} className="bg-slate-600 hover:bg-slate-700 text-white whitespace-nowrap"><Settings className="w-4 h-4 ml-2" />إدارة المنتج</Button>
          <Button onClick={() => setAddProductDialogOpen(true)} className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap">+ إضافة منتج جديد</Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm">إجمالي السيناريوهات</CardTitle></CardHeader>
          <CardContent><div className="text-lg md:text-2xl font-bold text-slate-900">6,048</div></CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm">معدل الربحية</CardTitle></CardHeader>
          <CardContent><div className="text-lg md:text-2xl font-bold text-green-600">{((overallStats.profitableScenarios / 6048) * 100).toFixed(1)}%</div></CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm">الربح الوسيط / أوردر</CardTitle></CardHeader>
          <CardContent><div className="text-lg md:text-2xl font-bold text-slate-900">{fmt(selectedProductRanking?.profit_median)}</div></CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-xs sm:text-sm">الوسيط ROAS</CardTitle></CardHeader>
          <CardContent><div className="text-lg md:text-2xl font-bold text-blue-600">{selectedProductRanking?.roas_median.toFixed(2)}x</div></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4 text-[10px] sm:text-xs md:text-sm">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="scenarios">السيناريوهات</TabsTrigger>
          <TabsTrigger value="ranking">ترتيب المنتجات</TabsTrigger>
          <TabsTrigger value="analysis">تحليل المنتج</TabsTrigger>
          <TabsTrigger value="advanced">تصفية متقدمة</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader><CardTitle className="text-sm sm:text-base">توزيع الربحية (جميع السيناريوهات)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={profitabilityChart} cx="50%" cy="50%" labelLine={false} label outerRadius={80} fill="#8884d8" dataKey="value">
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
              <CardHeader><CardTitle className="text-sm sm:text-base">أفضل 5 منتجات</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="profit" fill="#10b981" name="الربح الوسيط" />
                    <Bar dataKey="roas" fill="#3b82f6" name="ROAS الوسيط" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scenarios Tab */}
        <TabsContent value="scenarios">
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle className="text-sm sm:text-base">جميع السيناريوهات (6,048)</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-[9px] sm:text-[10px] md:text-xs border-collapse min-w-[800px]">
                <thead className="bg-slate-100 border-b-2 border-slate-300 sticky top-0 z-10">
                  <tr>
                    <th className="px-1.5 sm:px-2 py-2 text-right">المنتج</th>
                    <th className="px-1.5 sm:px-2 py-2 text-right">CPM</th>
                    <th className="px-1.5 sm:px-2 py-2 text-right">CTR</th>
                    <th className="px-1.5 sm:px-2 py-2 text-right">CVR</th>
                    <th className="px-1.5 sm:px-2 py-2 text-right">Basket</th>
                    <th className="px-1.5 sm:px-2 py-2 text-right">العائد</th>
                    <th className="px-1.5 sm:px-2 py-2 text-right">الربح</th>
                    <th className="px-1.5 sm:px-2 py-2 text-right">ROAS</th>
                  </tr>
                </thead>
                <tbody>
                  {allScenarios.slice(0, 100).map((s, idx) => (
                    <tr key={idx} className={`border-b border-slate-50 ${s.status === 'خسارة' ? 'bg-red-50' : ''}`}>
                      <td className="px-1.5 sm:px-2 py-1 text-[8px] sm:text-[9px]">{s.item_name.substring(0, 10)}</td>
                      <td className="px-1.5 sm:px-2 py-1">{s.cpm_label}</td>
                      <td className="px-1.5 sm:px-2 py-1">{s.ctr_label}</td>
                      <td className="px-1.5 sm:px-2 py-1">{s.cvr_label}</td>
                      <td className="px-1.5 sm:px-2 py-1">{s.basket_label}</td>
                      <td className="px-1.5 sm:px-2 py-1">{fmt(s.revenue_per_order)}</td>
                      <td className={`px-1.5 sm:px-2 py-1 font-bold ${s.net_profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(s.net_profit_per_order)}</td>
                      <td className="px-1.5 sm:px-2 py-1">{s.roas.toFixed(1)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking Tab */}
        <TabsContent value="ranking">
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle className="text-sm sm:text-base">ترتيب المنتجات (42)</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-[9px] sm:text-[10px] md:text-xs border-collapse min-w-[700px]">
                <thead className="bg-slate-100 border-b-2 border-slate-300 sticky top-0 z-10">
                  <tr>
                    <th className="px-1.5 sm:px-2 py-2 text-right">#</th>
                    <th className="px-1.5 sm:px-2 py-2 text-right">المنتج</th>
                    <th className="px-1.5 sm:px-2 py-2 text-right">الربح الوسيط</th>
                    <th className="px-1.5 sm:px-2 py-2 text-right">ROAS الوسيط</th>
                    <th className="px-1.5 sm:px-2 py-2 text-right">% ربح</th>
                  </tr>
                </thead>
                <tbody>
                  {productRanking.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-1.5 sm:px-2 py-1 font-bold">{idx + 1}</td>
                      <td className="px-1.5 sm:px-2 py-1">{p.item_name}</td>
                      <td className="px-1.5 sm:px-2 py-1 text-green-600 font-bold">{fmt(p.profit_median)}</td>
                      <td className="px-1.5 sm:px-2 py-1 text-blue-600 font-bold">{p.roas_median.toFixed(2)}x</td>
                      <td className="px-1.5 sm:px-2 py-1">{((p.profit_scenarios / 144) * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          {selectedProductRanking && (
            <>
              <Card className="border-0 shadow-lg mb-4">
                <CardHeader><CardTitle className="text-sm sm:text-base">اختر منتج للتحليل</CardTitle></CardHeader>
                <CardContent>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productRanking.map((p) => (
                        <SelectItem key={p.item_name} value={p.item_name}>
                          {p.item_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Product Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">عدد السيناريوهات</CardTitle></CardHeader>
                  <CardContent><div className="text-lg font-bold text-blue-600">{productScenarios.length}</div></CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">% ربح</CardTitle></CardHeader>
                  <CardContent><div className="text-lg font-bold text-green-600">{((selectedProductRanking.profit_scenarios / 144) * 100).toFixed(0)}%</div></CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">الربح الوسيط</CardTitle></CardHeader>
                  <CardContent><div className="text-lg font-bold">{fmt(selectedProductRanking.profit_median)}</div></CardContent>
                </Card>
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-2"><CardTitle className="text-xs">ROAS الوسيط</CardTitle></CardHeader>
                  <CardContent><div className="text-lg font-bold text-blue-600">{selectedProductRanking.roas_median.toFixed(2)}x</div></CardContent>
                </Card>
              </div>

              {/* All 144 Scenarios Table */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">جميع 144 سيناريو لهذا المنتج (لكل طلب مُسلَّم واحد)</CardTitle></CardHeader>
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
                        {productScenarios
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
                <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">تصفية السيناريوهات - {filteredScenarios.length} سيناريو مطابق</CardTitle></CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4">
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

              {/* Filtered Scenario Display */}
              {filteredScenarios.length > 0 && (
                <Card className="border-0 shadow-lg mt-4 sm:mt-6 border-l-4 border-l-green-500">
                  <CardHeader className="px-3 sm:px-6"><CardTitle className="text-sm sm:text-base">السيناريو المختار</CardTitle></CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {filteredScenarios.map((s, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-600 mb-1">CPM: {s.cpm_label}</p>
                          <p className="text-xs text-slate-600 mb-1">CTR: {s.ctr_label}</p>
                          <p className="text-xs text-slate-600 mb-1">CVR: {s.cvr_label}</p>
                          <p className="text-xs text-slate-600 mb-2">Basket: {s.basket_label}</p>
                          <div className="border-t pt-2">
                            <p className="text-xs font-bold text-slate-700 mb-1">العائد: {fmt(s.revenue_per_order)}</p>
                            <p className={`text-xs font-bold ${s.net_profit_per_order >= 0 ? 'text-green-600' : 'text-red-600'}`}>الربح: {fmt(s.net_profit_per_order)}</p>
                            <p className="text-xs font-bold text-blue-600">ROAS: {s.roas.toFixed(2)}x</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced">
          <Card className="border-0 shadow-lg">
            <CardHeader><CardTitle className="text-sm sm:text-base">معلومات متقدمة</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">معادلات الحساب:</h3>
                  <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                    <li>معدل التأكيد: 76.90%</li>
                    <li>معدل التسليم: 68.83%</li>
                    <li>COGS: 65% من السعر الأصلي</li>
                    <li>تكلفة الشحن: 30 ج.م لكل طلب</li>
                    <li>Upsell Mix: 70% single, 20% double (-10%), 10% triple (-15%)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">الحقول:</h3>
                  <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                    <li>CPM: تكلفة الألف انطباع (3 مستويات)</li>
                    <li>CTR: نسبة النقر (4 مستويات)</li>
                    <li>CVR: نسبة التحويل (3 مستويات)</li>
                    <li>Basket Size: حجم السلة (4 مستويات)</li>
                    <li>AOV: متوسط قيمة الطلب</li>
                    <li>ROAS: العائد على الإنفاق الإعلاني</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Product Dialog */}
      <AddProductDialog 
        open={addProductDialogOpen} 
        onOpenChange={setAddProductDialogOpen}
        onProductAdded={() => {
          // Refresh the page or reload data
          window.location.reload();
        }}
      />

      {/* Product Management Dialog */}
      <ProductManagementDialog
        product={selectedProduct ? { id: selectedProduct, name: selectedProduct, type: 'product', original_price: 0 } : null}
        open={managementDialogOpen}
        onOpenChange={setManagementDialogOpen}
        onProductUpdated={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
