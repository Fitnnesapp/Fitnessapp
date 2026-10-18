import type { LocationObject } from 'expo-location';

import type { RawLocation } from '@/types/running';

export function toRawLocation(location: LocationObject): RawLocation {
  return {
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    t: location.timestamp,
    alt: location.coords.altitude,
    acc: location.coords.accuracy,
  };
}
