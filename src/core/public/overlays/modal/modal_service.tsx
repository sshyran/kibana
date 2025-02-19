/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/* eslint-disable max-classes-per-file */

import { i18n as t } from '@kbn/i18n';
import { EuiModal, EuiConfirmModal, EuiConfirmModalProps } from '@elastic/eui';
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { Subject } from 'rxjs';
import type { ThemeServiceStart } from '@kbn/core-theme-browser';
import { I18nStart } from '../../i18n';
import { MountPoint } from '../../types';
import { OverlayRef } from '../types';
import { MountWrapper, CoreContextProvider } from '../../utils';

/**
 * A ModalRef is a reference to an opened modal. It offers methods to
 * close the modal.
 *
 * @public
 */
class ModalRef implements OverlayRef {
  public readonly onClose: Promise<void>;

  private closeSubject = new Subject<void>();

  constructor() {
    this.onClose = this.closeSubject.toPromise();
  }

  /**
   * Closes the referenced modal if it's still open which in turn will
   * resolve the `onClose` Promise. If the modal had already been
   * closed this method does nothing.
   */
  public close(): Promise<void> {
    if (!this.closeSubject.closed) {
      this.closeSubject.next();
      this.closeSubject.complete();
    }
    return this.onClose;
  }
}

/**
 * @public
 */
export interface OverlayModalConfirmOptions {
  title?: string;
  cancelButtonText?: string;
  confirmButtonText?: string;
  className?: string;
  closeButtonAriaLabel?: string;
  'data-test-subj'?: string;
  defaultFocusedButton?: EuiConfirmModalProps['defaultFocusedButton'];
  buttonColor?: EuiConfirmModalProps['buttonColor'];
  /**
   * Sets the max-width of the modal.
   * Set to `true` to use the default (`euiBreakpoints 'm'`),
   * set to `false` to not restrict the width,
   * set to a number for a custom width in px,
   * set to a string for a custom width in custom measurement.
   */
  maxWidth?: boolean | number | string;
}

/**
 * APIs to open and manage modal dialogs.
 *
 * @public
 */
export interface OverlayModalStart {
  /**
   * Opens a modal panel with the given mount point inside. You can use
   * `close()` on the returned OverlayRef to close the modal.
   *
   * @param mount {@link MountPoint} - Mounts the children inside the modal
   * @param options {@link OverlayModalOpenOptions} - options for the modal
   * @return {@link OverlayRef} A reference to the opened modal.
   */
  open(mount: MountPoint, options?: OverlayModalOpenOptions): OverlayRef;

  /**
   * Opens a confirmation modal with the given text or mountpoint as a message.
   * Returns a Promise resolving to `true` if user confirmed or `false` otherwise.
   *
   * @param message {@link MountPoint} - string or mountpoint to be used a the confirm message body
   * @param options {@link OverlayModalConfirmOptions} - options for the confirm modal
   */
  openConfirm(message: MountPoint | string, options?: OverlayModalConfirmOptions): Promise<boolean>;
}

/**
 * @public
 */
export interface OverlayModalOpenOptions {
  className?: string;
  closeButtonAriaLabel?: string;
  'data-test-subj'?: string;
  maxWidth?: boolean | number | string;
}

interface StartDeps {
  i18n: I18nStart;
  theme: ThemeServiceStart;
  targetDomElement: Element;
}

/** @internal */
export class ModalService {
  private activeModal: ModalRef | null = null;
  private targetDomElement: Element | null = null;

  public start({ i18n, theme, targetDomElement }: StartDeps): OverlayModalStart {
    this.targetDomElement = targetDomElement;

    return {
      open: (mount: MountPoint, options: OverlayModalOpenOptions = {}): OverlayRef => {
        // If there is an active modal, close it before opening a new one.
        if (this.activeModal) {
          this.activeModal.close();
          this.cleanupDom();
        }

        const modal = new ModalRef();

        // If a modal gets closed through it's ModalRef, remove it from the dom
        modal.onClose.then(() => {
          if (this.activeModal === modal) {
            this.cleanupDom();
          }
        });

        this.activeModal = modal;

        render(
          <CoreContextProvider i18n={i18n} theme={theme}>
            <EuiModal {...options} onClose={() => modal.close()}>
              <MountWrapper mount={mount} className="kbnOverlayMountWrapper" />
            </EuiModal>
          </CoreContextProvider>,
          targetDomElement
        );

        return modal;
      },
      openConfirm: (message: MountPoint | string, options?: OverlayModalConfirmOptions) => {
        // If there is an active modal, close it before opening a new one.
        if (this.activeModal) {
          this.activeModal.close();
          this.cleanupDom();
        }

        return new Promise((resolve, reject) => {
          let resolved = false;
          const closeModal = (confirmed: boolean) => {
            resolved = true;
            modal.close();
            resolve(confirmed);
          };

          const modal = new ModalRef();
          modal.onClose.then(() => {
            if (this.activeModal === modal) {
              this.cleanupDom();
            }
            // modal.close can be called when opening a new modal/confirm, so we need to resolve the promise in that case.
            if (!resolved) {
              closeModal(false);
            }
          });
          this.activeModal = modal;

          const props = {
            ...options,
            children:
              typeof message === 'string' ? (
                message
              ) : (
                <MountWrapper mount={message} className="kbnOverlayMountWrapper" />
              ),
            onCancel: () => closeModal(false),
            onConfirm: () => closeModal(true),
            cancelButtonText:
              options?.cancelButtonText ||
              t.translate('core.overlays.confirm.cancelButton', {
                defaultMessage: 'Cancel',
              }),
            confirmButtonText:
              options?.confirmButtonText ||
              t.translate('core.overlays.confirm.okButton', {
                defaultMessage: 'Confirm',
              }),
          };

          render(
            <CoreContextProvider i18n={i18n} theme={theme}>
              <EuiConfirmModal {...props} />
            </CoreContextProvider>,
            targetDomElement
          );
        });
      },
    };
  }

  /**
   * Using React.Render to re-render into a target DOM element will replace
   * the content of the target but won't call unmountComponent on any
   * components inside the target or any of their children. So we properly
   * cleanup the DOM here to prevent subtle bugs in child components which
   * depend on unmounting for cleanup behaviour.
   */
  private cleanupDom(): void {
    if (this.targetDomElement != null) {
      unmountComponentAtNode(this.targetDomElement);
      this.targetDomElement.innerHTML = '';
    }
    this.activeModal = null;
  }
}
