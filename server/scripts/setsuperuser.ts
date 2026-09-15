import prompts from 'prompts';

import { connectDatabase } from '../src/database';
import { User } from '../src/entity/User';

let email: string | null = null;
// const myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);
// email = myArgs[0];

const setSuperuser = async () => {
  const connection = await connectDatabase();

  const response = await prompts({
    type: 'text',
    name: 'email',
    message: 'Enter the email of the user you want to make superuser',
  });

  email = response.email;
  if (email) {
    const userRepository = connection.getRepository(User);
    try {
      const user = await userRepository.findOneOrFail({ where: { email } });
      user.isSuperuser = true;
      await userRepository.save(user);
      console.log(`User ${email} is now superuser`);
    } catch {
      console.error(`Can't find user with email ${email}`);
    }
  }
};

setSuperuser();
