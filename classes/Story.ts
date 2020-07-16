import { User } from './User';
import { Like } from './Like';

export class Story {
  id!: string;
  user?: User;
  likes!: Like[];
  userId?: number | null;
  likesCount!: number;
  editId!: string;
  content!: string;
  description?: string;
  postcard?: string;
  viewsCount!: number;
  isPublic!: boolean;
  isDeleted!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
