import React, { ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { focusElm } from '@hugsmidjan/qj/focusElm';
import {
  ClassNameModifiers,
  Cleanup,
  EitherObj,
  modifiedClass,
} from '@reykjavik/hanna-utils';
import { DEFAULT_LANG, DefaultTexts, getTexts } from '@reykjavik/hanna-utils/i18n';

import { Link } from './_abstract/_Link.js';
import {
  AuxilaryPanelIllustration,
  AuxiliaryPanel,
  AuxiliaryPanelProps,
} from './MainMenu/_Auxiliary.js';
import {
  MegaMenuItem,
  MegaMenuItemList,
  MegaMenuPanel,
  PrimaryPanel,
  PrimaryPanelI18n,
} from './MainMenu/_PrimaryPanel.js';
import { I18NProps } from './utils/types.js';
import { useFormatMonitor } from './utils/useFormatMonitor.js';
import { useShortState } from './utils/useShortState.js';
import {
  MobileMenuToggler,
  MobileMenuTogglerI18n,
  useMobileMenuTogglerState,
} from './MobileMenuToggler.js';
import { SSRSupportProps, useDomid, useIsBrowserSide, WrapperElmProps } from './utils.js';

const findActivePanel = (megaPanels: ReadonlyArray<MegaMenuPanel>, activeId?: string) =>
  activeId ? megaPanels.find((panel) => activeId === panel.id) : undefined;

// const HamburgerMedias: Record<string, 1> = { phone: 1, phablet: 1, tablet: 1 };
const TopmenuMedias: Record<string, 1> = { netbook: 1, wide: 1 };

// ---------------------------------------------------------------------------

export type MainMenuI18n = Cleanup<
  {
    homeLabel?: string;
    title: string;
    /** @deprecated Not used (Will be removed in v0.11) */
    lang?: string;
  } & PrimaryPanelI18n &
    EitherObj<
      MobileMenuTogglerI18n,
      {} // eslint-disable-line @typescript-eslint/ban-types
    >
>;

export const defaultMainMenuTexts = {
  is: {
    title: 'Aðalvalmynd',
    homeLabel: 'Forsíða',
    backToMenu: 'Loka',
    backToMenuLong: 'Til baka í valmynd',
  },
  en: {
    title: 'Main Menu',
    homeLabel: 'Home page',
    backToMenu: 'Close',
    backToMenuLong: 'Close and return to menu',
  },
  pl: {
    title: 'Menu główne',
    homeLabel: 'Strona główna',
    backToMenu: 'Zamknij',
    backToMenuLong: 'Zamknij i wróć do menu',
  },
} satisfies DefaultTexts<Omit<MainMenuI18n, 'lang'>>;

// ---------------------------------------------------------------------------

const _issueHomeLinkWarnings = (hasHomeItem: boolean, hasHomeLinkProp: boolean) => {
  const bothDefined = hasHomeItem && hasHomeLinkProp;
  const neitherDefined = !hasHomeItem && !hasHomeLinkProp;

  if (bothDefined) {
    console.warn(
      'Ignoring a redundant `MainMenuProps.homeLink` value. ' +
        '(As `MainMenuProps.items` already starts with a "Home" item.)'
    );
  } else if (neitherDefined) {
    console.warn(
      '`MainMenuProps.homeLink` is missing. Auto-inserting a generic "home link" with `href="/"`.'
    );
  }
};

const normalizeMenuItems = (
  itemsProp: MainMenuProps['items'],
  megaPanels: NonNullable<MainMenuProps['megaPanels']>,
  homeLink: MainMenuProps['homeLink'],
  texts: NonNullable<MainMenuProps['texts']>
) => {
  type MenuItemNormalized =
    | ((props: { closeMenu: () => void }) => ReactElement)
    | MainMenuSeparator
    | (MainMenuItem & {
        megaPanel?: MegaMenuPanel;
        controlsId?: string;
      });

  const items = itemsProp.map((item): MenuItemNormalized => {
    if (item === '---' || !('label' in item)) {
      return item;
    }
    const href = item.href;
    const controlsId =
      item.controlsId || (href && /^#/.test(href) && href.slice(1)) || undefined;
    const megaPanel = controlsId
      ? megaPanels.find((panel) => panel.id === controlsId)
      : undefined;
    return { ...item, controlsId, megaPanel };
  });

  const firstItem = items[0];
  if (firstItem) {
    // Prepend menu item list with a "home link", unless it's already there
    const hasHomeItem = typeof firstItem === 'object' && firstItem.modifier === 'home';

    if (process.env.NODE_ENV !== 'production') {
      _issueHomeLinkWarnings(hasHomeItem, !!homeLink);
    }

    if (!hasHomeItem) {
      if (!homeLink || typeof homeLink === 'string') {
        homeLink = {
          href: homeLink || '/',
          label: texts.homeLabel || defaultMainMenuTexts[DEFAULT_LANG].homeLabel,
          lang: texts.homeLabel ? undefined : DEFAULT_LANG,
        };
      }
      items.unshift({ ...homeLink, modifier: 'home' });
    }
  }

  return items;
};

// ---------------------------------------------------------------------------

const emptyPanelList: Array<MegaMenuPanel> = [];

// ---------------------------------------------------------------------------

export type {
  AuxilaryPanelIllustration,
  AuxiliaryPanelProps,
  MegaMenuItem,
  MegaMenuItemList,
  MegaMenuPanel,
};

export type MainMenuItem = {
  /** Visible label text */
  label: string;
  /** Un-abbreviated label set as `title=""` and `aria-label=""` */
  labelLong?: string;
  /** Language of the link label */
  lang?: string;
  /** Languge of the linked resource */
  hrefLang?: string;

  /**
   * Puts a modifier className for the menu __item <li/> element.
   * */
  modifier?: ClassNameModifiers;
  /** Signifies if the menu item is part of the page's breadcrumb trail */
  current?: boolean;

  /**
   * The URL the link points to.
   *
   * If neither `href` nor `onClick` is passed, then the item is not rendered
   * at all.
   */
  href?: string;
  /** Sets `target=""` on anchor tags with a `href` attribute. */
  target?: React.HTMLAttributeAnchorTarget;

  /**
   * Adding `onClick` automatically results in a <button/> element being
   * rendered. If `href` is also passed, then a <a href/> element is rendered
   * during initial (server-side) render, which then gets replaced by a
   * <button/> element during the first client-side render.
   *
   * NOTE: Clicking a menu item will automatically close HannaUIState's
   * "Hamburger menu" (a.k.a. "Mobile menu")
   * … unless the `onClick` function explicitly returns `false`.
   */
  onClick?: (index: number, item: MainMenuItem) => void | boolean;
  /** Sets `aria-controls=""` on `<button/>`s with `onClick` */
  controlsId?: string;
};

/** String token that hints that a flexible space should be inserted at this
 * point in the menu item list.
 */
export type MainMenuSeparator = '---';

export type MainMenuItemList = Array<
  MainMenuItem | MainMenuSeparator | ((props: { closeMenu: () => void }) => ReactElement)
>;

// ---------------------------------------------------------------------------

export type MainMenuProps = {
  /**
   * Top-level screen-reader headline/label for the whole menu.
   * Defaults to a translation of "Main Menu"
   */
  title?: string;
  items: MainMenuItemList;
  /**
   * Link for the homepage - defaults to `"/"` adding a
   * generic sounding "Home"/"Forsíða" label
   */
  homeLink?: string | Omit<MainMenuItem, 'modifier'>;
  megaPanels?: Array<MegaMenuPanel>;
  auxiliaryPanel?: AuxiliaryPanelProps;
  /**
   * NOTE: Clicking a MainMenu item will automatically close HannaUIState's
   * "Hamburger menu" (a.k.a. "Mobile menu")
   * … unless the `onItemClick` function explicitly returns `false`.
   */
  onItemClick?: (index: number, item: MainMenuItem) => void | boolean;
  activePanelId?: string;
} & SSRSupportProps &
  I18NProps<MainMenuI18n> &
  WrapperElmProps<null, 'aria-label'>;

/*
  NOTE:
  This is made into sub-component to allow using the `useMobileMenuTogglerState`
  hook. This MainMenu component will eventually be deprecated, and we're
  maintaining a bunch of already deprecated legacy hook/utils exports,
  so it doesn't seem worth the effort to refactor this into something slightly
  "cleaner", cecause that would increase more complexity for the legacy exports.
*/
export const _MainMenu = (props: MainMenuProps) => {
  const {
    megaPanels = emptyPanelList,
    onItemClick,
    ssr,
    auxiliaryPanel,
    wrapperProps = {},
  } = props;

  const texts = getTexts(props, defaultMainMenuTexts);
  const title = props.title || texts.title;

  const { closeHamburgerMenu } = useMobileMenuTogglerState();

  const isBrowser = useIsBrowserSide(ssr);

  const _menuElmRef = useRef<HTMLElement>(null);
  const menuElmRef = wrapperProps.ref || _menuElmRef;
  const pressedLinkRef = useRef<HTMLButtonElement>(null);
  const activePanelRef = useRef<HTMLLIElement>(null);

  const [activePanel, _setActivePanel] = useState<MegaMenuPanel | undefined>(
    () => isBrowser && findActivePanel(megaPanels, props.activePanelId)
  );
  const [laggyActivePanel, setLaggyActivePanel] = useShortState<
    MegaMenuPanel | undefined
  >();

  const setActivePanel = useMemo(
    () =>
      isBrowser
        ? (newActive: MegaMenuPanel | undefined, setFocus = true) => {
            const htmlElm = document.documentElement;
            const htmlElmDataset = htmlElm.dataset;

            // const menuElm = menuElmRef.current as HTMLElement;
            _setActivePanel((activePanel) => {
              if (!newActive && !activePanel) {
                return undefined;
              }
              if (!newActive) {
                setLaggyActivePanel(activePanel, 1000);
                htmlElm.scrollTop = parseInt(htmlElmDataset.scrollTop || '') || 0;
                delete htmlElmDataset.scrollTop;
                delete htmlElmDataset.megaPanelActive;
              } else {
                setLaggyActivePanel(undefined, 0);
                htmlElmDataset.scrollTop = String(htmlElm.scrollTop);
                htmlElm.scrollTop = 0;
                htmlElmDataset.megaPanelActive = '';
              }

              if (setFocus) {
                const pressedLinkElm = pressedLinkRef.current; // pressedLinkElm will be undefined when setTimeout fires
                setTimeout(() => {
                  if (!newActive) {
                    // const buttonElm = menuElm.querySelector<HTMLButtonElement>(
                    // 	'button.MainMenu__link[aria-pressed="true"]'
                    // );
                    focusElm(pressedLinkElm);
                  } else if (newActive !== activePanel) {
                    // const panelElm = menuElm.querySelector<HTMLButtonElement>(
                    // 	'.PrimaryPanel--active'
                    // );
                    focusElm(activePanelRef.current);
                  }
                }, 100);
              }
              return newActive;
            });
          }
        : () => undefined,
    [setLaggyActivePanel, isBrowser]
  );

  useFormatMonitor((media) => {
    const leftTopmenu = !TopmenuMedias[media.is] && TopmenuMedias[media.was || ''];
    if (leftTopmenu) {
      setActivePanel(undefined);
    }
  });

  const hasActivePanel = !!activePanel;

  const menuItems = useMemo(
    () => normalizeMenuItems(props.items, megaPanels, props.homeLink, texts),
    [props.items, props.homeLink, megaPanels, texts]
  );

  useEffect(() => {
    setActivePanel(findActivePanel(megaPanels, props.activePanelId));
  }, [props.activePanelId, megaPanels, setActivePanel]);

  useEffect(
    () => {
      const menuElm = menuElmRef.current;
      if (!isBrowser || !hasActivePanel || !menuElm) {
        return;
      }

      const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setActivePanel(undefined);
        }
      };
      const clickHandler = (e: MouseEvent) => {
        if (!menuElm.contains(e.target as HTMLElement | null)) {
          setActivePanel(undefined);
        }
      };
      document.addEventListener('keydown', escHandler);
      document.addEventListener('click', clickHandler, true);

      return () => {
        document.removeEventListener('keydown', escHandler);
        document.removeEventListener('click', clickHandler, true);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasActivePanel, setActivePanel, isBrowser /* , menuElmRef */]
  );

  if (menuItems.length === 0) {
    return null;
  }

  /** Close mega panels on clicks their links. */
  const handleMegaPanelClicks = (e: React.MouseEvent<HTMLElement>) => {
    if (
      // NOTE: We can NOT check for `e.defaultPrevented` because if the current
      // LinkRenderer is something like Next.js or Remix's <Link/> compponent
      // then default is ALWAYS prevented
      (e.target as HTMLElement).closest('a[href]')
    ) {
      setActivePanel(undefined);
      closeHamburgerMenu();
    }
  };

  return (
    <nav
      {...props.wrapperProps}
      className={modifiedClass('MainMenu', null, wrapperProps.className)}
      aria-label={title}
      data-sprinkled={isBrowser}
      ref={menuElmRef}
    >
      <h2 className="MainMenu__title">{title}</h2>
      <ul className="MainMenu__items">
        {menuItems.map((item, i) => {
          if (item === '---') {
            return <li key={i} className="MainMenu__separator" aria-hidden="true" />;
          }
          if (!('label' in item)) {
            const Item = item;
            return (
              <li key={i} className="MainMenu__item">
                <Item closeMenu={closeHamburgerMenu} />
              </li>
            );
          }

          const { label, labelLong, lang, controlsId, onClick } = item;
          const pressed = (activePanel && controlsId === activePanel.id) || undefined;
          return (
            <li
              key={i}
              className={modifiedClass('MainMenu__item', item.modifier)}
              aria-current={item.current || undefined}
            >
              {
                isBrowser && !!(item.megaPanel || onClick) ? (
                  // only print script-driven buttons in the browser
                  <button
                    className="MainMenu__link"
                    onClick={() => {
                      const keepOpen1 = onClick && onClick(i, item) === false;
                      const keepOpen2 = onItemClick && onItemClick(i, item) === false;
                      const { megaPanel } = item;
                      if (megaPanel) {
                        setActivePanel(megaPanel !== activePanel ? megaPanel : undefined);
                      } else {
                        !(keepOpen1 || keepOpen2) && closeHamburgerMenu();
                      }
                    }}
                    ref={pressed && pressedLinkRef}
                    aria-pressed={pressed}
                    aria-controls={controlsId}
                    aria-label={labelLong}
                    title={labelLong} // For auto-tooltips on desktop
                    lang={lang}
                    type="button"
                  >
                    {label}
                  </button>
                ) : item.href != null ? (
                  // always render links server-side
                  <Link
                    className="MainMenu__link"
                    href={item.href}
                    target={item.target}
                    aria-label={labelLong}
                    title={labelLong} // For auto-tooltips on desktop
                    onClick={() => {
                      const keepOpen = onItemClick && onItemClick(i, item) === false;
                      !keepOpen && closeHamburgerMenu();
                    }}
                    lang={lang}
                    hrefLang={item.hrefLang}
                  >
                    {label}
                  </Link>
                ) : undefined // skip rendering non-link menu items server side
              }
            </li>
          );
        })}
      </ul>
      {'\n\n'}
      {megaPanels.length > 0 && (
        <div className={modifiedClass('MainMenu__panelsWrap', [activePanel && 'active'])}>
          <ul className="MainMenu__panels" onClick={handleMegaPanelClicks}>
            {megaPanels.map((panel, i) => {
              if (!panel.items.length) {
                return;
              }
              const isActive =
                activePanel === panel || laggyActivePanel === panel || undefined;
              const isParent = !!panel.items.find((item) => item.current);

              return (
                <PrimaryPanel
                  key={i}
                  isParent={isParent}
                  isActive={isActive}
                  panel={panel}
                  isBrowser={isBrowser}
                  setActivePanel={setActivePanel}
                  texts={texts}
                  activeRef={activePanelRef}
                />
              );
            })}
            {auxiliaryPanel && <AuxiliaryPanel {...auxiliaryPanel} />}
          </ul>
        </div>
      )}
    </nav>
  );
};

// ---------------------------------------------------------------------------

export const MainMenu = (props: MainMenuProps) => {
  const _wrapperProps = props.wrapperProps;
  const id = useDomid(_wrapperProps && _wrapperProps.id);
  const wrapperProps = _wrapperProps ? { ..._wrapperProps, id } : { id };

  const texts = getTexts(props, defaultMainMenuTexts);

  return (
    <MobileMenuToggler
      ssr={props.ssr}
      lang={props.lang}
      texts={texts.togglerLabel ? texts : undefined}
      controlsId={id}
    >
      <_MainMenu {...props} wrapperProps={wrapperProps} />
    </MobileMenuToggler>
  );
};

export default MainMenu;
