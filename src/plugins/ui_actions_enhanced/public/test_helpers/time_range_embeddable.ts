/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import {
  EmbeddableOutput,
  Embeddable,
  EmbeddableInput,
  IContainer,
} from '@kbn/embeddable-plugin/public';
import { TimeRange } from '@kbn/data-plugin/public';

interface EmbeddableTimeRangeInput extends EmbeddableInput {
  timeRange: TimeRange;
}

export const TIME_RANGE_EMBEDDABLE = 'TIME_RANGE_EMBEDDABLE';

export class TimeRangeEmbeddable extends Embeddable<EmbeddableTimeRangeInput, EmbeddableOutput> {
  public readonly type = TIME_RANGE_EMBEDDABLE;

  constructor(initialInput: EmbeddableTimeRangeInput, parent?: IContainer) {
    super(initialInput, {}, parent);
  }

  public render() {}

  public reload() {}
}
