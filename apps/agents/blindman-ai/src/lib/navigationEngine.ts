import { SavedPlace, SavedRoute, RoutePoint } from '@/types';
import { getDistance, getBearing, bearingToDirection, metersToFeet } from '@/lib/storage';
import { NAVIGATION_THRESHOLDS } from '@/constants';
import { SOUL_VOICE, soulFilter } from '@/lib/soul';

export interface NavigationInstruction {
  text: string;
  distanceToNext?: number;
  arrived: boolean;
  deviation?: boolean;
  deviationDegrees?: number;
  turnDirection?: 'left' | 'right' | 'straight';
  bearingToTarget?: number;
}

/** Clamp angle difference to –180 … +180 (positive = right, negative = left). */
function angleDiff(bearing: number, heading: number): number {
  let diff = (bearing - heading + 360) % 360;
  if (diff > 180) diff -= 360;
  return diff; // positive → right, negative → left
}

/** Describe a relative turn more precisely. */
function turnInstruction(diff: number, aggressive: boolean): { cmd: string; dir: 'left' | 'right' | 'straight' } {
  const absDiff = Math.abs(diff);
  const isRight = diff >= 0;
  const side = isRight ? 'right' : 'left';

  if (absDiff <= 15) {
    return { cmd: aggressive ? 'Straight ahead, keep moving' : 'Continue straight', dir: 'straight' };
  }
  if (absDiff <= 45) {
    return {
      cmd: aggressive
        ? `Slight ${side} — ${Math.round(absDiff)}°`
        : `Bear ${side} ${Math.round(absDiff)} degrees`,
      dir: isRight ? 'right' : 'left',
    };
  }
  if (absDiff <= 90) {
    return {
      cmd: aggressive
        ? `${isRight ? 'Veer' : 'Cut'} ${side} ${Math.round(absDiff)}°`
        : `Turn ${side} ${Math.round(absDiff)} degrees`,
      dir: isRight ? 'right' : 'left',
    };
  }
  if (absDiff <= 150) {
    return {
      cmd: aggressive
        ? `Hard ${side} — ${Math.round(absDiff)}°, now!`
        : `Turn hard ${side} ${Math.round(absDiff)} degrees`,
      dir: isRight ? 'right' : 'left',
    };
  }
  // Near 180 — U-turn
  return {
    cmd: aggressive
      ? `U-turn — you're heading the wrong way, flip around!`
      : `U-turn — reverse direction`,
    dir: isRight ? 'right' : 'left',
  };
}

/** Format distance with adaptive units: feet under 500, then switch to yards. */
function formatDistance(meters: number): string {
  const feet = metersToFeet(meters);
  if (feet < 500) return `${feet} feet`;
  return `${Math.round(feet / 3)} yards`;
}

