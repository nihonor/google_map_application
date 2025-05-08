const fs = require('fs');

const markers = JSON.parse(fs.readFileSync('./src/data/SiteMarkers.json', 'utf8'));
const interconnects = JSON.parse(fs.readFileSync('./src/data/InterConnectSegments.json', 'utf8'));

// Build a map of oldName -> newName (if you have a way to track renames, otherwise just use current names)
const markerNames = new Set(markers.map(m => m.Name));

// For each interconnector, update Name, Source, Target if needed
const updatedInterconnects = interconnects.map(ic => {
  // If the Name is not in markerNames, try to find the closest match (manual step may be needed)
  let newName = ic.Name;
  if (!markerNames.has(ic.Name)) {
    // Try to find a marker whose name includes the old name (simple heuristic)
    const found = markers.find(m => m.Name.includes(ic.Name));
    if (found) newName = found.Name;
  }
  // If you have Source/Target fields, update them similarly
  // Example:
  // let newSource = ic.Source;
  // if (ic.Source && !markerNames.has(ic.Source)) {
  //   const found = markers.find(m => m.Name.includes(ic.Source));
  //   if (found) newSource = found.Name;
  // }
  // let newTarget = ic.Target;
  // if (ic.Target && !markerNames.has(ic.Target)) {
  //   const found = markers.find(m => m.Name.includes(ic.Target));
  //   if (found) newTarget = found.Name;
  // }
  return {
    ...ic,
    Name: newName,
    // Source: newSource,
    // Target: newTarget,
  };
});

fs.writeFileSync('./src/data/InterConnectSegments.json', JSON.stringify(updatedInterconnects, null, 2));
console.log('InterConnectSegments.json updated!');