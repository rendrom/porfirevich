import { createConnection } from 'typeorm';

import ormconfig from '../ormconfig.json';
import { Story } from '../src/entity/Story';

import type { ConnectionOptions } from 'typeorm';
// import { User } from '../src/entity/User';

const setBannedStories = async () => {
  const connection = await createConnection(ormconfig as ConnectionOptions);
  try {
    const rep = connection.getRepository(Story);
    const list = rep
      .createQueryBuilder('story')
      .leftJoin('story.user', 'user')
      .where('user.isBanned = :isBanned', { isBanned: true });
    const stories = await list.getMany();
    const length = stories.length;
    let updatedCount = 0;
    stories.forEach((s) => {
      rep.update(s.id, { isBanned: true }).finally(() => {
        updatedCount += 1;
        const progress = ((100 * updatedCount) / length).toFixed(2) + '%';
        process.stdout.write(progress);
        process.stdout.cursorTo(0);
      });
    });
  } catch (er) {
    console.log(er);
  }
};

setBannedStories();
