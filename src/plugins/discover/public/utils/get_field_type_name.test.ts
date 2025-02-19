/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import {
  getFieldTypeName,
  KNOWN_FIELD_TYPES,
  UNKNOWN_FIELD_TYPE_MESSAGE,
} from './get_field_type_name';

describe('getFieldTypeName', () => {
  describe('known field types should be recognized', () => {
    it.each(Object.values(KNOWN_FIELD_TYPES))(
      `'%s' should return a string that does not match '${UNKNOWN_FIELD_TYPE_MESSAGE}'`,
      (field) => {
        const fieldTypeName = getFieldTypeName(field);
        expect(typeof fieldTypeName).toBe('string');
        expect(fieldTypeName).not.toBe(UNKNOWN_FIELD_TYPE_MESSAGE);
      }
    );
  });

  it(`should return '${UNKNOWN_FIELD_TYPE_MESSAGE}' when passed undefined`, () => {
    expect(getFieldTypeName(undefined)).toBe(UNKNOWN_FIELD_TYPE_MESSAGE);
  });

  it(`should return '${UNKNOWN_FIELD_TYPE_MESSAGE}' when passed an unknown field type`, () => {
    expect(getFieldTypeName('unknown_field_type')).toBe(UNKNOWN_FIELD_TYPE_MESSAGE);
  });
});
