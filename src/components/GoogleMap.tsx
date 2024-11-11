/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import { loader, getLatLngFromAddress, parseLatLng } from '@/app/utils/MapUtils';
import { SiteMarker, InterConnectSegment, Address } from '@/types';

interface Props {
  markers: SiteMarker[];
  interconnects: InterConnectSegment[];
  interconnectPathStyle: number;
}

export default function GoogleMap({ markers, interconnects, interconnectPathStyle }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [editMode, setEditMode] = useState(false); // Add Edit Mode state
  const [updatedMarkers, setUpdatedMarkers] = useState<SiteMarker[]>([]);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Initialize the Google Map
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      const google = await loader.load();
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
        ]
      });

      setMap(newMap);
      infoWindowRef.current = new google.maps.InfoWindow();
    };

    initMap();
  }, []);

  // Process and update markers
  useEffect(() => {
    const processMarkers = async () => {
      if (!map) return;

      const processed = await Promise.all(markers.map(async (marker) => {
        const newMarker = { ...marker };
        let position = parseLatLng(marker.LatLng);

        if (!position) {
          try {
            const address = JSON.parse(marker.Address.replace(/\"\"/g, '"')) as Address;
            position = await getLatLngFromAddress(address);
            if (position) {
              newMarker.LatLng = `${position.lat}, ${position.lng}`;
              newMarker.Update = '1';
            } else {
              newMarker.Update = '-1';
            }
          } catch (error) {
            console.error('Error processing marker:', error);
            newMarker.Update = '-1';
          }
        }

        return newMarker;
      }));

      setUpdatedMarkers(processed);

      const bounds = new google.maps.LatLngBounds();
      const validMarkers = processed.filter(m => m.Update !== '-1');

      validMarkers.forEach(marker => {
        const position = parseLatLng(marker.LatLng);
        if (position) bounds.extend(position);
      });

      interconnects.forEach(segment => {
        if (segment.WaypointLatLngArray) {
          const waypoints = segment.WaypointLatLngArray
            .replace(/[\[\]]/g, '')
            .split(',')
            .map(coord => {
              const [lat, lng] = coord.trim().split(/\s+/).map(Number);
              return { lat, lng };
            })
            .filter(coord => !isNaN(coord.lat) && !isNaN(coord.lng));
          
          waypoints.forEach(point => bounds.extend(point));
        }
      });

      if (validMarkers.length === 1) {
        const singlePosition = parseLatLng(validMarkers[0].LatLng);
        if (singlePosition) {
          map.setCenter(singlePosition);
          map.setZoom(12);
        }
      } else {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const latPadding = (ne.lat() - sw.lat()) * 0.05;
        const lngPadding = (ne.lng() - sw.lng()) * 0.05;
        
        bounds.extend({ lat: ne.lat() + latPadding, lng: ne.lng() + lngPadding });
        bounds.extend({ lat: sw.lat() - latPadding, lng: sw.lng() - lngPadding });

        map.fitBounds(bounds);
        
        const listener = google.maps.event.addListener(map, 'idle', () => {
          if (map.getZoom()! > 15) map.setZoom(15);
          google.maps.event.removeListener(listener);
        });
      }

      validMarkers.forEach(marker => {
        const position = parseLatLng(marker.LatLng);
        if (!position) return;

        const mapMarker = new google.maps.Marker({
          position,
          map,
          title: marker.Name,
          draggable: editMode, // Enable dragging in edit mode
          icon: {
            url: marker.iconSVGfile,
            scaledSize: new google.maps.Size(32, 32),
          }
        });

        markersRef.current.set(marker.Name, mapMarker);

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
          if (marker.Details) {
            infoWindowRef.current?.setContent(marker.Details.replace(/\\n/g, '<br>'));
            infoWindowRef.current?.open(map, mapMarker);
          }
        });

        mapMarker.addListener('dblclick', () => {
          alert('DblClicked');
        });

        if (editMode) {
          mapMarker.addListener('dragend', () => {
            const newPosition = mapMarker.getPosition();
            // console.log('Marker moved:', { lat: newPosition.lat(), lng: newPosition.lng() });
          });
        }
      });
    };

    processMarkers();
  }, [map, markers, interconnects, editMode]);

  // Draw InterConnect paths
  useEffect(() => {
    if (!map || updatedMarkers.length <= 1) return;

    interconnects.forEach(segment => {
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

      const path = [sourceMarker.getPosition()!, ...waypoints];

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: segment.LineColor,
        strokeOpacity: 1.0,
        strokeWeight: parseInt(segment.LineWidthpx),
        editable: editMode, // Enable editing in edit mode
        map
      });

      polylinesRef.current.push(polyline);

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

      polyline.addListener('click', () => {
        alert('Segment clicked - API call placeholder');
      });

      if (editMode) {
        polyline.addListener('mouseup', () => {
          const newPath = polyline.getPath().getArray().map(coord => ({
            lat: coord.lat(),
            lng: coord.lng()
          }));
          console.log('Path updated:', newPath);
        });
      }
    });
  }, [map, updatedMarkers, interconnects, interconnectPathStyle, editMode]);

  // Function to save map as image
  const saveMapAsImage = () => {
    const mapElement = mapRef.current;
    if (mapElement) {
      html2canvas(mapElement).then(canvas => {
        const link = document.createElement('a');
        link.download = 'map.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  return (
    <div>
      <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => setEditMode(!editMode)} >
        {editMode ? 'Disable Edit Mode' : 'Enable Edit Mode'}
      </button>
      <div ref={mapRef} style={{ width: '100%', height: '800px' }} />
    </div>
  );
}
