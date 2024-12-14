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
      // Process markers
      const processedMarkers = updatedMarkers.map(marker => {
        const newMarker = { ...marker };
        
        // Ensure all fields are filled
        if (newMarker.LatLng) {
          const [lat, lng] = newMarker.LatLng.split(',').map(coord => coord.trim());
          newMarker.Latitude = parseFloat(lat);
          newMarker.Longitude = parseFloat(lng);
          
        }
        
        // If Address is a string, try to parse it
        if (typeof newMarker.Address === 'string') {
          try {
            const parsedAddress: Address = JSON.parse(newMarker.Address.replace(/'/g, '"'));
            newMarker.Address = parsedAddress.Address;
          } catch (error) {
            console.error('Error parsing address:', error);
          }
        }
        
        return newMarker;
      });

      // Process interconnects
      const processedInterconnects = updatedInterconnects.map(segment => {
        const newSegment = { ...segment };
        
        // Ensure WaypointLatLngArray is properly formatted
        if (newSegment.WaypointLatLngArray) {
          // Remove brackets and split coordinates
          const coordArray = newSegment.WaypointLatLngArray
            .replace(/[\[\]]/g, '')
            .split(',')
            .map(coord => coord.trim());
          
          newSegment.WaypointLatLngArray = `[${coordArray.join(', ')}]`;
        }

        console.log('Original Interconnects:', interconnectsData);
        console.log('Updated Interconnects:', updatedInterconnects);
        
        return newSegment;
      });

      // Send to API route for saving
      const response = await fetch('/api/save-map-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markers: processedMarkers,
          interconnects: processedInterconnects
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      // Update local state
      setMarkers(processedMarkers);
      setInterconnects(processedInterconnects);

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
          fnSave={handleSave}
          fnDblClick={handleDblClick}
          fnCtrlClick={handleCtrlClick}
        />
      </div>
    </div>
  );
}