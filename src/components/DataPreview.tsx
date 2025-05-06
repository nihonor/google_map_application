import { SiteMarker, InterConnectSegment } from "@/types";
import React, { useState } from "react";
import { useGeocode } from "@/hooks/useGeocode";

interface PopupDataViewProps {
  markers: SiteMarker[];
  interconnects: InterConnectSegment[];
  previousMarkers: SiteMarker[];
  onClose: () => void;
  onSave?: () => void;
}

const MarkerCard: React.FC<{
  marker: SiteMarker;
  previousState?: SiteMarker;
}> = ({ marker, previousState }) => {
  const { data: currentData, loading: currentLoading } = useGeocode(marker.LatLng);
  const { data: previousData, loading: previousLoading } = useGeocode(
    previousState?.LatLng || ""
  );
  const hasChanges = previousState && previousState.LatLng !== marker.LatLng;

  return (
    <div
      style={{
        border: "1px solid #e9ecef",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #e9ecef",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: "16px",
            color: "#212529",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: "10px",
              height: "10px",
              backgroundColor: marker.iconColor || "#0d6efd",
              borderRadius: "50%",
            }}
          ></span>
          {marker.Name || `Marker ${marker.id}`}
        </h4>
        {hasChanges && (
          <span
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "500",
              backgroundColor: "#ffc107",
              color: "#212529",
            }}
          >
            Modified
          </span>
        )}
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "13px",
              color: "#6c757d",
              marginBottom: "4px",
            }}
          >
            Location
          </div>
          <div
            style={{
              fontSize: "14px",
              padding: "6px 10px",
              backgroundColor: "#f1f3f5",
              borderRadius: "4px",
            }}
          >
            {hasChanges ? (
              <div>
                <div style={{ color: "#dc3545", marginBottom: "4px" }}>
                  Previous Location:
                  <div style={{ marginLeft: "12px", marginTop: "4px" }}>
                    {previousLoading ? (
                      <div>Loading address...</div>
                    ) : previousData ? (
                      <>
                        <div>Country: {previousData.country}</div>
                        <div>City: {previousData.city}</div>
                        <div style={{ marginTop: "4px", color: "#666" }}>
                          Coordinates: {previousState?.LatLng}
                        </div>
                      </>
                    ) : (
                      <div>Coordinates: {previousState?.LatLng}</div>
                    )}
                  </div>
                </div>
                <div style={{ color: "#28a745" }}>
                  Current Location:
                  <div style={{ marginLeft: "12px", marginTop: "4px" }}>
                    {currentLoading ? (
                      <div>Loading address...</div>
                    ) : currentData ? (
                      <>
                        <div>Country: {currentData.country}</div>
                        <div>City: {currentData.city}</div>
                        <div style={{ marginTop: "4px", color: "#666" }}>
                          Coordinates: {marker.LatLng}
                        </div>
                      </>
                    ) : (
                      <div>Coordinates: {marker.LatLng}</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {currentLoading ? (
                  <div>Loading address...</div>
                ) : currentData ? (
                  <>
                    <div>Country: {currentData.country}</div>
                    <div>City: {currentData.city}</div>
                    <div style={{ marginTop: "4px", color: "#666" }}>
                      Coordinates: {marker.LatLng}
                    </div>
                  </>
                ) : (
                  <div>Coordinates: {marker.LatLng}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {marker.tooltip && (
          <div style={{ marginBottom: "12px" }}>
            <div
              style={{
                fontSize: "13px",
                color: "#6c757d",
                marginBottom: "4px",
              }}
            >
              Tooltip
            </div>
            <div style={{ fontSize: "14px" }}>
              {marker.tooltip.replace(/\\n/g, " ")}
            </div>
          </div>
        )}

        {marker.Address && (
          <div>
            <div
              style={{
                fontSize: "13px",
                color: "#6c757d",
                marginBottom: "4px",
              }}
            >
              Address
            </div>
            <div style={{ fontSize: "14px" }}>
              {typeof marker.Address === "string" &&
              marker.Address.includes("Address") ? (
                <>
                  <div>Previous: {previousState?.LatLng}</div>
                  <div>Current: {marker.LatLng}</div>
                  {currentData && (
                    <div style={{ marginTop: "8px" }}>
                      <div>Country: {currentData.country}</div>
                      <div>City: {currentData.city}</div>
                      <div style={{ marginTop: "4px", color: "#666" }}>
                        Coordinates: {marker.LatLng}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                marker.Address
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InterconnectCard: React.FC<{ interconnect: InterConnectSegment }> = ({
  interconnect,
}) => {
  return (
    <div
      style={{
        border: "1px solid #e9ecef",
        borderRadius: "8px",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #e9ecef",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: "16px",
            color: "#212529",
            fontWeight: "600",
          }}
        >
          {interconnect.Name || `Interconnect ${interconnect.id}`}
        </h4>
        {interconnect.Update === "1" && (
          <span
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "500",
              backgroundColor: "#ffc107",
              color: "#212529",
            }}
          >
            Modified
          </span>
        )}
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "13px",
              color: "#6c757d",
              marginBottom: "4px",
            }}
          >
            Line Color
          </div>
          <div
            style={{
              fontSize: "14px",
              padding: "6px 10px",
              backgroundColor: "#f1f3f5",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "16px",
                height: "16px",
                backgroundColor: interconnect.LineColor || "#000",
                borderRadius: "4px",
              }}
            ></span>
            {interconnect.LineColor || "Default"}
          </div>
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "13px",
              color: "#6c757d",
              marginBottom: "4px",
            }}
          >
            Line Width
          </div>
          <div
            style={{
              fontSize: "14px",
              padding: "6px 10px",
              backgroundColor: "#f1f3f5",
              borderRadius: "4px",
            }}
          >
            {interconnect.LineWidthpx || "1"}px
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: "13px",
              color: "#6c757d",
              marginBottom: "4px",
            }}
          >
            Waypoints
          </div>
          <div
            style={{
              fontSize: "14px",
              padding: "6px 10px",
              backgroundColor: "#f1f3f5",
              borderRadius: "4px",
              fontFamily: "monospace",
              maxHeight: "80px",
              overflowY: "auto",
            }}
          >
            {interconnect.WaypointLatLngArray || "No waypoints"}
          </div>
        </div>
      </div>
    </div>
  );
};

const DataPreview: React.FC<PopupDataViewProps> = ({
  markers,
  interconnects,
  previousMarkers,
  onClose,
  onSave,
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [dataType, setDataType] = useState<"markers" | "interconnects">(
    "markers"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const getPreviousMarkerState = (markerName: string) => {
    return previousMarkers.find((m) => m.Name === markerName);
  };

  const filteredMarkers = markers.filter((marker) =>
    marker.Name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInterconnects = interconnects.filter((ic) =>
    ic.Name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentData =
    dataType === "markers" ? filteredMarkers : filteredInterconnects;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "80%",
        maxHeight: "85%",
        backgroundColor: "white",
        padding: "0",
        border: "1px solid #ccc",
        borderRadius: "12px",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.2)",
        zIndex: 1000,
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#f8f9fa",
          borderBottom: "1px solid #e9ecef",
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, color: "#333", fontSize: "18px" }}>
          Preview Changes
        </h3>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "8px 12px",
              border: "1px solid #ced4da",
              borderRadius: "4px",
              fontSize: "14px",
              width: "200px",
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              color: "#666",
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #e9ecef" }}>
        <button
          onClick={() => setDataType("markers")}
          style={{
            padding: "12px 16px",
            background: dataType === "markers" ? "#fff" : "#f8f9fa",
            border: "none",
            borderBottom:
              dataType === "markers"
                ? "2px solid #0d6efd"
                : "2px solid transparent",
            color: dataType === "markers" ? "#0d6efd" : "#666",
            fontWeight: dataType === "markers" ? "600" : "normal",
            cursor: "pointer",
            flex: "1",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          Markers ({markers.length})
        </button>
        <button
          onClick={() => setDataType("interconnects")}
          style={{
            padding: "12px 16px",
            background: dataType === "interconnects" ? "#fff" : "#f8f9fa",
            border: "none",
            borderBottom:
              dataType === "interconnects"
                ? "2px solid #0d6efd"
                : "2px solid transparent",
            color: dataType === "interconnects" ? "#0d6efd" : "#666",
            fontWeight: dataType === "interconnects" ? "600" : "normal",
            cursor: "pointer",
            flex: "1",
            textAlign: "center",
            fontSize: "14px",
          }}
        >
          Interconnects ({interconnects.length})
        </button>
      </div>

      <div
        style={{
          padding: "20px",
          overflowY: "auto",
          maxHeight: "calc(85vh - 118px)",
        }}
      >
        {currentData.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#666" }}>
            {dataType === "markers"
              ? "No markers available"
              : "No interconnects available"}
          </div>
        )}

        {dataType === "markers" && filteredMarkers.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredMarkers.map((marker, index) => (
              <MarkerCard
                key={index}
                marker={marker}
                previousState={getPreviousMarkerState(marker.Name)}
              />
            ))}
          </div>
        )}

        {dataType === "interconnects" && filteredInterconnects.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredInterconnects.map((interconnect, index) => (
              <InterconnectCard key={index} interconnect={interconnect} />
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #e9ecef",
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          style={{
            padding: "8px 16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default DataPreview;