import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useTTS } from '@/hooks/useTTS';
import { useSTT } from '@/hooks/useSTT';
import { useGeolocation, GeoPosition } from '@/hooks/useGeolocation';
import { useCompass } from '@/hooks/useCompass';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { useCameraCapture } from '@/hooks/useCameraCapture';
import { useOfflineMapCache } from '@/hooks/useOfflineMapCache';
import { parseCommand } from '@/lib/commandParser';
import { getHelpText, getSceneDescription } from '@/lib/commandParser';
import {
  getNavigationInstruction,
  shouldAdvanceWaypoint,
  formatPlacesList,
  formatRoutesList,
} from '@/lib/navigationEngine';
import {
  getPlaces,
  getRoutes,
  savePlace,
  saveRoute,
  deletePlace,
  findPlaceByName,
  findRouteByName,
  findNearestPlace,
  generateId,
  getDistance,
  getSettings,
  isOnboarded,
  setOnboarded,
  exportData,
  metersToFeet,
  bearingToDirection,
  getBearing,
} from '@/lib/storage';
import { AppMode, AppSettings, SavedPlace, SavedRoute, RoutePoint } from '@/types';
import { SOUL_VOICE, soulFilter, evolveSoul } from '@/lib/soul';
import { VoicePulse } from '@/components/features/VoicePulse';
import { StatusBar } from '@/components/features/StatusBar';
import { TranscriptDisplay, TranscriptEntry } from '@/components/features/TranscriptDisplay';
import { SettingsPanel } from '@/components/features/SettingsPanel';
import { OnboardingScreen } from '@/components/features/OnboardingScreen';
import { QuickActions } from '@/components/features/QuickActions';

const NAV_COOLDOWN_MS = 6000;

