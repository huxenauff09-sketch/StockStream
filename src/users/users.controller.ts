import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, CreateUserDto, LoginUserDto } from './users.dto';
import { Users } from './users.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly userservice: UsersService) {}

  // Check database connection
  @Get('db')
  async checkdatabase(): Promise<string> {
    return await this.userservice.checkdb();
  }

  // Display all users (must be before :id route)
  @Get('display')
  async findAll(): Promise<Users[]> {
    return await this.userservice.findAll();
  }

  // Register user (email + password)
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<Users> {
    return await this.userservice.register(createUserDto);
  }

  // Login user (email + password)
  @Post('login')
  async login(
    @Body() loginDto: LoginUserDto,
  ): Promise<{ id: number; email: string; message: string }> {
    return await this.userservice.login(loginDto);
  }

  // Insert user info
  @Post('users')
  async insert(@Body() body: { name: string; email: string }): Promise<Users> {
    return await this.userservice.insert(body);
  }

  // Get single user by ID (must be after static routes)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Users> {
    return this.userservice.findOne1(id);
  }

  // Update user
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Users> {
    return this.userservice.update(id, updateUserDto);
  }

  // Change password endpoint
  @Post(':id/change-password')
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { oldPassword: string; newPassword: string },
  ): Promise<{ message: string }> {
    return this.userservice.changePassword(id, body.oldPassword, body.newPassword);
  }

  // Delete user
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.userservice.delete(id);
  }
}
