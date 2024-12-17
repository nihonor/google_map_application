"use client"

import { useState, useEffect } from 'react';
import GoogleMap from '../components/GoogleMap';
import markersData from '../data/SiteMarkers.json'; 
import interconnectsData from '../data/InterConnectSegments.json'; 
import { SiteMarker, InterConnectSegment } from '@/types';

export default function Home() {
  const [markers, setMarkers] = useState<SiteMarker[]>([]);
  const [interconnects, setInterconnects] = useState<InterConnectSegment[]>([]);
  // const [editMode, setEditMode] = useState(false);

  useEffect(() => {
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


const handleSave = async (updatedMarkers: SiteMarker[], updatedInterconnects: InterConnectSegment[]) => {
  try {
    // Prepare data for API saving
    const dataToSave = {
      markers: updatedMarkers.map((marker) => ({
        ...marker,
        Address: typeof marker.Address === 'string' ? marker.Address : JSON.stringify(marker.Address),
      })),
      interconnects: updatedInterconnects.map((segment) => ({
        ...segment,
        WaypointLatLngArray: segment.WaypointLatLngArray
      })),
    };

    const response = await fetch('/api/save-map-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to save data');
    }

    // Update local state with the new data
    setMarkers(updatedMarkers);
    setInterconnects(updatedInterconnects);
  } catch (error) {
    console.error('Error saving changes:', error);
    alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
          // fnSave={handleSave}
          fnSave={(updatedMarkers, updatedInterconnects) => handleSave(updatedMarkers, updatedInterconnects)}
          fnDblClick={handleDblClick}
          fnCtrlClick={handleCtrlClick}
        />
      </div>
    </div>
  );
}