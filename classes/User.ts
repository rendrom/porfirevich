import { Story } from './Story';
import { Like } from './Like';

export class User {
  id!: number;
  uid!: string;
  stories!: Story[];
  likes!: Like[];
  username!: string;
  password!: string;
  email?: string;
  isSuperuser!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  provider!: string;
  photoUrl?: string;
  isBanned!: boolean;
}
