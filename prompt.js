import prompt from 'prompt';
import chalk from 'chalk';

class Prompt {

    static async askConfirmation(message) {
        console.log(chalk.yellow(message));
        let schema = {
            properties: {
                answer: {
                    description: chalk.yellow('enter your answer: [yes] or [no]'),
                    message: chalk.red('answer must be either [yes] or [no]'),
                    pattern: /^(yes|no)$/,
                    required: true
              }
            }
        };
        prompt.start();
        let answer = await prompt.get(schema);
        return answer.answer === "yes";
    }
}

export { Prompt };