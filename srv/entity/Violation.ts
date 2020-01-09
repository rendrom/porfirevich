import {
  Entity,
  PrimaryGeneratedColumn,
  AfterInsert,
  BeforeRemove,
  Column,
  ManyToOne,
  getRepository
} from 'typeorm';
import { User } from './User';
import { Story } from './Story';

@Entity()
export class Violation {
  @PrimaryGeneratedColumn()
  id!: string;

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @Column({ type: 'int', nullable: true })
  userId?: number | null;

  @ManyToOne(() => Story)
  story?: Story;

  @Column({ type: 'string', nullable: true })
  storyId?: string | null;

  @Column({ nullable: true, length: 300 })
  comment?: string;
}
