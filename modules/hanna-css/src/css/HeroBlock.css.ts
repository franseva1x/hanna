import { css, em } from 'es-in-css';

import { between_cols, between_phablet_tablet } from '../lib/between';
import { mq } from '../lib/breakpoints';
import { cols_pct, cols_px, grid } from '../lib/grid';
import { hannaVars } from '../lib/hannavars';
import { WARNING_soft__ } from '../lib/WARNING__';

import { prem } from './utils/miscUtils';
import { SeenEffect__fadeup } from './utils/seenEffects';

export default css`
  /*!@deps
    ButtonPrimary
    ButtonTertiary
  */
  @media screen {
    .HeroBlock {
      ${SeenEffect__fadeup}
      padding: ${between_cols(0, 1 * grid.unit)} 0;
      margin-bottom: ${between_cols(30, 100)};
      display: flex;
      flex-flow: column nowrap;
    }

    .HeroBlock__title {
      font: ${hannaVars.font_hd_l};
      margin-bottom: ${em(40 / 64)};
    }

    .HeroBlock__image {
      display: block;
      margin: ${hannaVars.space_2} calc(0.5 * ${hannaVars.grid_margin__neg});
      order: 1;
    }

    .HeroBlock__summary {
      font: ${hannaVars.font_bd_l};
      margin-bottom: ${em(40 / 20)};
    }

    .HeroBlock__summary li:not([class]), // Captures ul, ol
    .HeroBlock__summary blockquote {
      ${WARNING_soft__('Use simple markup only')};
    }

    .HeroBlock__summary > p {
      margin-bottom: ${hannaVars.baseVerticalMargin};
    }

    .HeroBlock > :last-child {
      margin-bottom: 0;
    }
  }

  // ---------------------------------------------------------------------------

  @media ${mq.phablet_tablet} {
    .HeroBlock {
      padding-right: ${between_phablet_tablet(0, cols_px(3, 3))};
    }
  }

  // ---------------------------------------------------------------------------

  @media ${mq.netbook_up} {
    .HeroBlock {
      position: relative;
      padding-right: ${cols_pct(6, 6)};
      min-height: ${prem(420)};
      z-index: 0; // scope the *__image underlap
    }

    .HeroBlock__image {
      position: absolute;
      z-index: -1;
      top: 50%;
      right: ${cols_pct(0, -1)};
      width: ${cols_pct(6, 7)};
      padding-top: ${cols_pct(6)};
      margin: 0;
      transform: translateY(-50%);
      pointer-events: none;
    }

    .HeroBlock__image > img {
      pointer-events: initial;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      margin: auto;
      object-fit: contain;
    }
  }
`;