import React from 'react';
import type { MetaFunction } from '@remix-run/node';
import Datepicker from '@reykjavik/hanna-react/Datepicker';
import RowBlock from '@reykjavik/hanna-react/RowBlock';
import RowBlockColumn from '@reykjavik/hanna-react/RowBlockColumn';

import { Minimal } from '../../layout/Minimal';
import type { TestingInfo } from '../../test-helpers/testingInfo';
import { autoTitle } from '../../utils/meta';

export const meta: MetaFunction = autoTitle;

const startDate = new Date('2022-10-05');

// Use `handle` if you're using multiple Hanna compnents
export const handle = { cssTokens: ['RowBlock', 'RowBlockColumn'] };

export default function () {
  return (
    <Minimal>
      <RowBlock>
        <RowBlockColumn>
          <Datepicker
            label={'Normal'}
            localeCode="is"
            // name="date"
            placeholder={'d. mmm. yyyy'}
            dateFormat="d. MMM yyyy"
            value={startDate}
            onChange={() => undefined}
            required
          />
          <Datepicker
            label={'Error'}
            localeCode="is"
            // name="date"
            placeholder={'d. mmm. yyyy'}
            dateFormat="d. MMM yyyy"
            value={startDate}
            onChange={() => undefined}
            invalid
          />
          <Datepicker
            label={'Small'}
            localeCode="is"
            // name="date"
            placeholder={'d. mmm. yyyy'}
            dateFormat="d. MMM yyyy"
            // value={undefined}
            onChange={() => undefined}
            small
          />
          <Datepicker
            label={'Disabled'}
            localeCode="is"
            // name="date"
            placeholder={'d. mmm. yyyy'}
            dateFormat="d. MMM yyyy"
            // value={undefined}
            onChange={() => undefined}
            disabled
          />
          <Datepicker
            label={'Read only'}
            localeCode="is"
            // name="date"
            placeholder={'d. mmm. yyyy'}
            dateFormat="d. MMM yyyy"
            // value={undefined}
            onChange={() => undefined}
            readOnly
          />
        </RowBlockColumn>
        <RowBlockColumn> </RowBlockColumn>
      </RowBlock>
      <style>{`
        .RowBlock { margin: 0; }
        .RowBlockColumn { padding-block: 0; }
      `}</style>
    </Minimal>
  );
}

export const testing: TestingInfo = {
  viewportMinHeight: 700,
  extras: async ({ page, localScreenshot, pageScreenshot, project }) => {
    await page.locator('.FormField__input input >> nth=0').click();
    await pageScreenshot('opened');

    if (project === 'firefox-wide') {
      const datepicker = page.locator('.react-datepicker');

      await datepicker
        .locator('span:text-is("október"), span:text-is("Október")')
        .hover();
      await localScreenshot(datepicker, 'dp-hover-month', { margin: -1 });

      await datepicker.locator('[role="button"]:text-is("5") >> nth=0').hover();
      await localScreenshot(datepicker, 'dp-hover-today', { margin: -1 });

      await datepicker.locator('[role="button"]:text-is("21") >> nth=0').hover();
      await localScreenshot(datepicker, 'dp-hover-weekday', { margin: -1 });

      await datepicker.locator('[role="button"]:text-is("22") >> nth=0').hover();
      await localScreenshot(datepicker, 'dp-hover-weekend', { margin: -1 });

      await page.keyboard.press('Escape'); // close the calendar before focusing

      // Hack to screenshot all focus states at once
      await page.mouse.move(0, 0);
      await page.locator('.FormField:not(.FormField--disabled)').evaluateAll((elms) => {
        elms.forEach((elm) => {
          elm.classList.add('FormField--focused');
        });
      });
      await pageScreenshot('allFocused');
    }
  },
};
