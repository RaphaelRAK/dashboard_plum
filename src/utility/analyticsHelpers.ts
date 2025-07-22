import { ArchiveSearchResult } from "../types/searchAnalytics";
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(weekOfYear);

type PeriodType = 'hour' | 'day' | 'week' | 'month';

interface AggregatedData {
  period: string;
  count: number;
}

export const aggregateSearchData = (
  data: ArchiveSearchResult[],
  periodType: PeriodType
): AggregatedData[] => {
  const groupedData = data.reduce((acc: { [key: string]: number }, item) => {
    let period: string;
    const date = dayjs(item.created_at);

    switch (periodType) {
      case 'hour':
        period = date.format('HH:00');
        break;
      case 'day':
        period = date.format('DD MMM');
        break;
      case 'week':
        period = `Sem ${date.week()}`;
        break;
      case 'month':
        period = date.format('MMM YYYY');
        break;
    }

    acc[period] = (acc[period] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(groupedData)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));
};