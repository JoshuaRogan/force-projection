'use client';

import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { GameState, OrderChoice, OrderId, TheaterId, ProgramCard, BudgetLine, SecondaryResource } from '@fp/shared';
import { ORDERS, THEATER_NAMES, THEATER_IDS, BUDGET_LINES, BUDGET_LINE_NAMES, SECONDARY_RESOURCE_NAMES, canAfford } from '@fp/shared';
import { ResourceIcon } from '../icons/ResourceIcon';
import { resourceColor, resourceFullName } from '../ui/ResourceToken';
import styles from './GamePanel.module.css';

const ORDER_CATEGORIES: Record<string, OrderId[]> = {
  Influence: ['lobby', 'negotiate', 'contracting'],
  Procure: ['startProgram', 'activateProgram', 'refitMothball'],
  Deploy: ['buildBase', 'forwardOps', 'stationPrograms'],
  Sustain: ['majorExercise', 'logisticsSurge', 'intelFocus'],
};

// ── Order cost definitions ────────────────────────────────────────────────────
// Only orders with fixed known costs. Variable-cost orders (startProgram etc.)
// show costs inside the param picker, not here.

type OrderCostSpec = {
  budget?: Partial<Record<BudgetLine, number>>;
  secondary?: Partial<Record<SecondaryResource, number>>;
  note?: string;           // extra label for open-ended costs like "+ 1 any line"
  conditional?: string;    // shown as a qualifier, e.g. "if no base"
};

function getOrderCost(orderId: OrderId, player: Player): OrderCostSpec | null {
  switch (orderId) {
    case 'majorExercise':
      return { budget: { U: 1 }, secondary: { M: 1 } };
    case 'buildBase':
      return { budget: { U: 2 }, note: '+ 1 any line' };
    case 'forwardOps': {
      let uCost = 2;
      let lCost = 1;
      if (player.directorate === 'MARFOR') uCost = Math.max(0, uCost - 1);
      if (player.directorate === 'TRANSCOM') lCost = Math.max(0, lCost - 1);
      const spec: OrderCostSpec = {};
      if (uCost > 0) spec.budget = { U: uCost };
      if (lCost > 0) spec.secondary = { L: lCost };
      return spec;
    }
    case 'negotiate':
      return { secondary: { PC: 1 }, conditional: 'if no base' };
    // Free orders — show explicit "No cost" indicator
    case 'lobby':
    case 'contracting':
    case 'logisticsSurge':
    case 'intelFocus':
    case 'stationPrograms':
      return {};
    // Variable — costs shown inside param picker
    default:
      return null;
  }
}

// ── Affordability-aware cost chip ─────────────────────────────────────────────

function CostChip({
  resource, required, current,
}: {
  resource: BudgetLine | SecondaryResource;
  required: number;
  current: number;
}) {
  const canPay = current >= required;
  const color = resourceColor(resource);
  const name = resourceFullName(resource);
  const shortage = required - current;

  return (
    <span
      className={`${styles.costChip} ${canPay ? styles.costChipOk : styles.costChipShort}`}
      style={{
        '--chip-color': canPay ? color : 'var(--color-danger)',
      } as React.CSSProperties}
      title={canPay ? name : `${name}: need ${required}, have ${current}`}
    >
      <span className={styles.costChipMain}>
        <ResourceIcon resource={resource} size={10} className={styles.costChipIcon} />
        <span className={styles.costChipCount}>{required}</span>
        <span className={styles.costChipLabel}>{name.toUpperCase()}</span>
      </span>
      {!canPay && (
        <span className={styles.costChipDeficit}>have {current}{shortage > 0 ? ` · need ${shortage} more` : ''}</span>
      )}
    </span>
  );
}

