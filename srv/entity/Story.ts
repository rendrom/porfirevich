import {
  Entity,
  PrimaryColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Generated,
  ManyToOne
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import shortid from 'shortid';
import { ModelWithUser } from '../interfaces';
import { User } from './User';

@Entity()
@Unique(['id', 'editId'])
export class Story implements ModelWithUser {
  @PrimaryColumn()
  id!: string;

  @ManyToOne(() => User, (author: User) => author.stories)
  user?: User;

  @Column()
  @Generated('uuid')
  editId!: string;

  @Column()
  @IsNotEmpty()
  content!: string;

  @Column({nullable: true, length: 300})
  description?: string;

  @Column({nullable: true})
  postcard?: string;

  @Column({default: 0, type: 'int'})
  viewsCount!: number;

  @Column({default: false, type: 'boolean'})
  isPublic!: boolean;

  @Column()
  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  protected beforeInsert() {
    this.id = shortid.generate();
  }

}
