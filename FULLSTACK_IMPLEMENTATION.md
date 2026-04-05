# محاكي الحملات والإيرادات - النسخة الديناميكية Full-Stack

## نظرة عامة

تم تحويل التطبيق من نسخة ثابتة (Static JSON) إلى نسخة **Full-Stack ديناميكية** متكاملة مع:
- **Backend**: Express.js + tRPC
- **Database**: Supabase (PostgreSQL)
- **Frontend**: React 19 + Tailwind CSS 4
- **ORM**: Drizzle ORM (جاهز للتوسع)

---

## البيانات المرفوعة

### 42 منتج
- 30 منتج عام (مكملات غذائية، فيتامينات، إلخ)
- 12 باندل منتجات

### 26,250 سيناريو
- **625 سيناريو لكل منتج** (5 CPM × 5 CTR × 5 CVR × 5 Basket Size)
- كل سيناريو يحتوي على:
  - CPM (تكلفة الألف ظهور)
  - CTR (نسبة النقر)
  - CVR (نسبة التحويل)
  - Basket Size (حجم السلة)
  - AOV (متوسط قيمة الطلب)
  - CPA (تكلفة الاستحواذ)
  - ROAS (العائد على الإنفاق الإعلاني)
  - صافي الربح

---

## البنية المعمارية

### Frontend (`client/src/`)
```
pages/
  ├── SupabaseDashboard.tsx    ← Dashboard الرئيسي (يقرأ من Supabase)
  ├── Home.tsx                 ← إعادة توجيه للـ Dashboard
  ├── Overview.tsx             ← نظرة عامة على جميع السيناريوهات
  ├── Ranking.tsx              ← ترتيب المنتجات
  ├── Analysis.tsx             ← تحليل تفصيلي للمنتج
  └── AdvancedFilter.tsx       ← تصفية متقدمة

components/
  ├── ui/                      ← shadcn/ui components
  └── DashboardLayout.tsx      ← Layout الرئيسي
```

### Backend (`server/`)
```
routers/
  └── products.ts              ← tRPC procedures للمنتجات

supabase.ts                     ← Supabase client و helper functions
_core/
  ├── trpc.ts                  ← tRPC configuration
  ├── context.ts               ← tRPC context
  ├── env.ts                   ← Environment variables
  └── index.ts                 ← Express server
```

### Database (Supabase)
```
products table:
  - id (UUID, PK)
  - name (text)
  - type (enum: product/bundle)
  - original_price (numeric)
  - discount_two_items (numeric, optional)
  - discount_three_items (numeric, optional)
  - bundle_discount (numeric, optional)
  - created_at (timestamp)
  - updated_at (timestamp)

scenarios table:
  - id (UUID, PK)
  - product_id (UUID, FK)
  - cpm (numeric)
  - cpm_label (text)
  - ctr (numeric)
  - ctr_label (text)
  - cvr (numeric)
  - cvr_label (text)
  - basket_size (numeric)
  - basket_label (text)
  - aov (numeric)
  - revenue_per_order (numeric)
  - cpa_dashboard (numeric)
  - cpa_delivered (numeric)
  - cogs (numeric)
  - net_profit_per_order (numeric)
  - roas (numeric)
  - created_at (timestamp)
```

---

## API Endpoints (tRPC)

### Products Router (`/api/trpc/products.*`)

#### 1. List All Products
```typescript
trpc.products.list.useQuery()
// Returns: Product[]
```

#### 2. Get Product by ID
```typescript
trpc.products.getById.useQuery(productId)
// Returns: Product | null
```

#### 3. Get All Scenarios
```typescript
trpc.products.getAllScenarios.useQuery()
// Returns: Scenario[]
```

#### 4. Get Scenarios for Product
```typescript
trpc.products.getScenarios.useQuery(productId)
// Returns: Scenario[]
```

#### 5. Create Product (+ Auto-Calculate 625 Scenarios)
```typescript
trpc.products.create.useMutation()
// Input: { name, type, original_price, discount_two_items?, discount_three_items?, bundle_discount? }
// Returns: Product
// Side Effect: Creates 625 scenarios automatically
```

#### 6. Update Product (+ Recalculate Scenarios)
```typescript
trpc.products.update.useMutation()
// Input: { id, name?, type?, original_price?, ... }
// Returns: Product
// Side Effect: Deletes old scenarios and creates 625 new ones
```

#### 7. Delete Product (+ Delete Scenarios)
```typescript
trpc.products.delete.useMutation()
// Input: productId
// Returns: { success: true }
// Side Effect: Deletes all scenarios for the product
```

---

## Scenario Calculation Engine

### الصيغ المستخدمة

