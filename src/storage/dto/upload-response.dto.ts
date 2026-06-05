import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDataDto {
  @ApiProperty({
    example:
      'https://xyz.supabase.co/storage/v1/object/sign/avatars/user-id/ts.jpg?token=…',
    description: 'Signed URL (1 hr TTL). Use immediately for preview; do not persist.',
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
