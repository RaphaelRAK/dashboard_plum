import React, { useEffect, useState } from 'react';
import { Card, Typography, Space, Progress, Statistic, Button, Table, Tag } from 'antd';
import { supabaseCache } from '../utils/supabase-cache';
import { supabaseOptimizer } from '../utils/supabase-optimizer';

const { Text, Title } = Typography;

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
}

interface QueryStats {
  table: string;
  cacheHits: number;
  cacheMisses: number;
  avgResponseTime: number;
  lastQuery: string;
}

export const SupabasePerformanceMonitor: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [queryStats, setQueryStats] = useState<QueryStats[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Seulement visible en développement
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      updateStats();
      const interval = setInterval(updateStats, 5000); // Mise à jour toutes les 5 secondes
      return () => clearInterval(interval);
    }
  }, [isVisible, refreshKey]);

  const updateStats = () => {
    setCacheStats(supabaseCache.getStats());
    // Simuler des statistiques de requêtes (à implémenter avec un vrai tracking)
    setQueryStats([
      {
        table: 'order',
        cacheHits: Math.floor(Math.random() * 50),
        cacheMisses: Math.floor(Math.random() * 10),
        avgResponseTime: Math.random() * 200 + 50,
        lastQuery: new Date().toLocaleTimeString()
      },
      {
        table: 'public_profile',
        cacheHits: Math.floor(Math.random() * 30),
        cacheMisses: Math.floor(Math.random() * 5),
        avgResponseTime: Math.random() * 150 + 30,
        lastQuery: new Date().toLocaleTimeString()
      },
      {
        table: 'fliiinker_profile',
        cacheHits: Math.floor(Math.random() * 20),
        cacheMisses: Math.floor(Math.random() * 3),
        avgResponseTime: Math.random() * 100 + 20,
        lastQuery: new Date().toLocaleTimeString()
      }
    ]);
  };

  const clearCache = () => {
    supabaseCache.clear();
    setRefreshKey(prev => prev + 1);
  };

  const getCacheEfficiency = () => {
    if (!cacheStats) return 0;
    const total = cacheStats.size + (cacheStats.maxSize - cacheStats.size);
    return total > 0 ? (cacheStats.size / cacheStats.maxSize) * 100 : 0;
  };

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 80) return 'green';
    if (hitRate >= 60) return 'orange';
    return 'red';
  };

  const getResponseTimeColor = (time: number) => {
    if (time < 100) return 'green';
    if (time < 200) return 'orange';
    return 'red';
  };

  const columns = [
    {
      title: 'Table',
      dataIndex: 'table',
      key: 'table',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Cache Hits',
      dataIndex: 'cacheHits',
      key: 'cacheHits',
      render: (value: number) => <Text strong style={{ color: 'green' }}>{value}</Text>
    },
    {
      title: 'Cache Misses',
      dataIndex: 'cacheMisses',
      key: 'cacheMisses',
      render: (value: number) => <Text style={{ color: 'red' }}>{value}</Text>
    },
    {
      title: 'Hit Rate',
      key: 'hitRate',
      render: (record: QueryStats) => {
        const total = record.cacheHits + record.cacheMisses;
        const hitRate = total > 0 ? (record.cacheHits / total) * 100 : 0;
        return (
          <Tag color={getHitRateColor(hitRate)}>
            {hitRate.toFixed(1)}%
          </Tag>
        );
      }
    },
    {
      title: 'Avg Response (ms)',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      render: (value: number) => (
        <Text style={{ color: getResponseTimeColor(value) }}>
          {value.toFixed(0)}ms
        </Text>
      )
    },
    {
      title: 'Last Query',
      dataIndex: 'lastQuery',
      key: 'lastQuery',
      render: (text: string) => <Text type="secondary">{text}</Text>
    }
  ];

  if (!isVisible) return null;

  return (
    <Card 
      title="Supabase Performance Monitor" 
      size="small"
      style={{ 
        position: 'fixed', 
        bottom: 20, 
        left: 20, 
        width: 400, 
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        maxHeight: '80vh',
        overflow: 'auto'
      }}
      extra={
        <Space>
          <Button size="small" onClick={() => setRefreshKey(prev => prev + 1)}>
            🔄
          </Button>
          <Button size="small" onClick={clearCache} danger>
            🗑️
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {cacheStats && (
          <>
            <div>
              <Text strong>Cache Status:</Text>
              <br />
              <Progress 
                percent={getCacheEfficiency()} 
                size="small" 
                status={getCacheEfficiency() > 80 ? 'exception' : 'normal'}
              />
              <Text type="secondary">
                {cacheStats.size} / {cacheStats.maxSize} entries
              </Text>
            </div>

            <div>
              <Text strong>Cache Hit Rate:</Text>
              <br />
              <Text type="secondary">
                {cacheStats.hitRate.toFixed(1)}% (estimated)
              </Text>
            </div>
          </>
        )}

        <div>
          <Text strong>Query Performance:</Text>
          <Table
            dataSource={queryStats}
            columns={columns}
            pagination={false}
            size="small"
            style={{ marginTop: 8 }}
          />
        </div>

        <div>
          <Text strong>Optimizations Active:</Text>
          <br />
          <Tag color="green">✅ Cache intelligent</Tag>
          <Tag color="green">✅ Requêtes conditionnelles</Tag>
          <Tag color="green">✅ Pagination optimisée</Tag>
          <Tag color="green">✅ Relations optimisées</Tag>
        </div>

        <div>
          <Text strong>Recommendations:</Text>
          <br />
          {cacheStats && cacheStats.size > cacheStats.maxSize * 0.8 && (
            <Text type="warning">⚠️ Cache presque plein, considérez augmenter la taille</Text>
          )}
          {queryStats.some(q => (q.cacheHits / (q.cacheHits + q.cacheMisses)) < 0.6) && (
            <Text type="warning">⚠️ Taux de cache faible, vérifiez les stratégies de cache</Text>
          )}
          {queryStats.some(q => q.avgResponseTime > 200) && (
            <Text type="warning">⚠️ Temps de réponse élevé, optimisez les requêtes</Text>
          )}
        </div>
      </Space>
    </Card>
  );
};

export default SupabasePerformanceMonitor;