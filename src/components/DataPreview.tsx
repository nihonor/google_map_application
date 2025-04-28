import { SiteMarker } from '@/types';
import React from 'react';

interface PopupDataViewProps {
  data: SiteMarker[];
  onClose: () => void;
}

const DataPreview: React.FC<PopupDataViewProps> = ({ data, onClose }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '70%',
      maxHeight: '80%',
      backgroundColor: 'white',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      overflow: 'auto',
      fontFamily: 'Arial, sans-serif',
    }}>
      <header style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #eee',
        paddingBottom: '12px',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>Site Markers</h3>
        <span style={{ 
          color: '#666', 
          fontSize: '14px' 
        }}>
          {data.length} {data.length === 1 ? 'item' : 'items'}
        </span>
      </header>

      <div style={{ marginBottom: '20px' }}>
        {data.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>
            No site markers available
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.map((marker, index) => (
              <div 
                key={index}
                style={{
                  padding: '16px',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#444',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    backgroundColor: '#007bff',
                    borderRadius: '50%'
                  }}></span>
                  {marker.Name || `Marker ${index + 1}`}
                </h4>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '120px 1fr',
                  gap: '6px',
                  fontSize: '14px',
                  color: '#555'
                }}>   
                  
                  {Object.entries(marker).map(([key, value]) => {
                    if (['name', 'lat', 'lng', 'description', 'category', 'color'].includes(key) || 
                        typeof value === 'object') {
                      return null;
                    }
                    return (
                      <React.Fragment key={key}>
                        <div style={{ textTransform: 'capitalize' }}>{key}:</div>
                        <div style={{ fontWeight: '500' }}>{String(value)}</div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'background-color 0.3s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DataPreview;