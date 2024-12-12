// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { useEffect, useRef, useState } from 'react';
// import { loader, getLatLngFromAddress, parseLatLng } from '@/app/utils/MapUtils';
// import { SiteMarker, InterConnectSegment, Address } from '@/types';
// import html2canvas from 'html2canvas';
// import { AnyRecord } from 'dns';

// interface Props {
//   markers: SiteMarker[];
//   interconnects: InterConnectSegment[];
//   interconnectPathStyle: number;
// }



// export default function GoogleMap({ markers, interconnects, interconnectPathStyle }: Props) {
//   const mapRef = useRef<HTMLDivElement>(null);
//   const [map, setMap] = useState<google.maps.Map | null>(null);
//   const [editMode, setEditMode] = useState(false); // Add Edit Mode state
//   const [updatedMarkers, setUpdatedMarkers] = useState<SiteMarker[]>([]);
//   const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
//   const polylinesRef = useRef<google.maps.Polyline[]>([]);
//   const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

// // this is to initialize google map
//   useEffect(() => {
//     const initMap = async () => {
//       if (!mapRef.current) return;
  
//         const google = await loader.load()
            
      
//       // Define the bounds (adjust the coordinates as needed)
//       const allowedBounds = new google.maps.LatLngBounds(
//         new google.maps.LatLng(-85, -180), // Southwest coordinates
//         new google.maps.LatLng(85, 180)    // Northeast coordinates
//       );
  
//       const newMap = new google.maps.Map(mapRef.current, {
//         zoom: 4,
//         mapTypeControl: true,
//         streetViewControl: true,
//         fullscreenControl: true,
//         styles: [
//           {
//             featureType: "poi",
//             elementType: "labels",
//             stylers: [{ visibility: "off" }]
//           }
//         ],
//         mapId: "4504f8b37365c3d0",
//         restriction: {
//           latLngBounds: allowedBounds,
//           strictBounds: true // Keeps the map within the defined bounds
//         }
//       });
  
//       setMap(newMap);
//       infoWindowRef.current = new google.maps.InfoWindow();
//     };
  
//     initMap();
//   }, []);

  

//   // Process and update markers
//   useEffect(() => {
//     const processMarkers = async () => {
//       if (!map) return;

//       const processed = await Promise.all(markers.map(async (marker) => {
//         const newMarker = { ...marker };
//         let position = parseLatLng(marker.LatLng);
//         console.log("The positions are lat " + position?.lat + " and long" +position?.lng);

//     if (!position) {
//       console.log("Position is not there");
//       try {
//           // Clean and fix the Address string
//           let cleanedAddress = marker.Address.replace(/\"\"/g, '"').trim();
          
//           // Add double quotes around property names
//           cleanedAddress = cleanedAddress.replace(/(\w+):/g, '"$1":');
//           // Parse the cleaned string
//           const address = JSON.parse(cleanedAddress) as Address;
//           position = await getLatLngFromAddress(address);
//           console.log("Parsed Address: ", address);
//           console.log("The positions for the non-positioned records: ", position);
  
//           if (position) {
//               newMarker.LatLng = `${position.lat}, ${position.lng}`;
//               newMarker.Update = '1';
              
//               // Update markers array with the new marker
//               setUpdatedMarkers(prevMarkers => [...prevMarkers, newMarker]);
//           } else {
//               newMarker.Update = '-1';
//               setUpdatedMarkers(prevMarkers => [...prevMarkers, newMarker]);
//           }
          
//       } catch (error) {
//           console.error('Error in processing marker:', error);
//           newMarker.Update = '-1';
//           setUpdatedMarkers(prevMarkers => [...prevMarkers, newMarker]);
//       }
//   }
  
//   return newMarker;
//   }))

//       setUpdatedMarkers([...processed]);

//       const bounds = new google.maps.LatLngBounds();
//       const validMarkers = processed.filter(m => m.Update !== '-1');

//       validMarkers.forEach(marker => {
//         const position = parseLatLng(marker.LatLng);
//         if (position){

//           const mapMarker = new google.maps.marker.AdvancedMarkerElement({
//             position,
//             map, 
//             gmpDraggable: true,
//             gmpClickable: true,
            