function OrderCostRow({ orderId, player }: { orderId: OrderId; player: Player }) {
  const spec = getOrderCost(orderId, player);
  if (spec === null) return null; // variable cost — shown in params

  const budgetEntries = Object.entries(spec.budget ?? {}) as [BudgetLine, number][];
  const secondaryEntries = Object.entries(spec.secondary ?? {}) as [SecondaryResource, number][];
  const isEmpty = budgetEntries.length === 0 && secondaryEntries.length === 0;

  return (
    <div className={styles.orderCostRow}>
      <span className={styles.orderCostLabel}>COST</span>
      {isEmpty ? (
        <span className={styles.orderCostFree}>Free</span>
      ) : (
        <div className={styles.orderCostChips}>
          {budgetEntries.map(([key, val]) => (
            <CostChip key={key} resource={key} required={val} current={player.resources.budget[key] ?? 0} />
          ))}
          {secondaryEntries.map(([key, val]) => (
            <CostChip key={key} resource={key} required={val} current={player.resources.secondary[key] ?? 0} />
          ))}
          {spec.note && <span className={styles.orderCostNote}>{spec.note}</span>}
          {spec.conditional && <span className={styles.orderCostConditional}>{spec.conditional}</span>}
        </div>
      )}
    </div>
  );
}

/** Orders that need additional parameter selection */
const NEEDS_PARAMS: Set<OrderId> = new Set([
  'negotiate', 'startProgram', 'activateProgram', 'refitMothball',
  'buildBase', 'forwardOps', 'stationPrograms', 'intelFocus',
]);

function AffordabilityTooltip({ reason, anchor }: {
  reason: string;
  anchor: HTMLButtonElement;
}) {
  const rect = anchor.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top - 8;

  return createPortal(
    <div className={styles.affordTooltip} style={{ left: x, top: y }}>
      {reason}
    </div>,
    document.body,
  );
}

type Player = GameState['players'][string];

function canAffordOrder(orderId: OrderId, player: Player): boolean {
  const res = player.resources;
  switch (orderId) {
    case 'lobby':
    case 'contracting':
    case 'logisticsSurge':
    case 'intelFocus':
      return true;

    case 'negotiate':
      // Need a base in any theater OR at least 1 PC
      return Object.values(player.theaterPresence).some(p => p.bases > 0)
        || res.secondary.PC >= 1;

    case 'startProgram':
      return player.hand.length > 0
        && player.portfolio.pipeline.some(s => s === null)
        && player.hand.some(c => canAfford(res, c.pipelineCost));

    case 'activateProgram':
      return player.portfolio.pipeline.some(s => s !== null)
        && player.portfolio.active.some(s => s === null)
        && player.portfolio.pipeline.some(s => s && canAfford(res, s.card.activeCost));

    case 'refitMothball':
      // Can mothball any active program (free) OR reactivate a mothballed one (U:1 + primary line:1)
      return player.portfolio.active.some(s => s !== null)
        || (player.portfolio.mothballed.length > 0
            && (res.budget.U >= 3
                || (res.budget.U >= 1 && BUDGET_LINES.some(l => l !== 'U' && (res.budget[l] ?? 0) >= 1))));

    case 'buildBase':
      // Cost: U:2 + 1 of any budget line (including U, making it U:3 if chosen)
      return res.budget.U >= 2
        && (res.budget.U >= 3 || BUDGET_LINES.some(l => l !== 'U' && (res.budget[l] ?? 0) >= 1));

    case 'forwardOps': {
      const hasBase = Object.values(player.theaterPresence).some(p => p.bases > 0);
      if (!hasBase) return false;
      let lCost = 1;
      let uCost = 2;
      if (player.directorate === 'MARFOR') uCost = Math.max(0, uCost - 1);
      if (player.directorate === 'TRANSCOM') lCost = Math.max(0, lCost - 1);
      return canAfford(res, { budget: { U: uCost }, secondary: { L: lCost } });
    }

    case 'stationPrograms':
      return player.portfolio.active.some(s => s?.card.stationing != null);

    case 'majorExercise':
      return canAfford(res, { budget: { U: 1 }, secondary: { M: 1 } });

    default:
      return true;
  }
}

