import React, { Suspense, lazy } from 'react';
import { Spin, Alert } from 'antd';

// Lazy load map components
const LeafletMap = lazy(() => import('react-leaflet').then(module => ({ default: module.MapContainer })));
const GlobeMap = lazy(() => 
  import('react-globe.gl').catch(() => {
    // Fallback if react-globe.gl fails to load
    return Promise.resolve({
      default: () => (
        <div style={{ 
          width: '100%', 
          height: 400, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌍</div>
            <div>Globe non disponible</div>
          </div>
        </div>
      )
    });
  })
);

interface MapWrapperProps {
  type: 'leaflet' | 'globe';
  center?: [number, number];
  zoom?: number;
  data?: any[];
  style?: React.CSSProperties;
  loading?: boolean;
  error?: string;
  children?: React.ReactNode;
}

const MapWrapper: React.FC<MapWrapperProps> = ({
  type,
  center = [0, 0],
  zoom = 2,
  data = [],
  style,
  loading = false,
  error,
  children
}) => {
  if (error) {
    return (
      <Alert
        message="Map Error"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400,
        ...style 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  const fallback = (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: 400,
      ...style 
    }}>
      <Spin />
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      {type === 'leaflet' && (
        <LeafletMap
          center={center}
          zoom={zoom}
          style={style}
        >
          {children}
        </LeafletMap>
      )}
      {type === 'globe' && (
        <GlobeMap
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          pointsData={data}
          pointColor="color"
          pointAltitude="alt"
          pointRadius="radius"
        />
      )}
    </Suspense>
  );
};

export default MapWrapper;