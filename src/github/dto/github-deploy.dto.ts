import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class GithubDeployDto {
  @ApiProperty({
    description:
      'GitHub access token obtained via the /github/exchange endpoint. Passed per-request — never stored server-side.',
    example: 'gho_xxxxxxxxxxxxxxxxxxxx',
  })
  @IsString()
  @MinLength(1)
  githubToken: string;
}
