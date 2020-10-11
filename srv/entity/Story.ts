import {
  Entity,
  PrimaryColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Generated,
  ManyToOne,
  OneToMany
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import shortid from 'shortid';
// import { ModelWithUser } from '../interfaces';
import { User } from './User';
import { Like } from './Like';
import { Violation } from './Violation';

@Entity()
@Unique(['id', 'editId'])
export class Story {
  @PrimaryColumn()
  id!: string;

  @ManyToOne(
    () => User,
    (author: User) => author.stories,
    { onDelete: 'CASCADE' }
  )
  user?: User;

  @OneToMany(
    () => Like,
    (like: Like) => like.story
  )
  likes!: Like[];

  @OneToMany(
    () => Violation,
    (violation: Violation) => violation.story
  )
  violations!: Violation[];

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

  @Column()
  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: 0, type: 'int' })
  violationsCount!: number;

  @Column({ default: false })
  isBanned!: boolean;

  @BeforeInsert()
  protected beforeInsert() {
    this.id = shortid.generate();
  }
}
