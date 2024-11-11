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
}


// export interface Address {
//   site: string;
//   city: string;
//   state: string;
//   country: string;
//   postalcode: string;
// }

// export interface SiteMarker {
//   Selected: string;
//   Updated: string;
//   Name: string;
//   LatLng: string;
//   Address: string;
//   iconSVGfile: string;
//   AlertStatus: string;
//   tooltip: string;
//   Details: string;
// }

// export interface InterConnectSegment {
//   Name: string;
//   Desc: string;
//   LineType: string;
//   LineWidthpx: string;
//   LineColor: string;
//   LineAttribute: string;
//   LineStyle: string;
//   LineEndIcon: string;
//   WaypointLatLngArray: string;
// }
