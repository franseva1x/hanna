import React from 'react';

import { Button, ButtonProps } from './_abstract/_Button.js';
import { SeenProp } from './utils/seenEffect.js';
import SeenEffect from './SeenEffect.js';

export type MiniMetricsProps = {
  text: string;
  moreButton: ButtonProps;
} & SeenProp;

export const MiniMetrics = (props: MiniMetricsProps) => {
  const { text, moreButton, startSeen } = props;

  return (
    <SeenEffect className="MiniMetrics" startSeen={startSeen}>
      <strong className="MiniMetrics__text">{text}</strong> {'\n'}
      <Button bem="MiniMetrics__more" {...moreButton} />
    </SeenEffect>
  );
};

export default MiniMetrics;
