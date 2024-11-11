import { Loader } from '@googlemaps/js-api-loader';
import { Address } from '@/types';

export const loader = new Loader({
  apiKey: 'AIzaSyDoG2uuqTFfKF2HD1AWmCvEk70M-ojdsxw',
  version: 'weekly',
  libraries: ['places', 'geometry']
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

// export const parseLatLng = (latLng: string): google.maps.LatLngLiteral | null => {
//   if (!latLng) return null;
//   const [lat, lng] = latLng.split(/[,\s]+/).map(Number);
//   return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
// };

// export const getLatLngFromAddress = async (address: Address): Promise<google.maps.LatLngLiteral | null> => {
//   const google = await loader.load();
//   const geocoder = new google.maps.Geocoder();
  
//   const addressString = `${address.site}, ${address.city}, ${address.state}, ${address.country} ${address.postalcode}`;
  
//   try {
//     const result = await geocoder.geocode({ address: addressString });
//     if (result.results[0]?.geometry?.location) {
//       const { lat, lng } = result.results[0].geometry.location;
//       return { lat: lat(), lng: lng() };
//     }
//   } catch (error) {
//     console.error('Geocoding error:', error);
//   }
  
//   return null;
// };