//@ts-check
/* eslint-env es2022 */
import { exec } from 'child_process';
import esbuild from 'esbuild';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { sync as globSync } from 'glob';
import { dirname } from 'path';
import { createInterface } from 'readline';

export { esbuild };

/** @type {Record<string, true | string | undefined>} */
export const opts = process.argv.slice(2).reduce((map, arg) => {
  const [key, value] = arg.replace(/^-+/, '').split('=');
  map[key] = value == null ? true : value;
  return map;
}, {});

export const testsDir = '__tests';
export const distDir = '_npm-lib';
export const srcDir = 'src';

export const testGlobs = `${srcDir}/**/*.tests.{ts,tsx}`;

// ---------------------------------------------------------------------------

/**
 * @param {string | Array<string>} cmd
 * @returns {Promise<void>}
 */
export const $ = (cmd) =>
  new Promise((resolve, reject) => {
    if (Array.isArray(cmd)) {
      cmd = cmd.join(' && ');
    }
    const execProc = exec(cmd, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(undefined);
      }
    });
    const killProc = () => {
      execProc.kill();
    };
    process.on('exit', killProc);
    execProc.once('close', () => {
      process.off('exit', killProc);
    });
    execProc.stdout?.pipe(process.stdout);
    execProc.stderr?.pipe(process.stderr);
  });

// ---------------------------------------------------------------------------

export const ignoreError = () => undefined;

/**
 * @param {object} err
 * @returns {void}
 */
export const logError = (err) => {
  const { message, output } =
    /** @type {{ message?: string; output?: Array<Buffer> }} */ (
      'message' in err ? err : { message: String(err) }
    );

  console.info('--------------------------');
  console.error(output ? output.join('\n').trim() : message || err);
};

/**
 * @param {object} err
 * @returns {void}
 */
export const logThenExit1 = (err) => {
  logError(err);
  process.exit(1);
};

// ---------------------------------------------------------------------------

/**
 * @param {Record<string, unknown>} pkg
 * @param {string} outDir
 * @param {Record<string, unknown>} [extraFields]
 * @returns {Promise<void>}
 */
const makePackageJson = async (pkg, outDir, extraFields) => {
  const newPkg = { ...pkg };
  const { publishConfig } = newPkg;
  delete newPkg.publishConfig;

  delete newPkg.scripts;
  delete newPkg.hxmstyle;
  delete newPkg.private;
  delete newPkg.devDependencies;
  Object.assign(newPkg, publishConfig, extraFields);

  await writeFile(`${outDir}/package.json`, JSON.stringify(newPkg, null, '\t'));
};

// ---------------------------------------------------------------------------

/**
 * @param {boolean} stripHashPrefix
 * @returns {(
 *   res: esbuild.BuildResult | null,
 *   err?: unknown,
 *   onChange?: ((fileName: string) => void)
 * ) => void}
 */
const makeWriteOnlyAffected = (stripHashPrefix) => {
  let fileMem = {};
  return (res, err, onChange) => {
    if (!res || err) {
      return;
    }
    const { outputFiles = [] } = res;
    const newFiles = {};
    const cwdLength = process.cwd().length + 1;
    outputFiles
      .filter(({ path }) => !fileMem[path])
      .forEach(({ path, text }) => {
        const targetDir = dirname(path);
        newFiles[path] = 1;
        if (stripHashPrefix) {
          path = path.replace(/(^|\/)\$\$[A-Z0-9]+\$\$-/, '$1');
        }
        mkdir(targetDir, { recursive: true })
          .then(() => writeFile(path, text))
          .then(() => onChange?.(path.slice(cwdLength)));
      });
    // map this set of outputFiles as the fileMem for next time
    fileMem = {};
    outputFiles.forEach(({ path }) => {
      fileMem[path] = 1;
    });
  };
};

// ---------------------------------------------------------------------------

