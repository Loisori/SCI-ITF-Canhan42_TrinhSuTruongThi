import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  getPublishedBlogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.blogsService.getPublishedBlogs(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 9,
      search,
    );
  }

  @Get(':slug')
  getPublishedBlogBySlug(@Param('slug') slug: string) {
    return this.blogsService.getPublishedBlogBySlug(slug);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/blogs')
export class AdminBlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  getBlogs(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
  ) {
    return this.blogsService.getAdminBlogs(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
      search,
    );
  }

  @Get(':id')
  getBlog(@Param('id', ParseIntPipe) id: number) {
    return this.blogsService.getAdminBlog(id);
  }

  @Post()
  createBlog(@GetUser('id') authorId: number, @Body() dto: CreateBlogDto) {
    return this.blogsService.createBlog(authorId, dto);
  }

  @Patch(':id')
  updateBlog(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBlogDto) {
    return this.blogsService.updateBlog(id, dto);
  }

  @Delete(':id')
  deleteBlog(@Param('id', ParseIntPipe) id: number) {
    return this.blogsService.deleteBlog(id);
  }
}