const Index = () => {
  const [mode, setMode] = useState<AppMode>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!isOnboarded());

  // Navigation state
  const [isNavigating, setIsNavigating] = useState(false);
  const [navPaused, setNavPaused] = useState(false);
  const [activeRoute, setActiveRoute] = useState<SavedRoute | null>(null);
  const [navDestination, setNavDestination] = useState<SavedPlace | null>(null);
  const [navPointIndex, setNavPointIndex] = useState(0);

  // Route recording state
  const [isRecordingRoute, setIsRecordingRoute] = useState(false);
  const [recordingPoints, setRecordingPoints] = useState<RoutePoint[]>([]);
  const [recordingRouteName, setRecordingRouteName] = useState('');
  const [pendingPlaceName, setPendingPlaceName] = useState<string | null>(null);

  // Scene vision state
  const [isAnalyzingScene, setIsAnalyzingScene] = useState(false);

  // Refs for navigation loop
  const isNavigatingRef = useRef(false);
  const navPausedRef = useRef(false);
  const navPointIndexRef = useRef(0);
  const activeRouteRef = useRef<SavedRoute | null>(null);
  const navDestinationRef = useRef<SavedPlace | null>(null);
  const positionRef = useRef<GeoPosition | null>(null);
  const compassHeadingRef = useRef<number | null>(null);
  const lastNavSpokenRef = useRef<number>(0);
  const navIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingPointsRef = useRef<RoutePoint[]>([]);

  const { speak, stopSpeaking } = useTTS();
  const { heading: compassHeading, startCompass } = useCompass();
  const { isRecording: isRecordingVoice, startRecording, stopRecording } = useVoiceRecorder();
  const { startCamera, stopCamera, captureFrameAsync } = useCameraCapture();
  const { isCaching, cacheAllPlaces, getCacheSize, clearCache } = useOfflineMapCache();

  const addEntry = useCallback((type: TranscriptEntry['type'], text: string) => {
    setTranscript(prev => [
      ...prev.slice(-50),
      { id: generateId(), type, text, timestamp: Date.now() },
    ]);
  }, []);

  const systemSay = useCallback(async (text: string, type: TranscriptEntry['type'] = 'system', priority = false) => {
    addEntry(type, text);
    await speak(text, priority);
  }, [addEntry, speak]);

  // ---- GEOLOCATION ----
  const { position, error: gpsError, startTracking } = useGeolocation({
    onPosition: (pos) => {
      positionRef.current = pos;
      if (isRecordingRoute) {
        const newPoint: RoutePoint = {
          lat: pos.lat,
          lng: pos.lng,
          timestamp: Date.now(),
          heading: compassHeadingRef.current ?? undefined,
        };
        setRecordingPoints(prev => {
          const updated = [...prev, newPoint];
          recordingPointsRef.current = updated;
          return updated;
        });
      }
    },
    onError: (err) => {
      if (err.includes('dogshit')) {
        systemSay(settings.aggressiveMode
          ? "Signal's dogshit — falling back to last known position. Swing that cane."
          : "GPS signal lost. Using last known position.", 'warning', true);
      }
    },
  });

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => { compassHeadingRef.current = compassHeading; }, [compassHeading]);
  useEffect(() => { isNavigatingRef.current = isNavigating; }, [isNavigating]);
  useEffect(() => { navPausedRef.current = navPaused; }, [navPaused]);
  useEffect(() => { navPointIndexRef.current = navPointIndex; }, [navPointIndex]);
  useEffect(() => { activeRouteRef.current = activeRoute; }, [activeRoute]);
  useEffect(() => { navDestinationRef.current = navDestination; }, [navDestination]);
  useEffect(() => { recordingPointsRef.current = recordingPoints; }, [recordingPoints]);

  // ---- NAVIGATION LOOP ----
  useEffect(() => {
    if (isNavigating && !navPaused) {
      navIntervalRef.current = setInterval(() => {
        const pos = positionRef.current;
        const route = activeRouteRef.current;
        const dest = navDestinationRef.current;
        const heading = compassHeadingRef.current;

        if (!pos || !dest || navPausedRef.current) return;

        const now = Date.now();
        if (now - lastNavSpokenRef.current < NAV_COOLDOWN_MS) return;

        if (route && navPointIndexRef.current < route.points.length) {
          const targetPoint = route.points[navPointIndexRef.current];
          if (shouldAdvanceWaypoint(pos.lat, pos.lng, targetPoint)) {
            // Announce landmark if present
            const landmark = targetPoint.landmark;
            setNavPointIndex(prev => {
              const next = prev + 1;
              navPointIndexRef.current = next;
              if (landmark) {
                systemSay(
                  settings.aggressiveMode
                    ? `Landmark: ${landmark}. Keep going.`
                    : `Landmark: ${landmark}.`,
                  'navigation'
                );
              }
              return next;
            });
          }
        }

        if (route && dest) {
          const instruction = getNavigationInstruction(
            pos.lat, pos.lng, heading,
            route, navPointIndexRef.current, dest,
            settings.aggressiveMode
          );

          if (instruction.arrived) {
            setIsNavigating(false);
            setActiveRoute(null);
            setNavDestination(null);
            if (navIntervalRef.current) clearInterval(navIntervalRef.current);
            evolveSoul({ helpfulness: 0.2 });
            systemSay(instruction.text, 'success', true);
          } else {
            if (instruction.deviation) {
              lastNavSpokenRef.current = now;
              systemSay(instruction.text, 'warning', true);
            } else {
              lastNavSpokenRef.current = now;
              systemSay(instruction.text, 'navigation');
            }
          }
        } else if (dest) {
          const dist = getDistance(pos.lat, pos.lng, dest.lat, dest.lng);
          if (dist <= 15) {
            setIsNavigating(false);
            setNavDestination(null);
            if (navIntervalRef.current) clearInterval(navIntervalRef.current);
            evolveSoul({ helpfulness: 0.2 });
            systemSay(
              soulFilter(SOUL_VOICE.navArrived(dest.name), { isNavigation: true }),
              'success', true
            );
          } else {
            const bearing = getBearing(pos.lat, pos.lng, dest.lat, dest.lng);
            const dir = bearingToDirection(bearing);
            const feet = metersToFeet(dist);
            lastNavSpokenRef.current = now;

            if (heading !== null) {
              let diff = (bearing - heading + 360) % 360;
              if (diff > 180) diff -= 360;
              const absD = Math.abs(diff);
              const side = diff >= 0 ? 'right' : 'left';
              let turnText = '';
              if (absD <= 15) turnText = settings.aggressiveMode ? 'Straight ahead' : 'Continue straight';
              else if (absD <= 45) turnText = `Slight ${side} ${Math.round(absD)}°`;
              else if (absD <= 90) turnText = `${settings.aggressiveMode ? (diff >= 0 ? 'Veer' : 'Cut') : 'Turn'} ${side} ${Math.round(absD)}°`;
              else turnText = `Hard ${side} ${Math.round(absD)}°`;
              systemSay(
                settings.aggressiveMode
                  ? `${turnText} — ${feet} feet to ${dest.name}.`
                  : `${turnText}. ${feet} feet to ${dest.name}.`,
                'navigation'
              );
            } else {
              systemSay(
                settings.aggressiveMode
                  ? `Head ${dir} — ${feet} feet to ${dest.name}.`
                  : `Head ${dir}. ${feet} feet to ${dest.name}.`,
                'navigation'
              );
            }
          }
        }
      }, 2000);
    } else {
      if (navIntervalRef.current) {
        clearInterval(navIntervalRef.current);
        navIntervalRef.current = null;
      }
    }

    return () => {
      if (navIntervalRef.current) clearInterval(navIntervalRef.current);
    };
  }, [isNavigating, navPaused, settings.aggressiveMode, systemSay]);

  // ---- AI SCENE VISION ----
  const analyzeScene = useCallback(async (context?: string) => {
    const agg = settings.aggressiveMode;
    setIsAnalyzingScene(true);
    await systemSay(agg ? 'Camera scanning — hold steady.' : 'Activating camera scan...', 'system');

    try {
      const started = await startCamera();
      if (!started) {
        await systemSay(
          agg
            ? 'Camera denied — no eyes available. Using environmental scan fallback.'
            : 'Camera access denied. Using basic scene description.',
          'warning', true
        );
        const fallback = getSceneDescription(positionRef.current, agg);
        await systemSay(fallback, 'system', true);
        setIsAnalyzingScene(false);
        return;
      }

      // Wait a moment for camera to stabilize
      await new Promise(r => setTimeout(r, 800));
      const imageBase64 = await captureFrameAsync();
      stopCamera();

      if (!imageBase64 || imageBase64.length < 1000) {
        await systemSay(
          agg ? "Frame too dark or blank — can't see shit. Move somewhere brighter." : 'Image capture failed. Try better lighting.',
          'warning', true
        );
        setIsAnalyzingScene(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('scene-vision', {
        body: { imageBase64, context },
      });

      if (error) {
        let msg = error.message;
        if (error instanceof FunctionsHttpError) {
          try { msg = await error.context?.text() ?? msg; } catch { /* ignore */ }
        }
        console.error('[scene-vision] Error:', msg);
        // Fallback to basic scene description
        const fallback = getSceneDescription(positionRef.current, agg);
        await systemSay(fallback, 'system', true);
      } else {
        evolveSoul({ helpfulness: 0.1 });
        await systemSay(data.description, 'system', true);
      }
    } catch (err) {
      console.error('[analyzeScene]', err);
      const fallback = getSceneDescription(positionRef.current, agg);
      await systemSay(fallback, 'system', true);
    } finally {
      setIsAnalyzingScene(false);
    }
  }, [settings.aggressiveMode, systemSay, startCamera, captureFrameAsync, stopCamera]);

  // ---- COMMAND HANDLER ----
  const handleCommand = useCallback(async (text: string) => {
    addEntry('user', text);
    const cmd = parseCommand(text);
    const agg = settings.aggressiveMode;
    const pos = positionRef.current;

    console.log('[GROKSCHITT] Parsed command:', cmd);

    switch (cmd.type) {
      case 'WHERE_AM_I': {
        if (!pos) {
          await systemSay(agg
            ? soulFilter(SOUL_VOICE.noGps(), { uncertaintyScore: 0.7 })
            : "GPS signal not acquired yet. Please wait.", 'warning', true);
          return;
        }
        const nearest = findNearestPlace(pos.lat, pos.lng);
        let locationText = agg
          ? `You're at ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}. Accuracy: ${Math.round(pos.accuracy)}m.`
          : `Your location: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}. Accuracy: ${Math.round(pos.accuracy)} meters.`;

        if (nearest && nearest.distance < 200) {
          locationText += agg
            ? ` ${metersToFeet(nearest.distance)} feet from ${nearest.place.name}. ${SOUL_VOICE.BASE_AWARENESS}`
            : ` You are ${metersToFeet(nearest.distance)} feet from ${nearest.place.name}.`;
        }
        if (compassHeadingRef.current !== null) {
          locationText += ` Facing ${bearingToDirection(compassHeadingRef.current)}.`;
        }
        await systemSay(locationText, 'system', true);
        break;
      }

      case 'SAVE_PLACE': {
        if (!pos) {
          await systemSay(agg
            ? "Can't save shit without GPS. Get a signal first."
            : "GPS required to save a place.", 'warning', true);
          return;
        }
        let placeName = cmd.param;
        if (!placeName) {
          setPendingPlaceName('__WAITING__');
          await systemSay(agg
            ? "What do you want to call this badass spot? Bark a name."
            : "What would you like to name this place?", 'system', true);
          return;
        }
        const place: SavedPlace = {
          id: generateId(),
          name: placeName,
          lat: pos.lat,
          lng: pos.lng,
          accuracy: pos.accuracy,
          createdAt: Date.now(),
        };
        savePlace(place);
        evolveSoul({ helpfulness: 0.1 });
        await systemSay(agg
          ? `Locked in! "${placeName}" burned into the map. ${SOUL_VOICE.FLIP_CRAP}`
          : `Saved! "${placeName}" has been locked at your current location.`, 'success', true);
        break;
      }

      case 'NAVIGATE_TO': {
        const destName = cmd.param;
        if (!destName) {
          await systemSay(agg
            ? "Navigate WHERE? Speak a destination name, genius."
            : "Please specify a destination name.", 'warning', true);
          return;
        }
        const place = findPlaceByName(destName);
        if (!place) {
          await systemSay(agg
            ? `Never heard of "${destName}". Save it first — say "save place as ${destName}".`
            : `No saved place found for "${destName}". Save it first.`, 'warning', true);
          return;
        }
        const routes = getRoutes();
        const matchRoute = routes.find(
          r => r.destinationPlaceId === place.id ||
          r.destinationName.toLowerCase().includes(place.name.toLowerCase())
        );
        if (matchRoute) {
          setActiveRoute(matchRoute);
          setNavDestination(place);
          setNavPointIndex(0);
          setIsNavigating(true);
          setNavPaused(false);
          lastNavSpokenRef.current = 0;
          evolveSoul({ helpfulness: 0.3, protectiveness: 0.2 });
          await systemSay(agg
            ? soulFilter(SOUL_VOICE.navStart(place.name), { isNavigation: true }) +
              ` Route: "${matchRoute.name}", ${matchRoute.points.length} waypoints.`
            : `Starting navigation via route "${matchRoute.name}" to ${place.name}.`,
            'navigation', true);
        } else {
          if (!pos) {
            await systemSay(agg
              ? "Need GPS for navigation dummy. Get a lock."
              : "GPS required for navigation.", 'warning', true);
            return;
          }
          setNavDestination(place);
          setActiveRoute(null);
          setIsNavigating(true);
          setNavPaused(false);
          lastNavSpokenRef.current = 0;
          evolveSoul({ helpfulness: 0.3, protectiveness: 0.2 });
          const dist = getDistance(pos.lat, pos.lng, place.lat, place.lng);
          const bearing = getBearing(pos.lat, pos.lng, place.lat, place.lng);
          await systemSay(agg
            ? soulFilter(SOUL_VOICE.navStart(place.name), { isNavigation: true }) +
              ` Direct GPS — ${metersToFeet(dist)} feet, head ${bearingToDirection(bearing)}.`
            : `Navigating to ${place.name}. ${metersToFeet(dist)} feet, head ${bearingToDirection(bearing)}.`,
            'navigation', true);
        }
        break;
      }

      case 'HOME': {
        const homePlace =
          findPlaceByName('home') ||
          findPlaceByName('crib') ||
          findPlaceByName('my crib') ||
          findPlaceByName('crib entrance');
        if (!homePlace) {
          await systemSay(agg
            ? "No home spot saved yet. Say 'save place as home' to set your home base."
            : "No home location saved. Say 'save place as home' to set it.", 'warning', true);
          return;
        }
        setNavDestination(homePlace);
        setActiveRoute(null);
        setIsNavigating(true);
        setNavPaused(false);
        lastNavSpokenRef.current = 0;
        evolveSoul({ protectiveness: 0.2, helpfulness: 0.2 });
        await systemSay(agg
          ? soulFilter(SOUL_VOICE.navStart(homePlace.name), { isNavigation: true }) + ' Taking you home.'
          : `Navigating home to ${homePlace.name}.`, 'navigation', true);
        break;
      }

      case 'START_ROUTE': {
        const routeDestName = cmd.param;
        if (!pos) {
          await systemSay(agg
            ? "GPS needed to log a route."
            : "GPS required to record a route.", 'warning', true);
          return;
        }
        const rName = routeDestName ? `Route to ${routeDestName}` : `Route ${Date.now()}`;
        const startPoint: RoutePoint = { lat: pos.lat, lng: pos.lng, timestamp: Date.now() };
        setRecordingRouteName(rName);
        setRecordingPoints([startPoint]);
        recordingPointsRef.current = [startPoint];
        setIsRecordingRoute(true);
        setMode('recording-route');
        await systemSay(agg
          ? `Route recording LIVE — logging "${rName}". Walk your route. Say "mark landmark as name" to tag spots. Say "stop logging" when done.`
          : `Recording route "${rName}". Walk to your destination. Say "mark landmark" to tag spots. Say "stop logging" when done.`, 'success', true);
        break;
      }

      case 'STOP_ROUTE': {
        if (!isRecordingRoute) {
          await systemSay(agg ? "Not recording any route right now." : "No active route recording.", 'warning', true);
          return;
        }
        const finalPoints = [...recordingPointsRef.current];
        if (pos) finalPoints.push({ lat: pos.lat, lng: pos.lng, timestamp: Date.now() });
        if (finalPoints.length < 2) {
          await systemSay(agg
            ? "Route too short — barely moved. Try again."
            : "Route too short. Walk further before stopping.", 'warning', true);
          setIsRecordingRoute(false);
          setMode('idle');
          return;
        }
        const destPlace = findPlaceByName(recordingRouteName.replace('Route to ', ''));
        const newRoute: SavedRoute = {
          id: generateId(),
          name: recordingRouteName,
          destinationName: recordingRouteName.replace('Route to ', ''),
          destinationPlaceId: destPlace?.id,
          points: finalPoints,
          createdAt: Date.now(),
          useCount: 0,
          duration: finalPoints[finalPoints.length - 1].timestamp - finalPoints[0].timestamp,
        };
        saveRoute(newRoute);
        const landmarkCount = finalPoints.filter(p => p.landmark).length;
        setIsRecordingRoute(false);
        setRecordingPoints([]);
        recordingPointsRef.current = [];
        setMode('idle');
        evolveSoul({ helpfulness: 0.1 });
        await systemSay(agg
          ? `Route "${recordingRouteName}" locked — ${finalPoints.length} waypoints${landmarkCount ? `, ${landmarkCount} landmarks tagged` : ''}. ${SOUL_VOICE.FLIP_CRAP}`
          : `Route "${recordingRouteName}" saved with ${finalPoints.length} waypoints${landmarkCount ? ` and ${landmarkCount} landmarks` : ''}.`, 'success', true);
        break;
      }

      // ── LANDMARK VOICE TAG ──────────────────────────────────────────────
      case 'MARK_LANDMARK': {
        if (!isRecordingRoute) {
          await systemSay(agg
            ? "Landmarks can only be tagged while recording a route. Start a route first."
            : "Not recording a route. Start route recording first.", 'warning', true);
          return;
        }
        if (!pos) {
          await systemSay(agg ? "No GPS to tag landmark." : "GPS required.", 'warning', true);
          return;
        }
        const landmarkName = cmd.param?.trim() || 'unnamed landmark';
        const landmarkPoint: RoutePoint = {
          lat: pos.lat,
          lng: pos.lng,
          timestamp: Date.now(),
          heading: compassHeadingRef.current ?? undefined,
          landmark: landmarkName,
        };
        setRecordingPoints(prev => {
          const updated = [...prev, landmarkPoint];
          recordingPointsRef.current = updated;
          return updated;
        });
        evolveSoul({ helpfulness: 0.1 });
        await systemSay(agg
          ? `Landmark tagged: "${landmarkName}". ${SOUL_VOICE.BASE_AWARENESS}`
          : `Landmark "${landmarkName}" tagged at your current position.`, 'success', true);
        break;
      }

      // ── OFFLINE MAP CACHE ──────────────────────────────────────────────
      case 'CACHE_MAP': {
        const places = getPlaces();
        if (!places.length) {
          await systemSay(agg
            ? "No saved spots to cache maps for. Save some places first."
            : "No saved places. Save locations first.", 'warning', true);
          return;
        }
        await systemSay(agg
          ? `Downloading map tiles for ${places.length} spots — hold on.`
          : `Caching offline maps for ${places.length} saved places...`, 'system');
        const result = await cacheAllPlaces();
        await systemSay(agg
          ? `Map cache done — ${result.cached} tiles locked for offline. ${SOUL_VOICE.FLIP_CRAP}`
          : `Offline map cache complete. ${result.cached} tiles saved for ${places.length} places.`, 'success', true);
        break;
      }

      case 'STOP_NAVIGATION': {
        if (!isNavigating) {
          await systemSay(agg ? "Nothing to cancel — not navigating." : "No active navigation.", 'warning', true);
          return;
        }
        setIsNavigating(false);
        setActiveRoute(null);
        setNavDestination(null);
        stopSpeaking();
        await systemSay(agg ? "Navigation cancelled. Standing by." : "Navigation stopped.", 'warning', true);
        break;
      }

      case 'PAUSE_NAVIGATION': {
        if (!isNavigating) {
          await systemSay(agg ? "Not navigating." : "No active navigation.", 'warning', true);
          return;
        }
        setNavPaused(true);
        await systemSay(agg ? "Navigation paused. Hold your position." : "Navigation paused.", 'system', true);
        break;
      }

      case 'RESUME_NAVIGATION': {
        if (!isNavigating || !navPaused) {
          await systemSay(agg ? "Nothing to resume." : "Nothing to resume.", 'warning', true);
          return;
        }
        setNavPaused(false);
        lastNavSpokenRef.current = 0;
        await systemSay(agg ? "Navigation back online. Let's move." : "Navigation resumed.", 'navigation', true);
        break;
      }

      case 'LIST_PLACES': {
        const places = getPlaces();
        await systemSay(formatPlacesList(places, agg), 'system', true);
        break;
      }

      case 'LIST_ROUTES': {
        const routes = getRoutes();
        await systemSay(formatRoutesList(routes, agg), 'system', true);
        break;
      }

      case 'DESCRIBE_SCENE': {
        await analyzeScene(pos ? `User is at lat ${pos.lat.toFixed(4)}, lng ${pos.lng.toFixed(4)}` : undefined);
        break;
      }

      case 'EMERGENCY': {
        const places = getPlaces();
        if (!places.length || !pos) {
          await systemSay(agg
            ? "No safe spots saved and no GPS. Save some spots first."
            : "No saved places or no GPS. Save locations when safe to use emergency navigation.", 'warning', true);
          return;
        }
        const nearest = findNearestPlace(pos.lat, pos.lng);
        if (nearest) {
          setNavDestination(nearest.place);
          setActiveRoute(null);
          setIsNavigating(true);
          setNavPaused(false);
          lastNavSpokenRef.current = 0;
          evolveSoul({ protectiveness: 0.5, helpfulness: 0.3 });
          await systemSay(agg
            ? soulFilter(SOUL_VOICE.navEmergency(nearest.place.name, metersToFeet(nearest.distance)), { isEmergency: true })
            : `Emergency navigation to nearest saved place: ${nearest.place.name}, ${metersToFeet(nearest.distance)} feet away.`,
            'warning', true);
        }
        break;
      }

      case 'SETTINGS': {
        setShowSettings(true);
        await systemSay(agg ? "Opening settings." : "Opening settings.", 'system', true);
        break;
      }

      case 'HELP': {
        await systemSay(getHelpText(agg), 'system', true);
        break;
      }

      case 'EXPORT': {
        exportData();
        evolveSoul({ helpfulness: 0.1 });
        await systemSay(agg
          ? "Memory dump complete — spots and routes exported. Keep that backup safe."
          : "Data exported successfully to JSON file.", 'success', true);
        break;
      }

      case 'VOICE_NOTE': {
        await systemSay(agg
          ? "Recording your voice note — speak now."
          : "Recording voice note. Speak now.", 'system', true);
        const success = await startRecording();
        if (success) {
          setMode('recording-voice-note');
          setTimeout(async () => {
            const audio = await stopRecording();
            setMode('idle');
            if (audio) {
              await systemSay(agg ? "Voice note saved." : "Voice note recorded.", 'success');
            }
          }, 5000);
        }
        break;
      }

      default: {
        if (pendingPlaceName === '__WAITING__') {
          const placeName = text.trim();
          if (pos) {
            const place: SavedPlace = {
              id: generateId(),
              name: placeName,
              lat: pos.lat,
              lng: pos.lng,
              accuracy: pos.accuracy,
              createdAt: Date.now(),
            };
            savePlace(place);
            setPendingPlaceName(null);
            evolveSoul({ helpfulness: 0.1 });
            await systemSay(agg
              ? `Locked in — "${placeName}" saved. ${SOUL_VOICE.RIDE_OR_DIE}`
              : `"${placeName}" saved at your current location.`, 'success', true);
          }
          return;
        }
        await systemSay(agg
          ? `Didn't catch that: "${text}". Say HELP for the full arsenal.`
          : `Command not recognized: "${text}". Say "help" for available commands.`, 'warning', true);
        break;
      }
    }
  }, [settings.aggressiveMode, isRecordingRoute, recordingPoints, recordingRouteName, pendingPlaceName, isNavigating, navPaused, systemSay, speak, stopSpeaking, startRecording, stopRecording, analyzeScene, cacheAllPlaces]);

  // ---- STT SETUP ----
  const { isListening, interimText, micPermission, startListening, stopListening } = useSTT({
    onResult: (transcript, isFinal) => {
      if (isFinal) handleCommand(transcript);
    },
    onStart: () => setMode('listening'),
    onEnd: () => setMode(isNavigating ? 'navigating' : isRecordingRoute ? 'recording-route' : 'idle'),
    onError: (err) => {
      addEntry('warning', err);
      speak(err, true);
      setMode('idle');
    },
  });

  // ---- INIT ----
  useEffect(() => {
    startTracking();
    startCompass();
  }, []);

  const handleMicTap = useCallback(() => {
    stopSpeaking();
    if (isListening) {
      stopListening();
    } else {
      if (micPermission === 'denied') {
        speak('Microphone is blocked. Tap the lock icon in your browser address bar and allow microphone access, then try again.', true);
        addEntry('warning', 'Microphone blocked — allow mic in browser settings.');
        return;
      }
      startListening();
    }
  }, [isListening, micPermission, startListening, stopListening, stopSpeaking, speak, addEntry]);

  const handleOnboardingComplete = useCallback(() => {
    setOnboarded();
    setShowOnboarding(false);
    setTimeout(() => {
      speak(
        `${SOUL_VOICE.helpMotd()} Tap the circle to speak a command. ${SOUL_VOICE.RIDE_OR_DIE}`,
        true
      );
    }, 500);
  }, [speak]);

  const handleQuickCommand = useCallback((command: string) => {
    stopSpeaking();
    addEntry('user', command);
    handleCommand(command);
  }, [handleCommand, addEntry, stopSpeaking]);

  return (
    <div className="fixed inset-0 bg-black flex flex-col select-none overflow-hidden">
      {showOnboarding && <OnboardingScreen onComplete={handleOnboardingComplete} />}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdate={setSettings}
          onClose={() => setShowSettings(false)}
          onCacheMap={async () => handleQuickCommand('cache map')}
          isCachingMap={isCaching}
          getCacheSize={getCacheSize}
          onClearCache={clearCache}
        />
      )}

      {/* Header */}
      <div className="shrink-0 border-b border-zinc-800">
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            <h1 className="text-yellow-400 font-black text-lg tracking-widest leading-none">BLINDMAN</h1>
            <p className="text-orange-500 font-bold text-xs tracking-widest">GROKSCHITT · AI NAVIGATOR</p>
          </div>
          <div className="flex items-center gap-3">
            {isNavigating && (
              <div className="flex items-center gap-1.5 bg-green-900/50 border border-green-600 rounded px-2 py-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 font-black text-xs">NAVIGATING</span>
              </div>
            )}
            {isAnalyzingScene && (
              <div className="flex items-center gap-1.5 bg-blue-900/50 border border-blue-600 rounded px-2 py-1">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-blue-400 font-black text-xs">SCANNING</span>
              </div>
            )}
            {isRecordingRoute && (
              <div className="flex items-center gap-1.5 bg-red-900/50 border border-red-600 rounded px-2 py-1">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 font-black text-xs">REC</span>
              </div>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-yellow-400 transition-colors"
              aria-label="Settings"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>
        <StatusBar
          mode={mode}
          position={position}
          gpsError={gpsError}
          compassHeading={compassHeading}
          activeRoute={activeRoute}
          destination={navDestination}
          isRecordingRoute={isRecordingRoute}
          routePointCount={recordingPoints.length}
        />
      </div>

      <TranscriptDisplay entries={transcript} interimText={interimText} />

      <div className="shrink-0">
        <QuickActions onCommand={handleQuickCommand} />
      </div>

      <div className="shrink-0 flex items-center justify-center relative py-8 border-t border-zinc-800">
        <VoicePulse
          mode={mode}
          isListening={isListening}
          isNavigating={isNavigating}
          isRecordingRoute={isRecordingRoute}
          micPermission={micPermission}
          onClick={handleMicTap}
        />
      </div>

      {isNavigating && (
        <div className="shrink-0 grid grid-cols-3 gap-2 px-4 pb-4">
          <button
            onClick={() => handleQuickCommand('pause navigation')}
            disabled={navPaused}
            className="bg-zinc-800 border border-zinc-600 text-zinc-300 font-black text-sm py-3 rounded-lg active:scale-95 transition-transform disabled:opacity-40"
          >
            PAUSE
          </button>
          <button
            onClick={() => handleQuickCommand('resume navigation')}
            disabled={!navPaused}
            className="bg-zinc-800 border border-green-600 text-green-400 font-black text-sm py-3 rounded-lg active:scale-95 transition-transform disabled:opacity-40"
          >
            RESUME
          </button>
          <button
            onClick={() => handleQuickCommand('stop navigation')}
            className="bg-zinc-800 border border-red-600 text-red-400 font-black text-sm py-3 rounded-lg active:scale-95 transition-transform"
          >
            ABORT
          </button>
        </div>
      )}

      {isRecordingRoute && (
        <div className="shrink-0 grid grid-cols-2 gap-2 px-4 pb-4">
          <button
            onClick={() => {
              const name = prompt('Landmark name?') || 'landmark';
              handleQuickCommand(`mark landmark as ${name}`);
            }}
            className="bg-zinc-800 border border-yellow-600 text-yellow-400 font-black text-sm py-3 rounded-lg active:scale-95 transition-transform"
          >
            📍 LANDMARK
          </button>
          <button
            onClick={() => handleQuickCommand('stop logging route')}
            className="bg-red-900 border border-red-600 text-red-300 font-black text-sm py-3 rounded-lg active:scale-95 transition-transform"
          >
            ■ STOP REC
          </button>
        </div>
      )}
    </div>
  );
};

export default Index;
