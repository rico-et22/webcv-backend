import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ example: 'https://xyz.supabase.co/storage/v1/object/public/avatars/user-id/avatar.png' })
  url: string;

  @ApiProperty({ example: 'user-id/avatar.png' })
  storagePath: string;
}
