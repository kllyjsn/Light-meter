// ImageCapture API types (not yet in lib.dom.d.ts)
declare class ImageCapture {
  constructor(track: MediaStreamTrack);
  getPhotoSettings(): Promise<Record<string, unknown>>;
  getPhotoCapabilities(): Promise<Record<string, unknown>>;
  grabFrame(): Promise<ImageBitmap>;
  takePhoto(photoSettings?: Record<string, unknown>): Promise<Blob>;
}
