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
  country: string;
  city: string;
}

export async function reverseGeocode({ lat, lng }: { lat: number; lng: number }): Promise<AddressComponents> {
  console.log('Starting reverseGeocode with coordinates:', { lat, lng });
  
  try {
    const google = await loader.load();
    console.log('Google Maps API loaded successfully');
    
    const geocoder = new google.maps.Geocoder();
    console.log('Geocoder instance created');
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        console.log('Geocoding response status:', status);
        
        if (status === 'OK' && results && results.length > 0) {
          // Find the result with the most detailed address information
          const bestResult = results.find(result => 
            result.address_components.some(component => 
              component.types.includes('locality') || 
              component.types.includes('administrative_area_level_1')
            )
          ) || results[0];

          const addressComponents = bestResult.address_components;
          console.log('Using address components:', JSON.stringify(addressComponents, null, 2));
          
          const components: AddressComponents = {
            country: 'Unknown',
            city: 'Unknown'
          };

          for (const component of addressComponents) {
            console.log('Processing component:', JSON.stringify(component, null, 2));
            if (component.types.includes('country')) {
              components.country = component.long_name;
              console.log('Found country:', component.long_name);
            }
            if (component.types.includes('locality')) {
              components.city = component.long_name;
              console.log('Found city:', component.long_name);
            }
          }

          // If we don't have a city but have an administrative area, use that
          if (components.city === 'Unknown') {
            const adminArea = addressComponents.find(component => 
              component.types.includes('administrative_area_level_1')
            );
            if (adminArea) {
              components.city = adminArea.long_name;
              console.log('Using administrative area as city:', adminArea.long_name);
            }
          }

          console.log('Final address components:', JSON.stringify(components, null, 2));
          resolve(components);
        } else {
          console.error('Geocoding failed:', status);
          reject(`Geocode was not successful for the following reason: ${status}`);
        }
      });
    });
  } catch (error) {
    console.error('Error in reverseGeocode:', error);
    throw error;
  }
}

