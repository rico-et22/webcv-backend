import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MinLength } from 'class-validator';

export class DeleteFileDto {
  @ApiProperty({
    description: 'Full storage path returned by an upload endpoint',
    example: 'user-uuid/avatar.png',
  })
  @IsString()
  @MinLength(1)
  path: string;

  @ApiProperty({
    description: 'Bucket name the file lives in',
    example: 'avatars',
    enum: ['avatars', 'screenshots'],
  })
  @IsIn(['avatars', 'screenshots'])
  bucket: 'avatars' | 'screenshots';
}
