import type { ExportModel, ImageNaturalSize, PinModel } from './types';

export function clampNumber(value: number, minValue: number, maxValue: number) {
  if (value < minValue) {
    return minValue;
  }
  if (value > maxValue) {
    return maxValue;
  }
  return value;
}

export function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function safeParseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function buildExportModel(pins: PinModel[], imageNaturalSize: ImageNaturalSize): ExportModel {
  return {
    version: 1,
    image: { naturalSize: imageNaturalSize },
    pins,
    exportedAt: new Date().toISOString(),
  };
}

export function isValidPinModel(value: any): value is PinModel {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (typeof value.id !== 'string') {
    return false;
  }
  if (typeof value.x !== 'number' || typeof value.y !== 'number') {
    return false;
  }
  if (typeof value.title !== 'string' || typeof value.note !== 'string') {
    return false;
  }
  if (typeof value.category !== 'string' || typeof value.perspective !== 'string') {
    return false;
  }
  if (typeof value.severity !== 'string') {
    return false;
  }
  if (typeof value.colour !== 'string') {
    return false;
  }
  if (typeof value.createdAt !== 'string') {
    return false;
  }
  return true;
}

export function isValidExportModel(value: any): value is ExportModel {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (value.version !== 1) {
    return false;
  }
  if (!value.image || typeof value.image !== 'object') {
    return false;
  }
  if (!value.image.naturalSize || typeof value.image.naturalSize !== 'object') {
    return false;
  }
  if (typeof value.image.naturalSize.width !== 'number' || typeof value.image.naturalSize.height !== 'number') {
    return false;
  }
  if (!Array.isArray(value.pins)) {
    return false;
  }
  if (typeof value.exportedAt !== 'string') {
    return false;
  }
  if (!value.pins.every(isValidPinModel)) {
    return false;
  }
  return true;
}
