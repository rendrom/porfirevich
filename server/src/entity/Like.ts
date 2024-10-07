import {
  AfterInsert,
  BeforeRemove,
  Column,
  Entity,
  getRepository,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Story } from './Story';
import { User } from './User';

@Entity()
@Unique(['user', 'story'])
export class Like {
  @PrimaryGeneratedColumn()
  id!: string;

  @ManyToOne(() => User, (author: User) => author.likes)
  user?: User;

  @Column({ type: 'int', nullable: true })
  userId?: number | null;

  @ManyToOne(() => Story, (story: Story) => story.likes)
  story?: Story;

  @Column({ type: 'string', nullable: true })
  storyId?: string | null;

  @AfterInsert()
  protected async afterInsert() {
    const storyRepository = getRepository(Story);
    if (this.storyId) {
      const story = await storyRepository.findOne(this.storyId);
      if (story) {
        story.likesCount = story.likesCount + 1;
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
        story.likesCount = story.likesCount - 1;
        await storyRepository.save(story);
      }
    }
  }
}
