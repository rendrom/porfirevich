import type { Story } from './Story';
import type { User } from './User';

export class Like {
  id!: string;

  user?: User;

  userId?: number | null;

  story?: Story;

  storyId?: string | null;
}
