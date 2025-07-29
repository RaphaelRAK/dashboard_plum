import { 
  S3Client, 
  ListObjectsV2Command, 
  GetObjectCommand, 
  _Object 
} from '@aws-sdk/client-s3';

// Utiliser les variables d'environnement pour la configuration
const accessKey = import.meta.env.VITE_CLOUDFLARE_R2_TOKEN_ACCESS_KEY;
const secretKey = import.meta.env.VITE_CLOUDFLARE_R2_TOKEN_SECRET_ACCESS_KEY;
const endpoint = import.meta.env.VITE_CLOUDFLARE_R2_TOKEN_ENDPOINT;
const bucketName = import.meta.env.VITE_CLOUDFLARE_R2_BUCKET_NAME;
const cdnUrl = import.meta.env.VITE_CLOUDFLARE_STORAGE_URL_FOR_IMAGES;

console.log("🌐 Domaine utilisé pour les images:", cdnUrl);

// Créer le client S3
const r2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
});

// Types
export interface CloudflareImage {
  name: string;
  size: number;
  lastModified: Date;
  folderPath: string;
  url: string;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

// TEMPORAIRE: Données fictives pour simuler des dossiers et des images
// À remplacer par de vraies données dès que le CORS est configuré
const simulatedFolders = [
  'dossier1',
  'dossier2',
  'utilisateur1',
  'utilisateur2',
  'france',
  'reunion'
];

// Générer 50 images fictives dans différents dossiers
const generateSimulatedImages = () => {
  const images: CloudflareImage[] = [];
  
  for (let i = 1; i <= 1; i++) {
    const folderIndex = i % simulatedFolders.length;
    const folderPath = simulatedFolders[folderIndex];
    const name = `image_${i}.jpg`;
    
    images.push({
      name,
      size: 1024 * 100, // 100 KB
      lastModified: new Date(),
      folderPath,
      url: `${cdnUrl}/${folderPath}/${name}`
    });
  }
  
  return images;
};

const simulatedImages = generateSimulatedImages();

// Fonction pour récupérer toutes les images
export const getAllImages = async (): Promise<CloudflareImage[]> => {
  console.log('🔍 Récupération de toutes les images...');
  
  try {
    // Essayer d'abord l'accès direct au bucket R2
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
    });
    console.log('Liste des images dans R2:', command);
    try {
      const response = await r2Client.send(command);
      
      if (!response.Contents) {
        console.log('Aucune image trouvée dans R2, utilisation des données simulées');
        return simulatedImages;
      }
      
      // Filtrer pour les formats d'image
      const imageObjects = response.Contents.filter((obj: any) => {
        const key = obj.Key || '';
        return key.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      });
      
      console.log(`📸 ${imageObjects.length} images trouvées dans R2`);
      
      // Transformer en format CloudflareImage
      const images = imageObjects.map((obj: any) => {
        const key = obj.Key || '';
        const parts = key.split('/');
        const name = parts.pop() || '';
        const folderPath = parts.join('/');
        
        return {
          name,
          size: obj.Size || 0,
          lastModified: obj.LastModified || new Date(),
          folderPath,
          url: `${cdnUrl}/${key}`
        };
      });
      
      return images;
    } catch (r2Error) {
      console.warn('⚠️ Erreur lors de l\'accès direct à R2, utilisation des données simulées:', r2Error);
      return simulatedImages;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des images:', error);
    return simulatedImages;
  }
};

// Fonction pour récupérer les images paginées
export const getPaginatedImages = async (
  page: number,
  pageSize: number
): Promise<PaginationResult<CloudflareImage>> => {
  console.log('🔍 Récupération des images paginées...');
  try {
    // Récupérer toutes les images
    const allImages = await getAllImages();
    const total = allImages.length;
    
    // Paginer les résultats
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedImages = allImages.slice(startIndex, endIndex);

    console.log('🔍 Pagination des images:', {
      startIndex,
      endIndex,
      total,
      paginatedImages
    });
    
    return {
      data: paginatedImages,
      total,
      hasMore: endIndex < total
    };
  } catch (error) {
    console.error('❌ Erreur lors de la pagination des images:', error);
    
    // En cas d'erreur, utiliser les données simulées
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedImages = simulatedImages.slice(startIndex, endIndex);
    
    return {
      data: paginatedImages,
      total: simulatedImages.length,
      hasMore: endIndex < simulatedImages.length
    };
  }
};

