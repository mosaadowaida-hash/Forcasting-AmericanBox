import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis,
} from 'recharts';
import { TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';

export function Analysis() {
  const { data: products = [], isLoading } = trpc.products.list.useQuery();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const { data: scenarios = [] } = trpc.products.getScenarios.useQuery(
    selectedProductId!, { enabled: selectedProductId !== null }
  );

  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId),
    [products, selectedProductId]
  );

  // Stats
  const stats = useMemo(() => {
    if (scenarios.length === 0) return null;
    const profitable = scenarios.filter(s => s.netProfitPerOrder > 0).length;
    const profits = scenarios.map(s => s.netProfitPerOrder).sort((a, b) => a - b);
    const roasValues = scenarios.map(s => s.roas).sort((a, b) => a - b);
    return {
      totalScenarios: scenarios.length,
      profitableScenarios: profitable,
      profitabilityRate: (profitable / scenarios.length) * 100,
      medianProfit: profits[Math.floor(profits.length / 2)],
      medianRoas: roasValues[Math.floor(roasValues.length / 2)],
      maxProfit: profits[profits.length - 1],
      minProfit: profits[0],
      avgCpaDelivered: scenarios.reduce((s, sc) => s + sc.cpaDelivered, 0) / scenarios.length,
      avgAov: scenarios.reduce((s, sc) => s + sc.aov, 0) / scenarios.length,
    };
  }, [scenarios]);

  // Top 5 best scenarios
  const topScenarios = useMemo(
    () => [...scenarios].sort((a, b) => b.netProfitPerOrder - a.netProfitPerOrder).slice(0, 5),
    [scenarios]
  );

  // Worst 5 scenarios
  const worstScenarios = useMemo(
    () => [...scenarios].sort((a, b) => a.netProfitPerOrder - b.netProfitPerOrder).slice(0, 5),
    [scenarios]
  );

  // Profit by CPM
  const profitByCPM = useMemo(() => {
    const groups = new Map<string, number[]>();
    scenarios.forEach(s => {
      if (!groups.has(s.cpmLabel)) groups.set(s.cpmLabel, []);
      groups.get(s.cpmLabel)!.push(s.netProfitPerOrder);
    });
    return Array.from(groups.entries()).map(([label, profits]) => ({
      name: label,
      avgProfit: Math.round(profits.reduce((a, b) => a + b, 0) / profits.length),
      profitable: profits.filter(p => p > 0).length,
    }));
  }, [scenarios]);

  // Profit by CTR
  const profitByCTR = useMemo(() => {
    const groups = new Map<string, number[]>();
    scenarios.forEach(s => {
      if (!groups.has(s.ctrLabel)) groups.set(s.ctrLabel, []);
      groups.get(s.ctrLabel)!.push(s.netProfitPerOrder);
    });
    return Array.from(groups.entries()).map(([label, profits]) => ({
      name: label,
      avgProfit: Math.round(profits.reduce((a, b) => a + b, 0) / profits.length),
    }));
  }, [scenarios]);

  // ROAS by CVR
  const roasByCVR = useMemo(() => {
    const groups = new Map<string, number[]>();
    scenarios.forEach(s => {
      if (!groups.has(s.cvrLabel)) groups.set(s.cvrLabel, []);
      groups.get(s.cvrLabel)!.push(s.roas);
    });
    return Array.from(groups.entries()).map(([label, roasValues]) => ({
      name: label,
      avgRoas: +(roasValues.reduce((a, b) => a + b, 0) / roasValues.length).toFixed(2),
    }));
  }, [scenarios]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6" dir="rtl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">تحليل المنتج</h1>
        <p className="text-gray-600 mt-2">تحليل تفصيلي لسيناريوهات كل منتج</p>
      </div>

      <Card>
        <CardHeader><CardTitle>اختر المنتج</CardTitle></CardHeader>
        <CardContent>
          <Select value={selectedProductId !== null ? String(selectedProductId) : ''} onValueChange={(v) => setSelectedProductId(Number(v))}>
            <SelectTrigger><SelectValue placeholder="اختر منتج..." /></SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product.id} value={String(product.id)}>
                  {product.type === 'bundle' ? '📦' : '💊'} {product.name} ({product.originalPrice} ج.م)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProduct && stats && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-gray-600">معدل الربحية</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl font-bold ${stats.profitabilityRate > 50 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.profitabilityRate.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500">{stats.profitableScenarios} رابح من {stats.totalScenarios}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-gray-600">متوسط الربح</CardTitle>
                <DollarSign className="w-4 h-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl font-bold ${stats.medianProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.medianProfit.toFixed(0)} ج.م
                </div>
                <p className="text-xs text-gray-500">الأقصى: {stats.maxProfit.toFixed(0)} | الأدنى: {stats.minProfit.toFixed(0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-gray-600">متوسط ROAS</CardTitle>
                <Target className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.medianRoas.toFixed(2)}x</div>
                <p className="text-xs text-gray-500">متوسط AOV: {stats.avgAov.toFixed(0)} ج.م</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-gray-600">متوسط CPA Delivered</CardTitle>
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{stats.avgCpaDelivered.toFixed(0)} ج.م</div>
                <p className="text-xs text-gray-500">بعد نسبة التسليم 68.83%</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">متوسط الربح حسب CPM</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={profitByCPM}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgProfit" fill="#3b82f6" name="متوسط الربح (ج.م)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">متوسط الربح حسب CTR</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={profitByCTR}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="avgProfit" fill="#22c55e" name="متوسط الربح (ج.م)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">متوسط ROAS حسب CVR</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={roasByCVR}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avgRoas" fill="#8b5cf6" name="متوسط ROAS" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top 5 Best */}
          <Card>
            <CardHeader><CardTitle>أفضل 5 سيناريوهات</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topScenarios.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-green-50 rounded border border-green-100">
                    <div>
                      <div className="font-semibold text-sm">{s.cpmLabel} | {s.ctrLabel} | {s.cvrLabel} | {s.basketLabel}</div>
                      <div className="text-sm text-gray-600">العائد: {s.revenuePerOrder.toFixed(0)} ج.م | CPA Delivered: {s.cpaDelivered.toFixed(0)} ج.م</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{s.netProfitPerOrder.toFixed(0)} ج.م</div>
                      <div className="text-xs text-gray-600">ROAS: {s.roas.toFixed(2)}x</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Worst 5 */}
          <Card>
            <CardHeader><CardTitle>أسوأ 5 سيناريوهات</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {worstScenarios.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded border border-red-100">
                    <div>
                      <div className="font-semibold text-sm">{s.cpmLabel} | {s.ctrLabel} | {s.cvrLabel} | {s.basketLabel}</div>
                      <div className="text-sm text-gray-600">العائد: {s.revenuePerOrder.toFixed(0)} ج.م | CPA Delivered: {s.cpaDelivered.toFixed(0)} ج.م</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">{s.netProfitPerOrder.toFixed(0)} ج.م</div>
                      <div className="text-xs text-gray-600">ROAS: {s.roas.toFixed(2)}x</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Full Scenarios Table */}
          <Card>
            <CardHeader><CardTitle>جميع السيناريوهات ({scenarios.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-right py-3 px-2">CPM</th>
                      <th className="text-right py-3 px-2">CTR</th>
                      <th className="text-right py-3 px-2">CVR</th>
                      <th className="text-right py-3 px-2">Basket</th>
                      <th className="text-right py-3 px-2">AOV</th>
                      <th className="text-right py-3 px-2">CPA Dashboard</th>
                      <th className="text-right py-3 px-2">CPA Delivered</th>
                      <th className="text-right py-3 px-2">Break-Even CPA</th>
                      <th className="text-right py-3 px-2">العائد</th>
                      <th className="text-right py-3 px-2">الربح</th>
                      <th className="text-right py-3 px-2">هامش الربح</th>
                      <th className="text-right py-3 px-2">ROAS</th>
                      <th className="text-right py-3 px-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 text-xs">{s.cpmLabel}</td>
                        <td className="py-2 px-2 text-xs">{s.ctrLabel}</td>
                        <td className="py-2 px-2 text-xs">{s.cvrLabel}</td>
                        <td className="py-2 px-2 text-xs">{s.basketLabel}</td>
                        <td className="py-2 px-2">{s.aov.toFixed(0)}</td>
                        <td className="py-2 px-2">{s.cpaDashboard.toFixed(0)}</td>
                        <td className="py-2 px-2">{s.cpaDelivered.toFixed(0)}</td>
                        <td className="py-2 px-2">{s.breakEvenCpa.toFixed(0)}</td>
                        <td className="py-2 px-2">{s.revenuePerOrder.toFixed(0)}</td>
                        <td className={`py-2 px-2 font-semibold ${s.netProfitPerOrder > 0 ? 'text-green-600' : 'text-red-600'}`}>{s.netProfitPerOrder.toFixed(0)}</td>
                        <td className={`py-2 px-2 ${s.profitMargin > 0 ? 'text-green-600' : 'text-red-600'}`}>{s.profitMargin.toFixed(1)}%</td>
                        <td className="py-2 px-2">{s.roas.toFixed(2)}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${s.status === 'ربح' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
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
    </div>
  );
}