//           });
//            bounds.extend(position);
           
//         }
//       });

//       interconnects.forEach(segment => {
//         if (segment.WaypointLatLngArray) {
//           const waypoints = segment.WaypointLatLngArray
//             .replace(/[\[\]]/g, '')
//             .split(',')
//             .map(coord => {
//               const [lat, lng] = coord.trim().split(/\s+/).map(Number);
//               return { lat, lng };
//             })
//             .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));
          
//           waypoints.forEach(point => bounds.extend(point));
//         }
//       });

//       if (validMarkers.length === 1) {
//         const singlePosition = parseLatLng(validMarkers[0].LatLng);
//         if (singlePosition) {
//           map.setCenter(singlePosition);
//           map.setZoom(12);
//         }
//       } else {
//         const ne = bounds.getNorthEast();
//         const sw = bounds.getSouthWest();
//         const latPadding = (ne.lat() - sw.lat()) * 0.05;
//         const lngPadding = (ne.lng() - sw.lng()) * 0.05;
        
//         bounds.extend({ lat: ne.lat() + latPadding, lng: ne.lng() + lngPadding });
//         bounds.extend({ lat: sw.lat() - latPadding, lng: sw.lng() - lngPadding });

//         map.fitBounds(bounds);
        
//         const listener = google.maps.event.addListener(map, 'idle', () => {
//           if (map.getZoom()! > 15) map.setZoom(15);
//           google.maps.event.removeListener(listener);
//         });
//       }

//       validMarkers.forEach(marker => {
//         const position = parseLatLng(marker.LatLng);
//         if (!position) return;

//         const mapMarker = new google.maps.marker.AdvancedMarkerElement({
//           position,
//           map,
//           title: marker.Name,
//           gmpDraggable: editMode, // Enable dragging in edit mode
//           gmpClickable: true,
//         });
//         markersRef.current.set(marker.Name, mapMarker);

//         mapMarker.addListener('mouseover', () => {
//           if (marker.tooltip) {
//             infoWindowRef.current?.setContent(marker.tooltip.replace(/\\n/g, '<br>'));
//             infoWindowRef.current?.open(map, mapMarker);
//           }
//         });

//         mapMarker.addListener('mouseout', () => {
//           infoWindowRef.current?.close();
//         });

//         mapMarker.addListener('click', () => {
//           // console.log("it is clicked")
//           if (marker.Details) {
//             infoWindowRef.current?.setContent(marker.Details.replace(/\\n/g, '<br>'));
//             infoWindowRef.current?.open(map, mapMarker);
//           }
//         });
//         mapMarker.addListener('dblclick', (e:AnyRecord) => {
//           console.log('Marker double-click event triggered');
//           console.log('Event details:', e);
//           alert('Double-click detected on marker');
//         });  

//         mapMarker.addListener('dblclick', () => {
//           console.log("It is double clicked")
//           alert('Double-click detected');
//         });

      

//         if (editMode) {

//           mapMarker.addListener('dragend', () => {
//             const newPosition = mapMarker.position;
//             console.log('Marker moved:', { lat: newPosition?.lat, lng: newPosition?.lng });
//           });
//         }
//       });

      
      
      
//     };
    

//     processMarkers();
//   }, [map, markers, interconnects, editMode]);

//   // Draw InterConnect paths
//   useEffect(() => {
//     if (!map || updatedMarkers.length <= 1) return;

//     interconnects.forEach((segment, s_idx) => {
//       if (!segment.Name || !segment.WaypointLatLngArray) return;

//       const sourceMarker = markersRef.current.get(segment.Name);
//       if (!sourceMarker) return;

//       const waypoints = segment.WaypointLatLngArray
//         .replace(/[\[\]]/g, '')
//         .split(',')
//         .map(coord => {
//           const [lat, lng] = coord.trim().split(/\s+/).map(Number);
//           return { lat, lng };
//         })
//         .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

//       if (waypoints.length === 0) return;

//       const path = [sourceMarker.position!, ...waypoints];

      

//       const polyline = new google.maps.Polyline({
//         path,
//         geodesic: true,
//         strokeColor: segment.LineColor,
//         strokeOpacity: 1.0,
//         strokeWeight: parseInt(segment.LineWidthpx),
//         editable: editMode, // Enable editing in edit mode
//         map
//       });

