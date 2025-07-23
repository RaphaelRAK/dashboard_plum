import React from 'react';
import { Card, Empty } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

interface MapFallbackProps {
  width?: number | string;
  height?: number | string;
  message?: string;
  style?: React.CSSProperties;
}

const MapFallback: React.FC<MapFallbackProps> = ({ 
  width = '100%', 
  height = 400, 
  message = "Carte temporairement indisponible",
  style = {}
}) => {
  return (
    <Card 
      style={{ 
        width, 
        height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        ...style 
      }}
    >
      <Empty
        image={<EnvironmentOutlined style={{ fontSize: '48px', color: '#1890ff' }} />}
        description={
          <div>
            <div style={{ marginBottom: '8px' }}>{message}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Les composants de cartographie sont en cours de mise à jour
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default MapFallback; 