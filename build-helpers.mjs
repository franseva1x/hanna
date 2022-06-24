/* eslint-env es2022 */
import { exec as execAsync, execSync } from 'child_process';
import esbuild from 'esbuild';
import { writeFileSync } from 'fs';
import { access, mkdir, readFile, writeFile } from 'fs/promises';
import glob from 'glob';
import { dirname } from 'path';

export const opts = process.argv.slice(2).reduce(
  /* <Record<string,unknown>> */ (map, arg) => {
    const [key, value] = arg.replace(/^-+/, '').split('=');
    map[key] = value == null ? true : value;
    return map;
  },
  {}
);

export const testsDir = '__tests';
export const distDir = '_npm-lib';
export const srcDir = 'src';

// ---------------------------------------------------------------------------

export const exit1 = (err) => {
  console.error(err);

  process.exit(1);
};

// ---------------------------------------------------------------------------

export const makePackageJson = (pkg, outdir, extras) => {
  const newPkg = { ...pkg };
  const { publishConfig } = newPkg;
  delete newPkg.publishConfig;

  delete newPkg.scripts;
  delete newPkg.hxmstyle;
  delete newPkg.private;
  delete newPkg.devDependencies;
  Object.assign(newPkg, publishConfig, extras);

  writeFileSync(outdir + '/package.json', JSON.stringify(newPkg, null, '\t'));
};

// ---------------------------------------------------------------------------

const fileMem = {};
export const isNewFile = ({ path }) => {
  if (path in fileMem) {
    return false;
  }
  fileMem[path] = true;
  return true;
};

const writeOnlyAffected = (res, err) => {
  if (err) {
    return;
  }
  return res.outputFiles.filter(isNewFile).forEach((res) => {
    const targetDir = dirname(res.path);
    return access(targetDir)
      .catch(() => mkdir(targetDir, { recursive: true }))
      .then(() => writeFile(res.path, res.text));
  });
};

// ---------------------------------------------------------------------------

const [pkg, rootPkg] = await Promise.all([
  readFile('./package.json').then((str) => JSON.parse(str)),
  readFile('../../package.json').then((str) => JSON.parse(str)),
]);

export const externalDeps = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
  ...Object.keys(rootPkg.dependencies || {}),
  ...Object.keys(rootPkg.devDependencies || {}),
].filter((name) => !name.startsWith('@reykjavik/hanna-'));

export const buildTests = () => {
  execSync(`rm -rf ${testsDir} && mkdir ${testsDir}`);

  esbuild
    .build({
      bundle: true,
      external: externalDeps,
      format: 'cjs',
      platform: 'node',
      target: ['node16'],
      entryPoints: glob.sync(`${srcDir}/**/*.tests.{js,ts,tsx}`),
      entryNames: '[dir]/[hash]__[name]',
      write: false,
      watch: opts.dev && {
        onRebuild: (err, results) => writeOnlyAffected(results, err),
      },
      outdir: testsDir,
    })
    .then(writeOnlyAffected)
    .catch(exit1);
};

// ---------------------------------------------------------------------------

const tscBuild = (name, config, watch) => {
  const cfgFile = `tsconfig.build.${name}.json`;
  writeFileSync(
    cfgFile,
    `// This file is auto-generated by build.mjs\n${JSON.stringify(
      { extends: './tsconfig.json', ...config },
      null,
      '\t'
    )}`
  );
  if (watch) {
    execAsync(`yarn run -T tsc --project ${cfgFile} --watch --preserveWatchOutput`);
  } else {
    execSync(`yarn run -T tsc --project ${cfgFile}`);
  }
};

// ---------------------------------------------------------------------------

export const buildNpmLib = (libName, custom) => {
  const {
    src = srcDir,
    cpCmds = [`cp README.md  CHANGELOG.md ${distDir}`],
    entryGlobs = [`*.{ts,tsx}`],
    sideEffects = false,
  } = custom || {};

  const entryPoints = entryGlobs.flatMap((entryGlob) =>
    glob.sync(entryGlob, { cwd: src, ignore: '**/*.tests.{ts,tsx}' })
  );

  if (!opts.dev) {
    if (!libName) {
      throw new Error('`libName` argument is required');
    }
    execSync(
      [`rm -rf ${distDir}`, `mkdir ${distDir}`].concat(cpCmds).join(' && ')
      // [`rm -rf ${distDir}`, `mkdir ${distDir} ${distDir}/esm`].concat(cpCmds).join(' && ')
    );
    // writeFile(`${distDir}/esm/package.json`, JSON.stringify({ type: 'module' }));

    makePackageJson(pkg, distDir, {
      sideEffects,
      // exports: entryPoints.reduce((exports, file) => {
      //   const token = file.replace(/\.tsx?$/, '');
      //   const expToken = token === 'index' ? '.' : `./${token}`;
      //   exports[expToken] = {
      //     import: `./esm/${token}.js`,
      //     require: `./${token}.js`,
      //   };
      //   return exports;
      // }, {}),
    });

    // -------
    [
      { name: 'cjs', module: 'commonjs' },
      // { name: 'esm', module: 'esnext' },
    ].forEach(({ name, module }) => {
      tscBuild(`lib-${name}`, {
        compilerOptions: {
          module,
          declaration: true,
          outDir: `${distDir}/temp`,
        },
        include: entryPoints.map((file) => `${src}/${file}`),
        exclude: [],
      });
      const rootDir = module === 'esnext' ? 'esm' : '.';
      execSync(
        [
          `mv ${distDir}/temp/hanna-${libName}/${src}/* ${distDir}/${rootDir}`,
          `rm -rf ${distDir}/temp`,
        ].join(' && ')
      );
    });
    return;
  } else {
    execSync(`rm -rf ${distDir}`);
  }
};
