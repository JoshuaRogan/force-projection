import type { ContractCard, ContractRequirement, PlayerState } from '@fp/shared';

/**
 * Returns one boolean|null per requirement in the contract.
 * true  = requirement currently met
 * false = requirement not met
 * null  = can't determine (custom type)
 *
 * Logic mirrors engine's checkContractComplete in packages/engine/src/phases.ts.
 */
export function checkRequirements(
  contract: ContractCard,
  player: PlayerState,
): (boolean | null)[] {
  return contract.requirements.map(req => checkOne(req, player));
}

function checkOne(req: ContractRequirement, player: PlayerState): boolean | null {
  const p = req.params as Record<string, unknown>;

  switch (req.type) {
    case 'readinessThreshold': {
      const threshold = (p.threshold as number) ?? 0;
      return player.readiness >= threshold;
    }

    case 'sustainOrderCount': {
      const needed = (p.quarters as number) ?? 0;
      return player.sustainOrdersThisYear.length >= needed;
    }

    case 'theaterPresence': {
      const needed = (p.count as number) ?? 0;
      let count = 0;
      for (const presence of Object.values(player.theaterPresence)) {
        if (presence.bases > 0 || presence.alliances > 0 || presence.forwardOps > 0) count++;
      }
      return count >= needed;
    }

    case 'baseInTheater': {
      const theater = p.theater as string | undefined;
      if (!theater) return null;
      return (player.theaterPresence[theater as keyof typeof player.theaterPresence]?.bases ?? 0) >= 1;
    }

    case 'forwardOpsInTheater': {
      const theaters = p.theaters as string[] | undefined;
      const count = p.count as number | undefined;
      if (theaters) {
        return theaters.some(t =>
          (player.theaterPresence[t as keyof typeof player.theaterPresence]?.forwardOps ?? 0) > 0
        );
      }
      if (count) {
        let fwdCount = 0;
        for (const presence of Object.values(player.theaterPresence)) {
          if (presence.forwardOps > 0) fwdCount++;
        }
        return fwdCount >= count;
      }
      return null;
    }

    case 'allianceCount': {
      const theater = p.theater as string | undefined;
      const neededCount = (p.count as number) ?? 0;
      const neededTheaters = p.theaters as number | undefined;
      if (theater) {
        return (player.theaterPresence[theater as keyof typeof player.theaterPresence]?.alliances ?? 0) >= neededCount;
      }
      if (neededTheaters) {
        let theatersWithAlliance = 0;
        let totalAlliances = 0;
        for (const presence of Object.values(player.theaterPresence)) {
          if (presence.alliances > 0) {
            theatersWithAlliance++;
            totalAlliances += presence.alliances;
          }
        }
        return totalAlliances >= neededCount && theatersWithAlliance >= neededTheaters;
      }
      return null;
    }

    case 'activeProgramTag': {
      const subtag = p.subtag as string | undefined;
      const domainCount = p.domainCount as number | undefined;
      const needed = (p.count as number) ?? 0;
      if (subtag) {
        let tagCount = 0;
        for (const slot of player.portfolio.active) {
          if (slot && slot.card.subtags.includes(subtag as never)) tagCount++;
        }
        return tagCount >= needed;
      }
      if (domainCount) {
        const domains = new Set<string>();
        for (const slot of player.portfolio.active) {
          if (slot) domains.add(slot.card.domain);
        }
        return domains.size >= domainCount;
      }
      return null;
    }

    case 'stationProgram': {
      const theater = p.theater as string | undefined;
      const theaterCount = p.theaterCount as number | undefined;
      if (theater) {
        return player.stationedPrograms.some(sp => sp.theater === theater);
      }
      if (theaterCount) {
        const theaters = new Set(player.stationedPrograms.map(sp => sp.theater));
        return theaters.size >= theaterCount;
      }
      return null;
    }

    case 'custom':
    default:
      return null;
  }
}
