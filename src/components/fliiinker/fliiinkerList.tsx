import React, { useState, useCallback } from 'react';
import { Table, Tag, Space, Button, Input } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { DeleteButton } from '@refinedev/antd';
import { debounce } from 'lodash';
import { Public_profile } from '../../types/public_profileTypes';
import { searchFliiinkers } from '../../services/fliiinker/fliiinkerApi';
import { FliiinkerProfile } from '../../types/fliiinkerProfileTypes';

interface FliiinkerTableProps {
  data: Public_profile[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (pagination: any) => void;
    showTotal: (total: number) => string;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    pageSizeOptions?: string[];
  };
  onView: (profile: Public_profile) => void;
}

const supabase_url_storage_images = import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES;

export const FliiinkerTable: React.FC<FliiinkerTableProps> = ({ 
  data, 
  loading,
  pagination,
  onView 
}) => {
  const [searchResults, setSearchResults] = useState<Public_profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchActive, setSearchActive] = useState(false);

  const debouncedSearch = useCallback(
    debounce(async (value: string) => {
      if (!value.trim()) {
        setSearchResults([]);
        setSearchActive(false);
        return;
      }
      
      setIsSearching(true);
      try {
        const { data: results } = await searchFliiinkers(value);
        setSearchResults(results);
        setSearchActive(true);
      } catch (error) {
        console.error('❌ Erreur lors de la recherche:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  return (
    <div>
      <Input
        placeholder="Rechercher par nom, prénom, email ou téléphone"
        onChange={(e) => debouncedSearch(e.target.value)}
        style={{ marginBottom: '20px', width: '300px' }}
      />
      <Table<Public_profile>
        dataSource={searchActive ? searchResults : data}
        rowKey="id"
        loading={loading || isSearching}
        pagination={pagination}
      >
        <Table.Column<Public_profile>
          title="Avatar"
          dataIndex="avatar"
          key="avatar"
          render={(avatar) =>
            avatar ? (
              <img
                src={`${supabase_url_storage_images}/${avatar}`}
                alt="Avatar"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <Tag>No Avatar</Tag>
            )
          }
        />
        <Table.Column<Public_profile>
          title="Name"
          key="name"
          render={(_, record) => {
            return `${record.last_name || 'Unknown'} ${record.first_name || ''}`;
          }}
        />
        <Table.Column<Public_profile>
          title="Email"
          dataIndex="email"
          key="email"
          render={(email) => email || 'N/A'}
        />
        <Table.Column<Public_profile>
          title="Phone"
          dataIndex="phone"
          key="phone"
          render={(phone) => phone || 'N/A'}
        />
        <Table.Column<Public_profile>
          title="Date de naissance"
          dataIndex="birthday"
          key="birthday"
          render={(birthday) => birthday || 'None'}
        />
        <Table.Column<FliiinkerProfile>
          title="Status"
          dataIndex={['fliiinker_profile', 'status']} 
          key="status"
          render={(status) => status || 'None'} 
        />
        <Table.Column<FliiinkerProfile>
          title="Langues parlées"
          dataIndex={['fliiinker_profile', 'spoken_languages']} 
          key="spoken_languages"
          render={(spoken_languages) => {
            if (!spoken_languages) return 'None';
            return spoken_languages.map((lang: any) => 
              typeof lang === 'object' ? lang.name || 'Langue' : lang
            ).join(', ');
          }}
        />

        <Table.Column<Public_profile>
          title="Actions"
          key="actions"
          render={(_, record) => (
            <Space>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => onView(record)}
              />
              <DeleteButton size="small" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </div>
  );
};