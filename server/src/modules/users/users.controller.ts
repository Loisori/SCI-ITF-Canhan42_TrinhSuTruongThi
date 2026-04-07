import {
  Controller,
  Get,
  UseGuards,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserEntity, UserRole } from './entities/user.entity';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@GetUser() user: UserEntity): Promise<Partial<UserEntity>> {
    const freshUser = await this.usersService.findById(user.id);
    if (!freshUser) return {};
    const { password: _, ...rest } = freshUser;
    return rest;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async updateAvatar(
    @GetUser('id') userId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePassword(
    @GetUser('id') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(userId, dto);
    return { message: 'Đổi mật khẩu thành công' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('preferences/category/:categoryId/toggle')
  async togglePreference(
    @GetUser('id') userId: number,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('type') type: 'favorite' | 'blacklist',
  ) {
    const updatedUser = await this.usersService.toggleCategoryPreference(
      userId,
      categoryId,
      type,
    );
    if (!updatedUser) return null;
    const { password: _, ...rest } = updatedUser;
    return rest;
  }

  // Admin-only routes
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(): Promise<Partial<UserEntity>[]> {
    const users = await this.usersService.findAll();
    return users.map(({ password: _, ...rest }) => rest);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Partial<UserEntity> | null> {
    const updatedUser = await this.usersService.updateRole(
      id,
      updateRoleDto.role,
    );
    if (updatedUser) {
      const { password: _, ...rest } = updatedUser;
      return rest;
    }
    return null;
  }
}
