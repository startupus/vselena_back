import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockRefreshTokenRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      mockUsersService.findByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should create user if email does not exist', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      };

      const createdUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(createdUser);

      const result = await service.register(registerDto);

      expect(result).toEqual(createdUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        })
      );
    });
  });

  describe('validateUser', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        isActive: false,
      };

      mockUsersService.findByEmail.mockResolvedValue(user);

      await expect(service.validateUser('test@example.com', 'password')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});
