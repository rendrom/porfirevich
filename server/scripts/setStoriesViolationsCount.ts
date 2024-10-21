import { createConnection } from 'typeorm';


import { Story } from '../src/entity/Story';
import { Violation } from '../src/entity/Violation';
import { ormconfig } from '../orm';



const setBannedStories = async () => {
  const connection = await createConnection(ormconfig);
  try {
    const rep = connection.getRepository(Violation);
    const list = await rep.query(`
    SELECT "v"."storyId" AS "storyId", COUNT("v"."storyId") AS "violationsCount"
    FROM "violation" "v"  GROUP BY "v"."storyId"
    `);

    const storyRep = connection.getRepository(Story);
    const length = list.length;
    let updatedCount = 0;
    list.forEach((s: { storyId: string; violationsCount: number }) => {
      storyRep
        .update(s.storyId, { violationsCount: s.violationsCount })
        .finally(() => {
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
