/* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from 'react';
import GoogleMap from '../components/GoogleMap';
import markersData from '../data/SiteMarkers.json'; 
import interconnectsData from '../data/InterConnectSegments.json'; 
import { SiteMarker, InterConnectSegment, Address } from '@/types';

export default function Home() {
  const [markers, setMarkers] = useState<SiteMarker[]>([]);
  const [interconnects, setInterconnects] = useState<InterConnectSegment[]>([]);
  const [editMode, setEditMode] = useState(false);

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
      // Create deep copies of the updated markers and interconnects to avoid modifying state directly
      const localMarkers = [...markers];
      const localInterconnects = [...interconnects];
  
      // Update or add new markers
      updatedMarkers.forEach((updatedMarker) => {
        const existingMarkerIndex = localMarkers.findIndex((marker) => marker.Name === updatedMarker.Name);
        if (existingMarkerIndex >= 0) {
          // Update existing marker
          localMarkers[existingMarkerIndex] = {
            ...localMarkers[existingMarkerIndex],
            ...updatedMarker,
          };
        } else {
          // Add new marker
          localMarkers.push(updatedMarker);
        }
      });
  
      // Update or add new interconnects
      updatedInterconnects.forEach((updatedSegment) => {
        const existingSegmentIndex = localInterconnects.findIndex((segment) => segment.Name === updatedSegment.Name);
        if (existingSegmentIndex >= 0) {
          // Update existing segment
          localInterconnects[existingSegmentIndex] = {
            ...localInterconnects[existingSegmentIndex],
            ...updatedSegment,
          };
        } else {
          // Add new interconnect
          localInterconnects.push(updatedSegment);
        }
      });
  
      // Prepare data for API saving
      const dataToSave = {
        markers: localMarkers.map((marker) => ({
          ...marker,
          Address: typeof marker.Address === 'string' ? marker.Address : JSON.stringify(marker.Address),
        })),
        interconnects: localInterconnects.map((segment) => ({
          ...segment,
          WaypointLatLngArray: JSON.stringify(segment.WaypointLatLngArray),
        })),
      };
      console.log("Data to be saved : ",dataToSave)
  
      // Save to API route
      const response = await fetch('/api/save-map-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save data');
      }
  
      // Update state with the saved data
      setMarkers(localMarkers);
      setInterconnects(localInterconnects);
  
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes');
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