//       polylinesRef.current.push(polyline);

//       polyline.addListener('mouseover', () => {
//         if (segment.Desc) {
//           infoWindowRef.current?.setContent(`${segment.Name}: ${segment.Desc}`);
//           infoWindowRef.current?.open(map);
//           infoWindowRef.current?.setPosition(path[Math.floor(path.length / 2)]);
//         }
//       });

//       polyline.addListener('mouseout', () => {
//         infoWindowRef.current?.close();
//       });

//       polyline.addListener('click', (e: google.maps.PolyMouseEvent) => {
//         const edge = e.edge
//         if (edge) {
//           alert("segment api clicked ")
//           const edgePos =polyline.getPath().getAt(edge)
//         }

//       });
//     polyline.addListener('dblclick',()=>{
//       alert("double clicked")
//     })  

//       // this is to deal with edit mode
//       if (editMode) {
//         polyline.addListener('mouseup', () => {
          
//           const newPath = polyline.getPath().getArray().map(coord => ({
//             lat: coord.lat(),
//             lng: coord.lng()
//           }));
//           polyline.getPath().getArray().forEach((coord, i) => {
//             const mapMarker = new google.maps.marker.AdvancedMarkerElement({
//               position: {
//                 lat: coord.lat(),
//                 lng: coord.lng()
//               },
//               map
//             });
//             markersRef.current.set(`map-${s_idx}-${coord.lat()}-${coord.lng()}`, mapMarker);
//           });
//           const currentPath = polyline.getPath().getArray().map(p => `map-${s_idx}-${p.lat()}-${p.lng()}`)

//           markersRef.current.keys().map(m => m).filter((m) => {
//             return m.startsWith(`map-${s_idx}`)
//           }).forEach(cm => {
//             console.log(cm, currentPath.includes(cm))
//             if (!currentPath.includes(cm)) {
//               const mapMark = markersRef.current.get(cm)
//               console.log(mapMark)
//               if (mapMark) {
//                 mapMark.hidden = true
//                 mapMark.map = null
//               }
//               markersRef.current.delete(cm)
            
//             }
//           })
//           // console.log(currentMarkers)
//           console.log(markersRef.current.keys().map(m => m))
//           console.log(currentPath)

          
//           console.log('Path updated:', newPath);
//         });
//       }
//     });
//   }, [map, updatedMarkers, interconnects, interconnectPathStyle, editMode]);

// // this is the function to save impage 
//   const saveMapAsImage = async () => {
//     if (!mapRef.current) {
//       console.error('Map reference is not available');
//       return;
//     }
  
//     try {
//       // Wait for all images/tiles to load
//       await new Promise(resolve => setTimeout(resolve, 1000));
  
//       const canvas = await html2canvas(mapRef.current, {
//         useCORS: true,
//         allowTaint: true,
//         logging: true, // This is to Enable logging for debugging
//       });
  
//       // Create blob instead of data URL for better memory handling
//       canvas.toBlob((blob) => {
//         if (!blob) {
//           throw new Error('Canvas to Blob conversion failed');
//         }
        
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.download = 'map.png';
//         link.href = url;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         URL.revokeObjectURL(url);
//       }, 'image/png');
  
//     } catch (error) {
//       console.error('Error saving map as image:', error);
//       alert('Failed to save map as image: ' + error);
//     }
//   };

//   return (
//     <div>
//       <button className="px-4 py-2 bg-blue-500 text-white rounded bt-center" onClick={() => setEditMode(!editMode)} >
//         {editMode ? 'Disable Edit Mode' : 'Enable Edit Mode'}
//       </button>
//     {/* Conditionally render the save button only in edit mode */}
//     {editMode && (
//       <button className="px-4 py-2 bg-green-500 text-white rounded" onClick={saveMapAsImage}>
//         Save Map as Image
//       </button>
//     )}
//       <div ref={mapRef} style={{ width: '100%', height: '800px' }} />
//     </div>
//   );
// }



