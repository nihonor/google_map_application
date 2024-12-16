export interface Address {
  Address: string;
  City: string;
  State: string;
  ZIP: string;
  Country: string;
}

// this is sitemaker interface
export interface SiteMarker {
  Name: string;
  Selected: string;
  Update: string;
  LatLng: string;
  Address: string; 
  iconSVGfile: string;
  AlertStatus: string;
  tooltip: string;
  Details: string;
  iconColor?: string; 
  iconSize?: { width: number; height: number }; 
  // Latitude:number;
  // Longitude:number;
  
}

export interface InterConnectSegment {
  Name: string;
  Desc: string;
  LineType: string;
  LineWidthpx: string;
  LineColor: string;
  LineAttribute: string;
  LineStyle: string;
  LineEndIcon: string;
  WaypointLatLngArray: string;
  LineHoverColor?: string; 
  LineClickEventMessage?: string; 
  Update?: string;
}

export interface MapComponentProps {
  markers: SiteMarker[];
  interconnects: InterConnectSegment[];
  interconnectPathStyle?: number;
  editable?: boolean;
  fnClick?: (name?: string, latlng?: { lat: number; lng: number }, address?: string) => void;
  fnDblClick?: (name?: string) => void;
  fnCtrlClick?: (name?: string) => void;
  fnSave?: (markers: SiteMarker[], interconnects: InterConnectSegment[]) => void;
}