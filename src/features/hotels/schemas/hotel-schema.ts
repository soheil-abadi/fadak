import { z } from 'zod';
const money = z.object({
  amount: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).multipleOf(10),
  currency: z.literal('IRR'),
});
const hotelImage = z.object({
  src: z.string().startsWith('/images/hotels/'),
  alt: z.string().min(1),
});
export const hotelSummarySchema = z.object({
  id: z.string().regex(/^[a-z]+-\d{2}$/),
  name: z.string().min(1),
  city: z.enum(['tehran', 'mashhad', 'shiraz', 'kish', 'isfahan']),
  address: z.string().min(1),
  stars: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  rating: z.number().min(0).max(10),
  amenities: z.array(z.enum(['wifi', 'parking', 'breakfast', 'pool'])),
  image: hotelImage,
  images: z.array(hotelImage).min(1).max(3),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  quote: z
    .object({
      nightlyPerRoom: money,
      nights: z.number().int().min(1).max(30),
      rooms: z.number().int().min(1).max(5),
      total: money,
    })
    .refine(
      (value) => value.total.amount === value.nightlyPerRoom.amount * value.nights * value.rooms,
      'Invalid quote total',
    ),
});
export const hotelDetailsSchema = hotelSummarySchema.extend({
  description: z.string().min(1),
  availableRooms: z.number().int().nonnegative(),
  maxGuestsPerRoom: z.number().int().positive(),
});
