import { serviceRoleClient } from "../../utility/supabaseServiceRole";
import { FileObject } from '@supabase/storage-js';

let totalFoldersCache: number | null = null;
let cacheExpiration: number | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes en millisecondes


let foldersCache: FileObject[] | null = null;

// Types pour la pagination
interface PaginationResult<T> {
  data: T[]; // T est un type générique qui peut être n'importe quel type
  total: number;
  hasMore: boolean;
}

interface FolderWithImages {
  folderPath: string;
  images: FileObject[];
}

export const fetchAllFolders = async (): Promise<FileObject[]> => {
  try {
    // Vérifier si le cache est valide
    if (foldersCache && cacheExpiration && Date.now() < cacheExpiration) {
      console.log("Utilisation du cache pour les dossiers.");
      return foldersCache;
    }

    console.log("Récupération des dossiers depuis l'API...");
    const allFolders = [];
    let hasMore = true;
    let offset = 0;
    const limit = 1000;

    while (hasMore) {
      const { data, error } = await serviceRoleClient
        .storage
        .from('avatars')
        .list('', { limit, offset });

      if (error) throw error;

      if (data) {
        allFolders.push(...data);
        console.log(`Récupéré ${data.length} éléments, total jusqu'à présent : ${allFolders.length}`);

        if (data.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }
      } else {
        hasMore = false;
      }
    }

    // Mettre à jour le cache et définir une nouvelle expiration
    foldersCache = allFolders;
    cacheExpiration = Date.now() + CACHE_TTL;
    console.log("Dossiers mis en cache avec expiration.");

    return allFolders;
  } catch (error) {
    console.error('Erreur lors de la récupération des dossiers:', error);
    throw error;
  }
};

export const fetchImagesByFolder = async (folderPath: string) => {
  try {
    const { data, error } = await serviceRoleClient
      .storage
      .from('avatars')
      .list(folderPath);

    if (error) throw error;
    
    const images = data.filter(file => 
      file.name.match(/\.(webp)$/i)
    );

    return images;
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    throw error;
  }
};

export const deleteImage = async (folderPath: string, imageName: string) => {
  try {
    console.log("Suppression de l'image à ce chemin:", `${folderPath}/${imageName}`);
    const { data, error } = await serviceRoleClient
      .storage
      .from('avatars')
      .remove([`${folderPath}/${imageName}`]);

    if (error) throw error;
    console.log("************* error *************", error);
    return data;
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    throw error;
  }
};

// Nouvelle fonction pour récupérer toutes les images avec leurs chemins de dossiers
export const fetchAllImages = async () => {
  try {
    const folders = await fetchAllFolders();
    const imagesPromises = folders.map(async (folder: FileObject) => {
      const images = await fetchImagesByFolder(folder.name);
      return images.map(image => ({
        ...image,
        folderPath: folder.name
      }));
    });

    const imagesPerFolder = await Promise.all(imagesPromises);
    const allImages = imagesPerFolder.flat();
    console.log("allImages", allImages);
    return allImages;
  } catch (error) {
    console.error('Erreur lors de la récupération de toutes les images:', error);
    throw error;
  }
};

// Nouveau type pour le cache des images
interface ImageCache {
  images: {
    [key: string]: any[];
  };
  totalCount: number;
  timestamp: number;
}

