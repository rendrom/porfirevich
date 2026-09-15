import * as bcrypt from 'bcryptjs';
import { IsEmail, IsOptional, Length } from 'class-validator';
import {
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import dataSource from '../data-source';
import { Like } from './Like';
import { Story } from './Story';

@Entity()
@Index('IDX_9e3516cf97a57b6f6199fa95a8', ['email'], {
  unique: true,
  where: 'email IS NOT NULL',
})
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  uid!: string;

  @OneToMany(() => Story, (story: Story) => story.user)
  stories!: Story[];

  @OneToMany(() => Like, (like: Like) => like.user)
  likes!: Like[];

  @Column()
  @Length(1, 100)
  username!: string;

  @Column()
  @Length(4, 100)
  password!: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Column({ default: false })
  isSuperuser!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: 'porfirevich' })
  provider!: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ default: false })
  isBanned!: boolean;

  hashPassword() {
    this.password = bcrypt.hashSync(this.password, 8);
  }

  checkIfUnencryptedPasswordIsValid(unencryptedPassword: string) {
    return bcrypt.compareSync(unencryptedPassword, this.password);
  }

  @BeforeUpdate()
  async beforeUpdate() {
    await dataSource
      .getRepository(Story)
      .update({ userId: this.id }, { isBanned: this.isBanned });
  }
}
