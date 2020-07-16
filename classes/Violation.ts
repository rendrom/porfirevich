import { User } from './User';
import { Story } from './Story';

export class Violation {
  id!: string;
  user?: User;

  userId?: number | null;

  story?: Story;

  storyId?: string | null;

  comment?: string;
}
