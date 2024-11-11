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

  // Handler to save map as an image
  const handleSaveMapAsImage = () => {
    const mapElement = document.querySelector('#map-container');
    if (mapElement) {
      import('html2canvas').then(module => {
        const html2canvas = module.default; // Access the default export
        html2canvas(mapElement as HTMLElement).then((canvas: HTMLCanvasElement) => {
          const link = document.createElement('a');
          link.download = 'map.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        });
      }).catch(error => {
        console.error('Error generating map image:', error);
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Google Maps Integration</h1>
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={handleSaveMapAsImage}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Save Map as Image
        </button>
      </div>
      <div id="map-container">
        <GoogleMap 
          markers={markers} 
          interconnects={interconnects}
          interconnectPathStyle={0}
        />
      </div>
    </div>
  );
}


