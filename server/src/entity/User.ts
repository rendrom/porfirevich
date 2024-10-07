import * as bcrypt from 'bcryptjs';
import { IsEmail, Length } from 'class-validator';
import {
  AfterUpdate,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  getRepository,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Like } from './Like';
import { Story } from './Story';

@Entity()
@Index(['email'], { unique: true, where: 'email IS NOT NULL' })
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
  username!: string;

  @Column()
  @Length(4, 100)
  password!: string;

  @Column({ nullable: true })
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
  beforeUpdate() {
    getRepository(Story)
      .createQueryBuilder('story')
      .where('story.userId = :userId', { userId: this.id })
      .update({ isBanned: this.isBanned })
      .execute();
  }
}
