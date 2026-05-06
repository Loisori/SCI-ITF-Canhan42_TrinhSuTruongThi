import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogEntity } from './blog.entity';
import { BlogsController, AdminBlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';

@Module({
  imports: [TypeOrmModule.forFeature([BlogEntity])],
  controllers: [BlogsController, AdminBlogsController],
  providers: [BlogsService],
})
export class BlogsModule {}
