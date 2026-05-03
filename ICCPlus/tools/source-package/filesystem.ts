import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SourcePackageFiles } from './schema';

export async function readSourcePackageDirectory(root: string): Promise<SourcePackageFiles> {
    const files: SourcePackageFiles = {};
    await readDirectory(root, root, files);
    return files;
}

export async function writeSourcePackageDirectory(root: string, files: SourcePackageFiles): Promise<void> {
    await mkdir(root, { recursive: true });

    for (const [relativePath, contents] of Object.entries(files)) {
        const target = path.join(root, relativePath);
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, contents, 'utf8');
    }
}

async function readDirectory(root: string, current: string, files: SourcePackageFiles): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });

    for (const entry of entries) {
        const absolutePath = path.join(current, entry.name);
        if (entry.isDirectory()) {
            await readDirectory(root, absolutePath, files);
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        const relativePath = path.relative(root, absolutePath).split(path.sep).join('/');
        files[relativePath] = await readFile(absolutePath, 'utf8');
    }
}

