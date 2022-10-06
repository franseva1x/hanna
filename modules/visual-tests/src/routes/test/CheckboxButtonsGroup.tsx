import React, { Fragment } from 'react';
import type { MetaFunction } from '@remix-run/node';
import CheckboxButtonsGroup from '@reykjavik/hanna-react/CheckboxButtonsGroup';

import { DummyBlock } from '../../layout/DummyBlock';
import { Minimal } from '../../layout/Minimal';
import type { TestingInfo } from '../../test-helpers/testingInfo';
import { autoTitle } from '../../utils/meta';

export const meta: MetaFunction = autoTitle;

// // Use `handle` if you're using multiple Hanna compnents
//export const handle = { cssTokens: [] };

export const props = [
  {
    value: 'text',
    label: (
      <Fragment>
        Some checkbox text <small>Extra info</small>
      </Fragment>
    ),
  },
  {
    value: 'random',
    label: 'Random text',
  },
  {
    value: 'long',
    label: (
      <Fragment>
        Long long long checkbox text <small>Longer extra info</small>
      </Fragment>
    ),
  },
  {
    disabled: true,
    value: 'disabled',
    label: (
      <Fragment>
        Disabled checkbox <small>Extra info</small>
      </Fragment>
    ),
  },
  {
    value: 'great',
    label: 'Checkboxes are great',
  },
];

export default function () {
  return (
    // Minimal is a no-frills, no-chrome replacement for the `Layout` component,
    <Minimal>
      <CheckboxButtonsGroup
        label={'Checkbox Group'}
        options={props}
        required={true}
        name={''}
      />
      <DummyBlock thin />
      <CheckboxButtonsGroup
        label={'Invalid Checkbox Group'}
        options={props}
        invalid
        name={''}
        errorMessage="This is an error message"
      />
    </Minimal>
  );
}

export const testing: TestingInfo = {
  extras: async ({ page, localScreenshot }) => {
    const container = page.locator('.CheckboxButtonsGroup >> nth = 0');
    const invalidContainer = page.locator('.CheckboxButtonsGroup >> nth = 1');

    const checkbox = page.locator('.CheckboxButton__label:text("Some") >> nth = 0');
    const invalidCheckbox = page.locator(
      '.CheckboxButton__label:text("Some") >> nth = 1'
    );
    const disabledCheckbox = page.locator(
      '.CheckboxButton__label:text("Disabled") >> nth = 0'
    );

    await checkbox.hover();
    await localScreenshot(container, 'normal-hover', { margin: true });

    await checkbox.click();
    await localScreenshot(container, 'normal-click', { margin: true });

    await invalidCheckbox.hover();
    await localScreenshot(invalidContainer, 'invalid-hover', { margin: true });

    await invalidCheckbox.click();
    await localScreenshot(invalidContainer, 'invalid-click', { margin: true });

    await disabledCheckbox.hover();
    await localScreenshot(disabledCheckbox, 'disabled-hover', { margin: true });
  },
};
