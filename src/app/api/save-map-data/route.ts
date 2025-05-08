import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { markers, interconnects } = await request.json();
    console.log('Received data:', { markers, interconnects });

    if (!markers || !interconnects) {
      throw new Error('Invalid data: markers and interconnects are required');
    }

    // Paths to JSON files
    const markersFilePath = path.join(process.cwd(), 'src', 'data', 'SiteMarkers.json');
    const interconnectsFilePath = path.join(process.cwd(), 'src', 'data', 'InterConnectSegments.json');

    // Load previous markers to detect renames
    let previousMarkers = [];
    try {
      previousMarkers = JSON.parse(await fs.readFile(markersFilePath, 'utf8'));
    } catch (e) {
      // If file doesn't exist or can't be read, treat as empty
      previousMarkers = [];
    }

    // Build a map of oldName -> newName for renamed markers
    const oldToNewNameMap = new Map();
    previousMarkers.forEach((oldMarker:any) => {
      // Try to find a marker with the same LatLng (or other unique property)
      const newMarker = markers.find((m:any) => m.LatLng === oldMarker.LatLng && m.Name !== oldMarker.Name);
      if (newMarker) {
        oldToNewNameMap.set(oldMarker.Name, newMarker.Name);
      }
    });

    // Update all interconnectors' Source and Target fields if the marker was renamed
    const updatedInterconnects = interconnects.map((ic:any) => {
      let newSource = ic.Source;
      let newTarget = ic.Target;
      if (oldToNewNameMap.has(ic.Source)) {
        newSource = oldToNewNameMap.get(ic.Source);
      }
      if (oldToNewNameMap.has(ic.Target)) {
        newTarget = oldToNewNameMap.get(ic.Target);
      }
      return {
        ...ic,
        Source: newSource,
        Target: newTarget,
        Update: "1"
      };
    });

    // Prepare the data for saving
    const finalMarkers = markers.map((marker:any) => ({
      ...marker,
      Update: "1" // Always set Update to "1" for saved markers
    }));

    // Write the files
    try {
      // Write markers
      await fs.writeFile(
        markersFilePath,
        JSON.stringify(finalMarkers, null, 2),
        { encoding: 'utf8', flag: 'w' }
      );

      // Write interconnects
      await fs.writeFile(
        interconnectsFilePath,
        JSON.stringify(updatedInterconnects, null, 2),
        { encoding: 'utf8', flag: 'w' }
      );

      // Verify the writes
      const verifyMarkers = JSON.parse(await fs.readFile(markersFilePath, 'utf8'));
      const verifyInterconnects = JSON.parse(await fs.readFile(interconnectsFilePath, 'utf8'));

      if (verifyMarkers.length !== finalMarkers.length || 
          verifyInterconnects.length !== updatedInterconnects.length) {
        throw new Error('Verification failed: File content mismatch after save');
      }

      console.log('Files written and verified successfully');

      return NextResponse.json({
        message: 'Data saved successfully',
        markers: finalMarkers,
        interconnects: updatedInterconnects
      }, { status: 200 });

    } catch (writeError) {
      console.error('Error writing files:', writeError);
      throw writeError;
    }

  } catch (error) {
    console.error('Error in save operation:', error);
    return NextResponse.json({
      message: 'Failed to save data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}