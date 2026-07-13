import { Controller, Post, Body, Get, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { Public, CurrentUser } from '../decorators/decorators';
import { JwtAuthGuard } from '../../../core/guards/jwt.guard';

import { LoginSchema, RegisterSchema, RefreshTokenSchema } from '@roundtable/shared';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: typeof RegisterSchema) {
    const validatedData = RegisterSchema.parse(body);
    return this.authService.registerUser(validatedData);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: typeof LoginSchema) {
    const validatedData = LoginSchema.parse(body);
    return this.authService.loginUser(validatedData);
  }

  @Public()
  @Post('wechat/login')
  @HttpCode(HttpStatus.OK)
  async wechatLogin(@Body('code') code: string) {
    return this.authService.loginWithWechat(code);
  }

  @Public()
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(@Body() body: typeof LoginSchema) {
    const validatedData = LoginSchema.parse(body);
    return this.authService.loginAdmin(validatedData);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: typeof RefreshTokenSchema) {
    const validatedData = RefreshTokenSchema.parse(body);
    return this.authService.refreshToken(validatedData);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.id);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateCurrentUser(
    @CurrentUser() user: any,
    @Body() body: { nickname?: string; avatar?: string },
  ) {
    return this.authService.updateUserProfile(user.id, body);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: any, @Body() body: z.infer<typeof RefreshTokenSchema>) {
    const validatedData = RefreshTokenSchema.parse(body);
    return this.authService.logout(user.id, validatedData.refreshToken);
  }
}
