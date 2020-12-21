import Vorpal = require('vorpal');
import { Args, CommandInstance } from "vorpal";
import { checkOpgaver, SortedOpgaver } from './get-opgaver';
import chalk = require('chalk');

const vorpal = new Vorpal();
let opgaver: SortedOpgaver[] = [];
(async function() {opgaver = await checkOpgaver()}());

const Colors = {
    a: 'greenBright',
    b: 'yellowBright',
    c: 'magentaBright',
    missing: 'redBright',
    g: 'cyanBright'
}

console.clear();

vorpal.command('all', 'Quick view over the tasks')
    .alias('overview').alias('list')
    .action(async function (this: CommandInstance, args: Args) {
        let longestKapitel = opgaver.reduce((acc, cur) => acc < cur.kapitel.length ? cur.kapitel.length : acc, 0) + 2;
        let tasks: string[] = ['\n'];
        tasks = opgaver.map(category => {
            return `${category.kapitel.padEnd(longestKapitel, ' ')}|  ` +
                          chalk[Colors.a]`A: ${('' + (category.a || '').length).padEnd(3, ' ')}  ` +
                          chalk[Colors.b]`B: ${('' + (category.b || '').length).padEnd(3, ' ')}  ` +
                          chalk[Colors.c]`C: ${('' + (category.c || '').length).padEnd(3, ' ')}  ` +
            chalk[Colors.missing]`Manglende: ${('' + (category.missing || '').length).padEnd(3, ' ')}  ` +
              chalk[Colors.g]`Genaflevering: ${('' + (category.g || '').length).padEnd(3, ' ')}  `
        })

        tasks.unshift('');
        tasks.push('');
        console.log(tasks.join('\n'));
    });

vorpal.command('view [chapter]', 'View a chapter')
    .alias('info').alias('show')
    .option('-L, --list', 'List chapters')
    .option('--hide-a', 'Hides A tasks')
    .option('-h, --hide-empty', 'Hides empty tasks')
    .action(async function (this: CommandInstance, args: Args) {
        let chapterName: string;
        let chapter: SortedOpgaver;
        
        if(args.options.list || !args.chapter) {
            let prompt = await this.prompt({
                type: 'list',
                message: 'Choose a chapter to view',
                name: 'chapter',
                choices: opgaver.map(chp => chp.kapitel)
            });

            chapterName = prompt.chapter;
            chapter = opgaver.find(chp => chp.kapitel == chapterName) || <SortedOpgaver>{};
        } else {
            let chapterSearch = opgaver.find(chp => chp.kapitel == args.chapter);
            if(!chapterSearch) {
                console.log(chalk.redBright`The specifed chapter "${args.chapter}" doesn't exist`);
                console.log('Hint: ' + chalk.cyanBright`Chapters are case sensitive \n`);
                return;
            }

            chapter = chapterSearch;
            chapterName = chapter.kapitel
        }

        let categorysToShow = { a: 'A', b: 'B', c: 'C', missing: 'Missing', g: 'Genafleverings' };
        if(args.options['hide-a']) categorysToShow.a = (undefined as any);
        if(args.options['hide-empty'])
            Object.keys(categorysToShow).forEach(key => {if(!chapter[key]) categorysToShow[key] = (undefined as any)});

        console.log(chalk.bold`${chapterName}`);
        console.log('‾'.repeat(chapterName.length));

        console.log(Object.entries(categorysToShow).filter((x) => x[1]).map(category => {
            let [key, title] = category;
            if(!chapter[key]) return chalk[Colors[key]]`${title} Assignments \n` + `[${chalk[Colors[key]]('Empty')}]`;
            let tasks = chapter[key];
            return chalk[Colors[key]]`${title} Assignments  \n` +
            `${tasks.map(task => `[${chalk[Colors[key]](task)}]`).join(', ')}`;
        }).join('\n\n') + '\n');
    });

vorpal.command('update', 'Updates the tasks')
    .action(async function (this: CommandInstance, args: Args) {
        opgaver = await checkOpgaver();
        this.log('Tasks updated');
    });

vorpal.command('clear', 'Clears the screen')
    .alias('cls')
    .action(async function (this: CommandInstance, args: Args) {
        console.clear();
    })

vorpal
    .delimiter('ManglendeOpgaver>')
    .show();