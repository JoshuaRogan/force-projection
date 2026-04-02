'use client';

import { useEffect, useRef, useState } from 'react';
import type { GameEvent, GameState } from '@fp/shared';
import { ORDERS, THEATER_NAMES, BUDGET_LINE_NAMES, SECONDARY_RESOURCE_NAMES, PROGRAM_CARDS } from '@fp/shared';
import styles from './GamePanel.module.css';

function playerName(state: GameState, playerId: string): string {
  return state.players[playerId]?.name ?? playerId;
}

function cardName(cardId: string): string {
  const card = PROGRAM_CARDS.find(c => c.id === cardId);
  return card?.name ?? cardId;
}

function resourceLabel(resource: string): string {
  const budgetMap = BUDGET_LINE_NAMES as Record<string, string>;
  const secMap = SECONDARY_RESOURCE_NAMES as Record<string, string>;
  return budgetMap[resource] ?? secMap[resource] ?? resource;
}

// ── Verbose formatter: produces text for EVERY event type ──────────────────

function formatEventVerbose(event: GameEvent, state: GameState): string {
  switch (event.type) {
    case 'phaseChange': {
      const p = event.phase;
      if (p.type === 'congress') return `Year ${event.fiscalYear} — Congress phase begins`;
      if (p.type === 'contractMarket') return `Contract Market opens`;
      if (p.type === 'quarter') return `Q${p.quarter} — ${p.step === 'crisisPulse' ? 'Crisis Pulse' : p.step === 'planOrders' ? 'Planning' : p.step === 'resolveOrders' ? 'Resolution' : 'Cleanup'}`;
      if (p.type === 'yearEnd') return `Year End — scoring & maturation`;
      if (p.type === 'gameEnd') return `Game Over`;
      return `Phase: ${p.type}`;
    }
    case 'agendaRevealed':
      return `Agenda revealed: ${event.agendaId}`;
    case 'agendaVote':
      return `${playerName(state, event.playerId)} voted ${event.support ? 'FOR' : 'AGAINST'} (${event.amount} PC)`;
    case 'agendaResult':
      return `Agenda ${event.passed ? 'PASSED' : 'FAILED'}`;
    case 'agendaEffectApplied':
      return `${playerName(state, event.playerId)} received agenda ${event.passed ? 'pass' : 'fail'} effect`;
    case 'contractTaken':
      return `${playerName(state, event.playerId)} took contract ${event.contractId}`;
    case 'crisisRevealed': {
      const crisisName = state.currentCrisis?.name ?? event.crisisId;
      return `Crisis: ${crisisName}`;
    }
    case 'crisisEffectApplied':
      return `${playerName(state, event.playerId)} — crisis ${event.category} effect applied`;
    case 'crisisPeek':
      return `${playerName(state, event.playerId)} peeked at next crisis`;
    case 'crisisImmunityUsed':
      return `${playerName(state, event.playerId)} used crisis immunity (${cardName(event.sourceCardId)})`;
    case 'orderRevealed': {
      const name = playerName(state, event.playerId);
      const orderNames = event.orders.map(o => ORDERS[o.order].name).join(' + ');
      return `${name} chose: ${orderNames}`;
    }
    case 'orderResolved': {
      const name = playerName(state, event.playerId);
      return `${name} executed ${ORDERS[event.order.order].name}`;
    }
    case 'orderFailed':
      return `${playerName(state, event.playerId)} — ${event.order} failed: ${event.reason}`;
    case 'resourceChange': {
      const name = playerName(state, event.playerId);
      const sign = event.delta >= 0 ? '+' : '';
      return `${name} ${sign}${event.delta} ${resourceLabel(event.resource)}`;
    }
    case 'siChange':
      return `${playerName(state, event.playerId)} ${event.delta >= 0 ? '+' : ''}${event.delta} SI (${event.reason})`;
    case 'programPipelined':
      return `${playerName(state, event.playerId)} pipelined ${cardName(event.cardId)}`;
    case 'programActivated':
      return `${playerName(state, event.playerId)} activated ${cardName(event.cardId)}`;
    case 'programMothballed':
      return `${playerName(state, event.playerId)} mothballed ${cardName(event.cardId)}`;
    case 'programReactivated':
      return `${playerName(state, event.playerId)} reactivated ${cardName(event.cardId)}`;
    case 'programStationed':
      return `${playerName(state, event.playerId)} stationed program in ${THEATER_NAMES[event.theater]}`;
    case 'basePlaced':
      return `${playerName(state, event.playerId)} built a Base in ${THEATER_NAMES[event.theater]}`;
    case 'alliancePlaced':
      return `${playerName(state, event.playerId)} formed an Alliance in ${THEATER_NAMES[event.theater]}`;
    case 'forwardOpsPlaced':
      return `${playerName(state, event.playerId)} deployed Forward Ops to ${THEATER_NAMES[event.theater]}`;
    case 'contractCompleted':
      return `${playerName(state, event.playerId)} completed contract (+${event.si} SI)`;
    case 'contractFailed':
      return `${playerName(state, event.playerId)} failed contract (${event.penalty} SI)`;
    case 'theaterControlScored': {
      const parts = event.rankings.map(
        (r, i) => `${i + 1}. ${playerName(state, r.playerId)} +${r.si}`
      );
      return `${THEATER_NAMES[event.theater]} control: ${parts.join(', ')}`;
    }
    case 'sustainEffect':
      return `${playerName(state, event.playerId)} — sustain: ${cardName(event.cardId)} (${event.timing})`;
    case 'triggerEffect':
      return `${playerName(state, event.playerId)} — trigger: ${cardName(event.cardId)} (${event.trigger})`;
    case 'costReductionApplied':
      return `${playerName(state, event.playerId)} gained cost reduction (${cardName(event.sourceCardId)})`;
    case 'yearEnd':
      return `Year ${event.fiscalYear} ended`;
    case 'gameEnd':
      return `Game Over — final scores recorded`;
  }
}