const [pkg, rootPkg] = await Promise.all([
  readFile('./package.json').then((buffer) => JSON.parse(buffer.toString())),
  readFile('../../package.json').then((buffer) => JSON.parse(buffer.toString())),
]);

export { pkg as pkgJson, rootPkg as rootPkgJson };

export const externalDeps = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(rootPkg.dependencies || {}),
  ...Object.keys(rootPkg.devDependencies || {}),
].filter((name) => !name.startsWith('@reykjavik/hanna-'));

// ---------------------------------------------------------------------------

/**
 * Run tsc typecheck on the current project module
 *
 * @returns {Promise<void>}
 */
export const typeCheckModule = () =>
  $(`yarn run -T tsc --project ./tsconfig.json --noEmit --pretty --incremental false`);

// ---------------------------------------------------------------------------

/**
 * @param {{
 *   compilerOptions?: Record<string, unknown>;
 *   include: string[];
 *   exlude?: string[]
 * }}  [config]
 * @returns {Promise<void>}
 */
const tscBuild = async (config) => {
  const cfgFile = `tsconfig.build.TEMP.json`;
  await writeFile(
    cfgFile,
    `// This file is auto-generated by build.mjs\n${JSON.stringify(
      { extends: './tsconfig.json', ...config },
      null,
      '\t'
    )}`
  );
  try {
    await $(`yarn run -T tsc --project ${cfgFile}  &&  rm ${cfgFile}`);
  } catch (err) {
    await $(`rm ${cfgFile}`);
    logThenExit1(new Error(err.output.toString()));
  }
};

// ---------------------------------------------------------------------------

/**
 * @param {Array<string>} entryPoints
 * @param {string} outdir
 * @param {{
 *   watch?: boolean,
 *   typeCheck?: boolean,
 *   emptyOutdir?: boolean,
 *   entryNames?: string,
 *   onChange?: (fileName: string) => void
 * }} [options]
 * @returns {Promise<void>}
 */
export const esbuildBuild = async (entryPoints, outdir, options) => {
  const { watch, typeCheck, entryNames, onChange } = options || {};

  if (typeCheck) {
    await typeCheckModule();
  }

  const writeOnlyAffected = makeWriteOnlyAffected(true);
  return esbuild
    .build({
      bundle: true,
      external: externalDeps,
      format: 'cjs',
      platform: 'node',
      target: ['node16'],
      entryPoints,
      entryNames,
      write: false,
      watch: watch && {
        onRebuild: (err, results) => writeOnlyAffected(results, err, onChange),
      },
      outdir,
    })
    .then((res) => {
      writeOnlyAffected(res);
      if (opts.dev) {
        process.on('exit', () => res.stop?.());
      }
    })
    .catch(logThenExit1);
};

// ---------------------------------------------------------------------------

/**
 * @returns {Promise<void>}
 */
export const buildAndRunTests = async () => {
  await $(`rm -rf ${testsDir} && mkdir -p ${testsDir}`);
  await esbuildBuild(globSync(testGlobs), testsDir, {
    watch: !!opts.dev,
    typeCheck: !opts.dev,
    entryNames: '[dir]/$$[hash]$$-[name]',
    onChange: (fileName) => $(`yarn run -T ospec ${fileName}`).catch(ignoreError),
  });
  await $(`yarn run -T ospec "${testsDir}/**/*.tests.js"`).catch(ignoreError);
};

// ---------------------------------------------------------------------------

/**
 * @param {Array<string>} entryPoints
 * @param {string} distFolder
 */