function affordabilityReason(orderId: OrderId, player: Player): string {
  const res = player.resources;
  switch (orderId) {
    case 'majorExercise': {
      const missing: string[] = [];
      if ((res.budget.U ?? 0) < 1) missing.push(`1 ${BUDGET_LINE_NAMES.U}`);
      if ((res.secondary.M ?? 0) < 1) missing.push(`1 ${SECONDARY_RESOURCE_NAMES.M}`);
      return `Need ${missing.join(' + ')}`;
    }
    case 'buildBase': {
      if ((res.budget.U ?? 0) < 2) return `Need 2 ${BUDGET_LINE_NAMES.U} (have ${res.budget.U ?? 0})`;
      return 'Need 1 of any budget line';
    }
    case 'forwardOps': {
      const hasBase = Object.values(player.theaterPresence).some(p => p.bases > 0);
      if (!hasBase) return 'No base in any theater';
      let lCost = 1;
      let uCost = 2;
      if (player.directorate === 'MARFOR') uCost = Math.max(0, uCost - 1);
      if (player.directorate === 'TRANSCOM') lCost = Math.max(0, lCost - 1);
      const missing: string[] = [];
      if ((res.budget.U ?? 0) < uCost) missing.push(`${uCost} ${BUDGET_LINE_NAMES.U}`);
      if (lCost > 0 && (res.secondary.L ?? 0) < lCost) missing.push(`${lCost} ${SECONDARY_RESOURCE_NAMES.L}`);
      return `Need ${missing.join(' + ')}`;
    }
    case 'startProgram': {
      if (player.hand.length === 0) return 'No cards in hand';
      if (!player.portfolio.pipeline.some(s => s === null)) return 'Pipeline full';
      return "Can't afford any card in hand";
    }
    case 'activateProgram': {
      if (!player.portfolio.pipeline.some(s => s !== null)) return 'No programs in pipeline';
      if (!player.portfolio.active.some(s => s === null)) return 'Active slots full';
      return "Can't afford activation cost";
    }
    case 'negotiate':
      return `Need a base in a theater or 1 ${SECONDARY_RESOURCE_NAMES.PC}`;
    case 'stationPrograms':
      return 'No active programs with stationing capability';
    case 'refitMothball': {
      if (!player.portfolio.active.some(s => s !== null) && player.portfolio.mothballed.length === 0)
        return 'No programs to refit';
      return "Can't afford reactivation cost";
    }
    default:
      return 'Cannot afford';
  }
}

