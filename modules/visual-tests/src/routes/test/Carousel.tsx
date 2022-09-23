import React, { Fragment } from 'react';
import type { MetaFunction } from '@remix-run/node';
import Carousel from '@reykjavik/hanna-react/Carousel';

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
      <Fragment>
        <style>
          {`
        .Carousel p {
          border: var(--border-default);
          background-color: var(--color-suld-25);
          padding: 1em;
          margin-right: var(--grid-gutter);
        }
        .Carousel strong {
          display: block;
          width: max-content;
        }
      `}
        </style>
        <Carousel startSeen>
          <p>
            <strong>one</strong> Subtext
          </p>
          <p>
            <strong>two</strong> Yöva gäta stahrt sömwaer. Ut enim ad minim veniam, letsi
            Björk ifder svensk og latin makinen dehr graek.
          </p>
          <p>
            <strong>three</strong> Ut enim ad minim veniam, letsi Björk ifder svensk og
            latin makinen dehr graek
          </p>
          <p>
            <strong>four</strong> Chockolate moose!
          </p>
        </Carousel>
      </Fragment>
    </Minimal>
  );
}

export const testing: TestingInfo = {
  extras: async ({ page, pageScreenshot }) => {
    const carouselStepper = page.locator('.CarouselStepper__button >> nth = 2');
    await carouselStepper.hover();
    await pageScreenshot('carouselStepper-hover');
    await carouselStepper.click();
    await pageScreenshot('carouselStepper-click');
  },
};