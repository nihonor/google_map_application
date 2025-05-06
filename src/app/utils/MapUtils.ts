import { Loader } from '@googlemaps/js-api-loader';
import { Address } from '@/types';


export const loader = new Loader({
  // apiKey: 'AIzaSyDoG2uuqTFfKF2HD1AWmCvEk70M-ojdsxw',
  apiKey:'AIzaSyApxJVBz6gc3MGVqK_GFWQuhnejC9Z0J5Y',
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

export interface AddressComponents {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export async function reverseGeocode({ lat, lng }: { lat: number; lng: number }): Promise<AddressComponents> {
  const google = await loader.load();
  const geocoder = new google.maps.Geocoder();
  
  try {
    const response = await geocoder.geocode({
      location: { lat, lng }
    });

    if (response.results && response.results[0]) {
      const result = response.results[0];
      const addressComponents = result.address_components;
      
      let street = '';
      let city = '';
      let state = '';
      let postalCode = '';
      let country = '';

      // Parse address components
      addressComponents.forEach((component: any) => {
        const types = component.types;
        
        if (types.includes('street_number') || types.includes('route')) {
          street = street ? `${street} ${component.long_name}` : component.long_name;
        }
        if (types.includes('locality')) {
          city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
        if (types.includes('country')) {
          country = component.long_name;
        }
      });

      return {
        street: street || result.formatted_address.split(',')[0],
        city,
        state,
        postalCode,
        country
      };
    }
    
    throw new Error('No results found');
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return {
      street: '',
      city: 'Unknown City',
      state: '',
      postalCode: '',
      country: 'Unknown Country'
    };
  }
}

