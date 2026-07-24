import { randomBytes } from 'node:crypto';

import { IsNotEmpty } from 'class-validator';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import type { Story as S } from '../../../shared/types/Story';
import { Like } from './Like';
// import { ModelWithUser } from '../interfaces';
import { User } from './User';
import { Violation } from './Violation';

const STORY_ID_ALPHABET =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
const STORY_ID_LENGTH = 9;

function generateStoryId(): string {
  const bytes = randomBytes(STORY_ID_LENGTH);
  return Array.from(
    bytes,
    (value) => STORY_ID_ALPHABET[value % STORY_ID_ALPHABET.length],
  ).join('');
}

@Entity()
@Unique(['id', 'editId'])
export class Story implements S {
  @PrimaryColumn()
  id!: string;

  @ManyToOne(() => User, (author: User) => author.stories, {
    onDelete: 'CASCADE',
  })
  user?: User;

  @OneToMany(() => Like, (like: Like) => like.story)
  likes!: Like[];

  @OneToMany(() => Violation, (violation: Violation) => violation.story)
  violations!: Violation[];

  // name: 'userid'
  @Column({ type: 'int', nullable: true })
  userId?: number | null;

  @Column({ default: 0, type: 'int' })
  likesCount!: number;

  @Column()
  @Generated('uuid')
  editId!: string;

  @Column()
  @IsNotEmpty()
  content!: string;

  @Column({ nullable: true, length: 300 })
  description?: string;

  @Column({ nullable: true })
  postcard?: string;

  @Column({ default: 0, type: 'int' })
  viewsCount!: number;

  @Column({ default: false, type: 'boolean' })
  isPublic!: boolean;

  @Column({ default: false, type: 'boolean' })
  isDeleted!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: 0, type: 'int' })
  violationsCount!: number;

  @Column({ default: false })
  isBanned!: boolean;

  @BeforeInsert()
  protected beforeInsert() {
    this.id = generateStoryId();
  }
}
