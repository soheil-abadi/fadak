import 'server-only';
import type { CityId, HotelDetails, StarRating } from '@/features/hotels/domain/types';
type HotelFixture = Omit<HotelDetails, 'quote'> & { readonly nightlyAmount: number };
const destinations: readonly {
  city: CityId;
  names: readonly string[];
  address: string;
  base: number;
}[] = [
  {
    city: 'tehran',
    names: ['هتل بوتیک سپیدار', 'هتل باغ نیلوفر', 'هتل عمارت سرو'],
    address: 'تهران، خیابان ولیعصر',
    base: 12500000,
  },
  {
    city: 'mashhad',
    names: ['هتل آوای آرام', 'هتل باغ رضوان', 'هتل عمارت آفتاب'],
    address: 'مشهد، بلوار سجاد',
    base: 10500000,
  },
  {
    city: 'shiraz',
    names: ['هتل خانه نارنج', 'هتل باغ بهار', 'هتل عمارت ترنج'],
    address: 'شیراز، محله تاریخی سنگ سیاه',
    base: 11500000,
  },
  {
    city: 'kish',
    names: ['هتل ساحلی مرجان', 'هتل باغ نخل', 'هتل جزیره آبی'],
    address: 'کیش، بلوار ساحل',
    base: 15500000,
  },
];
const images = [
  '/images/hotels/garden.jpg',
  '/images/hotels/room.jpg',
  '/images/hotels/resort.jpg',
];
export const HOTEL_FIXTURES: readonly HotelFixture[] = destinations.flatMap((destination) =>
  destination.names.map((name, index) => ({
    id: `${destination.city}-${String(index + 1).padStart(2, '0')}`,
    name,
    city: destination.city,
    address: `${destination.address}، نشانی نمایشی ${new Intl.NumberFormat('fa').format(index + 1)}`,
    stars: (index + 3) as StarRating,
    rating: [7.8, 8.7, 9.2][index] ?? 8,
    amenities:
      index === 0
        ? ['wifi', 'breakfast']
        : index === 1
          ? ['wifi', 'parking', 'breakfast']
          : ['wifi', 'parking', 'breakfast', 'pool'],
    image: { src: images[index] ?? images[0]!, alt: `فضای نمایشی ${name}` },
    description:
      'صبح را آرام شروع کنید؛ اتاق‌هایی روشن، فضایی دلنشین و فرصتی برای کشف شهر. این اقامتگاه و اطلاعات آن برای نمایش جریان جست‌وجو ساخته شده‌اند و پیشنهاد واقعی رزرو نیستند.',
    availableRooms: [1, 3, 5][index] ?? 1,
    maxGuestsPerRoom: 2,
    nightlyAmount: destination.base + index * 7000000,
  })),
);
