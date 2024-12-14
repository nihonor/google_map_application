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

// export const reverseGeocode = async (location: { lat: number; lng: number }): Promise<string> => {
//   const google = await loader.load();
//   const geocoder = new google.maps.Geocoder();
  
//   try {
//     const response = await geocoder.geocode({ 
//       location: { lat: location.lat, lng: location.lng } 
//     });
    
//     if (response.results[0]) {
//       return response.results[0].formatted_address;
//     }
//     return 'Address not found';
//   } catch (error) {
//     console.error('Reverse geocoding error:', error);
//     return 'Unable to retrieve address';
//   }
// };


export async function reverseGeocode({ lat, lng }: { lat: number; lng: number }): Promise<string> {
  const geocoder = new google.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        reject(`Geocode was not successful for the following reason: ${status}`);
      }
    });
  });
}



