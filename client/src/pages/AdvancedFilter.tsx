import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, RotateCcw, Search } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActiveFilters {
  productId: string;
  cpm: string;
  ctr: string;
  cvr: string;
  aovMin: string;
  aovMax: string;
}

const EMPTY_FILTERS: ActiveFilters = {
  productId: 'all',
  cpm: 'all',
  ctr: 'all',
  cvr: 'all',
  aovMin: '',
  aovMax: '',
};

// ─── Component ────────────────────────────────────────────────────────────────
export function AdvancedFilter() {
  const { data: products = [] } = trpc.products.list.useQuery();
  const { data: allScenarios = [], isLoading } = trpc.products.getAllScenarios.useQuery();

  // "Draft" filter values — only applied when user clicks the button
  const [draft, setDraft] = useState<ActiveFilters>(EMPTY_FILTERS);

  // "Applied" filter values — what the table actually uses
  const [applied, setApplied] = useState<ActiveFilters>(EMPTY_FILTERS);

  // Whether results have been shown at least once
  const [hasSearched, setHasSearched] = useState(false);

  // Unique label values for dropdowns
  const uniqueCPMs = Array.from(new Set(allScenarios.map(s => s.cpmLabel))).sort();
  const uniqueCTRs = Array.from(new Set(allScenarios.map(s => s.ctrLabel))).sort();
  const uniqueCVRs = Array.from(new Set(allScenarios.map(s => s.cvrLabel))).sort();

  // Apply filters only when button is clicked
  const handleShowScenarios = () => {
    setApplied({ ...draft });
    setHasSearched(true);
  };

  // Reset both draft and applied
  const handleReset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setHasSearched(false);
  };

  // Compute filtered results from applied (not draft)
  // When no filters are set, all scenarios are shown
  const filteredScenarios = hasSearched
    ? allScenarios.filter(s => {
        if (applied.productId !== 'all' && String(s.productId) !== applied.productId) return false;
        if (applied.cpm !== 'all' && s.cpmLabel !== applied.cpm) return false;
        if (applied.ctr !== 'all' && s.ctrLabel !== applied.ctr) return false;
        if (applied.cvr !== 'all' && s.cvrLabel !== applied.cvr) return false;
        if (applied.aovMin !== '' && s.aov < Number(applied.aovMin)) return false;
        if (applied.aovMax !== '' && s.aov > Number(applied.aovMax)) return false;
        return true;
      })
    : [];

  // Summary stats
  const stats = hasSearched && filteredScenarios.length > 0
    ? (() => {
        const profits = filteredScenarios.map(s => s.netProfitPerOrder);
        const roas = filteredScenarios.map(s => s.roas);
        return {
          count: filteredScenarios.length,
          profitable: filteredScenarios.filter(s => s.netProfitPerOrder > 0).length,
          avgProfit: profits.reduce((a, b) => a + b, 0) / profits.length,
          avgRoas: roas.reduce((a, b) => a + b, 0) / roas.length,
          maxProfit: Math.max(...profits),
        };
      })()
    : null;

  const getProductName = (productId: number) =>
    products.find(p => p.id === productId)?.name ?? 'غير معروف';

  // Count how many filters are active in the draft
  const activeDraftCount = Object.entries(draft).filter(([k, v]) => {
    if (k === 'aovMin' || k === 'aovMax') return v !== '';
    return v !== 'all';
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Filter className="w-7 h-7 text-blue-600" />
            تصفية متقدمة
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            اختر فلترًا واحدًا أو أكثر ثم اضغط "عرض السيناريوهات"
          </p>
        </div>
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          إعادة تعيين
        </Button>
      </div>

      {/* Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Product */}
        <Card className="border-2 hover:border-blue-300 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">المنتج</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={draft.productId} onValueChange={v => setDraft(d => ({ ...d, productId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="جميع المنتجات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المنتجات</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* CPM */}
        <Card className="border-2 hover:border-blue-300 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">CPM</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={draft.cpm} onValueChange={v => setDraft(d => ({ ...d, cpm: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {uniqueCPMs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* CTR */}
        <Card className="border-2 hover:border-blue-300 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={draft.ctr} onValueChange={v => setDraft(d => ({ ...d, ctr: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {uniqueCTRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* CVR */}
        <Card className="border-2 hover:border-blue-300 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">CVR</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={draft.cvr} onValueChange={v => setDraft(d => ({ ...d, cvr: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {uniqueCVRs.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* AOV Range */}
        <Card className="border-2 hover:border-blue-300 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">AOV (ج.م)</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              type="number"
              placeholder="من"
              value={draft.aovMin}
              onChange={e => setDraft(d => ({ ...d, aovMin: e.target.value }))}
              className="text-sm"
            />
            <Input
              type="number"
              placeholder="إلى"
              value={draft.aovMax}
              onChange={e => setDraft(d => ({ ...d, aovMax: e.target.value }))}
              className="text-sm"
            />
          </CardContent>
        </Card>
      </div>

      {/* Show Scenarios Button */}
      <div className="flex items-center gap-4">
        <Button
          size="lg"
          onClick={handleShowScenarios}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold shadow-md"
        >
          <Search className="w-5 h-5" />
          عرض السيناريوهات
          {activeDraftCount > 0 && (
            <span className="bg-white text-blue-600 text-xs font-bold rounded-full px-2 py-0.5 mr-1">
              {activeDraftCount}
            </span>
          )}
        </Button>
        {hasSearched && (
          <p className="text-sm text-gray-500">
            {filteredScenarios.length === 0
              ? 'لا توجد نتائج مطابقة'
              : `${filteredScenarios.length.toLocaleString('ar-EG')} سيناريو مطابق`}
          </p>
        )}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-gray-500">إجمالي النتائج</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold">{stats.count.toLocaleString('ar-EG')}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-gray-500">السيناريوهات الرابحة</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold text-green-600">{stats.profitable.toLocaleString('ar-EG')}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-gray-500">نسبة الربح</CardTitle></CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                {((stats.profitable / stats.count) * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-gray-500">متوسط الربح</CardTitle></CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${stats.avgProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.avgProfit.toFixed(0)} ج.م
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1"><CardTitle className="text-xs text-gray-500">أعلى ربح</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-bold text-green-600">{stats.maxProfit.toFixed(0)} ج.م</div></CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>
              النتائج ({filteredScenarios.length.toLocaleString('ar-EG')} سيناريو)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredScenarios.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-lg">لا توجد سيناريوهات مطابقة للفلاتر المحددة</p>
                <p className="text-sm mt-1">جرّب تغيير أحد الفلاتر أو إعادة التعيين</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="text-right py-3 px-2 font-semibold">المنتج</th>
                      <th className="text-right py-3 px-2 font-semibold">CPM</th>
                      <th className="text-right py-3 px-2 font-semibold">CTR</th>
                      <th className="text-right py-3 px-2 font-semibold">CVR</th>
                      <th className="text-right py-3 px-2 font-semibold">Basket</th>
                      <th className="text-right py-3 px-2 font-semibold">AOV</th>
                      <th className="text-right py-3 px-2 font-semibold">CPA Dashboard</th>
                      <th className="text-right py-3 px-2 font-semibold">CPA Delivered</th>
                      <th className="text-right py-3 px-2 font-semibold">العائد</th>
                      <th className="text-right py-3 px-2 font-semibold">الربح</th>
                      <th className="text-right py-3 px-2 font-semibold">ROAS</th>
                      <th className="text-right py-3 px-2 font-semibold">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScenarios.slice(0, 500).map((s, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-2 px-2 text-xs font-medium max-w-[120px] truncate">{getProductName(s.productId)}</td>
                        <td className="py-2 px-2 text-xs">{s.cpmLabel}</td>
                        <td className="py-2 px-2 text-xs">{s.ctrLabel}</td>
                        <td className="py-2 px-2 text-xs">{s.cvrLabel}</td>
                        <td className="py-2 px-2 text-xs">{s.basketLabel}</td>
                        <td className="py-2 px-2">{s.aov.toFixed(0)}</td>
                        <td className="py-2 px-2">{s.cpaDashboard.toFixed(0)}</td>
                        <td className="py-2 px-2">{s.cpaDelivered.toFixed(0)}</td>
                        <td className="py-2 px-2">{s.revenuePerOrder.toFixed(0)}</td>
                        <td className={`py-2 px-2 font-semibold ${s.netProfitPerOrder > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {s.netProfitPerOrder.toFixed(0)}
                        </td>
                        <td className="py-2 px-2">{s.roas.toFixed(2)}</td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'ربح' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredScenarios.length > 500 && (
                  <p className="text-center text-sm text-gray-400 py-4">
                    يتم عرض أول 500 نتيجة من {filteredScenarios.length.toLocaleString('ar-EG')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state before first search */}
      {!hasSearched && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Search className="w-14 h-14 mb-4 opacity-20" />
            <p className="text-lg font-medium">اختر الفلاتر المطلوبة ثم اضغط "عرض السيناريوهات"</p>
            <p className="text-sm mt-1">يمكنك الضغط مباشرة بدون فلاتر لعرض جميع السيناريوهات</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
