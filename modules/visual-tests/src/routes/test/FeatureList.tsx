import React from 'react';
import type { MetaFunction } from '@remix-run/node';
import FeatureList, { FeatureListProps } from '@reykjavik/hanna-react/FeatureList';

//import { getEfnistaknUrl } from '@reykjavik/hanna-utils/assets';
import { Minimal } from '../../layout/Minimal';
import type { TestingInfo } from '../../test-helpers/testingInfo';
import { autoTitle } from '../../utils/meta';

export const meta: MetaFunction = autoTitle;

// // Use `handle` if you're using multiple Hanna compnents
//export const handle = { cssTokens: ['FeatureList', 'TextBlock'] };

const features: FeatureListProps['features'] = [
  { name: 'Útiklefar', icon: 'sund_utiklefi' },
  { name: 'Frítt WiFi', icon: 'wifi' },
  { name: '25 metra laug', icon: 'sund_metralaug' },
  { name: 'Sauna', icon: 'sund_sauna' },
  { name: 'Heitir pottar', icon: 'sund_sauna' },
  { name: 'No icon specified' },
  { name: 'Sala á sundfatnaði', icon: 'sund_sundfot' },
  { name: 'Barnalaug', icon: 'sund_barnalaug' },
  { name: 'Eimbað', icon: 'sund_metralaug' },
  { name: 'Kaldur pottur', icon: 'sund_kaldurpottur' },
];
export default function () {
  return (
    // Minimal is a no-frills, no-chrome replacement for the `Layout` component,
    <Minimal>
      <br />
      <br />
      <br />
      <br />
      <br />
      <FeatureList title="Lorem Ipsum og Foo Bar" features={features} startSeen={true} />
    </Minimal>
  );
}

export const testing: TestingInfo = {
  clipViewport: true,
};