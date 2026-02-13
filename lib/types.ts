export interface ZoneData {
  zoneId: 'A' | 'B' | 'C';
  label: string;
  cropPhotoUri?: string;
  cobPhotoUri?: string;
  plantHeight?: string;
  plantColor?: string;
  standDensity?: string;
  cobSizeObserved?: string;
  plantsSampled?: string;
  completed: boolean;
}

export interface PhotoData {
  type: string;
  uri: string;
  latitude?: number;
  longitude?: number;
  timestamp: number;
  filename: string;
}

export interface FieldRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  currentPhase: number;
  currentStep: number;

  farmerSelfieUri?: string;

  fieldId: string;
  collectionDate: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  district: string;
  block: string;
  village: string;
  fieldAreaAcres: string;
  fieldAreaHectares: string;

  entryPhotoUri?: string;
  entryPhotoLat?: number;
  entryPhotoLng?: number;
  centerPhotoUri?: string;
  centerPhotoLat?: number;
  centerPhotoLng?: number;

  zones: ZoneData[];

  variety: string;
  seedCompany: string;
  seedType: string;
  harvestDate: string;
  totalHarvestWeight: string;
  moisturePercent: string;
  dryWeight: string;
  yieldKgHa: string;
  yieldQuintalsAcre: string;

  sowingDate: string;
  growingDays: string;
  basalFertilizer: string;
  topDressing1: string;
  topDressing2: string;
  organicManure: string;

  irrigationType: string;
  irrigationNumber: string;
  waterSource: string;

  majorPest: string;
  pestSeverity: string;
  disease: string;
  pesticideUsed: string;

  soilType: string;
  soilPh: string;
  organicCarbon: string;
  npk: string;
  previousCrop: string;

  rainfallPattern: string;
  drought: string;
  heatStress: string;
  lodging: string;
  standQuality: string;
  cobSize: string;
  grainFillQuality: string;

  harvestPhotoUri?: string;
  weighmentPhotoUri?: string;
  farmerPhotoUri?: string;

  farmerName: string;
  farmerPhone: string;
  landOwnership: string;
  consent: string;
  collectorName: string;
  collectorPhone: string;
  timeSpent: string;

  photos: PhotoData[];
}

export function createEmptyRecord(): FieldRecord {
  const now = Date.now();
  const id = now.toString() + Math.random().toString(36).substr(2, 9);
  const today = new Date().toISOString().split('T')[0];
  return {
    id,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
    currentPhase: 0,
    currentStep: 0,
    fieldId: '',
    collectionDate: today,
    district: '',
    block: '',
    village: '',
    fieldAreaAcres: '',
    fieldAreaHectares: '',
    zones: [
      { zoneId: 'A', label: 'Good', completed: false },
      { zoneId: 'B', label: 'Medium', completed: false },
      { zoneId: 'C', label: 'Weak', completed: false },
    ],
    variety: '',
    seedCompany: '',
    seedType: '',
    harvestDate: '',
    totalHarvestWeight: '',
    moisturePercent: '',
    dryWeight: '',
    yieldKgHa: '',
    yieldQuintalsAcre: '',
    sowingDate: '',
    growingDays: '',
    basalFertilizer: '',
    topDressing1: '',
    topDressing2: '',
    organicManure: '',
    irrigationType: '',
    irrigationNumber: '',
    waterSource: '',
    majorPest: '',
    pestSeverity: '',
    disease: '',
    pesticideUsed: '',
    soilType: '',
    soilPh: '',
    organicCarbon: '',
    npk: '',
    previousCrop: '',
    rainfallPattern: '',
    drought: '',
    heatStress: '',
    lodging: '',
    standQuality: '',
    cobSize: '',
    grainFillQuality: '',
    farmerName: '',
    farmerPhone: '',
    landOwnership: '',
    consent: '',
    collectorName: '',
    collectorPhone: '',
    timeSpent: '',
    photos: [],
  };
}
