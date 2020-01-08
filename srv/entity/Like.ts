import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique
} from 'typeorm';
import { User } from './User';
import { Story } from './Story';

@Entity()
@Unique(['user', 'story'])
export class Like {
  @PrimaryGeneratedColumn()
  id!: string;

  @ManyToOne(
    () => User,
    (author: User) => author.likes
  )
  user?: User;

  @Column({ type: 'int', nullable: true })
  userId?: number | null;

  @ManyToOne(
    () => Story,
    (story: Story) => story.likes
  )
  story?: Story;

  @Column({ type: 'string', nullable: true })
  storyId?: string | null;
}
