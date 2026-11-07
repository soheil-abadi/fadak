import 'server-only';
import { createMockProvider } from '@/infrastructure/hotels/mock-provider';
import { readMockOptions } from '@/lib/env.server';
import { searchHotels } from './application/search-hotels';
import type { HotelSearchQuery } from './schemas/search-schema';
export const getHotelProvider = () => createMockProvider(readMockOptions());
export const getHotels = (query: HotelSearchQuery) => searchHotels(query, getHotelProvider());