export function getNavigationInstruction(
  currentLat: number,
  currentLng: number,
  currentHeading: number | null,
  route: SavedRoute,
  currentPointIndex: number,
  destination: SavedPlace,
  aggressive: boolean
): NavigationInstruction {
  const points = route.points;
  const totalPoints = points.length;

  // ── 1. Arrival check ──────────────────────────────────────────────────────
  const distToDest = getDistance(currentLat, currentLng, destination.lat, destination.lng);
  if (distToDest <= NAVIGATION_THRESHOLDS.ARRIVAL_DISTANCE) {
    const text = soulFilter(
      aggressive
        ? SOUL_VOICE.navArrived(destination.name)
        : `You have arrived at ${destination.name}.`,
      { isNavigation: true }
    );
    return { text, arrived: true };
  }

  // ── 2. All waypoints passed — direct leg to destination ──────────────────
  if (currentPointIndex >= totalPoints) {
    const bearing = getBearing(currentLat, currentLng, destination.lat, destination.lng);
    const distStr = formatDistance(distToDest);

    if (currentHeading !== null) {
      const diff = angleDiff(bearing, currentHeading);
      const { cmd, dir } = turnInstruction(diff, aggressive);
      const text = soulFilter(
        aggressive
          ? `${cmd} — ${distStr} to ${destination.name}. You're close, stay sharp.`
          : `${cmd}. ${distStr} to ${destination.name}.`,
        { isNavigation: true }
      );
      return { text, distanceToNext: distToDest, arrived: false, turnDirection: dir, bearingToTarget: bearing };
    }

    const direction = bearingToDirection(bearing);
    const text = soulFilter(
      aggressive
        ? `Head ${direction} — ${distStr} to ${destination.name}. Almost there.`
        : `Head ${direction}. ${distStr} to ${destination.name}.`,
      { isNavigation: true }
    );
    return { text, distanceToNext: distToDest, arrived: false, bearingToTarget: bearing };
  }

  // ── 3. Waypoint navigation ────────────────────────────────────────────────
  const targetPoint = points[currentPointIndex];
  const distToNext = getDistance(currentLat, currentLng, targetPoint.lat, targetPoint.lng);
  const bearing = getBearing(currentLat, currentLng, targetPoint.lat, targetPoint.lng);
  const distStr = formatDistance(distToNext);
  const progress = `Waypoint ${currentPointIndex + 1} of ${totalPoints}`;
  const landmark = targetPoint.landmark ? ` Landmark: ${targetPoint.landmark}.` : '';

  let turnCmd = '';
  let dir: 'left' | 'right' | 'straight' = 'straight';
  let deviationText = '';
  let deviationDeg = 0;

  if (currentHeading !== null) {
    const diff = angleDiff(bearing, currentHeading);
    const result = turnInstruction(diff, aggressive);
    turnCmd = result.cmd;
    dir = result.dir;
    deviationDeg = Math.round(Math.abs(diff));

    // Deviation: more than 30° off course AND more than 20m away from next point
    // (gives user some room without false alarms)
    const isDeviated = Math.abs(diff) > 30 && distToNext > 20;
    if (isDeviated) {
      deviationText = soulFilter(
        SOUL_VOICE.navDeviation(diff >= 0 ? 'right' : 'left', deviationDeg),
        { isNavigation: true }
      );
    }
  } else {
    const direction = bearingToDirection(bearing);
    turnCmd = `Head ${direction}`;
  }

  let text = '';
  if (deviationText) {
    text = `${deviationText}. Then ${turnCmd} — ${distStr}. ${progress}.${landmark}`;
  } else {
    text = aggressive
      ? `${turnCmd} — ${distStr}. ${progress}.${landmark}`
      : `${turnCmd}. ${distStr}. ${progress}.${landmark}`;
  }

  return {
    text: soulFilter(text, { isNavigation: true }),
    distanceToNext: distToNext,
    arrived: false,
    deviation: !!deviationText,
    deviationDegrees: deviationDeg,
    turnDirection: dir,
    bearingToTarget: bearing,
  };
}

export function shouldAdvanceWaypoint(
  currentLat: number,
  currentLng: number,
  targetPoint: RoutePoint
): boolean {
  const dist = getDistance(currentLat, currentLng, targetPoint.lat, targetPoint.lng);
  return dist <= NAVIGATION_THRESHOLDS.NEXT_POINT_DISTANCE;
}

export function formatPlacesList(places: SavedPlace[], aggressive: boolean): string {
  if (!places.length) {
    return aggressive
      ? "You ain't saved shit yet. Say 'save place as name' to lock a spot."
      : "No saved places yet. Say 'save place as name' to add one.";
  }
  const sorted = [...places].sort((a, b) => a.name.localeCompare(b.name));
  const list = sorted.map((p, i) => `${i + 1}: ${p.name}`).join('. ');
  return aggressive
    ? `Your spots roll call — ${sorted.length} locked and loaded: ${list}.`
    : `Your saved places — ${sorted.length} total: ${list}.`;
}

export function formatRoutesList(routes: SavedRoute[], aggressive: boolean): string {
  if (!routes.length) {
    return aggressive
      ? "No routes in the war chest yet. Say 'start logging route to place' to record one."
      : "No saved routes yet. Start recording to add one.";
  }
  const sorted = [...routes].sort((a, b) => a.name.localeCompare(b.name));
  const list = sorted.map((r, i) => `${i + 1}: ${r.name} to ${r.destinationName}`).join('. ');
  return aggressive
    ? `Your route arsenal — ${sorted.length} paths mapped: ${list}.`
    : `Your saved routes — ${sorted.length} total: ${list}.`;
}
