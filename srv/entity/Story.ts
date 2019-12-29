import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  Generated
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';

@Entity()
@Unique(['id', 'editId'])
export class Story {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @Generated('uuid')
  editId!: string;

  @Column()
  @IsNotEmpty()
  content!: string;

  @Column({nullable: true, length: 300})
  description?: string;

  @Column()
  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt!: Date;

}
