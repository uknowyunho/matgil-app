import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Image } from '../../database/entities/image.entity';
import { Restaurant } from '../../database/entities/restaurant.entity';

interface PresignedUrlResult {
  uploadUrl: string;
  s3Key: string;
  publicUrl: string;
}

interface RegisterImageData {
  s3Key: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  sortOrder?: number;
}

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly s3Client: S3Client;

  constructor(
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
    private readonly configService: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: this.configService.get<string>('aws.region'),
      credentials: {
        accessKeyId: this.configService.get<string>('aws.accessKeyId') || '',
        secretAccessKey: this.configService.get<string>('aws.secretAccessKey') || '',
      },
    });
  }

  async createPresignedUrl(
    userId: string,
    restaurantId: string,
    fileName: string,
    mimeType: string,
  ): Promise<PresignedUrlResult> {
    // Verify restaurant ownership
    await this.verifyRestaurantOwnership(userId, restaurantId);

    const bucket = this.configService.get<string>('aws.s3Bucket');
    const region = this.configService.get<string>('aws.region');

    // Generate unique S3 key
    const extension = fileName.split('.').pop() || 'jpg';
    const s3Key = `restaurants/${restaurantId}/${uuidv4()}.${extension}`;
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      ContentType: mimeType,
    });
    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    this.logger.log(
      `Presigned URL generated for restaurant ${restaurantId}: ${s3Key}`,
    );

    return {
      uploadUrl,
      s3Key,
      publicUrl,
    };
  }

  async registerImage(
    userId: string,
    restaurantId: string,
    data: RegisterImageData,
  ): Promise<Image> {
    // Verify restaurant ownership
    await this.verifyRestaurantOwnership(userId, restaurantId);

    const bucket = this.configService.get<string>('aws.s3Bucket');
    const region = this.configService.get<string>('aws.region');
    const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${data.s3Key}`;

    const image = this.imageRepository.create({
      restaurantId,
      userId,
      url: publicUrl,
      thumbnailUrl: null,
      s3Key: data.s3Key,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      sortOrder: data.sortOrder || 0,
    });

    const saved = await this.imageRepository.save(image);
    this.logger.log(
      `Image registered: ${saved.id} for restaurant ${restaurantId}`,
    );
    return saved;
  }

  async uploadLocal(
    userId: string,
    restaurantId: string,
    file: Express.Multer.File,
    sortOrder: number,
  ): Promise<Image> {
    await this.verifyRestaurantOwnership(userId, restaurantId);

    const uploadsDir = path.join(process.cwd(), 'uploads', 'restaurants', restaurantId);
    fs.mkdirSync(uploadsDir, { recursive: true });

    const extension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const port = this.configService.get<number>('port', 3000);
    const publicUrl = `http://localhost:${port}/uploads/restaurants/${restaurantId}/${fileName}`;

    const image = this.imageRepository.create({
      restaurantId,
      userId,
      url: publicUrl,
      thumbnailUrl: null,
      s3Key: `local:${restaurantId}/${fileName}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      sortOrder,
    });

    const saved = await this.imageRepository.save(image);
    this.logger.log(`Image uploaded locally: ${saved.id} for restaurant ${restaurantId}`);
    return saved;
  }

  async deleteImage(userId: string, id: string): Promise<void> {
    const image = await this.imageRepository.findOne({
      where: { id },
    });

    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }

    if (image.userId !== userId) {
      throw new ForbiddenException('You can only delete your own images');
    }

    const bucket = this.configService.get<string>('aws.s3Bucket');
    try {
      await this.s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: image.s3Key }));
    } catch (error) {
      this.logger.warn(`Failed to delete S3 object: ${image.s3Key}`, error);
    }

    await this.imageRepository.remove(image);
    this.logger.log(`Image ${id} deleted by user ${userId}`);
  }

  private async verifyRestaurantOwnership(
    userId: string,
    restaurantId: string,
  ): Promise<void> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: restaurantId, userId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Restaurant with ID ${restaurantId} not found`,
      );
    }
  }
}
