import { ClassNameModifiers } from '@reykjavik/hanna-utils/_/classUtils';

export type BemModifierProps = {
  /** List of CSS BEM --modifier's to add to the component's main wrapper.
   *
   * All falsy values are neatly skipped.
   */
  modifier?: ClassNameModifiers;
};
export type BemProps<Required extends boolean = false> = BemModifierProps &
  (Required extends true
    ? {
        /** CSS BEM class-name prefix to be used for this component. Defaults to the same as the original component's displayName */
        bem: string;
      }
    : {
        /** CSS BEM class-name prefix to be used for this component. Defaults to the same as the original component's displayName */
        bem?: string;
      });

// ---------------------------------------------------------------------------

export type I18NProps<Texts extends Record<string, unknown>> = {
  texts?: Texts;
  lang?: string;
};
