/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';
import { AlertConsumers } from '@kbn/rule-data-utils';
import { asyncScheduler } from 'rxjs';
import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EuiButtonIcon,
  EuiPopover,
  EuiContextMenu,
  EuiPanel,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

import { useKibana } from '../../../../common/lib/kibana';
import { RuleTableItem } from '../../../../types';
import {
  ComponentOpts as BulkOperationsComponentOpts,
  withBulkRuleOperations,
} from '../../common/components/with_bulk_rule_api_operations';
import { RulesListSnoozePanel } from './rules_list_snooze_panel';
import { isRuleSnoozed } from './rule_status_dropdown';
import './collapsed_item_actions.scss';

export type ComponentOpts = {
  item: RuleTableItem;
  onRuleChanged: () => Promise<void>;
  onLoading: (isLoading: boolean) => void;
  setRulesToDelete: React.Dispatch<React.SetStateAction<string[]>>;
  onEditRule: (item: RuleTableItem) => void;
  onUpdateAPIKey: (id: string[]) => void;
} & Pick<BulkOperationsComponentOpts, 'disableRule' | 'enableRule' | 'snoozeRule' | 'unsnoozeRule'>;

export const CollapsedItemActions: React.FunctionComponent<ComponentOpts> = ({
  item,
  onLoading,
  onRuleChanged,
  disableRule,
  enableRule,
  setRulesToDelete,
  onEditRule,
  onUpdateAPIKey,
  snoozeRule,
  unsnoozeRule,
}: ComponentOpts) => {
  const { ruleTypeRegistry } = useKibana().services;

  const [isPopoverOpen, setIsPopoverOpen] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(!item.enabled);
  useEffect(() => {
    setIsDisabled(!item.enabled);
  }, [item.enabled]);

  const snoozeRuleInternal = useCallback(
    async (snoozeEndTime: string | -1, interval: string | null) => {
      await snoozeRule(item, snoozeEndTime);
    },
    [snoozeRule, item]
  );

  const unsnoozeRuleInternal = useCallback(async () => {
    await unsnoozeRule(item);
  }, [unsnoozeRule, item]);

  const onClose = useCallback(() => {
    setIsPopoverOpen(false);
  }, [setIsPopoverOpen]);

  const isRuleTypeEditableInContext = ruleTypeRegistry.has(item.ruleTypeId)
    ? !ruleTypeRegistry.get(item.ruleTypeId).requiresAppContext
    : false;

  const button = (
    <EuiButtonIcon
      disabled={!item.isEditable}
      data-test-subj="selectActionButton"
      data-testid="selectActionButton"
      iconType="boxesHorizontal"
      onClick={() => setIsPopoverOpen(!isPopoverOpen)}
      aria-label={i18n.translate(
        'xpack.triggersActionsUI.sections.rulesList.collapsedItemActons.popoverButtonTitle',
        { defaultMessage: 'Actions' }
      )}
    />
  );

  const isSnoozed = useMemo(() => {
    return isRuleSnoozed(item);
  }, [item]);

  const snoozedButtonText = useMemo(() => {
    if (item.muteAll) {
      return i18n.translate(
        'xpack.triggersActionsUI.sections.rulesList.collapsedItemActions.snoozedIndefinitely',
        {
          defaultMessage: 'Snoozed indefinitely',
        }
      );
    }
    if (isSnoozed) {
      return i18n.translate(
        'xpack.triggersActionsUI.sections.rulesList.collapsedItemActions.snoozedUntil',
        {
          defaultMessage: 'Snoozed until {snoozeTime}',
          values: {
            snoozeTime: moment(item.isSnoozedUntil).format('MMM D'),
          },
        }
      );
    }
    return i18n.translate(
      'xpack.triggersActionsUI.sections.rulesList.collapsedItemActions.snooze',
      {
        defaultMessage: 'Snooze',
      }
    );
  }, [isSnoozed, item]);

  const snoozePanelItem = useMemo(() => {
    if (isDisabled || item.consumer === AlertConsumers.SIEM) {
      return [];
    }

    return [
      {
        disabled: !item.isEditable || !item.enabledInLicense,
        'data-test-subj': 'snoozeButton',
        icon: 'bellSlash',
        name: snoozedButtonText,
        panel: 1,
      },
    ];
  }, [isDisabled, item, snoozedButtonText]);

  const panels = [
    {
      id: 0,
      hasFocus: false,
      items: [
        ...snoozePanelItem,
        {
          isSeparator: true as const,
        },
        {
          disabled: !item.isEditable || !item.enabledInLicense,
          'data-test-subj': 'disableButton',
          onClick: async () => {
            const enabled = !isDisabled;
            asyncScheduler.schedule(async () => {
              if (enabled) {
                await disableRule({ ...item, enabled });
              } else {
                await enableRule({ ...item, enabled });
              }
              onRuleChanged();
            }, 10);
            setIsDisabled(!isDisabled);
            setIsPopoverOpen(!isPopoverOpen);
          },
          name: isDisabled
            ? i18n.translate(
                'xpack.triggersActionsUI.sections.rulesList.collapsedItemActons.enableTitle',
                { defaultMessage: 'Enable' }
              )
            : i18n.translate(
                'xpack.triggersActionsUI.sections.rulesList.collapsedItemActons.disableTitle',
                { defaultMessage: 'Disable' }
              ),
        },
        {
          disabled: !item.isEditable || !isRuleTypeEditableInContext,
          'data-test-subj': 'editRule',
          onClick: () => {
            setIsPopoverOpen(!isPopoverOpen);
            onEditRule(item);
          },
          name: i18n.translate(
            'xpack.triggersActionsUI.sections.rulesList.collapsedItemActons.editTitle',
            { defaultMessage: 'Edit rule' }
          ),
        },
        {
          disabled: !item.isEditable,
          'data-test-subj': 'updateApiKey',
          onClick: () => {
            setIsPopoverOpen(!isPopoverOpen);
            onUpdateAPIKey([item.id]);
          },
          name: i18n.translate(
            'xpack.triggersActionsUI.sections.rulesList.collapsedItemActions.updateApiKey',
            { defaultMessage: 'Update API key' }
          ),
        },
        {
          disabled: !item.isEditable,
          className: 'collapsedItemActions__deleteButton',
          'data-test-subj': 'deleteRule',
          onClick: () => {
            setIsPopoverOpen(!isPopoverOpen);
            setRulesToDelete([item.id]);
          },
          name: i18n.translate(
            'xpack.triggersActionsUI.sections.rulesList.collapsedItemActons.deleteRuleTitle',
            { defaultMessage: 'Delete rule' }
          ),
        },
      ],
    },
    {
      id: 1,
      title: (
        <EuiFlexGroup alignItems="center" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiIcon type="bellSlash" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            {i18n.translate(
              'xpack.triggersActionsUI.sections.rulesList.collapsedItemActons.snoozeActions',
              { defaultMessage: 'Snooze actions' }
            )}
          </EuiFlexItem>
        </EuiFlexGroup>
      ),
      width: 500,
      content: (
        <EuiPanel>
          <RulesListSnoozePanel
            rule={item}
            onClose={onClose}
            onLoading={onLoading}
            onRuleChanged={onRuleChanged}
            snoozeRule={snoozeRuleInternal}
            unsnoozeRule={unsnoozeRuleInternal}
          />
        </EuiPanel>
      ),
    },
  ];

  return (
    <EuiPopover
      button={button}
      isOpen={isPopoverOpen}
      closePopover={() => setIsPopoverOpen(false)}
      ownFocus
      panelPaddingSize="none"
      data-test-subj="collapsedItemActions"
    >
      <EuiContextMenu
        initialPanelId={0}
        panels={panels}
        className="actCollapsedItemActions"
        data-test-subj="collapsedActionPanel"
        data-testid="collapsedActionPanel"
      />
    </EuiPopover>
  );
};

export const CollapsedItemActionsWithApi = withBulkRuleOperations(CollapsedItemActions);
