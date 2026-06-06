import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GithubExchangeDto {
  @ApiProperty({
    description: 'OAuth authorization code received from GitHub redirect',
    example: 'abc123def456...',
  })
  @IsString()
  @MinLength(1)
  code: string;
}
