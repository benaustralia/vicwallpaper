/* eslint-disable no-unused-vars */
export interface ImageProps {
  id: number;
  url: string;
  width: number;
  height: number;
  blurDataUrl: string;
  // Catalogue metadata (joined from manifest.json)
  title: string;
  source: string;
  date: string;
  dateApproximate: boolean;
  medium: string;
  classification: string;
  maker: string;
  country: string;
  creditLine: string;
  licence: string;
  objectUrl: string;
}

export interface SharedModalProps {
  index: number;
  images?: ImageProps[];
  currentPhoto?: ImageProps;
  changePhotoId: (newVal: number) => void;
  closeModal: () => void;
  navigation: boolean;
  direction?: number;
}
