import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany
} from "typeorm";
import { Length } from "class-validator";
import * as bcrypt from "bcryptjs";
import { Story } from './Story';

@Entity()
@Unique(["username"])
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToMany(() => Story, (story: Story) => story.user)
  stories!: Story[];

  @Column()
  @Length(4, 20)
  username!: string;

  @Column()
  @Length(4, 100)
  password!: string;

  @Column({ default: false })
  isSuperuser!: boolean;

  @Column()
  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  @UpdateDateColumn()
  updatedAt!: Date;

  hashPassword() {
    this.password = bcrypt.hashSync(this.password, 8);
  }

  checkIfUnencryptedPasswordIsValid(unencryptedPassword: string) {
    return bcrypt.compareSync(unencryptedPassword, this.password);
  }
}
