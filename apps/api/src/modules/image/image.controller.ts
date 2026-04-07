import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { ImageService } from './image.service';

@ApiTags('Images')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post('restaurants/:id/images/upload')
  @ApiOperation({ summary: 'Upload image directly (local storage)' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) restaurantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('sortOrder') sortOrder?: string,
  ) {
    const image = await this.imageService.uploadLocal(
      user.id,
      restaurantId,
      file,
      sortOrder ? parseInt(sortOrder, 10) : 0,
    );
    return { success: true, data: image };
  }

  @Post('restaurants/:id/images')
  @ApiOperation({ summary: 'Register uploaded image metadata' })
  async registerImage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) restaurantId: string,
    @Body() dto: { s3Key: string; fileName: string; mimeType: string; fileSize: number; sortOrder?: number },
  ) {
    const image = await this.imageService.registerImage(
      user.id,
      restaurantId,
      dto,
    );
    return { success: true, data: image };
  }

  @Delete('images/:id')
  @ApiOperation({ summary: 'Delete an image' })
  async deleteImage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.imageService.deleteImage(user.id, id);
    return { success: true, data: { message: 'Image deleted' } };
  }
}
