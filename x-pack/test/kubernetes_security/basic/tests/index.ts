/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { FtrProviderContext } from '../../common/ftr_provider_context';

// eslint-disable-next-line import/no-default-export
export default function kubernetesSecurityApiIntegrationTests({
  loadTestFile,
}: FtrProviderContext) {
  describe('Kubernetes security API (basic)', function () {
    loadTestFile(require.resolve('./aggregate'));
    loadTestFile(require.resolve('./count'));
  });
}
