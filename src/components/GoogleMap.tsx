import { useEffect, useRef, useState } from 'react';
import { loader, getLatLngFromAddress, parseLatLng, reverseGeocode } from '@/app/utils/MapUtils';
import { SiteMarker, InterConnectSegment,Address } from '@/types';
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
  console.log(updatedInterconnects,updatedMarkers)
  console.log(getLatLngFromAddress)
  
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

        // This is the click event for the map
        map.addListener("click", async (event: google.maps.MapMouseEvent) => {
          const lat = event.latLng!.lat(); 
          const lng = event.latLng!.lng();
  
          // Fetch address using reverse geocoding
          const address = await reverseGeocode({lat, lng});
  
          // Tooltip content
          const content = `
              <div style="font-family: Arial, sans-serif;">
                  <strong style="color: blue;">Latitude:</strong> <span style="font-weight: bold; color: green;">${lat}</span><br>
                  <strong style="color: blue;">Longitude:</strong> <span style="font-weight: bold; color: green;">${lng}</span><br>
                  <strong style="color: blue;">Address:</strong> <span style="font-weight: bold; color: purple;">${address}</span>
              </div>
          `;
  
          // Show InfoWindow at clicked position
          infoWindowRef.current?.setContent(content);
          infoWindowRef.current?.setPosition(event.latLng);
          infoWindowRef.current?.open(map);
      });

      // this is to handle   mouse over 
      map.addListener("mouseover", async (event: google.maps.MapMouseEvent)  => {
        const lat = event.latLng!.lat();
        const lng = event.latLng!.lng();

        // Fetch address using reverse geocoding
        const address = await reverseGeocode({lat, lng});

        // Tooltip content
        const content = `
            <div style="font-family: Arial, sans-serif;">
                <strong style="color: blue;">Latitude:</strong> <span style="font-weight: bold; color: green;">${lat}</span><br>
                <strong style="color: blue;">Longitude:</strong> <span style="font-weight: bold; color: green;">${lng}</span><br>
                <strong style="color: blue;">Address:</strong> <span style="font-weight: bold; color: purple;">${address}</span>
            </div>
        `;

        // Show InfoWindow at clicked position
        infoWindowRef.current?.setContent(content);
        infoWindowRef.current?.setPosition(event.latLng);
        infoWindowRef.current?.open(map);
    });
  

    // Remove existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current.clear();

    // Create new markers
    markers.forEach(async (marker) => {
      let position = parseLatLng(marker.LatLng);

      if (!position) {
        console.log("Position is not there");
        try {
            // Clean and fix the Address string
            let cleanedAddress = marker.Address.replace(/\"\"/g, '"').trim();
            
            // Add double quotes around property names
            cleanedAddress = cleanedAddress.replace(/(\w+):/g, '"$1":');
            // Parse the cleaned string
            const address = JSON.parse(cleanedAddress) as Address;
            position = await getLatLngFromAddress(address);
            console.log("Parsed Address: ", address);
            console.log("The positions for the non-positioned records: ", position);
    
            if (position) {
                marker.LatLng = `${position.lat}, ${position.lng}`;
                marker.Update = '1';
                
                // Update markers array with the new marker
                setUpdatedMarkers(prevMarkers => [...prevMarkers, marker]);
            } else {
                marker.Update = '-1';
                setUpdatedMarkers(prevMarkers => [...prevMarkers, marker]);
            }
            
        } catch (error) {
            console.error('Error in processing marker:', error);
            marker.Update = '-1';
            setUpdatedMarkers(prevMarkers => [...prevMarkers, marker]);
        }
    }
      
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


        if (editMode) {

// Handle click on marker event in edit mode
mapMarker.addListener('click', () => {

  // Combine Address and LatLng with proper formatting
  const content = `
      <div style="font-family: Arial, sans-serif;">
          <strong style="color: blue;">Address:</strong> <br>
          <span style="font-weight: bold; color:red">
          ${marker.Address.replace(/\\n/g, '<br>')}
          </span>
          <br><br>
          <span style="font-weight: bold; color:red">
          <strong style="color: blue;">Coordinates:</strong> <br>
          ${marker.LatLng.replace(/\\n/g, '<br>')}
           </span>
      </div>
  `;

  // Set the combined content
  infoWindowRef.current?.setContent(content);
  infoWindowRef.current?.open(map, mapMarker);
});


        // this is to handle the dragend 
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

 // this is the function to save impage 
  const saveMapAsImage = async () => {
    if (!mapRef.current || !map) {
      console.error('Map reference or map is not available');
      return;
    }
  
    try {
      // Force redraw of markers using Google Maps API
      const google = await loader.load();
  
      // Temporarily add markers back to the map
      markers.forEach((marker) => {
        const position = parseLatLng(marker.LatLng);
        if (position) {
          new google.maps.Marker({
            position,
            map: map,
            title: marker.Name,
          });
        }
      });
  
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 2000));
  
      // Capture the map with markers
      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        logging: true,
      });
  
      // Create blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas to Blob conversion failed');
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'map_with_markers.png';
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


// this is to capture the current map and save it 
  const captureAllMapElements = () => {
    const allCurrentMarkers: SiteMarker[] = [];
    const allCurrentInterconnects: InterConnectSegment[] = [];
  
    // Capture markers
    markersRef.current.forEach((mapMarker, markerName) => {
      try {
        const position = mapMarker.position;
  
        if (position) {
          const lat = typeof position.lat === 'function' ? position.lat() : position.lat;
          const lng = typeof position.lng === 'function' ? position.lng() : position.lng;
  
          // Find the original marker to preserve other properties
          const originalMarker = markers.find(m => m.Name === markerName);
  
          allCurrentMarkers.push({
            ...originalMarker,
            Name: markerName,
            LatLng: `${lat}, ${lng}`,
            Update: '1',
            Selected: originalMarker?.Selected || 'DefaultSelected', 
            Address: originalMarker?.Address || '', 
            iconSVGfile: originalMarker?.iconSVGfile || '', 
            AlertStatus: originalMarker?.AlertStatus || '',
            tooltip: originalMarker?.tooltip || '',
            Details: originalMarker?.Details || '',
            iconColor: originalMarker?.iconColor, 
            iconSize: originalMarker?.iconSize, 
          });
        }
      } catch (error) {
        console.error(`Error capturing marker ${markerName}:`, error);
      }
    });

    // this is to capture all interconnects
    polylinesRef.current.forEach((polyline, segmentName) => {
      try {
        const path = polyline.getPath();
        if (path) {
          const waypointPath = path
            .getArray()
            .slice(1)
            .map(
              coord =>
                `${typeof coord.lat === 'function' ? coord.lat() : coord.lat} ${
                  typeof coord.lng === 'function' ? coord.lng() : coord.lng
                }`
            )
            .join(', ');
    
          // Find the original interconnect to preserve other properties
          const originalInterconnect = interconnects.find(ic => ic.Name === segmentName);
    
          allCurrentInterconnects.push({
            ...originalInterconnect,
            Name: segmentName,
            WaypointLatLngArray: waypointPath,
            Update: '1', // Default 'Update' value
            Desc: originalInterconnect?.Desc || 'Default Description', 
            LineType: originalInterconnect?.LineType || 'DefaultLineType', 
            LineWidthpx: originalInterconnect?.LineWidthpx || '1px', 
            LineColor: originalInterconnect?.LineColor || '#000000', 
            LineAttribute: originalInterconnect?.LineAttribute || 'DefaultAttribute', 
            LineStyle: originalInterconnect?.LineStyle || 'solid', 
            LineEndIcon: originalInterconnect?.LineEndIcon || 'None', 
            LineHoverColor: originalInterconnect?.LineHoverColor, 
            LineClickEventMessage: originalInterconnect?.LineClickEventMessage,
          });
        }
      } catch (error) {
        console.error(`Error capturing interconnect ${segmentName}:`, error);
      }
    });
    
  
    return {
      markers: allCurrentMarkers,
      interconnects: allCurrentInterconnects,
    };
  };
  

// This is to save 
const handleSave = () => {
  if (fnSave) {
    const { markers: capturedMarkers, interconnects: capturedInterconnects } = captureAllMapElements();
    
    console.log('Captured Markers:', capturedMarkers);
    console.log('Captured Interconnects:', capturedInterconnects);

    fnSave(capturedMarkers, capturedInterconnects);
  } else {
    console.error('Save function not provided');
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
