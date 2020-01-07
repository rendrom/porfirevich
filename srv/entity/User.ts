import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index
} from 'typeorm';
import { Length, IsEmail } from 'class-validator';
import * as bcrypt from 'bcryptjs';
import { Story } from './Story';

@Entity()
@Index(['email'], { unique: true, where: 'email IS NOT NULL' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  uid!: string;

  @OneToMany(
    () => Story,
    (story: Story) => story.user
  )
  stories!: Story[];

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

  @Column()
  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: 'porfirevich' })
  provider!: string;

  @Column({ nullable: true })
  photoUrl?: string;

  hashPassword() {
    this.password = bcrypt.hashSync(this.password, 8);
  }

  checkIfUnencryptedPasswordIsValid(unencryptedPassword: string) {
    return bcrypt.compareSync(unencryptedPassword, this.password);
  }
}
