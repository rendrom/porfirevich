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
  if (!isUserInPgAlredy) {
    const getUserItems = iterEntries({
      connection,
      Entity: User,
      name: 'User',
      findOptions: { take: 1000 }
    });

    for await (const items of getUserItems) {
      await userPgRepository
      .createQueryBuilder()
      .insert()
      .values(items)
      .execute()
    }
  }

  const storyPgRepository = connectionPg.getRepository(Story);
  const likePgRepository = connectionPg.getRepository(Like);
  const getStoryItems = iterEntries({
    connection,
    Entity: Story,
    name: 'Story',
    findOptions: {
      relations: ['likes'],
      take: 1000
    }
  });

  for await (const items of getStoryItems) {


    const newStories = await storyPgRepository
      .createQueryBuilder()
      .insert()
      .values(items)
      .returning('id')
      .execute()

    let num = 0
    for (const item of items) {
      if (item.likes.length) {
        await likePgRepository
          .createQueryBuilder()
          .insert()
          .values(item.likes.map((x) => ({...x, storyId: newStories.raw[num].id})))
          .execute()
      }
      num += 1
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
}): AsyncGenerator<E[], void, unknown> {
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
    }
    console.log(
      `${name} - ${Math.ceil((counter / total) * 100)}% ${counter}/${total}`
    );
    yield resp;
  }
}

moveToPg();
