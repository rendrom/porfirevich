import { createConnection } from 'typeorm';
import chalk from 'chalk';
import { User } from '../srv/entity/User';
import prompts from 'prompts';
const ormconfig = require('../ormconfig.json');

let email: string | null = null;
// const myArgs = process.argv.slice(2);
// console.log('myArgs: ', myArgs);
// email = myArgs[0];

const setSuperuser = async () => {
  const connection = await createConnection(ormconfig);

  const response = await prompts({
    type: 'text',
    name: 'email',
    message: 'Enter the email of the user you want to make superuser'
  });

  email = response.email;
  if (email) {
    const userRepository = connection.getRepository(User);
    try {
      const user = await userRepository.findOneOrFail({ where: { email } });
      user.isSuperuser = true;
      await userRepository.save(user);
      console.log(chalk.green(`User ${email} in now superuser`));
    } catch (error) {
      console.log(chalk.red(`Can't find user with email ${email}`));
    }
  }
};

setSuperuser();
