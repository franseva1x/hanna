import React from 'react';
import type { MetaFunction } from '@remix-run/node';
import Sharpie from '@reykjavik/hanna-react/Sharpie';

import { Minimal } from '../../layout/Minimal';
import type { TestingInfo } from '../../test-helpers/testingInfo';
import { autoTitle } from '../../utils/meta';

export const meta: MetaFunction = autoTitle;

// // Use `handle` if you're using multiple Hanna compnents
// export const handle = { cssTokens: [], };

export default function () {
  return (
    // Minimal is a no-frills, no-chrome replacement for the `Layout` component,
    <Minimal>
      <p>
        {' '}
        All I want for Christmas is{' '}
        <Sharpie tag="strong" color="green">
          something green
        </Sharpie>{' '}
        and <Sharpie color="red">something red</Sharpie>.
      </p>
    </Minimal>
  );
}

export const testing: TestingInfo = {};