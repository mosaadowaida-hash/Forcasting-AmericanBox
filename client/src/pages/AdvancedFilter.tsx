import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Filter, RotateCcw, Download } from 'lucide-react';

export function AdvancedFilter() {
  const { data: products = [] } = trpc.products.list.useQuery();
  const { data: allScenarios = [], isLoading } = trpc.products.getAllScenarios.useQuery();

  // Filter states
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [profitMin, setProfitMin] = useState<string>('-1000');
  const [profitMax, setProfitMax] = useState<string>('1000');
  const [cpaMin, setCpaMin] = useState<string>('0');
  const [cpaMax, setCpaMax] = useState<string>('2000');
  const [roasMin, setRoasMin] = useState<string>('0');
  const [roasMax, setRoasMax] = useState<string>('10');
  const [cpmFilter, setCpmFilter] = useState<string>('all');
  const [ctrFilter, setCtrFilter] = useState<string>('all');
  const [cvrFilter, setCvrFilter] = useState<string>('all');
  const [basketFilter, setBasketFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const uniqueCPMs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.cpmLabel))).sort(), [allScenarios]);
  const uniqueCTRs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.ctrLabel))).sort(), [allScenarios]);
  const uniqueCVRs = useMemo(() => Array.from(new Set(allScenarios.map(s => s.cvrLabel))).sort(), [allScenarios]);
  const uniqueBaskets = useMemo(() => Array.from(new Set(allScenarios.map(s => s.basketLabel))).sort(), [allScenarios]);

  const filteredScenarios = useMemo(() => {
    return allScenarios.filter(s => {
      if (selectedProductId !== 'all' && String(s.productId) !== selectedProductId) return false;
      if (s.netProfitPerOrder < Number(profitMin) || s.netProfitPerOrder > Number(profitMax)) return false;
      if (s.cpaDelivered < Number(cpaMin) || s.cpaDelivered > Number(cpaMax)) return false;
      if (s.roas < Number(roasMin) || s.roas > Number(roasMax)) return false;
      if (cpmFilter !== 'all' && s.cpmLabel !== cpmFilter) return false;
      if (ctrFilter !== 'all' && s.ctrLabel !== ctrFilter) return false;
      if (cvrFilter !== 'all' && s.cvrLabel !== cvrFilter) return false;
      if (basketFilter !== 'all' && s.basketLabel !== basketFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      return true;
    });
  }, [allScenarios, selectedProductId, profitMin, profitMax, cpaMin, cpaMax, roasMin, roasMax, cpmFilter, ctrFilter, cvrFilter, basketFilter, statusFilter]);

  const stats = useMemo(() => {
    if (filteredScenarios.length === 0) return null;
    const profits = filteredScenarios.map(s => s.netProfitPerOrder);
    const roas = filteredScenarios.map(s => s.roas);
    return {
      count: filteredScenarios.length,
      profitable: filteredScenarios.filter(s => s.netProfitPerOrder > 0).length,
      avgProfit: profits.reduce((a, b) => a + b, 0) / profits.length,
      avgRoas: roas.reduce((a, b) => a + b, 0) / roas.length,
      maxProfit: Math.max(...profits),
      minProfit: Math.min(...profits),
    };
  }, [filteredScenarios]);

  const resetFilters = () => {
    setSelectedProductId('all');
    setProfitMin('-1000');
    setProfitMax('1000');
    setCpaMin('0');
    setCpaMax('2000');
    setRoasMin('0');
    setRoasMax('10');
    setCpmFilter('all');
    setCtrFilter('all');
    setCvrFilter('all');
    setBasketFilter('all');
    setStatusFilter('all');
  };

  const getProductName = (productId: number) => {
    return products.find(p => p.id === productId)?.name ?? 'غير معروف';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">تصفية متقدمة</h1>
          <p className="text-gray-600 mt-2">صفّي السيناريوهات حسب معايير متقدمة عبر جميع المنتجات</p>
        </div>
        <Button variant="outline" onClick={resetFilters}>
          <RotateCcw className="w-4 h-4 ml-2" /> إعادة تعيين
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">المنتج</CardTitle></CardHeader>
          <CardContent>
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المنتجات</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">CPM</CardTitle></CardHeader>
          <CardContent>
            <Select value={cpmFilter} onValueChange={setCpmFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {uniqueCPMs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">CTR</CardTitle></CardHeader>
          <CardContent>
            <Select value={ctrFilter} onValueChange={setCtrFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {uniqueCTRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">CVR</CardTitle></CardHeader>
          <CardContent>
            <Select value={cvrFilter} onValueChange={setCvrFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {uniqueCVRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Basket Size</CardTitle></CardHeader>
          <CardContent>
            <Select value={basketFilter} onValueChange={setBasketFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {uniqueBaskets.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">الحالة</CardTitle></CardHeader>
          <CardContent>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="ربح">ربح</SelectItem>
                <SelectItem value="خسارة">خسارة</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">نطاق الربح (ج.م)</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input type="number" placeholder="من" value={profitMin} onChange={e => setProfitMin(e.target.value)} />
            <Input type="number" placeholder="إلى" value={profitMax} onChange={e => setProfitMax(e.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">نطاق ROAS</CardTitle></CardHeader>
          <CardContent className="flex gap-2">
            <Input type="number" step="0.1" placeholder="من" value={roasMin} onChange={e => setRoasMin(e.target.value)} />
            <Input type="number" step="0.1" placeholder="إلى" value={roasMax} onChange={e => setRoasMax(e.target.value)} />
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-600">المطابقة</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.count.toLocaleString('ar-EG')}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-600">الرابحة</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold text-green-600">{stats.profitable.toLocaleString('ar-EG')}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-600">نسبة الربح</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold">{((stats.profitable / stats.count) * 100).toFixed(1)}%</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-600">متوسط الربح</CardTitle></CardHeader>
            <CardContent><div className={`text-xl font-bold ${stats.avgProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>{stats.avgProfit.toFixed(0)} ج.م</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-600">أعلى ربح</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold text-green-600">{stats.maxProfit.toFixed(0)} ج.م</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-600">متوسط ROAS</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.avgRoas.toFixed(2)}x</div></CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>النتائج ({filteredScenarios.length.toLocaleString('ar-EG')} سيناريو)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-right py-3 px-2">المنتج</th>
                  <th className="text-right py-3 px-2">CPM</th>
                  <th className="text-right py-3 px-2">CTR</th>
                  <th className="text-right py-3 px-2">CVR</th>
                  <th className="text-right py-3 px-2">Basket</th>
                  <th className="text-right py-3 px-2">AOV</th>
                  <th className="text-right py-3 px-2">CPA Dashboard</th>
                  <th className="text-right py-3 px-2">CPA Delivered</th>
                  <th className="text-right py-3 px-2">العائد</th>
                  <th className="text-right py-3 px-2">الربح</th>
                  <th className="text-right py-3 px-2">ROAS</th>
                  <th className="text-right py-3 px-2">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {filteredScenarios.slice(0, 200).map((s, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 text-xs font-medium">{getProductName(s.productId)}</td>
                    <td className="py-2 px-2 text-xs">{s.cpmLabel}</td>
                    <td className="py-2 px-2 text-xs">{s.ctrLabel}</td>
                    <td className="py-2 px-2 text-xs">{s.cvrLabel}</td>
                    <td className="py-2 px-2 text-xs">{s.basketLabel}</td>
                    <td className="py-2 px-2">{s.aov.toFixed(0)}</td>
                    <td className="py-2 px-2">{s.cpaDashboard.toFixed(0)}</td>
                    <td className="py-2 px-2">{s.cpaDelivered.toFixed(0)}</td>
                    <td className="py-2 px-2">{s.revenuePerOrder.toFixed(0)}</td>
                    <td className={`py-2 px-2 font-semibold ${s.netProfitPerOrder > 0 ? 'text-green-600' : 'text-red-600'}`}>{s.netProfitPerOrder.toFixed(0)}</td>
                    <td className="py-2 px-2">{s.roas.toFixed(2)}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${s.status === 'ربح' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredScenarios.length > 200 && (
              <p className="text-center text-sm text-gray-500 py-4">يتم عرض أول 200 نتيجة من {filteredScenarios.length.toLocaleString('ar-EG')}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