```typescript
// متوسط قيمة الطلب
AOV = original_price × basket_size

// تكلفة الاستحواذ (Dashboard)
CPA_Dashboard = CPM / (CTR × CVR × 1000)

// تكلفة الاستحواذ (المسلمة)
CPA_Delivered = CPA_Dashboard × 1.15

// تكلفة البضاعة
COGS = original_price × 0.3

// صافي الربح لكل طلب
Net_Profit = AOV - CPA_Delivered - COGS

// العائد على الإنفاق الإعلاني
ROAS = AOV / CPA_Dashboard
```

### عوامل التصفية

| العامل | القيم |
|--------|-------|
| **CPM** | 50, 60, 70, 80, 90 EGP |
| **CTR** | 1.5%, 1.75%, 2%, 2.25%, 2.5% |
| **CVR** | 1%, 1.5%, 2%, 2.5%, 3% |
| **Basket Size** | 1.0, 1.2, 1.4, 1.6, 1.8 |

---

## ميزات Dashboard

### 1. اختيار المنتج
- قائمة منسدلة بجميع 42 منتج
- تحديث فوري للبيانات

### 2. الإحصائيات الرئيسية
- إجمالي السيناريوهات
- عدد السيناريوهات الرابحة
- متوسط الربح
- متوسط ROAS

### 3. التصفية المتقدمة
- تصفية حسب CPM, CTR, CVR, Basket Size
- عرض السيناريو المختار مع جميع المقاييس

### 4. الرسوم البيانية
- الربح حسب Basket Size
- ROAS حسب CPM

### 5. الجدول التفصيلي
- عرض أول 50 سيناريو
- جميع المقاييس الهامة

### 6. إضافة/تعديل/حذف المنتجات
- نموذج لإضافة منتج جديد
- حفظ فوري في Supabase
- إعادة حساب 625 سيناريو تلقائياً

---

## الاختبارات

### vitest Tests
```bash
pnpm test server/routers/products.test.ts
```

**النتائج:**
- ✅ 5/5 اختبارات تمرت
- ✅ قراءة البيانات من Supabase
- ✅ حسابات السيناريوهات صحيحة
- ✅ كل منتج له 625 سيناريو

---

## كيفية الاستخدام

### 1. تشغيل المشروع
```bash
cd /home/ubuntu/campaign-simulator-dashboard
pnpm dev
```

### 2. الوصول للـ Dashboard
```
http://localhost:3000
```

### 3. إضافة منتج جديد
1. اضغط على "إضافة منتج جديد"
2. أدخل بيانات المنتج
3. اضغط "حفظ المنتج"
4. سيتم حفظ المنتج و 625 سيناريو تلقائياً

### 4. تعديل منتج
1. اختر المنتج من القائمة
2. اضغط على أيقونة التعديل
3. غير البيانات المطلوبة
4. سيتم إعادة حساب جميع السيناريوهات

### 5. حذف منتج
1. اختر المنتج من القائمة
2. اضغط على أيقونة الحذف
3. سيتم حذف المنتج وجميع السيناريوهات

---

## ملفات مهمة

| الملف | الوصف |
|------|-------|
| `server/routers/products.ts` | tRPC procedures الرئيسية |
| `server/supabase.ts` | Supabase client و helper functions |
| `client/src/pages/SupabaseDashboard.tsx` | Dashboard الرئيسي |
| `scripts/migrate_to_supabase_fixed.mjs` | سكريبت الهجرة من JSON إلى Supabase |
| `server/routers/products.test.ts` | الاختبارات |

---

## الخطوات التالية (اختيارية)

1. **إضافة صفحات إضافية**:
   - صفحة Overview (نظرة عامة على جميع السيناريوهات)
   - صفحة Ranking (ترتيب المنتجات حسب الربح/ROAS)
   - صفحة Analysis (تحليل تفصيلي للمنتج)

2. **تحسينات الأداء**:
   - إضافة pagination للجداول
   - تخزين مؤقت (caching) للبيانات
   - تحسين استعلامات Supabase

3. **ميزات إضافية**:
   - تصدير البيانات (CSV/Excel)
   - مقارنة بين منتجات
   - تنبيهات عند تغيير الأسعار

---

## ملاحظات مهمة

- **البيانات الحية**: جميع البيانات تأتي من Supabase في الوقت الفعلي
- **الحسابات الديناميكية**: كل تعديل على المنتج يؤدي لإعادة حساب السيناريوهات
- **الأمان**: جميع العمليات تمر عبر tRPC (type-safe)
- **الاختبارات**: جميع الوظائف الأساسية مختبرة

---

## الدعم والمساعدة

للأسئلة أو المشاكل:
1. تحقق من السجلات: `.manus-logs/`
2. شغل الاختبارات: `pnpm test`
3. تحقق من الأخطاء: `pnpm run check`