const addReferenePathsToIndex = async (entryPoints, distFolder) => {
  const dtsify = (tsFilePath) => tsFilePath.replace(/\.(tsx?)$/, '.d.$1');
  const indexTsFile = entryPoints.find((filePath) =>
    /(?:^|\/)index.tsx?$/.test(filePath)
  );

  if (indexTsFile) {
    const extraEntryPaths = entryPoints
      .filter((filePath) => filePath !== indexTsFile)
      .map(dtsify)
      .map((declFile) => `/// <reference path="./${declFile}" />`);
    if (extraEntryPaths.length > 0) {
      const indexDeclFile = `${distFolder}/${dtsify(indexTsFile)}`;
      await writeFile(
        indexDeclFile,
        `${extraEntryPaths.join('\n')}\n\n${await readFile(indexDeclFile)}`
      );
    }
  }
};

// ---------------------------------------------------------------------------

/**
 * @param {string} libName - The name of the library.
 * @param {{
 *   src?: string,
 *   cpCmds?: Array<string>,
 *   entryGlobs?: Array<string>,
 *   sideEffects?: Array<string>,
 *   shallowCopy?: boolean
 * }} [custom] - Custom build options.
 * @returns {Promise<void>}
 */
export const buildNpmLib = async (libName, custom) => {
  if (opts.dev) {
    await $(`rm -rf ${distDir}`);
    return;
  }

  const {
    src = srcDir,
    cpCmds = [`cp README.md  CHANGELOG.md ${distDir}`],
    entryGlobs = [`*.{ts,tsx}`],
    sideEffects,
    shallowCopy = false,
  } = custom || {};

  const entryPoints = entryGlobs.flatMap((entryGlob) =>
    globSync(entryGlob, {
      cwd: src,
      ignore: ['**/*.{tests,privates}.{ts,tsx}', '**/_*'],
    })
  );

  if (!libName) {
    throw new Error('`libName` argument is required');
  }
  await $([`rm -rf ${distDir}`, `mkdir ${distDir} ${distDir}/esm`, ...cpCmds]);
  await writeFile(`${distDir}/esm/package.json`, JSON.stringify({ type: 'module' }));

  await makePackageJson(pkg, distDir, {
    sideEffects,
    exports: Object.fromEntries(
      entryPoints.map((file) => {
        const token = file.replace(/\.tsx?$/, '');
        const expToken = `./${token}`.replace(/\/index$/, '');
        return [
          expToken,
          {
            import: `./esm/${token}.js`,
            require: `./${token}.js`,
          },
        ];
      })
    ),
  });

  /* eslint-disable no-await-in-loop */
  for (const module of ['commonjs', 'esnext']) {
    const tempOutDir = `${distDir}/temp`;
    const tempLibRoot = shallowCopy
      ? tempOutDir
      : `${tempOutDir}/hanna-${libName}/${src}`;

    await tscBuild({
      compilerOptions: {
        module,
        declaration: true,
        outDir: tempOutDir,
      },
      include: entryPoints.map((file) => `${src}/${file}`),
    });
    await addReferenePathsToIndex(entryPoints, tempLibRoot);

    const rootDir = module === 'esnext' ? 'esm' : '.';
    await $([
      `mv ${tempLibRoot}/* ${distDir}/${rootDir}`,
      `rm -rf ${tempOutDir}`,
      // …
    ]);
  }
  /* eslint-enable no-await-in-loop */
};

// ---------------------------------------------------------------------------

/**
 * @param {string} changelogFileName
 * @returns {Promise<{
 *   oldVersion: string,
 *   newVersion: string,
 *   newChangelog: string
 * }>}
 */
