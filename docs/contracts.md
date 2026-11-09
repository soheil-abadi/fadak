# قراردادهای جست‌وجو و سرویس هتل

این سند مرجع رفتار داده، URL، تاریخ و قیمت است. این قراردادها در نسخه فعلی برنامه پیاده‌سازی شده‌اند؛ وضعیت بررسی هر بخش در گزارش بررسی ثبت می‌شود. تغییر آن‌ها باید با مثال‌ها، [معماری](architecture.md)، [تصمیم‌ها](decisions.md) و سناریوهای [تحویل](delivery.md) هماهنگ شود.

## ورودی معتبر و محدودیت نسخه

| فیلد | قرارداد |
| --- | --- |
| `city` | یکی از `tehran`، `mashhad`، `shiraz`، `kish`، `isfahan`؛ نمایش به‌ترتیب تهران، مشهد، شیراز، کیش و اصفهان. فرم مقصد را با جعبه جست‌وجو روی همین نام‌ها انتخاب می‌کند؛ query متن آزاد نمی‌پذیرد. |
| `checkIn` و `checkOut` | روز واقعی میلادی با ارقام ASCII و قالب دقیق `YYYY-MM-DD`؛ regex به‌تنهایی اعتبار روز را ثابت نمی‌کند. |
| بازه تاریخ | `todayTehran <= checkIn < checkOut <= todayTehran + 365 days` و اقامت از ۱ تا ۳۰ شب. روز خروج جزو شب‌های اقامت نیست. |
| `rooms` | عدد صحیح از ۱ تا ۵؛ پیش‌فرض فرم ۱. |
| `guests` | عدد صحیح از ۱ تا ۱۰؛ پیش‌فرض فرم ۲. هر اتاق انتخاب‌شده حداقل یک مسافر داشته باشد، پس `guests >= rooms`. |
| ظرفیت Mock | اتاق‌ها هم‌نوع‌اند، هر اتاق دو نفر ظرفیت دارد؛ `guests <= rooms * 2` شرط موجودبودن پیشنهاد است و ظرفیت ناکافی نتیجه را حذف می‌کند. |
| ورودی عددی فرم | ارقام فارسی و عربی پیش از اعتبارسنجی به ASCII تبدیل می‌شوند؛ مقدار اعشاری، منفی و رشته ترکیبی پذیرفته نمی‌شود. |

سقف‌ها و مدل ظرفیت، تصمیم این نسخه‌اند. سن کودک، تخت اضافه و ترکیب چند نوع اتاق پشتیبانی نمی‌شود؛ «مسافر» فقط تعداد نفر است. درخواست معتبر با ظرفیت بالاتر از پیشنهاد، خطای فرم نیست و می‌تواند بدون نتیجه باشد. در صفحه بدون query، شهر و تاریخ خالی هستند و هیچ جست‌وجوی خودکاری انجام نمی‌شود.