import { useEffect, useRef, useState } from 'react';
import { loader, getLatLngFromAddress, parseLatLng, reverseGeocode } from '@/app/utils/MapUtils';
import { SiteMarker, InterConnectSegment, Address } from '@/types';
import html2canvas from 'html2canvas';

interface Props {
  markers: SiteMarker[];
  interconnects: InterConnectSegment[];
  interconnectPathStyle?: number;
  editable?: boolean;
  fnClick?: (name?: string, latlng?: { lat: number; lng: number }, address?: string) => void;
  fnDblClick?: (name?: string) => void;
  fnCtrlClick?: (name?: string) => void;
  fnSave?: (updatedMarkers: SiteMarker[], updatedInterconnects: InterConnectSegment[]) => void;
}

export default function GoogleMap({ 
  markers, 
  interconnects, 
  interconnectPathStyle, 
  editable = false, 
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
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Initialize Google Map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;
  
      const google = await loader.load();
      
      // Define the bounds (global coverage)
      const allowedBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-85, -180),
        new google.maps.LatLng(85, 180)
      );
  
      const newMap = new google.maps.Map(mapRef.current, {
        zoom: 4, // Default zoom level set to 4
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        panControl: true,
        rotateControl: true,
        scaleControl: true,
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
  
      // Map click event for showing lat, lng, and address in edit mode
      if (editable) {
        newMap.addListener('click', async (event: google.maps.MapMouseEvent) => {
          if (editMode && event.latLng) {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            
            try {
              const address = await reverseGeocode({ lat, lng });
              
              // Call fnClick if provided
              if (fnClick) {
                fnClick(undefined, { lat, lng }, address);
              }
              
              // Show tooltip with location info
              if (infoWindowRef.current) {
                infoWindowRef.current.setContent(`
                  <div>
                    <strong>Latitude:</strong> ${lat.toFixed(6)}<br>
                    <strong>Longitude:</strong> ${lng.toFixed(6)}<br>
                    <strong>Address:</strong> ${address}
                  </div>
                `);
                infoWindowRef.current.setPosition(event.latLng);
                infoWindowRef.current.open(newMap);
              }
            } catch (error) {
              console.error('Reverse geocoding error:', error);
            }
          }
        });
      }
  
      setMap(newMap);
      infoWindowRef.current = new google.maps.InfoWindow();
    };
  
    initMap();
  }, [editable, editMode, fnClick]);

  // Process and update markers
  useEffect(() => {
    if (!map) return;

    const processMarkers = async () => {
      const bounds = new google.maps.LatLngBounds();
      const validMarkers = updatedMarkers.filter(m => parseLatLng(m.LatLng));

      validMarkers.forEach(marker => {
        const position = parseLatLng(marker.LatLng);
        if (!position) return;

        const mapMarker = new google.maps.marker.AdvancedMarkerElement({
          position,
          map, 
          gmpDraggable: editMode && editable,
          gmpClickable: true,
          title: marker.Name
        });

        markersRef.current.set(marker.Name, mapMarker);
        bounds.extend(position);

        // Hover event to show lat, lng, and address
        mapMarker.addListener('mouseover', async () => {
          if (infoWindowRef.current) {
            try {
              const address = marker.Address ? 
                (typeof marker.Address === 'string' 
                  ? marker.Address 
                  : JSON.stringify(marker.Address)) 
                : 'N/A';
              
              infoWindowRef.current.setContent(`
                <div>
                  <strong>Name:</strong> ${marker.Name}<br>
                  <strong>Latitude:</strong> ${position.lat}<br>
                  <strong>Longitude:</strong> ${position.lng}<br>
                  <strong>Address:</strong> ${address}
                </div>
              `);
              infoWindowRef.current.open(map, mapMarker);
            } catch (error) {
              console.error('Error processing marker info:', error);
            }
          }
        });

        mapMarker.addListener('mouseout', () => {
          infoWindowRef.current?.close();
        });

        // Click events
        mapMarker.addListener('click', () => {
          if (fnClick) {
            fnClick(marker.Name, position);
          }
        });

        // Double-click events
        mapMarker.addListener('dblclick', () => {
          if (fnDblClick) {
            fnDblClick(marker.Name);
          }
        });

        // Ctrl-click events (you might need to implement this differently based on browser/platform)
        mapMarker.addListener('click', (event: MouseEvent) => {
          if (event.ctrlKey && fnCtrlClick) {
            fnCtrlClick(marker.Name);
          }
        });

        // Marker drag events in edit mode
        if (editMode && editable) {
          mapMarker.addListener('dragend', () => {
            const newPosition = mapMarker.position;
            if (newPosition) {
              // Update the marker's position in the updatedMarkers state
              setUpdatedMarkers(prevMarkers => 
                prevMarkers.map(m => 
                  m.Name === marker.Name 
                    ? { ...m, LatLng: `${newPosition.lat}, ${newPosition.lng}`, Update: '1' } 
                    : m
                )
              );
            }
          });
        }
      });

      // Adjust map view
      if (validMarkers.length === 1) {
        const singlePosition = parseLatLng(validMarkers[0].LatLng);
        if (singlePosition) {
          map.setCenter(singlePosition);
          map.setZoom(12);
        }
      } else if (validMarkers.length > 1) {
        map.fitBounds(bounds);
      }
    };

    processMarkers();
  }, [map, updatedMarkers, editMode, editable, fnClick, fnDblClick, fnCtrlClick]);

  // Draw InterConnect paths
  useEffect(() => {
    if (!map) return;

    // Clear existing polylines
    polylinesRef.current.forEach(polyline => polyline.setMap(null));
    polylinesRef.current = [];

    updatedInterconnects.forEach((segment, s_idx) => {
      if (!segment.Name || !segment.WaypointLatLngArray) return;

      const waypoints = segment.WaypointLatLngArray
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(coord => {
          const [lat, lng] = coord.trim().split(/\s+/).map(Number);
          return { lat, lng };
        })
        .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));

      if (waypoints.length === 0) return;

      const polyline = new google.maps.Polyline({
        path: waypoints,
        geodesic: true,
        strokeColor: segment.LineColor,
        strokeOpacity: 1.0,
        strokeWeight: parseInt(segment.LineWidthpx),
        editable: editMode && editable,
        map
      });

      polylinesRef.current.push(polyline);

      // Hover event
      polyline.addListener('mouseover', () => {
        if (segment.Desc && infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div>
              <strong>Name:</strong> ${segment.Name}<br>
              <strong>Description:</strong> ${segment.Desc}
            </div>
          `);
          infoWindowRef.current.setPosition(waypoints[Math.floor(waypoints.length / 2)]);
          infoWindowRef.current.open(map);
        }
      });

      polyline.addListener('mouseout', () => {
        infoWindowRef.current?.close();
      });

      // Click events
      polyline.addListener('click', () => {
        if (fnClick) {
          fnClick(segment.Name);
        }
      });

      // Double-click events
      polyline.addListener('dblclick', () => {
        if (fnDblClick) {
          fnDblClick(segment.Name);
        }
      });

      // Edit mode path modifications
      if (editMode && editable) {
        polyline.addListener('mouseup', () => {
          const newPath = polyline.getPath().getArray().map(coord => ({
            lat: coord.lat(),
            lng: coord.lng()
          }));

          // Update the interconnect segment's waypoints
          setUpdatedInterconnects(prevInterconnects => 
            prevInterconnects.map(ic => 
              ic.Name === segment.Name 
                ? { 
                    ...ic, 
                    WaypointLatLngArray: newPath.map(p => `${p.lat} ${p.lng}`).join(', ') 
                  } 
                : ic
            )
          );
        });
      }
    });
  }, [map, updatedInterconnects, editMode, editable, fnClick, fnDblClick]);

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

  // Only show edit mode toggle and save button if editable is true
  return (
    <div>
      {editable && (
        <>
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded" 
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? 'Disable Edit Mode' : 'Enable Edit Mode'}
          </button>
          {editMode && (
            <button 
              className="px-4 py-2 bg-green-500 text-white rounded ml-2" 
              onClick={handleSave}
            >
              Save Changes
            </button>
          )}
                <button 
            className="px-4 py-2 bg-yellow-500 text-white rounded ml-2"
            onClick={saveMapAsImage}
          >
            Save Map as Image
          </button>
        </>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '800px' }} />
    </div>
  );
}
