export type PerspectiveId = 'user' | 'developer' | 'accessibility';

export type CategoryId = 'ux' | 'visual' | 'logic' | 'accessibility';

export type SeverityId = 'low' | 'medium' | 'high';

export type ImageNaturalSize = {
  width: number;
  height: number;
};

export type PinModel = {
  id: string;
  x: number;
  y: number;
  title: string;
  note: string;
  category: CategoryId;
  perspective: PerspectiveId;
  severity: SeverityId;
  colour: string;
  createdAt: string;
};

export type ExportModel = {
  version: 1;
  image: {
    naturalSize: ImageNaturalSize;
  };
  pins: PinModel[];
  exportedAt: string;
};
