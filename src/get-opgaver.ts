import * as Excel from "exceljs";
import { join } from "path";
import { readdirSync } from "fs";

export type Opgaver = { [index: string]: string[] };
export interface SortedOpgaver {
    kapitel: string;
    a?: string[];
    b?: string[];
    c?: string[];
    g?: string[];
    missing?: string[];
    done?: boolean;
}

function numsFromRange(input: string): string[] {
    let [from, to] = input.split('-').map(Number);
    if (!to) return [('000' + from).slice(-3)];
    return Array.from({ length: to - from + 1 }, (_, i) => ('000' + (from + i)).slice(-3));
}

let pathToAarhusTECH = join(require('os').homedir(), 'AARHUS TECH');
let userDirectory = readdirSync(pathToAarhusTECH).find((s) => !!(s.match(/(Mirsad Kadribasic - )(?!20RInfoMappe)\w+/g)));
if (!userDirectory) throw new Error('Cannot find user folder');

let workbook = new Excel.Workbook();
let opgaverSheetPath = join(pathToAarhusTECH, 'Mirsad Kadribasic - 20RInfoMappe/Opgaver20R.xlsx');
let userOpgaverPath = join(pathToAarhusTECH, userDirectory);

async function getOpgaver(): Promise<Opgaver> {
    await workbook.xlsx.readFile(opgaverSheetPath)
    let worksheet = workbook.worksheets[0];

    let opgaver: Opgaver = {};

    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        let [, category, rawTasks] = (row.values as string[]);
        let tasks: string[] = [];
        rawTasks.split(',').map((cur) => tasks.push(...numsFromRange(cur)));
        opgaver[category] = tasks
    });

    return opgaver;
}

export async function checkOpgaver(): Promise<SortedOpgaver[]> {
    let opgaver = await getOpgaver();
    let categorys = Object.keys(opgaver);
    let solvedTasks: SortedOpgaver[] = [];

    solvedTasks = categorys.map(category => {
        let files = readdirSync(join(userOpgaverPath, category))
            .filter(file => file.includes('.pdf'))
            .map(file => file.replace('.pdf', ''));

        let sortedFiles: SortedOpgaver = files
            .reduce((acc: any, file: string) => {
                let status = file.slice(3);
                let task = file.slice(0, 3);

                if (!['a', 'b', 'c'].includes(status)) status = 'g';

                acc[status] ? acc[status].push(task) : acc[status] = [task];
                return acc;
            }, {});

        let missingOpgs = opgaver[category].filter(opg => !files.map(s => s.slice(0, 3)).includes(opg));
        if (missingOpgs.length) sortedFiles.missing = missingOpgs;
        if (!sortedFiles.b
            && !sortedFiles.c
            && !sortedFiles.missing) sortedFiles.done = true;

        sortedFiles.kapitel = category;
        return sortedFiles;
    });

    return solvedTasks;
}
