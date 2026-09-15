import {
  AfterInsert,
  BeforeRemove,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import dataSource from '../data-source';
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

  @Column({ type: 'varchar', nullable: true })
  storyId?: string | null;

  @AfterInsert()
  protected async afterInsert() {
    const storyRepository = dataSource.getRepository(Story);
    if (this.storyId) {
      await storyRepository.increment({ id: this.storyId }, 'likesCount', 1);
    }
  }

  @BeforeRemove()
  protected async beforeRemove() {
    const storyRepository = dataSource.getRepository(Story);
    if (this.storyId) {
      await storyRepository
        .createQueryBuilder()
        .update(Story)
        .set({ likesCount: () => 'GREATEST("likesCount" - 1, 0)' })
        .where({ id: this.storyId })
        .execute();
    }
  }
}
