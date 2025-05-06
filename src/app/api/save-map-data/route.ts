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
    const existingMarkersMap = new Map();
    const existingInterconnectsMap = new Map(
      existingInterconnects.map((ic: any) => [`${ic.Source}__${ic.Target}`, ic])
    );

    // Update or add new markers
    markers.forEach((marker: any) => {
      if (marker.Name) {
        existingMarkersMap.set(marker.Name, marker);
      }
    });

    // Update or add new interconnects
    interconnects.forEach((interconnect: any) => {
      if (interconnect.Source && interconnect.Target) {
        existingInterconnectsMap.set(`${interconnect.Source}__${interconnect.Target}`, interconnect);
      }
    });

    // Convert maps back to arrays
    const finalMarkers = Array.from(existingMarkersMap.values());
    const finalInterconnects = Array.from(existingInterconnectsMap.values());

    console.log('Final data:', { 
      markersCount: finalMarkers.length, 
      interconnectsCount: finalInterconnects.length 
    });

    // Write markers to SiteMarkers.json
    console.log('Writing markers to file...');
    await fs.writeFile(markersFilePath, JSON.stringify(finalMarkers, null, 2), 'utf8');
    console.log('Markers file written successfully');

    // Write interconnects to InterConnectSegments.json
    console.log('Writing interconnects to file...');
    await fs.writeFile(interconnectsFilePath, JSON.stringify(finalInterconnects, null, 2), 'utf8');
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
      markers: finalMarkers,
      interconnects: finalInterconnects
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
