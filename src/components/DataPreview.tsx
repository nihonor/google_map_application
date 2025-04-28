import { SiteMarker } from '@/types';
import React, { useState } from 'react';

interface PopupDataViewProps {
  data: SiteMarker[];
  onClose: () => void;
}

const DataPreview: React.FC<PopupDataViewProps> = ({ data, onClose }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter markers based on search query
  const filteredMarkers = data.filter(marker => 
    marker.Name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80%',
      maxHeight: '85%',
      backgroundColor: 'white',
      padding: '0',
      border: '1px solid #ccc',
      borderRadius: '12px',
      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.2)',
      zIndex: 1000,
      overflow: 'hidden',
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* Header with tabs */}
      <div style={{
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>
          Site Markers ({data.length})
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search markers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              width: '200px'
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#666',
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* View options */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e9ecef' }}>
        <button
          onClick={() => setActiveTabIndex(0)}
          style={{
            padding: '12px 16px',
            background: activeTabIndex === 0 ? '#fff' : '#f8f9fa',
            border: 'none',
            borderBottom: activeTabIndex === 0 ? '2px solid #0d6efd' : '2px solid transparent',
            color: activeTabIndex === 0 ? '#0d6efd' : '#666',
            fontWeight: activeTabIndex === 0 ? '600' : 'normal',
            cursor: 'pointer',
            flex: '1',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          Card View
        </button>
        <button
          onClick={() => setActiveTabIndex(1)}
          style={{
            padding: '12px 16px',
            background: activeTabIndex === 1 ? '#fff' : '#f8f9fa',
            border: 'none',
            borderBottom: activeTabIndex === 1 ? '2px solid #0d6efd' : '2px solid transparent',
            color: activeTabIndex === 1 ? '#0d6efd' : '#666',
            fontWeight: activeTabIndex === 1 ? '600' : 'normal',
            cursor: 'pointer',
            flex: '1',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          Table View
        </button>
        <button
          onClick={() => setActiveTabIndex(2)}
          style={{
            padding: '12px 16px',
            background: activeTabIndex === 2 ? '#fff' : '#f8f9fa',
            border: 'none',
            borderBottom: activeTabIndex === 2 ? '2px solid #0d6efd' : '2px solid transparent',
            color: activeTabIndex === 2 ? '#0d6efd' : '#666',
            fontWeight: activeTabIndex === 2 ? '600' : 'normal',
            cursor: 'pointer',
            flex: '1',
            textAlign: 'center',
            fontSize: '14px',
          }}
        >
          Raw Data
        </button>
      </div>

      {/* Content container */}
      <div style={{ 
        padding: '20px', 
        overflowY: 'auto',
        maxHeight: 'calc(85vh - 118px)' // Adjust based on header height
      }}>
        {/* Display message if no data or no search results */}
        {filteredMarkers.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 0', 
            color: '#666'
          }}>
            {data.length === 0 ? 'No markers available' : 'No markers match your search'}
          </div>
        )}
        
        {/* Card View */}
        {activeTabIndex === 0 && filteredMarkers.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: '16px'
          }}>
            {filteredMarkers.map((marker, index) => (
              <div 
                key={index}
                style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ 
                  padding: '12px 16px',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '1px solid #e9ecef',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h4 style={{ 
                    margin: 0,
                    fontSize: '16px',
                    color: '#212529',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      backgroundColor: marker.iconColor || '#0d6efd',
                      borderRadius: '50%'
                    }}></span>
                    {marker.Name || `Marker ${index + 1}`}
                  </h4>
                  {marker.AlertStatus && (
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: marker.AlertStatus === '1' ? '#dc3545' : '#28a745',
                      color: 'white'
                    }}>
                      {marker.AlertStatus === '1' ? 'Alert' : 'Normal'}
                    </span>
                  )}
                </div>
                <div style={{ padding: '16px' }}>
                  {/* Location info */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                      Coordinates
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      padding: '6px 10px',
                      backgroundColor: '#f1f3f5',
                      borderRadius: '4px',
                      fontFamily: 'monospace'
                    }}>
                      {marker.LatLng || 'N/A'}
                    </div>
                  </div>
                  
                  {/* Additional details */}
                  {marker.tooltip && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                        Tooltip
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        {marker.tooltip.replace(/\\n/g, ' ')}
                      </div>
                    </div>
                  )}
                  
                  {/* Address if available */}
                  {marker.Address && (
                    <div>
                      <div style={{ fontSize: '13px', color: '#6c757d', marginBottom: '4px' }}>
                        Address
                      </div>
                      <div style={{ fontSize: '14px' }}>
                        {typeof marker.Address === 'string' && marker.Address.includes('Address') 
                          ? 'Complex Address Object' 
                          : marker.Address}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {activeTabIndex === 1 && filteredMarkers.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Coordinates</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Icon</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Update</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarkers.map((marker, index) => (
                  <tr key={index} style={{ 
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa'
                  }}>
                    <td style={{ padding: '12px 16px' }}>{marker.Name || `Marker ${index + 1}`}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{marker.LatLng || 'N/A'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {marker.AlertStatus ? (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: marker.AlertStatus === '1' ? '#dc3545' : '#28a745',
                          color: 'white'
                        }}>
                          {marker.AlertStatus === '1' ? 'Alert' : 'Normal'}
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>{marker.iconSVGfile || 'Default'}</td>
                    <td style={{ padding: '12px 16px' }}>{marker.Update || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Raw Data View */}
        {activeTabIndex === 2 && (
          <div style={{ 
            padding: '16px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            whiteSpace: 'pre-wrap',
            overflowX: 'auto'
          }}>
            {JSON.stringify(filteredMarkers, null, 2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPreview;