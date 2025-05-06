/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import {
  loader,
  getLatLngFromAddress,
  parseLatLng,
  reverseGeocode,
} from "@/app/utils/MapUtils";
import { SiteMarker, InterConnectSegment, Address } from "@/types";
import html2canvas from "html2canvas";
import DataPreview from "./DataPreview";

interface Props {
  markers: SiteMarker[];
  interconnects: InterConnectSegment[];
  interconnectPathStyle: number;
  fnClick?: (
    name?: string,
    latlng?: { lat: number; lng: number },
    address?: string
  ) => void;
  fnDblClick?: (name?: string) => void;
  fnCtrlClick?: (name?: string) => void;
  fnSave?: (
    updatedMarkers: SiteMarker[],
    updatedInterconnects: InterConnectSegment[]
  ) => void;
}

export default function GoogleMap({
  markers,
  interconnects,
  interconnectPathStyle,
  fnClick,
  fnDblClick,
  fnCtrlClick,
  fnSave,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [updatedMarkers, setUpdatedMarkers] = useState<SiteMarker[]>([
    ...markers,
  ]);
  const [updatedInterconnects, setUpdatedInterconnects] = useState<
    InterConnectSegment[]
  >([...interconnects]);
  const [showPopup, setShowPopup] = useState(false);
  const [draggedMarkers, setDraggedMarkers] = useState<Set<string>>(new Set());
  const [previousMarkerStates, setPreviousMarkerStates] = useState<
    Map<string, SiteMarker>
  >(new Map());

  // Refs to store map objects
  const markersRef = useRef<
    Map<string, google.maps.marker.AdvancedMarkerElement>
  >(new Map());
  const polylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map());
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Keep track of processed markers for state updates
  const processedMarkersRef = useRef<SiteMarker[]>([]);

  // Initialize Google Map
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
            stylers: [{ visibility: "off" }],
          },
        ],
        mapId: "4504f8b37365c3d0",
      });

      setMap(newMap);
      infoWindowRef.current = new google.maps.InfoWindow();

      // Set initial bounds based on markers
      const bounds = new google.maps.LatLngBounds();
      let hasValidMarkers = false;

      markers.forEach((marker) => {
        const position = parseLatLng(marker.LatLng);
        if (position) {
          bounds.extend(position);
          hasValidMarkers = true;
        }
      });

      if (hasValidMarkers) {
        newMap.fitBounds(bounds);
        // Add some padding to the bounds
        const padding = {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        };
        newMap.panToBounds(bounds, padding);
      }
    };

    initMap();
  }, [markers]);

  // Update local state when props change
  useEffect(() => {
    setUpdatedMarkers([...markers]);
    setUpdatedInterconnects([...interconnects]);
  }, [markers, interconnects]);

  // Function to find interconnects connected to a marker
  const findConnectedInterconnects = (markerName: string) => {
    return interconnects.filter(
      (ic) =>
        ic.Source &&
        ic.Target && // Ensure Source and Target exist
        (ic.Source === markerName || ic.Target === markerName)
    );
  };

  // Update connected paths when a marker is moved
  const updateConnectedPaths = async (
    oldMarkerName: string,
    newMarkerName: string,
    newPosition: google.maps.LatLng
  ) => {
    const connectedInterconnects = findConnectedInterconnects(oldMarkerName);

    connectedInterconnects.forEach((interconnect) => {
      if (!interconnect.Source || !interconnect.Target) return;

      const polylineKey = `${interconnect.Source}-${interconnect.Target}`;
      const polyline = polylinesRef.current.get(polylineKey);

      if (polyline) {
        const currentPath = polyline.getPath().getArray();
        let newPath;

        // Update the appropriate end of the path based on whether this is source or target
        if (interconnect.Source === oldMarkerName) {
          newPath = [newPosition, ...currentPath.slice(1)];
        } else if (interconnect.Target === oldMarkerName) {
          newPath = [...currentPath.slice(0, -1), newPosition];
        }

        if (newPath) {
          polyline.setPath(newPath);

          // Update the interconnect data with new marker name
          setUpdatedInterconnects((prevInterconnects) =>
            prevInterconnects.map((ic) =>
              ic.Source === oldMarkerName || ic.Target === oldMarkerName
                ? {
                    ...ic,
                    Source:
                      ic.Source === oldMarkerName ? newMarkerName : ic.Source,
                    Target:
                      ic.Target === oldMarkerName ? newMarkerName : ic.Target,
                    WaypointLatLngArray: newPath
                      .slice(1, -1)
                      .map((p: google.maps.LatLng) => {
                        const lat =
                          typeof p.lat === "function" ? p.lat() : p.lat;
                        const lng =
                          typeof p.lng === "function" ? p.lng() : p.lng;
                        return `${lat} ${lng}`;
                      })
                      .join(", "),
                    Update: "1",
                  }
                : ic
            )
          );
        }
      }
    });
  };

  // Process and update markers
  useEffect(() => {
    if (!map) return;

    // Reset processed markers collection
    processedMarkersRef.current = [];

    // This is the click event for the map
    const clickListener = map.addListener(
      "click",
      async (event: google.maps.MapMouseEvent) => {
        const lat = event.latLng!.lat();
        const lng = event.latLng!.lng();

        // Fetch address using reverse geocoding
        const address = await reverseGeocode({ lat, lng });

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
      }
    );

    // this is to handle mouse over
    const mouseoverListener = map.addListener(
      "mouseover",
      async (event: google.maps.MapMouseEvent) => {
        const lat = event.latLng!.lat();
        const lng = event.latLng!.lng();

        // Fetch address using reverse geocoding
        const address = await reverseGeocode({ lat, lng });

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
      }
    );

    // Remove existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current.clear();

    // Create new markers
    const processMarkers = async () => {
      const tempMarkers: SiteMarker[] = [];

      for (const marker of markers) {
        let position = parseLatLng(marker.LatLng);
        const updatedMarker = { ...marker };

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
            console.log(
              "The positions for the non-positioned records: ",
              position
            );

            if (position) {
              updatedMarker.LatLng = `${position.lat}, ${position.lng}`;
              updatedMarker.Update = "1";
            } else {
              updatedMarker.Update = "-1";
            }
          } catch (error) {
            console.error("Error in processing marker:", error);
            updatedMarker.Update = "-1";
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

          mapMarker.addListener("mouseout", () => {
            infoWindowRef.current?.close();
          });

          mapMarker.addListener("mouseover", () => {
            // Format content with Name on first line and Tooltip on second line
            const content = `
              <div style="font-family: Arial, sans-serif;">
                <strong>${marker.Name}</strong><br>
                ${marker.tooltip ? marker.tooltip.replace(/\\n/g, "<br>") : ""}
              </div>
            `;
            infoWindowRef.current?.setContent(content);
            infoWindowRef.current?.open(map, mapMarker);
          });

          mapMarker.addListener("click", () => {
            const content = `
              <div style="font-family: Arial, sans-serif;">
                <strong>${marker.Name}</strong><br>
                ${marker.Details ? marker.Details.replace(/\\n/g, "<br>") : ""}
              </div>
            `;
            infoWindowRef.current?.setContent(content);
            infoWindowRef.current?.open(map, mapMarker);
          });

          if (editMode) {
            // Handle click on marker event in edit mode
            mapMarker.addListener("click", () => {
              // Combine Address and LatLng with proper formatting
              const content = `
                  <div style="font-family: Arial, sans-serif;">
                      <strong style="color: blue;">Address:</strong> <br>
                      <span style="font-weight: bold; color:red">
                      ${marker.Address.replace(/\\n/g, "<br>")}
                      </span>
                      <br><br>
                      <span style="font-weight: bold; color:red">
                      <strong style="color: blue;">Coordinates:</strong> <br>
                      ${marker.LatLng.replace(/\\n/g, "<br>")}
                      </span>
                  </div>
              `;

              // Set the combined content
              infoWindowRef.current?.setContent(content);
              infoWindowRef.current?.open(map, mapMarker);
            });

            // This is to handle the dragend
            mapMarker.addListener(
              "dragend",
              async (event: google.maps.MapMouseEvent) => {
                if (event.latLng) {
                  const newLat = event.latLng.lat();
                  const newLng = event.latLng.lng();

                  // Get detailed address information for the new location
                  const addressInfo = await reverseGeocode({
                    lat: newLat,
                    lng: newLng,
                  });
                  const newName = `${addressInfo.city}, ${addressInfo.country}`;

                  // Create formatted address string
                  const formattedAddress = JSON.stringify({
                    Address: addressInfo.street || "",
                    City: addressInfo.city || "",
                    State: addressInfo.state || "",
                    ZIP: addressInfo.postalCode || "",
                    Country: addressInfo.country || "",
                  }).replace(/"/g, '""');

                  // Create new tooltip and details
                  const newTooltip = `This is ${
                    addressInfo.city
                  } tooltip line1\\nLocation: ${
                    addressInfo.street || addressInfo.city
                  }\\n${addressInfo.country}`;
                  const newDetails = `This is ${
                    addressInfo.city
                  } Details line1\\nAddress: ${
                    addressInfo.street || ""
                  }\\nCity: ${addressInfo.city}\\nCountry: ${
                    addressInfo.country
                  }`;

                  console.log("Marker dragged:", marker.Name);
                  console.log("New position:", { lat: newLat, lng: newLng });
                  console.log("New name:", newName);

                  // Store the previous state if not already stored
                  if (!previousMarkerStates.has(marker.Name)) {
                    console.log("Storing previous state for:", marker.Name);
                    setPreviousMarkerStates((prev) => {
                      const newMap = new Map(prev);
                      newMap.set(marker.Name, { ...marker });
                      return newMap;
                    });
                  }

                  // Update the markers state with new name, position, and details
                  setUpdatedMarkers((prevMarkers) =>
                    prevMarkers.map((m) =>
                      m.Name === marker.Name
                        ? {
                            ...m,
                            Name: newName,
                            LatLng: `${newLat}, ${newLng}`,
                            Address: formattedAddress,
                            tooltip: newTooltip,
                            Details: newDetails,
                            Update: "1",
                          }
                        : m
                    )
                  );

                  // Add to dragged markers set
                  setDraggedMarkers((prev) => new Set([...prev, newName]));

                  // Update connected paths with new name
                  await updateConnectedPaths(
                    marker.Name,
                    newName,
                    event.latLng
                  );

                  // Update the marker reference with new name and tooltip
                  const currentMarker = markersRef.current.get(marker.Name);
                  if (currentMarker) {
                    currentMarker.title = newName;

                    // Update the mouseover event listener with new tooltip
                    currentMarker.addListener("mouseover", () => {
                      const content = `
                        <div style="font-family: Arial, sans-serif;">
                          <strong>${newName}</strong><br>
                          ${newTooltip.replace(/\\n/g, "<br>")}
                        </div>
                      `;
                      infoWindowRef.current?.setContent(content);
                      infoWindowRef.current?.open(map, currentMarker);
                    });

                    // Update the click event listener with new details
                    currentMarker.addListener("click", () => {
                      const content = `
                        <div style="font-family: Arial, sans-serif;">
                          <strong>${newName}</strong><br>
                          ${newDetails.replace(/\\n/g, "<br>")}
                        </div>
                      `;
                      infoWindowRef.current?.setContent(content);
                      infoWindowRef.current?.open(map, currentMarker);
                    });

                    markersRef.current.delete(marker.Name);
                    markersRef.current.set(newName, currentMarker);
                  }
                }
              }
            );
          }

          markersRef.current.set(marker.Name, mapMarker);
        }

        // Add the processed marker to our temp array
        tempMarkers.push(updatedMarker);
      }

      // Update the state with all processed markers
      setUpdatedMarkers(tempMarkers);
      processedMarkersRef.current = tempMarkers;
    };

    processMarkers();

    // Adjust map bounds
    const bounds = new google.maps.LatLngBounds();
    markers.forEach((marker) => {
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

    // Clean up listeners on component unmount
    return () => {
      google.maps.event.removeListener(clickListener);
      google.maps.event.removeListener(mouseoverListener);
    };
  }, [map, markers, editMode]);

  // Draw InterConnect paths
  useEffect(() => {
    if (!map) return;

    // Remove existing polylines
    polylinesRef.current.forEach((polyline) => {
      polyline.setMap(null);
    });
    polylinesRef.current.clear();

    // Create a temporary array to store updated interconnects
    const tempInterconnects: InterConnectSegment[] = [];

    interconnects.forEach((segment) => {
      if (!segment.Source || !segment.Target) {
        tempInterconnects.push(segment);
        return;
      }

      const sourceMarker = markersRef.current.get(segment.Source);
      const targetMarker = markersRef.current.get(segment.Target);
      if (!sourceMarker || !targetMarker) {
        tempInterconnects.push(segment);
        return;
      }

      // Optionally, parse waypoints if you want to support them
      let path = [sourceMarker.position!];
      const waypoints = segment.WaypointLatLngArray?.replace(/[\[\]]/g, "")
        .split(",")
        .map((coord) => {
          const [lat, lng] = coord.trim().split(/\s+/).map(Number);
          return { lat, lng };
        })
        .filter((coord) => !isNaN(coord.lat) && !isNaN(coord.lng));
      if (waypoints && waypoints.length > 0) {
        path = path.concat(waypoints);
      }
      path.push(targetMarker.position!);

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: segment.LineColor,
        strokeOpacity: 1.0,
        strokeWeight: parseInt(segment.LineWidthpx),
        editable: editMode,
        map,
      });

      // Event listeners for polyline
      polyline.addListener("mouseover", () => {
        if (segment.Desc) {
          infoWindowRef.current?.setContent(
            `${segment.Source} → ${segment.Target}: ${segment.Desc}`
          );
          infoWindowRef.current?.open(map);
          infoWindowRef.current?.setPosition(path[Math.floor(path.length / 2)]);
        }
      });

      polyline.addListener("mouseout", () => {
        infoWindowRef.current?.close();
      });

      polylinesRef.current.set(`${segment.Source}-${segment.Target}`, polyline);
      tempInterconnects.push(segment);
    });

    // Update the state with all processed interconnects
    setUpdatedInterconnects(tempInterconnects);
  }, [map, interconnects, editMode]);

  // this is the function to save image
  const saveMapAsImage = async () => {
    if (!mapRef.current || !map) {
      console.error("Map reference or map is not available");
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
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Capture the map with markers
      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: true,
        logging: true,
      });

      // Create blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Canvas to Blob conversion failed");
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "map_with_markers.png";
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (error) {
      console.error("Error saving map as image:", error);
      alert("Failed to save map as image: " + error);
    }
  };

  // this is to capture the current map and save it
  const captureAllMapElements = async () => {
    const allCurrentMarkers: SiteMarker[] = [];
    const allCurrentInterconnects: InterConnectSegment[] = [];

    // Capture markers
    for (const [markerName, mapMarker] of markersRef.current.entries()) {
      try {
        const position = mapMarker.position;

        if (position) {
          const lat =
            typeof position.lat === "function" ? position.lat() : position.lat;
          const lng =
            typeof position.lng === "function" ? position.lng() : position.lng;

          // Get address information for the new location
          const addressInfo = await reverseGeocode({ lat, lng });

          // Create a new name based on location
          const newName = `${addressInfo.city}, ${addressInfo.country}`;

          // Find the original marker to preserve other properties
          const originalMarker =
            updatedMarkers.find((m) => m.Name === markerName) ||
            markers.find((m) => m.Name === markerName);

          if (originalMarker) {
            allCurrentMarkers.push({
              ...originalMarker,
              Name: newName,
              LatLng: `${lat}, ${lng}`,
              Update: "1",
            });
          }
        }
      } catch (error) {
        console.error(`Error capturing marker ${markerName}:`, error);
      }
    }

    // If no markers have been added to the map yet, use the processed markers
    if (
      allCurrentMarkers.length === 0 &&
      processedMarkersRef.current.length > 0
    ) {
      allCurrentMarkers.push(...processedMarkersRef.current);
    }

    // If we still have no markers, fall back to the original props
    if (allCurrentMarkers.length === 0 && markers.length > 0) {
      allCurrentMarkers.push(...markers);
    }

    // Capture interconnects separately
    for (const [segmentName, polyline] of polylinesRef.current.entries()) {
      try {
        const path = polyline.getPath();
        if (path) {
          const waypointPath = path
            .getArray()
            .slice(1)
            .map(
              (coord) =>
                `${typeof coord.lat === "function" ? coord.lat() : coord.lat} ${
                  typeof coord.lng === "function" ? coord.lng() : coord.lng
                }`
            )
            .join(", ");

          // Find the original interconnect to preserve other properties
          const originalInterconnect =
            updatedInterconnects.find((ic) => ic.Name === segmentName) ||
            interconnects.find((ic) => ic.Name === segmentName);

          if (originalInterconnect) {
            allCurrentInterconnects.push({
              ...originalInterconnect,
              WaypointLatLngArray: waypointPath,
              Update: "1",
            });
          }
        }
      } catch (error) {
        console.error(`Error capturing interconnect ${segmentName}:`, error);
      }
    }

    // If no interconnects in map, use the state or props
    if (allCurrentInterconnects.length === 0) {
      if (updatedInterconnects.length > 0) {
        allCurrentInterconnects.push(...updatedInterconnects);
      } else if (interconnects.length > 0) {
        allCurrentInterconnects.push(...interconnects);
      }
    }

    console.log("Captured data:", {
      markers: allCurrentMarkers,
      interconnects: allCurrentInterconnects,
    });

    return {
      markers: allCurrentMarkers,
      interconnects: allCurrentInterconnects,
    };
  };

  // This is to save
  const handleSave = async () => {
    if (fnSave) {
      const { markers: capturedMarkers, interconnects: capturedInterconnects } =
        await captureAllMapElements();

      console.log("Captured Markers:", capturedMarkers);
      console.log("Captured Interconnects:", capturedInterconnects);

      // Save all markers and interconnects
      fnSave(capturedMarkers, capturedInterconnects);

      // Clear the dragged markers set and previous states after saving
      setDraggedMarkers(new Set());
      setPreviousMarkerStates(new Map());
    } else {
      console.error("Save function not provided");
      alert("Save function not provided");
    }
  };

  const handlePreview = async () => {
    // Directly capture the current map state
    const { markers: capturedMarkers, interconnects: capturedInterconnects } =
      await captureAllMapElements();

    console.log("Current markers data:", capturedMarkers);
    console.log("Current interconnects data:", capturedInterconnects);
    console.log(
      "Previous marker states:",
      Array.from(previousMarkerStates.entries())
    );

    // Check if there's actually data to display
    if (capturedMarkers.length === 0 && capturedInterconnects.length === 0) {
      alert(
        "No data available to preview. Try adding markers or interconnects first."
      );
      return;
    }

    // Update state with captured data
    setUpdatedMarkers(capturedMarkers);
    setUpdatedInterconnects(capturedInterconnects);

    // Then show the popup
    setShowPopup(true);
  };

  return (
    <div>
      {/* Popup for JSON Preview */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <DataPreview
            markers={updatedMarkers}
            interconnects={updatedInterconnects}
            previousMarkers={Array.from(previousMarkerStates.values())}
            onClose={() => setShowPopup(false)}
            onSave={() => {
              handleSave();
              setShowPopup(false);
            }}
          />
        </div>
      )}
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded bt-center"
        onClick={() => setEditMode(false)}
      >
        Normal Mode
      </button>
      <button
        className="px-4 py-2 bg-red-500 text-white rounded bt-center"
        onClick={() => setEditMode(true)}
        style={{ margin: 4 }}
      >
        Edit Mode
      </button>

      {/* Preview Button and it will be appear in the edit mode only */}
      {editMode && (
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={handlePreview}
        >
          Preview
        </button>
      )}
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
      <div ref={mapRef} style={{ width: "100%", height: "800px" }} />
    </div>
  );
}
