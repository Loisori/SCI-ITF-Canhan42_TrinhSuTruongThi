import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { BlogEntity, BlogStatus } from './blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService {
  constructor(
    @InjectRepository(BlogEntity)
    private readonly blogsRepository: Repository<BlogEntity>,
  ) {}

  async getPublishedBlogs(page = 1, pageSize = 9, search?: string) {
    const normalized = this.normalizePagination(page, pageSize);
    const where = search?.trim()
      ? [
          { status: BlogStatus.PUBLISHED, title: Like(`%${search.trim()}%`) },
          {
            status: BlogStatus.PUBLISHED,
            category: Like(`%${search.trim()}%`),
          },
        ]
      : { status: BlogStatus.PUBLISHED };

    const [items, total] = await this.blogsRepository.findAndCount({
      where,
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (normalized.page - 1) * normalized.pageSize,
      take: normalized.pageSize,
    });

    return {
      items: items.map((blog) => this.serializeBlog(blog)),
      page: normalized.page,
      pageSize: normalized.pageSize,
      total,
    };
  }

  async getPublishedBlogBySlug(slug: string) {
    const blog = await this.blogsRepository.findOne({
      where: { slug, status: BlogStatus.PUBLISHED },
      relations: ['author'],
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return this.serializeBlog(blog);
  }

  async getAdminBlogs(page = 1, pageSize = 10, search?: string) {
    const normalized = this.normalizePagination(page, pageSize);
    const where = search?.trim()
      ? [
          { title: Like(`%${search.trim()}%`) },
          { category: Like(`%${search.trim()}%`) },
          { slug: Like(`%${search.trim()}%`) },
        ]
      : {};

    const [items, total] = await this.blogsRepository.findAndCount({
      where,
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (normalized.page - 1) * normalized.pageSize,
      take: normalized.pageSize,
    });

    return {
      items: items.map((blog) => this.serializeBlog(blog)),
      page: normalized.page,
      pageSize: normalized.pageSize,
      total,
    };
  }

  async getAdminBlog(id: number) {
    const blog = await this.blogsRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return this.serializeBlog(blog);
  }

  async createBlog(authorId: number, dto: CreateBlogDto) {
    const title = dto.title.trim();
    const category = dto.category.trim();
    const content = dto.content.trim();

    if (!title || !category || !content) {
      throw new BadRequestException('title, category and content are required');
    }

    const blog = this.blogsRepository.create({
      title,
      slug: await this.generateUniqueSlug(title),
      content,
      thumbnailUrl: dto.thumbnailUrl?.trim() || null,
      authorId,
      category,
      status: dto.status ?? BlogStatus.DRAFT,
    });

    return this.serializeBlog(await this.blogsRepository.save(blog));
  }

  async updateBlog(id: number, dto: UpdateBlogDto) {
    const blog = await this.blogsRepository.findOne({ where: { id } });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    if (dto.title !== undefined) {
      const nextTitle = dto.title.trim();
      if (!nextTitle) throw new BadRequestException('title is required');
      if (nextTitle !== blog.title) {
        blog.slug = await this.generateUniqueSlug(nextTitle, id);
      }
      blog.title = nextTitle;
    }

    if (dto.content !== undefined) {
      const nextContent = dto.content.trim();
      if (!nextContent) throw new BadRequestException('content is required');
      blog.content = nextContent;
    }

    if (dto.category !== undefined) {
      const nextCategory = dto.category.trim();
      if (!nextCategory) throw new BadRequestException('category is required');
      blog.category = nextCategory;
    }

    if (dto.thumbnailUrl !== undefined) {
      blog.thumbnailUrl = dto.thumbnailUrl.trim() || null;
    }

    if (dto.status !== undefined) {
      blog.status = dto.status;
    }

    return this.serializeBlog(await this.blogsRepository.save(blog));
  }

  async deleteBlog(id: number) {
    const blog = await this.blogsRepository.findOne({ where: { id } });
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    await this.blogsRepository.remove(blog);
    return { message: 'Blog deleted successfully' };
  }

  private async generateUniqueSlug(title: string, excludeId?: number) {
    const baseSlug = this.slugify(title);
    let slug = baseSlug;
    let suffix = 2;

    while (true) {
      const existing = await this.blogsRepository.findOne({ where: { slug } });
      if (!existing || existing.id === excludeId) {
        return slug;
      }
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  private slugify(value: string) {
    const slug = value
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return slug || `blog-${Date.now()}`;
  }

  private normalizePagination(page: number, pageSize: number) {
    const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1;
    const normalizedPageSize =
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.min(Math.round(pageSize), 50)
        : 10;
    return {
      page: Math.round(normalizedPage),
      pageSize: normalizedPageSize,
    };
  }

  private serializeBlog(blog: BlogEntity) {
    return {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      excerpt: this.buildExcerpt(blog.content),
      thumbnailUrl: blog.thumbnailUrl,
      authorId: blog.authorId,
      category: blog.category,
      status: blog.status,
      createdAt: blog.createdAt,
      author: blog.author
        ? {
            id: blog.author.id,
            fullName: blog.author.fullName,
            avatarUrl: blog.author.avatarUrl,
          }
        : null,
    };
  }

  private buildExcerpt(content: string) {
    return content
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/\[[^\]]+\]\([^)]+\)/g, '')
      .replace(/[#>*_`~|-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 180);
  }
}
