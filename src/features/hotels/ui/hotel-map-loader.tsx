'use client';
import dynamic from 'next/dynamic';
import type { HotelLocation } from '../domain/types';

const HotelMap = dynamic(() => import('./hotel-map').then((module) => module.HotelMap), {
  ssr: false,
  loading: () => <div className="hotel-map-fallback" aria-hidden="true" />,
});

export function HotelMapLoader({ name, location }: { name: string; location: HotelLocation }) {
  return <HotelMap name={name} location={location} />;
}
