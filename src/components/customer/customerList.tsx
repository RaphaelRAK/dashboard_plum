import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Table, Tag, Space, Button, Input } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { DeleteButton } from '@refinedev/antd';
import { Public_profile } from '../../types/public_profileTypes';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { debounce } from 'lodash';

interface CustomerTableProps {
  onView: (profile: Public_profile) => void;
}

const supabase_url_storage_images = import.meta.env.VITE_SUPABASE_STORAGE_URL_FOR_IMAGES;
const cloudflare_storage_url_for_images = import.meta.env.VITE_CLOUDFLARE_STORAGE_URL_FOR_IMAGES;

export const CustomerTable: React.FC<CustomerTableProps> = ({ onView }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Utiliser le selector Redux pour accéder aux données
  const profiles = useSelector((state: RootState) => state.publicProfiles.profiles);
  const loading = useSelector((state: RootState) => state.publicProfiles.loading);

  // Mémoriser les données filtrées
  const filteredData = useMemo(() => {
    console.log("🔍 [CustomerTable] Profils disponibles:", Object.values(profiles).length);
    // Pas besoin de filtrer par is_fliiinker car les données viennent déjà filtrées du service
    return Object.values(profiles)
      .filter(profile => {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
  }, [profiles, searchTerm]);

  // Debounce la fonction de recherche
  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
  }, 300);

  useEffect(() => {
    console.log('🔍 [CustomerTable] Profils filtrés:', filteredData.length);
  }, [filteredData]);

  return (
    <div>
      <Input
        placeholder="Search by name or surname"
        onChange={(e) => debouncedSearch(e.target.value)}
        style={{ marginBottom: '20px', width: '300px' }}
      />
      <Table<Public_profile>
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Total ${total} items`,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ["10", "12", "20", "50", "100"],
        }}
      >
        <Table.Column<Public_profile>
          title="Avatar"
          key="avatar"
          render={(_, record) => {
            console.log('URL de l\'avatar:', {
              cloudflare_url: cloudflare_storage_url_for_images,
              avatar_path: record.avatar,
              full_url: `${cloudflare_storage_url_for_images}/${record.avatar}`
            });

            return record.avatar ? (
              <img
                src={`${cloudflare_storage_url_for_images}/${record.avatar}`}
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
            );
          }}
        />
        <Table.Column<Public_profile>
          title="Name"
          key="name"
          
          render={(_, record) => {
            //console.log(record); // Affiche le contenu de record dans la console
            return `${record.last_name || 'tsy aikoo'} ${record.first_name || 'Unknown'}`;
          }}
        />
        <Table.Column<Public_profile>
          title="Email"
          key="email"
          dataIndex="email"
        />
        
        <Table.Column<Public_profile>
          title="Phone"
          key="phone"
          render = {(public_profile) => public_profile?.phone}

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
