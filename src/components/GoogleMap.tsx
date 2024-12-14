/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import { loader, getLatLngFromAddress, parseLatLng, reverseGeocode } from '@/app/utils/MapUtils';
import { SiteMarker, InterConnectSegment, Address } from '@/types';
import html2canvas from 'html2canvas';

interface Props {
  markers: SiteMarker[];
  interconnects: InterConnectSegment[];
  interconnectPathStyle: number;
  fnClick?: (name?: string, latlng?: { lat: number; lng: number }, address?: string) => void;
  fnDblClick?: (name?: string) => void;
  fnCtrlClick?: (name?: string) => void;
  fnSave?: (updatedMarkers: SiteMarker[], updatedInterconnects: InterConnectSegment[]) => void;
}

export default function GoogleMap({
  markers, 
  interconnects, 
  interconnectPathStyle, 
  fnClick, 
  fnDblClick, 
  fnCtrlClick, 
  fnSave 
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [updatedMarkers, setUpdatedMarkers] = useState<SiteMarker[]>(markers);
  const [updatedInterconnects, setUpdatedInterconnects] = useState<InterConnectSegment[]>(interconnects);
  
  // Refs to store map objects
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const polylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Initialize Google Map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;
  
      const google = await loader.load();
            
      // Define the bounds (adjust the coordinates as needed)
      const allowedBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-85, -180), 
        new google.maps.LatLng(85, 180)    
      );
  
      const newMap = new google.maps.Map(mapRef.current, {
        zoom: 4,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ],
        mapId: "4504f8b37365c3d0",
        restriction: {
          latLngBounds: allowedBounds,
          strictBounds: true
        }
      });
  
      setMap(newMap);
      infoWindowRef.current = new google.maps.InfoWindow();
    };
  
    initMap();
  }, []);

  // Process and update markers
  useEffect(() => {
    if (!map) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current.clear();

    // Create new markers
    markers.forEach((marker) => {
      const position = parseLatLng(marker.LatLng);
      
      if (position) {
        const mapMarker = new google.maps.marker.AdvancedMarkerElement({
          position,
          map, 
          title: marker.Name,
          gmpDraggable: editMode,
          gmpClickable: true,
        });

        // Add event listeners
        mapMarker.addListener('mouseover', () => {
          if (marker.tooltip) {
            infoWindowRef.current?.setContent(marker.tooltip.replace(/\\n/g, '<br>'));
            infoWindowRef.current?.open(map, mapMarker);
          }
        });

        mapMarker.addListener('mouseout', () => {
          infoWindowRef.current?.close();
        });

        mapMarker.addListener('click', () => {
    
            infoWindowRef.current?.setContent(marker.Name.replace(/\\n/g, '<br>'))
            infoWindowRef.current?.setContent(marker.LatLng.replace(/\\n/g, '<br>'))
            infoWindowRef.current?.setContent(marker.Address.replace(/\\n/g, '<br>'))
            infoWindowRef.current?.open(map, mapMarker);

        });

        // Drag event for updating marker position
        if (editMode) {
          mapMarker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
            if (event.latLng) {
              const newLat = event.latLng.lat();
              const newLng = event.latLng.lng();
        
              // Update the markers state
              setUpdatedMarkers(prevMarkers => 
                prevMarkers.map(m => 
                  m.Name === marker.Name 
                    ? { 
                        ...m, 
                        LatLng: `${newLat}, ${newLng}`, 
                        Update: '1' 
                      } 
                    : m
                )
              );
            }
          });
        }

        markersRef.current.set(marker.Name, mapMarker);
      }
    });

    // Adjust map bounds
    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => {
      const position = parseLatLng(marker.LatLng);
      if (position) bounds.extend(position);
    });

    if (markers.length > 1) {
      map.fitBounds(bounds);
    } else if (markers.length === 1) {
      const singlePosition = parseLatLng(markers[0].LatLng);
      if (singlePosition) {
        map.setCenter(singlePosition);
        map.setZoom(12);
      }
    }
  }, [map, markers, editMode]);

  // Draw InterConnect paths
  useEffect(() => {
    if (!map) return;

    // Remove existing polylines
    polylinesRef.current.forEach((polyline) => {
      polyline.setMap(null);
    });
    polylinesRef.current.clear();

    interconnects.forEach((segment) => {
      if (!segment.Name || !segment.WaypointLatLngArray) return;

      const sourceMarker = markersRef.current.get(segment.Name);
      if (!sourceMarker) return;

      const waypoints = segment.WaypointLatLngArray
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(coord => {
          const [lat, lng] = coord.trim().split(/\s+/).map(Number);
          return { lat, lng };
        })
        .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

      if (waypoints.length === 0) return;

      const path = [sourceMarker.position!, ...waypoints];

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: segment.LineColor,
        strokeOpacity: 1.0,
        strokeWeight: parseInt(segment.LineWidthpx),
        editable: editMode,
        map
      });

      // Event listeners for polyline
      polyline.addListener('mouseover', () => {
        if (segment.Desc) {
          infoWindowRef.current?.setContent(`${segment.Name}: ${segment.Desc}`);
          infoWindowRef.current?.open(map);
          infoWindowRef.current?.setPosition(path[Math.floor(path.length / 2)]);
        }
      });

      polyline.addListener('mouseout', () => {
        infoWindowRef.current?.close();
      });

      // Update waypoints when polyline is edited
      if (editMode) {
        polyline.addListener('path_changed', () => {
          const newPath = polyline.getPath().getArray().map(coord => ({
            lat: coord.lat(),
            lng: coord.lng()
          }));

          // Update interconnects state with new waypoint path
          setUpdatedInterconnects(prevInterconnects => 
            prevInterconnects.map(ic => 
              ic.Name === segment.Name
                ? {
                    ...ic,
                    WaypointLatLngArray: newPath.slice(1).map(p => `${p.lat} ${p.lng}`).join(', ')
                  }
                : ic
            )
          );
        });
      }

      polylinesRef.current.set(segment.Name, polyline);
    });
  }, [map, interconnects, editMode]);

  // Save map as image
  const saveMapAsImage = async () => {
    if (!mapRef.current) {
      console.error('Map reference is not available');
      return;
    }
  
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        logging: true,
      });
  
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas to Blob conversion failed');
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'map.png';
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
  
    } catch (error) {
      console.error('Error saving map as image:', error);
      alert('Failed to save map as image: ' + error);
    }
  };

  // Save function for edit mode
  const handleSave = () => {
    if (fnSave) {
      fnSave(updatedMarkers, updatedInterconnects);
    } else {
      alert('Save function not provided');
    }
  };

  return (
    <div>
      <button 
        className="px-4 py-2 bg-blue-500 text-white rounded bt-center" 
        onClick={() => setEditMode(false)}
      >
        Normal Mode 
      </button>
      <button 
        className="px-4  py-2 bg-red-500 text-white rounded bt-center" 
        onClick={() => setEditMode(true)}
        style={{margin:4}}
      >
        Edit Mode 
      </button>


      {editMode && (
        <button 
          className="px-4 py-2 bg-green-500 text-white rounded ml-2" 
          onClick={() => {
            handleSave();
            saveMapAsImage();
          }}
        >
          SAVE
        </button>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '800px' }} />
    </div>
  );
}
