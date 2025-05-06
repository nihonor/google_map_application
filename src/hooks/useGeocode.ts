// src/hooks/useGeocode.ts
import { useState, useEffect } from 'react';
import { reverseGeocode, AddressComponents } from '@/app/utils/MapUtils';

export const useGeocode = (latlng: string | null) => {
  const [data, setData] = useState<AddressComponents | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!latlng) {
      setData(null);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Parsing coordinates:', latlng);
        const [lat, lng] = latlng.split(',').map(coord => parseFloat(coord.trim()));
        console.log('Parsed coordinates:', { lat, lng });
        
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error('Invalid coordinates');
        }
        
        const result = await reverseGeocode({ lat, lng });
        console.log('Geocoding result:', result);
        setData(result);
      } catch (err) {
        console.error('Geocoding error:', err);
        setError(err instanceof Error ? err.message : 'Failed to geocode coordinates');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [latlng]);

  return { data, loading, error };
};