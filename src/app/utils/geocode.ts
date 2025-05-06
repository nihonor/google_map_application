// src/utils/geocode.ts
export interface GeocodedData {
    country: string;
    city: string;
    zip: string;
    fullAddress: string;
  }
  
  export const reverseGeocode = async (latlng: string): Promise<GeocodedData | null> => {
    try {
      if (!latlng) return null;
      
      // Extract lat and lng from the string (assuming format like "lat,lng")
      const [lat, lng] = latlng.split(',').map(coord => parseFloat(coord.trim()));
      
      if (isNaN(lat) || isNaN(lng)) return null;
  
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      
      if (!response.ok) throw new Error('Geocoding request failed');
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results?.length) return null;
  
      const result = data.results[0];
      let country = '';
      let city = '';
      let zip = '';
      
      // Extract address components
      for (const component of result.address_components) {
        if (component.types.includes('country')) {
          country = component.long_name;
        }
        if (component.types.includes('locality') || component.types.includes('administrative_area_level_1')) {
          city = component.long_name;
        }
        if (component.types.includes('postal_code')) {
          zip = component.short_name;
        }
      }
      
      return {
        country,
        city,
        zip,
        fullAddress: result.formatted_address
      };
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };