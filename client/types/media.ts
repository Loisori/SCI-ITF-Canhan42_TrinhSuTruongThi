export type MediaItem = {
  id: number;
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
};

export type MediaLibraryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
};
