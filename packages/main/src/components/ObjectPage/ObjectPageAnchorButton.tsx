import '@ui5/webcomponents-icons/dist/slim-arrow-down';
import React, { FC, ReactElement, useEffect, useRef } from 'react';
import { ObjectPageSectionPropTypes } from '../ObjectPageSection';
import { ObjectPageAnchorTab } from './ObjectPageAnchorTab';
import { safeGetChildrenArray } from './ObjectPageUtils';
import { getEffectiveScopingSuffixForTag } from '@ui5/webcomponents-base/dist/CustomElementsScope';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
ObjectPageAnchorTab.define();

const tagName = 'ui5-object-page-anchor-tab';

interface ObjectPageAnchorPropTypes {
  section: ReactElement<ObjectPageSectionPropTypes>;
  onShowSubSectionPopover: (event: any, section: any) => void;
  index: number;
  selected: boolean;
}

export const ObjectPageAnchorButton: FC<ObjectPageAnchorPropTypes> = (props: ObjectPageAnchorPropTypes) => {
  const ref = useRef<HTMLElement>();
  const { section, index, selected, onShowSubSectionPopover } = props;

  const hasSubSections = safeGetChildrenArray<any>(section.props.children).some(
    (subSection) => subSection.props?.isSubSection
  );

  useEffect(() => {
    const listener = (e) => {
      onShowSubSectionPopover(e, section);
    };
    const el = ref.current;
    el.addEventListener('show-sub-sections', listener);
    return () => {
      el?.removeEventListener('show-sub-sections', listener);
    };
  }, [onShowSubSectionPopover]);

  const tagNameSuffix: string = getEffectiveScopingSuffixForTag(tagName);
  const Component = (tagNameSuffix ? `${tagName}-${tagNameSuffix}` : tagName) as any;

  return (
    <Component
      ref={ref}
      data-index={index}
      data-section-id={section.props.id}
      text={section.props.titleText}
      selected={selected || undefined}
      with-sub-sections={hasSubSections || undefined}
    />
  );
};
