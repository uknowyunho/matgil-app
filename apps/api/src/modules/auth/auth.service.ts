import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CategoryService } from '../category/category.service';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse extends AuthTokens {
  user: {
    id: string;
    email: string;
    nickname: string;
    profileImageUrl: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly categoryService: CategoryService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      const { email, password, nickname } = registerDto;

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        nickname,
      });

      const savedUser = await this.userRepository.save(user);
      this.logger.log(`User registered: ${savedUser.email}`);

      // Generate tokens
      const tokens = await this.generateTokens(savedUser);

      return {
        ...tokens,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          nickname: savedUser.nickname,
          profileImageUrl: savedUser.profileImageUrl,
          createdAt: savedUser.createdAt.toISOString(),
          updatedAt: savedUser.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      console.error('CRITICAL REGISTER ERROR:', error);
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImageUrl: user.profileImageUrl,
        createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Reject tokens issued before logout (tokenVersion mismatch)
      if (
        payload.tokenVersion !== undefined &&
        payload.tokenVersion !== user.tokenVersion
      ) {
        throw new UnauthorizedException('Token has been revoked');
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    // Increment tokenVersion to invalidate all existing tokens
    await this.userRepository.increment({ id: userId }, 'tokenVersion', 1);
    this.logger.log(`User logged out: ${userId}`);
  }

  async getMe(
    userId: string,
  ): Promise<{
    id: string;
    email: string;
    nickname: string;
    profileImageUrl: string | null;
    createdAt: string;
    updatedAt: string;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  async updateProfile(
    userId: string,
    data: { nickname?: string; latitude?: number; longitude?: number },
  ): Promise<{ id: string; email: string; nickname: string; profileImageUrl: string | null; createdAt: string; updatedAt: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (data.nickname !== undefined) user.nickname = data.nickname;
    if (data.latitude !== undefined) user.latitude = data.latitude;
    if (data.longitude !== undefined) user.longitude = data.longitude;

    const saved = await this.userRepository.save(user);
    this.logger.log(`User profile updated: ${saved.email}`);

    return {
      id: saved.id,
      email: saved.email,
      nickname: saved.nickname,
      profileImageUrl: saved.profileImageUrl,
      createdAt: saved.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: saved.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Cascade delete is handled by TypeORM entity relations (onDelete: 'CASCADE')
    await this.userRepository.remove(user);
    this.logger.log(`User account deleted: ${userId}`);
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: this.configService.get<string>(
          'jwt.accessExpiration',
          '15m',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>(
          'jwt.refreshExpiration',
          '7d',
        ),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
