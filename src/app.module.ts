import { Module } from '@nestjs/common';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './users/users.entity';
import { Task } from './tasks/task.entity';
import { TaskModule } from './tasks/task.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3307,
      username: 'root',
      password: '',
      database: 'market',
      entities: [Users, Task],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Users]),
    TaskModule,
  ],

  controllers: [UsersController],
  providers: [UsersService],
})
export class AppModule {}
