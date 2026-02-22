import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from '../users/users.entity';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => Users, user => user.id)
  @JoinColumn({ name: 'userId' })
  user: Users;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: false })
  isPrivate: boolean;

  @Column({ type: 'text', nullable: true })
  projectContent?: string;
  @CreateDateColumn()
  createdAt: Date;
}