// ── Summary-only formatter (original curated set) ──────────────────────────

function formatEventSummary(event: GameEvent, state: GameState): string | null {
  switch (event.type) {
    case 'orderRevealed': {
      const name = playerName(state, event.playerId);
      const orderNames = event.orders.map(o => ORDERS[o.order].name).join(' + ');
      return `${name} chose: ${orderNames}`;
    }
    case 'orderResolved':
      return `${playerName(state, event.playerId)} executed ${ORDERS[event.order.order].name}`;
    case 'siChange':
      return `${playerName(state, event.playerId)} ${event.delta >= 0 ? '+' : ''}${event.delta} SI (${event.reason})`;
    case 'basePlaced':
      return `${playerName(state, event.playerId)} built a Base in ${THEATER_NAMES[event.theater]}`;
    case 'alliancePlaced':
      return `${playerName(state, event.playerId)} formed an Alliance in ${THEATER_NAMES[event.theater]}`;
    case 'forwardOpsPlaced':
      return `${playerName(state, event.playerId)} deployed Forward Ops to ${THEATER_NAMES[event.theater]}`;
    case 'programPipelined':
      return `${playerName(state, event.playerId)} pipelined ${cardName(event.cardId)}`;
    case 'programActivated':
      return `${playerName(state, event.playerId)} activated ${cardName(event.cardId)}`;
    case 'programMothballed':
      return `${playerName(state, event.playerId)} mothballed ${cardName(event.cardId)}`;
    case 'programReactivated':
      return `${playerName(state, event.playerId)} reactivated ${cardName(event.cardId)}`;
    case 'contractCompleted':
      return `${playerName(state, event.playerId)} completed a contract (+${event.si} SI)`;
    case 'contractFailed':
      return `${playerName(state, event.playerId)} failed a contract (${event.penalty} SI)`;
    case 'contractTaken':
      return `${playerName(state, event.playerId)} took a contract`;
    case 'crisisRevealed': {
      const crisisName = state.currentCrisis?.name ?? event.crisisId;
      return `Crisis: ${crisisName}`;
    }
    case 'agendaResult':
      return `Agenda ${event.passed ? 'PASSED' : 'FAILED'}`;
    case 'theaterControlScored': {
      const leader = event.rankings[0];
      if (leader) {
        return `${THEATER_NAMES[event.theater]} control: ${playerName(state, leader.playerId)} leads (+${leader.si} SI)`;
      }
      return `${THEATER_NAMES[event.theater]} control scored`;
    }
    case 'sustainEffect':
      return `${playerName(state, event.playerId)} — sustain: ${cardName(event.cardId)} (${event.timing})`;
    case 'triggerEffect':
      return `${playerName(state, event.playerId)} — trigger: ${cardName(event.cardId)} (${event.trigger})`;
    default:
      return null;
  }
}

// ── Icons ──────────────────────────────────────────────────────────────────

function eventIcon(event: GameEvent): string {
  switch (event.type) {
    case 'phaseChange': return '\u25C6';
    case 'agendaRevealed': return '\u2696';
    case 'agendaVote': return '\u270B';
    case 'agendaResult': return '\u2696';
    case 'agendaEffectApplied': return '\u2696';
    case 'orderRevealed': return '\u25B6';
    case 'orderResolved': return '\u2699';
    case 'orderFailed': return '\u2717';
    case 'resourceChange': return '\u25B2';
    case 'siChange': return '\u2605';
    case 'basePlaced': return '\u2302';
    case 'alliancePlaced': return '\u2694';
    case 'forwardOpsPlaced': return '\u279C';
    case 'programPipelined':
    case 'programActivated':
    case 'programReactivated': return '\u2B06';
    case 'programMothballed': return '\u2B07';
    case 'programStationed': return '\u2691';
    case 'contractCompleted': return '\u2713';
    case 'contractFailed': return '\u2717';
    case 'contractTaken': return '\u2709';
    case 'crisisRevealed': return '\u26A0';
    case 'crisisEffectApplied': return '\u26A0';
    case 'crisisPeek': return '\u2639';
    case 'crisisImmunityUsed': return '\u2764';
    case 'theaterControlScored': return '\u265A';
    case 'sustainEffect': return '\u21BA';
    case 'triggerEffect': return '\u26A1';
    case 'costReductionApplied': return '\u2193';
    case 'yearEnd': return '\u25C6';
    case 'gameEnd': return '\u2588';
  }
}

