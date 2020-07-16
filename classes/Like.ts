import { User } from './User';
import { Story } from './Story';

export class Like {
  id!: string;

  user?: User;

  userId?: number | null;

  story?: Story;

  storyId?: string | null;
}
