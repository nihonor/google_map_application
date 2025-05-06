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
    
    // Create backup of existing files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const markersBackupPath = `${markersFilePath}.${timestamp}.bak`;
    const interconnectsBackupPath = `${interconnectsFilePath}.${timestamp}.bak`;
    
    try {
      await fs.copyFile(markersFilePath, markersBackupPath);
      await fs.copyFile(interconnectsFilePath, interconnectsBackupPath);
      console.log('Created backup files:', { markersBackupPath, interconnectsBackupPath });
    } catch (backupError) {
      console.warn('Failed to create backup files:', backupError);
    }

    // Prepare the data for saving
    const finalMarkers = markers.map((marker: any) => ({
      ...marker,
      Update: "1"
    }));

    const finalInterconnects = interconnects.map((interconnect: any) => ({
      ...interconnect,
      Update: "1"
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
        JSON.stringify(finalInterconnects, null, 2),
        { encoding: 'utf8', flag: 'w' }
      );

      // Verify the writes
      const verifyMarkers = JSON.parse(await fs.readFile(markersFilePath, 'utf8'));
      const verifyInterconnects = JSON.parse(await fs.readFile(interconnectsFilePath, 'utf8'));

      if (verifyMarkers.length !== finalMarkers.length || 
          verifyInterconnects.length !== finalInterconnects.length) {
        throw new Error('Verification failed: File content mismatch after save');
      }

      console.log('Files written and verified successfully');

      return NextResponse.json({
        message: 'Data saved successfully',
        markers: finalMarkers,
        interconnects: finalInterconnects
      }, { status: 200 });

    } catch (writeError) {
      console.error('Error writing files:', writeError);
      
      // Try to restore from backup if write failed
      try {
        await fs.copyFile(markersBackupPath, markersFilePath);
        await fs.copyFile(interconnectsBackupPath, interconnectsFilePath);
        console.log('Restored from backup files after write failure');
      } catch (restoreError) {
        console.error('Failed to restore from backup:', restoreError);
      }

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
