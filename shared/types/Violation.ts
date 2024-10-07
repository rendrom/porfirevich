import type { Story } from './Story';
import type { User } from './User';

export class Violation {
  id!: string;
  user?: User;

  userId?: number | null;

  story?: Story;

  storyId?: string | null;

  comment?: string;
}
