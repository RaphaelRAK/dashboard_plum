import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, Spin, Typography, Row, Col, Input, Select, Checkbox, Modal, Pagination } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { ImageCarousel } from '../../components/phototeque/photoComponent';
import { FliiinkerDetails } from '../../components/fliiinker/fliiinkerDetails';
import '../../styles/gallery.css';

import { FliiinkerProfile } from '../../types/fliiinkerProfileTypes';
import { Public_profile } from '../../types/public_profileTypes';
import { fetchFliiinkerProfileById } from '../../services/fliiinker/fliiinkerApi';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { debounce } from 'lodash';

// Importer notre nouveau service d'images simplifié
import {
  getAllFolders,
  getImagesByFolder,
  getPaginatedImages,
  getAllImages,
  getPaginatedFolders,
  type CloudflareImage
} from '../../services/phototeque/simplifiedImageService';

const { Title } = Typography;
const { Option } = Select;

export const GalleryPage: React.FC = () => {
  const [loadedImages, setLoadedImages] = useState<{ [key: number]: CloudflareImage[] }>({});
  const [loading, setLoading] = useState(false);
  const [imageStatuses, setImageStatuses] = useState<{ [key: string]: { verified: boolean; compliant: boolean; comment: string } }>({});
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [isFliiinkerDetailsVisible, setIsFliiinkerDetailsVisible] = useState(false);
  const [fliiinkerProfile, setFliiinkerProfile] = useState<FliiinkerProfile | null>(null);
  const [totalImages, setTotalImages] = useState<number>(0); // Pour stocker le nombre total d'images
  const [totalFolders, setTotalFolders] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [searchResults, setSearchResults] = useState<any[]>([]); // État pour stocker les résultats de recherche

  const defaultPublicProfile: Public_profile = {
    id: '', // ou un ID par défaut
    created_at: '',
    updated_at: '', // Ajouter updated_at
    email: '',
    gender: 'other',
    fliiinker_profile: fliiinkerProfile,
  };

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(21); // Valeur par défaut

  const dispatch = useAppDispatch();

  const loadImagesForPage = useCallback(async (page: number, size: number) => {
    if (loadedImages[page]) return;

    setLoading(true);
    try {
      // Utiliser notre nouvelle fonction simplifiée
      const { data: images, total, hasMore } = await getPaginatedImages(page, size);
      
      console.log(`👁️ Chargé ${images.length} images sur un total de ${total}`);
      
      setLoadedImages(prev => ({ ...prev, [page]: images }));
      setTotalImages(total);
      setHasMore(hasMore);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des images:', error);
    } finally {
      setLoading(false);
    }
  }, [loadedImages]);

  useEffect(() => {
    loadImagesForPage(currentPage, pageSize);
  }, [currentPage, pageSize, loadImagesForPage]);

  // Filtrage des images en fonction des critères
  const filteredImages = useMemo(() => {
    const images = loadedImages[currentPage] || [];
    return images.filter(image => {
      const isVerified = verifiedFilter === null || (verifiedFilter ? imageStatuses[image.name]?.verified : !imageStatuses[image.name]?.verified);
      const matchesSearchTerm = (image.folderPath && image.folderPath.toLowerCase().includes(searchTerm.toLowerCase())) || 
                              image.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return isVerified && matchesSearchTerm;
    });
  }, [loadedImages, currentPage, imageStatuses, verifiedFilter, searchTerm, countryFilter]);

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) {
      setPageSize(size);
    }
  };

  const handleOpenFliiinkerDetails = async (folderName: string) => {
    const profile = await fetchFliiinkerProfileById(folderName);
    setFliiinkerProfile(profile);
    setIsFliiinkerDetailsVisible(true);
  };

  const handleSearch = async (term: string) => {
    if (term.trim() === '') {
      setSearchResults([]);
      return;
    }

    try {
      // Récupérer toutes les images et filtrer par le terme de recherche
      const allImages = await getAllImages();
      const filteredImages = allImages.filter(image => 
        (image.folderPath && image.folderPath.toLowerCase().includes(term.toLowerCase())) || 
        image.name.toLowerCase().includes(term.toLowerCase())
      );

      // Regrouper les images par dossier pour l'affichage
      const groupedByFolder = filteredImages.reduce((acc, image) => {
        const folder = image.folderPath || 'Sans dossier';
        if (!acc[folder]) {
          acc[folder] = [];
        }
        acc[folder].push(image);
        return acc;
      }, {} as Record<string, CloudflareImage[]>);

      // Transformer en format attendu par le composant
      const results = Object.entries(groupedByFolder).map(([folderPath, images]) => ({
        folderPath,
        images
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error);
    }
  };

  // Créer une fonction debounced pour la recherche
  const debouncedSearch = useCallback(debounce(handleSearch, 300), []); // 300 ms de délai

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value); // Appeler la fonction de recherche debounced
  };

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Galerie d'images</Title>
      <Input
        placeholder="Rechercher par nom du dossier ou de l'image"
        value={searchTerm}
        onChange={handleInputChange}
        style={{ margin: '16px', width: '20%' }}
      />
      <Select
        placeholder="Filtrer par pays"
        onChange={value => setCountryFilter(value)}
        style={{ width: 200, marginBottom: '16px', marginRight: '16px' }}
        allowClear
      >
        <Option value="France">France</Option>
        <Option value="La Réunion">La Réunion</Option>
        <Option value="Maurice">Maurice</Option>
      </Select>
      <Checkbox
        checked={verifiedFilter === true}
        onChange={e => setVerifiedFilter(e.target.checked ? true : null)}
        style={{ marginRight: '8px' }}
      >
        Vérifié
      </Checkbox>
      <Checkbox
        checked={verifiedFilter === false}
        onChange={e => setVerifiedFilter(e.target.checked ? false : null)}
      >
        Non vérifié
      </Checkbox>

      <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '20px' }}>
        {filteredImages.map((image) => (
          <ImageCarousel
            key={`${image.folderPath || 'no-folder'}-${image.name}`}
            images={[image]}
            bucketName="avatars"
            folderPath={image.folderPath || ''}
            imageStatuses={imageStatuses}
            setImageStatuses={setImageStatuses}
            onOpenFliiinkerDetails={handleOpenFliiinkerDetails}
          />
        ))}
      </div>

      {/* Composant de pagination */}
      {searchResults.length === 0 && (
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalImages} // Utiliser le nombre total d'images 
          onChange={handlePageChange}
          showSizeChanger
          pageSizeOptions={['14', '21', '56', '98']}
          showTotal={(total, range) => `${range[0]}-${range[1]} sur ${total} images`}
          />
        </div>
      )}

      {isFliiinkerDetailsVisible && fliiinkerProfile && (
        <Modal
          open={isFliiinkerDetailsVisible}
          onCancel={() => setIsFliiinkerDetailsVisible(false)}
          footer={null}
          width={800}
        >
          <FliiinkerDetails 
            publicProfile={fliiinkerProfile.public_profile ?? defaultPublicProfile}
            fliiinkerProfile={fliiinkerProfile}
            onClose={() => setIsFliiinkerDetailsVisible(false)}
          />
        </Modal>
      )}

      {/* Afficher les résultats de recherche */}
      <div>
        {searchResults.map(folder => (
          <div key={folder.folderPath}>
            <h3>{folder.folderPath}</h3>
            <ImageCarousel
              images={folder.images}
              bucketName="avatars"
              folderPath={folder.folderPath}
              imageStatuses={imageStatuses}
              setImageStatuses={setImageStatuses}
              onOpenFliiinkerDetails={handleOpenFliiinkerDetails}
            />
          </div>
        ))}
      </div>
    </div>
  );
};