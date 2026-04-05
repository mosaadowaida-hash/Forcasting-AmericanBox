'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { allScenarios, productRanking } from '@/data/comprehensiveData';

interface Scenario {
  item_name: string;
  item_type: string;
  original_price: number;
  selling_price: number;
  cpm: number;
  cpm_label: string;
  ctr: number;
  ctr_label: string;
  cvr: number;
  cvr_label: string;
  basket_size: number;
  basket_label: string;
  aov: number;
  revenue_per_order: number;
  cpa_dashboard: number;
  cpa_delivered: number;
  cogs_per_order: number;
  net_profit_per_order: number;
  roas: number;
  [key: string]: any;
}

export function WorkingDashboard() {
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [selectedCPM, setSelectedCPM] = useState<string>('');
  const [selectedCTR, setSelectedCTR] = useState<string>('');
  const [selectedCVR, setSelectedCVR] = useState<string>('');
  const [selectedBasket, setSelectedBasket] = useState<string>('');

  // Get unique product names
  const productNames = useMemo(() => {
    const names = Array.from(new Set((allScenarios as Scenario[]).map(s => s.item_name)));
    return names.sort();
  }, []);

  // Set default product on load
  useMemo(() => {
    if (!selectedProductName && productNames.length > 0) {
      setSelectedProductName(productNames[0]);
    }
  }, [productNames, selectedProductName]);

  // Get scenarios for selected product
  const productScenarios = useMemo(() => {
    return (allScenarios as Scenario[]).filter(s => s.item_name === selectedProductName);
  }, [selectedProductName]);

  // Get unique filter values
  const uniqueCPMs = useMemo(() => {
    const values = Array.from(new Set(productScenarios.map(s => s.cpm_label)));
    return values.sort();
  }, [productScenarios]);

  const uniqueCTRs = useMemo(() => {
    const values = Array.from(new Set(productScenarios.map(s => s.ctr_label)));
    return values.sort();
  }, [productScenarios]);

  const uniqueCVRs = useMemo(() => {
    const values = Array.from(new Set(productScenarios.map(s => s.cvr_label)));
    return values.sort();
  }, [productScenarios]);

  const uniqueBaskets = useMemo(() => {
    const values = Array.from(new Set(productScenarios.map(s => s.basket_label)));
    return values.sort();
  }, [productScenarios]);

  // Set defaults for filters
  useMemo(() => {
    if (!selectedCPM && uniqueCPMs.length > 0) setSelectedCPM(uniqueCPMs[0]);
    if (!selectedCTR && uniqueCTRs.length > 0) setSelectedCTR(uniqueCTRs[0]);
    if (!selectedCVR && uniqueCVRs.length > 0) setSelectedCVR(uniqueCVRs[0]);
    if (!selectedBasket && uniqueBaskets.length > 0) setSelectedBasket(uniqueBaskets[0]);
  }, [uniqueCPMs, uniqueCTRs, uniqueCVRs, uniqueBaskets, selectedCPM, selectedCTR, selectedCVR, selectedBasket]);

  // Get filtered scenario
  const filteredScenario = useMemo(() => {
    return productScenarios.find(s =>
      s.cpm_label === selectedCPM &&
      s.ctr_label === selectedCTR &&
      s.cvr_label === selectedCVR &&
      s.basket_label === selectedBasket
    );
  }, [productScenarios, selectedCPM, selectedCTR, selectedCVR, selectedBasket]);

  // Calculate stats
  const stats = useMemo(() => {
    if (productScenarios.length === 0) return null;

    const profitable = productScenarios.filter(s => s.net_profit_per_order > 0).length;
    const avgProfit = productScenarios.reduce((sum, s) => sum + s.net_profit_per_order, 0) / productScenarios.length;
    const avgRoas = productScenarios.reduce((sum, s) => sum + s.roas, 0) / productScenarios.length;
    const avgCPA = productScenarios.reduce((sum, s) => sum + s.cpa_delivered, 0) / productScenarios.length;

    return {
      count: productScenarios.length,
      profitable,
      profitablePercentage: ((profitable / productScenarios.length) * 100).toFixed(1),
      avgProfit: avgProfit.toFixed(0),
      avgRoas: avgRoas.toFixed(2),
      avgCPA: avgCPA.toFixed(0),
    };
  }, [productScenarios]);

  // Chart data
  const profitByBasketChart = useMemo(() => {
    const baskets = Array.from(new Set(productScenarios.map(s => s.basket_label)));
    return baskets.map(basket => {
      const scenarios = productScenarios.filter(s => s.basket_label === basket);
      const avgProfit = scenarios.reduce((sum, s) => sum + s.net_profit_per_order, 0) / scenarios.length;
      return { name: basket, profit: parseFloat(avgProfit.toFixed(0)) };
    });
  }, [productScenarios]);

  const profitByROASChart = useMemo(() => {
    const cpmLabels = Array.from(new Set(productScenarios.map(s => s.cpm_label)));
    return cpmLabels.map(cpm => {
      const scenarios = productScenarios.filter(s => s.cpm_label === cpm);
      const avgRoas = scenarios.reduce((sum, s) => sum + s.roas, 0) / scenarios.length;
      return { name: cpm, roas: parseFloat(avgRoas.toFixed(2)) };
    });
  }, [productScenarios]);

  const fmt = (n: number | undefined) => (n ?? 0).toLocaleString('ar-EG', { maximumFractionDigits: 0 });

  if (!selectedProductName || productScenarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">محاكي الحملات والإيرادات</h1>
        <p className="text-gray-600 mt-2">النسخة العاملة - {productScenarios.length} سيناريو</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">إجمالي السيناريوهات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">السيناريوهات الرابحة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.profitable} ({stats.profitablePercentage}%)
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">متوسط الربح</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgProfit} ج.م</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">متوسط ROAS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRoas}x</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Product Selection */}
      <Card>
        <CardHeader>
          <CardTitle>اختر منتج</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProductName} onValueChange={setSelectedProductName}>
            <SelectTrigger>
              <SelectValue placeholder="اختر منتج..." />
            </SelectTrigger>
            <SelectContent>
              {productNames.map(name => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>عوامل التصفية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">CPM</label>
              <Select value={selectedCPM} onValueChange={setSelectedCPM}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCPMs.map(cpm => (
                    <SelectItem key={cpm} value={cpm}>
                      {cpm}
                    </SelectItem>
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
                    <SelectItem key={ctr} value={ctr}>
                      {ctr}
                    </SelectItem>
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
                    <SelectItem key={cvr} value={cvr}>
                      {cvr}
                    </SelectItem>
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
                    <SelectItem key={basket} value={basket}>
                      {basket}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="scenario" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scenario">السيناريو الحالي</TabsTrigger>
          <TabsTrigger value="charts">الرسوم البيانية</TabsTrigger>
          <TabsTrigger value="table">الجدول</TabsTrigger>
        </TabsList>

        {/* Scenario Tab */}
        <TabsContent value="scenario">
          {filteredScenario && (
            <Card>
              <CardHeader>
                <CardTitle>تفاصيل السيناريو</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">CPM</p>
                    <p className="font-semibold">{filteredScenario.cpm_label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CTR</p>
                    <p className="font-semibold">{filteredScenario.ctr_label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CVR</p>
                    <p className="font-semibold">{filteredScenario.cvr_label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Basket Size</p>
                    <p className="font-semibold">{filteredScenario.basket_label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">AOV</p>
                    <p className="font-semibold">{fmt(filteredScenario.aov)} ج.م</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="font-semibold">{fmt(filteredScenario.revenue_per_order)} ج.م</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CPA (Dashboard)</p>
                    <p className="font-semibold">{fmt(filteredScenario.cpa_dashboard)} ج.م</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CPA (Delivered)</p>
                    <p className="font-semibold">{fmt(filteredScenario.cpa_delivered)} ج.م</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">COGS</p>
                    <p className="font-semibold">{fmt(filteredScenario.cogs_per_order)} ج.م</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Profit</p>
                    <p className={`font-semibold ${filteredScenario.net_profit_per_order > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmt(filteredScenario.net_profit_per_order)} ج.م
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ROAS</p>
                    <p className="font-semibold">{filteredScenario.roas.toFixed(2)}x</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>متوسط الربح حسب Basket Size</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={profitByBasketChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="profit" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>متوسط ROAS حسب CPM</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={profitByROASChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="roas" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Table Tab */}
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>جميع السيناريوهات ({productScenarios.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-right py-2 px-2">CPM</th>
                      <th className="text-right py-2 px-2">CTR</th>
                      <th className="text-right py-2 px-2">CVR</th>
                      <th className="text-right py-2 px-2">Basket</th>
                      <th className="text-right py-2 px-2">AOV</th>
                      <th className="text-right py-2 px-2">Revenue</th>
                      <th className="text-right py-2 px-2">CPA</th>
                      <th className="text-right py-2 px-2">Profit</th>
                      <th className="text-right py-2 px-2">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productScenarios.slice(0, 50).map((scenario, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2">{scenario.cpm_label}</td>
                        <td className="py-2 px-2">{scenario.ctr_label}</td>
                        <td className="py-2 px-2">{scenario.cvr_label}</td>
                        <td className="py-2 px-2">{scenario.basket_label}</td>
                        <td className="py-2 px-2">{fmt(scenario.aov)}</td>
                        <td className="py-2 px-2">{fmt(scenario.revenue_per_order)}</td>
                        <td className="py-2 px-2">{fmt(scenario.cpa_delivered)}</td>
                        <td className={`py-2 px-2 ${scenario.net_profit_per_order > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fmt(scenario.net_profit_per_order)}
                        </td>
                        <td className="py-2 px-2">{scenario.roas.toFixed(2)}</td>
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
