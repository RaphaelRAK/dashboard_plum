import React, { useEffect, useState } from "react";
import { Card, Typography, Space, Progress, Statistic } from "antd";
import { getBundleSize, getMemoryUsage } from "../utils/performance";

const { Text, Title } = Typography;

interface PerformanceMetrics {
  loadTime?: number;
  domContentLoaded?: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === "development") {
      setIsVisible(true);
    }

    const updateMetrics = () => {
      const bundleMetrics = getBundleSize();
      const memoryMetrics = getMemoryUsage();

      setMetrics({
        ...bundleMetrics,
        memoryUsage: memoryMetrics || undefined,
      });
    };

    // Update metrics after page load
    if (document.readyState === "complete") {
      updateMetrics();
    } else {
      window.addEventListener("load", updateMetrics);
      return () => window.removeEventListener("load", updateMetrics);
    }
  }, []);

  if (!isVisible) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (ms: number) => {
    return `${ms.toFixed(2)}ms`;
  };

  const getMemoryPercentage = () => {
    if (!metrics.memoryUsage) return 0;
    return (
      (metrics.memoryUsage.usedJSHeapSize /
        metrics.memoryUsage.jsHeapSizeLimit) *
      100
    );
  };

  return (
    <Card
      title="Performance Monitor"
      size="small"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 300,
        zIndex: 1000,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        {metrics.loadTime && (
          <div>
            <Text strong>Page Load Time:</Text>
            <br />
            <Text type="secondary">{formatTime(metrics.loadTime)}</Text>
          </div>
        )}

        {metrics.domContentLoaded && (
          <div>
            <Text strong>DOM Content Loaded:</Text>
            <br />
            <Text type="secondary">{formatTime(metrics.domContentLoaded)}</Text>
          </div>
        )}

        {metrics.firstPaint && (
          <div>
            <Text strong>First Paint:</Text>
            <br />
            <Text type="secondary">{formatTime(metrics.firstPaint)}</Text>
          </div>
        )}

        {metrics.firstContentfulPaint && (
          <div>
            <Text strong>First Contentful Paint:</Text>
            <br />
            <Text type="secondary">
              {formatTime(metrics.firstContentfulPaint)}
            </Text>
          </div>
        )}

        {metrics.memoryUsage && (
          <div>
            <Text strong>Memory Usage:</Text>
            <br />
            <Progress
              percent={getMemoryPercentage()}
              size="small"
              status={getMemoryPercentage() > 80 ? "exception" : "normal"}
            />
            <Text type="secondary">
              {formatBytes(metrics.memoryUsage.usedJSHeapSize)} /{" "}
              {formatBytes(metrics.memoryUsage.jsHeapSizeLimit)}
            </Text>
          </div>
        )}

        <div>
          <Text strong>Bundle Info:</Text>
          <br />
          <Text type="secondary">
            {document.querySelectorAll('script[src*=".js"]').length} JS files
            loaded
          </Text>
          <br />
          <Text type="secondary">
            {document.querySelectorAll('link[rel="stylesheet"]').length} CSS
            files loaded
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default PerformanceMonitor;
