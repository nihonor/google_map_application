import { Loader } from '@googlemaps/js-api-loader';
import { Address } from '@/types';

export const loader = new Loader({
  apiKey: 'AIzaSyDoG2uuqTFfKF2HD1AWmCvEk70M-ojdsxw',
  version: 'weekly',
  libraries: ['places', 'geometry', "marker"]
});

// this is to get Lat from address 
export const getLatLngFromAddress = async (address: Address): Promise<google.maps.LatLngLiteral | null> => {
  const google = await loader.load();
  const geocoder = new google.maps.Geocoder();
  
  try {
    const response = await geocoder.geocode({
      address: `${address.Address}, ${address.City}, ${address.State}, ${address.Country}, ${address.ZIP}`
    });
    
    if (response.results[0]) {
      return {
        lat: response.results[0].geometry.location.lat(),
        lng: response.results[0].geometry.location.lng()
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const parseLatLng = (latLng: string): google.maps.LatLngLiteral | null => {
  if (!latLng) return null;
  const [lat, lng] = latLng.split(',').map(coord => parseFloat(coord.trim()));
  return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
};

