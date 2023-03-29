import React from 'react';
import type { MetaFunction } from '@remix-run/node';
import { FooterInfo, FooterInfoBoxes } from '@reykjavik/hanna-react/FooterInfo';

import { Minimal } from '../../layout/Minimal.js';
import type { TestingInfo } from '../../test-helpers/testingInfo.js';
import { autoTitle } from '../../utils/meta.js';

export const meta: MetaFunction = autoTitle;

// // Use `handle` if you're using multiple Hanna compnents
// export const handle = cssTokens('Token');

const dummyContent: FooterInfoBoxes = [
  {
    title: 'Opnunartímar',
    main: true,
    html: `
			<h4>Þjónustuver</h4>
			<p>
			<strong>Borgartún 12–14, 105 Reykjavik</strong><br />
			Virka daga kl. 08:30–16:00
			</p>
			<p>
			<strong>Teikniafgreiðsla</strong><br />
			Virka daga kl. 08:30–16:00
			</p>
			<h4>Ráðhúsið</h4>
			<p>
				<strong>Tjarnargata 11, 101 Reykjavík</strong><br />
				Virka daga kl. 8:00–18:00<br />
				Helgar kl. 10:00–18:00<br />
			</p>
		`,
  },
  {
    title: 'Hafa samband',
    // modifier: 'contactus', // className
    html: `
			<ul>
				<li><a href="https://abendingar.reykjavik.is/" target="_blank">Ábendingar <small>Sendu okkur línu</small></a></li>
				<li><a href="https://svarbox.teljari.is/?c=1030" target="_blank">Netspjall <small>Opið virka daga kl. 8:30–16:00</small></a></li>
				<li><a href="/spurt-og-svarad">Spurt og svarað <small>Algengar spurningar og svör</small></a></li>
				<li><a href="tel:+3544111111">Þjónustuver 411-1111 <small id="hover-me">Opið virka daga kl. 8:30–16:00</small></a></li>
				<li><a href="mailto:upplysingar@reykjavik.is">upplysingar@reykjavik.is <small>Sendu okkur línu</small></a></li>
			</ul>
		`,
  },
  {
    title: 'Alls konar',
    html: `
			<ul>
				<li><a href="https://minarsidur.reykjavik.is/">Mínar síður</a></li>
				<li><a href="https://reykjavik.is/laus-storf/oll-storf">Laus störf</a></li>
				<li><a href="https://abendingar.reykjavik.is/">Ábendingar</a></li>
				<li><a href="/thjonustuver">Þjónustuver</a></li>
				<li><a href="/frettir">Fréttir</a></li>
				<li><a href="/gjaldskrar">Gjaldskrár</a></li>
				<li><a href="http://teikningar.reykjavik.is/">Teikningavefur</a></li>
				<li><a href="/sites/default/files/ymis_skjol/skjol_utgefid_efni/personuverndarstefna_reykjavikurborgar_mars_2019.pdf">Persónuverndarstefna</a></li>
			</ul>
		`,
  },
];

export default () => {
  return (
    <Minimal slot="footer">
      <FooterInfo boxes={dummyContent} />
    </Minimal>
  );
};

// ---------------------------------------------------------------------------

export const testing: TestingInfo = {
  extras: async ({ page, localScreenshot }) => {
    const hoverMe = page.locator('small#hover-me');
    const ulElm = hoverMe.locator('closest=ul');

    await hoverMe.hover();
    await localScreenshot(ulElm, 'link-hover');
  },
};
