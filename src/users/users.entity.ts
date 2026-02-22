import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity('users') // 'users' is the table name
export class Users {
  @PrimaryGeneratedColumn() // Auto-increment ID
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  username?: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany('Task', 'user')
  tasks: any[];
}
