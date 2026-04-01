'use client';

import { useEffect, useRef } from 'react';
import type { GameEvent, GameState } from '@fp/shared';
import { ORDERS, THEATER_NAMES } from '@fp/shared';
import styles from './GamePanel.module.css';

function playerName(state: GameState, playerId: string): string {
  return state.players[playerId]?.name ?? playerId;
}

function formatEvent(event: GameEvent, state: GameState): string | null {
  switch (event.type) {
    case 'orderRevealed': {
      const name = playerName(state, event.playerId);
      const orderNames = event.orders.map(o => ORDERS[o.order].name).join(' + ');
      return `${name} chose: ${orderNames}`;
    }
    case 'orderResolved': {
      const name = playerName(state, event.playerId);
      const orderDef = ORDERS[event.order.order];
      return `${name} executed ${orderDef.name}`;
    }
    case 'siChange':
      return `${playerName(state, event.playerId)} ${event.delta >= 0 ? '+' : ''}${event.delta} SI (${event.reason})`;
    case 'basePlaced':
      return `${playerName(state, event.playerId)} built a Base in ${THEATER_NAMES[event.theater]}`;
    case 'alliancePlaced':
      return `${playerName(state, event.playerId)} formed an Alliance in ${THEATER_NAMES[event.theater]}`;
    case 'forwardOpsPlaced':
      return `${playerName(state, event.playerId)} deployed Forward Ops to ${THEATER_NAMES[event.theater]}`;
    case 'programPipelined':
      return `${playerName(state, event.playerId)} started a program in pipeline`;
    case 'programActivated':
      return `${playerName(state, event.playerId)} activated a program`;
    case 'programMothballed':
      return `${playerName(state, event.playerId)} mothballed a program`;
    case 'programReactivated':
      return `${playerName(state, event.playerId)} reactivated a program`;
    case 'contractCompleted':
      return `${playerName(state, event.playerId)} completed a contract (+${event.si} SI)`;
    case 'contractFailed':
      return `${playerName(state, event.playerId)} failed a contract (-${event.penalty} SI)`;
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
    case 'phaseChange':
    case 'agendaRevealed':
    case 'agendaVote':
    case 'resourceChange':
    case 'programStationed':
    case 'yearEnd':
    case 'gameEnd':
      return null; // Skip noisy/internal events
  }
}

function eventIcon(event: GameEvent): string {
  switch (event.type) {
    case 'orderRevealed': return '\u25B6';
    case 'orderResolved': return '\u2699';
    case 'siChange': return '\u2605';
    case 'basePlaced': return '\u2302';
    case 'alliancePlaced': return '\u2694';
    case 'forwardOpsPlaced': return '\u279C';
    case 'programPipelined':
    case 'programActivated':
    case 'programReactivated': return '\u2B06';
    case 'programMothballed': return '\u2B07';
    case 'contractCompleted': return '\u2713';
    case 'contractFailed': return '\u2717';
    case 'contractTaken': return '\u2709';
    case 'crisisRevealed': return '\u26A0';
    case 'agendaResult': return '\u2696';
    case 'theaterControlScored': return '\u265A';
    default: return '\u2022';
  }
}

export function EventFeed({
  events,
  gameState,
}: {
  events: GameEvent[];
  gameState: GameState;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const displayEvents = events
    .map(e => ({ event: e, text: formatEvent(e, gameState) }))
    .filter((e): e is { event: GameEvent; text: string } => e.text !== null);

  // Show last 30 events max
  const visible = displayEvents.slice(-30);

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
      <div className={styles.eventFeedTitle}>Activity Log</div>
      <div className={styles.eventList} ref={scrollRef}>
        {visible.map((item, i) => (
          <div key={i} className={styles.eventItem}>
            <span className={styles.eventIcon}>{eventIcon(item.event)}</span>
            <span className={styles.eventText}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
