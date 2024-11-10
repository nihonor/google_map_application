"use client"
import { useState, useEffect } from 'react';
import GoogleMap from '../components/GoogleMap';
import markersData from '../data/SiteMarkers.json'; 
import interconnectsData from '../data/InterConnectSegments.json'; 
import { SiteMarker,InterConnectSegment } from '@/types';

export default function Home() {
  const [markers, setMarkers] = useState<SiteMarker[]>([]);
  const [interconnects, setInterconnects] = useState<InterConnectSegment[]>([]);

  useEffect(() => {
    // Simulating data fetch with local JSON imports
    try {
      setMarkers(markersData);
      setInterconnects(interconnectsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Google Maps Integration</h1>
      <GoogleMap 
        markers={markers} 
        interconnects={interconnects}
        interconnectPathStyle={0}
      />
    </div>
  );
}
