import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UploadFileDto {
  @ApiProperty({
    description: 'Target storage bucket',
    enum: ['avatars', 'screenshots'],
    example: 'avatars',
  })
  @IsIn(['avatars', 'screenshots'])
  bucket: 'avatars' | 'screenshots';
}
