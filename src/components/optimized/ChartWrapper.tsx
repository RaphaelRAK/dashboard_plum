import React, { Suspense, lazy } from 'react';
import { Spin, Alert } from 'antd';

// Lazy load chart components
const PlotlyChart = lazy(() => import('react-plotly.js'));
const AntVChart = lazy(() => import('@ant-design/charts').then(module => ({ default: module.Line })));

interface ChartWrapperProps {
  type: 'plotly' | 'antv';
  data: any;
  layout?: any;
  config?: any;
  style?: React.CSSProperties;
  loading?: boolean;
  error?: string;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  type,
  data,
  layout,
  config,
  style,
  loading = false,
  error
}) => {
  if (error) {
    return (
      <Alert
        message="Chart Error"
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
        height: 200,
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
      height: 200,
      ...style 
    }}>
      <Spin />
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      {type === 'plotly' && (
        <PlotlyChart
          data={data}
          layout={layout}
          config={config}
          style={style}
          useResizeHandler={true}
        />
      )}
      {type === 'antv' && (
        <AntVChart
          data={data}
          {...layout}
          {...config}
          style={style}
        />
      )}
    </Suspense>
  );
};

export default ChartWrapper;