export function OrdersPanel({
  gameState,
  humanPlayerId,
  onSubmit,
}: {
  gameState: GameState;
  humanPlayerId: string;
  onSubmit: (orders: [OrderChoice, OrderChoice]) => void;
}) {
  const [selectedOrders, setSelectedOrders] = useState<OrderId[]>([]);
  const [orderParams, setOrderParams] = useState<Record<number, OrderChoice>>({});
  const [configuringIdx, setConfiguringIdx] = useState<number | null>(null);
  const [hoveredOrder, setHoveredOrder] = useState<OrderId | null>(null);
  const [unaffordableAnchor, setUnaffordableAnchor] = useState<{ el: HTMLButtonElement; reason: string } | null>(null);
  const clearHover = useCallback(() => setHoveredOrder(prev => prev === null ? prev : null), []);
  const player = gameState.players[humanPlayerId];
  const alreadySubmitted = player.selectedOrders !== null;

  if (alreadySubmitted) {
    return (
      <div className={styles.panel}>
        <p className={styles.mutedText}>Orders submitted. Waiting for resolution...</p>
      </div>
    );
  }

  const toggleOrder = (orderId: OrderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        const idx = prev.indexOf(orderId);
        const next = prev.filter(o => o !== orderId);
        // Clean up params
        const newParams = { ...orderParams };
        delete newParams[idx];
        setOrderParams(newParams);
        if (configuringIdx === idx) setConfiguringIdx(null);
        return next;
      }
      if (prev.length >= 2) return prev;
      const newIdx = prev.length;
      const next = [...prev, orderId];

      if (NEEDS_PARAMS.has(orderId)) {
        // Open param config for this order
        setConfiguringIdx(newIdx);
      } else {
        // Auto-fill simple orders
        setOrderParams(p => ({ ...p, [newIdx]: buildSimpleChoice(orderId) }));
      }
      return next;
    });
  };

  const setParamsForOrder = (idx: number, choice: OrderChoice) => {
    setOrderParams(p => ({ ...p, [idx]: choice }));
    setConfiguringIdx(null);
  };

  const canSubmit = selectedOrders.length === 2 &&
    orderParams[0] !== undefined &&
    orderParams[1] !== undefined;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit([orderParams[0], orderParams[1]]);
  };

  const quarter = gameState.phase.type === 'quarter' ? gameState.phase.quarter : '?';

  return (
    <div className={styles.panel}>
      <div className={styles.panelTitle}>Select 2 Orders (Q{quarter})</div>

      {Object.entries(ORDER_CATEGORIES).map(([category, orderIds]) => (
        <div key={category} className={styles.orderCategory}>
          <div className={styles.orderCategoryLabel}>{category}</div>
          <div className={styles.orderGrid}>
            {orderIds.map(oid => {
              const def = ORDERS[oid];
              const isSelected = selectedOrders.includes(oid);
              const isDimmed = selectedOrders.length >= 2 && !isSelected;
              const selectedIdx = selectedOrders.indexOf(oid);
              const needsConfig = isSelected && NEEDS_PARAMS.has(oid) && orderParams[selectedIdx] === undefined;
              const affordable = isSelected || canAffordOrder(oid, player);
              const reason = !affordable ? affordabilityReason(oid, player) : undefined;
              return (
                <button
                  key={oid}
                  onClick={() => affordable && toggleOrder(oid)}
                  onMouseEnter={(e) => {
                    setHoveredOrder(oid);
                    if (reason) setUnaffordableAnchor({ el: e.currentTarget, reason });
                  }}
                  onMouseLeave={() => {
                    clearHover();
                    setUnaffordableAnchor(null);
                  }}
                  className={[
                    styles.orderBtn,
                    isSelected ? styles.orderBtnSelected : '',
                    isDimmed ? styles.orderBtnDimmed : '',
                    needsConfig ? styles.orderBtnNeedsConfig : '',
                    !affordable ? styles.orderBtnUnaffordable : '',
                  ].filter(Boolean).join(' ')}
                >
                  {def.name}
                  {needsConfig && ' ...'}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Order description — fixed area, no layout shift */}
      <div className={styles.orderDescArea}>
        {hoveredOrder ? (
          <>
            <div className={styles.orderDescHeader}>
              <span className={styles.orderDescName}>{ORDERS[hoveredOrder].name}</span>
              <span className={styles.orderDescCategory}>{ORDERS[hoveredOrder].category}</span>
              {!canAffordOrder(hoveredOrder, player) && (
                <span className={styles.orderDescUnaffordable}>{affordabilityReason(hoveredOrder, player)}</span>
              )}
            </div>
            <OrderCostRow orderId={hoveredOrder} player={player} />
            <p className={styles.orderDescText}>{ORDERS[hoveredOrder].description}</p>
          </>
        ) : (
          <p className={styles.orderDescHint}>Hover an order to see what it does</p>
        )}
      </div>

      {/* Parameter configuration panel */}
      {configuringIdx !== null && selectedOrders[configuringIdx] && (
        <OrderParamPicker
          orderId={selectedOrders[configuringIdx]}
          player={player}
          gameState={gameState}
          onConfirm={(choice) => setParamsForOrder(configuringIdx, choice)}
          onCancel={() => {
            // Deselect the order
            const oid = selectedOrders[configuringIdx];
            setSelectedOrders(prev => prev.filter(o => o !== oid));
            setConfiguringIdx(null);
          }}
        />
      )}

      {/* Show configured order summaries */}
      {selectedOrders.length > 0 && configuringIdx === null && (
        <div className={styles.orderSummary}>
          {selectedOrders.map((oid, i) => {
            const def = ORDERS[oid];
            const params = orderParams[i];
            return (
              <div key={i} className={styles.orderSummaryItem}>
                <span className={styles.orderSummaryNum}>{i + 1}.</span>
                <span className={styles.orderSummaryName}>{def.name}</span>
                {params && <span className={styles.orderSummaryDetail}>{describeChoice(params)}</span>}
                {!params && NEEDS_PARAMS.has(oid) && (
                  <button
                    className={styles.orderConfigBtn}
                    onClick={() => setConfiguringIdx(i)}
                  >
                    Configure
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={styles.btnPrimary}
      >
        Submit Orders {selectedOrders.length > 0 && `(${selectedOrders.length}/2)`}
      </button>

      {unaffordableAnchor && (
        <AffordabilityTooltip anchor={unaffordableAnchor.el} reason={unaffordableAnchor.reason} />
      )}
    </div>
  );
}

/** Parameter picker for orders that need additional input */
function OrderParamPicker({
  orderId,
  player,
  gameState,
  onConfirm,
  onCancel,
}: {
  orderId: OrderId;
  player: GameState['players'][string];
  gameState: GameState;
  onConfirm: (choice: OrderChoice) => void;
  onCancel: () => void;
}) {
  const [theater, setTheater] = useState<TheaterId>('northAtlantic');
  const [selectedCard, setSelectedCard] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [budgetLine, setBudgetLine] = useState<BudgetLine>('U');
  const [refitAction, setRefitAction] = useState<'mothball' | 'reactivate'>('mothball');
  const [spendI, setSpendI] = useState(false);
  const [assignments, setAssignments] = useState<Array<{ activeSlot: number; theater: TheaterId }>>([]);

  const orderDef = ORDERS[orderId];

  switch (orderId) {
    case 'negotiate':
      return (
        <div className={styles.paramPicker}>
          <div className={styles.paramTitle}>{orderDef.name}: Pick Theater</div>
          <div className={styles.paramDesc}>{orderDef.description}</div>
          <div className={styles.paramOptions}>
            {THEATER_IDS.map(tid => (
              <button
                key={tid}
                className={`${styles.paramOption} ${theater === tid ? styles.paramOptionSelected : ''}`}
                onClick={() => setTheater(tid)}
              >
                {THEATER_NAMES[tid]}
              </button>
            ))}
          </div>
          <div className={styles.paramActions}>
            <button className={styles.btnPrimary} onClick={() => onConfirm({ order: 'negotiate', theater, payPC: false })}>
              Confirm
            </button>
            <button className={styles.paramCancelBtn} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      );

    case 'startProgram': {
      const hand = player.hand;
      const emptyPipeSlots = player.portfolio.pipeline
        .map((s, i) => s === null ? i : -1)
        .filter(i => i >= 0);
      const effectivePipeSlot = emptyPipeSlots.includes(selectedSlot) ? selectedSlot : (emptyPipeSlots[0] ?? 0);
      const startCardDef = hand.find(c => c.id === selectedCard);
      const startAffordable = startCardDef ? canAfford(player.resources, startCardDef.pipelineCost) : true;
      return (
        <div className={styles.paramPicker}>
          <div className={styles.paramTitle}>{orderDef.name}: Pick Card & Slot</div>
          <div className={styles.paramDesc}>{orderDef.description}</div>
          {hand.length === 0 ? (
            <div className={styles.paramWarning}>No cards in hand</div>
          ) : (
            <>
              <div className={styles.paramLabel}>Card from hand:</div>
              <div className={styles.paramOptions}>
                {hand.map(card => {
                  const affordable = canAfford(player.resources, card.pipelineCost);
                  return (
                    <button
                      key={card.id}
                      className={[
                        styles.paramOption,
                        selectedCard === card.id ? styles.paramOptionSelected : '',
                        !affordable ? styles.paramOptionUnaffordable : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => affordable && setSelectedCard(card.id)}
                      data-reason={affordable ? undefined : `need ${formatCost(card.pipelineCost)}`}
                    >
                      <span>{card.name} ({card.domain})</span>
                      <span className={styles.paramOptionCost}>{formatCost(card.pipelineCost)}</span>
                    </button>
                  );
                })}
              </div>
              {emptyPipeSlots.length === 0 ? (
                <div className={styles.paramWarning}>No empty pipeline slots</div>
              ) : (
                <>
                  <div className={styles.paramLabel}>Pipeline slot:</div>
                  <div className={styles.paramOptions}>
                    {emptyPipeSlots.map(slot => (
                      <button
                        key={slot}
                        className={`${styles.paramOption} ${effectivePipeSlot === slot ? styles.paramOptionSelected : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        Slot {slot + 1}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          <div className={styles.paramActions}>
            <button
              className={styles.btnPrimary}
              disabled={!selectedCard || emptyPipeSlots.length === 0 || !startAffordable}
              onClick={() => onConfirm({ order: 'startProgram', cardId: selectedCard, pipelineSlot: effectivePipeSlot })}
            >
              Confirm
            </button>
            <button className={styles.paramCancelBtn} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      );
    }

    case 'activateProgram': {
      // Only pipeline cards — activating from hand bypasses pipeline but is confusing; restrict to pipeline
      const pipeCards = player.portfolio.pipeline
        .map((s, i) => s ? { card: s.card, pipeSlot: i } : null)
        .filter((s): s is { card: ProgramCard; pipeSlot: number } => s !== null);
      const emptyActiveSlots = player.portfolio.active
        .map((s, i) => s === null ? i : -1)
        .filter(i => i >= 0);
      // Auto-select the first available empty slot if selectedSlot isn't valid
      const effectiveSlot = emptyActiveSlots.includes(selectedSlot) ? selectedSlot : (emptyActiveSlots[0] ?? 0);
      const selectedCardDef = pipeCards.find(p => p.card.id === selectedCard);
      const selectedAffordable = selectedCardDef ? canAfford(player.resources, selectedCardDef.card.activeCost) : true;
      return (
        <div className={styles.paramPicker}>
          <div className={styles.paramTitle}>{orderDef.name}: Pick Program</div>
          <div className={styles.paramDesc}>{orderDef.description}</div>
          {pipeCards.length === 0 ? (
            <div className={styles.paramWarning}>No programs in pipeline to activate</div>
          ) : (
            <>
              <div className={styles.paramLabel}>Program to activate:</div>
              <div className={styles.paramOptions}>
                {pipeCards.map(({ card }) => {
                  const affordable = canAfford(player.resources, card.activeCost);
                  return (
                    <button
                      key={card.id}
                      className={[
                        styles.paramOption,
                        selectedCard === card.id ? styles.paramOptionSelected : '',
                        !affordable ? styles.paramOptionUnaffordable : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => affordable && setSelectedCard(card.id)}
                      data-reason={affordable ? undefined : `need ${formatCost(card.activeCost)}`}
                    >
                      <span>{card.name} ({card.domain})</span>
                      <span className={styles.paramOptionCost}>{formatCost(card.activeCost)}</span>
                    </button>
                  );
                })}
              </div>
              {emptyActiveSlots.length === 0 ? (
                <div className={styles.paramWarning}>No empty active slots</div>
              ) : (
                <>
                  <div className={styles.paramLabel}>Active slot:</div>
                  <div className={styles.paramOptions}>
                    {emptyActiveSlots.map(slot => (
                      <button
                        key={slot}
                        className={`${styles.paramOption} ${effectiveSlot === slot ? styles.paramOptionSelected : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        Slot {slot + 1}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          <div className={styles.paramActions}>
            <button
              className={styles.btnPrimary}
              disabled={!selectedCard || emptyActiveSlots.length === 0 || !selectedAffordable}
              onClick={() => onConfirm({ order: 'activateProgram', cardId: selectedCard, activeSlot: effectiveSlot })}
            >
              Confirm
            </button>
            <button className={styles.paramCancelBtn} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      );
    }

    case 'refitMothball': {
      const activePrograms = player.portfolio.active
        .map((s, i) => s ? { card: s.card, idx: i } : null)
        .filter((s): s is { card: ProgramCard; idx: number } => s !== null);
      const mothballed = player.portfolio.mothballed;
      return (
        <div className={styles.paramPicker}>
          <div className={styles.paramTitle}>{orderDef.name}</div>
          <div className={styles.paramDesc}>{orderDef.description}</div>
          <div className={styles.paramOptions}>
            <button
              className={`${styles.paramOption} ${refitAction === 'mothball' ? styles.paramOptionSelected : ''}`}
              onClick={() => setRefitAction('mothball')}
            >
              Mothball
            </button>
            <button
              className={`${styles.paramOption} ${refitAction === 'reactivate' ? styles.paramOptionSelected : ''}`}
              onClick={() => setRefitAction('reactivate')}
            >
              Reactivate
            </button>
          </div>
          {refitAction === 'mothball' && activePrograms.length > 0 && (
            <>
              <div className={styles.paramLabel}>Active program to mothball:</div>
              <div className={styles.paramOptions}>
                {activePrograms.map(({ card, idx }) => (
                  <button
                    key={idx}
                    className={`${styles.paramOption} ${selectedSlot === idx ? styles.paramOptionSelected : ''}`}
                    onClick={() => setSelectedSlot(idx)}
                  >
                    {card.name}
                  </button>
                ))}
              </div>
            </>
          )}
          {refitAction === 'reactivate' && mothballed.length > 0 && (
            <>
              <div className={styles.paramLabel}>Mothballed program to reactivate:</div>
              <div className={styles.paramOptions}>
                {mothballed.map((card, idx) => (
                  <button
                    key={idx}
                    className={`${styles.paramOption} ${selectedSlot === idx ? styles.paramOptionSelected : ''}`}
                    onClick={() => setSelectedSlot(idx)}
                  >
                    {card.name}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className={styles.paramActions}>
            <button
              className={styles.btnPrimary}
              onClick={() => onConfirm({ order: 'refitMothball', action: refitAction, programSlot: selectedSlot })}
            >
              Confirm
            </button>
            <button className={styles.paramCancelBtn} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      );
    }

    case 'buildBase':
      return (
        <div className={styles.paramPicker}>
          <div className={styles.paramTitle}>{orderDef.name}: Pick Theater & Budget</div>
          <div className={styles.paramDesc}>{orderDef.description}</div>
          <div className={styles.paramLabel}>Theater:</div>
          <div className={styles.paramOptions}>
            {THEATER_IDS.map(tid => (
              <button
                key={tid}
                className={`${styles.paramOption} ${theater === tid ? styles.paramOptionSelected : ''}`}
                onClick={() => setTheater(tid)}
              >
                {THEATER_NAMES[tid]}
              </button>
            ))}
          </div>
          <div className={styles.paramLabel}>Extra budget line (pays 2U + 1 of):</div>
          <div className={styles.paramOptions}>
            {BUDGET_LINES.map(bl => (
              <button
                key={bl}
                className={`${styles.paramOption} ${budgetLine === bl ? styles.paramOptionSelected : ''}`}
                onClick={() => setBudgetLine(bl)}
              >
                {bl} - {BUDGET_LINE_NAMES[bl]}
              </button>
            ))}
          </div>
          <div className={styles.paramActions}>
            <button className={styles.btnPrimary} onClick={() => onConfirm({ order: 'buildBase', theater, extraBudgetLine: budgetLine })}>
              Confirm
            </button>
            <button className={styles.paramCancelBtn} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      );

    case 'forwardOps': {
      const validForwardOpsTheaters = THEATER_IDS.filter(tid => player.theaterPresence[tid].bases >= 1);
      const effectiveFwdTheater = validForwardOpsTheaters.includes(theater) ? theater : (validForwardOpsTheaters[0] ?? theater);
      return (
        <div className={styles.paramPicker}>
          <div className={styles.paramTitle}>{orderDef.name}: Pick Theater</div>
          <div className={styles.paramDesc}>{orderDef.description}</div>
          {validForwardOpsTheaters.length === 0 ? (
            <div className={styles.paramWarning}>You need a Base in a theater before deploying Forward Ops there.</div>
          ) : (
            <div className={styles.paramOptions}>
              {THEATER_IDS.map(tid => {
                const hasBase = player.theaterPresence[tid].bases >= 1;
                return (
                  <button
                    key={tid}
                    className={[
                      styles.paramOption,
                      effectiveFwdTheater === tid ? styles.paramOptionSelected : '',
                      !hasBase ? styles.paramOptionUnaffordable : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => hasBase && setTheater(tid)}
                    data-reason={hasBase ? undefined : 'no base here'}
                  >
                    {THEATER_NAMES[tid]}
                  </button>
                );
              })}
            </div>
          )}
          <div className={styles.paramActions}>
            <button
              className={styles.btnPrimary}
              disabled={validForwardOpsTheaters.length === 0}
              onClick={() => onConfirm({ order: 'forwardOps', theater: effectiveFwdTheater })}
            >
              Confirm
            </button>
            <button className={styles.paramCancelBtn} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      );
    }

    case 'stationPrograms': {
      const stationable = player.portfolio.active
        .map((slot, i) => slot && slot.card.stationing ? { activeSlot: i, card: slot.card } : null)
        .filter((s): s is { activeSlot: number; card: ProgramCard } => s !== null);

      const toggleAssignment = (activeSlot: number, t: TheaterId) => {
        setAssignments(prev => {
          const existing = prev.findIndex(a => a.activeSlot === activeSlot);
          if (existing >= 0) {
            // Already assigned — remove it
            return prev.filter((_, i) => i !== existing);
          }
          if (prev.length >= 2) return prev; // cap at 2
          return [...prev, { activeSlot, theater: t }];
        });
      };

      return (
        <div className={styles.paramPicker}>
          <div className={styles.paramTitle}>{orderDef.name}</div>
          <div className={styles.paramDesc}>{orderDef.description}</div>
          {stationable.length === 0 ? (
            <div className={styles.paramWarning}>No active programs with stationing capability</div>
          ) : (
            <>
              <div className={styles.paramLabel}>
                Assign programs to theaters (max 2):
              </div>
              {stationable.map(({ activeSlot, card }) => {
                const current = assignments.find(a => a.activeSlot === activeSlot);
                const stationingTheaters = card.stationing!.theaters;
                return (
                  <div key={activeSlot} className={styles.stationRow}>
                    <span className={styles.stationProgName}>
                      {card.name}
                      <span className={styles.paramOptionCost}>str +{card.stationing!.strength}</span>
                    </span>
                    <div className={styles.stationTheaters}>
                      {stationingTheaters.map(tid => {
                        const isSelected = current?.theater === tid;
                        const isDisabled = !isSelected && assignments.length >= 2 && !current;
                        return (
                          <button
                            key={tid}
                            className={[
                              styles.paramOption,
                              isSelected ? styles.paramOptionSelected : '',
                              isDisabled ? styles.paramOptionUnaffordable : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => !isDisabled && toggleAssignment(activeSlot, tid)}
                          >
                            {THEATER_NAMES[tid]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className={styles.paramHint}>
                {assignments.length}/2 assigned
              </div>
            </>
          )}
          <div className={styles.paramActions}>
            <button
              className={styles.btnPrimary}
              onClick={() => onConfirm({ order: 'stationPrograms', assignments })}
            >
              Confirm ({assignments.length} assignment{assignments.length !== 1 ? 's' : ''})
            </button>
            <button className={styles.paramCancelBtn} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      );
    }

    case 'intelFocus':
      return (
        <div className={styles.paramPicker}>
          <div className={styles.paramTitle}>{orderDef.name}</div>
          <div className={styles.paramDesc}>{orderDef.description}</div>
          <div className={styles.paramOptions}>
            <button
              className={`${styles.paramOption} ${!spendI ? styles.paramOptionSelected : ''}`}
              onClick={() => setSpendI(false)}
            >
              Just gain +2 I
            </button>
            <button
              className={`${styles.paramOption} ${spendI ? styles.paramOptionSelected : ''}`}
              onClick={() => setSpendI(true)}
            >
              Spend 1 I to change resolution order
            </button>
          </div>
          <div className={styles.paramActions}>
            <button className={styles.btnPrimary} onClick={() => onConfirm({ order: 'intelFocus', spendI })}>
              Confirm
            </button>
            <button className={styles.paramCancelBtn} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function formatCost(cost: { budget: Partial<Record<string, number>> }): string {
  return Object.entries(cost.budget)
    .filter(([, v]) => v && v > 0)
    .map(([k, v]) => `${v}${k}`)
    .join(' ');
}

function buildSimpleChoice(orderId: OrderId): OrderChoice {
  switch (orderId) {
    case 'lobby': return { order: 'lobby' };
    case 'contracting': return { order: 'contracting' };
    case 'majorExercise': return { order: 'majorExercise' };
    case 'logisticsSurge': return { order: 'logisticsSurge' };
    default:
      // Should not reach here for non-simple orders
      return { order: orderId } as OrderChoice;
  }
}

function describeChoice(choice: OrderChoice): string {
  switch (choice.order) {
    case 'lobby': return '';
    case 'negotiate': return `\u2192 ${THEATER_NAMES[choice.theater]}`;
    case 'contracting': return '';
    case 'startProgram': return `card \u2192 pipe slot ${choice.pipelineSlot + 1}`;
    case 'activateProgram': return `\u2192 active slot ${choice.activeSlot + 1}`;
    case 'refitMothball': return choice.action;
    case 'buildBase': return `\u2192 ${THEATER_NAMES[choice.theater]}`;
    case 'forwardOps': return `\u2192 ${THEATER_NAMES[choice.theater]}`;
    case 'stationPrograms': return `${choice.assignments.length} assigned`;
    case 'majorExercise': return '';
    case 'logisticsSurge': return '';
    case 'intelFocus': return choice.spendI ? '+reorder' : '';
  }
}
