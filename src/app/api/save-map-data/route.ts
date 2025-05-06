import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { markers, interconnects } = await request.json();
    console.log('Received data:', { markers, interconnects });

    // Paths to JSON files
    const markersFilePath = path.join(process.cwd(), 'src', 'data', 'SiteMarkers.json');
    const interconnectsFilePath = path.join(process.cwd(), 'src', 'data', 'InterConnectSegments.json');
    console.log('File paths:', { markersFilePath, interconnectsFilePath });

    // Read existing data
    const existingMarkers = JSON.parse(await fs.readFile(markersFilePath, 'utf8'));
    const existingInterconnects = JSON.parse(await fs.readFile(interconnectsFilePath, 'utf8'));
    console.log('Existing data:', { 
      existingMarkersCount: existingMarkers.length, 
      existingInterconnectsCount: existingInterconnects.length 
    });

    // Create maps for quick lookup
    const existingMarkersMap = new Map(existingMarkers.map((m: any) => [m.Name, m]));
    const existingInterconnectsMap = new Map(existingInterconnects.map((ic: any) => [ic.Name, ic]));

    // Update or add new markers
    markers.forEach((marker: any) => {
      if (marker.Name) {  // Only update if marker has a name
        console.log('Updating marker:', marker.Name);
        existingMarkersMap.set(marker.Name, marker);
      }
    });

    // Update or add new interconnects
    interconnects.forEach((interconnect: any) => {
      if (interconnect.Name) {  // Only update if interconnect has a name
        console.log('Updating interconnect:', interconnect.Name);
        existingInterconnectsMap.set(interconnect.Name, interconnect);
      }
    });

    // Convert maps back to arrays
    const updatedMarkers = Array.from(existingMarkersMap.values());
    const updatedInterconnects = Array.from(existingInterconnectsMap.values());
    console.log('Updated data:', { 
      updatedMarkersCount: updatedMarkers.length, 
      updatedInterconnectsCount: updatedInterconnects.length 
    });

    // Write markers to SiteMarkers.json
    console.log('Writing markers to file...');
    await fs.writeFile(markersFilePath, JSON.stringify(updatedMarkers, null, 2), 'utf8');
    console.log('Markers file written successfully');

    // Write interconnects to InterConnectSegments.json
    console.log('Writing interconnects to file...');
    await fs.writeFile(interconnectsFilePath, JSON.stringify(updatedInterconnects, null, 2), 'utf8');
    console.log('Interconnects file written successfully');

    // Verify the files were written correctly
    const verifyMarkers = JSON.parse(await fs.readFile(markersFilePath, 'utf8'));
    const verifyInterconnects = JSON.parse(await fs.readFile(interconnectsFilePath, 'utf8'));
    console.log('Verification:', {
      markersFileSize: verifyMarkers.length,
      interconnectsFileSize: verifyInterconnects.length
    });

    // Return success response with updated data
    return NextResponse.json({ 
      message: 'Data saved successfully',
      markers: updatedMarkers,
      interconnects: updatedInterconnects
    }, { status: 200 });
  } catch (error) {
    // Log the error
    console.error('Error saving map data:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return error response
    return NextResponse.json({ 
      message: 'Error saving map data', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
