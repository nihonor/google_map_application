import { SiteMarker } from '@/types';
import React from 'react';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';


interface Popup_JsonObjectProps {
  data: SiteMarker[];
  onClose: () => void; 
}

const Popup_JsonObject: React.FC<Popup_JsonObjectProps> = ({ data, onClose }) => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: '10%', 
      left: '10%', 
      width: '40%', 
      height: '40%', 
      backgroundColor: 'white', 
      padding: '20px', 
      border: '1px solid #ccc', 
      borderRadius: '12px', 
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', 
      zIndex: 1000, 
      overflow: 'auto',
      fontFamily: 'Arial, sans-serif',
    }}>
      <h3 style={{ marginBottom: '16px', color: '#333' }}>JSON Preview</h3>
      <JsonView data={data} />
      <button 
        onClick={onClose}
        style={{
          marginTop: '20px', 
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
  );
};

export default Popup_JsonObject;