/** Classify events for subtle styling in verbose mode */
function eventCategory(event: GameEvent): 'phase' | 'action' | 'resource' | 'effect' | 'score' {
  switch (event.type) {
    case 'phaseChange':
    case 'yearEnd':
    case 'gameEnd':
      return 'phase';
    case 'orderRevealed':
    case 'orderResolved':
    case 'orderFailed':
    case 'basePlaced':
    case 'alliancePlaced':
    case 'forwardOpsPlaced':
    case 'programPipelined':
    case 'programActivated':
    case 'programMothballed':
    case 'programReactivated':
    case 'programStationed':
    case 'contractTaken':
    case 'agendaVote':
      return 'action';
    case 'resourceChange':
      return 'resource';
    case 'siChange':
    case 'contractCompleted':
    case 'contractFailed':
    case 'theaterControlScored':
    case 'agendaResult':
      return 'score';
    default:
      return 'effect';
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function EventFeed({
  events,
  gameState,
}: {
  events: GameEvent[];
  gameState: GameState;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length, showAll]);

  const displayEvents = showAll
    ? events.map(e => ({ event: e, text: formatEventVerbose(e, gameState) }))
    : events
        .map(e => ({ event: e, text: formatEventSummary(e, gameState) }))
        .filter((e): e is { event: GameEvent; text: string } => e.text !== null);

  const maxVisible = expanded ? 500 : (showAll ? 80 : 30);
  const visible = displayEvents.slice(-maxVisible);

  // ── Expanded (full-page overlay) ──────────────────────────────────────

  if (expanded) {
    return (
      <div className={styles.eventOverlay}>
        <div className={styles.eventOverlayInner}>
          <div className={styles.eventOverlayHeader}>
            <div className={styles.eventFeedTitle}>Activity Log</div>
            <div className={styles.eventControls}>
              <button
                className={`${styles.eventToggle} ${showAll ? styles.eventToggleActive : ''}`}
                onClick={() => setShowAll(v => !v)}
              >
                {showAll ? 'Summary' : 'Show Everything'}
              </button>
              <button
                className={styles.eventCollapseBtn}
                onClick={() => setExpanded(false)}
              >
                Collapse
              </button>
            </div>
          </div>
          <div className={styles.eventOverlayList} ref={scrollRef}>
            {visible.map((item, i) => {
              const cat = eventCategory(item.event);
              return (
                <div
                  key={i}
                  className={`${styles.eventItem} ${styles[`eventCat_${cat}`] ?? ''}`}
                >
                  <span className={styles.eventIcon}>{eventIcon(item.event)}</span>
                  <span className={styles.eventText}>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Inline (sidebar) ──────────────────────────────────────────────────

  if (visible.length === 0) {
    return (
      <div className={styles.eventFeed}>
        <div className={styles.eventFeedTitle}>Activity Log</div>
        <div className={styles.eventEmpty}>No events yet</div>
      </div>
    );
  }

  return (
    <div className={styles.eventFeed}>
      <div className={styles.eventFeedHeader}>
        <div className={styles.eventFeedTitle}>Activity Log</div>
        <div className={styles.eventControls}>
          <button
            className={`${styles.eventToggle} ${showAll ? styles.eventToggleActive : ''}`}
            onClick={() => setShowAll(v => !v)}
            title={showAll ? 'Show summary only' : 'Show all events including resource changes, phase transitions, and effects'}
          >
            {showAll ? 'Summary' : 'Show Everything'}
          </button>
          <button
            className={styles.eventExpandBtn}
            onClick={() => setExpanded(true)}
            title="Expand to full page"
          >
            Expand
          </button>
        </div>
      </div>
      <div className={styles.eventList} ref={scrollRef}>
        {visible.map((item, i) => {
          const cat = showAll ? eventCategory(item.event) : undefined;
          return (
            <div
              key={i}
              className={`${styles.eventItem} ${cat ? (styles[`eventCat_${cat}`] ?? '') : ''}`}
            >
              <span className={styles.eventIcon}>{eventIcon(item.event)}</span>
              <span className={styles.eventText}>{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
