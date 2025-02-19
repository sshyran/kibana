/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { mountWithIntl, nextTick } from '@kbn/test-jest-helpers';
import { act } from 'react-dom/test-utils';
import { AlertsFlyout } from './alerts_flyout';
import { AlertsField, AlertsTableFlyoutState } from '../../../../types';

const onClose = jest.fn();
const onPaginate = jest.fn();
const props = {
  alert: {
    [AlertsField.name]: ['one'],
    [AlertsField.reason]: ['two'],
    _id: '0123456789',
    _index: '.alerts-default',
  },
  alertsTableConfiguration: {
    id: 'test',
    columns: [
      {
        id: AlertsField.name,
        displayAsText: 'Name',
        initialWidth: 150,
      },
      {
        id: AlertsField.reason,
        displayAsText: 'Reason',
        initialWidth: 250,
      },
    ],
    externalFlyout: {
      body: () => <h3>External flyout body</h3>,
    },
    useInternalFlyout: () => ({
      body: () => <h3>Internal flyout body</h3>,
      header: null,
      footer: () => null,
    }),
    getRenderCellValue: () =>
      jest.fn().mockImplementation((rcvProps) => {
        return `${rcvProps.colIndex}:${rcvProps.rowIndex}`;
      }),
  },
  flyoutIndex: 0,
  alertsCount: 4,
  isLoading: false,
  state: AlertsTableFlyoutState.internal,
  onClose,
  onPaginate,
};

describe('AlertsFlyout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render high level details from the alert', async () => {
    const wrapper = mountWithIntl(<AlertsFlyout {...props} />);
    await act(async () => {
      await nextTick();
      wrapper.update();
    });
    expect(wrapper.find('h3').first().text()).toBe('Internal flyout body');

    const externalWrapper = mountWithIntl(
      <AlertsFlyout
        {...{
          ...props,
          state: AlertsTableFlyoutState.external,
        }}
      />
    );
    await act(async () => {
      await nextTick();
      externalWrapper.update();
    });
    expect(externalWrapper.find('h3').first().text()).toBe('External flyout body');
  });

  const configurations = [AlertsTableFlyoutState.external, AlertsTableFlyoutState.internal];
  for (const configuration of configurations) {
    const base = {
      body: () => <h5>Body</h5>,
      footer: () => null,
    };

    it(`should use ${configuration} header configuration`, async () => {
      const customProps = {
        ...props,
        alertsTableConfiguration: {
          ...props.alertsTableConfiguration,
          ...(configuration === AlertsTableFlyoutState.external
            ? {
                [`${configuration}Flyout`]: {
                  ...base,
                  header: () => <h4>Header</h4>,
                  footer: () => null,
                },
              }
            : {
                useInternalFlyout: () => ({
                  ...base,
                  header: () => <h4>Header</h4>,
                  footer: () => null,
                }),
              }),
        },
        state: configuration,
      };
      const wrapper = mountWithIntl(<AlertsFlyout {...customProps} />);
      await act(async () => {
        await nextTick();
        wrapper.update();
      });
      expect(wrapper.find('h4').first().text()).toBe('Header');
      expect(wrapper.find('h5').first().text()).toBe('Body');
    });

    it(`should use ${configuration} body configuration`, async () => {
      const customProps = {
        ...props,
        alertsTableConfiguration: {
          ...props.alertsTableConfiguration,
          ...(configuration === AlertsTableFlyoutState.external
            ? {
                [`${configuration}Flyout`]: {
                  ...base,
                },
              }
            : {
                useInternalFlyout: () => ({
                  ...base,
                }),
              }),
          [`${configuration}Flyout`]: {
            ...base,
          },
        },
        state: configuration,
      };
      const wrapper = mountWithIntl(<AlertsFlyout {...customProps} />);
      await act(async () => {
        await nextTick();
        wrapper.update();
      });
      expect(wrapper.find('h2').first().text()).toBe('one');
      expect(wrapper.find('h5').first().text()).toBe('Body');
    });

    it(`should use ${configuration} body configuration`, async () => {
      const customProps = {
        ...props,
        alertsTableConfiguration: {
          ...props.alertsTableConfiguration,
          ...(configuration === AlertsTableFlyoutState.external
            ? {
                [`${configuration}Flyout`]: {
                  ...base,
                  footer: () => <h6>Footer</h6>,
                },
              }
            : {
                useInternalFlyout: () => ({
                  ...base,
                  footer: () => <h6>Footer</h6>,
                }),
              }),
        },
        state: configuration,
      };
      const wrapper = mountWithIntl(<AlertsFlyout {...customProps} />);
      await act(async () => {
        await nextTick();
        wrapper.update();
      });
      expect(wrapper.find('h2').first().text()).toBe('one');
      expect(wrapper.find('h5').first().text()).toBe('Body');
      expect(wrapper.find('h6').first().text()).toBe('Footer');
    });
  }

  it('should allow pagination with next', async () => {
    const wrapper = mountWithIntl(<AlertsFlyout {...props} />);
    await act(async () => {
      await nextTick();
      wrapper.update();
    });
    wrapper.find('[data-test-subj="pagination-button-next"]').first().simulate('click');
    expect(onPaginate).toHaveBeenCalledWith(1);
  });

  it('should allow pagination with previous', async () => {
    const customProps = {
      ...props,
      flyoutIndex: 1,
    };
    const wrapper = mountWithIntl(<AlertsFlyout {...customProps} />);
    await act(async () => {
      await nextTick();
      wrapper.update();
    });
    wrapper.find('[data-test-subj="pagination-button-previous"]').first().simulate('click');
    expect(onPaginate).toHaveBeenCalledWith(0);
  });
});