اعتبارسنجی با schema مشترک Zod در فرم و در مرز سرور انجام می‌شود. ساعت از بیرون به تابع اعتبارسنجی داده می‌شود تا تست‌ها قطعی باشند. Type ورودی در پیاده‌سازی از schema استنتاج می‌شود؛ Typeهای زیر شکل قرارداد را نشان می‌دهند. [مرجع safeParse و استنتاج Type](https://zod.dev/basics).

## مدل نرمال‌شده و رابط provider

```typescript
type DateOnly = string; // Validated Gregorian YYYY-MM-DD, not an instant
type CityId = 'tehran' | 'mashhad' | 'shiraz' | 'kish' | 'isfahan';
type HotelSort = 'price_asc' | 'rating_desc';
type StarRating = 1 | 2 | 3 | 4 | 5;
type Amenity = 'wifi' | 'parking' | 'breakfast' | 'pool';

interface HotelSearchInput {
  readonly city: CityId;
  readonly checkIn: DateOnly;
  readonly checkOut: DateOnly;
  readonly rooms: number;
  readonly guests: number;
}

interface HotelFilters {
  readonly minPrice?: number; // IRR per room per night
  readonly maxPrice?: number; // IRR per room per night
  readonly stars?: StarRating; // Exact match
}

interface HotelSearchQuery {
  readonly input: HotelSearchInput;
  readonly filters: HotelFilters;
  readonly sort: HotelSort;
}

interface Money {
  readonly amount: number; // Non-negative safe integer, divisible by 10 in Mock
  readonly currency: 'IRR';
}

interface StayQuote {
  readonly nightlyPerRoom: Money;
  readonly nights: number;
  readonly rooms: number;
  readonly total: Money;
}

interface HotelImage {
  readonly src: string;
  readonly alt: string;
}

interface HotelLocation {
  readonly latitude: number;
  readonly longitude: number;
}

interface HotelSummary {
  readonly id: string;
  readonly name: string;
  readonly city: CityId;
  readonly address: string;
  readonly stars: StarRating;
  readonly rating: number; // 0..10
  readonly amenities: readonly Amenity[];
  readonly image: HotelImage; // First gallery image for cards
  readonly images: readonly HotelImage[]; // One to three illustrative photos
  readonly location: HotelLocation; // Demonstrative coordinates near the city
  readonly quote: StayQuote;
}

interface HotelDetails extends HotelSummary {
  readonly description: string;
  readonly availableRooms: number;
  readonly maxGuestsPerRoom: number;
}

interface HotelSearchResponse {
  readonly items: readonly HotelSummary[];
  readonly total: number;
}

type HotelErrorCode =
  | 'INVALID_INPUT'
  | 'TIMEOUT'
  | 'UPSTREAM_ERROR'
  | 'INVALID_RESPONSE'
  | 'NOT_FOUND'
  | 'UNAVAILABLE';

type Result<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly error: {
      readonly code: HotelErrorCode;
      readonly message: string;
      readonly retryable: boolean;
      readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
    } };

interface HotelProvider {
  search(input: HotelSearchInput): Promise<Result<HotelSearchResponse>>;
  getDetails(hotelId: string, input: HotelSearchInput): Promise<Result<HotelDetails>>;
}
```

سرویس application، query معتبر و یک `HotelProvider` را دریافت می‌کند. provider تمام پیشنهادهای مطابق شهر، اقامت و ظرفیت را برمی‌گرداند؛ فیلتر قیمت و ستاره و مرتب‌سازی در منطق دامنه، پس از پاسخ provider انجام می‌شوند. `total` تعداد `items` همان خروجی است؛ در پاسخ نهایی سرویس تعداد پس از فیلتر را نشان می‌دهد. برای مجموعه کوچک Mock صفحه‌بندی وجود ندارد.

provider فقط داده نرمال‌شده و قابل سریال‌سازی برمی‌گرداند. ساخت درخواست خارجی، اعتبارسنجی پاسخ و تبدیل واحد provider در آداپتور انجام می‌شود. داده نامعتبر provider خطای `INVALID_RESPONSE` است؛ به‌صورت خام به UI نمی‌رسد. قیمت و ظرفیت با همان ورودی اقامت در جزئیات دوباره محاسبه می‌شوند. شناسه معتبر در شهر دیگر مانند شناسه ناموجود `NOT_FOUND` است؛ شناسه موجود در شهر درست ولی با ظرفیت ناکافی `UNAVAILABLE` است.

## URL و بازیابی وضعیت

مسیر نتایج `/hotels` و مسیر جزئیات `/hotels/[hotelId]` است. query هر دو مسیر قرارداد مشترک دارد و پیوند برگشت به نتایج همان query را حفظ می‌کند. پیش‌نمایش رزرو یک پنجره در صفحه جزئیات است؛ بازبودن آن قابل اشتراک نیست.

| کلید | شکل در URL و رفتار |
| --- | --- |
| `city`، `checkIn`، `checkOut` | برای جست‌وجوی ثبت‌شده الزامی‌اند. |
| `rooms`، `guests` | اگر غایب باشند به‌ترتیب ۱ و ۲؛ serializer همیشه آن‌ها را می‌نویسد. |
| `minPrice`، `maxPrice` | اختیاری، عدد صحیح نامنفی بر حسب ریال برای هر اتاق در هر شب؛ دو مرز شامل‌اند و حد پایین نباید بیشتر از بالا باشد. |
| `stars` | اختیاری، یک عدد صحیح ۱ تا ۵ برای تطبیق دقیق ستاره. |
| `sort` | `price_asc` یا `rating_desc`؛ غیبت برابر `price_asc`. |

serializer فقط همین کلیدها را با ترتیب جدول می‌نویسد، مقادیر اختیاری خالی را حذف می‌کند و ارقام ASCII تولید می‌کند. هر کلید شناخته‌شده حداکثر یک‌بار مجاز است؛ مقدار تکراری، خالی یا نامعتبر خطای ورودی است. کلید ناشناخته در parse نادیده و در navigation بعدی حذف می‌شود. query با هیچ کلید شناخته‌شده، حالت شروع است؛ وجود کلید شناخته‌شده ولی نبود شهر یا تاریخ کامل، جست‌وجوی ناقص و دارای خطاست. مقادیر عددی URL فقط ارقام ASCII می‌پذیرند؛ تبدیل ارقام فارسی برای ورودی فرم است. در جزئیات، اقامت کامل لازم است و نبود آن پیام بازگشت به فرم می‌دهد.

ورودی URL نامعتبر به جست‌وجوی تصادفی یا تاریخ جدید تبدیل نمی‌شود. پیام فارسی و فرم اصلاح نمایش داده می‌شود و provider فراخوانی نمی‌شود. مقادیر قابل نمایش در فرم حفظ می‌شوند؛ مقدار ناشناخته به گزینه معتبر دیگری تبدیل نمی‌شود. نام فیلد برای اتصال خطا ثابت است؛ پیام خارجی provider به‌صورت خام نمایش داده نمی‌شود.

ثبت فرم با `router.push` query جدید می‌سازد و فیلترها و sort را به پیش‌فرض برمی‌گرداند. فیلتر قیمت تا زدن دکمه «اعمال فیلترها» draft محلی است؛ ستاره نیز همراه همان دکمه ثبت می‌شود. تغییر sort فوری با push و بدون حذف جست‌وجو یا فیلترهاست. «پاک‌کردن فیلترها» تنها فیلترها را حذف می‌کند و sort را نگه می‌دارد. Back/Forward باید فرم و کنترل‌ها و نتایج را از URL بازسازی کند؛ ورودی ثبت‌نشده باقی نمی‌ماند.

برای navigation از آخرین query معتبر استفاده می‌شود. حین transition کنترل‌های ثبت مجدد غیرفعال و حالت انتظار اعلام می‌شود؛ جلوگیری از ثبت پیاپی، مانع overwrite تغییرهای هم‌زمان با query قدیمی می‌شود. قرارداد اصلی parser و serializer این است: `parse(serialize(query))` از نظر معنایی برابر query معتبر باشد.

نمونه، با فرض ثابت `todayTehran = 2026-11-07`:

```text
/hotels?city=tehran&checkIn=2026-11-10&checkOut=2026-11-12&rooms=1&guests=2&minPrice=10000000&maxPrice=30000000&stars=4&sort=price_asc
```

این لینک fixture مستندات است و همیشه به‌عنوان جست‌وجوی آینده معتبر نخواهد بود. در دمو تاریخ از امروز تهران ساخته می‌شود؛ در تست، ساعت روی تاریخ مشخص ثابت می‌ماند.

## قیمت و ترتیب نتایج

واحد ذخیره و URL، ریال است؛ ورودی و نمایش رابط با برچسب صریح «تومان» ارائه می‌شود. فرم قیمت فقط تومان صحیح می‌پذیرد و پیش از ساخت query در ۱۰ ضرب می‌شود. آداپتور Mock مبالغ صحیح و مضرب ۱۰ تولید می‌کند تا نمایش تومان نیاز به گردکردن نداشته باشد. ورودی query ریالی غیرمضرب ۱۰ برای این نسخه نامعتبر است. همه محاسبات باید safe integer باقی بمانند.

قیمت در فیلتر، کارت و مرتب‌سازی قیمت، نرخ یک شب برای یک اتاق است. در خلاصه رزرو «مبلغ کل اقامت برای همه اتاق‌ها» جداگانه نمایش داده می‌شود:

```text
nightlyPerRoom = 18,000,000 IRR = 1,800,000 toman
nights = 2
rooms = 1
total = nightlyPerRoom * nights * rooms = 36,000,000 IRR = 3,600,000 toman
```

در Mock مالیات یا هزینه پنهان دیگری وجود ندارد و همین موضوع در پیش‌نمایش نوشته می‌شود. برای دو اتاق در همین اقامت، مبلغ کل `72,000,000 IRR` است. تعداد نفر در محدوده ظرفیت قیمت را تغییر نمی‌دهد. مرتب‌سازی قیمت صعودی و امتیاز نزولی است؛ در تساوی، شناسه ASCII هتل به ترتیب صعودی معیار نهایی است تا ترتیب در Refresh ثابت بماند.

## تقویم و قرارداد روز

تقویم از `react-multi-date-picker` در حالت range و آداپتور `react-date-object/calendars/persian` با locale `persian_fa` استفاده می‌کند. طبق [مرجع تقویم‌ها](https://shahabyazdi.github.io/react-multi-date-picker/calendars/)، گزینه `jalali` مستقل است و در برخی تبدیل‌ها می‌تواند با `persian` یک روز تفاوت داشته باشد. قرارداد این نسخه دقیقاً ماژول `persian` در نسخه قفل‌شده است؛ ادعای یکسان‌بودن تمام الگوریتم‌ها یا انطباق همه سال‌ها با تقویم رسمی مطرح نمی‌شود.

نمایش شمسی است ولی داده سرویس و URL روز میلادی بدون ساعت است. تبدیل انتخاب تقویم با **کپی** DateObject و تبدیل تقویم آن به Gregorian انجام می‌شود؛ سال، ماه و روز عددی نتیجه با zero-padding به ASCII تبدیل می‌شوند. مسیر معکوس با اجزای عددی میلادی ساخته و به همان تقویم `persian` تبدیل می‌شود. تبدیل نباید شیء range فرم را mutate کند. [مرجع انتخاب بازه](https://shahabyazdi.github.io/react-multi-date-picker/range/).

`new Date(persianText)` یا تبدیل انتخاب تقویم با `toISOString().slice(0, 10)` روش این پروژه نیست؛ آن‌ها روز اقامت را به instant و timezone وابسته می‌کنند. اختلاف شب‌ها از ordinal روزهای میلادی محاسبه می‌شود، نه تفاضل نیمه‌شب محلی در DST. استفاده داخلی از UTC برای شمارش روزهای میلادی با تبدیل روز انتخاب‌شده به instant برای ارسال API متفاوت است.

«امروز» از instant ساعت سرور و timezone صریح `Asia/Tehran` استخراج می‌شود؛ سپس فقط رشته date-only به کلاینت می‌رسد. قاعده ۳۶۵ روز، روز تقویمی میلادی است. پس از پایان ویرایش متنی ورود (خروج از فیلد یا ثبت فرم)، خروج فقط اگر با ورود جدید ناسازگار باشد پاک می‌شود و پیام انتخاب دوباره خروج نمایش داده می‌شود؛ ورود بدون تغییر یا بازه همچنان معتبر، خروج را حفظ می‌کند. مقدارهای میانی تایپ باعث پاک‌شدن خروج نمی‌شوند. range ناقص قابل ثبت نیست. هنگام اقامت ۳۰ شبه و مرز افق رزرو نیز همان schema سرور تصمیم می‌گیرد.

برای fixture ثابت، زوج‌های نوروز `1403/01/01 ↔ 2024-03-20` و `1404/01/01 ↔ 2025-03-21` و روز کبیسه `1403/12/30 ↔ 2025-03-20` معیار آزمون پیشنهادی‌اند. این زوج‌ها در تست‌های تقویم با نسخه نصب‌شده بررسی می‌شوند؛ تست مرورگر ورود متنی نیز از Intl به‌عنوان تبدیل مستقل استفاده می‌کند. نتیجه اجرا در گزارش بررسی آمده است. برای این نمونه‌های تاریخی، clock تست نیز متناسب ثابت می‌شود.

## نمونه پاسخ موفق

این نمونه پاسخ نرمال‌شده سرویس پس از فیلتر چهار ستاره، برای شهر تهران و اقامت نمونه دوشبه در یک اتاق است. نام، آدرس و هتل کاملاً آزمایشی‌اند؛ مسیر تصویر به دارایی محلی برنامه اشاره می‌کند.

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "tehran-02",
        "name": "هتل باغ نیلوفر",
        "city": "tehran",
        "address": "تهران، خیابان ولیعصر، نشانی نمایشی ۲",
        "stars": 4,
        "rating": 8.7,
        "amenities": [
          "wifi",
          "parking",
          "breakfast"
        ],
        "image": {
          "src": "/images/hotels/room.jpg",
          "alt": "تصویر نمایشی ۱ از هتل باغ نیلوفر"
        },
        "images": [
          {
            "src": "/images/hotels/room.jpg",
            "alt": "تصویر نمایشی ۱ از هتل باغ نیلوفر"
          },
          {
            "src": "/images/hotels/resort.jpg",
            "alt": "تصویر نمایشی ۲ از هتل باغ نیلوفر"
          },
          {
            "src": "/images/hotels/garden.jpg",
            "alt": "تصویر نمایشی ۳ از هتل باغ نیلوفر"
          }
        ],
        "location": {
          "latitude": 35.7339,
          "longitude": 51.3427
        },
        "quote": {
          "nightlyPerRoom": {
            "amount": 19500000,
            "currency": "IRR"
          },
          "nights": 2,
          "rooms": 1,
          "total": {
            "amount": 39000000,
            "currency": "IRR"
          }
        }
      }
    ],
    "total": 1
  }
}
```

## داده Mock و سناریوهای کنترل‌شده

۱۲ هتل ثابت، سه هتل در هر یک از تهران، مشهد، شیراز و کیش وجود دارد؛ اصفهان شهر معتبر بدون fixture است تا حالت خالی طبیعی قابل تکرار باشد. در هر شهر، ستاره‌های ۳، ۴ و ۵، امتیازهای متفاوت و نرخ‌های متفاوت وجود دارد. حداقل یک پیشنهاد ارزان‌تر امتیاز پایین‌تری دارد تا دو sort نتیجه متفاوتی داشته باشند. داده خام شامل `availableRooms`، `maxGuestsPerRoom`، گالری تصاویر نمایشی و مختصات نمایشی نزدیک شهر است؛ `quote` از اقامت ساخته می‌شود و در fixture به یک تاریخ ثابت گره نمی‌خورد.

ظرفیت در تمام بازه‌های معتبر این Mock ثابت است؛ موجودی واقعی روزانه یا افزایش قیمت فصلی شبیه‌سازی نمی‌شود. ورودی شهر، تاریخ و ظرفیت واقعاً در پاسخ یا محاسبه quote اثر می‌گذارد. فیلترها از داده مشتق می‌شوند و پاسخ آماده بر اساس نام یک فیلتر جایگزین محاسبه نمی‌شود.

| تنظیم سروری | مقدار و رفتار |
| --- | --- |
| `HOTEL_MOCK_SCENARIO` | `success` پیش‌فرض؛ یا `empty`، `error`، `timeout`. روی search و getDetails اعمال می‌شود؛ در حالت empty، جزئیات هتل موجود `UNAVAILABLE` می‌دهد. |
| `HOTEL_MOCK_DELAY_MS` | عدد صحیح ۰ تا ۵۰۰۰؛ پیش‌فرض ۶۰۰. پس از این انتظار، سناریوی انتخابی برمی‌گردد. |

تنظیمات فقط سروری‌اند و بعد از تغییر، سرور محلی دوباره اجرا می‌شود. برای تست، factory آداپتور همان تنظیمات را بدون وابستگی به process سراسری دریافت می‌کند. تست‌ها از تأخیر صفر یا fake timer استفاده می‌کنند. `timeout` یک **شبیه‌سازی نتیجه timeout** است و شاهد اجرای AbortController شبکه نیست. آداپتور خارجی آینده timeout واقعی ۸ ثانیه و لغو درخواست خواهد داشت. مقدار نامعتبر env خطای پیکربندی است.

## خطا، تلاش مجدد و مرز امنیت

| کد | نمایش و اقدام | قابلیت تلاش مجدد |
| --- | --- | --- |
| `INVALID_INPUT` | خطای فارسی کنار فیلدها و خلاصه خطا؛ بدون درخواست provider | خیر، ابتدا اصلاح ورودی |
| `TIMEOUT` | «دریافت اطلاعات بیش از حد طول کشید. دوباره تلاش کنید.» | بله |
| `UPSTREAM_ERROR` | «دریافت هتل‌ها انجام نشد. دوباره تلاش کنید.» | بله |
| `INVALID_RESPONSE` | پیام عمومی مشکل سرویس؛ جزئیات فنی فقط در log سروری بدون secret | بله |
| `NOT_FOUND` | not-found برای جزئیات | خیر، برگشت به نتایج |
| `UNAVAILABLE` | پیام نبود ظرفیت یا پیشنهاد برای این اقامت | خیر، تغییر جست‌وجو |

نمونه نتیجه شکست:

```json
{
  "ok": false,
  "error": {
    "code": "TIMEOUT",
    "message": "دریافت اطلاعات بیش از حد طول کشید. دوباره تلاش کنید.",
    "retryable": true
  }
}
```

فهرست خالی موفقیت `ok: true` با `items: []` و `total: 0` است. خطای شناخته‌شده با دکمه تلاش مجدد، همان URL را از طریق refresh دوباره درخواست می‌کند. در سناریوی خطای ثابت، تکرار همان خطا درست است؛ برای مشاهده بازیابی، تنظیم به success تغییر و سرور دوباره اجرا می‌شود. retry خودکار یا حلقه بی‌پایان وجود ندارد.

پیش‌نمایش رزرو فقط خلاصه معتبر سرور را نشان می‌دهد؛ اطلاعات بانکی یا شخصی دریافت نمی‌شود و شماره رزرو واقعی تولید نمی‌کند. کلاینت نمی‌تواند مبلغ را در URL تحمیل کند. خطاهای غیرمنتظره از Result ساختگی عبور داده نمی‌شوند و به مرز error مسیر می‌رسند.

## مسیر ورود متنی و صفحه‌کلید

کنترل بازکردن تقویم یک button بومی با label فارسی و aria-expanded است؛ Enter و Space آن را باز می‌کنند و Escape با بستن تقویم، فوکوس را به همان دکمه برمی‌گرداند. دکمه‌های ماه نام فارسی دارند و روزها با Enter یا Space فعال می‌شوند. دکمه ماه در مرز مجاز aria-disabled می‌گیرد و اقدام آن مسدود می‌شود، ولی قابل فوکوس می‌ماند تا بازگشت به نخستین ماه مجاز فوکوس را از بین نبرد.

ورودی متنی شمسی در بخش بازشدنی زیر فرم، با همان آداپتور تبدیل و schema اعتبارسنجی می‌شود. متن ناقص برای ادامه ویرایش حفظ می‌شود، ولی با هر تغییر، مقدار canonical فرم به تبدیل معتبر یا رشته خالی به‌روزرسانی می‌شود؛ در نتیجه Enter پیش از blur نیز مقدار فعلی را اعتبارسنجی می‌کند و تاریخ معتبر قبلی پنهانی ارسال نمی‌شود. انتخاب تقویم هر دو متن را همگام می‌کند و تغییر URL فرم را از نو می‌سازد. خطای هر تاریخ با aria-describedby به ورودی خودش و دکمه تقویم متصل است؛ ثبت نامعتبر، بخش متنی را باز و اولین ورودی نامعتبر را فوکوس می‌کند (مقصد در ترتیب خطا مقدم است). پشتیبانی کامل صفحه‌خوان و الگوی پیشرفته پیمایش grid هنوز ادعا نمی‌شود.
