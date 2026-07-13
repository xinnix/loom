// Define local types
// Note: AppRouter type has been removed from @roundtable/shared to avoid circular dependency
export interface Todo {
  id: string;
  title: string;
  description?: string;
  isCompleted?: boolean;
  priority?: 1 | 2 | 3;
  dueDate?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Test {
  id: string | number;
  name: string;
  description?: string;
  status?: 'active' | 'inactive';
  sortOrder?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Category {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  parentId?: string | number;
  level?: number;
  sortOrder?: number;
  icon?: string;
  cover?: string;
  status?: 'active' | 'inactive';
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Product {
  id: string | number;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  categoryId: string | number;
  brand?: string;
  stock: number;
  minStock: number;
  weight?: number;
  dimensions?: string;
  images?: string;
  status?: 'active' | 'inactive' | 'discontinued';
  featured?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Blog {
  id: string | number;
  title: string;
  content: string;
  summary?: string;
  cover?: string;
  categoryId?: string | number;
  tags?: string;
  status?: 'draft' | 'published' | 'archived';
  authorId: string | number;
  viewCount?: number;
  publishedAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Article {
  id: string | number;
  title: string;
  content: string;
  summary?: string;
  cover?: string;
  categoryId?: string | number;
  tags?: string;
  status?: 'draft' | 'published' | 'archived';
  authorId: string | number;
  viewCount?: number;
  publishedAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface User {
  id: string | number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isActive?: boolean;
  emailVerified?: string | Date;
  lastLoginAt?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  roles?: any[];
  permissions?: string[];
}

export interface Role {
  id: string | number;
  name: string;
  slug: string;
  level?: number;
  description?: string;
  isSystem?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