// Récupérer les images par dossier
export const getImagesByFolder = async (folderPath: string): Promise<CloudflareImage[]> => {
  try {
    // Essayer d'abord l'accès direct
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `${folderPath}/`,
    });
    
    try {
      const response = await r2Client.send(command);
      
      if (!response.Contents) {
        console.log(`Aucune image trouvée dans le dossier ${folderPath}, utilisation des données simulées`);
        // Filtrer les images simulées par dossier
        return simulatedImages.filter(img => img.folderPath === folderPath);
      }
      
      // Filtrer pour les formats d'image
      const imageObjects = response.Contents.filter((obj: any) => {
        const key = obj.Key || '';
        const name = key.split('/').pop() || '';
        return name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
      });
      
      // Transformer en format CloudflareImage
      const images = imageObjects.map((obj: any) => {
        const key = obj.Key || '';
        const name = key.split('/').pop() || '';
        
        return {
          name,
          size: obj.Size || 0,
          lastModified: obj.LastModified || new Date(),
          folderPath,
          url: `${cdnUrl}/${key}`
        };
      });
      
      return images;
    } catch (r2Error) {
      console.warn(`⚠️ Erreur lors de l'accès direct au dossier ${folderPath}, utilisation des données simulées:`, r2Error);
      // Filtrer les images simulées par dossier
      return simulatedImages.filter(img => img.folderPath === folderPath);
    }
  } catch (error) {
    console.error(`❌ Erreur lors de la récupération des images du dossier ${folderPath}:`, error);
    return simulatedImages.filter(img => img.folderPath === folderPath);
  }
};

// Récupérer tous les dossiers
export const getAllFolders = async (): Promise<string[]> => {
  try {
    // Essayer d'abord l'accès direct
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Delimiter: '/',
    });
    
    try {
      const response = await r2Client.send(command);
      
      // Créer un ensemble pour stocker les dossiers uniques
      const folders = new Set<string>();
      
      // Extraire les dossiers des CommonPrefixes
      if (response.CommonPrefixes) {
        response.CommonPrefixes.forEach((prefix: any) => {
          if (prefix.Prefix) {
            // Enlever le '/' à la fin
            const folderName = prefix.Prefix.replace(/\/$/, '');
            folders.add(folderName);
          }
        });
      }
      
      // Extraire les dossiers des clés d'objets
      if (response.Contents) {
        response.Contents.forEach((obj: any) => {
          if (obj.Key) {
            const parts = obj.Key.split('/');
            if (parts.length > 1) {
              // Prendre le premier segment comme nom de dossier
              folders.add(parts[0]);
            }
          }
        });
      }
      
      return Array.from(folders);
    } catch (r2Error) {
      console.warn('⚠️ Erreur lors de l\'accès direct pour récupérer les dossiers, utilisation des données simulées:', r2Error);
      return simulatedFolders;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des dossiers:', error);
    return simulatedFolders;
  }
};

// Récupérer les dossiers paginés
export const getPaginatedFolders = async (
  page: number,
  pageSize: number
): Promise<PaginationResult<string>> => {
  try {
    const folders = await getAllFolders();
    const total = folders.length;
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFolders = folders.slice(startIndex, endIndex);
    
    return {
      data: paginatedFolders,
      total,
      hasMore: endIndex < total
    };
  } catch (error) {
    console.error('❌ Erreur lors de la pagination des dossiers:', error);
    
    // En cas d'erreur, utiliser les données simulées
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedFolders = simulatedFolders.slice(startIndex, endIndex);
    
    return {
      data: paginatedFolders,
      total: simulatedFolders.length,
      hasMore: endIndex < simulatedFolders.length
    };
  }
}; 