import React from 'react';
import { Card, Select, Space } from 'antd';
import { Column } from '@ant-design/plots';
import { ArchiveSearchResult } from '../../types/searchAnalytics';
import { aggregateSearchData } from '../../utility/analyticsHelpers';

const { Option } = Select;

interface SearchHistogramProps {
  data: ArchiveSearchResult[];
  periodType: 'hour' | 'day' | 'week' | 'month';
  onPeriodChange: (period: 'hour' | 'day' | 'week' | 'month') => void;
}

export const SearchHistogram: React.FC<SearchHistogramProps> = ({
  data,
  periodType,
  onPeriodChange
}) => {
  const aggregatedData = aggregateSearchData(data, periodType);

  const getAxisLabel = () => {
    switch (periodType) {
      case 'hour':
        return 'Heures';
      case 'day':
        return 'Jours';
      case 'week':
        return 'Semaines';
      case 'month':
        return 'Mois';
      default:
        return 'Période';
    }
  };

  const config = {
    data: aggregatedData,
    xField: 'period',
    yField: 'count',
    label: {
      position: 'top',
      style: {
        fill: '#000000',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoRotate: true,
        autoHide: false,
        autoEllipsis: true,
      },
      title: {
        text: getAxisLabel(),
      },
    },
    yAxis: {
      title: {
        text: 'Nombre de recherches',
      },
      tickCount: 5,
      min: 0,
    },
    meta: {
      period: { alias: getAxisLabel() },
      count: { alias: 'Nombre de recherches' },
    },
  };

  return (
    <Card title="Histogramme des recherches">
      <Space direction="vertical" style={{ width: '100%' }}>
        <Select
          value={periodType}
          onChange={onPeriodChange}
          style={{ width: 200, marginBottom: 16 }}
        >
          <Option value="hour">Par heure</Option>
          <Option value="day">Par jour</Option>
          <Option value="week">Par semaine</Option>
          <Option value="month">Par mois</Option>
        </Select>
        <Column {...config} />
      </Space>
    </Card>
  );
};