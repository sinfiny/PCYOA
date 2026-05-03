#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { compileSourceProjectPackage } from './compiler';
import { createSourcePackageFiles } from './decompose';
import { formatHealthReport, hasHealthErrors } from './reporter';
import { readSourcePackageDirectory, writeSourcePackageDirectory } from './filesystem';
import { loadSourceProjectPackage } from './loader';
import type { App } from '$lib/store/types';

type CliArgs = {
    command?: string;
    input?: string;
    output?: string;
    includeQuarantine: boolean;
    requireLegacyIds: boolean;
};

export async function runSourcePackageCli(argv = process.argv.slice(2)): Promise<number> {
    const args = parseArgs(argv);

    if (!args.command || !args.input || !args.output) {
        printUsage();
        return 1;
    }

    if (args.command === 'decompose') {
        const projectText = await readFile(args.input, 'utf8');
        const projectFile = JSON.parse(projectText) as App;
        const files = createSourcePackageFiles(projectFile);
        await writeSourcePackageDirectory(args.output, files);
        const loaded = loadSourceProjectPackage(files);
        console.log(formatHealthReport(loaded.health));
        return hasHealthErrors(loaded.health) ? 1 : 0;
    }

    if (args.command === 'compile') {
        const files = await readSourcePackageDirectory(args.input);
        const loaded = loadSourceProjectPackage(files);
        if (!loaded.package) {
            console.log(formatHealthReport(loaded.health));
            return 1;
        }

        const compiled = compileSourceProjectPackage(loaded.package, {
            quarantinePolicy: args.includeQuarantine ? 'include' : 'exclude',
            requireLegacyIds: args.requireLegacyIds
        });

        await writeFile(args.output, `${JSON.stringify(compiled.projectFile, null, 2)}\n`, 'utf8');
        console.log(formatHealthReport(compiled.health));
        return hasHealthErrors(compiled.health) ? 1 : 0;
    }

    printUsage();
    return 1;
}

function parseArgs(argv: string[]): CliArgs {
    const args: CliArgs = {
        command: argv[0],
        input: argv[1],
        output: argv[2],
        includeQuarantine: false,
        requireLegacyIds: false
    };

    for (const arg of argv.slice(3)) {
        if (arg === '--include-quarantine') {
            args.includeQuarantine = true;
        }
        if (arg === '--require-legacy-ids') {
            args.requireLegacyIds = true;
        }
    }

    if (args.output) {
        args.output = path.resolve(args.output);
    }
    if (args.input) {
        args.input = path.resolve(args.input);
    }

    return args;
}

function printUsage() {
    console.error([
        'Usage:',
        '  source-package decompose <project.json> <source-package-dir>',
        '  source-package compile <source-package-dir> <project.json> [--include-quarantine] [--require-legacy-ids]'
    ].join('\n'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
    runSourcePackageCli()
        .then((code) => {
            process.exitCode = code;
        })
        .catch((error) => {
            console.error(error instanceof Error ? error.message : error);
            process.exitCode = 1;
        });
}

