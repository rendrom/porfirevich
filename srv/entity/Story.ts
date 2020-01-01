import {
  Entity,
  PrimaryColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  Generated
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import shortid from 'shortid';

@Entity()
@Unique(['id', 'editId'])
export class Story {
  @PrimaryColumn()
  id!: string;

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
