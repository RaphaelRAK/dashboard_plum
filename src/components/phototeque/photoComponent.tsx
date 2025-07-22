import React, { useState, useEffect } from 'react';
import {
  Image, Card, Badge, Space, Typography, Modal, Input, message, Button, List, Tooltip, Progress
} from 'antd';
import { CheckOutlined, CloseOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import '../../styles/gallery.css';
import { deleteImage } from '../../services/phototeque/imageApi';
import { getCustomerName } from '../../services/customer/customerApi';

const { TextArea } = Input;

interface ImageCarouselProps {
  images: any[];
  bucketName: string;
  folderPath: string;
  imageStatuses: {
    [key: string]: {
      verified: boolean;
      compliant: boolean;
      comment: string;
    };
  };
  setImageStatuses: React.Dispatch<React.SetStateAction<{
    [key: string]: {
      verified: boolean;
      compliant: boolean;
      comment: string;
    };
  }>>;
  onOpenFliiinkerDetails: (folderId: string) => void;
}

const supabase_url = import.meta.env.VITE_SUPABASE_URL;

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  bucketName,
  folderPath,
  imageStatuses,
  setImageStatuses,
  onOpenFliiinkerDetails
}) => {
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [comment, setComment] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState(0);
  const totalImages = images.length;

  const handleVerify = (imageName: string) => {
    setImageStatuses(prev => ({
      ...prev,
      [imageName]: {
        ...prev[imageName],
        verified: true
      }
    }));
    message.success(`Image "${imageName}" vérifiée.`);
  };

  const handleNonCompliant = (imageName: string) => {
    setImageStatuses(prev => ({
      ...prev,
      [imageName]: {
        ...prev[imageName],
        compliant: false
      }
    }));
    message.warning(`Image "${imageName}" marquée comme non conforme.`);
  };

  const handleDelete = async (imageName: string) => {
    try {
      await deleteImage(folderPath, imageName);
      message.success(`Image "${imageName}" supprimée.`);
      setSelectedImage(null);
    } catch (error) {
      message.error(`Erreur lors de la suppression de l'image: ${error}`);
    }
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  const handleSubmitComment = () => {
    if (selectedImage) {
      setImageStatuses(prev => ({
        ...prev,
        [selectedImage.name]: {
          ...prev[selectedImage.name],
          comment
        }
      }));
      message.success(`Commentaire ajouté pour "${selectedImage.name}".`);
      setComment('');
    }
  };

  const openModal = async (image: any) => {
    setSelectedImage(image);
    setComment(imageStatuses[image.name]?.comment || '');
    try {
      const name = await getCustomerName(folderPath);
      setCustomerName(name);
    } catch (error) {
      console.error('Erreur lors de la récupération du nom:', error);
    }
  };

  const closeModal = () => {
    setSelectedImage(null);
    setComment('');
    setCustomerName('');
  };

  const handleOpenFliiinkerDetails = (folderPath: string) => {
    if (onOpenFliiinkerDetails) {
      onOpenFliiinkerDetails(folderPath);
    }
  };

  const handleImageLoad = () => {
    setLoadedImages(prev => {
      const newCount = prev + 1;
      if (newCount === totalImages) {
        setLoading(false);
      }
      return newCount;
    });
  };

  return (
    <div style={{ paddingLeft: '20px' }}>
      {loading && (
        <div style={{ marginBottom: '20px' }}>
          <Progress 
            percent={Math.round((loadedImages / totalImages) * 100)} 
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Typography.Text type="secondary">
            Chargement des images : {loadedImages}/{totalImages}
          </Typography.Text>
        </div>
      )}
      <List
        grid={{
          gutter: 8,
          xs: 1,
          sm: 2,
          md: 3,
          lg: 4,
          xl: 4,
          xxl: 6,
        }}
        dataSource={images}
        renderItem={(image: any) => (
          <List.Item>
            <Badge.Ribbon
              text={imageStatuses[image.name]?.verified ? "Vérifié" : "Non vérifié"}
              color={imageStatuses[image.name]?.verified ? "green" : "gray"}
              placement="start"
            >
              <div style={{ position: 'relative' }}>
                <Image
                  src={image.url}
                  alt={image.name}
                  style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  preview={false}
                  onClick={() => openModal(image)}
                  onLoad={handleImageLoad}
                />
                {image.subfolderPath && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '4px',
                    fontSize: '12px',
                    textAlign: 'center',
                    borderBottomLeftRadius: '8px',
                    borderBottomRightRadius: '8px'
                  }}>
                    {image.subfolderPath}
                  </div>
                )}
              </div>
            </Badge.Ribbon>
          </List.Item>
        )}
      />
      
      <Modal
        open={selectedImage !== null}
        title={
          <Space>
            {customerName}
            <Tooltip title="Plus d'informations sur le/la prestataire">
              <EyeOutlined 
                style={{ cursor: 'pointer' }} 
                onClick={() => handleOpenFliiinkerDetails(folderPath)}
              />
            </Tooltip>
          </Space>
        }
        onCancel={closeModal}
        footer={null}
        width={800}
      >
        {selectedImage && (
          <div>
            <Image
              src={selectedImage.url}
              alt={selectedImage.name}
              style={{
                width: '100%',
                maxHeight: '500px',
                objectFit: 'contain'
              }}
              placeholder
            />
            <Space style={{ marginTop: '20px' }}>
              <Button
                type={imageStatuses[selectedImage.name]?.verified ? "primary" : "default"}
                icon={<CheckOutlined />}
                onClick={() => handleVerify(selectedImage.name)}
              >
                {imageStatuses[selectedImage.name]?.verified ? "Vérifié" : "Vérifier"}
              </Button>
              <Button
                type={imageStatuses[selectedImage.name]?.compliant === false ? "primary" : "default"}
                icon={<CloseOutlined />}
                onClick={() => handleNonCompliant(selectedImage.name)}
              >
                {imageStatuses[selectedImage.name]?.compliant === false ? "Non Conforme" : "Marquer comme Non Conforme"}
              </Button>
              <Button
                type="default"
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDelete(selectedImage.name)}
              >
                Supprimer
              </Button>
            </Space>
            <div style={{ marginTop: '20px' }}>
              <Typography.Text strong>Commentaire :</Typography.Text>
              <TextArea
                value={comment}
                onChange={handleCommentChange}
                placeholder="Insérez votre commentaire ici..."
              />
              <Button
                type="primary"
                style={{ marginTop: '10px' }}
                onClick={handleSubmitComment}
              >
                Enregistrer Commentaire
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ImageCarousel;


