import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto, UpdateTaskDto } from './task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
  ) {}

  // Create new task
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepo.create(createTaskDto);
    return await this.taskRepo.save(task);
  }

  // Get all tasks
  async findAll(): Promise<Task[]> {
    return await this.taskRepo.find({ relations: ['user'] });
  }

  // Get tasks by user ID
  async findByUserId(userId: number): Promise<Task[]> {
    return await this.taskRepo.find({ 
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  // Get only public tasks by user ID (excludes private)
  async findPublicByUserId(userId: number): Promise<Task[]> {
    return await this.taskRepo.find({
      where: { userId, isPrivate: false },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  // Get single task by ID
  async findOne(id: number): Promise<Task> {
    const task = await this.taskRepo.findOne({ 
      where: { id },
      relations: ['user']
    });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  // Update task
  async update(id: number, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    Object.assign(task, updateTaskDto);
    return await this.taskRepo.save(task);
  }

  // Delete task
  async delete(id: number): Promise<{ message: string }> {
    const task = await this.findOne(id);
    await this.taskRepo.remove(task);
    return { message: `Task with ID ${id} deleted successfully` };
  }
}