import { useEffect, useRef, useState } from 'react';
import { loader,getLatLngFromAddress,parseLatLng } from '@/app/utils/MapUtils';
import { SiteMarker,InterConnectSegment ,Address} from '@/types';

interface Props {
  markers: SiteMarker[];
  interconnects: InterConnectSegment[];
  interconnectPathStyle: number;
}

export default function GoogleMap({ markers, interconnects, interconnectPathStyle }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [updatedMarkers, setUpdatedMarkers] = useState<SiteMarker[]>([]);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;
      
      const google = await loader.load();
      const newMap = new google.maps.Map(mapRef.current, {
        zoom: 4,
        center: { lat: 0, lng: 0 },
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
      });
      
      setMap(newMap);
      infoWindowRef.current = new google.maps.InfoWindow();
    };
    
    initMap();
  }, []);
  
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
      
      // Calculate bounds
      const bounds = new google.maps.LatLngBounds();
      const validMarkers = processed.filter(m => m.Update !== '-1');
      
      validMarkers.forEach(marker => {
        const position = parseLatLng(marker.LatLng);
        if (position) bounds.extend(position);
      });
      
      // Expand bounds by 10%
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latDiff = (ne.lat() - sw.lat()) * 0.1;
      const lngDiff = (ne.lng() - sw.lng()) * 0.1;
      bounds.extend({ lat: ne.lat() + latDiff, lng: ne.lng() + lngDiff });
      bounds.extend({ lat: sw.lat() - latDiff, lng: sw.lng() - lngDiff });
      
      map.fitBounds(bounds);
      
      // Add markers to map
      validMarkers.forEach(marker => {
        const position = parseLatLng(marker.LatLng);
        if (!position) return;
        
        const mapMarker = new google.maps.Marker({
          position,
          map,
          title: marker.Name,
          icon: {
            url: marker.iconSVGfile,
            scaledSize: new google.maps.Size(32, 32)
          }
        });
        
        markersRef.current.set(marker.Name, mapMarker);
        
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
          if (marker.Details) {
            infoWindowRef.current?.setContent(marker.Details.replace(/\\n/g, '<br>'));
            infoWindowRef.current?.open(map, mapMarker);
          }
        });
        
        mapMarker.addListener('dblclick', () => {
          alert('DblClicked');
        });
      });
    };
    
    processMarkers();
  }, [map, markers]);
  
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
        map
      });
      
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
    });
  }, [map, updatedMarkers, interconnects, interconnectPathStyle]);
  
  return (
    <div ref={mapRef} style={{ width: '100%', height: '800px' }} />
  );
}