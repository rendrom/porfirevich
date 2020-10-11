import { User } from './User';
import { Story } from './Story';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Violation {
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
    (story: Story) => story.violations
  )
  story?: Story;
  @Column({ type: 'int', nullable: true })
  storyId?: string | null;
  @Column({ nullable: true })
  comment?: string;
}
