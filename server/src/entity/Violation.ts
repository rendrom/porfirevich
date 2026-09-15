import {
  AfterInsert,
  BeforeRemove,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import dataSource from '../data-source';
import { Story } from './Story';
import { User } from './User';

@Entity()
export class Violation {
  @PrimaryGeneratedColumn()
  id!: string;
  @ManyToOne(() => User, (author: User) => author.likes)
  user?: User;
  @Column({ type: 'int', nullable: true })
  userId?: number | null;
  @ManyToOne(() => Story, (story: Story) => story.violations)
  story?: Story;
  @Column({ type: 'varchar', nullable: true })
  storyId?: string | null;
  @Column({ nullable: true })
  comment?: string;

  @AfterInsert()
  protected async afterInsert() {
    const storyRepository = dataSource.getRepository(Story);
    if (this.storyId) {
      await storyRepository.increment(
        { id: this.storyId },
        'violationsCount',
        1,
      );
    }
  }

  @BeforeRemove()
  protected async beforeRemove() {
    const storyRepository = dataSource.getRepository(Story);
    if (this.storyId) {
      await storyRepository
        .createQueryBuilder()
        .update(Story)
        .set({ violationsCount: () => 'GREATEST("violationsCount" - 1, 0)' })
        .where({ id: this.storyId })
        .execute();
    }
  }
}
