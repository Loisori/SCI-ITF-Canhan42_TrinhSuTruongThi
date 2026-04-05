import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UserMediaEntity } from './entities/user-media.entity';
import { MediaModule } from '../media/media.module';
import { ProjectCategoryEntity } from '../projects/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserMediaEntity,
      ProjectCategoryEntity,
    ]),
    MediaModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
