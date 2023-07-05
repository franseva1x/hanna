import { colors_raw } from '@reykjavik/hanna-css';
import { color, css, LengthValue, px } from 'es-in-css';

import { htmlCl } from '../lib/classNames.js';
import { hannaVars as vars } from '../lib/hannavars.js';
import { iconStyle } from '../lib/icons.js';

import { FormFieldVariables } from './styles/forms.js';
import { prem } from './utils/miscUtils.js';
import { TagPillVariables } from './TagPill.css.js';

const ff = FormFieldVariables.vars;
const tp = TagPillVariables.vars;

type FadeOutRightOpts = {
  pseudo?: 'after' | 'before';
  width?: LengthValue;
  vOffset?: LengthValue;
};

const fadeoutRight = (opts: FadeOutRightOpts = {}) => css`
  &::${opts.pseudo || 'after'} {
    content: '';
    position: absolute;
    top: ${opts.vOffset || 0};
    bottom: ${opts.vOffset || 0};

    right: 0;
    width: ${opts.width || '2em'};
    background-image: linear-gradient(90deg, ${color('white').alpha(0)} 0%, #fff 100%);
  }
`;

/*
  Markup OUTLINE:
  .FormField(--*).MultiSelect(--nowrap)
    .FormField__label
    .FormField__input.Multiselect__input(--open)
        .Multiselect__choices
          .Multiselect__search / .Multiselect__toggler
          .Multiselect__currentvalues  // Always when closed, sometimes when open.
          .Multiselect__options
              .Multiselect__option.Checkbox(--focus) / .Multiselect__noresults
              ...
*/

export default css`
  /*!@deps
    Tagpill
    FormField
    TextInput
    Checkbox
  */

  .Multiselect__input {
    height: auto;
    min-height: ${ff.input__height};
    padding-right: ${vars.space_4};
    flex-flow: row wrap;
  }

  .Multiselect__input[data-sprinkled]::after {
    ${iconStyle(vars.icon__chevron_down)}
    position: absolute;
    top: 0;
    bottom: 0;
    right: ${prem(20)};
    pointer-events: none;
    margin: auto;
    color: ${ff.input__border_color};
    transition: all 200ms ease-in;
    font-size: ${prem(16)};
    height: 1em;
    line-height: 1em;
  }
  .Multiselect__input--open[data-sprinkled]::after {
    transform: scaleY(-1);
  }

  .Multiselect__toggler {
    color: ${ff.input__color_placeholder};
  }

  :not(.Multiselect__input--open) > .Multiselect__search,
  :not(.Multiselect__input--open) > .Multiselect__toggler {
    position: absolute;
    z-index: 1;
  }

  .FormField--focused > * > .Multiselect__search,
  .FormField--focused > * > .Multiselect__toggler {
  }

  ${htmlCl.beforeSprinkling} .Multiselect__input:not([data-sprinkled]) > .Multiselect__choices {
    display: none;
  }

  .Multiselect__input--open > .Multiselect__choices {
    position: absolute;
    top: 100%;
    margin-top: 1px;
    left: -1px;
    right: -1px;
    width: auto;
    max-height: 500px;
    overflow-y: auto;
    background: ${vars.color_white};
    box-shadow: 0px 60px 120px rgba(0, 0, 0, 0.08), 0px 30px 60px rgba(0, 0, 0, 0.08);
    border: 1px solid ${vars.color_suld_100};
    border-top: none;
    border-radius: 0 0 4px 4px;
    z-index: ${vars.zindex__overlay};
  }

  :not(.Multiselect__input--open) > * > .Multiselect__currentvalues {
    line-height: 1;
    padding-top: ${vars.space_1};
    margin-bottom: -2px;
  }
  .FormField--small > :not(.Multiselect__input--open) > * > .Multiselect__currentvalues {
    margin-top: -2px;
    margin-bottom: -4px;
  }
  .Multiselect__input--open > * > .Multiselect__currentvalues {
    padding: ${vars.space_1} 0 0 ${vars.space_2};
  }
  .Multiselect__input--open > * > .Multiselect__currentvalues::after {
    content: '';
    display: block;
    margin-top: ${vars.space_0$5};
    margin-right: ${vars.space_2};
    border-bottom: ${vars.border_default};
  }

  /* prettier-ignore */
  .Multiselect--nowrap > :not(.Multiselect__input--open) > * > .Multiselect__currentvalues {
    padding-right: ${vars.space_1};
    white-space: nowrap;
    overflow: hidden;
    position: relative;

    ${fadeoutRight({ vOffset: px(5) })}
  }

  .Multiselect__currentvalues > .TagPill {
    margin-bottom: ${vars.space_1};
    ${TagPillVariables.override({
      // NOTE: Is this something we may want to do in the TagPill itself?
      background: color(colors_raw.suld_100).alpha(0.25),
    })}
  }
  :not(.Multiselect__input--open) > * > .Multiselect__currentvalues > .TagPill {
    margin-right: ${vars.space_1};
  }
  .FormField--invalid > * > * > .Multiselect__currentvalues > .TagPill {
    ${TagPillVariables.override({ color: vars.color_heidmork_100 })}
  }

  .Multiselect__options:not([aria-expanded]) {
    padding: ${vars.space_1} 0;
    display: flex;
    flex-flow: row wrap;
    gap: 0 ${vars.space_4};
  }

  .Multiselect__option[class] {
    margin: 0;
  }

  .Multiselect__option:hover {
    // background-color: ${vars.color_suld_50};
  }

  [aria-expanded] > .Multiselect__option > .Checkbox__label {
    padding-top: ${vars.space_2};
    padding-right: ${vars.space_2};
    padding-bottom: ${vars.space_2};
    border-left: ${vars.space_2} solid transparent;
    width: 100%;
  }

  .Multiselect__option--focused {
    background-color: ${vars.color_suld_50};
  }

  .Multiselect__noresults {
    font: ${vars.font_button};
    font-weight: ${vars.font_weight__bold};
    padding: ${vars.space_2} ${vars.space_2};
  }
`;
