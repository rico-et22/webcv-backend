import { Body, Controller, Delete, Get, Put, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-responses.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@ApiExtraModels(UserResponseDto)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile returned',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(UserResponseDto) },
        message: {
          type: 'string',
          example: 'User profile retrieved successfully',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Request() req: { user: { sub: string } }) {
    return this.usersService.getMe(req.user.sub);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user account details' })
  @ApiResponse({ status: 200, description: 'User profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  update(
    @Request() req: { user: { sub: string } },
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.sub, dto);
  }

  @Delete('delete-account')
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  deleteAccount(@Request() req: { user: { sub: string } }) {
    return this.usersService.deleteAccount(req.user.sub);
  }
}
