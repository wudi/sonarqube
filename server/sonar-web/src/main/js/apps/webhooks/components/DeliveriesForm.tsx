/*
 * SonarQube
 * Copyright (C) 2009-2023 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { searchDeliveries } from '../../../api/webhooks';
import ListFooter from '../../../components/controls/ListFooter';
import Modal from '../../../components/controls/Modal';
import { ResetButtonLink } from '../../../components/controls/buttons';
import Spinner from '../../../components/ui/Spinner';
import { translate, translateWithParameters } from '../../../helpers/l10n';
import { Paging } from '../../../types/types';
import { WebhookDelivery, WebhookResponse } from '../../../types/webhook';
import DeliveryAccordion from './DeliveryAccordion';

interface Props {
  onClose: () => void;
  webhook: WebhookResponse;
}

const PAGE_SIZE = 10;

export default function DeliveriesForm({ onClose, webhook }: Props) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [paging, setPaging] = useState<Paging | undefined>(undefined);

  const header = translateWithParameters('webhooks.deliveries_for_x', webhook.name);

  const fetchDeliveries = useCallback(async () => {
    try {
      const { deliveries, paging } = await searchDeliveries({
        webhook: webhook.key,
        ps: PAGE_SIZE,
      });
      setDeliveries(deliveries);
      setPaging(paging);
    } finally {
      setLoading(false);
    }
  }, [webhook.key]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  async function fetchMoreDeliveries() {
    if (paging) {
      setLoading(true);
      try {
        const response = await searchDeliveries({
          webhook: webhook.key,
          p: paging.pageIndex + 1,
          ps: PAGE_SIZE,
        });
        setDeliveries((deliveries) => [...deliveries, ...response.deliveries]);
        setPaging(response.paging);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <Modal contentLabel={header} onRequestClose={onClose}>
      <header className="modal-head">
        <h2>{header}</h2>
      </header>
      <div className="modal-body modal-container">
        {deliveries.map((delivery) => (
          <DeliveryAccordion delivery={delivery} key={delivery.id} />
        ))}
        <div className="text-center">
          <Spinner loading={loading} />
        </div>
        {paging !== undefined && (
          <ListFooter
            className="little-spacer-bottom"
            count={deliveries.length}
            loadMore={fetchMoreDeliveries}
            ready={!loading}
            total={paging.total}
          />
        )}
      </div>
      <footer className="modal-foot">
        <ResetButtonLink onClick={onClose}>{translate('close')}</ResetButtonLink>
      </footer>
    </Modal>
  );
}
