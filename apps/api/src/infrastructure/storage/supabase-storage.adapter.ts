import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import {
  StoragePort,
  SignedUploadResult,
  SignedDownloadResult,
} from '@application/ports/storage.port';

// الخادم لا يمرّر بايتات الملف — يصدر رابط رفع موقّع، والمتصفح يرفع مباشرة
@Injectable()
export class SupabaseStorageAdapter extends StoragePort {
  private readonly client: SupabaseClient;
  private readonly bucket: string;
  private readonly ttl: number;

  constructor(private readonly config: ConfigService) {
    super();
    this.client = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
    );
    this.bucket = this.config.getOrThrow<string>('SUPABASE_BUCKET');
    this.ttl = Number(this.config.get<string>('SIGNED_URL_TTL') ?? '3600');
  }

  async createSignedUpload(fileName: string): Promise<SignedUploadResult> {
    const safe = fileName.replace(/[^\w.\-]/g, '_');
    const path = `${new Date().getFullYear()}/${randomUUID()}-${safe}`;
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUploadUrl(path);
    if (error || !data) throw new Error(`فشل إنشاء رابط الرفع: ${error?.message}`);
    return { uploadUrl: data.signedUrl, path: data.path, expiresIn: this.ttl };
  }

  async createSignedDownload(path: string): Promise<SignedDownloadResult> {
    const { data, error } = await this.client.storage
      .from(this.bucket)
      .createSignedUrl(path, this.ttl);
    if (error || !data) throw new Error(`فشل إنشاء رابط التنزيل: ${error?.message}`);
    return { downloadUrl: data.signedUrl, expiresIn: this.ttl };
  }

  async remove(path: string): Promise<void> {
    await this.client.storage.from(this.bucket).remove([path]);
  }
}
