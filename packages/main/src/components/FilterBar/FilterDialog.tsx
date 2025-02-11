import '@ui5/webcomponents-icons/dist/search';
import { createUseStyles } from 'react-jss';
import { useI18nBundle } from '@ui5/webcomponents-react-base/dist/hooks';
import { enrichEventWithDetails } from '@ui5/webcomponents-react-base/dist/Utils';
import {
  BASIC,
  CANCEL,
  CLEAR,
  FILTERS,
  GO,
  RESTORE,
  SAVE,
  SEARCH_FOR_FILTERS,
  SHOW_ON_FILTER_BAR
} from '@ui5/webcomponents-react/dist/assets/i18n/i18n-defaults';
import { Bar } from '@ui5/webcomponents-react/dist/Bar';
import { BarDesign } from '@ui5/webcomponents-react/dist/BarDesign';
import { Button } from '@ui5/webcomponents-react/dist/Button';
import { ButtonDesign } from '@ui5/webcomponents-react/dist/ButtonDesign';
import { CheckBox } from '@ui5/webcomponents-react/dist/CheckBox';
import { Dialog } from '@ui5/webcomponents-react/dist/Dialog';
import { FlexBox } from '@ui5/webcomponents-react/dist/FlexBox';
import { FlexBoxAlignItems } from '@ui5/webcomponents-react/dist/FlexBoxAlignItems';
import { FlexBoxDirection } from '@ui5/webcomponents-react/dist/FlexBoxDirection';
import { FlexBoxJustifyContent } from '@ui5/webcomponents-react/dist/FlexBoxJustifyContent';
import { Icon } from '@ui5/webcomponents-react/dist/Icon';
import { Input } from '@ui5/webcomponents-react/dist/Input';
import { Text } from '@ui5/webcomponents-react/dist/Text';
import { Title } from '@ui5/webcomponents-react/dist/Title';
import { TitleLevel } from '@ui5/webcomponents-react/dist/TitleLevel';
import React, { Children, cloneElement, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ui5DialogDomRef } from '@ui5/webcomponents-react/interfaces/Ui5DialogDomRef';
import { stopPropagation } from '../../internal/stopPropagation';
import styles from './FilterBarDialog.jss';
import { filterValue, renderSearchWithValue, syncRef } from './utils';
import { createPortal } from 'react-dom';

