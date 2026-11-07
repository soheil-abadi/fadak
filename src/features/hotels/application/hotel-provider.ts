import type { HotelDetails, HotelSearchResponse, Result } from '../domain/types';
import type { HotelSearchInput } from '../schemas/search-schema';
export interface HotelProvider {
  search(input: HotelSearchInput): Promise<Result<HotelSearchResponse>>;
  getDetails(hotelId: string, input: HotelSearchInput): Promise<Result<HotelDetails>>;
}
