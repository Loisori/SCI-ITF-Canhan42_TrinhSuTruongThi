import { Controller, Get, UseGuards, Patch, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { UserEntity, UserRole } from './entities/user.entity';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@GetUser() user: UserEntity): Promise<Partial<UserEntity>> {
    const { password, ...rest } = user;
    return rest;
  }

  // Admin-only routes
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async findAll(): Promise<Partial<UserEntity>[]> {
    const users = await this.usersService.findAll();
    return users.map(({ password, ...rest }) => rest);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Partial<UserEntity> | null> {
    const updatedUser = await this.usersService.updateRole(+id, updateRoleDto.role);
    if (updatedUser) {
      const { password, ...rest } = updatedUser;
      return rest;
    }
    return null;
  }
}
