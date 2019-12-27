import Story from '../models/Story'
import StoryApiResponse from '../models/StoryApiResponse';


export default class StoryService {
  async getStory (id: string): Promise<string> {
    const data = await fetch('/api/story');
    const json = await data.json() as StoryApiResponse
    return json.text;
  }

}
