import React from 'react';
import type { MetaFunction } from '@remix-run/node';
import IslandPageBlock from '@reykjavik/hanna-react/IslandPageBlock';

import { Minimal } from '../../layout/Minimal';
import { illustr, lorem } from '../../test-helpers/dummyData';
import type { TestingInfo } from '../../test-helpers/testingInfo';
import { autoTitle } from '../../utils/meta';

export const meta: MetaFunction = autoTitle;

// // Use `handle` if you're using multiple Hanna compnents
// export const handle = { cssTokens: [], };
const buttonList = [
  { href: '', label: 'Button number one' },
  { href: '', label: 'Button number two' },
  { href: '', label: 'Button number three' },
  { href: '', label: 'Button number four' },
];
export default function () {
  return (
    // Minimal is a no-frills, no-chrome replacement for the `Layout` component,

    <Minimal>
      <IslandPageBlock
        title={'Left aligned'}
        align={'left'}
        buttons={buttonList.slice(0, 1)}
        background={'none'}
        image={illustr.tall}
        startSeen
      />

      <IslandPageBlock
        title={'Right aligned'}
        summary={lorem.short}
        buttons={buttonList.slice(0, 2)}
        align={'right'}
        background={'gray'}
        image={illustr.tall}
        startSeen
      />
      <IslandPageBlock
        title={'Right aligned with secondary background'}
        summary={lorem.medium}
        buttons={buttonList.slice(0, 4)}
        align={'left'}
        background={'secondary'}
        image={illustr.tall}
        startSeen
      />
    </Minimal>
  );
}

export const testing: TestingInfo = {
  __DEV_FOCUS__: true,
};
