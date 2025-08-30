import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RedisService } from './redis';
import type { AdminUser } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const DEFAULT_PASSWORD = '0000';

export interface JWTPayload {
  username: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  static async initializeAdminUser(): Promise<void> {
    const existingAdmin = await RedisService.getAdminUser(ADMIN_USERNAME);
    
    if (!existingAdmin) {
      const passwordHash = process.env.ADMIN_PASSWORD_HASH || 
        await bcrypt.hash(DEFAULT_PASSWORD, 10);
      
      await RedisService.createAdminUser({
        username: ADMIN_USERNAME,
        passwordHash,
      });
      
      console.log(`Admin user created: ${ADMIN_USERNAME}`);
    }
  }

  static async validateCredentials(username: string, password: string): Promise<boolean> {
    const user = await RedisService.getAdminUser(username);
    
    if (!user) {
      return false;
    }
    
    return await bcrypt.compare(password, user.passwordHash);
  }

  static generateToken(username: string): string {
    return jwt.sign(
      { username } as JWTPayload,
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      console.log('Verifying token with secret:', JWT_SECRET.substring(0, 10) + '...');
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
      console.log('Token verification successful:', payload.username);
      return payload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  static async login(username: string, password: string): Promise<string | null> {
    const isValid = await this.validateCredentials(username, password);
    
    if (!isValid) {
      return null;
    }
    
    return this.generateToken(username);
  }
}