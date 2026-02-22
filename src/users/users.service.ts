import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './users.entity';
import { UpdateUserDto, CreateUserDto, LoginUserDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepo: Repository<Users>,
  ) {}

  // Validation helpers
  private validateUsername(username: string): void {
    if (!username) return; // Optional field
    if (username.length > 10) {
      throw new BadRequestException('Username must be 10 characters or less');
    }
    if (username.includes(' ')) {
      throw new BadRequestException('Username cannot contain spaces');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      throw new BadRequestException('Username can only contain letters, numbers, underscores, and hyphens');
    }
  }

  private validateName(name: string): void {
    if (!name) return; // Optional field
    if (name.length > 30) {
      throw new BadRequestException('Full name must be 30 characters or less');
    }
  }

  private validatePassword(password: string): void {
    if (!password) return; // Optional field
    // Password is case-sensitive by default in database
    // No length limit specified
    if (password.length === 0) {
      throw new BadRequestException('Password cannot be empty');
    }
  }

  // Check database backend
  async checkdb(): Promise<string> {
    try {
      await this.usersRepo.query('SELECT 1');
      return 'Database connected successfully';
    } catch (error) {
      return `Database connection failed: ${error.message}`;
    }
  }

  // Insert data into database backend
  async insert(body: { name: string; email: string }): Promise<Users> {
    const user = this.usersRepo.create(body);
    return await this.usersRepo.save(user);
  }

  // Display all users from database backend
  async findAll(): Promise<Users[]> {
    return await this.usersRepo.find();
  }

  // Find user by ID
  async findOne1(id: number): Promise<Users> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // Update user data
  async update(id: number, updateUserDto: UpdateUserDto): Promise<Users> {
    const user = await this.findOne1(id);
    
    // Validate fields if provided
    if (updateUserDto.username) {
      this.validateUsername(updateUserDto.username);
    }
    if (updateUserDto.name) {
      this.validateName(updateUserDto.name);
    }
    if (updateUserDto.password) {
      this.validatePassword(updateUserDto.password);
      
      // If changing password, verify old password
      if (updateUserDto.oldPassword) {
        if (user.password !== updateUserDto.oldPassword) {
          throw new BadRequestException('Old password is incorrect');
        }
      }
    }
    
    Object.assign(user, updateUserDto);
    return await this.usersRepo.save(user);
  }

  // Delete user by ID
  async delete(id: number): Promise<{ message: string }> {
    const user = await this.findOne1(id); // Ensure user exists
    await this.usersRepo.remove(user);
    return { message: `User with ID ${id} deleted successfully` };
  }

  // Register new user
  async register(createUserDto: CreateUserDto): Promise<Users> {
    // Validate inputs
    if (createUserDto.username) {
      this.validateUsername(createUserDto.username);
    }
    if (createUserDto.name) {
      this.validateName(createUserDto.name);
    }
    if (createUserDto.password) {
      this.validatePassword(createUserDto.password);
    }

    const existing = await this.usersRepo.findOne({
        where: { email: createUserDto.email },
    });
    if (existing) {
        throw new ConflictException(`Email ${createUserDto.email} already registered`);
    }
    const user = this.usersRepo.create({
        name: createUserDto.name,
        username: createUserDto.username,
        email: createUserDto.email,
        password: createUserDto.password,
    });
    return await this.usersRepo.save(user);
  }

  // Login user (case-sensitive password)
  async login(
      loginDto: LoginUserDto,
  ): Promise<{ id: number; email: string; name?: string; username?: string; message: string }> {
      const user = await this.usersRepo.findOne({
          where: { email: loginDto.email },
      });
      if (!user) {
          throw new NotFoundException('Invalid email or password');
      }
      
      // Case-sensitive password comparison
      if (user.password !== loginDto.password) {
          throw new NotFoundException('Invalid email or password');
      }
      
      return { id: user.id, email: user.email, name: user.name || '', username: user.username || '', message: 'Login successful' };
  }

  // Change password
  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.findOne1(id);

    // Verify old password
    if (user.password !== oldPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Validate new password
    if (!newPassword || newPassword.length === 0) {
      throw new BadRequestException('New password cannot be empty');
    }

    if (oldPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Update password
    user.password = newPassword;
    await this.usersRepo.save(user);

    return { message: 'Password changed successfully' };
  }