const updateChangelog = async (changelogFileName) => {
  const changelogFull = (await readFile(changelogFileName)).toString();
  const changelog = changelogFull.slice(0, 4000);
  const changelogTail = changelogFull.slice(4000);

  const upcomingHeader = '## Upcoming...';
  const addNewLines = '- ... <!-- Add new lines here. -->';

  let upcomingIdx = changelog.indexOf(upcomingHeader);
  if (upcomingIdx < 0) {
    throw new Error(`Could not find "${upcomingHeader}" header in ${changelogFileName}`);
  }
  upcomingIdx += upcomingHeader.length;
  const releaseIdx = changelog.indexOf('## ', upcomingIdx);
  const oldVersion = changelog
    .slice(releaseIdx, releaseIdx + 128)
    .match(/##\s+(\d+)\.(\d+)\.(\d+)/)
    ?.slice(1)
    .map(Number);
  if (!oldVersion || oldVersion.length !== 3) {
    throw new Error(`Could not find a valid "last version" in ${changelogFileName}`);
  }

  const updates = changelog
    .slice(upcomingIdx, releaseIdx)
    .trim()
    .split(/\n\s*- /)
    .map((line) => line.trim().match(/^(\*\*BREAKING\*\*|feat:|fix:)/)?.[1])
    .filter(/** @type {((x: unknown) => x is string)} */ ((x) => !!x));

  if (updates.length === 0) {
    console.info(
      `No significant/relevant unreleased updates found in ${changelogFileName}`
    );
    process.exit(0);
  }

  const isPrerelease = !oldVersion[0];
  const majorIdx = isPrerelease ? 1 : 0;
  const minorIdx = majorIdx + 1;
  const patchIdx = minorIdx + (isPrerelease ? 0 : 1);

  const newVersionArr = [...oldVersion];
  if (updates.includes('**BREAKING**')) {
    newVersionArr[patchIdx] = 0;
    newVersionArr[minorIdx] = 0;
    newVersionArr[majorIdx] = oldVersion[majorIdx] + 1;
  } else if (updates.includes('feat:')) {
    newVersionArr[patchIdx] = 0;
    newVersionArr[minorIdx] = oldVersion[minorIdx] + 1;
  } else if (updates.includes('fix:')) {
    newVersionArr[patchIdx] = oldVersion[patchIdx] + 1;
  }
  const newVersion = newVersionArr.join('.');

  const addNewLinesIdx = changelog.indexOf(addNewLines, upcomingIdx);
  if (addNewLinesIdx < 0) {
    throw new Error(
      `Could not find "${addNewLines}" marker at the top of ${changelogFileName}`
    );
  }

  const dayOffset = await new Promise((resolve) => {
    const readline = createInterface({ input: process.stdin, output: process.stdout });
    readline.question(`Delay release date by how many days? (0)  `, (answer) => {
      readline.close();
      resolve(parseInt(answer) || 0);
    });
  });

  const DAY_MS = 24 * 60 * 60 * 1000;
  const releaseDate = new Date(Date.now() + dayOffset * DAY_MS);

  const newChangelog =
    changelog.slice(0, addNewLinesIdx + addNewLines.length) +
    [
      '',
      '',
      `## ${newVersion}`,
      '',
      `_${releaseDate.toISOString().slice(0, 10)}_`,
      '',
    ].join('\n') +
    changelog.slice(addNewLinesIdx + addNewLines.length) +
    changelogTail;

  return {
    oldVersion: oldVersion.join('.'),
    newVersion,
    newChangelog,
  };
};

// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   changelogSuffix?: string,
 *   pkgJsonSuffix?: string,
 *   rootFolder?: string,
 *   versionKey?: string
 * }} PkgVersionCfg
 */

/**
 * @param {PkgVersionCfg} [opts]
 * @returns {Promise<void>}
 */
