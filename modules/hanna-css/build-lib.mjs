//@ts-check
/* eslint-env es2022 */
import { writeFile } from 'fs/promises';
import { sync as globSync } from 'glob';

import {
  buildAndRunTests,
  buildNpmLib,
  distDir,
  logThenExit1,
  srcDir,
} from '../../build-helpers.mjs';

import { getCssVersionConfig, serverFolder } from './build/config.mjs';
import { buildIconfont } from './build/gulp-tasks.mjs';
import { handlError } from './build/helpers.mjs';

const { fullCssVersion, cssFolderVersion, majorCssVersion } = await getCssVersionConfig();

const cssSrcDir = `${srcDir}/css`;
const cssSourceExtension = '.css.ts';
const cssModuleFiles = globSync(`**/*${cssSourceExtension}`, { cwd: cssSrcDir });

// ---------------------------------------------------------------------------

/**
 * @param {string} majorCssVersion
 * @returns {string}
 */
const getCssVersionTokenUnion = (majorCssVersion) => {
  // Read all css majorCssVersion folders currently on the built style server.
  // NOTE: We assume the CSS folder contains only folders.
  const cssVFolders = [
    // Add the current version folder in case it has not been built into its target folder yet
    `v${cssFolderVersion}`,
    // get the folders of previous-versions, if any
    ...globSync(`v${majorCssVersion}*`, {
      cwd: `${serverFolder}public/css`,
    }),
  ].sort();

  /** @type {Record<string, 1>} */
  const cssFoldersPlus = {};

  cssVFolders.forEach((name) => {
    // collect all the version substrings of each version folder
    // ( i.e. turn `"v1.3.4"` into `["v1.3.4", "v1.3", "v1"]` )
    cssFoldersPlus[name] = 1;
    const nameBits = name.split('.');
    let i = nameBits.length - 1;
    while (i > 0) {
      nameBits.pop();
      const shortName = nameBits.join('.');
      if (shortName in cssFoldersPlus) {
        break; // because we're reached already covered territory
      }
      cssFoldersPlus[shortName] = 1;
      i--;
    }
  });

  cssFoldersPlus[`dev-v${majorCssVersion}`] = 1;
  delete cssFoldersPlus.v0; // never a good idea

  return Object.keys(cssFoldersPlus)
    .sort(Intl.Collator('en').compare)
    .map((key) => `  | '${key}'`)
    .join('\n');
};

/**
 * @returns {string}
 */
const geCssModuleTokenUnion = () =>
  cssModuleFiles
    .map((fileName) => fileName.slice(0, -cssSourceExtension.length))
    .sort(Intl.Collator('en').compare)
    .map((token) => `  | '${token}'`)
    .join('\n');

/**
 * @returns {Promise<void>}
 */
const createStyleServerInfoTsFile = () =>
  writeFile(
    `${srcDir}/lib/style-server-info.ts`,
    [
      `// This file is auto-generated by build.mjs`,
      ``,
      `export const fullCssVersion = ${JSON.stringify(fullCssVersion)};`,
      `export const majorCssVersion = ${JSON.stringify(majorCssVersion)};`,
      ``,
      `export type CssVersionToken =`,
      `${getCssVersionTokenUnion(majorCssVersion)};`,
      ``,
      `export type CssModuleToken =`,
      `${geCssModuleTokenUnion()};`,
      ``,
    ].join('\n')
  ).catch(logThenExit1);

// ===========================================================================

// ===========================================================================

await createStyleServerInfoTsFile();
await buildIconfont().catch(handlError);
await buildAndRunTests();
await buildNpmLib('css', {
  src: 'src/lib',
  cpCmds: [
    `cp README-lib.md ${distDir}/README.md`,
    `cp CHANGELOG-lib.md ${distDir}/CHANGELOG.md`,
  ],
  entryGlobs: ['index.ts', 'scale.ts'],
});
