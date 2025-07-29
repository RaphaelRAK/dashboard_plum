// src/pages/FliiinkerList.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { List } from '@refinedev/antd';
import { Drawer, Spin, TablePaginationConfig, message } from 'antd';
import '../../styles/FliiinkerList.css';
import { FliiinkerTable } from '../../components/fliiinker/fliiinkerList';
import { FliiinkerDetails } from '../../components/fliiinker/fliiinkerDetails';
import { fetchPaginatedFliiinkers } from '../../services/fliiinker/fliiinkerApi';
import { Public_profile } from '../../types/public_profileTypes';

export const FliiinkerLists: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fliiinkers, setFliiinkers] = useState<Public_profile[]>([]);
  const [selectedFliiinker, setSelectedFliiinker] = useState<Public_profile | null>(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const loadFliiinkers = useCallback(async (page: number, size: number) => {
    setLoading(true);
    try {
      const { data, total } = await fetchPaginatedFliiinkers(page, size);
      console.log('📊 Données reçues:', { page, size, dataLength: data.length, total });
      setFliiinkers(data);
      setTotal(total);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des Fliiinkers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('🔄 Chargement page:', currentPage, 'taille:', pageSize);
    loadFliiinkers(currentPage, pageSize);
  }, [currentPage, pageSize, loadFliiinkers]);

  const handleTableChange = useCallback((pagination: TablePaginationConfig) => {
    console.log('📑 Changement pagination:', pagination);
    if (pagination.current) {
      setCurrentPage(pagination.current);
    }
    if (pagination.pageSize && pagination.pageSize !== pageSize) {
      setPageSize(pagination.pageSize);
      setCurrentPage(1);
    }
  }, [pageSize]);

  const handleViewFliiinker = (fliiinker: Public_profile) => {
    setSelectedFliiinker(fliiinker);
    setIsDrawerVisible(true);
  };

  return (
    <>
      <List title="Plümers">
        <FliiinkerTable 
          data={fliiinkers}
          loading={loading}
          onView={handleViewFliiinker}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (page: number, pageSize?: number) => {
              handleTableChange({ current: page, pageSize: pageSize || 10 });
            },
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total: number) => `Total ${total} Fliiinkers`
          }}
        />
      </List>

      <Drawer
        title="Détails du Fliiinker"
        placement="right"
        width={500}
        onClose={() => setIsDrawerVisible(false)}
        open={isDrawerVisible}
      >
        {selectedFliiinker && (
          <FliiinkerDetails
            publicProfile={selectedFliiinker}
            fliiinkerProfile={selectedFliiinker.fliiinker_profile || null}
            onClose={() => setIsDrawerVisible(false)}
          />
        )}
      </Drawer>
    </>
  );
};