let imagesCache: ImageCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const fetchPaginatedImages = async (page: number, pageSize: number) => {
  try {
    // Vérifier si le cache est valide
    if (imagesCache && Date.now() - imagesCache.timestamp < CACHE_DURATION) {
      console.log('Utilisation du cache pour les images');
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedImages = Object.values(imagesCache.images)
        .flat()
        .slice(start, end);

      return {
        data: paginatedImages,
        total: imagesCache.totalCount
      };
    }

    // Si pas de cache valide, récupérer tous les dossiers en une seule fois
    const folders = await fetchAllFolders();
    
    // Récupérer toutes les images en parallèle
    const imagesPromises = folders.map(folder => fetchImagesByFolder(folder.name));
    const imagesResults = await Promise.all(imagesPromises);

    // Organiser les images par dossier
    const allImages = folders.reduce((acc, folder, index) => {
      acc[folder.name] = imagesResults[index].map(image => ({
        ...image,
        folderPath: folder.name
      }));
      return acc;
    }, {} as { [key: string]: any[] });

    // Mettre en cache
    imagesCache = {
      images: allImages,
      totalCount: Object.values(allImages).flat().length,
      timestamp: Date.now()
    };

    // Retourner la page demandée
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedImages = Object.values(allImages)
      .flat()
      .slice(start, end);

    return {
      data: paginatedImages,
      total: imagesCache.totalCount
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des images paginées:', error);
    throw error;
  }
};


// Fonction pour récupérer le nombre total de dossiers
const getTotalFoldersCount = async (): Promise<number> => {
  try {
    // Vérifier si le cache est valide
    if (totalFoldersCache !== null && cacheExpiration && Date.now() < cacheExpiration) {
      console.log("Utilisation du cache pour le nombre total de dossiers:", totalFoldersCache);
      return totalFoldersCache;
    }

    console.log("Début de getTotalFoldersCount...");
    let total = 0;
    let hasMore = true;
    let offset = 0;
    const limit = 1000;

    while (hasMore) {
      // console.log(`Récupération des dossiers avec offset: ${offset}, limit: ${limit}...`);
      const { data, error } = await serviceRoleClient
        .storage
        .from('avatars')
        .list('', {
          limit,
          offset,
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        // console.log("Aucun dossier trouvé ou fin de la pagination.");
        hasMore = false;
      } else {
        total += data.length;
        // console.log(`Dossiers récupérés: ${data.length}, total cumulé: ${total}`);

        if (data.length < limit) {
          // console.log("Fin de la pagination (moins de dossiers que la limite).");
          hasMore = false;
        } else {
          offset += limit;
          // console.log(`Nouvel offset pour la prochaine requête: ${offset}`);
        }
      }
    }

    // Mettre en cache le résultat
    totalFoldersCache = total;
    cacheExpiration = Date.now() + CACHE_TTL;
    // console.log(`Nombre total de dossiers mis en cache: ${total}`);
    
    return total;
  } catch (error) {
    // console.error('Erreur lors du comptage des dossiers:', error);
    throw error;
  }
};

// Fonction pour forcer le rafraîchissement du cache si nécessaire
export const clearFoldersCache = () => {
  totalFoldersCache = null;
  cacheExpiration = null;
  // console.log("Cache des dossiers effacé");
};

// Fonction pour récupérer les dossiers paginés
export const fetchPaginatedFolders = async (
  page: number,
  pageSize: number
): Promise<PaginationResult<FileObject>> => {
  try {
    //  console.log(`Début de fetchPaginatedFolders - Page: ${page}, Taille de la page: ${pageSize}...`);
    const start = (page - 1) * pageSize;
    // console.log(`Calcul de l'offset: ${start}`);

    // Récupérer le nombre total de dossiers
    // console.log("Récupération du nombre total de dossiers...");
    const total = await getTotalFoldersCount();
    // console.log(`Nombre total de dossiers: ${total}`);

    // Récupérer les dossiers pour la page courante
    // console.log(`Récupération des dossiers pour la page ${page}...`);
    const { data: folders, error } = await serviceRoleClient
      .storage
      .from('avatars')
      .list('', {
        limit: pageSize,
        offset: start,
      });

    if (error) throw error;

    // console.log(`Dossiers récupérés pour la page ${page}: ${folders?.length || 0}`);
    // console.log(`Y a-t-il plus de dossiers ? ${start + pageSize < total}`);

    return {
      data: folders || [],
      total,
      hasMore: start + pageSize < total,
    };
  } catch (error) {
    // console.error('Erreur lors de la récupération des dossiers:', error);
    throw error;
  }
};

// Fonction pour récupérer les images des dossiers d'une page spécifique
export const fetchImagesForPage = async (
  page: number,
  pageSize: number
): Promise<PaginationResult<FolderWithImages>> => {
  try {
    // console.log(`Début de fetchImagesForPage - Page: ${page}, Taille de la page: ${pageSize}...`);

    // Récupérer les dossiers pour la page courante
    // console.log("Récupération des dossiers paginés...");
    const { data: folders, total, hasMore } = await fetchPaginatedFolders(page, pageSize);
    // console.log(`Dossiers récupérés pour la page ${page}: ${folders.length}`);

    // Récupérer les images pour chaque dossier de la page
    // console.log("Récupération des images pour chaque dossier...");
    const foldersWithImages = await Promise.all(
      folders.map(async (folder) => {
        // console.log(`Récupération des images pour le dossier: ${folder.name}...`);
        const images = await fetchImagesByFolder(folder.name);
        // console.log(`Images récupérées pour le dossier ${folder.name}: ${images.length}`);

        return {
          folderPath: folder.name,
          images: images.filter(file => file.name.match(/\.(webp)$/i)),
        };
      })
    );

    // console.log(`Nombre total de dossiers avec images: ${foldersWithImages.length}`);
    // console.log(`Y a-t-il plus de dossiers ? ${hasMore}`);

    return {
      data: foldersWithImages,
      total,
      hasMore,
    };
  } catch (error) {
    // console.error('Erreur lors de la récupération des images:', error);
    throw error;
  }
};


export const fetchSearchFolders = async (searchTerm: string) => {
  const { data: folders, error } = await serviceRoleClient
    .storage
    .from('avatars')
    .list('', { search: searchTerm });

  if (error) throw error;

  // Récupérer les images pour chaque dossier trouvé
  const foldersWithImages = await Promise.all(
    folders.map(async (folder) => {
      const images = await fetchImagesByFolder(folder.name);
      return {
        folderPath: folder.name,
        images: images.filter(file => file.name.match(/\.(webp)$/i)), // Filtrer les images si nécessaire
      };
    })
  );

  return foldersWithImages; // Retourner les dossiers avec leurs images
};
