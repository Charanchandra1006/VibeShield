import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../prisma/prisma.service.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private s3Client: S3Client;
  private bucketName = process.env.S3_BUCKET_NAME || 'vibeshield-uploads';

  constructor(private prisma: PrismaService) {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  async uploadSnapshot(projectId: string, fileBuffer: Buffer, sizeBytes: number) {
    const contentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    const storageKey = `snapshots/${projectId}/${uuidv4()}.zip`;

    try {
      await this.s3Client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        Body: fileBuffer,
        ContentType: 'application/zip',
      }));
    } catch (error) {
      console.error('Failed to upload to S3', error);
      throw new InternalServerErrorException('Failed to store source snapshot');
    }

    return this.prisma.sourceSnapshot.create({
      data: {
        projectId,
        storageKey,
        contentHash,
        sizeBytes,
      }
    });
  }
}
