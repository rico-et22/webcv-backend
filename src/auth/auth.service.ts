import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ConfirmResetDto } from './dto/confirm-reset.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    const { data, error } = await this.supabaseService.supabase.auth.signUp({
      email: dto.email,
      password: dto.password,
      options: {
        emailRedirectTo: `${frontendUrl}/auth/callback`,
      },
    });

    if (error) {
      this.logger.warn(`Register failed for ${dto.email}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    return {
      data: data.user,
      message: 'Registration successful. Please verify your email.',
    };
  }

  async login(dto: LoginDto) {
    const { data, error } =
      await this.supabaseService.supabase.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (error) {
      this.logger.warn(`Login failed for ${dto.email}: ${error.message}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user,
      },
      message: 'Login successful',
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    const { data, error } =
      await this.supabaseService.supabase.auth.refreshSession({
        refresh_token: dto.refreshToken,
      });

    if (error || !data.session) {
      this.logger.warn(
        `Refresh token failed: ${error?.message || 'No session returned'}`,
      );
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return {
      data: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: data.user,
      },
      message: 'Token refreshed successfully',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

    const { error } =
      await this.supabaseService.supabase.auth.resetPasswordForEmail(
        dto.email,
        {
          redirectTo: `${frontendUrl}/reset-password`,
        },
      );

    if (error) {
      this.logger.warn(
        `Password reset failed for ${dto.email}: ${error.message}`,
      );
      throw new BadRequestException(error.message);
    }

    // Always return a generic message to avoid email enumeration
    return {
      data: null,
      message: 'If this email is registered, a reset link has been sent.',
    };
  }

  async confirmReset(dto: ConfirmResetDto) {
    // Validate the recovery token and extract the user
    const { data, error } = await this.supabaseService.supabase.auth.getUser(
      dto.accessToken,
    );

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Update the password using the admin API
    const { error: updateError } =
      await this.supabaseService.supabaseAdmin.auth.admin.updateUserById(
        data.user.id,
        { password: dto.newPassword },
      );

    if (updateError) {
      this.logger.error(
        `Password reset failed for user ${data.user.id}: ${updateError.message}`,
      );
      throw new BadRequestException(updateError.message);
    }

    return { data: null, message: 'Password reset successfully' };
  }

  async changePassword(
    userId: string,
    userEmail: string,
    dto: ChangePasswordDto,
  ) {
    // Step 1: Verify current password via signIn
    const { error: verifyError } =
      await this.supabaseService.supabase.auth.signInWithPassword({
        email: userEmail,
        password: dto.currentPassword,
      });

    if (verifyError) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Step 2: Update to new password using admin API
    const { error: updateError } =
      await this.supabaseService.supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          password: dto.newPassword,
        },
      );

    if (updateError) {
      this.logger.error(
        `Password update failed for user ${userId}: ${updateError.message}`,
      );
      throw new BadRequestException(updateError.message);
    }

    return { data: null, message: 'Password changed successfully' };
  }
}
