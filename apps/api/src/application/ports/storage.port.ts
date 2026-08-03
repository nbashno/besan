// منفذ التخزين — يجرّد Supabase/S3/Azure/GCS/MinIO
// المبدأ: الخادم لا يلمس بايتات الملف؛ يصدر روابط موقّعة فقط
export interface SignedUploadResult {
  uploadUrl: string;
  path: string;
  expiresIn: number;
}

export interface SignedDownloadResult {
  downloadUrl: string;
  expiresIn: number;
}

export abstract class StoragePort {
  abstract createSignedUpload(
    fileName: string,
    mimeType: string,
  ): Promise<SignedUploadResult>;
  abstract createSignedDownload(path: string): Promise<SignedDownloadResult>;
  abstract remove(path: string): Promise<void>;
}
