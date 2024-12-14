/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from 'react';
import GoogleMap from '../components/GoogleMap';
import markersData from '../data/SiteMarkers.json'; 
import interconnectsData from '../data/InterConnectSegments.json'; 
import { SiteMarker, InterConnectSegment } from '@/types';

export default function Home() {
  const [markers, setMarkers] = useState<SiteMarker[]>([]);
  const [interconnects, setInterconnects] = useState<InterConnectSegment[]>([]);
  const [editMode, setEditMode] = useState(false); // Manage edit mode here

  useEffect(() => {
    // Simulating data fetch with local JSON imports. In the second milestone, this will use Google Map API.
    try {
      setMarkers(markersData);
      setInterconnects(interconnectsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  const handleClick = (name?: string, latlng?: { lat: number; lng: number }, address?: string) => {
    alert(`Click Event: Name: ${name}, LatLng: ${latlng?.lat}, ${latlng?.lng}, Address: ${address}`);
  };

  const handleSave = (updatedMarkers: SiteMarker[], updatedInterconnects: InterConnectSegment[]) => {
    // Update local state
    setMarkers(updatedMarkers);
    setInterconnects(updatedInterconnects);

    // There we will save the updated content to the db 
    alert('Changes saved!');
  };

  const handleDblClick = (name?: string) => {
    console.log("Double clicked")
    alert(`Double Click Event - Name: ${name || 'Unknown'}`);
  };
  
  const handleCtrlClick = (name?: string) => {
    alert(`Ctrl Click Event: ${name}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Google Maps Integration</h1>
      <div id="map-container">
        <GoogleMap 
          markers={markers} 
          fnClick={handleClick}
          interconnects={interconnects}
          interconnectPathStyle={0}
          fnSave={handleSave}
          fnDblClick={handleDblClick}
          fnCtrlClick={handleCtrlClick}
        />
      </div>
    </div>
  );
}