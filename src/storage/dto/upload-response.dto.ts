import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDataDto {
  @ApiProperty({
    example:
      'https://xyz.supabase.co/storage/v1/object/public/avatars/user-id/avatar.png',
  })
  url: string;

  @ApiProperty({ example: 'user-id/avatar.png' })
  storagePath: string;
}

export class UploadResponseDto {
  @ApiProperty({ type: UploadResponseDataDto })
  data: UploadResponseDataDto;

  @ApiProperty({ example: 'File uploaded successfully' })
  message: string;
}
