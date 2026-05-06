export type BlogStatus = "draft" | "published";

export type BlogAuthor = {
  id: number;
  fullName: string;
  avatarUrl?: string | null;
} | null;

export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnailUrl?: string | null;
  authorId: number;
  category: string;
  status: BlogStatus;
  createdAt: string;
  author: BlogAuthor;
};

export type BlogListResponse = {
  items: BlogPost[];
  page: number;
  pageSize: number;
  total: number;
};
