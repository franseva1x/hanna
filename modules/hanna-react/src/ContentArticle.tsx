import React, { ReactNode } from 'react';

import { SeenProp, useSeenEffect } from './utils/seenEffect';
import ArticleMeta, { ArticleMetaProps } from './ArticleMeta';
import ContentImage, { ContentImageProps } from './ContentImage';
import Heading from './Heading';
import RelatedLinks, { RelatedLinksProps } from './RelatedLinks';
import TextBlock from './TextBlock';
import VSpacer from './VSpacer';

export type ContentArticleProps = {
  /** Date, author, etc. */
  meta?: ArticleMetaProps['items'];
  headline: string;
  headlineTag?: 'h1' | 'h2';
  topImage?: ContentImageProps;
  body: ReactNode;
  relatedLinks?: RelatedLinksProps;
} & SeenProp;

export const ContentArticle = (props: ContentArticleProps) => {
  const { relatedLinks } = props;
  const [ref] = useSeenEffect(props.startSeen);

  return (
    <div className="ContentArticle" ref={ref}>
      {props.meta && <ArticleMeta items={props.meta} />}
      <Heading forceH1={props.headlineTag === 'h1'}>{props.headline}</Heading>
      <TextBlock startSeen>
        {props.topImage && <ContentImage {...props.topImage} />}
        {props.body}
      </TextBlock>
      {relatedLinks && relatedLinks.links.length > 0 && (
        <VSpacer size="small">
          <hr />
        </VSpacer>
      )}
      {relatedLinks && <RelatedLinks {...relatedLinks} />}
    </div>
  );
};

export default ContentArticle;
