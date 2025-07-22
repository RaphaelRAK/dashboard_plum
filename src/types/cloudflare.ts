export interface CloudflareImage {
  name: string;
  size: number;
  lastModified: string;
  folderPath: string;
  fullPath: string;
  subfolderPath?: string;
  url?: string;
} 