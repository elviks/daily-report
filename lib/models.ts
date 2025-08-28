import { ObjectId } from 'mongodb';

// Tenant Schema
export interface Tenant {
  _id?: ObjectId;
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Schema with tenant support
export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  profileImage?: string;
  isAdmin: boolean;
  tenantId: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
  isActive?: boolean;
}

// Report Schema with tenant support
export interface Report {
  _id?: ObjectId;
  tenantId: ObjectId;
  userId: ObjectId;
  date: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Notification Schema with tenant support
export interface Notification {
  _id?: ObjectId;
  tenantId: ObjectId;
  userId: ObjectId;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Database collection names
export const COLLECTIONS = {
  TENANTS: 'tenants',
  USERS: 'users',
  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications'
} as const;
