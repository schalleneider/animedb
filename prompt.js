import prompt from 'prompt';
import chalk from 'chalk';

class Prompt {

    static async askConfirmation(message) {
        console.log(chalk.yellow(message));
        let schema = {
            properties: {
                answer: {
                    description: chalk.yellow('enter your answer: [y] or [n]'),
                    message: chalk.red('answer must be either [y] or [n]'),
                    pattern: /^(y|n)$/,
                    required: true
              }
            }
        };
        prompt.start();
        let answer = await prompt.get(schema);
        return answer.answer === "y";
    }

    static async askCautionConfirmation(message) {
        console.log(chalk.red('CAUTION: ' + message));
        let schema = {
            properties: {
                answer: {
                    description: chalk.red('enter your answer: [y] or [n]'),
                    message: chalk.red('answer must be either [y] or [n]'),
                    pattern: /^(y|n)$/,
                    required: true
              }
            }
        };
        prompt.start();
        let answer = await prompt.get(schema);
        return answer.answer === "y";
    }
}

export { Prompt };