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

interface AddressInfo {
  city?: string;
  state?: string;
  country?: string;
  street?: string;
  postalCode?: string;
}

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

      // Clear any existing map instance
      if (map) {
        // Remove all overlays and listeners
        google.maps.event.clearInstanceListeners(map);
      }

      const newMap = new google.maps.Map(mapRef.current, {
        zoom: 4,
        center: { lat: 20, lng: 0 },
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        restriction: {
          latLngBounds: {
            north: 85,
            south: -85,
            west: -180,
            east: 180,
          },
          strictBounds: true,
        },
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

      // Clear any existing info windows
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
      infoWindowRef.current = new google.maps.InfoWindow();

      // Set initial bounds based on markers
      if (markers.length > 0) {
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
      }
    };

    // Call initMap
    initMap();

    // Cleanup function
    return () => {
      // Clear all markers
      markersRef.current.forEach((marker) => {
        marker.map = null;
      });
      markersRef.current.clear();

      // Clear all polylines
      polylinesRef.current.forEach((polyline) => {
        polyline.setMap(null);
      });
      polylinesRef.current.clear();

      // Clear info window
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, []); // Empty dependency array since we only want this to run once on mount

  // Update local state when props change
  useEffect(() => {
    // Only update if we're NOT in edit mode
    if (!editMode) {
      setUpdatedMarkers([...markers]);
      setUpdatedInterconnects([...interconnects]);
    }
  }, [markers, interconnects, editMode]);

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

    // Declare listener variables
    let clickListener: google.maps.MapsEventListener | null = null;
    let mouseoverListener: google.maps.MapsEventListener | null = null;

    // Remove existing markers
    markersRef.current.forEach((marker) => {
      marker.map = null;
    });
    markersRef.current.clear();

    // Create new markers
    const processMarkers = async () => {
      const tempMarkers: SiteMarker[] = [];

      for (const marker of updatedMarkers) {
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

          // Store click listener reference so we can remove it later
          let clickListener: google.maps.MapsEventListener | null = null;
          let mouseoutListener: google.maps.MapsEventListener | null = null;
          let mouseoverListener: google.maps.MapsEventListener | null = null;

          // Remove existing listeners if they exist
          const removeExistingListeners = () => {
            if (clickListener) google.maps.event.removeListener(clickListener);
            if (mouseoutListener)
              google.maps.event.removeListener(mouseoutListener);
            if (mouseoverListener)
              google.maps.event.removeListener(mouseoverListener);
          };

          // Add new listeners
          const addMarkerListeners = () => {
            removeExistingListeners();

            mouseoutListener = mapMarker.addListener("mouseout", () => {
              infoWindowRef.current?.close();
            });

            mouseoverListener = mapMarker.addListener("mouseover", () => {
              const content = `
                <div style="font-family: Arial, sans-serif;">
                  <strong>${marker.Name}</strong><br>
                  ${
                    marker.tooltip ? marker.tooltip.replace(/\\n/g, "<br>") : ""
                  }
                </div>
              `;
              infoWindowRef.current?.setContent(content);
              infoWindowRef.current?.open(map, mapMarker);
            });

            clickListener = mapMarker.addListener("click", async () => {
              const position = mapMarker.position;
              if (!position) return;

              const lat =
                typeof position.lat === "function"
                  ? position.lat()
                  : position.lat;
              const lng =
                typeof position.lng === "function"
                  ? position.lng()
                  : position.lng;

              // Get fresh address information for current position
              const addressInfo = await reverseGeocode({ lat, lng });

              // Create location string with only available components
              const locationParts = [];
              if (addressInfo.city) locationParts.push(addressInfo.city);
              if (addressInfo.state) locationParts.push(addressInfo.state);
              if (addressInfo.country) locationParts.push(addressInfo.country);

              const locationString = locationParts.join(", ");

              // Format the content
              const content = `
                <div style="font-family: Arial, sans-serif;">
                  <strong>Location:</strong><br>
                  <span style="color: red">${locationString}</span>
                  <br><br>
                  <strong>Coordinates:</strong><br>
                  <span style="color: red">${lat}, ${lng}</span>
                </div>
              `;

              // Set the content
              infoWindowRef.current?.setContent(content);
              infoWindowRef.current?.open(map, mapMarker);
            });
          };

          // Initial addition of listeners
          addMarkerListeners();

          if (editMode) {
            // Handle drag events
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
                  // Only use new name if both city and country are present
                  const newName =
                    addressInfo.city && addressInfo.country
                      ? `${addressInfo.city}, ${addressInfo.country}`
                      : marker.Name; // fallback to old name if geocoding fails

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
                    addressInfo.city || marker.Name
                  } tooltip line1\\nLocation: ${
                    addressInfo.street || addressInfo.city || marker.Name
                  }\\n${addressInfo.country || ""}`;
                  const newDetails = `This is ${
                    addressInfo.city || marker.Name
                  } Details line1\\nAddress: ${
                    addressInfo.street || ""
                  }\\nCity: ${addressInfo.city || ""}\\nCountry: ${
                    addressInfo.country || ""
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

                  // Only update marker and interconnectors if newName is valid (not empty)
                  if (newName && newName.trim() !== "") {
                    // Remove the old marker and add the new one
                    setUpdatedMarkers((prevMarkers) => {
                      // Remove the old marker
                      const filtered = prevMarkers.filter(
                        (m) => m.Name !== marker.Name
                      );
                      // Add the new marker
                      return [
                        ...filtered,
                        {
                          ...marker,
                          Name: newName,
                          LatLng: `${newLat}, ${newLng}`,
                          Address: formattedAddress,
                          tooltip: newTooltip,
                          Details: newDetails,
                          Update: "1",
                        },
                      ];
                    });

                    // Add to dragged markers set
                    setDraggedMarkers((prev) => new Set([...prev, newName]));

                    // Update all interconnectors referencing the old name to use the new name, but do NOT delete any interconnectors
                    setUpdatedInterconnects((prevInterconnects) =>
                      prevInterconnects.map((ic) => ({
                        ...ic,
                        Source: ic.Source === marker.Name ? newName : ic.Source,
                        Target: ic.Target === marker.Name ? newName : ic.Target,
                        Update: "1",
                      }))
                    );

                    // Update connected paths with new name
                    await updateConnectedPaths(
                      marker.Name,
                      newName,
                      event.latLng
                    );

                    // Update the marker reference with new name and tooltip
                    const currentMarker = markersRef.current.get(marker.Name);
                    if (currentMarker) {
                      // Remove all existing listeners from the marker
                      google.maps.event.clearInstanceListeners(currentMarker);

                      // Update the marker's title
                      currentMarker.title = newName;

                      // Add new event listeners
                      currentMarker.addListener("mouseout", () => {
                        infoWindowRef.current?.close();
                      });

                      currentMarker.addListener("mouseover", async () => {
                        const position = currentMarker.position;
                        if (!position) return;

                        const lat =
                          typeof position.lat === "function"
                            ? position.lat()
                            : position.lat;
                        const lng =
                          typeof position.lng === "function"
                            ? position.lng()
                            : position.lng;

                        // Get fresh address information for current position
                        const addressInfo = await reverseGeocode({ lat, lng });

                        // Create location string with only available components
                        const locationParts = [];
                        if (addressInfo.street)
                          locationParts.push(addressInfo.street);
                        if (addressInfo.city)
                          locationParts.push(addressInfo.city);
                        if (addressInfo.state)
                          locationParts.push(addressInfo.state);
                        if (addressInfo.country)
                          locationParts.push(addressInfo.country);

                        const locationString = locationParts.join(", ");

                        const content = `
                          <div style="font-family: Arial, sans-serif;">
                            <strong>${locationString}</strong><br>
                            ${newTooltip.replace(/\\n/g, "<br>")}
                            <br>
                            <span style="color: #666;">Coordinates: ${lat.toFixed(
                              6
                            )}, ${lng.toFixed(6)}</span>
                          </div>
                        `;
                        infoWindowRef.current?.setContent(content);
                        infoWindowRef.current?.open(map, currentMarker);
                      });

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

                      // Update marker reference in the map
                      markersRef.current.delete(marker.Name);
                      markersRef.current.set(newName, currentMarker);
                    }
                  } else {
                    // If newName is not valid, just update the position and details, keep the old name
                    setUpdatedMarkers((prevMarkers) =>
                      prevMarkers.map((m) =>
                        m.Name === marker.Name
                          ? {
                              ...m,
                              LatLng: `${newLat}, ${newLng}`,
                              Address: formattedAddress,
                              tooltip: newTooltip,
                              Details: newDetails,
                              Update: "1",
                            }
                          : m
                      )
                    );
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

      // Only update state if markers have actually changed
      const hasMarkersChanged =
        JSON.stringify(tempMarkers) !== JSON.stringify(updatedMarkers);
      if (hasMarkersChanged) {
        setUpdatedMarkers(tempMarkers);
      }
      processedMarkersRef.current = tempMarkers;
    };

    processMarkers();

    // Adjust map bounds
    const bounds = new google.maps.LatLngBounds();
    updatedMarkers.forEach((marker) => {
      const position = parseLatLng(marker.LatLng);
      if (position) bounds.extend(position);
    });

    if (updatedMarkers.length > 1) {
      map.fitBounds(bounds);
    } else if (updatedMarkers.length === 1) {
      const singlePosition = parseLatLng(updatedMarkers[0].LatLng);
      if (singlePosition) {
        map.setCenter(singlePosition);
        map.setZoom(12);
      }
    }

    // Clean up listeners on component unmount
    return () => {
      if (clickListener) google.maps.event.removeListener(clickListener);
      if (mouseoverListener)
        google.maps.event.removeListener(mouseoverListener);
    };
  }, [map, editMode]); // Remove updatedMarkers from dependencies

  // Draw InterConnect paths
  useEffect(() => {
    if (!map) return;

    // Remove existing polylines
    polylinesRef.current.forEach((polyline) => {
      polyline.setMap(null);
    });
    polylinesRef.current.clear();

    updatedInterconnects.forEach((segment) => {
      if (!segment.Source || !segment.Target) {
        return;
      }

      // Use updatedMarkers for lookups
      const sourceMarker = markersRef.current.get(segment.Source);
      const targetMarker = markersRef.current.get(segment.Target);
      if (!sourceMarker || !targetMarker) {
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
    });

    // Do NOT call setUpdatedInterconnects here!
  }, [map, updatedInterconnects, updatedMarkers, editMode]);

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
    // Build the marker list from the current map state and updatedMarkers
    const allCurrentMarkers: SiteMarker[] = [];

    for (const [markerName, mapMarker] of markersRef.current.entries()) {
      try {
        const position = mapMarker.position;
        if (position) {
          const lat =
            typeof position.lat === "function" ? position.lat() : position.lat;
          const lng =
            typeof position.lng === "function" ? position.lng() : position.lng;

          // Find the marker in updatedMarkers (not original markers)
          const markerData = updatedMarkers.find((m) => m.Name === markerName);
          if (markerData) {
            allCurrentMarkers.push({
              ...markerData,
              LatLng: `${lat}, ${lng}`,
              Update: "1",
            });
          }
        }
      } catch (error) {
        console.error(`Error capturing marker ${markerName}:`, error);
      }
    }

    // Capture interconnects separately
    const allCurrentInterconnects: InterConnectSegment[] = [...interconnects]; // Start with all existing interconnects

    // Update only the visible interconnects that have been modified
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

          // Split the segmentName to get Source and Target
          const [source, target] = segmentName.split("-");

          // Find and update the existing interconnect
          const index = allCurrentInterconnects.findIndex(
            (ic) => ic.Source === source && ic.Target === target
          );

          if (index !== -1) {
            // Only update if waypoints have changed
            const hasChanged =
              waypointPath !==
              allCurrentInterconnects[index].WaypointLatLngArray;
            allCurrentInterconnects[index] = {
              ...allCurrentInterconnects[index],
              WaypointLatLngArray: waypointPath,
              Update: hasChanged ? "1" : allCurrentInterconnects[index].Update,
            };
          }
        }
      } catch (error) {
        console.error(`Error capturing interconnect ${segmentName}:`, error);
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
      try {
        const {
          markers: capturedMarkers,
          interconnects: capturedInterconnects,
        } = await captureAllMapElements();

        console.log("Captured Markers:", capturedMarkers);
        console.log("Captured Interconnects:", capturedInterconnects);

        // Save all markers and interconnects
        await fnSave(capturedMarkers, capturedInterconnects);

        // Clear the dragged markers set and previous states after saving
        setDraggedMarkers(new Set());
        setPreviousMarkerStates(new Map());

        // Update local state with captured data
        setUpdatedMarkers(capturedMarkers);
        setUpdatedInterconnects(capturedInterconnects);

        // Wait for state to update
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Save map as image
        await saveMapAsImage();
      } catch (error) {
        console.error("Error in save process:", error);
        alert("Failed to save data. Please try again.");
      }
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

  const getAddressFromCoordinates = async ({
    lat,
    lng,
  }: {
    lat: number;
    lng: number;
  }): Promise<AddressInfo> => {
    try {
      const google = await loader.load();
      const geocoder = new google.maps.Geocoder();

      const response = await geocoder.geocode({
        location: { lat, lng },
      });

      if (!response.results?.[0]) {
        throw new Error("No results found");
      }

      const addressInfo: AddressInfo = {};
      const result = response.results[0];

      // Extract address components
      result.address_components.forEach((component: any) => {
        const types = component.types;
        if (types.includes("locality")) {
          addressInfo.city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          addressInfo.state = component.long_name;
        } else if (types.includes("country")) {
          addressInfo.country = component.long_name;
        } else if (types.includes("route")) {
          addressInfo.street = component.long_name;
        } else if (types.includes("postal_code")) {
          addressInfo.postalCode = component.long_name;
        }
      });

      return addressInfo;
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      return {};
    }
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
