/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { schema, TypeOf } from '@kbn/config-schema';

const BaseActionRequestSchema = {
  /** A list of endpoint IDs whose hosts will be isolated (Fleet Agent IDs will be retrieved for these) */
  endpoint_ids: schema.arrayOf(schema.string(), { minSize: 1 }),
  /** If defined, any case associated with the given IDs will be updated */
  alert_ids: schema.maybe(schema.arrayOf(schema.string())),
  /** Case IDs to be updated */
  case_ids: schema.maybe(schema.arrayOf(schema.string())),
  comment: schema.maybe(schema.string()),
  parameters: schema.maybe(schema.object({})),
};

export const HostIsolationRequestSchema = {
  body: schema.object({ ...BaseActionRequestSchema }),
};

export const KillProcessRequestSchema = {
  body: schema.object({
    ...BaseActionRequestSchema,
    parameters: schema.oneOf([
      schema.object({ pid: schema.number({ min: 1 }) }),
      schema.object({ entity_id: schema.number({ min: 1 }) }),
    ]),
  }),
};

export const responseActionBodySchemas = schema.oneOf([
  HostIsolationRequestSchema.body,
  KillProcessRequestSchema.body,
]);

export const EndpointActionLogRequestSchema = {
  query: schema.object({
    page: schema.number({ defaultValue: 1, min: 1 }),
    page_size: schema.number({ defaultValue: 10, min: 1, max: 100 }),
    start_date: schema.string(),
    end_date: schema.string(),
  }),
  params: schema.object({
    agent_id: schema.string(),
  }),
};

export type EndpointActionLogRequestParams = TypeOf<typeof EndpointActionLogRequestSchema.params>;
export type EndpointActionLogRequestQuery = TypeOf<typeof EndpointActionLogRequestSchema.query>;

export const ActionStatusRequestSchema = {
  query: schema.object({
    agent_ids: schema.oneOf([
      schema.arrayOf(schema.string({ minLength: 1 }), { minSize: 1, maxSize: 50 }),
      schema.string({ minLength: 1 }),
    ]),
  }),
};

export const ActionDetailsRequestSchema = {
  params: schema.object({
    action_id: schema.string(),
  }),
};

export const EndpointActionListRequestSchema = {
  query: schema.object({
    agentIds: schema.maybe(
      schema.arrayOf(schema.string({ minLength: 1 }), { minSize: 1, maxSize: 50 })
    ),
    commands: schema.maybe(schema.arrayOf(schema.string({ minLength: 1 }), { minSize: 1 })),
    page: schema.maybe(schema.number({ defaultValue: 1, min: 1 })),
    pageSize: schema.maybe(schema.number({ defaultValue: 10, min: 1, max: 100 })),
    startDate: schema.maybe(schema.string()), // date ISO strings or moment date
    endDate: schema.maybe(schema.string()), // date ISO strings or moment date
    userIds: schema.maybe(schema.arrayOf(schema.string({ minLength: 1 }), { minSize: 1 })),
  }),
};

export type EndpointActionListRequestQuery = TypeOf<typeof EndpointActionListRequestSchema.query>;
