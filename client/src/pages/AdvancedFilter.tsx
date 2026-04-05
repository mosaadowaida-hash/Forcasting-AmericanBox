import { useState, useMemo } from 'react';
import { useAllProducts } from '@/hooks/useAllProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdvancedFilter() {
  const { allProducts, scenarios } = useAllProducts();

  // Filter states
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [profitRange, setProfitRange] = useState<[number, number]>([-1000, 1000]);
  const [cpaRange, setCpaRange] = useState<[number, number]>([0, 500]);
  const [roasRange, setRoasRange] = useState<[number, number]>([0, 5]);
  const [cpmFilter, setCpmFilter] = useState<string>('');
  const [ctrFilter, setCtrFilter] = useState<string>('');
  const [cvrFilter, setCvrFilter] = useState<string>('');

  const filteredScenarios = useMemo(() => {
    return scenarios.filter(scenario => {
      // Product filter
      if (selectedProducts.length > 0 && !selectedProducts.includes(scenario.product_id)) {
        return false;
      }

      // Profit filter
      if (scenario.net_profit_per_order < profitRange[0] || scenario.net_profit_per_order > profitRange[1]) {
        return false;
      }

      // CPA filter
      if (scenario.cpa_delivered < cpaRange[0] || scenario.cpa_delivered > cpaRange[1]) {
        return false;
      }

      // ROAS filter
      if (scenario.roas < roasRange[0] || scenario.roas > roasRange[1]) {
        return false;
      }

      // CPM filter
      if (cpmFilter && scenario.cpm_label !== cpmFilter) {
        return false;
      }

      // CTR filter
      if (ctrFilter && scenario.ctr_label !== ctrFilter) {
        return false;
      }

      // CVR filter
      if (cvrFilter && scenario.cvr_label !== cvrFilter) {
        return false;
      }

      return true;
    });
  }, [scenarios, selectedProducts, profitRange, cpaRange, roasRange, cpmFilter, ctrFilter, cvrFilter]);

  const uniqueCPMs = useMemo(() => Array.from(new Set(scenarios.map(s => s.cpm_label))), [scenarios]);
  const uniqueCTRs = useMemo(() => Array.from(new Set(scenarios.map(s => s.ctr_label))), [scenarios]);
  const uniqueCVRs = useMemo(() => Array.from(new Set(scenarios.map(s => s.cvr_label))), [scenarios]);

  const stats = useMemo(() => {
    if (filteredScenarios.length === 0) return null;

    const profits = filteredScenarios.map(s => s.net_profit_per_order);
    const roas = filteredScenarios.map(s => s.roas);

    return {
      count: filteredScenarios.length,
      profitable: filteredScenarios.filter(s => s.net_profit_per_order > 0).length,
      avgProfit: profits.reduce((a, b) => a + b, 0) / profits.length,
      avgRoas: roas.reduce((a, b) => a + b, 0) / roas.length,
    };
  }, [filteredScenarios]);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold">تصفية متقدمة</h1>
        <p className="text-gray-600 mt-2">صفّي السيناريوهات حسب معايير متقدمة</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedProducts[0] || ''}
              onValueChange={(value) => {
                if (selectedProducts.includes(value)) {
                  setSelectedProducts(selectedProducts.filter(p => p !== value));
                } else {
                  setSelectedProducts([...selectedProducts, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المنتجات" />
              </SelectTrigger>
              <SelectContent>
                {allProducts.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">نطاق الربح (ج.م)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              type="number"
              placeholder="الحد الأدنى"
              value={profitRange[0]}
              onChange={(e) => setProfitRange([parseInt(e.target.value), profitRange[1]])}
            />
            <Input
              type="number"
              placeholder="الحد الأقصى"
              value={profitRange[1]}
              onChange={(e) => setProfitRange([profitRange[0], parseInt(e.target.value)])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">نطاق CPA (ج.م)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              type="number"
              placeholder="الحد الأدنى"
              value={cpaRange[0]}
              onChange={(e) => setCpaRange([parseInt(e.target.value), cpaRange[1]])}
            />
            <Input
              type="number"
              placeholder="الحد الأقصى"
              value={cpaRange[1]}
              onChange={(e) => setCpaRange([cpaRange[0], parseInt(e.target.value)])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">نطاق ROAS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              type="number"
              step="0.1"
              placeholder="الحد الأدنى"
              value={roasRange[0]}
              onChange={(e) => setRoasRange([parseFloat(e.target.value), roasRange[1]])}
            />
            <Input
              type="number"
              step="0.1"
              placeholder="الحد الأقصى"
              value={roasRange[1]}
              onChange={(e) => setRoasRange([roasRange[0], parseFloat(e.target.value)])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CPM</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={cpmFilter} onValueChange={setCpmFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                {uniqueCPMs.map(cpm => (
                  <SelectItem key={cpm} value={cpm}>
                    {cpm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={ctrFilter} onValueChange={setCtrFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                {uniqueCTRs.map(ctr => (
                  <SelectItem key={ctr} value={ctr}>
                    {ctr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">CVR</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={cvrFilter} onValueChange={setCvrFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">الكل</SelectItem>
                {uniqueCVRs.map(cvr => (
                  <SelectItem key={cvr} value={cvr}>
                    {cvr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">السيناريوهات المطابقة</CardTitle>
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
              <div className="text-2xl font-bold text-green-600">{stats.profitable}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">متوسط الربح</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgProfit.toFixed(0)} ج.م</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">متوسط ROAS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRoas.toFixed(2)}x</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>النتائج</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-right py-2">المنتج</th>
                  <th className="text-right py-2">CPM</th>
                  <th className="text-right py-2">CTR</th>
                  <th className="text-right py-2">CVR</th>
                  <th className="text-right py-2">الربح</th>
                  <th className="text-right py-2">CPA</th>
                  <th className="text-right py-2">ROAS</th>
                </tr>
              </thead>
              <tbody>
                {filteredScenarios.slice(0, 50).map((scenario, idx) => {
                  const product = allProducts.find(p => p.id === scenario.product_id);
                  return (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 text-xs">{product?.name}</td>
                      <td className="py-2">{scenario.cpm_label}</td>
                      <td className="py-2">{scenario.ctr_label}</td>
                      <td className="py-2">{scenario.cvr_label}</td>
                      <td className="py-2">
                        <span className={scenario.net_profit_per_order > 0 ? 'text-green-600' : 'text-red-600'}>
                          {scenario.net_profit_per_order.toFixed(0)}
                        </span>
                      </td>
                      <td className="py-2">{scenario.cpa_delivered.toFixed(0)}</td>
                      <td className="py-2">{scenario.roas.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
