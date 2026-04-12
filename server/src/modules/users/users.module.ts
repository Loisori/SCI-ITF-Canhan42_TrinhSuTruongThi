import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UserEntity } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UserMediaEntity } from './entities/user-media.entity';
import { MediaModule } from '../media/media.module';
import { ProjectCategoryEntity } from '../projects/entities/category.entity';
import { KycEntity } from './entities/kyc.entity';
import { KycService } from './kyc.service';
import { KycController } from './kyc.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      UserMediaEntity,
      ProjectCategoryEntity,
      KycEntity,
    ]),
    MediaModule,
  ],
  providers: [UsersService, KycService],
  controllers: [UsersController, KycController],
  exports: [UsersService, KycService],
})
export class UsersModule {}

