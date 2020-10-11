import { User } from './User';
import { Story } from './Story';
import {
  AfterInsert,
  BeforeRemove,
  Column,
  Entity,
  getRepository,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

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

  @AfterInsert()
  protected async afterInsert() {
    const storyRepository = getRepository(Story);
    if (this.storyId) {
      const story = await storyRepository.findOne(this.storyId);
      if (story) {
        story.likesCount = story.violationsCount + 1;
        await storyRepository.save(story);
      }
    }
  }

  @BeforeRemove()
  protected async beforeRemove() {
    const storyRepository = getRepository(Story);
    if (this.storyId) {
      const story = await storyRepository.findOne(this.storyId);
      if (story && story.likesCount) {
        story.likesCount = story.violationsCount - 1;
        await storyRepository.save(story);
      }
    }
  }
}
