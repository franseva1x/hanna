import { css } from 'es-in-css';

import { hannaVars as vars } from '../lib/hannavars';
import { iconStyle } from '../lib/icons';
import { WARNING__ } from '../lib/WARNING__';

import {
  ButtonTertiaryStyle,
  ButtonTertiaryStyle__disabled,
  ButtonTertiaryVariables as bt,
} from './styles/buttons';
import { prem } from './utils/miscUtils';

export default css`
  /*!@deps
    ButtonBar
  */

  .ButtonTertiary {
    ${ButtonTertiaryStyle};

    &--go--back {
      order: -10;
    }
    &--go--back::before {
      ${iconStyle(vars.icon__arrow_left_long)}
      background: 0;
      height: auto;
      font-size: 0.75em;
      overflow: hidden;
    }

    &:active,
    &[aria-pressed='true'] {
      ${bt.override({
        ButtonTertiary__dashColor: '_inherit',
        ButtonTertiary__dashHeight: prem(6),
      })};
    }

    &--small {
      ${bt.override({
        ButtonTertiary__dashSpace: vars.space_1,
      })};
      /* font-weight: 400; */
    }
    &--destructive {
      ${bt.override({
        ButtonTertiary__color: vars.color_heidmork_100,
        ButtonTertiary__dashColor: 'currentColor',
      })}
    }

    ${ButtonTertiaryStyle__disabled};

    // ---------------------------------------------------------------------------

    &[data-icon] {
      ${WARNING__('No icons on `ButtonTertiary`')};
    }
    &--go--back#{&}--destructive {
      ${WARNING__('`--destructive` and `--go--back` do NOT mix')};
    }
    &--go--forward {
      ${WARNING__('`--go--forward` not supported on `ButtonTertiary`')};
    }
  }
`;
