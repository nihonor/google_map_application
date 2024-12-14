
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { markers, interconnects } = await request.json();

    // Paths to JSON files
    const markersFilePath = path.join(process.cwd(),'src' ,'data', 'SiteMarkers.json');
    const interconnectsFilePath = path.join(process.cwd(),'src', 'data', 'InterConnectSegments.json');
    // console.log(markers, interconnects)
    // Write markers file
    await fs.appendFile(markersFilePath, JSON.stringify(markers, null, 2), 'utf8');

    // Write interconnects file
    await fs.appendFile(interconnectsFilePath, JSON.stringify(interconnects, null, 2), 'utf8');

    // Return success response
    return NextResponse.json({ message: 'Data saved successfully' }, { status: 200 });
  } catch (error) {
    // Log the error
    console.error('Error saving map data:', error);

    // Return error response
    return NextResponse.json({ 
      message: 'Error saving map data', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Handle other HTTP methods
export function GET() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}

export function PUT() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}

export function DELETE() {
  return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
}