import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly fileService: FilesService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile('file') file: Express.Multer.File,
    @Query('ownerId') ownerId?: string,
  ) {
    return this.fileService.uploadFile(file, ownerId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'File ID' })
  getFile(@Param('id') id: string) {
    return this.fileService.getFile(id);
  }

  @Get(':id/preview')
  @UseGuards(AuthGuard('jwt'))
  async preview(@Param('id') id: string, @Req() req, @Res() res: Response) {
    await this.fileService.streamImage(id, req.user, res);
  }

  @Get('owner/:ownerId')
  @ApiParam({ name: 'ownerId', description: 'Owner ID' })
  getFilesByOwner(@Param('ownerId') ownerId: string) {
    return this.fileService.getFilesByOwner(ownerId);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'File ID' })
  deleteFile(@Param('id') id: string) {
    return this.fileService.deleteFile(id);
  }
}
