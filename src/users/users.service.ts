import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async getMe(userId: string) {
    const { data, error } =
      await this.supabaseService.supabase.auth.admin.getUserById(userId);

    if (error || !data.user) {
      this.logger.warn(`User not found: ${userId}`);
      throw new NotFoundException('User not found');
    }

    return { data: data.user, message: 'User profile retrieved successfully' };
  }

  async update(userId: string, dto: UpdateUserDto) {
    const { data, error } = await this.supabaseService.supabase.auth.admin.updateUserById(userId, {
      email: dto.email,
    });

    if (error) {
      this.logger.error(`Error updating user ${userId}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return {
      message: 'Account details updated successfully',
    };
  }

  async deleteAccount(userId: string) {
    const { error } = await this.supabaseService.supabase.auth.admin.deleteUser(userId);

    if (error) {
      this.logger.error(`Error deleting user ${userId}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return {
      message: 'Account deleted successfully',
    };
  }
}
