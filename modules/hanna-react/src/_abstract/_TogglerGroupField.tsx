import React, { ReactElement, useMemo } from 'react';
import { modifiedClass } from '@reykjavik/hanna-utils';

import FormField, {
  FormFieldGroupWrappingProps,
  groupFormFieldWrapperProps,
} from '../FormField.js';
import { BemModifierProps } from '../utils/types.js';

import {
  TogglerGroup,
  TogglerGroupOption,
  TogglerGroupOptions,
  TogglerGroupProps,
} from './_TogglerGroup.js';
import { TogglerInputProps } from './_TogglerInput.js';

// eslint-disable-next-line @typescript-eslint/ban-types
export type TogglerGroupFieldProps<T = 'default', Extras = {}> = {
  className?: string;
} & Omit<FormFieldGroupWrappingProps, 'disabled'> &
  TogglerGroupProps<T, Extras>;

type _TogglerGroupFieldProps = {
  Toggler: (props: TogglerInputProps) => ReactElement;
  isRadio?: true;
  value?: string | ReadonlyArray<string>;
  defaultValue?: string | ReadonlyArray<string>;
  bem: string;
} & BemModifierProps;

export type TogglerGroupFieldOption<T = 'default'> = TogglerGroupOption<T>;
export type TogglerGroupFieldOptions<T = 'default'> = TogglerGroupOptions<T>;

export const TogglerGroupField = (
  props: TogglerGroupFieldProps & _TogglerGroupFieldProps
) => {
  const {
    bem,
    Toggler,

    modifier,
    value,
    defaultValue,
    fieldWrapperProps,
    ...togglerGroupProps
  } = groupFormFieldWrapperProps(props);

  const _value = useMemo(
    () => (value == null ? undefined : typeof value === 'string' ? [value] : value),
    [value]
  );
  const _defaultValue = useMemo(
    () =>
      defaultValue == null
        ? undefined
        : typeof defaultValue === 'string'
        ? [defaultValue]
        : defaultValue,
    [defaultValue]
  );

  return (
    <FormField
      extraClassName={modifiedClass(bem, modifier)}
      group
      {...fieldWrapperProps}
      renderInput={(className, inputProps) => {
        return (
          <TogglerGroup
            bem={className.options}
            {...inputProps}
            {...togglerGroupProps}
            disabled={props.disabled}
            value={_value}
            defaultValue={_defaultValue}
            Toggler={Toggler}
          />
        );
      }}
    />
  );
};
