export interface Address {
    Address: string;
    City: string;
    State: string;
    ZIP: string;
    Country: string;
  }
  
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
  }