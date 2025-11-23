import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { IdRecognitionResponseDto } from './dto/id-recognition-response.dto';
import { IdBackRecognitionResponseDto } from './dto/id-back-recognition-response.dto';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    const apiKey = this.configService.getOrThrow('gemini.apiKey', {
      infer: true,
    });
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async recognizeId(
    imageFile: Express.Multer.File,
  ): Promise<IdRecognitionResponseDto> {
    this.validateImageFile(imageFile);

    try {
      const prompt = `
        Extract the following information from this Vietnamese ID card image and return it in JSON format:
        - id: ID number
        - name: Full name (uppercase)
        - dob: Date of birth (DD/MM/YYYY)
        - sex: Gender (Nam/Nữ)
        - nationality: Nationality
        - home: Place of origin
        - address: Place of residence

        Return ONLY the JSON object with these keys. If a field is not visible or clear, use "N/A".
        Ensure the output is a valid JSON string.
      `;

      const imagePart = {
        inlineData: {
          data: imageFile.buffer.toString('base64'),
          mimeType: imageFile.mimetype,
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      this.logger.debug(`Raw Gemini response (Front): ${text}`);

      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleanedText);

      this.logger.debug(`Parsed data (Front): ${JSON.stringify(data)}`);

      return this.mapToDto(data);
    } catch (error) {
      this.logger.error(`ID recognition failed: ${error.message}`);
      throw new BadRequestException(`Failed to recognize ID: ${error.message}`);
    }
  }

  async recognizeIdBack(
    imageFile: Express.Multer.File,
  ): Promise<IdBackRecognitionResponseDto> {
    this.validateImageFile(imageFile);

    try {
      const prompt = `
        Extract the following information from this Vietnamese ID card BACK side image and return it in JSON format:
        - issueDate: Date of issue (DD/MM/YYYY)
        - issueLoc: Issuing Authority (e.g., Cục trưởng Cục Cảnh sát quản lý hành chính về trật tự xã hội)

        Return ONLY the JSON object with these keys. If a field is not visible or clear, use "N/A".
        Ensure the output is a valid JSON string.
      `;

      const imagePart = {
        inlineData: {
          data: imageFile.buffer.toString('base64'),
          mimeType: imageFile.mimetype,
        },
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      this.logger.debug(`Raw Gemini response (Back): ${text}`);

      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      const data = JSON.parse(cleanedText);

      this.logger.debug(`Parsed data (Back): ${JSON.stringify(data)}`);

      return this.mapToBackDto(data);
    } catch (error) {
      this.logger.error(`ID back recognition failed: ${error.message}`);
      throw new BadRequestException(
        `Failed to recognize ID back: ${error.message}`,
      );
    }
  }

  private mapToDto(data: any): IdRecognitionResponseDto {
    const sanitize = (text: string) =>
      text ? text.replace(/\n/g, ' ').trim() : 'N/A';

    return {
      errorCode: 0,
      errorMessage: '',
      data: [
        {
          id: sanitize(data.id),
          name: sanitize(data.name),
          dob: sanitize(data.dob),
          sex: sanitize(data.sex),
          nationality: sanitize(data.nationality),
          home: sanitize(data.home),
          address: sanitize(data.address),
        },
      ],
    };
  }

  private mapToBackDto(data: any): IdBackRecognitionResponseDto {
    const sanitize = (text: string) =>
      text ? text.replace(/\n/g, ' ').trim() : 'N/A';

    return {
      errorCode: 0,
      errorMessage: '',
      data: [
        {
          issueDate: sanitize(data.issueDate),
          issueLoc: sanitize(data.issueLoc),
        },
      ],
    };
  }

  private validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid image format. Only JPEG and PNG are supported',
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'Image file size exceeds maximum limit of 10MB',
      );
    }
  }
}