export const updatePkgVersion = async (opts) => {
  const {
    changelogSuffix = '',
    pkgJsonSuffix = '',
    rootFolder = '.',
    versionKey = 'version',
  } = opts || {};
  const changelogFile = `${rootFolder}/CHANGELOG${changelogSuffix}.md`;
  const pkgFile = `${rootFolder}/package${pkgJsonSuffix}.json`;

  try {
    const pkg = await readFile(pkgFile).then((buffer) => JSON.parse(buffer.toString()));

    const { oldVersion, newVersion, newChangelog } = await updateChangelog(changelogFile);

    if (oldVersion !== pkg[versionKey]) {
      throw new Error(
        `Version mismatch between ${changelogFile} (${oldVersion}) and ${pkgFile} (${pkg[versionKey]})`
      );
    }

    await new Promise((resolve, reject) => {
      const readline = createInterface({ input: process.stdin, output: process.stdout });
      readline.question(
        `New version: ${newVersion}\nIs this correct? (Y/n)  `,
        (answer) => {
          answer = answer.trim().toLowerCase() || 'y';
          if (answer === 'y') {
            readline.close();
            resolve(true);
          } else if (answer === 'n') {
            readline.close();
            reject(Error('Aborted by user'));
          }
        }
      );
    });

    pkg[versionKey] = newVersion;
    await Promise.all([
      writeFile(pkgFile, `${JSON.stringify(pkg, null, '  ')}\n`),
      writeFile(changelogFile, newChangelog),
    ]);
  } catch (err) {
    logError(err);
    process.exit(1);
  }
};

// ---------------------------------------------------------------------------

/**
 * @param {Omit<PkgVersionCfg, 'changelogSuffix'>} [opts]
 * @returns {Promise<string>}
 */
export const getPkgVersion = (opts) => {
  const { rootFolder = '.', versionKey = 'version', pkgJsonSuffix = '' } = opts || {};
  const pkgFile = `${rootFolder}/package${pkgJsonSuffix}.json`;
  return readFile(pkgFile).then((buffer) => {
    const versionValue = JSON.parse(buffer.toString())[versionKey];
    if (typeof versionValue !== 'string') {
      const valueStr = JSON.stringify(versionValue, null, 2);
      throw new Error(`Invalid '${versionKey}' value in '${pkgFile}':\n  ${valueStr}`);
    }
    return versionValue;
  });
};

// ---------------------------------------------------------------------------

/**
 * @param {string} packageName
 * @param {string} newVersion
 * @param {Array<string>} [updatePkgs]
 * @returns {Promise<Array<string>>}
 */
export const updateDependentPackages = async (
  packageName,
  newVersion,
  updatePkgs = []
) => {
  const updatedPkgs = [];

  /* eslint-disable no-await-in-loop */
  for (const updatedPkgName of updatePkgs) {
    const updatedPkgFile = `../${updatedPkgName}/package.json`;
    const originalPkgStr = (await readFile(updatedPkgFile)).toString();
    const updatedPkgStr = originalPkgStr.replace(
      new RegExp(`("@reykjavik/${packageName}": "\\^)(?:\\d+\\.\\d+\\.\\d+)(")`, 'g'),
      `$1${newVersion}$2`
    );
    if (updatedPkgStr === originalPkgStr) {
      throw new Error(
        `Could not find "@reykjavik/${packageName}" as a versioned dependency in ${updatedPkgFile}`
      );
    }
    await writeFile(updatedPkgFile, updatedPkgStr);
    updatedPkgs.push(updatedPkgFile);
  }
  /* eslint-enable no-await-in-loop */
  return updatedPkgs;
};

// ---------------------------------------------------------------------------

/**
 * @typedef {{
 *   changelogSuffix?: string,
 *   updatePkgs?: Array<string>
 * }}  PublishOpts
 */

/**
 * @param {PublishOpts} [opts]
 * @returns {Promise<void>}
 */
export const publishToNpm = async (opts = {}) => {
  const pkgName = pkg.name.replace(/^@reykjavik\//, '');
  const version = pkg.version;
  try {
    const updatedPkgs = await updateDependentPackages(pkgName, version, opts.updatePkgs);

    await $([
      `cd _npm-lib`,
      // `npm publish`,
      `cd ..`,
      `yarn install`,
      `git add ../../yarn.lock ${updatedPkgs.join(' ')}`,
      `git add ./package.json ./CHANGELOG${opts.changelogSuffix || ''}.md`,
      `git commit -m "release(${pkgName}): v${version}"`,
    ]);
  } catch (err) {
    logThenExit1(err);
  }
};