const useStyles = createUseStyles(styles, { name: 'FilterBarDialog' });
export const FilterDialog = (props) => {
  const {
    filterBarRefs,
    open,
    handleDialogClose,
    children,
    showClearButton,
    showRestoreButton,
    showGoButton,
    showSearch,
    renderFBSearch,
    handleClearFilters,
    handleRestoreFilters,
    handleDialogSave,
    searchValue,
    handleSearchValueChange,
    onGo,
    handleSelectionChange,
    handleDialogSearch,
    handleDialogCancel
  } = props;
  const classes = useStyles();
  const [searchString, setSearchString] = useState('');
  const searchRef = useRef(null);
  const [toggledFilters, setToggledFilters] = useState({});
  const dialogRefs = useRef({});
  const dialogRef = useRef<Ui5DialogDomRef>();

  const i18nBundle = useI18nBundle('@ui5/webcomponents-react');

  const basicText = i18nBundle.getText(BASIC);
  const cancelText = i18nBundle.getText(CANCEL);
  const clearText = i18nBundle.getText(CLEAR);
  const restoreText = i18nBundle.getText(RESTORE);
  const saveText = i18nBundle.getText(SAVE);
  const searchForFiltersText = i18nBundle.getText(SEARCH_FOR_FILTERS);
  const showOnFilterBarText = i18nBundle.getText(SHOW_ON_FILTER_BAR);
  const filtersTitle = i18nBundle.getText(FILTERS);
  const goText = i18nBundle.getText(GO);

  useEffect(() => {
    if (open) {
      dialogRef.current.show();
    }
  }, [open]);

  const handleSearch = useCallback(
    (e) => {
      if (handleDialogSearch) {
        handleDialogSearch(enrichEventWithDetails(e, { value: e.target.value }));
      }
      setSearchString(e.target.value);
    },
    [setSearchString, handleDialogSearch]
  );
  const handleSave = useCallback(
    (e) => {
      if (renderFBSearch) {
        handleSearchValueChange(searchRef.current?.children[1].value);
      }
      handleDialogSave(e, dialogRefs.current, toggledFilters);
    },
    [renderFBSearch, handleSearchValueChange, searchRef, handleDialogSave, toggledFilters, dialogRefs]
  );

  const handleClose = useCallback(
    (e) => {
      stopPropagation(e);
      if (!showGoButton) {
        handleSave(e);
        return;
      }
      handleDialogClose(e);
    },
    [showGoButton, handleSave, handleDialogClose]
  );

  const handleDialogGo = useCallback(
    (e) => {
      if (onGo) {
        onGo(enrichEventWithDetails(e));
      }
      handleDialogClose(e);
    },
    [onGo, handleDialogClose]
  );

  const handleRestore = useCallback(
    (e) => {
      handleRestoreFilters(e, 'dialog');
    },
    [handleRestoreFilters]
  );

  const handleCancel = useCallback(
    (e) => {
      if (handleDialogCancel) {
        handleDialogCancel(enrichEventWithDetails(e));
      }
      handleDialogClose(e);
    },
    [handleDialogCancel]
  );

  const footerContentRight = useMemo(
    () => (
      <FlexBox justifyContent={FlexBoxJustifyContent.End} className={classes.footer}>
        {showGoButton && (
          <Button onClick={handleDialogGo} design={ButtonDesign.Emphasized} title={goText}>
            {goText}
          </Button>
        )}
        {showClearButton && <Button onClick={handleClearFilters}>{clearText}</Button>}
        {showRestoreButton && <Button onClick={handleRestore}>{restoreText}</Button>}
        <Button onClick={handleSave}>{saveText}</Button>
        <Button design={ButtonDesign.Transparent} onClick={handleCancel}>
          {cancelText}
        </Button>
      </FlexBox>
    ),
    [
      goText,
      showGoButton,
      classes.footer,
      handleDialogGo,
      showClearButton,
      handleClearFilters,
      showRestoreButton,
      handleRestore,
      handleSave,
      handleCancel
    ]
  );

  const renderChildren = () => {
    return children
      .filter((item) => {
        return (
          !!item?.props &&
          item.props?.visible &&
          (item.props?.label?.toLowerCase().includes(searchString.toLowerCase()) || searchString.length === 0)
        );
      })
      .map((child) => {
        const filterBarItemRef = filterBarRefs.current[child.key];
        let filterItemProps = {};
        if (filterBarItemRef) {
          filterItemProps = filterValue(filterBarItemRef, child);
        }
        if (!child.props.children) return child;
        return cloneElement(child as ReactElement<any>, {
          children: {
            ...child.props.children,
            props: {
              ...child.props.children.props,
              ...filterItemProps
            },
            ref: (node) => {
              dialogRefs.current[child.key] = node;
              syncRef(child.props.children.ref, node);
            }
          }
        });
      });
  };

  const handleCheckBoxChange = useCallback(
    (element) => (e) => {
      if (handleSelectionChange) {
        handleSelectionChange(enrichEventWithDetails(e, { element, checked: e.target.checked }));
      }
      setToggledFilters((old) => ({ ...old, [element.key]: e.target.checked }));
    },
    [setToggledFilters, handleSelectionChange]
  );
  const renderGroups = () => {
    const groups = {};
    Children.forEach(renderChildren(), (child) => {
      const childGroups = child.props.groupName ?? 'default';
      if (groups[childGroups]) {
        groups[childGroups].push(child);
      } else {
        groups[childGroups] = [child];
      }
    });
    return Object.keys(groups)
      .sort((x, y) => (x === 'default' ? -1 : y === 'role' ? 1 : 0))
      .map((item, index) => {
        const filters = groups[item].map((el) => {
          return (
            <div className={classes.singleFilter} key={`${el.key}-container`}>
              {el}
              <CheckBox
                role="checkbox"
                checked={el.props.visibleInFilterBar || el.props.required || el.type.displayName !== 'FilterGroupItem'}
                onChange={handleCheckBoxChange(el)}
                disabled={el.props.required || el.type.displayName !== 'FilterGroupItem'}
              />
            </div>
          );
        });
        return (
          <div className={classes.groupContainer} key={item}>
            <FlexBox justifyContent={FlexBoxJustifyContent.SpaceBetween} alignItems={FlexBoxAlignItems.Center}>
              <Title
                level={TitleLevel.H5}
                className={index === 0 ? classes.groupTitle : ''}
                tooltip={item === 'default' ? basicText : item}
              >
                {item === 'default' ? basicText : item}
              </Title>
              {index === 0 && <Text wrapping={false}>{showOnFilterBarText}</Text>}
            </FlexBox>
            <div className={classes.filters}>{filters}</div>
          </div>
        );
      });
  };

  return createPortal(
    <Dialog
      ref={dialogRef}
      header={
        <FlexBox direction={FlexBoxDirection.Column} alignItems={FlexBoxAlignItems.Center} className={classes.header}>
          <Title level={TitleLevel.H4} tooltip={filtersTitle}>
            {filtersTitle}
          </Title>
          {showSearch && (
            <Input placeholder={searchForFiltersText} onInput={handleSearch} icon={<Icon name="search" />} />
          )}
        </FlexBox>
      }
      footer={<Bar design={BarDesign.Footer} endContent={footerContentRight} />}
      onAfterClose={handleClose}
    >
      <div className={classes.dialog} role="dialog">
        {renderFBSearch && (
          <div className={classes.fbSearch} ref={searchRef}>
            <span />
            {renderSearchWithValue(renderFBSearch, searchValue)}
          </div>
        )}
        {renderGroups()}
      </div>
    </Dialog>,
    document.body
  );
};
