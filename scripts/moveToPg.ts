import {
  Connection,
  createConnections,
  EntitySchema,
  FindManyOptions,
  IsNull,
  Not,
  ObjectType
} from 'typeorm';
import { Like } from '../srv/entity/Like';

import { Story } from '../srv/entity/Story';
import { User } from '../srv/entity/User';

const ormconfigSqlite = require('../ormconfig_sqlite.json');
const ormconfig = require('../ormconfig.json');

const moveToPg = async () => {
  const [connection, connectionPg] = await createConnections([
    ormconfigSqlite,
    ormconfig
  ]);

  const userPgRepository = connectionPg.getRepository(User);

  const isUserInPgAlredy = await userPgRepository.count();
  if (isUserInPgAlredy) {
    throw new Error(
      'There are already records in the database, migration is not possible. Clear the `User` table and run arain'
    );
  }

  const pgUserIdUidAlias: Record<number, number> = {};

  const getUserItems = iterEntries({
    connection,
    Entity: User,
    name: 'User',
    findOptions: { take: 1000 }
  });

  for await (const item of getUserItems) {
    const newUser = await userPgRepository.save(item);
    pgUserIdUidAlias[item.id] = newUser.id;
  }

  const storyPgRepository = connectionPg.getRepository(Story);
  const likePgRepository = connectionPg.getRepository(Like);
  const getStoryItems = iterEntries({
    connection,
    Entity: Story,
    name: 'Story',
    findOptions: {
      relations: ['likes'],
      where: { userId: Not(IsNull()) },
      take: 10
    }
  });

  for await (const item of getStoryItems) {
    if (typeof item.userId === 'number') {
      const user = pgUserIdUidAlias[item.userId];
      if (user !== undefined) {
        const newStory = await storyPgRepository.save({
          ...item,
          userId: user
        });

        for await (const like of item.likes) {
          if (typeof like.userId === 'number') {
            const lUser = pgUserIdUidAlias[like.userId];
            if (lUser) {
              await likePgRepository.save({
                ...like,
                userId: lUser,
                storyId: newStory.id
              });
            }
          }
        }
      }
    }
  }
};

async function* iterEntries<E>({
  name,
  Entity,
  connection,
  total,
  findOptions = {}
}: {
  name: string;
  findOptions?: FindManyOptions<E>;
  total?: number;
  connection: Connection;
  Entity: ObjectType<E> | EntitySchema<E> | string;
}): AsyncGenerator<E, void, unknown> {
  const repository = connection.getRepository(Entity);

  total = total !== undefined ? total : await repository.count();
  const take = findOptions.take !== undefined ? findOptions.take : 100;

  const skipChunks = Array.from(
    { length: Math.ceil(total / take) },
    (v, i) => i * take
  );

  let counter = 0;

  for (const skip of skipChunks) {
    const resp = await repository.find({ take, skip, ...findOptions });
    for (const item of resp) {
      counter += 1;
      console.log(
        `${name} - ${Math.ceil((counter / total) * 100)}% ${counter}/${total}`
      );
      yield item;
    }
  }
}

moveToPg();
