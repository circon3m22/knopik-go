"use client";
/* eslint-disable react-hooks/set-state-in-effect -- Restoring a save and resetting sprite timelines intentionally synchronize state with external snapshots. */
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, } from "react";
import { SAVE_KEY, SAVE_VERSION, createDefaultSave, sanitizeSave, type CoinState, type DogState, type GameSettings, type GameStats, type SaveData, } from "./game-logic";
import { FATIGUE_DURATION_MS, ULTRA_TAP_MIN_HOLD_MS, appendTapInterval, calculateFatigueRatio, calculateTapLimit, calculateTempoRatio, calculateUltraTapCoins, chooseUltraTapOverheatDeadline, chooseUltraTapTwoSecondReward, chooseFatigueDuration, isUltraTapOverheated, rollingAverageTapInterval, } from "./tempo-engine";
import { createSoundEngine, type KnopikSoundEngine, type UltraStopResult, } from "./sound-engine";
import { addLevelCoins, levelMultiplier, levelProgressDetails, sanitizeLevelState, type LevelState, } from "./level-engine";
import { createCaseRewards, COMMON_CASE_PRICE, BIG_CASE_PRICE, type CaseKind, type CaseReward, } from "./case-engine";
import { createRiskOutcome, riskMultiplier, type RiskChance, } from "./risk-engine";
import { clampDifficulty, difficultyDuration, difficultyLuckMultiplier, difficultyPatienceMultiplier, difficultyRewardMultiplier, difficultyTiredChanceMultiplier, difficultyTiredSnapMultiplier, difficultyUltraFailureChance, difficultyUltraDeadlineMultiplier, difficultyWithBalancePenalty, } from "./difficulty-engine";
import { type CloudAccount, type CloudSyncState, type PromoCode, } from "./cloud-account";
import { MiniGamePanel, type MiniGameKind, type MiniGameStats, } from "./mini-game-panel";
import { resolveMiniGameBet } from "./mini-game-engine";
import { COSMETICS, THEMES, CLOTHING_UNLOCK_LEVELS, spendBalance, cosmeticFatigueMultiplier, cosmeticUpgradePrice, cosmeticEffect, themeMood, type CosmeticId, type ThemeId } from "./cosmetic-engine";
import { CosmeticArtwork, KnopikPortrait, ClothingArtwork } from "./cosmetic-artwork";
import { PixelDog, PixelEar, PixelScene, PixelLogo, type PotionKind } from "./pixel-artwork";
import { PixelBurst, PixelMoodEffects, PixelRestRing, PixelUltraEffects, PixelShield, PixelEyeLasers } from "./pixel-effects";
import { CaseArtwork, CoinArtwork } from "./collectible-artwork";
import { BottomNavigation } from "./bottom-navigation";
import { VaultSwipe } from "./vault-swipe";
import { DrinkShelf } from "./drink-shelf";
import { ApartmentBottleShelf } from "./apartment-bottle-shelf";
import { SAHUR_ATLAS_URL, SAHUR_GUN_ATLAS_URL } from "./sahur-sprite";
import { BuffShelfItem } from "./buff-shelf-item";
import { BUFF_CATALOG, BUFF_STOCK_LIMIT, emptyBuffStock, purchaseShelfBuff } from "./buff-shelf-engine";
import { DrinkGamePanel } from "./drink-game-panel";
import { LimeGame } from "./lime-game";
import { BrainrotGame } from "./brainrot-game";
import { LIME_MAX_SCORE, MEMORY_ROUNDS, BRAINROT_KINDS, createBrainrotInventory, createBrainrotStats, isBrainrotKind, commitDrinkRound, settleDrinkRound, type DrinkGameKind, type DrinkRoundLedger } from "./drink-game-engine";
import { GameModal } from "./game-modal";
import { CaseOpening, type CaseSequence } from "./case-opening";
import { ProgressRoad } from "./progress-road";
import { progressReward } from "./progress-engine";
import type { DailyCaseStatus } from "./daily-case";
import { RunnerGame } from "./runner-game";
import { RunnerBackdrop } from "./runner-backdrop";
import { CaseShop } from "./case-shop";
import type { RunnerResult } from "./runner-engine";
import { ADMIN_COMMANDS, AdminCheatConsole } from "./admin-cheats";
import { COLLECTION_CHEATS, BUFF_SAVE_FIELDS, grantCollectionCheat } from "./collection-cheats";
import { ShopLock } from "./shop-lock";
import { PitbullGame } from "./pitbull-game";
import { AdventureGame } from "./adventure-game";
import { NeighborhoodGame } from "./neighborhood-game";
import { defaultNeighborhoodProgress, type NeighborhoodProgress } from "./neighborhood-progress";
import { ActionScene } from "./action-scene";
import type { AdventureLootBuff } from "./adventure-loot";
import { QuickBuffArtwork } from "./quick-buff-artwork";

type TapParticle = {
    id: number;
    x: number;
    y: number;
    amount: number;
    jackpot: boolean;
};
type RecoveryReason = "rest" | "bite" | "ultra";
type RiskPhase = "normal" | "selecting" | "transition" | "spinning" | "result";
type RiskStats = {
    spins: number;
    wins: number;
    losses: number;
    lastBet: number;
};
type SaveFlight = {
    id: number;
    amount: number;
};
const CALM_SERIES_RESET_MS = 6000;
const WARNING_REST_MS = 2650;
const RECOVERY_MS = 1350;
const ANGRY_MS = 4000;
const EMOTION_FRAME_MS = 125;
const ULTRA_VISUAL_DELAY_MS = 360;
const RANDOM_TIRED_CHANCE = 0.015;
const TIRED_SNAP_CHANCE = 0.04;
const LAST_TAP_CHANCE = 0.0025;
const TIRED_MOOD_MIN_MS = 7000;
const TIRED_MOOD_SPREAD_MS = 6000;
const HASBIK_HAT_PRICE = 5000;
const MOHAWK_PRICE = 10000;
const MOHAWK_RISK_BONUS = 1.08;
const ZHIVCHIK_DURATION_MS = 60000;
const ZHIVCHIK_MULTIPLIER = 4;
const HAT_ULTRA_BONUS_MS = 350;
const HAT_REWARD_ROLL_FLOOR = 0.18;
const MAX_CHEAT_COIN_GRANT = 1000000000;
const RISK_SPIN_MS = 5400;
const RISK_RESULT_MS = 1650;
const INVENTORY_LIMIT = 25;
const CASE_HOLD_MS = 1050;
const PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
const publicAsset = (path: string) => `${PUBLIC_BASE_PATH}${path}`;
const tutorialSlides = [
    {
        symbol: "TAP",
        eyebrow: "ОСНОВА",
        title: "Тапай по Кнопику и следи за его настроением",
        copy: "Быстрый ровный темп радует Кнопика и окрашивает фон в синий. Медленные нажатия и паузы утомляют его.",
    },
    {
        symbol: "MOOD",
        eyebrow: "ЭМОЦИИ",
        title: "Лицо Кнопика и цвет фона предупреждают об опасности",
        copy: "Весёлый Кнопик терпеливее. Напряжённый или уставший может быстро рассердиться, а при проигрыше пропадут незащищённые монеты.",
    },
    {
        symbol: "HOLD",
        eyebrow: "УЛЬТРА-ТАП",
        title: "Зажми Кнопика, чтобы зарядить мощную добычу",
        copy: "Чем дольше удержание, тем выше награда и риск. Отпусти вовремя: передержка сжигает добычу. Когда Кнопик устал, ультра-тап недоступен.",
    },
    {
        symbol: "REST",
        eyebrow: "УСТАЛОСТЬ",
        title: "Усталость делает игру опаснее",
        copy: "Кнопик устаёт от рискованной игры и иногда просто теряет терпение. Купленный за активные монеты корм можно использовать прямо на главном экране.",
    },
    {
        symbol: "SAVE",
        eyebrow: "ПРОГРЕСС",
        title: "Развивай уровень и вовремя защищай добычу",
        copy: "Уровни открываются за суммарно заработанные монеты и сохраняются после проигрыша. Монеты в сейфе сохраняются навсегда, хотя при переводе защищается только часть суммы.",
    },
];
function vibrate(pattern: number | number[], enabled: boolean) {
    if (enabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(pattern);
    }
}
function tempoSceneColor(averageInterval: number, hasTaps: boolean, theme: ThemeId) {
    if (!hasTaps)
        return `rgb(${THEMES[theme].rgb.join(" ")})`;
    const ratio = Math.min(1, Math.max(0, (500 - averageInterval) / 240));
    const light = THEMES[theme].rgb;
    const deep = [10, 82, 199];
    const channels = light.map((channel, index) => Math.round(channel + (deep[index] - channel) * ratio));
    return `rgb(${channels.join(" ")})`;
}
type KnopikGoGameProps = {
    account: CloudAccount;
    initialSave: SaveData;
    syncState: CloudSyncState;
    difficulty: number;
    promoCodes: PromoCode[];
    onSave: (save: SaveData) => void;
    onRetrySave: () => Promise<boolean>;
    onRefreshPromoCodes: () => Promise<void>;
    onUpdateDifficulty: (difficulty: number) => Promise<string>;
    onCreatePromoCode: (code: string, amount: number) => Promise<string>;
    onRedeemPromoCode: (code: string) => Promise<{
        message: string;
        amount?: number;
    }>;
    onGetDailyCase: () => Promise<DailyCaseStatus>;
    onClaimDailyCase: (save: SaveData) => Promise<DailyCaseStatus>;
    onSignOut: () => Promise<void>;
};
export function KnopikGoGame({ account, initialSave, syncState, difficulty, promoCodes, onSave, onRetrySave, onRefreshPromoCodes, onUpdateDifficulty, onCreatePromoCode, onRedeemPromoCode, onGetDailyCase, onClaimDailyCase, onSignOut, }: KnopikGoGameProps) {
    const restoredSaveRef = useRef<SaveData | null>(null);
    const [dogState, setDogState] = useState<DogState>("calm");
    const [recoveryReason, setRecoveryReason] = useState<RecoveryReason>("rest");
    const [coins, setCoins] = useState<CoinState>({
        walletCoins: 0,
        streakCoins: 0,
    });
    const [vaultCoins, setVaultCoins] = useState(0);
    const vaultCoinsRef = useRef(0);
    const [ownedCosmetics, setOwnedCosmetics] = useState<CosmeticId[]>([]);
    const [equippedCosmetic, setEquippedCosmetic] = useState<CosmeticId | null>(null);
    const [cosmeticLevels,setCosmeticLevels] = useState<Record<CosmeticId,number>>({bandana:1,charm:1});
    const cosmeticLevelsRef = useRef<Record<CosmeticId,number>>({bandana:1,charm:1});
    const cosmeticRef = useRef<CosmeticId | null>(null);
    const cosmeticOwnedRef = useRef<CosmeticId[]>([]);
    const [ownedThemes, setOwnedThemes] = useState<ThemeId[]>(["classic"]);
    const [activeTheme, setActiveTheme] = useState<ThemeId>("classic");
    const themesOwnedRef = useRef<ThemeId[]>(["classic"]);
    const [storyCompletedLevel, setStoryCompletedLevel] = useState(0);
    const [storyWeaponTier, setStoryWeaponTier] = useState(0);
    const [foodCount, setFoodCount] = useState(0);
    const [healCount, setHealCount] = useState(0);
    const [drinkCount, setDrinkCount] = useState(0);
    const [pitbullCount, setPitbullCount] = useState(0);
    const [colaCount, setColaCount] = useState(0);
    const [teaCount, setTeaCount] = useState(0);
    const [limeCount, setLimeCount] = useState(0);
    const [matchaCount, setMatchaCount] = useState(0);
    const [brainrotInventory, setBrainrotInventory] = useState(createBrainrotInventory);
    const [brainrotStats, setBrainrotStats] = useState(createBrainrotStats);
    const shelfStockRef = useRef(emptyBuffStock());
    const drinkInventoryRef = useRef({ lime: 0, matcha: 0, ...createBrainrotInventory() });
    const drinkLedgerRef = useRef<DrinkRoundLedger | null>(null);
    const [drinkGame, setDrinkGame] = useState<DrinkGameKind | null>(null);
    const [drinkSession, setDrinkSession] = useState(0);
    const [drinkGameStats, setDrinkGameStats] = useState({ limePlays: 0, matchaPlays: 0, limeBest: 0, matchaBest: 0 });
    const [vitaPowerCount, setVitaPowerCount] = useState(0);
    const [vitaPowerShield, setVitaPowerShield] = useState(false);
    const vitaPowerShieldRef = useRef(false);
    const [shieldBreakVisible, setShieldBreakVisible] = useState(false);
    const [hatOwned, setHatOwned] = useState(false);
    const [hatEquipped, setHatEquipped] = useState(false);
    const [mohawkOwned, setMohawkOwned] = useState(false);
    const [mohawkEquipped, setMohawkEquipped] = useState(false);
    const [hatLevel, setHatLevel] = useState(1);
    const [mohawkLevel, setMohawkLevel] = useState(1);
    const [hatUpgradeTokens, setHatUpgradeTokens] = useState(0);
    const [mohawkUpgradeTokens, setMohawkUpgradeTokens] = useState(0);
    const [commonCases, setCommonCases] = useState(0);
    const [bigCases, setBigCases] = useState(0);
    const [questIndex, setQuestIndex] = useState(0);
    const [claimedLevelRewards, setClaimedLevelRewards] = useState<number[]>([]);
    const claimedRewardsRef = useRef<number[]>([]);
    const [progressOpen, setProgressOpen] = useState(false);
    const [dailyClaimPending, setDailyClaimPending] = useState(false);
    const [earInteractionCount, setEarInteractionCount] = useState(0);
    const [hatInteractionCount, setHatInteractionCount] = useState(0);
    const [mohawkInteractionCount, setMohawkInteractionCount] = useState(0);
    const [boostUntil, setBoostUntil] = useState(0);
    const [settings, setSettings] = useState<GameSettings>({
        sound: true,
        vibration: true,
        suliman: false,
        yellow: false,
    });
    const [stats, setStats] = useState<GameStats>({
        bestStreak: 0,
        totalTaps: 0,
        totalBites: 0,
    });
    const [levelState, setLevelState] = useState<LevelState>({
        level: 0,
        progressCoins: 0,
        lifetimeCoins: 0,
    });
    const [tutorialSeen, setTutorialSeen] = useState(false);
    const [tutorialOpen, setTutorialOpen] = useState(true);
    const [tutorialStep, setTutorialStep] = useState(0);
    const [shopOpen, setShopOpen] = useState(false);
    const [shopCategory, setShopCategory] = useState<"themes" | "clothes" | "cases">("clothes");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [actionOpen, setActionOpen] = useState(false);
    const [runnerOpen, setRunnerOpen] = useState(false);
    const [adventureOpen, setAdventureOpen] = useState(false);
    const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
    const [neighborhood, setNeighborhood] = useState<NeighborhoodProgress>(defaultNeighborhoodProgress);
    const [apartmentBarOpen, setApartmentBarOpen] = useState(false);
    const [storyCheckpoint, setStoryCheckpoint] = useState(0);
    const [runnerStats, setRunnerStats] = useState({ runnerBest: 0, runnerRuns: 0, runnerCoins: 0 });
    const [runnerCheats, setRunnerCheats] = useState({ magnet: false, turbo: false });
    const [caseSequence, setCaseSequence] = useState<CaseSequence | null>(null);
    const [accountPending, setAccountPending] = useState(false);
    const [promoCode, setPromoCode] = useState("");
    const [promoAmount, setPromoAmount] = useState("");
    const [promoMessage, setPromoMessage] = useState("");
    const [promoPending, setPromoPending] = useState(false);
    const [difficultyDraft, setDifficultyDraft] = useState(() => clampDifficulty(difficulty));
    const [difficultyMessage, setDifficultyMessage] = useState("");
    const [difficultyPending, setDifficultyPending] = useState(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const [seriesTaps, setSeriesTaps] = useState(0);
    const [averageInterval, setAverageInterval] = useState(600);
    const [fatigueUntil, setFatigueUntil] = useState(0);
    const [fatigueVisualDuration, setFatigueVisualDuration] = useState(1);
    const [clock, setClock] = useState(() => Date.now());
    const [holding, setHolding] = useState(false);
    const [ultraActive, setUltraActive] = useState(false);
    const [ultraCharge, setUltraCharge] = useState(0);
    const [ultraPreview, setUltraPreview] = useState(0);
    const [tapPulse, setTapPulse] = useState(0);
    const [balancePulse, setBalancePulse] = useState(0);
    const [particles, setParticles] = useState<TapParticle[]>([]);
    const [biteFlash, setBiteFlash] = useState(false);
    const [shopMessage, setShopMessage] = useState("");
    const [cheatCode, setCheatCode] = useState("");
    const [cheatMessage, setCheatMessage] = useState("");
    const [hasbulaRedeemed, setHasbulaRedeemed] = useState(false);
    const [hatBounce, setHatBounce] = useState(0);
    const [mohawkSwing, setMohawkSwing] = useState(0);
    const [saveFlight, setSaveFlight] = useState<SaveFlight | null>(null);
    const [riskPhase, setRiskPhase] = useState<RiskPhase>("normal");
    const [riskChance, setRiskChance] = useState<RiskChance>(50);
    const [riskBetAmount, setRiskBetAmount] = useState(0);
    const [riskRotation, setRiskRotation] = useState(0);
    const [riskSpinNonce, setRiskSpinNonce] = useState(0);
    const [riskResult, setRiskResult] = useState<"win" | "lose" | null>(null);
    const [riskPayout, setRiskPayout] = useState(0);
    const [riskMessage, setRiskMessage] = useState("");
    const [riskShake, setRiskShake] = useState(0);
    const [riskFatigueUntil, setRiskFatigueUntil] = useState(0);
    const [riskStats, setRiskStats] = useState<RiskStats>({
        spins: 0,
        wins: 0,
        losses: 0,
        lastBet: 0,
    });
    const [miniGame, setMiniGame] = useState<MiniGameKind | null>(null);
    const [miniGameSession, setMiniGameSession] = useState(0);
    const [miniGameStats, setMiniGameStats] = useState<MiniGameStats>({
        slotPlays: 0,
        slotWins: 0,
        minePlays: 0,
        mineWins: 0,
        mineLosses: 0,
    });
    const [levelBurstKey, setLevelBurstKey] = useState(0);
    const [levelBurstVisible, setLevelBurstVisible] = useState(false);
    const [joyFrame, setJoyFrame] = useState(0);
    const [rageFrame, setRageFrame] = useState(0);
    const joySpriteReady = true;
    const rageSpriteReady = true;
    const dogStateRef = useRef<DogState>("calm");
    const coinsRef = useRef(coins);
    const settingsRef = useRef(settings);
    const configuredDifficultyRef = useRef(clampDifficulty(difficulty));
    const difficultyRef = useRef(difficultyWithBalancePenalty(difficulty, coins.walletCoins));
    const hasbulaRedeemedRef = useRef(false);
    const statsRef = useRef(stats);
    const levelStateRef = useRef(levelState);
    const boostUntilRef = useRef(0);
    const bonusCarryRef = useRef(0);
    const fatigueUntilRef = useRef(0);
    const fatigueVisualDeadlineRef = useRef(0);
    const seriesTapsRef = useRef(0);
    const tapLimitRef = useRef(0);
    const tapIntervalsRef = useRef<number[]>([]);
    const lastTapAtRef = useRef<number | null>(null);
    const [initialPatienceRoll] = useState(() => Math.random());
    const patienceRollRef = useRef(initialPatienceRoll);
    const particleIdRef = useRef(0);
    const soundRef = useRef<KnopikSoundEngine | null>(null);
    const holdStartRef = useRef(0);
    const holdPointRef = useRef({ x: 50, y: 50 });
    const holdingRef = useRef(false);
    const ultraActiveRef = useRef(false);
    const ultraAllowedRef = useRef(true);
    const overheatTriggeredRef = useRef(false);
    const ultraDeadlineRef = useRef(3000);
    const ultraTwoSecondRewardRef = useRef(400);
    const ultraDoomedRef = useRef(false);
    const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const angryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tiredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const shieldBreakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const levelBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const caseHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const caseBurstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveFlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const riskTransitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const riskSpinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const riskSlowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const riskReturnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const riskTickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const riskMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const riskPhaseRef = useRef<RiskPhase>("normal");
    const riskCommittedRef = useRef(false);
    const navDragStartRef = useRef(0);
    const navDidDragRef = useRef(false);
    const earTapStateRef = useRef({
        left: { count: 0, lastAt: 0 },
        right: { count: 0, lastAt: 0 },
    });
    const getSound = useCallback(() => {
        if (!soundRef.current) {
            soundRef.current = createSoundEngine({
                enabled: settingsRef.current.sound,
                volume: 0.72,
            });
        }
        return soundRef.current;
    }, []);
    const transitionTo = useCallback((state: DogState) => {
        dogStateRef.current = state;
        setDogState(state);
    }, []);
    const transitionRisk = useCallback((phase: RiskPhase) => {
        riskPhaseRef.current = phase;
        setRiskPhase(phase);
    }, []);
    const updateStats = useCallback((updater: (current: GameStats) => GameStats) => {
        setStats((current) => {
            const next = updater(current);
            statsRef.current = next;
            return next;
        });
    }, []);
    const triggerLevelBurst = useCallback(() => {
        setLevelBurstKey((current) => current + 1);
        setLevelBurstVisible(true);
        getSound().levelUp();
        vibrate([18, 24, 35], settingsRef.current.vibration);
        if (levelBurstTimerRef.current) {
            clearTimeout(levelBurstTimerRef.current);
        }
        levelBurstTimerRef.current = setTimeout(() => setLevelBurstVisible(false), 1050);
    }, [getSound]);
    const updateCoins = useCallback((updater: (current: CoinState) => CoinState) => {
        const previous = coinsRef.current;
        const next = updater(previous);
        coinsRef.current = next;
        difficultyRef.current = difficultyWithBalancePenalty(configuredDifficultyRef.current, next.walletCoins);
        setCoins(next);
        const earned = Math.max(0, next.walletCoins - previous.walletCoins);
        if (earned > 0) {
            const result = addLevelCoins(levelStateRef.current, earned);
            levelStateRef.current = result.state;
            setLevelState(result.state);
            if (result.levelsGained > 0) triggerLevelBurst();
        }
    }, [triggerLevelBurst]);
    const collectRunnerCoins = useCallback((amount: number) => {
        const earned = Math.max(0, Math.floor(amount));
        if (!earned) return;
        updateCoins(current => ({ ...current, walletCoins: Math.min(Number.MAX_SAFE_INTEGER, current.walletCoins + earned) }));
    }, [updateCoins]);
    const finishRunner = useCallback((result: RunnerResult) => {
        setRunnerStats(current => ({ runnerBest: Math.max(current.runnerBest, result.distance), runnerRuns: current.runnerRuns + 1, runnerCoins: current.runnerCoins + result.coins }));
    }, []);
    const awardCoins = useCallback((baseAmount: number, maximum = Number.MAX_SAFE_INTEGER, applyTapBoost = false) => {
        const base = Math.max(0, Math.floor(baseAmount));
        const multiplier = levelMultiplier(levelStateRef.current.level);
        const tapBoost = applyTapBoost && boostUntilRef.current > Date.now()
            ? ZHIVCHIK_MULTIPLIER
            : 1;
        const hiddenDifficulty = difficultyRewardMultiplier(difficultyRef.current);
        const precise = base * multiplier * tapBoost * hiddenDifficulty + bonusCarryRef.current;
        const earned = Math.min(maximum, Math.max(0, Math.floor(precise)));
        bonusCarryRef.current =
            earned >= maximum ? 0 : Math.max(0, precise - earned);
        if (earned === 0)
            return 0;
        setBalancePulse((current) => current + 1);
        updateCoins((current) => ({
            walletCoins: current.walletCoins + earned,
            streakCoins: current.streakCoins + earned,
        }));
        return earned;
    }, [updateCoins]);
    const clearRoundTimers = useCallback(() => {
        [
            idleTimerRef,
            recoveryTimerRef,
            angryTimerRef,
            flashTimerRef,
            tiredTimerRef,
        ].forEach((timerRef) => {
            if (timerRef.current)
                clearTimeout(timerRef.current);
            timerRef.current = null;
        });
    }, []);
    const resetSeries = useCallback(() => {
        seriesTapsRef.current = 0;
        tapLimitRef.current = 0;
        tapIntervalsRef.current = [];
        lastTapAtRef.current = null;
        patienceRollRef.current = Math.random();
        setSeriesTaps(0);
        setAverageInterval(600);
        updateCoins((current) => ({ ...current, streakCoins: 0 }));
    }, [updateCoins]);
    useEffect(() => {
        if (restoredSaveRef.current === initialSave) return;
        restoredSaveRef.current = initialSave;
        try {
            const saved = sanitizeSave(initialSave);
            const loadedCoins = {
                walletCoins: saved.walletCoins,
                streakCoins: 0,
            };
            const loadedStats = {
                bestStreak: saved.bestStreak,
                totalTaps: saved.totalTaps,
                totalBites: saved.totalBites,
            };
            const loadedLevel = sanitizeLevelState({
                level: saved.level,
                progressCoins: saved.levelCoins,
                lifetimeCoins: saved.lifetimeCoins,
            });
            const activeFatigue = saved.settings.yellow
                ? 0
                : Math.max(saved.ultraFatigueUntil > Date.now() ? saved.ultraFatigueUntil : 0, saved.riskFatigueUntil > Date.now() ? saved.riskFatigueUntil : 0);
            coinsRef.current = loadedCoins;
            difficultyRef.current = difficultyWithBalancePenalty(configuredDifficultyRef.current, loadedCoins.walletCoins);
            settingsRef.current = saved.settings;
            statsRef.current = loadedStats;
            levelStateRef.current = loadedLevel;
            boostUntilRef.current = saved.boostUntil > Date.now() ? saved.boostUntil : 0;
            fatigueUntilRef.current = activeFatigue;
            dogStateRef.current = activeFatigue > Date.now() ? "tired" : "calm";
            setCoins(loadedCoins);
            setVaultCoins(saved.vaultCoins);
            vaultCoinsRef.current = saved.vaultCoins;
            setOwnedCosmetics(saved.ownedCosmetics);
            cosmeticOwnedRef.current = saved.ownedCosmetics;
            setEquippedCosmetic(saved.equippedCosmetic);
            cosmeticRef.current = saved.equippedCosmetic;
            cosmeticLevelsRef.current = saved.cosmeticLevels;
            setCosmeticLevels(saved.cosmeticLevels);
            setOwnedThemes(saved.ownedThemes);
            themesOwnedRef.current = saved.ownedThemes;
            setActiveTheme(saved.activeTheme);
            setFoodCount(saved.foodCount);
            setStoryCompletedLevel(saved.storyCompletedLevel);
            setStoryWeaponTier(saved.storyWeaponTier);
            setNeighborhood(saved.neighborhood);
            setHealCount(saved.healCount);
            setDrinkCount(saved.drinkCount);
            setPitbullCount(saved.pitbullCount);
            setColaCount(saved.colaCount);
            setTeaCount(saved.teaCount);
            setLimeCount(saved.limeCount);
            setMatchaCount(saved.matchaCount);
            setBrainrotInventory(saved.brainrotInventory);
            setBrainrotStats(saved.brainrotStats);
            drinkInventoryRef.current = { lime: saved.limeCount, matcha: saved.matchaCount, ...saved.brainrotInventory };
            setDrinkGameStats({ limePlays: saved.limePlays, matchaPlays: saved.matchaPlays, limeBest: saved.limeBest, matchaBest: saved.matchaBest });
            setRunnerStats({ runnerBest: saved.runnerBest, runnerRuns: saved.runnerRuns, runnerCoins: saved.runnerCoins });
            setVitaPowerCount(saved.vitaPowerCount);
            setVitaPowerShield(saved.vitaPowerShield);
            vitaPowerShieldRef.current = saved.vitaPowerShield;
            setHatOwned(saved.hatOwned);
            setHatEquipped(saved.hatEquipped);
            setMohawkOwned(saved.mohawkOwned);
            setMohawkEquipped(saved.mohawkEquipped);
            setHatLevel(saved.hatLevel);
            setMohawkLevel(saved.mohawkLevel);
            setHatUpgradeTokens(saved.hatUpgradeTokens);
            setMohawkUpgradeTokens(saved.mohawkUpgradeTokens);
            setCommonCases(saved.commonCases);
            setBigCases(saved.bigCases);
            setQuestIndex(saved.questIndex);
            setClaimedLevelRewards(saved.claimedLevelRewards);
            claimedRewardsRef.current = saved.claimedLevelRewards;
            setEarInteractionCount(saved.earInteractionCount);
            setHatInteractionCount(saved.hatInteractionCount);
            setMohawkInteractionCount(saved.mohawkInteractionCount);
            setHasbulaRedeemed(saved.hasbulaRedeemed);
            hasbulaRedeemedRef.current = saved.hasbulaRedeemed;
            setBoostUntil(saved.boostUntil > Date.now() ? saved.boostUntil : 0);
            setRiskChance(saved.lastRiskChance as RiskChance);
            setRiskFatigueUntil(!saved.settings.yellow && saved.riskFatigueUntil > Date.now()
                ? saved.riskFatigueUntil
                : 0);
            setRiskStats({
                spins: saved.riskSpins,
                wins: saved.riskWins,
                losses: saved.riskLosses,
                lastBet: saved.lastRiskBet,
            });
            setMiniGameStats({
                slotPlays: saved.slotPlays,
                slotWins: saved.slotWins,
                minePlays: saved.minePlays,
                mineWins: saved.mineWins,
                mineLosses: saved.mineLosses,
            });
            setSettings(saved.settings);
            setStats(loadedStats);
            setLevelState(loadedLevel);
            setFatigueUntil(activeFatigue);
            setDogState(activeFatigue > Date.now() ? "tired" : "calm");
            setTutorialSeen(saved.tutorialSeen);
            setTutorialOpen(false);
            setStoryCheckpoint(saved.storyCheckpoint);
            setAdventureOpen(true);
        }
        catch {
            localStorage.removeItem(SAVE_KEY);
            setTutorialOpen(false);
            setStoryCheckpoint(0);
            setAdventureOpen(true);
        }
        finally {
            setHydrated(true);
        }
        if ("serviceWorker" in navigator &&
            process.env.NODE_ENV === "production") {
            navigator.serviceWorker.register(publicAsset("/sw.js")).catch(() => undefined);
        }
    }, [initialSave]);
    useEffect(() => {
        settingsRef.current = settings;
        soundRef.current?.setEnabled(settings.sound);
    }, [settings]);
    useEffect(() => {
        const normalized = clampDifficulty(difficulty);
        configuredDifficultyRef.current = normalized;
        difficultyRef.current = difficultyWithBalancePenalty(normalized, coinsRef.current.walletCoins);
        setDifficultyDraft(normalized);
    }, [difficulty]);
    useEffect(() => {
        if (settingsOpen && account.isAdmin)
            void onRefreshPromoCodes();
    }, [account.isAdmin, onRefreshPromoCodes, settingsOpen]);
    useEffect(() => {
        fatigueUntilRef.current = fatigueUntil;
        if (fatigueUntil > Date.now() && fatigueUntil !== fatigueVisualDeadlineRef.current) {
            fatigueVisualDeadlineRef.current = fatigueUntil;
            setFatigueVisualDuration(Math.max(1, fatigueUntil - Date.now()));
        }
        else if (!fatigueUntil) {
            fatigueVisualDeadlineRef.current = 0;
            setFatigueVisualDuration(1);
        }
    }, [fatigueUntil]);
    useEffect(() => {
        boostUntilRef.current = boostUntil;
        if (!boostUntil)
            return;
        const timer = setInterval(() => {
            const now = Date.now();
            setClock(now);
            if (now >= boostUntilRef.current) {
                boostUntilRef.current = 0;
                setBoostUntil(0);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [boostUntil]);
    const currentSave = useMemo<SaveData>(() => ({
        version: SAVE_VERSION,
        neighborhood,
        storyCheckpoint,
        storyCompletedLevel,
        storyWeaponTier,
        vaultCoins,
        ownedCosmetics,
        equippedCosmetic,
        cosmeticLevels,
        ownedThemes,
        activeTheme,
        walletCoins: coins.walletCoins,
        foodCount,
        healCount,
        drinkCount,
        pitbullCount,
        colaCount,
        teaCount,
        limeCount,
        matchaCount,
        brainrotInventory,
        brainrotStats,
        ...drinkGameStats,
        ...runnerStats,
        vitaPowerCount,
        vitaPowerShield,
        hatOwned,
        hatEquipped,
        mohawkOwned,
        mohawkEquipped,
        hatLevel,
        mohawkLevel,
        hatUpgradeTokens,
        mohawkUpgradeTokens,
        commonCases,
        bigCases,
        questIndex,
        earInteractionCount,
        hatInteractionCount,
        mohawkInteractionCount,
        hasbulaRedeemed,
        riskFatigueUntil,
        riskSpins: riskStats.spins,
        riskWins: riskStats.wins,
        riskLosses: riskStats.losses,
        slotPlays: miniGameStats.slotPlays,
        slotWins: miniGameStats.slotWins,
        minePlays: miniGameStats.minePlays,
        mineWins: miniGameStats.mineWins,
        mineLosses: miniGameStats.mineLosses,
        lastRiskBet: riskStats.lastBet,
        lastRiskChance: riskChance,
        boostUntil,
        settings,
        tutorialSeen,
        bestStreak: stats.bestStreak,
        totalTaps: stats.totalTaps,
        totalBites: stats.totalBites,
        ultraFatigueUntil: fatigueUntil,
        level: levelState.level,
        levelCoins: levelState.progressCoins,
        lifetimeCoins: levelState.lifetimeCoins,
        claimedLevelRewards,
    }), [
        neighborhood,
        fatigueUntil,
        storyCompletedLevel,
        storyWeaponTier,
        coins.walletCoins,
        boostUntil,
        foodCount,
        healCount,
        drinkCount,
        pitbullCount,
        colaCount,
        teaCount,
        limeCount,
        matchaCount,
        brainrotInventory,
        brainrotStats,
        drinkGameStats,
        runnerStats,
        vitaPowerCount,
        vitaPowerShield,
        hatEquipped,
        hatOwned,
        hasbulaRedeemed,
        mohawkEquipped,
        mohawkOwned,
        hatLevel,
        mohawkLevel,
        hatUpgradeTokens,
        mohawkUpgradeTokens,
        commonCases,
        bigCases,
        questIndex,
        earInteractionCount,
        hatInteractionCount,
        mohawkInteractionCount,
        levelState,
        claimedLevelRewards,
        riskChance,
        riskFatigueUntil,
        riskStats,
        miniGameStats,
        settings,
        stats,
        tutorialSeen,
        vaultCoins,
        storyCheckpoint,
        ownedCosmetics,
        equippedCosmetic,
        cosmeticLevels,
        ownedThemes,
        activeTheme,
    ]);
    useEffect(() => {
        if (!hydrated || dailyClaimPending) return;
        // Store every confirmed UI change locally immediately. The cloud gate
        // throttles remote writes, including high-frequency runner pickups.
        onSave(currentSave);
    }, [currentSave, hydrated, dailyClaimPending, onSave]);
    const signOutAccount = useCallback(async () => {
        setAccountPending(true);
        try {
            await onSignOut();
        } finally {
            setAccountPending(false);
        }
    }, [onSignOut]);
    const submitPromoCode = useCallback(async () => {
        setPromoPending(true);
        setPromoMessage("");
        if (account.isAdmin) {
            const message = await onCreatePromoCode(promoCode, Number(promoAmount));
            setPromoMessage(message);
            if (message === "Промокод создан.") {
                setPromoCode("");
                setPromoAmount("");
            }
        }
        else {
            const result = await onRedeemPromoCode(promoCode);
            setPromoMessage(result.message);
            if (result.amount) {
                updateCoins((current) => ({
                    ...current,
                    walletCoins: current.walletCoins + result.amount!,
                }));
                setBalancePulse((current) => current + 1);
                setPromoCode("");
                getSound().purchase();
            }
        }
        setPromoPending(false);
    }, [account.isAdmin, getSound, onCreatePromoCode, onRedeemPromoCode, promoAmount, promoCode, updateCoins]);
    const submitDifficulty = useCallback(async () => {
        setDifficultyPending(true);
        setDifficultyMessage("");
        const message = await onUpdateDifficulty(difficultyDraft);
        setDifficultyMessage(message);
        setDifficultyPending(false);
    }, [difficultyDraft, onUpdateDifficulty]);
    useEffect(() => {
        if (!fatigueUntil)
            return;
        const timer = setInterval(() => {
            const now = Date.now();
            setClock(now);
            if (now >= fatigueUntilRef.current) {
                fatigueUntilRef.current = 0;
                setFatigueUntil(0);
                setRiskFatigueUntil((current) => (current <= now ? 0 : current));
                if (dogStateRef.current === "tired") {
                    transitionTo("calm");
                    resetSeries();
                }
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [fatigueUntil, resetSeries, transitionTo]);
    useEffect(() => () => {
        clearRoundTimers();
        if (holdIntervalRef.current)
            clearInterval(holdIntervalRef.current);
        if (messageTimerRef.current)
            clearTimeout(messageTimerRef.current);
        if (levelBurstTimerRef.current) {
            clearTimeout(levelBurstTimerRef.current);
        }
        if (saveFlightTimerRef.current) {
            clearTimeout(saveFlightTimerRef.current);
        }
        if (caseHoldTimerRef.current)
            clearTimeout(caseHoldTimerRef.current);
        if (caseBurstTimerRef.current)
            clearTimeout(caseBurstTimerRef.current);
        if (shieldBreakTimerRef.current)
            clearTimeout(shieldBreakTimerRef.current);
        [
            riskTransitionTimerRef,
            riskSpinTimerRef,
            riskSlowTimerRef,
            riskReturnTimerRef,
            riskMessageTimerRef,
        ].forEach((timerRef) => {
            if (timerRef.current)
                clearTimeout(timerRef.current);
        });
        if (riskTickTimerRef.current)
            clearInterval(riskTickTimerRef.current);
        soundRef.current?.close();
    }, [clearRoundTimers]);
    const fatigueRatio = useMemo(() => {
        const remaining = Math.max(0, fatigueUntil - clock);
        if (remaining === 0)
            return 0;
        const duration = difficultyDuration(FATIGUE_DURATION_MS, difficulty);
        return calculateFatigueRatio(duration - remaining, duration);
    }, [clock, difficulty, fatigueUntil]);
    const fatigueCountdownRatio = fatigueUntil > clock
        ? Math.min(1, Math.max(0, (fatigueUntil - clock) / fatigueVisualDuration))
        : 0;
    const stopHoldVisual = useCallback((result: UltraStopResult) => {
        if (holdIntervalRef.current) {
            clearInterval(holdIntervalRef.current);
            holdIntervalRef.current = null;
        }
        holdingRef.current = false;
        ultraActiveRef.current = false;
        setHolding(false);
        setUltraActive(false);
        setUltraCharge(0);
        setUltraPreview(0);
        getSound().stopUltraLoop(result);
    }, [getSound]);
    const enterTiredMood = useCallback((persistent = false) => {
        if (settingsRef.current.yellow) {
            fatigueUntilRef.current = 0;
            setFatigueUntil(0);
            setRiskFatigueUntil(0);
            transitionTo("calm");
            return;
        }
        transitionTo("tired");
        if (tiredTimerRef.current)
            clearTimeout(tiredTimerRef.current);
        tiredTimerRef.current = null;
        if (persistent)
            return;
        const duration = difficultyDuration(TIRED_MOOD_MIN_MS + Math.random() * TIRED_MOOD_SPREAD_MS, difficultyRef.current);
        tiredTimerRef.current = setTimeout(() => {
            tiredTimerRef.current = null;
            if (dogStateRef.current === "tired" &&
                fatigueUntilRef.current <= Date.now()) {
                transitionTo("calm");
                resetSeries();
                getSound().rest();
            }
        }, duration);
    }, [getSound, resetSeries, transitionTo]);
    const finishRecovery = useCallback(() => {
        if (settingsRef.current.yellow) {
            fatigueUntilRef.current = 0;
            setFatigueUntil(0);
            setRiskFatigueUntil(0);
            transitionTo("calm");
        }
        else if (fatigueUntilRef.current > Date.now()) {
            enterTiredMood(true);
        }
        else {
            transitionTo("calm");
        }
        setRecoveryReason("rest");
        resetSeries();
        getSound().rest();
    }, [enterTiredMood, getSound, resetSeries, transitionTo]);
    const beginRecovery = useCallback((reason: RecoveryReason) => {
        setRecoveryReason(reason);
        transitionTo("recovering");
        recoveryTimerRef.current = setTimeout(finishRecovery, RECOVERY_MS);
    }, [finishRecovery, transitionTo]);
    const triggerBite = useCallback((fromOverheat = false) => {
        if (settingsRef.current.suliman) {
            if (holdingRef.current)
                stopHoldVisual("cancel");
            transitionTo("calm");
            resetSeries();
            return;
        }
        clearRoundTimers();
        if (holdingRef.current) {
            stopHoldVisual(fromOverheat ? "overheat" : "cancel");
        }
        const shieldAbsorbed = vitaPowerShieldRef.current;
        if (shieldAbsorbed) {
            setVitaPowerShield(false);
            vitaPowerShieldRef.current = false;
            setShieldBreakVisible(true);
            updateCoins((current) => ({ ...current, streakCoins: 0 }));
            if (shieldBreakTimerRef.current)
                clearTimeout(shieldBreakTimerRef.current);
            shieldBreakTimerRef.current = setTimeout(() => setShieldBreakVisible(false), 760);
            // Protection absorbs the loss before any rage state or laser timer starts.
            setBiteFlash(false);
            setRecoveryReason("rest");
            transitionTo(fatigueUntilRef.current > Date.now() && !settingsRef.current.yellow ? "tired" : "calm");
            resetSeries();
            updateStats(current => ({ ...current, totalBites: current.totalBites + 1 }));
            getSound().runner("shield");
            vibrate([18, 20, 30], settingsRef.current.vibration);
            return;
        }
        else {
            updateCoins(() => ({ walletCoins: 0, streakCoins: 0 }));
        }
        transitionTo("angry");
        setRecoveryReason("bite");
        setBiteFlash(true);
        updateStats((current) => ({
            ...current,
            totalBites: current.totalBites + 1,
        }));
        if (!shieldAbsorbed)
            bonusCarryRef.current = 0;
        // Earned levels and road rewards survive a bite.
        seriesTapsRef.current = 0;
        tapLimitRef.current = 0;
        tapIntervalsRef.current = [];
        setSeriesTaps(0);
        vibrate([90, 35, 80, 35, 55], settingsRef.current.vibration);
        if (!fromOverheat)
            getSound().bite();
        flashTimerRef.current = setTimeout(() => setBiteFlash(false), ANGRY_MS);
        angryTimerRef.current = setTimeout(() => beginRecovery("bite"), ANGRY_MS);
    }, [
        beginRecovery,
        clearRoundTimers,
        getSound,
        resetSeries,
        stopHoldVisual,
        transitionTo,
        updateCoins,
        updateStats,
    ]);
    const armIdleTimer = useCallback((state: "calm" | "tired" | "warning") => {
        if (idleTimerRef.current)
            clearTimeout(idleTimerRef.current);
        const baseDelay = state === "warning" ? WARNING_REST_MS : CALM_SERIES_RESET_MS;
        idleTimerRef.current = setTimeout(() => {
            if (state === "warning" && dogStateRef.current === "warning") {
                beginRecovery("rest");
            }
            else if (state === "calm" && dogStateRef.current === "calm") {
                resetSeries();
            }
            else if (state === "tired" && dogStateRef.current === "tired") {
                resetSeries();
            }
        }, difficultyDuration(baseDelay, difficultyRef.current));
    }, [beginRecovery, resetSeries]);
    const handleEarTap = useCallback((ear: "left" | "right") => {
        if (riskPhaseRef.current !== "normal")
            return;
        const currentState = dogStateRef.current;
        if (holdingRef.current ||
            currentState === "angry" ||
            currentState === "recovering") {
            return;
        }
        getSound().unlock();
        setEarInteractionCount((current) => current + 1);
        if (settingsRef.current.suliman) {
            getSound().tap(0.25);
            vibrate(8, settingsRef.current.vibration);
            return;
        }
        const now = performance.now();
        const previous = earTapStateRef.current[ear];
        const nextCount = now - previous.lastAt <= 2500 ? previous.count + 1 : 1;
        const biteThreshold = Math.max(2, Math.round(3 * difficultyPatienceMultiplier(difficultyRef.current)));
        earTapStateRef.current[ear] = { count: nextCount, lastAt: now };
        getSound().warning(0.38 + nextCount * 0.18);
        vibrate(nextCount >= biteThreshold ? [34, 28, 58] : 16, settingsRef.current.vibration);
        if (nextCount >= biteThreshold) {
            earTapStateRef.current.left = { count: 0, lastAt: 0 };
            earTapStateRef.current.right = { count: 0, lastAt: 0 };
            triggerBite();
            return;
        }
        transitionTo("warning");
        armIdleTimer("warning");
    }, [armIdleTimer, getSound, transitionTo, triggerBite]);
    const addParticle = useCallback((x: number, y: number, amount: number, jackpot: boolean) => {
        const id = ++particleIdRef.current;
        setParticles((current) => [
            ...current.slice(-8),
            { id, x, y, amount, jackpot },
        ]);
        setTimeout(() => setParticles((current) => current.filter((particle) => particle.id !== id)), 650);
    }, []);
    const registerTap = useCallback((x: number, y: number) => {
        if (riskPhaseRef.current !== "normal")
            return;
        const currentState = dogStateRef.current;
        if (currentState === "angry" || currentState === "recovering")
            return;
        if (currentState === "warning") {
            triggerBite();
            return;
        }
        const now = performance.now();
        if (lastTapAtRef.current !== null) {
            tapIntervalsRef.current = appendTapInterval(tapIntervalsRef.current, now - lastTapAtRef.current, 5);
        }
        lastTapAtRef.current = now;
        const average = rollingAverageTapInterval(tapIntervalsRef.current, 5);
        const remaining = Math.max(0, fatigueUntilRef.current - Date.now());
        const fatigueDuration = difficultyDuration(FATIGUE_DURATION_MS, difficultyRef.current);
        const currentFatigue = remaining > 0
            ? calculateFatigueRatio(fatigueDuration - remaining, fatigueDuration)
            : 0;
        const nextSeries = seriesTapsRef.current + 1;
        const effectiveFatigue = currentState === "tired"
            ? Math.max(currentFatigue, 0.72)
            : currentFatigue;
        const dynamicLimit = Math.max(1, Math.round(calculateTapLimit(average, effectiveFatigue, () => patienceRollRef.current) * difficultyPatienceMultiplier(difficultyRef.current)));
        const nextLimit = Math.max(nextSeries, dynamicLimit);
        const tempoRatio = calculateTempoRatio(average);
        seriesTapsRef.current = nextSeries;
        tapLimitRef.current = nextLimit;
        setSeriesTaps(nextSeries);
        setAverageInterval(average);
        setTapPulse((current) => current + 1);
        const jackpot = Math.random() <
            LAST_TAP_CHANCE * difficultyLuckMultiplier(difficultyRef.current);
        const earned = awardCoins(jackpot ? 5 : 1, Number.MAX_SAFE_INTEGER, true);
        addParticle(x, y, earned, jackpot);
        updateStats((current) => ({
            ...current,
            totalTaps: current.totalTaps + 1,
            bestStreak: Math.max(current.bestStreak, nextSeries),
        }));
        getSound().tap(tempoRatio);
        vibrate(7, settingsRef.current.vibration);
        if (settingsRef.current.suliman) {
            if (currentState !== "calm")
                transitionTo("calm");
            armIdleTimer("calm");
            return;
        }
        if (currentState === "tired" &&
            Math.random() <
                TIRED_SNAP_CHANCE * difficultyTiredSnapMultiplier(difficultyRef.current)) {
            triggerBite();
            return;
        }
        if (nextSeries >= nextLimit) {
            transitionTo("warning");
            getSound().warning(effectiveFatigue > 0 ? 0.92 : 0.68);
            vibrate([26, 42, 26], settingsRef.current.vibration);
            armIdleTimer("warning");
        }
        else if (!settingsRef.current.yellow &&
            currentState === "calm" &&
            nextSeries >= 4 &&
            Math.random() <
                RANDOM_TIRED_CHANCE * difficultyTiredChanceMultiplier(difficultyRef.current)) {
            enterTiredMood(false);
            getSound().warning(0.46);
            vibrate([18, 32, 18], settingsRef.current.vibration);
            armIdleTimer("tired");
        }
        else {
            armIdleTimer(currentState === "tired" ? "tired" : "calm");
        }
    }, [
        addParticle,
        armIdleTimer,
        awardCoins,
        enterTiredMood,
        getSound,
        transitionTo,
        triggerBite,
        updateStats,
    ]);
    const startHold = useCallback((x: number, y: number) => {
        if (riskPhaseRef.current !== "normal")
            return;
        if (holdingRef.current)
            return;
        const currentState = dogStateRef.current;
        if (currentState === "angry" || currentState === "recovering")
            return;
        if (currentState === "warning") {
            triggerBite();
            return;
        }
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
            idleTimerRef.current = null;
        }
        getSound().unlock();
        holdPointRef.current = { x, y };
        holdStartRef.current = performance.now();
        const standardDeadline = chooseUltraTapOverheatDeadline() +
            (hatEquipped ? HAT_ULTRA_BONUS_MS * (1 + (hatLevel - 1) * .22) : 0);
        ultraDeadlineRef.current = Math.min(10000, Math.max(ULTRA_TAP_MIN_HOLD_MS + 100, Math.round(standardDeadline *
            difficultyUltraDeadlineMultiplier(difficultyRef.current))));
        ultraTwoSecondRewardRef.current = chooseUltraTapTwoSecondReward(hatEquipped
            ? () => Math.min(0.999999999, Math.min(.42, HAT_REWARD_ROLL_FLOOR + (hatLevel - 1) * .05) +
                Math.random() * (1 - Math.min(.42, HAT_REWARD_ROLL_FLOOR + (hatLevel - 1) * .05)))
            : Math.random);
        ultraDoomedRef.current =
            Math.random() < difficultyUltraFailureChance(difficultyRef.current);
        ultraAllowedRef.current = currentState !== "tired";
        holdingRef.current = true;
        ultraActiveRef.current = false;
        overheatTriggeredRef.current = false;
        setHolding(true);
        setUltraActive(false);
        setUltraCharge(0);
        setUltraPreview(0);
        holdIntervalRef.current = setInterval(() => {
            const elapsed = performance.now() - holdStartRef.current;
            if (ultraAllowedRef.current &&
                elapsed >= ULTRA_VISUAL_DELAY_MS &&
                !ultraActiveRef.current) {
                ultraActiveRef.current = true;
                setUltraActive(true);
                getSound().ultraStart();
                vibrate(18, settingsRef.current.vibration);
            }
            if (ultraActiveRef.current) {
                setUltraCharge(Math.min(1, Math.max(0, (elapsed - ULTRA_VISUAL_DELAY_MS) /
                    (ULTRA_TAP_MIN_HOLD_MS - ULTRA_VISUAL_DELAY_MS))));
                setUltraPreview(elapsed >= ULTRA_TAP_MIN_HOLD_MS
                    ? calculateUltraTapCoins(elapsed, ultraDeadlineRef.current, ultraTwoSecondRewardRef.current)
                    : 0);
                getSound().ultraPulse(elapsed / ultraDeadlineRef.current);
            }
            if (ultraAllowedRef.current &&
                isUltraTapOverheated(elapsed, ultraDeadlineRef.current) &&
                !overheatTriggeredRef.current) {
                overheatTriggeredRef.current = true;
                triggerBite(true);
            }
        }, 120);
    }, [getSound, hatEquipped, hatLevel, triggerBite]);
    const finishHold = useCallback((cancelled = false) => {
        if (!holdingRef.current || overheatTriggeredRef.current)
            return;
        const elapsed = performance.now() - holdStartRef.current;
        const point = holdPointRef.current;
        if (cancelled) {
            stopHoldVisual("cancel");
            return;
        }
        if (!ultraAllowedRef.current) {
            stopHoldVisual("cancel");
            registerTap(point.x, point.y);
            return;
        }
        if (isUltraTapOverheated(elapsed, ultraDeadlineRef.current)) {
            overheatTriggeredRef.current = true;
            triggerBite(true);
            return;
        }
        if (elapsed < ULTRA_TAP_MIN_HOLD_MS) {
            stopHoldVisual("cancel");
            if (elapsed >= ULTRA_VISUAL_DELAY_MS) {
                if (settingsRef.current.yellow) {
                    resetSeries();
                    transitionTo("calm");
                }
                else {
                    const nextFatigueUntil = Date.now() + chooseFatigueDuration(difficultyRef.current) * cosmeticFatigueMultiplier(cosmeticRef.current, cosmeticLevelsRef.current.bandana);
                    fatigueUntilRef.current = nextFatigueUntil;
                    setFatigueUntil(nextFatigueUntil);
                    setRiskFatigueUntil(nextFatigueUntil);
                    setClock(Date.now());
                    resetSeries();
                    beginRecovery("ultra");
                    vibrate([26, 24, 42], settingsRef.current.vibration);
                }
                return;
            }
            registerTap(point.x, point.y);
            return;
        }
        if (ultraDoomedRef.current) {
            overheatTriggeredRef.current = true;
            triggerBite(true);
            return;
        }
        const baseReward = calculateUltraTapCoins(elapsed, ultraDeadlineRef.current, ultraTwoSecondRewardRef.current);
        stopHoldVisual("success");
        awardCoins(baseReward, 1000);
        if (settingsRef.current.yellow) {
            resetSeries();
            clearRoundTimers();
            transitionTo("calm");
            vibrate([35, 35, 70, 35, 110], settingsRef.current.vibration);
            return;
        }
        const nextFatigueUntil = Date.now() + chooseFatigueDuration(difficultyRef.current) * cosmeticFatigueMultiplier(cosmeticRef.current, cosmeticLevelsRef.current.bandana);
        fatigueUntilRef.current = nextFatigueUntil;
        setFatigueUntil(nextFatigueUntil);
        setClock(Date.now());
        resetSeries();
        clearRoundTimers();
        setRecoveryReason("ultra");
        transitionTo("recovering");
        vibrate([35, 35, 70, 35, 110], settingsRef.current.vibration);
        recoveryTimerRef.current = setTimeout(finishRecovery, 3200);
    }, [
        clearRoundTimers,
        awardCoins,
        beginRecovery,
        finishRecovery,
        registerTap,
        resetSeries,
        stopHoldVisual,
        transitionTo,
        triggerBite,
    ]);
    const showRiskNotice = useCallback((message: string) => {
        setRiskMessage(message);
        setRiskShake((current) => current + 1);
        if (riskMessageTimerRef.current)
            clearTimeout(riskMessageTimerRef.current);
        riskMessageTimerRef.current = setTimeout(() => setRiskMessage(""), 1350);
    }, []);
    const startRiskSpin = useCallback(() => {
        if (riskPhaseRef.current !== "selecting" || riskCommittedRef.current)
            return;
        const tiredNow = !settingsRef.current.yellow &&
            (dogStateRef.current === "tired" || fatigueUntilRef.current > Date.now());
        if (tiredNow) {
            showRiskNotice("Сиба устала");
            vibrate([12, 26, 12], settingsRef.current.vibration);
            return;
        }
        const availableCoins = coinsRef.current.walletCoins;
        const bet = mohawkEquipped
            ? Math.min(availableCoins, Math.max(1, Math.floor(riskBetAmount)))
            : availableCoins;
        if (bet < 1) {
            showRiskNotice("Нет монет для ставки");
            vibrate(16, settingsRef.current.vibration);
            return;
        }
        riskCommittedRef.current = true;
        clearRoundTimers();
        resetSeries();
        const outcome = createRiskOutcome(riskChance, bet, Math.random, difficultyRef.current);
        const payout = outcome.won
            ? Math.round(bet * riskMultiplier(riskChance) *
                (mohawkEquipped ? MOHAWK_RISK_BONUS + (mohawkLevel - 1) * .02 : 1))
            : 0;
        const spinDuration = RISK_SPIN_MS;
        setRiskBetAmount(bet);
        setRiskPayout(0);
        setRiskResult(null);
        const winningDegrees = riskChance * 3.6;
        setRiskRotation(1800 + outcome.finalAngle - winningDegrees / 2);
        setRiskSpinNonce((current) => current + 1);
        setRiskMessage("");
        updateCoins((current) => ({
            walletCoins: Math.max(0, current.walletCoins - bet),
            streakCoins: Math.max(0, current.streakCoins - bet),
        }));
        setRiskStats((current) => ({
            ...current,
            spins: current.spins + 1,
            lastBet: bet,
        }));
        transitionRisk("transition");
        getSound().riskSpin();
        vibrate([18, 22, 28], settingsRef.current.vibration);
        riskTransitionTimerRef.current = setTimeout(() => {
            transitionRisk("spinning");
            let tickIndex = 0;
            const scheduleTick = () => {
                if (riskPhaseRef.current !== "spinning")
                    return;
                getSound().riskTick(tickIndex > 17);
                if (tickIndex % 4 === 0)
                    vibrate(3, settingsRef.current.vibration);
                const nextDelay = Math.min(470, 64 + tickIndex * 15);
                tickIndex += 1;
                riskTickTimerRef.current = setTimeout(scheduleTick, nextDelay);
            };
            scheduleTick();
            riskSlowTimerRef.current = setTimeout(() => getSound().riskSlow(), 3450);
            riskSpinTimerRef.current = setTimeout(() => {
                if (riskTickTimerRef.current) {
                    clearInterval(riskTickTimerRef.current);
                    riskTickTimerRef.current = null;
                }
                const mathematicallyWon = outcome.won;
                setRiskResult(mathematicallyWon ? "win" : "lose");
                setRiskPayout(mathematicallyWon ? payout : 0);
                transitionRisk("result");
                setRiskStats((current) => ({
                    ...current,
                    wins: current.wins + (mathematicallyWon ? 1 : 0),
                    losses: current.losses + (mathematicallyWon ? 0 : 1),
                }));
                if (mathematicallyWon) {
                    updateCoins((current) => ({
                        ...current,
                        walletCoins: current.walletCoins + payout,
                    }));
                    getSound().riskWin();
                    vibrate([25, 28, 54, 30, 80], settingsRef.current.vibration);
                }
                else {
                    getSound().riskLose();
                    vibrate([42, 38, 24], settingsRef.current.vibration);
                }
                riskReturnTimerRef.current = setTimeout(() => {
                    if (settingsRef.current.yellow) {
                        fatigueUntilRef.current = 0;
                        setFatigueUntil(0);
                        setRiskFatigueUntil(0);
                        transitionTo("calm");
                    }
                    else {
                        const tiredUntil = Date.now() + chooseFatigueDuration(difficultyRef.current) * cosmeticFatigueMultiplier(cosmeticRef.current, cosmeticLevelsRef.current.bandana);
                        fatigueUntilRef.current = tiredUntil;
                        setFatigueUntil(tiredUntil);
                        setRiskFatigueUntil(tiredUntil);
                        setClock(Date.now());
                        setRecoveryReason("rest");
                        transitionTo("tired");
                    }
                    transitionRisk("transition");
                    riskTransitionTimerRef.current = setTimeout(() => {
                        transitionRisk("normal");
                        setRiskRotation(0);
                        setRiskResult(null);
                        setRiskPayout(0);
                        riskCommittedRef.current = false;
                    }, 340);
                }, RISK_RESULT_MS);
            }, spinDuration);
        }, 360);
    }, [
        clearRoundTimers,
        getSound,
        mohawkEquipped,
        mohawkLevel,
        resetSeries,
        riskBetAmount,
        riskChance,
        showRiskNotice,
        transitionRisk,
        transitionTo,
        updateCoins,
    ]);
    const handlePointerDown = useCallback((event: PointerEvent<HTMLButtonElement>) => {
        if (event.button !== 0)
            return;
        event.preventDefault();
        if (riskPhaseRef.current === "selecting") {
            startRiskSpin();
            return;
        }
        if (riskPhaseRef.current !== "normal")
            return;
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.setPointerCapture(event.pointerId);
        startHold(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100);
    }, [startHold, startRiskSpin]);
    const handlePointerUp = useCallback((event: PointerEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        finishHold(false);
    }, [finishHold]);
    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
        if ((event.key !== "Enter" && event.key !== " ") ||
            event.repeat) {
            return;
        }
        event.preventDefault();
        if (riskPhaseRef.current === "selecting") {
            startRiskSpin();
            return;
        }
        if (riskPhaseRef.current !== "normal")
            return;
        startHold(50, 50);
    }, [startHold, startRiskSpin]);
    const handleKeyUp = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key !== "Enter" && event.key !== " ")
            return;
        event.preventDefault();
        finishHold(false);
    }, [finishHold]);
    const saveAllToVault = useCallback(() => {
        const activeCoins = coinsRef.current.walletCoins;
        if (dogStateRef.current !== "calm" ||
            holdingRef.current ||
            activeCoins < 2) {
            return;
        }
        const protectedCoins = Math.floor(activeCoins / 2);
        setSaveFlight({ id: Date.now(), amount: protectedCoins });
        if (saveFlightTimerRef.current)
            clearTimeout(saveFlightTimerRef.current);
        saveFlightTimerRef.current = setTimeout(() => {
            saveFlightTimerRef.current = null;
            setSaveFlight(null);
        }, 2000);
        updateCoins((current) => ({ ...current, walletCoins: 0 }));
        vaultCoinsRef.current += protectedCoins;
        setVaultCoins(vaultCoinsRef.current);
        clearRoundTimers();
        resetSeries();
        if (settingsRef.current.yellow) {
            fatigueUntilRef.current = 0;
            setFatigueUntil(0);
            setRiskFatigueUntil(0);
            transitionTo("calm");
        }
        else {
            const tiredUntil = Date.now() + chooseFatigueDuration(difficultyRef.current) * cosmeticFatigueMultiplier(cosmeticRef.current, cosmeticLevelsRef.current.bandana);
            fatigueUntilRef.current = tiredUntil;
            setFatigueUntil(tiredUntil);
            setRiskFatigueUntil(tiredUntil);
            setClock(Date.now());
            setRecoveryReason("rest");
            transitionTo("tired");
        }
        getSound().safe();
        vibrate([20, 28, 44], settingsRef.current.vibration);
    }, [clearRoundTimers, getSound, resetSeries, transitionTo, updateCoins]);
    const activateDrink = useCallback(() => {
        if (shelfStockRef.current.zhivchik < 1 || riskPhaseRef.current !== "normal")
            return;
        shelfStockRef.current.zhivchik--;
        setDrinkCount((current) => Math.max(0, current - 1));
        const nextBoostUntil = Math.max(Date.now(), boostUntilRef.current) + ZHIVCHIK_DURATION_MS;
        boostUntilRef.current = nextBoostUntil;
        setBoostUntil(nextBoostUntil);
        getSound().itemUse("drink");
        vibrate([16, 20, 34], settingsRef.current.vibration);
    }, [getSound]);
    const activatePitbull = useCallback(() => {
        if (shelfStockRef.current.pitbull < 1 ||
            riskPhaseRef.current !== "normal" ||
            (!settingsRef.current.yellow && fatigueUntilRef.current > Date.now()) ||
            dogStateRef.current !== "calm")
            return;
        if (coinsRef.current.walletCoins < 1) {
            showRiskNotice("Сначала заработай монеты");
            return;
        }
        shelfStockRef.current.pitbull--;
        setPitbullCount(shelfStockRef.current.pitbull);
        setShopOpen(false);
        setRunnerOpen(false);
        setSettingsOpen(false);
        riskCommittedRef.current = false;
        setRiskBetAmount(coinsRef.current.walletCoins);
        setRiskResult(null);
        setRiskPayout(0);
        setRiskRotation(0);
        transitionRisk("selecting");
        getSound().riskEnter();
        vibrate([16, 24, 34], settingsRef.current.vibration);
    }, [getSound, showRiskNotice, transitionRisk]);
    const activateVitaPower = useCallback(() => {
        if (vitaPowerShieldRef.current || shelfStockRef.current.pepsi < 1 || riskPhaseRef.current !== "normal")
            return false;
        shelfStockRef.current.pepsi--;
        vitaPowerShieldRef.current = true;
        setVitaPowerCount((current) => Math.max(0, current - 1));
        setVitaPowerShield(true);
        getSound().itemUse("drink");
        vibrate([20, 24, 48, 20], settingsRef.current.vibration);
        return true;
    }, [getSound]);
    const consumeAdventureHeal = useCallback(() => {
        if (shelfStockRef.current.heal < 1) return false;
        shelfStockRef.current.heal--;
        setHealCount(shelfStockRef.current.heal);
        vibrate(24, settingsRef.current.vibration);
        return true;
    }, []);
    const collectAdventureBuff = useCallback((kind: AdventureLootBuff) => {
        if (shelfStockRef.current[kind] >= BUFF_STOCK_LIMIT) return false;
        const count = ++shelfStockRef.current[kind];
        if (kind === "food") setFoodCount(count);
        else if (kind === "zhivchik") setDrinkCount(count);
        else if (kind === "heal") setHealCount(count);
        else setVitaPowerCount(count);
        return true;
    }, []);
    const consumeActiveShield = useCallback(() => {
        if (!vitaPowerShieldRef.current) return;
        vitaPowerShieldRef.current = false; setVitaPowerShield(false);
    }, []);
    const openDrinkGame = useCallback((kind: DrinkGameKind) => {
        if (drinkLedgerRef.current || miniGame !== null || riskPhaseRef.current !== "normal" || holding || tutorialOpen)
            return;
        if (drinkInventoryRef.current[kind] < 1) return;
        resetSeries();
        setShopOpen(false);
        setSettingsOpen(false);
        setRunnerOpen(false);
        drinkLedgerRef.current = { kind, phase: "ready" };
        setDrinkSession(current => current + 1);
        setDrinkGame(kind);
        getSound().itemUse("drink");
    }, [getSound, holding, miniGame, resetSeries, tutorialOpen]);
    const startDrinkGame = useCallback(() => {
        const ledger = drinkLedgerRef.current;
        if (!ledger || !commitDrinkRound(ledger, drinkInventoryRef.current[ledger.kind]))
            return false;
        const nextCount = --drinkInventoryRef.current[ledger.kind];
        shelfStockRef.current[ledger.kind] = nextCount;
        if (ledger.kind === "lime")
            setLimeCount(nextCount);
        else if (ledger.kind === "matcha")
            setMatchaCount(nextCount);
        else {
            const kind = ledger.kind;
            setBrainrotInventory(current => ({ ...current, [kind]: nextCount }));
            setBrainrotStats(current => ({ ...current, [kind]: { ...current[kind], plays: current[kind].plays + 1 } }));
        }
        setDrinkGameStats(current => ({ ...current,
            limePlays: current.limePlays + (ledger.kind === "lime" ? 1 : 0),
            matchaPlays: current.matchaPlays + (ledger.kind === "matcha" ? 1 : 0),
        }));
        return true;
    }, []);
    const resolveDrinkGame = useCallback((kind: DrinkGameKind, requestedReward: number, requestedScore: number) => {
        const ledger = drinkLedgerRef.current;
        if (!ledger)
            return;
        const baseReward = settleDrinkRound(ledger, kind, requestedReward);
        const payout = baseReward;
        if (payout === null)
            return;
        const score = Number.isFinite(requestedScore) ? Math.max(0, Math.floor(requestedScore)) : 0;
        if (isBrainrotKind(kind)) setBrainrotStats(current => ({ ...current, [kind]: { ...current[kind], best: Math.max(current[kind].best, Math.min(1000, score)) } }));
        setDrinkGameStats(current => ({ ...current,
            limeBest: kind === "lime" ? Math.max(current.limeBest, Math.min(LIME_MAX_SCORE, score)) : current.limeBest,
            matchaBest: kind === "matcha" ? Math.max(current.matchaBest, Math.min(MEMORY_ROUNDS, score)) : current.matchaBest,
        }));
        if (payout > 0) {
            updateCoins(current => ({ ...current, walletCoins: current.walletCoins + payout }));
            setBalancePulse(current => current + 1);
            getSound().riskWin();
        }
    }, [getSound, updateCoins]);
    const closeDrinkGame = useCallback(() => {
        drinkLedgerRef.current = null;
        setDrinkGame(null);
    }, []);
    const openMiniGame = useCallback((kind: MiniGameKind) => {
        const itemCount = kind === "slots" ? colaCount : teaCount;
        if (itemCount < 1 ||
            miniGame !== null ||
            riskPhaseRef.current !== "normal" ||
            (!settingsRef.current.yellow && fatigueUntilRef.current > Date.now()) ||
            dogStateRef.current !== "calm")
            return;
        if (coinsRef.current.walletCoins < 1) {
            showRiskNotice("Сначала заработай монеты");
            return;
        }
        setShopOpen(false);
        setRunnerOpen(false);
        setSettingsOpen(false);
        setMiniGameSession((current) => current + 1);
        setMiniGame(kind);
        getSound().itemUse("drink");
        vibrate([16, 24, 34], settingsRef.current.vibration);
    }, [colaCount, getSound, miniGame, showRiskNotice, teaCount]);
    const commitMiniGameBet = useCallback((kind: MiniGameKind, requestedBet: number) => {
        const availableCoins = coinsRef.current.walletCoins;
        const bet = resolveMiniGameBet(availableCoins, requestedBet, mohawkEquipped);
        const itemKind = kind === "slots" ? "cocoa" : "bergamot";
        const hasItem = shelfStockRef.current[itemKind] > 0;
        if (!hasItem || bet < 1 || bet > availableCoins)
            return false;
        shelfStockRef.current[itemKind]--;
        if (kind === "slots")
            setColaCount((current) => Math.max(0, current - 1));
        else
            setTeaCount((current) => Math.max(0, current - 1));
        updateCoins((current) => ({
            walletCoins: Math.max(0, current.walletCoins - bet),
            streakCoins: Math.max(0, current.streakCoins - bet),
        }));
        setMiniGameStats((current) => ({
            ...current,
            slotPlays: current.slotPlays + (kind === "slots" ? 1 : 0),
            minePlays: current.minePlays + (kind === "mines" ? 1 : 0),
        }));
        resetSeries();
        return true;
    }, [mohawkEquipped, resetSeries, updateCoins]);
    const resolveMiniGame = useCallback((kind: MiniGameKind, payout: number, won: boolean) => {
        if (payout > 0) {
            updateCoins((current) => ({
                ...current,
                walletCoins: current.walletCoins + payout,
            }));
            setBalancePulse((current) => current + 1);
        }
        setMiniGameStats((current) => ({
            ...current,
            slotWins: current.slotWins + (kind === "slots" && won ? 1 : 0),
            mineWins: current.mineWins + (kind === "mines" && won ? 1 : 0),
            mineLosses: current.mineLosses + (kind === "mines" && !won ? 1 : 0),
        }));
        if (kind === "mines" && won) {
            getSound().riskWin();
            vibrate([24, 28, 48, 28, 72], settingsRef.current.vibration);
        }
        else if (kind === "mines") {
            getSound().riskLose();
            vibrate([40, 32, 22], settingsRef.current.vibration);
        }
        if (!settingsRef.current.yellow) {
            const tiredUntil = Date.now() + chooseFatigueDuration(difficultyRef.current) * cosmeticFatigueMultiplier(cosmeticRef.current, cosmeticLevelsRef.current.bandana);
            fatigueUntilRef.current = tiredUntil;
            setFatigueUntil(tiredUntil);
            setRiskFatigueUntil(tiredUntil);
            setClock(Date.now());
            setRecoveryReason("rest");
            resetSeries();
            transitionTo("tired");
        }
    }, [getSound, resetSeries, transitionTo, updateCoins]);
    const submitCheatCode = useCallback(() => {
        const normalizedCode = cheatCode.trim().toLowerCase();
        const [secretWord, amountToken, ...extraTokens] = normalizedCode.split(/\s+/);
        if (ADMIN_COMMANDS.has(secretWord)) {
            if (!account.isAdmin) { setCheatMessage("Этот код доступен администратору"); return; }
            const finish = (message: string) => { setCheatCode(""); setCheatMessage(message); getSound().safe(); };
            const rest = () => {
                clearRoundTimers(); stopHoldVisual("cancel"); resetSeries();
                fatigueUntilRef.current = 0; setFatigueUntil(0); setRiskFatigueUntil(0);
                setRecoveryReason("rest"); transitionTo("calm");
            };
            if (secretWord === "gocoins" || secretWord === "gosafe") {
                const amount = amountToken === undefined ? 10000 : Number(amountToken);
                if (extraTokens.length || (amountToken !== undefined && !/^\d+$/.test(amountToken)) || !Number.isSafeInteger(amount) || amount < 1) {
                    setCheatMessage("После кода укажи положительную целую сумму"); return;
                }
                const grant = Math.min(amount, MAX_CHEAT_COIN_GRANT);
                if (secretWord === "gocoins") updateCoins(current => ({ ...current, walletCoins: Math.min(Number.MAX_SAFE_INTEGER, current.walletCoins + grant) }));
                else { vaultCoinsRef.current = Math.min(Number.MAX_SAFE_INTEGER, vaultCoinsRef.current + grant); setVaultCoins(vaultCoinsRef.current); }
                finish(`+${grant.toLocaleString("ru-RU")} ${secretWord === "gosafe" ? "монет в сейфе" : "активных монет"}`);
                return;
            }
            if (amountToken !== undefined) { setCheatMessage("Этот код вводится без суммы"); return; }
            const collectionItem = COLLECTION_CHEATS.find(item => item.code.toLowerCase() === secretWord);
            if (collectionItem) {
                const stock = shelfStockRef.current;
                const snapshot = { ...currentSave, ownedCosmetics: cosmeticOwnedRef.current, ownedThemes: themesOwnedRef.current, brainrotInventory: { tralalero: stock.tralalero, ballerina: stock.ballerina, bombardiro: stock.bombardiro, verity: stock.verity } };
                for (const [kind, field] of Object.entries(BUFF_SAVE_FIELDS)) snapshot[field] = stock[kind as keyof typeof stock];
                const gift = grantCollectionCheat(secretWord, account.isAdmin, snapshot);
                if (!gift) return;
                if (gift.ownedThemes) { themesOwnedRef.current = gift.ownedThemes; setOwnedThemes(gift.ownedThemes); }
                if (gift.ownedCosmetics) { cosmeticOwnedRef.current = gift.ownedCosmetics; setOwnedCosmetics(gift.ownedCosmetics); }
                if (gift.hatOwned) setHatOwned(true);
                if (gift.mohawkOwned) setMohawkOwned(true);
                if (gift.commonCases !== undefined) setCommonCases(current => Math.min(99, current + 1));
                if (gift.bigCases !== undefined) setBigCases(current => Math.min(99, current + 1));
                if (gift.hatUpgradeTokens !== undefined) setHatUpgradeTokens(current => Math.min(99, current + 1));
                if (gift.mohawkUpgradeTokens !== undefined) setMohawkUpgradeTokens(current => Math.min(99, current + 1));
                if (collectionItem.type === "buff") {
                    const kind = collectionItem.kind;
                    const next = Math.min(BUFF_STOCK_LIMIT, stock[kind] + 1);
                    stock[kind] = next;
                    if (kind === "food") setFoodCount(next);
                    else if (kind === "heal") setHealCount(next);
                    else if (kind === "zhivchik") setDrinkCount(next);
                    else if (kind === "pitbull") setPitbullCount(next);
                    else if (kind === "cocoa") setColaCount(next);
                    else if (kind === "bergamot") setTeaCount(next);
                    else if (kind === "pepsi") setVitaPowerCount(next);
                    else {
                        drinkInventoryRef.current[kind] = next;
                        if (kind === "lime") setLimeCount(next);
                        else if (kind === "matcha") setMatchaCount(next);
                        else setBrainrotInventory(current => ({ ...current, [kind]: next }));
                    }
                }
                finish(`${collectionItem.label}: получено`);
                return;
            }
            if (secretWord === "god") {
                const enabled = !settingsRef.current.suliman;
                setSettings(current => ({ ...current, suliman: enabled }));
                if (enabled) rest();
                finish(enabled ? "Бессмертие включено" : "Бессмертие выключено");
            } else if (secretWord === "gomagnet" || secretWord === "goturbo") {
                const key = secretWord === "gomagnet" ? "magnet" : "turbo";
                const enabled = !runnerCheats[key];
                setRunnerCheats(current => ({ ...current, [key]: enabled }));
                finish(`${key === "magnet" ? "Магнит" : "Турбо"} ${enabled ? "включён" : "выключен"}`);
            } else if (secretWord === "goboost") {
                boostUntilRef.current = Math.max(Date.now(), boostUntilRef.current) + ZHIVCHIK_DURATION_MS;
                setBoostUntil(boostUntilRef.current); setClock(Date.now());
                finish("Живчик активирован ещё на минуту");
            } else if (secretWord === "goloot") {
                setCommonCases(current => Math.min(99, current + 5)); setBigCases(current => Math.min(99, current + 2));
                setFoodCount(INVENTORY_LIMIT); setDrinkCount(INVENTORY_LIMIT); setPitbullCount(INVENTORY_LIMIT);
                setColaCount(INVENTORY_LIMIT); setTeaCount(INVENTORY_LIMIT); setVitaPowerCount(INVENTORY_LIMIT);
                setLimeCount(INVENTORY_LIMIT); setMatchaCount(INVENTORY_LIMIT);
                const premiumStock = { tralalero: INVENTORY_LIMIT, ballerina: INVENTORY_LIMIT, bombardiro: INVENTORY_LIMIT, verity: INVENTORY_LIMIT };
                setBrainrotInventory(premiumStock);
                drinkInventoryRef.current = { lime: INVENTORY_LIMIT, matcha: INVENTORY_LIMIT, ...premiumStock };
                finish("Добавлены 7 кейсов. Напитки и корм заполнены");
            } else if (secretWord === "godress") {
                setHatOwned(true); setMohawkOwned(true);
                setHatUpgradeTokens(current => Math.min(99, current + 5)); setMohawkUpgradeTokens(current => Math.min(99, current + 5));
                cosmeticOwnedRef.current = ["bandana", "charm"]; setOwnedCosmetics(cosmeticOwnedRef.current);
                themesOwnedRef.current = Object.keys(THEMES) as ThemeId[]; setOwnedThemes(themesOwnedRef.current);
                finish("Вся коллекция открыта. Добавлены улучшения");
            } else if (secretWord === "gorest") {
                rest(); finish("Кнопик отдохнул");
            } else if (secretWord === "gospark") {
                triggerLevelBurst(); finish("Пиксельный салют!"); setSettingsOpen(false);
            } else if (secretWord === "gofxoff") {
                setRunnerCheats({ magnet: false, turbo: false });
        setNeighborhood(defaultNeighborhoodProgress());
        setNeighborhoodOpen(false);
                setSettings(current => ({ ...current, suliman: false, yellow: false }));
                boostUntilRef.current = 0; setBoostUntil(0);
                finish("Дополнительные режимы выключены");
            }
            return;
        }
        if (secretWord === "medoed") {
            const hasCustomAmount = amountToken !== undefined;
            const amountIsValid = !hasCustomAmount ||
                (extraTokens.length === 0 && /^\d+$/.test(amountToken));
            const requestedAmount = hasCustomAmount ? Number(amountToken) : 500;
            if (!amountIsValid ||
                !Number.isSafeInteger(requestedAmount) ||
                requestedAmount < 1) {
                setCheatMessage("Укажи положительную целую сумму после секретного слова");
                return;
            }
            const grantedAmount = Math.min(requestedAmount, MAX_CHEAT_COIN_GRANT);
            updateCoins((current) => ({
                ...current,
                walletCoins: Math.min(Number.MAX_SAFE_INTEGER, current.walletCoins + grantedAmount),
            }));
            setCheatCode("");
            setCheatMessage(`Начислено +${grantedAmount.toLocaleString("ru-RU")} активных монет`);
            getSound().purchase();
            vibrate([16, 22, 34], settingsRef.current.vibration);
            return;
        }
        if (normalizedCode === "yellow") {
            const nextEnabled = !settingsRef.current.yellow;
            setSettings((current) => ({ ...current, yellow: nextEnabled }));
            setCheatCode("");
            setCheatMessage(nextEnabled ? "Секретный режим включён" : "Секретный режим выключен");
            if (nextEnabled) {
                clearRoundTimers();
                stopHoldVisual("cancel");
                resetSeries();
                fatigueUntilRef.current = 0;
                setFatigueUntil(0);
                setRiskFatigueUntil(0);
                setRecoveryReason("rest");
                transitionTo("calm");
            }
            getSound().safe();
            return;
        }
        if (normalizedCode === "hasbula") {
            if (hasbulaRedeemedRef.current) {
                setCheatMessage("Промокод уже был использован");
                return;
            }
            hasbulaRedeemedRef.current = true;
            updateCoins((current) => ({
                ...current,
                walletCoins: Math.min(Number.MAX_SAFE_INTEGER, current.walletCoins + 1000),
            }));
            setHasbulaRedeemed(true);
            setCheatCode("");
            setCheatMessage("Начислено +1 000 активных монет");
            getSound().purchase();
            vibrate([16, 22, 34], settingsRef.current.vibration);
            return;
        }
        if (normalizedCode !== "baobab") {
            setCheatMessage("Код не найден");
            return;
        }
        const nextEnabled = !settingsRef.current.suliman;
        setSettings((current) => ({ ...current, suliman: nextEnabled }));
        setCheatCode("");
        setCheatMessage(nextEnabled ? "Секретный режим включён" : "Секретный режим выключен");
        if (nextEnabled) {
            clearRoundTimers();
            stopHoldVisual("cancel");
            resetSeries();
            fatigueUntilRef.current = 0;
            setFatigueUntil(0);
            setRiskFatigueUntil(0);
            transitionTo("calm");
        }
        getSound().safe();
    }, [account.isAdmin, cheatCode, clearRoundTimers, currentSave, getSound, resetSeries, runnerCheats, stopHoldVisual, transitionTo, triggerLevelBurst, updateCoins]);
    const bounceHat = useCallback((event: PointerEvent<HTMLSpanElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setHatBounce((current) => current + 1);
        setHatInteractionCount((current) => current + 1);
        registerTap(50, 16);
    }, [registerTap]);
    const swingMohawk = useCallback((event: PointerEvent<HTMLSpanElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setMohawkSwing((current) => current + 1);
        setMohawkInteractionCount((current) => current + 1);
        registerTap(50, 14);
    }, [registerTap]);
    const applyCaseRewards = useCallback((rewards: CaseReward[]) => {
        const coinReward = rewards
            .filter((reward): reward is Extract<CaseReward, {
            type: "coins";
        }> => reward.type === "coins")
            .reduce((total, reward) => total + reward.amount, 0);
        if (coinReward > 0) {
            updateCoins((current) => ({
                ...current,
                walletCoins: Math.min(Number.MAX_SAFE_INTEGER, current.walletCoins + coinReward),
            }));
            setBalancePulse((current) => current + 1);
        }
        const buffAmount = (kind: string) => rewards
            .filter((reward): reward is Extract<CaseReward, {
            type: "buff";
        }> => reward.type === "buff" && reward.kind === kind)
            .reduce((total, reward) => total + reward.amount, 0);
        setFoodCount((current) => Math.min(INVENTORY_LIMIT, current + buffAmount("food")));
        setDrinkCount((current) => Math.min(INVENTORY_LIMIT, current + buffAmount("drink")));
        setPitbullCount((current) => Math.min(INVENTORY_LIMIT, current + buffAmount("pitbull")));
        setColaCount((current) => Math.min(INVENTORY_LIMIT, current + buffAmount("cola")));
        setTeaCount((current) => Math.min(INVENTORY_LIMIT, current + buffAmount("tea")));
        setVitaPowerCount((current) => Math.min(INVENTORY_LIMIT, current + buffAmount("shield")));
        const hatUpgrades = rewards.filter(reward => (reward.type === "upgrade" || reward.type === "item") && reward.kind === "hat").length;
        const mohawkUpgrades = rewards.filter(reward => (reward.type === "upgrade" || reward.type === "item") && reward.kind === "mohawk").length;
        if (hatUpgrades > 0) setHatUpgradeTokens(current => Math.min(99, current + hatUpgrades));
        if (mohawkUpgrades > 0) setMohawkUpgradeTokens(current => Math.min(99, current + mohawkUpgrades));
    }, [updateCoins]);
    const claimLevelReward = useCallback((level: number): string | null => {
        if (level > levelStateRef.current.level || level < 1 || claimedRewardsRef.current.includes(level)) return null;
        const reward = progressReward(level);
        if (reward.type === "case" && (reward.kind === "common" ? commonCases : bigCases) + reward.amount > 99) return null;
        if (reward.type === "buff") {
            const counts = { food: foodCount, drink: drinkCount, pitbull: pitbullCount, cola: colaCount, tea: teaCount, shield: vitaPowerCount };
            if (counts[reward.kind] + reward.amount > INVENTORY_LIMIT) return null;
        }
        claimedRewardsRef.current = [...claimedRewardsRef.current, level];
        setClaimedLevelRewards(claimedRewardsRef.current);
        let label = reward.label;
        if (reward.type === "case") {
            (reward.kind === "common" ? setCommonCases : setBigCases)(count => count + reward.amount);
        } else if (reward.type === "cosmetic") {
            label = `Предмет «${COSMETICS[reward.kind].name}» открыт в магазине`;
        } else if (reward.type === "item") {
            label = `${reward.kind === "hat" ? "Тюбетейка Хасбика" : "Эрокез"}: доступно в магазине`;
        } else if (reward.type === "theme") {
            // Reaching this level unlocks a purchase, never grants ownership for free.
            label = `Оформление «${THEMES[reward.kind].name}» открыто в магазине`;
        } else applyCaseRewards([reward]);
        getSound().levelUp();
        vibrate([20, 28, 45], settingsRef.current.vibration);
        return reward.type === "theme" || reward.type === "cosmetic" || reward.type === "item" ? label : label + " получено";
    }, [applyCaseRewards, commonCases, bigCases, foodCount, drinkCount, pitbullCount, colaCount, teaCount, vitaPowerCount, getSound]);
    const claimDailyReward = useCallback(async () => {
        setDailyClaimPending(true);
        try {
            const result = await onClaimDailyCase(currentSave);
            if (result.commonCases !== null) setCommonCases(result.commonCases);
            if (result.claimed) { getSound().levelUp(); vibrate([20, 28, 45], settingsRef.current.vibration); }
            return result;
        } finally { setDailyClaimPending(false); }
    }, [currentSave, onClaimDailyCase, getSound]);
    const beginCaseHold = useCallback(() => {
        if (!caseSequence || caseSequence.phase !== "ready" || caseHoldTimerRef.current)
            return;
        getSound().unlock();
        getSound().caseCharge();
        setCaseSequence((current) => current ? { ...current, phase: "charging" } : current);
        vibrate(18, settingsRef.current.vibration);
        caseHoldTimerRef.current = setTimeout(() => {
            const rewards = createCaseRewards(caseSequence.kind);
            if (caseSequence.kind === "common") {
                setCommonCases((current) => Math.max(0, current - 1));
            }
            else {
                setBigCases((current) => Math.max(0, current - 1));
            }
            applyCaseRewards(rewards);
            setCaseSequence({
                kind: caseSequence.kind,
                rewards,
                phase: "burst",
                rewardIndex: 0,
            });
            getSound().caseOpen();
            vibrate([30, 36, 70, 32, 100], settingsRef.current.vibration);
            caseBurstTimerRef.current = setTimeout(() => {
                setCaseSequence((current) => current ? { ...current, phase: "reward" } : current);
            }, 1450);
        }, CASE_HOLD_MS);
    }, [applyCaseRewards, caseSequence, getSound]);
    const cancelCaseHold = useCallback(() => {
        if (caseHoldTimerRef.current)
            clearTimeout(caseHoldTimerRef.current);
        caseHoldTimerRef.current = null;
        setCaseSequence((current) => current?.phase === "charging" ? { ...current, phase: "ready" } : current);
    }, []);
    const openCase = useCallback((kind: CaseKind) => {
        const available = kind === "common" ? commonCases : bigCases;
        if (available < 1)
            return;
        setCaseSequence({ kind, rewards: [], phase: "ready", rewardIndex: 0 });
    }, [bigCases, commonCases]);
    const buyCommonCase = useCallback(() => {
        if (vaultCoinsRef.current < COMMON_CASE_PRICE || commonCases >= 99)
            return;
        vaultCoinsRef.current -= COMMON_CASE_PRICE;
        setVaultCoins(vaultCoinsRef.current);
        setCommonCases((current) => Math.min(99, current + 1));
        getSound().purchase();
        vibrate([18, 22, 34], settingsRef.current.vibration);
    }, [commonCases, getSound]);
    const buyBigCase = useCallback(() => {
        if (vaultCoinsRef.current < BIG_CASE_PRICE || bigCases >= 99)
            return;
        vaultCoinsRef.current -= BIG_CASE_PRICE;
        setVaultCoins(vaultCoinsRef.current);
        setBigCases((current) => Math.min(99, current + 1));
        getSound().purchase();
        vibrate([18, 22, 34], settingsRef.current.vibration);
    }, [bigCases, getSound]);
    const advanceCaseReward = useCallback(() => {
        setCaseSequence((current) => {
            if (!current || current.phase !== "reward")
                return current;
            if (current.rewardIndex >= current.rewards.length - 1)
                return null;
            getSound().purchase();
            vibrate(16, settingsRef.current.vibration);
            return { ...current, rewardIndex: current.rewardIndex + 1 };
        });
    }, [getSound]);
    const upgradeClothing = useCallback((kind: "hat" | "mohawk") => {
        if (kind === "hat") {
            if (!hatOwned || hatLevel >= 5 || hatUpgradeTokens < 1)
                return;
            setHatLevel((current) => Math.min(5, current + 1));
            setHatUpgradeTokens((current) => Math.max(0, current - 1));
        }
        else {
            if (!mohawkOwned || mohawkLevel >= 5 || mohawkUpgradeTokens < 1)
                return;
            setMohawkLevel((current) => Math.min(5, current + 1));
            setMohawkUpgradeTokens((current) => Math.max(0, current - 1));
        }
        setShopMessage("Предмет улучшен");
        getSound().levelUp();
        vibrate([20, 24, 44], settingsRef.current.vibration);
    }, [getSound, hatLevel, hatOwned, hatUpgradeTokens, mohawkLevel, mohawkOwned, mohawkUpgradeTokens]);
    const selectNavigation = useCallback((index: number) => {
        if (index === 2 && riskPhaseRef.current !== "normal") return;
        if (index === 2) {
            if (holdingRef.current) stopHoldVisual("cancel");
            resetSeries();
        }
        setShopOpen(index === 0);
        setRunnerOpen(false);
        setNeighborhoodOpen(false);
        setAdventureOpen(index === 2);
        setSettingsOpen(false);
        setResetConfirmOpen(false);
    }, [resetSeries, stopHoldVisual]);
    const moveNavigationThumb = useCallback((event: PointerEvent<HTMLElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = Math.min(0.999, Math.max(0, (event.clientX - rect.left) / rect.width));
        selectNavigation(Math.floor(ratio * 3));
    }, [selectNavigation]);
    const handleNavigationDown = useCallback((event: PointerEvent<HTMLElement>) => {
        if (event.button !== 0)
            return;
        navDragStartRef.current = event.clientX;
        navDidDragRef.current = false;
        event.currentTarget.setPointerCapture(event.pointerId);
        moveNavigationThumb(event);
    }, [moveNavigationThumb]);
    const handleNavigationMove = useCallback((event: PointerEvent<HTMLElement>) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId))
            return;
        if (Math.abs(event.clientX - navDragStartRef.current) > 8) {
            navDidDragRef.current = true;
        }
        moveNavigationThumb(event);
    }, [moveNavigationThumb]);
    const clickNavigation = useCallback((index: number) => {
        if (navDidDragRef.current) {
            navDidDragRef.current = false;
            return;
        }
        getSound().nav(index - 1);
        selectNavigation(index);
    }, [getSound, selectNavigation]);
    const spendVault = useCallback((price: number) => {
        const purchase = spendBalance(coinsRef.current.walletCoins, vaultCoinsRef.current, price, "vault");
        if (!purchase)
            return false;
        vaultCoinsRef.current = purchase.vaultCoins;
        setVaultCoins(purchase.vaultCoins);
        return true;
    }, []);
    const buyOrToggleCosmetic = useCallback((kind: CosmeticId) => {
        if (!cosmeticOwnedRef.current.includes(kind)) {
            if (levelStateRef.current.level < COSMETICS[kind].unlockLevel) return;
            if (!spendVault(COSMETICS[kind].price))
                return;
            cosmeticOwnedRef.current = [...cosmeticOwnedRef.current, kind];
            setOwnedCosmetics(cosmeticOwnedRef.current);
        }
        cosmeticRef.current = cosmeticRef.current === kind ? null : kind;
        setEquippedCosmetic(cosmeticRef.current);
        setShopMessage(cosmeticRef.current ? COSMETICS[kind].name + " надет" : "Предмет снят");
        getSound().purchase();
    }, [getSound, spendVault]);
    const upgradeCosmetic = useCallback((kind:CosmeticId) => {
        const level = cosmeticLevelsRef.current[kind];
        if (!cosmeticOwnedRef.current.includes(kind) || level >= 5 || !spendVault(cosmeticUpgradePrice(level))) return;
        cosmeticLevelsRef.current = {...cosmeticLevelsRef.current,[kind]:level+1};
        setCosmeticLevels(cosmeticLevelsRef.current);
        setShopMessage(`${COSMETICS[kind].name} · LVL ${level+1}`);
        getSound().levelUp();
        vibrate([20,24,44],settingsRef.current.vibration);
    },[getSound,spendVault]);
    const buyOrSelectTheme = useCallback((kind: ThemeId) => {
        if (!themesOwnedRef.current.includes(kind)) {
            if (levelStateRef.current.level < THEMES[kind].unlockLevel) {
                setShopMessage(`Оформление откроется на LVL ${THEMES[kind].unlockLevel}`);
                return;
            }
            if (!spendVault(THEMES[kind].price))
                return;
            themesOwnedRef.current = [...themesOwnedRef.current, kind];
            setOwnedThemes(themesOwnedRef.current);
        }
        setActiveTheme(kind);
        setShopMessage("Оформление «" + THEMES[kind].name + "» выбрано");
        getSound().purchase();
    }, [getSound, spendVault]);
    const buyOrToggleHat = useCallback(() => {
        if (!hatOwned) {
            if (levelStateRef.current.level < CLOTHING_UNLOCK_LEVELS.hat) return;
            if (!spendVault(HASBIK_HAT_PRICE))
                return;
            setHatOwned(true);
            setHatEquipped(true);
            setMohawkEquipped(false);
            setShopMessage("Тюбетейка куплена и надета");
        }
        else {
            setHatEquipped((current) => {
                if (!current)
                    setMohawkEquipped(false);
                return !current;
            });
            setShopMessage(hatEquipped ? "Тюбетейка снята" : "Тюбетейка надета");
        }
        getSound().purchase();
        vibrate(22, settingsRef.current.vibration);
        if (messageTimerRef.current)
            clearTimeout(messageTimerRef.current);
        messageTimerRef.current = setTimeout(() => setShopMessage(""), 1800);
    }, [getSound, hatEquipped, hatOwned, spendVault]);
    const buyOrToggleMohawk = useCallback(() => {
        if (!mohawkOwned) {
            if (levelStateRef.current.level < CLOTHING_UNLOCK_LEVELS.mohawk) return;
            if (!spendVault(MOHAWK_PRICE))
                return;
            setMohawkOwned(true);
            setMohawkEquipped(true);
            setHatEquipped(false);
            setShopMessage("Эрокез куплен и надет");
        }
        else {
            setMohawkEquipped((current) => {
                if (!current)
                    setHatEquipped(false);
                return !current;
            });
            setShopMessage(mohawkEquipped ? "Эрокез снят" : "Эрокез надет");
        }
        getSound().purchase();
        vibrate(22, settingsRef.current.vibration);
        if (messageTimerRef.current)
            clearTimeout(messageTimerRef.current);
        messageTimerRef.current = setTimeout(() => setShopMessage(""), 1800);
    }, [getSound, mohawkEquipped, mohawkOwned, spendVault]);
    const feedDog = useCallback(() => {
        const tiredNow = dogStateRef.current === "tired" ||
            (dogStateRef.current === "recovering" &&
                fatigueUntilRef.current > Date.now());
        if (!tiredNow || shelfStockRef.current.food < 1)
            return;
        shelfStockRef.current.food--;
        clearRoundTimers();
        setFoodCount((current) => Math.max(0, current - 1));
        fatigueUntilRef.current = 0;
        setFatigueUntil(0);
        setRiskFatigueUntil(0);
        setClock(Date.now());
        setRecoveryReason("rest");
        resetSeries();
        transitionTo("calm");
        setShopMessage("Кнопик поел и снова спокоен");
        getSound().itemUse("food");
        vibrate([18, 24, 38], settingsRef.current.vibration);
        if (messageTimerRef.current)
            clearTimeout(messageTimerRef.current);
        messageTimerRef.current = setTimeout(() => setShopMessage(""), 1800);
    }, [clearRoundTimers, getSound, resetSeries, transitionTo]);
    const buyShelfBuff = useCallback((kind: PotionKind) => {
        if (riskPhaseRef.current !== "normal" || miniGame !== null || drinkGame !== null || holdingRef.current || tutorialOpen) return;
        const stock = shelfStockRef.current[kind];
        if (stock >= BUFF_STOCK_LIMIT) { showRiskNotice("В запасе уже 25 штук"); return; }
        const purchase = purchaseShelfBuff(kind, stock, coinsRef.current.walletCoins, vaultCoinsRef.current);
        if (!purchase) { showRiskNotice(`Нужно ${BUFF_CATALOG[kind].price.toLocaleString("ru-RU")} активных KC`); return; }
        shelfStockRef.current[kind] = purchase.count;
        updateCoins(current => ({ ...current, walletCoins: purchase.walletCoins }));
        if (kind === "food") setFoodCount(purchase.count);
        else if (kind === "heal") setHealCount(purchase.count);
        else if (kind === "zhivchik") setDrinkCount(purchase.count);
        else if (kind === "pitbull") setPitbullCount(purchase.count);
        else if (kind === "cocoa") setColaCount(purchase.count);
        else if (kind === "bergamot") setTeaCount(purchase.count);
        else if (kind === "pepsi") setVitaPowerCount(purchase.count);
        else {
            drinkInventoryRef.current[kind] = purchase.count;
            if (kind === "lime") setLimeCount(purchase.count);
            else if (kind === "matcha") setMatchaCount(purchase.count);
            else setBrainrotInventory(current => ({ ...current, [kind]: purchase.count }));
        }
        getSound().purchase();
        vibrate(16, settingsRef.current.vibration);
    }, [drinkGame, getSound, miniGame, showRiskNotice, tutorialOpen, updateCoins]);
    const finishTutorial = useCallback(() => {
        setTutorialSeen(true);
        setTutorialOpen(false);
        setTutorialStep(0);
    }, []);
    const resetProgress = useCallback(() => {
        clearRoundTimers();
        stopHoldVisual("cancel");
        const defaults = createDefaultSave();
        const resetCoins = { walletCoins: 0, streakCoins: 0 };
        const resetStats = { bestStreak: 0, totalTaps: 0, totalBites: 0 };
        const resetLevel = {
            level: 0,
            progressCoins: 0,
            lifetimeCoins: 0,
        };
        coinsRef.current = resetCoins;
        settingsRef.current = defaults.settings;
        statsRef.current = resetStats;
        levelStateRef.current = resetLevel;
        bonusCarryRef.current = 0;
        fatigueUntilRef.current = 0;
        setCoins(resetCoins);
        setVaultCoins(0);
        vaultCoinsRef.current = 0;
        setOwnedCosmetics([]);
        cosmeticLevelsRef.current = {bandana:1,charm:1};
        setCosmeticLevels(cosmeticLevelsRef.current);
        cosmeticOwnedRef.current = [];
        setEquippedCosmetic(null);
        cosmeticRef.current = null;
        setOwnedThemes(["classic"]);
        themesOwnedRef.current = ["classic"];
        setActiveTheme("classic");
        setFoodCount(0);
        setStoryCompletedLevel(0);
        setStoryWeaponTier(0);
        setHealCount(0);
        setDrinkCount(0);
        setPitbullCount(0);
        setColaCount(0);
        setTeaCount(0);
        setLimeCount(0);
        setMatchaCount(0);
        setBrainrotInventory(createBrainrotInventory());
        setBrainrotStats(createBrainrotStats());
        drinkInventoryRef.current = { lime: 0, matcha: 0, ...createBrainrotInventory() };
        drinkLedgerRef.current = null;
        setDrinkGame(null);
        setDrinkGameStats({ limePlays: 0, matchaPlays: 0, limeBest: 0, matchaBest: 0 });
        setRunnerStats({ runnerBest: 0, runnerRuns: 0, runnerCoins: 0 });
        setRunnerCheats({ magnet: false, turbo: false });
        setVitaPowerCount(0);
        setVitaPowerShield(false);
        vitaPowerShieldRef.current = false;
        setShieldBreakVisible(false);
        boostUntilRef.current = 0;
        setBoostUntil(0);
        setHatOwned(false);
        setHatEquipped(false);
        setMohawkOwned(false);
        setMohawkEquipped(false);
        setHatLevel(1);
        setMohawkLevel(1);
        setHatUpgradeTokens(0);
        setMohawkUpgradeTokens(0);
        setCommonCases(0);
        setBigCases(0);
        setQuestIndex(0);
        setEarInteractionCount(0);
        setHatInteractionCount(0);
        setMohawkInteractionCount(0);
        setRunnerOpen(false);
        setCaseSequence(null);
        setHasbulaRedeemed(false);
        hasbulaRedeemedRef.current = false;
        setRiskFatigueUntil(0);
        setRiskChance(50);
        setRiskBetAmount(0);
        setRiskRotation(0);
        setRiskResult(null);
        setRiskPayout(0);
        setRiskMessage("");
        setRiskStats({ spins: 0, wins: 0, losses: 0, lastBet: 0 });
        setMiniGame(null);
        setMiniGameStats({ slotPlays: 0, slotWins: 0, minePlays: 0, mineWins: 0, mineLosses: 0 });
        riskCommittedRef.current = false;
        transitionRisk("normal");
        setStats(resetStats);
        setLevelState(resetLevel);
        setClaimedLevelRewards([]);
        claimedRewardsRef.current = [];
        setProgressOpen(false);
        setSettings(defaults.settings);
        setFatigueUntil(0);
        setTutorialSeen(false);
        setTutorialStep(0);
        setTutorialOpen(false);
        setStoryCheckpoint(0);
        setApartmentBarOpen(false);
        setAdventureOpen(true);
        setShopOpen(false);
        setSettingsOpen(false);
        setResetConfirmOpen(false);
        setRecoveryReason("rest");
        setLevelBurstVisible(false);
        setShopMessage("");
        setCheatCode("");
        setCheatMessage("");
        resetSeries();
        transitionTo("calm");
        localStorage.removeItem(SAVE_KEY);
    }, [
        clearRoundTimers,
        resetSeries,
        stopHoldVisual,
        transitionRisk,
        transitionTo,
    ]);
    // A normal tap briefly sets `holding`; it must not toggle the vault button.
    const vaultLocked = runnerOpen || dogState !== "calm" || riskPhase !== "normal" || miniGame !== null || drinkGame !== null;
    const isDogTired = !settings.yellow &&
        (dogState === "tired" ||
            (dogState === "recovering" && fatigueUntil > clock));
    const isDogResting = !settings.yellow && fatigueUntil > clock;
    const canFeedDog = isDogTired && foodCount > 0;
    const canSave = !vaultLocked && coins.walletCoins >= 2;
    const saveAmount = Math.floor(coins.walletCoins / 2);
    const hatLocked = !hatOwned && levelState.level < CLOTHING_UNLOCK_LEVELS.hat;
    const mohawkLocked = !mohawkOwned && levelState.level < CLOTHING_UNLOCK_LEVELS.mohawk;
    const canBuyHat = hatOwned || (!hatLocked && vaultCoins >= HASBIK_HAT_PRICE);
    const canBuyMohawk = mohawkOwned || (!mohawkLocked && vaultCoins >= MOHAWK_PRICE);
    const boostSeconds = Math.max(0, Math.ceil((boostUntil - clock) / 1000));
    const selectedRiskMultiplier = Math.round(riskMultiplier(riskChance) * (mohawkEquipped ? MOHAWK_RISK_BONUS + (mohawkLevel - 1) * .02 : 1) * 100) / 100;
    const riskMode = riskPhase !== "normal";
    const canBuyShelfBuff = (kind: PotionKind, count: number) => count < BUFF_STOCK_LIMIT && coins.walletCoins >= BUFF_CATALOG[kind].price && !holding && !tutorialOpen && !riskMode && miniGame === null && drinkGame === null;
    const navIndex = shopOpen ? 0 : runnerOpen || adventureOpen || neighborhoodOpen ? 2 : 1;
    const pendingLevelRewards = Math.max(0, levelState.level - claimedLevelRewards.filter(level => level <= levelState.level).length);
    const isHappy = dogState === "calm" && seriesTaps >= 3 && averageInterval <= 360;
    useEffect(() => {
        shelfStockRef.current = { food: foodCount, heal: healCount, zhivchik: drinkCount, pitbull: pitbullCount, cocoa: colaCount, bergamot: teaCount, pepsi: vitaPowerCount, lime: limeCount, matcha: matchaCount, ...brainrotInventory };
    }, [foodCount, healCount, drinkCount, pitbullCount, colaCount, teaCount, vitaPowerCount, limeCount, matchaCount, brainrotInventory]);
    useEffect(() => {
        if (dogState !== "calm") {
            setJoyFrame(0);
            return;
        }
        if (!joySpriteReady) {
            setJoyFrame(0);
            return;
        }
        const targetFrame = isHappy ? 4 : 0;
        const timer = window.setInterval(() => {
            setJoyFrame((currentFrame) => {
                if (currentFrame === targetFrame) {
                    window.clearInterval(timer);
                    return currentFrame;
                }
                const nextFrame = currentFrame + (targetFrame > currentFrame ? 1 : -1);
                if (nextFrame === targetFrame)
                    window.clearInterval(timer);
                return nextFrame;
            });
        }, EMOTION_FRAME_MS);
        return () => window.clearInterval(timer);
    }, [dogState, isHappy, joySpriteReady]);
    useEffect(() => {
        const reversingAfterBite = dogState === "recovering" && recoveryReason === "bite";
        if (dogState !== "angry" && !reversingAfterBite) {
            setRageFrame(0);
            return;
        }
        if (!rageSpriteReady) {
            setRageFrame(0);
            return;
        }
        const targetFrame = dogState === "angry" ? 4 : 0;
        const timer = window.setInterval(() => {
            setRageFrame((currentFrame) => {
                if (currentFrame === targetFrame) {
                    window.clearInterval(timer);
                    return currentFrame;
                }
                const nextFrame = currentFrame + (targetFrame > currentFrame ? 1 : -1);
                if (nextFrame === targetFrame)
                    window.clearInterval(timer);
                return nextFrame;
            });
        }, EMOTION_FRAME_MS);
        return () => window.clearInterval(timer);
    }, [dogState, rageSpriteReady, recoveryReason]);
    const showRageSequence = rageSpriteReady &&
        (dogState === "angry" ||
            (dogState === "recovering" && recoveryReason === "bite" && rageFrame > 0));
    const isEmotionShifting = (dogState === "calm" &&
        ((isHappy && joyFrame < 4) || (!isHappy && joyFrame > 0))) ||
        (dogState === "angry" && rageFrame < 4) ||
        (dogState === "recovering" && recoveryReason === "bite" && rageFrame > 0);
    const dogImageState = showRageSequence
        ? "rage"
        : dogState === "tired" ||
            dogState === "warning" ||
            (dogState === "recovering" && recoveryReason === "ultra")
            ? "warning"
            : joySpriteReady
                ? "joy"
                : "calm";
    const dogDisabled = runnerOpen || dogState === "angry" ||
        dogState === "recovering" ||
        drinkGame !== null ||
        miniGame !== null ||
        riskPhase === "transition" ||
        riskPhase === "spinning" ||
        riskPhase === "result";
    const levelDetails = levelProgressDetails(levelState);
    const levelProgress = levelDetails.progressRatio;
    const paleCalm = riskPhase === "normal" &&
        dogState === "calm" &&
        (!seriesTaps || averageInterval >= 380);
    const tapVariant = tapPulse > 0 ? `tap-${tapPulse % 2 === 0 ? "a" : "b"}` : "";
    const balanceVariant = balancePulse > 0
        ? `balance-pulse-${balancePulse % 2 === 0 ? "a" : "b"}`
        : "";
    const ultraFarming = ultraActive && ultraCharge >= 0.999;
    const calmScene = tempoSceneColor(averageInterval, seriesTaps > 0, activeTheme);
    const backgroundMood = themeMood(dogState, recoveryReason, fatigueRatio > 0);
    const backgroundBlue = backgroundMood === "calm" && seriesTaps > 0
        ? Math.min(1, Math.max(0, (500 - averageInterval) / 240)) : 0;
    const currentScene = riskMode
        ? "#25272b"
        : dogState === "angry"
            ? "#ec5148"
            : dogState === "tired"
                ? "#e8c65d"
                : dogState === "warning" ||
                    (dogState === "recovering" && fatigueRatio > 0)
                    ? "#f4c94d"
                    : dogState === "calm"
                        ? calmScene
                        : "#1478ed";
    const moodLabel = dogState === "angry"
        ? "СЕРДИТСЯ"
        : dogState === "warning"
            ? "НА ГРАНИ"
            : dogState === "tired" || dogState === "recovering"
                ? "ОТДЫХАЕТ"
                : isHappy
                    ? "РАДУЕТСЯ"
                    : "СПОКОЕН";
    const handleInterfacePress = useCallback((event: PointerEvent<HTMLElement>) => {
        const target = event.target as HTMLElement;
        const button = target.closest("button") as HTMLButtonElement | null;
        if (!button || button.disabled || button.classList.contains("dog-button"))
            return;
        getSound().uiPress();
        vibrate(3, settingsRef.current.vibration);
    }, [getSound]);
    useEffect(() => {
        const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
        document.documentElement.style.backgroundColor = currentScene;
        document.body.style.backgroundColor = currentScene;
        themeMeta?.setAttribute("content", currentScene);
    }, [currentScene]);
    const gameStyle = {
        "--calm-scene": calmScene,
        "--level-progress": levelProgress,
        "--ultra-progress": `${Math.min(100, ultraPreview / 10)}%`,
        "--ultra-fill": `${Math.round(ultraCharge * 1000) / 10}%`,
        "--risk-chance": `${riskChance * 3.6}deg`,
        "--risk-rotation": `${riskRotation}deg`,
        "--risk-sector-offset": `${180 - (riskChance * 3.6) / 2}deg`,
        "--risk-spin-duration": `${RISK_SPIN_MS}ms`,
        "--fatigue-angle": `${Math.round(fatigueCountdownRatio * 360)}deg`,
    } as CSSProperties;
    const apartmentShelf = (<ApartmentBottleShelf>
          <BuffShelfItem kind="pitbull" count={pitbullCount} canUse={pitbullCount > 0 && dogState === "calm" && !holding && coins.walletCoins > 0} canBuy={canBuyShelfBuff("pitbull", pitbullCount)} onUse={activatePitbull} onBuy={() => buyShelfBuff("pitbull")} />
          <BuffShelfItem kind="cocoa" count={colaCount} canUse={colaCount > 0 && dogState === "calm" && !holding} canBuy={canBuyShelfBuff("cocoa", colaCount)} onUse={() => openMiniGame("slots")} onBuy={() => buyShelfBuff("cocoa")} />
          <BuffShelfItem kind="bergamot" count={teaCount} canUse={teaCount > 0 && dogState === "calm" && !holding} canBuy={canBuyShelfBuff("bergamot", teaCount)} onUse={() => openMiniGame("mines")} onBuy={() => buyShelfBuff("bergamot")} />
          {(["lime", "matcha", ...BRAINROT_KINDS] as const).map(kind => {
            const count = kind === "lime" ? limeCount : kind === "matcha" ? matchaCount : brainrotInventory[kind];
            return <BuffShelfItem key={kind} kind={kind} count={count} canUse={count > 0 && !holding} canBuy={canBuyShelfBuff(kind, count)} onUse={() => openDrinkGame(kind)} onBuy={() => buyShelfBuff(kind)} />;
          })}
        </ApartmentBottleShelf>);
    const returnToApartment = () => { setApartmentBarOpen(false); setAdventureOpen(true); };
    return (<main className={`game-shell pixel-game theme-${activeTheme} state-${dogState} ${fatigueRatio > 0 ? "has-fatigue" : ""} ${holding ? "is-holding" : ""} ${ultraActive ? "ultra-active" : ""} ${biteFlash ? "bite-flash" : ""} ${paleCalm ? "pale-calm" : ""} ${dogState === "calm" && joyFrame > 0 ? "is-happy" : ""} ${isEmotionShifting ? "is-emotion-shifting" : ""} ${riskMode ? `risk-mode risk-${riskPhase}` : ""} ${riskPhase === "transition" && riskResult ? "risk-returning" : ""} ${riskShake > 0 ? `risk-shake-${riskShake % 2}` : ""} ${saveFlight ? "vault-celebrating" : ""}`} data-runner-open={runnerOpen ? "true" : undefined} data-state={dogState} data-hydrated={hydrated} data-theme-mood={backgroundMood} style={gameStyle} onPointerDownCapture={handleInterfacePress}>
      <link rel="preload" as="image" href={SAHUR_ATLAS_URL}/><link rel="preload" as="image" href={SAHUR_GUN_ATLAS_URL}/>
      <RunnerBackdrop frozen={runnerOpen || adventureOpen || neighborhoodOpen || apartmentBarOpen || actionOpen}><div className="theme-decor" aria-hidden="true">
        {(["calm", "blue", "yellow", "red"] as const).map(mood => <span className={`theme-mood-layer theme-mood-${mood}`} key={`${activeTheme}-${mood}`} style={{ opacity: mood === "calm" ? 1 : mood === "blue" ? backgroundBlue : mood === backgroundMood ? 1 : 0 }}>{<PixelScene theme={activeTheme} mood={mood}/>}</span>)}
      </div>
      <div className={`ultra-fire ${ultraFarming ? "is-farming" : ""}`} aria-hidden="true">
        {<PixelUltraEffects />}
        
      </div>
      <div className="game-motion-layer">
      <header className="app-header">
        <div className="top-bar">
          <button className="account-identity" type="button" aria-label="Открыть аккаунт и настройки" onClick={() => {
            setShopOpen(false);
            setRunnerOpen(false);
            setSettingsOpen(true);
        }}>
              <span className="account-shortcut" aria-hidden="true">{account.username.slice(0, 1).toUpperCase()}</span>
              <strong>{account.username}</strong>
          </button>
          <div className="wordmark brand-lockup" aria-label="Knopik GO">{<PixelLogo />}</div>
        </div>
        <div className="progress-hub">
          {!riskMode && <button type="button" className="progress-compact" onClick={() => { getSound().unlock(); setProgressOpen(true); }} aria-label={`Путь прогресса. Уровень ${levelState.level}. Наград доступно: ${pendingLevelRewards}`}>
            <span className="progress-lvl"><small>LVL</small><strong>{levelState.level}</strong></span>
            <span className="progress-compact-title">Прогресс</span>
            <span className={`progress-reward-button ${pendingLevelRewards ? "has-reward" : ""}`}><CaseArtwork kind="common"/>{pendingLevelRewards > 0 && <b>{pendingLevelRewards}</b>}</span>
          </button>}
        </div>
        {!riskMode && miniGame === null && drinkGame === null && <DrinkShelf className="main-quick-buffs">
          <BuffShelfItem kind="food" artwork={<QuickBuffArtwork kind="food"/>} count={foodCount} canUse={canFeedDog && !holding} canBuy={canBuyShelfBuff("food", foodCount)} onUse={feedDog} onBuy={() => buyShelfBuff("food")} />
          <BuffShelfItem kind="zhivchik" artwork={<QuickBuffArtwork kind="zhivchik"/>} count={drinkCount} canUse={drinkCount > 0 && !holding} canBuy={canBuyShelfBuff("zhivchik", drinkCount)} active={boostSeconds > 0} status={boostSeconds > 0 ? `${boostSeconds}с` : undefined} onUse={activateDrink} onBuy={() => buyShelfBuff("zhivchik")} />
          <BuffShelfItem kind="pepsi" artwork={<QuickBuffArtwork kind="pepsi"/>} count={vitaPowerCount} canUse={vitaPowerCount > 0 && !vitaPowerShield && !holding} canBuy={canBuyShelfBuff("pepsi", vitaPowerCount)} active={vitaPowerShield} status={vitaPowerShield ? "✓" : undefined} onUse={activateVitaPower} onBuy={() => buyShelfBuff("pepsi")} />
          <BuffShelfItem kind="heal" artwork={<QuickBuffArtwork kind="heal"/>} count={healCount} canUse={false} canBuy={canBuyShelfBuff("heal", healCount)} onUse={() => {}} onBuy={() => buyShelfBuff("heal")} />
        </DrinkShelf>}
      </header>

      <section className="game-stage">
        <div className="dog-stage">
          <div className="status-cluster" aria-label={`Статус Кнопика: ${moodLabel}`}>
            <strong>{moodLabel}</strong>
            <span className={`mood-indicator mood-${dogState}`} aria-hidden="true"><i /></span>
          </div>
          <div className={`dog-orbit ${vitaPowerShield ? "has-vita-shield" : ""}`}>
          {!riskMode && !biteFlash && (dogState === "angry" ? <PixelMoodEffects kind="rage"/> : isDogResting ? <PixelMoodEffects kind="rest"/> : joyFrame >= 2 ? <PixelMoodEffects kind="joy"/> : null)}
          {isDogResting && (<PixelRestRing ratio={fatigueCountdownRatio}/>)}
          <button className={`dog-button ${tapVariant} ${vitaPowerShield ? "has-vita-shield" : ""} ${isDogTired ? "has-fatigue-ring" : ""}`} type="button" data-testid="knopik" aria-label={dogDisabled
            ? "Кнопик отдыхает"
            : riskPhase === "selecting" ? "Запустить колесо Питбуля" : "Тапнуть или удерживать Кнопика для ультра-тапа"} disabled={dogDisabled} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onPointerCancel={() => finishHold(true)} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onContextMenu={(event) => event.preventDefault()}>
            <span className="portrait-surface" aria-hidden="true"/>
            {vitaPowerShield && <span className="vita-shield-ring" aria-hidden="true">{<PixelShield />}</span>}
            {shieldBreakVisible && <span className="vita-shield-break" aria-hidden="true">{<PixelBurst kind="tap" count={48}/>}</span>}
            <span className="dog-images" data-image-state={dogImageState}>
              {<PixelDog boosted={boostSeconds > 0} laserEyes={biteFlash} mood={dogImageState} joy={joyFrame} rage={showRageSequence ? rageFrame : 0}/>}
            </span>
            {biteFlash && <PixelEyeLasers />}
            {equippedCosmetic && <span className={"dog-cosmetic dog-cosmetic-" + equippedCosmetic} aria-hidden="true"><CosmeticArtwork kind={equippedCosmetic}/></span>}
            <span className="dog-ears" aria-hidden="true">
              {<><PixelEar side="left"/><PixelEar side="right"/></>}
              {hatOwned && hatEquipped && (<>
                  <ClothingArtwork kind="hat" className={`dog-hat ${hatBounce ? "hat-jump" : ""}`} key={`hat-${hatBounce}`}/>
                  <span className="hat-hit-zone" onPointerDown={bounceHat} onPointerUp={(event) => event.stopPropagation()} onPointerCancel={(event) => event.stopPropagation()}/>
                </>)}
              {mohawkOwned && mohawkEquipped && (<>
                  <ClothingArtwork kind="mohawk" className={`dog-mohawk ${mohawkSwing ? "mohawk-swing" : ""}`} key={`mohawk-${mohawkSwing}`}/>
                  <span className="mohawk-hit-zone" onPointerDown={swingMohawk} onPointerUp={(event) => event.stopPropagation()} onPointerCancel={(event) => event.stopPropagation()}/>
                </>)}
            </span>
            <span className="ear-hit-zones" aria-hidden="true">
              {(["left", "right"] as const).map((ear) => (<span className={`ear-hit ear-hit-${ear}`} key={ear} onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleEarTap(ear);
            }} onPointerUp={(event) => event.stopPropagation()} onPointerCancel={(event) => event.stopPropagation()}/>))}
            </span>
            <span className="tap-particles" aria-hidden="true">
              {particles.map((particle) => (<span className={`tap-impact ${particle.jackpot ? "jackpot" : ""}`} key={particle.id} style={{ left: `${particle.x}%`, top: `${particle.y}%` }}>
                  {<PixelBurst seed={particle.id} kind={particle.jackpot ? "gold" : "tap"} count={particle.jackpot ? 48 : 24}/>}
                  <span className="tap-particle">
                    {particle.jackpot
                ? `+${particle.amount} · ПОСЛЕДНИЙ ТАП ×5`
                : `+${particle.amount}`}
                  </span>
                </span>))}
            </span>
            {ultraActive && (<span className={`ultra-readout ${ultraFarming ? "is-farming" : ""}`}>
                <small>{ultraFarming ? "ФАРМ" : "ЗАРЯД"}</small>
                <strong>
                  {ultraFarming ? `+${ultraPreview}` : `${Math.round(ultraCharge * 100)}%`}
                </strong>
              </span>)}
          </button>
          </div>
        </div>

        <div className="game-data">
          <div className={`wallet-balance ${balanceVariant}`} aria-label={`Активные монеты ${coins.walletCoins}`}>
            <span className="coin-mark" aria-hidden="true"><CoinArtwork /></span>
            <div>
              <small>KNOPIK COIN</small>
              <strong className="balance-number" key={`balance-${balancePulse}`}>
                {coins.walletCoins.toLocaleString("ru-RU")}
              </strong>
            </div>
          </div>
          {riskMessage && <p className="risk-notice" key={`risk-notice-${riskShake}`}>{riskMessage}</p>}
          <VaultSwipe vault={vaultCoins} amount={saveFlight?.amount ?? saveAmount} disabled={!canSave || Boolean(saveFlight)} depositing={Boolean(saveFlight)} onTransfer={saveAllToVault}/>
        </div>
      </section>

      <BottomNavigation activeIndex={navIndex} onSelect={clickNavigation} onPointerDown={handleNavigationDown} onPointerMove={handleNavigationMove}/>
      </div>

      </RunnerBackdrop>
      {hydrated && adventureOpen && <AdventureGame keepsakes={neighborhood} theme={activeTheme} immortal={settings.suliman} completedLevel={storyCompletedLevel} weaponTier={storyWeaponTier} onLevelComplete={level=>setStoryCompletedLevel(current=>Math.max(current,level))} onUnlockWeapon={tier=>setStoryWeaponTier(current=>Math.max(current,tier))} onCollect={collectRunnerCoins} onLootBuff={collectAdventureBuff} checkpoint={storyCheckpoint} healCount={healCount} shieldCount={vitaPowerCount} shieldActive={vitaPowerShield} onConsumeHeal={consumeAdventureHeal} onActivateShield={activateVitaPower} onShieldUsed={consumeActiveShield} onCheckpoint={value => { setStoryCheckpoint(current => Math.max(current, value)); if (value >= 3) setTutorialSeen(true); }} onClose={() => { setAdventureOpen(false); selectNavigation(1); }} onShop={() => { setAdventureOpen(false); selectNavigation(0); }} onRun={() => { setAdventureOpen(false); setNeighborhoodOpen(true); }} onBar={() => { setAdventureOpen(false); setApartmentBarOpen(true); }} onSound={kind => getSound().adventure(kind)} />}
      {apartmentBarOpen && miniGame === null && drinkGame === null && !riskMode && <GameModal className={`adventure-bar pixel-game theme-${activeTheme}`} label="Мини-бар Кнопика" onDismiss={returnToApartment}><header className="apartment-bar-header"><small>КОЛЛЕКЦИЯ СНОВ</small><h2>Мини-бар Кнопика</h2><p>Выбери бутылку и отправляйся в сон.<br/>«+» — пополнить запас напитка.</p></header>{apartmentShelf}<footer className="apartment-bar-footer"><button className="adventure-primary" type="button" onClick={returnToApartment}>Вернуться в квартиру</button></footer></GameModal>}
      {riskMode && <PitbullGame phase={riskPhase} chance={riskChance} bet={riskBetAmount} balance={coins.walletCoins} multiplier={selectedRiskMultiplier} payout={riskPayout} result={riskResult} rotation={riskRotation} spinNonce={riskSpinNonce} duration={RISK_SPIN_MS} canChooseBet={mohawkEquipped} message={riskMessage} onChance={chance => { setRiskChance(chance); getSound().riskTick(); vibrate(8, settingsRef.current.vibration); }} onBet={setRiskBetAmount} onSpin={startRiskSpin} onClose={() => { if (riskPhaseRef.current !== "selecting") return; transitionRisk("normal"); setRiskRotation(0); setRiskResult(null); setRiskMessage(""); }} />}
      {hydrated && neighborhoodOpen && <NeighborhoodGame theme={activeTheme} progress={neighborhood} suspended={runnerOpen} onProgress={setNeighborhood} onHome={() => { setNeighborhoodOpen(false); setAdventureOpen(true); }} onRun={() => { getSound().unlock(); setRunnerOpen(true); }} onSound={() => getSound().adventure("door")} />}
      {runnerOpen && <RunnerGame fromStreet={neighborhoodOpen} balance={coins.walletCoins} best={runnerStats.runnerBest} boostUntil={boostUntil} options={{ night: activeTheme === "night", collar: equippedCosmetic === "charm", collarLevel: cosmeticLevels.charm, immortal: account.isAdmin && settings.suliman, magnet: account.isAdmin && runnerCheats.magnet, turbo: account.isAdmin && runnerCheats.turbo, homeShield: vitaPowerShield }} vibration={settings.vibration} getSound={getSound} onCollect={collectRunnerCoins} onFinish={finishRunner} onHomeShieldUsed={consumeActiveShield} onClose={() => { setRunnerOpen(false); if (!neighborhoodOpen) setAdventureOpen(true); }} />}

      {progressOpen && <ProgressRoad level={levelState} claimed={claimedLevelRewards} onClaim={claimLevelReward} onGetDailyCase={onGetDailyCase} onClaimDailyCase={claimDailyReward} onClose={() => setProgressOpen(false)}/>}
      {drinkGame === "lime" && <LimeGame key={`lime-${drinkSession}`} best={drinkGameStats.limeBest} onStart={startDrinkGame} onResolve={resolveDrinkGame} onClose={closeDrinkGame} onTick={() => getSound().riskTick()}/>}
      {drinkGame === "matcha" && <DrinkGamePanel key={`matcha-${drinkSession}`} kind="matcha" best={drinkGameStats.matchaBest} onStart={startDrinkGame} onResolve={resolveDrinkGame} onClose={closeDrinkGame} onTick={pad => pad === undefined ? getSound().riskTick() : getSound().memoryNote(pad)}/>}
      {drinkGame && isBrainrotKind(drinkGame) && <BrainrotGame key={`${drinkGame}-${drinkSession}`} kind={drinkGame} best={brainrotStats[drinkGame].best} onStart={startDrinkGame} onResolve={resolveDrinkGame} onClose={closeDrinkGame} onSound={(kind, sound, lane) => getSound().brainrotCue(kind, sound, lane)}/>}

      {miniGame && (<MiniGamePanel key={`${miniGame}-${miniGameSession}`} kind={miniGame} balance={coins.walletCoins} difficulty={difficultyWithBalancePenalty(difficulty, coins.walletCoins)} canChooseBet={mohawkEquipped} stats={miniGameStats} onCommitBet={commitMiniGameBet} onResolve={resolveMiniGame} onClose={() => setMiniGame(null)} onTick={() => {
                getSound().riskTick();
                vibrate(5, settingsRef.current.vibration);
            }} onCocoaSound={(kind, index) => {
                getSound().cocoa(kind, index);
                if (kind === "stop") vibrate(16, settingsRef.current.vibration);
                if (kind === "win") vibrate([20, 35, 40], settingsRef.current.vibration);
                if (kind === "loss") vibrate(24, settingsRef.current.vibration);
            }}/>)}

      {saveFlight && (<div className="vault-celebration" key={`vault-${saveFlight.id}`} aria-hidden="true">
          <span className="vault-gold-wave"/>
          {Array.from({ length: 128 }, (_, index) => <span className="vault-rain-coin" key={index} style={{ "--coin-x": `${(index * 47 + index * index * 13) % 103 - 2}%`, "--coin-delay": `${index * 73 % 310}ms`, "--coin-duration": `${1200 + index * 37 % 470}ms`, "--coin-size": `${12 + index * 7 % 23}px`, "--coin-turn": `${(index % 2 ? 1 : -1) * (180 + index * 29 % 480)}deg`, "--coin-drift": `${index * 19 % 81 - 40}px`, "--coin-flip": `${280 + index * 53 % 440}ms`, "--coin-depth": index % 4 === 0 ? .65 : 1 } as CSSProperties}><CoinArtwork /></span>)}
          {<PixelBurst kind="gold" count={72} className="vault-pixel-burst"/>}
          <strong>+{saveFlight.amount.toLocaleString("ru-RU")}</strong>
        </div>)}

      {levelBurstVisible && (<div className="level-burst" key={`level-${levelBurstKey}`} aria-hidden="true">
          {<PixelBurst kind="gold" count={96}/>}
        </div>)}

      {caseSequence && <CaseOpening sequence={caseSequence} onHold={beginCaseHold} onCancelHold={cancelCaseHold} onAdvance={advanceCaseReward} onClose={() => { cancelCaseHold(); setCaseSequence(null); }}/>}

      {tutorialOpen && (<div className="modal-backdrop tutorial-backdrop">
          <section className="tutorial-sheet" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
            <div className="tutorial-visual" aria-hidden="true">
              <span>{tutorialSlides[tutorialStep].symbol}</span>
              <i />
            </div>
            <p className="sheet-kicker">{tutorialSlides[tutorialStep].eyebrow}</p>
            <h2 id="tutorial-title">{tutorialSlides[tutorialStep].title}</h2>
            <p>{tutorialSlides[tutorialStep].copy}</p>
            <div className="tutorial-dots" aria-label={`Шаг ${tutorialStep + 1} из ${tutorialSlides.length}`}>
              {tutorialSlides.map((_, index) => (<span className={index === tutorialStep ? "active" : ""} key={index}/>))}
            </div>
            <button className="primary-button" type="button" onClick={() => tutorialStep < tutorialSlides.length - 1
                ? setTutorialStep((current) => current + 1)
                : finishTutorial()}>
              {tutorialStep === tutorialSlides.length - 1 ? "Начать игру" : "Дальше"}
            </button>
          </section>
        </div>)}

      {shopOpen && (<div className="modal-backdrop" onPointerDown={(event) => {
                if (event.target === event.currentTarget)
                    selectNavigation(1);
            }}>
          <section className="sheet shop-sheet" role="dialog" aria-modal="true" aria-labelledby="shop-title">
            <div className="shop-hero-row">
              <div className="sheet-heading"><h2 id="shop-title">Магазин</h2></div>
              <div className="shop-wallet">
                <span><small>СЕЙФ</small><strong>{vaultCoins.toLocaleString("ru-RU")}</strong></span>
                <span className="coin-mark" aria-hidden="true"><CoinArtwork /></span>
              </div>
            </div>

            <div className="shop-categories" role="tablist" aria-label="Разделы магазина">
              {(["clothes", "themes", "cases"] as const).map((category, index) => <button key={category} type="button" role="tab" className={shopCategory === category ? "active" : ""} aria-selected={shopCategory === category} tabIndex={shopCategory === category ? 0 : -1} onClick={() => setShopCategory(category)} onKeyDown={event => {
                    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                        event.preventDefault();
                        const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
                        setShopCategory((["clothes", "themes", "cases"] as const)[next]);
                        (event.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
                    }
                }}>{category === "clothes" ? "Одежда" : category === "themes" ? "ФОНЫ" : "Кейсы"}</button>)}
            </div>

            {shopMessage && <p className="purchase-message" role="status">{shopMessage}</p>}

            {shopCategory === "cases" && <CaseShop common={commonCases} big={bigCases} vault={vaultCoins} level={levelState.level} onOpen={openCase} onBuyCommon={buyCommonCase} onBuyBig={buyBigCase} onRoad={() => { setShopOpen(false); setProgressOpen(true); }} />}

            {shopCategory === "clothes" && (<div className="shop-product-grid shop-clothes-grid">
            <article className={`shop-card shop-product-card hat-card ${hatOwned ? "owned" : ""} ${hatLocked ? "is-locked" : ""}`}>
              <span className="hat-preview" aria-hidden="true">
                <ClothingArtwork kind="hat"/>
                {hatLocked && <ShopLock/>}
              </span>
              <div className="food-copy">
                {hatOwned && <small>LVL {hatLevel}/5</small>}
                <h3>Тюбетейка Хасбика</h3>
                <p>Улучшает награду и удержание ультра-тапа.</p>
              </div>
              <div className="clothing-actions">
                <button className="shop-buy-button clothing-equip-button" type="button" disabled={!canBuyHat} onClick={buyOrToggleHat}>
                  {hatOwned
                    ? hatEquipped ? "Снять" : "Надеть"
                    : hatLocked ? `Откроется на LVL ${CLOTHING_UNLOCK_LEVELS.hat}` : `Купить · ${HASBIK_HAT_PRICE.toLocaleString("ru-RU")}`}
                </button>
                <button className="clothing-upgrade-button" type="button" disabled={!hatOwned || hatLevel >= 5 || hatUpgradeTokens < 1} onClick={() => upgradeClothing("hat")}>
                  {hatLevel >= 5 ? "Максимум" : `Улучшить · ${hatUpgradeTokens}`}
                </button>
              </div>
            </article>
            <article className={`shop-card shop-product-card mohawk-card ${mohawkOwned ? "owned" : ""} ${mohawkLocked ? "is-locked" : ""}`}>
              <span className="mohawk-preview" aria-hidden="true">
                <ClothingArtwork kind="mohawk"/>
                {mohawkLocked && <ShopLock/>}
              </span>
              <div className="food-copy">
                {mohawkOwned && <small>LVL {mohawkLevel}/5</small>}
                <h3>Эрокез</h3>
                <p>Улучшает коэффициенты и открывает выбор ставки.</p>
              </div>
              <div className="clothing-actions">
                <button className="shop-buy-button clothing-equip-button" type="button" disabled={!canBuyMohawk} onClick={buyOrToggleMohawk}>
                  {mohawkOwned
                    ? mohawkEquipped ? "Снять" : "Надеть"
                    : mohawkLocked ? `Откроется на LVL ${CLOTHING_UNLOCK_LEVELS.mohawk}` : `Купить · ${MOHAWK_PRICE.toLocaleString("ru-RU")}`}
                </button>
                <button className="clothing-upgrade-button" type="button" disabled={!mohawkOwned || mohawkLevel >= 5 || mohawkUpgradeTokens < 1} onClick={() => upgradeClothing("mohawk")}>
                  {mohawkLevel >= 5 ? "Максимум" : `Улучшить · ${mohawkUpgradeTokens}`}
                </button>
              </div>
            </article>
            {(["bandana", "charm"] as const).map(kind => {
                    const owned = ownedCosmetics.includes(kind);
                    const item = COSMETICS[kind];
                    const locked = !owned && levelState.level < item.unlockLevel;
                    return <article key={kind} className={`shop-card shop-product-card go-clothing-card ${locked ? "is-locked" : ""}`}>
                <span className="go-clothing-art"><CosmeticArtwork kind={kind}/>{locked && <ShopLock/>}</span>
                <div className="food-copy">{owned && <small>LVL {cosmeticLevels[kind]}/5</small>}<h3>{item.name}</h3><p>{cosmeticEffect(kind,cosmeticLevels[kind])}</p></div>
                <div className="clothing-actions">
                <button className="shop-buy-button clothing-equip-button" type="button" disabled={locked || (!owned && vaultCoins < item.price)} onClick={() => buyOrToggleCosmetic(kind)}>
                  {owned ? equippedCosmetic === kind ? "Снять" : "Надеть" : locked ? `Откроется на LVL ${item.unlockLevel}` : "Купить · " + item.price.toLocaleString("ru-RU")}
                </button>
                <button className="clothing-upgrade-button" type="button" disabled={!owned || cosmeticLevels[kind]>=5 || vaultCoins<cosmeticUpgradePrice(cosmeticLevels[kind])} onClick={()=>upgradeCosmetic(kind)}>{cosmeticLevels[kind]>=5?"Максимум":`Улучшить · ${cosmeticUpgradePrice(cosmeticLevels[kind]).toLocaleString("ru-RU")}`}</button>
                </div>
              </article>;
                })}
            </div>)}
            {shopCategory === "themes" && <div className="theme-shop-grid">{(Object.keys(THEMES) as ThemeId[]).map(kind => {
                    const theme = THEMES[kind];
                    const owned = ownedThemes.includes(kind);
                    const locked = !owned && levelState.level < theme.unlockLevel;
                    return <article key={kind} className={"theme-shop-card theme-preview-" + kind + (locked ? " is-locked" : "")}>
                <div className="theme-preview-art" aria-hidden="true"><PixelScene theme={kind}/><KnopikPortrait />{locked && <span className="theme-level-lock"><svg viewBox="0 0 24 24" shapeRendering="crispEdges"><path d="M8 2h8v3h3v6h3v11H2V11h3V5h3Zm2 3v3H8v3h8V8h-2V5ZM4 13v7h16v-7Z" fill="currentColor"/><path d="M10 14h4v5h-4Z" fill="currentColor"/></svg></span>}</div>
                <div><h3>{theme.name}</h3></div>
                <button type="button" disabled={locked || activeTheme === kind || (!owned && vaultCoins < theme.price)} onClick={() => buyOrSelectTheme(kind)}>
                  {locked ? `LVL ${theme.unlockLevel} · ${theme.price.toLocaleString("ru-RU")}` : activeTheme === kind ? "Выбрано" : owned ? "Выбрать" : "Купить · " + theme.price.toLocaleString("ru-RU")}
                </button>
              </article>;
                })}</div>}

          </section>
        </div>)}

      {syncState === "error" && (
        <div className="go-cloud-warning" role="alert">
          <span>Сохранение в Supabase не подтверждено. Локальная копия хранится на устройстве.</span>
          <button type="button" onClick={() => void onRetrySave()}>Повторить</button>
        </div>
      )}
      {actionOpen && <ActionScene onClose={() => { setActionOpen(false); setSettingsOpen(true); }} onSound={kind => getSound().adventure(kind)}/>}
      {settingsOpen && (<GameModal className="modal-backdrop settings-backdrop" label="Настройки" onDismiss={() => selectNavigation(1)}>
          <section className="sheet settings-sheet" aria-labelledby="settings-title">
            <div className="sheet-heading">
              <div><p className="sheet-kicker">KNOPIK GO</p><h2 id="settings-title">Настройки</h2></div>
              <button type="button" className="icon-button" aria-label="Закрыть настройки" onClick={() => selectNavigation(1)}>×</button>
            </div>

            <div className="account-settings">
              <div className="account-summary">
                <span className="account-avatar" aria-hidden="true">{account.username.slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{account.username}{account.isAdmin && <small className="settings-admin-badge">АДМИН</small>}</strong>
                  <span>{syncState === "saved" ? "Прогресс сохранён в Supabase" : syncState === "saving" ? "Сохранение в облако…" : syncState === "conflict" ? "Конфликт версий" : "Ошибка облачного сохранения — повторить"}</span>
                </div>
              </div>
              <button className="settings-sign-out" type="button" disabled={accountPending} onClick={() => void signOutAccount()}>Выйти</button>
            </div>
            <button className="settings-action-launch" type="button" onClick={() => { getSound().adventure("door"); setSettingsOpen(false); setActionOpen(true); }}><svg viewBox="0 0 32 32" shapeRendering="crispEdges" aria-hidden="true"><path d="M4 3h24v26H4Z" fill="#775442"/><path d="M7 6h18v20H7Z" fill="#d97b70"/><path d="M12 10h4v3h4v3h3v3h-7v3h-4Z" fill="#fff1d1"/></svg><span><strong>Экшен</strong><small>10 секунд · Кнопик против Сахуров</small></span></button>
            <p className="settings-section-title">Игра</p>
            <div className="setting-row">
              <div><strong>Звук</strong><span>Чиптюн и эффекты</span></div>
              <button className="switch" type="button" role="switch" aria-checked={settings.sound} aria-label="Звук" onClick={() => setSettings((current) => ({ ...current, sound: !current.sound }))}><span /></button>
            </div>
            <div className="setting-row">
              <div><strong>Вибрация</strong><span>Отклик при касании</span></div>
              <button className="switch" type="button" role="switch" aria-checked={settings.vibration} aria-label="Вибрация" onClick={() => setSettings(current => ({ ...current, vibration: !current.vibration }))}><span/></button>
            </div>
            {account.isAdmin && (<details className="settings-fold admin-fold"><summary>Управление игрой <span>АДМИН</span></summary><section className="difficulty-panel">
                <div className="difficulty-heading">
                  <div>
                    <strong>Скрытая сложность</strong>
                    <span>Общая для всех игроков</span>
                  </div>
                  <output htmlFor="difficulty-range">{difficultyDraft}</output>
                </div>
                <input id="difficulty-range" type="range" min="0" max="100" step="1" value={difficultyDraft} aria-label="Скрытая сложность игры" onChange={(event) => {
                    setDifficultyDraft(clampDifficulty(Number(event.currentTarget.value)));
                    setDifficultyMessage("");
                }}/>
                <div className="difficulty-scale" aria-hidden="true">
                  <span><b>0</b> очень легко</span>
                  <span><b>50</b> стандарт</span>
                  <span><b>100</b> сложно</span>
                </div>
                <button className="difficulty-save" type="button" disabled={difficultyPending || difficultyDraft === difficulty} onClick={() => void submitDifficulty()}>
                  {difficultyPending ? "Сохраняем…" : "Сохранить сложность"}
                </button>
                {difficultyMessage && <p className="difficulty-message" role="status">{difficultyMessage}</p>}
              </section></details>)}
            <details className="settings-fold"><summary>{account.isAdmin ? "Промокоды" : "Активировать промокод"}<span>＋</span></summary>
            <section className={`promo-panel ${account.isAdmin ? "promo-admin" : "promo-redeem"}`}>
              <div className="promo-heading">
                <span className="promo-symbol" aria-hidden="true">%</span>
                <div>
                  <strong>{account.isAdmin ? "Промокоды" : "Есть промокод?"}</strong>
                  <span>{account.isAdmin ? "Создай одноразовое начисление монет" : "Активировать его можно только один раз"}</span>
                </div>
              </div>
              <form className="promo-form" onSubmit={(event) => {
                event.preventDefault();
                void submitPromoCode();
            }}>
                <label>
                  <span>Промокод</span>
                  <input name="promo-code" type="text" value={promoCode} placeholder="Например, KNOPIK100" autoCapitalize="characters" autoCorrect="off" spellCheck={false} maxLength={32} required onChange={(event) => {
                setPromoCode(event.currentTarget.value.toUpperCase());
                setPromoMessage("");
            }}/>
                </label>
                {account.isAdmin && (<label>
                    <span>Сумма монет</span>
                    <input className="promo-amount" name="promo-amount" type="number" inputMode="numeric" min="1" max="1000000000" value={promoAmount} placeholder="100" required onChange={(event) => {
                    setPromoAmount(event.currentTarget.value);
                    setPromoMessage("");
                }}/>
                  </label>)}
                <button type="submit" disabled={promoPending}>
                  {promoPending ? "Подождите…" : account.isAdmin ? "Создать" : "Активировать"}
                </button>
              </form>
              {promoMessage && <p className="promo-message" role="status">{promoMessage}</p>}
              {account.isAdmin && (<div className="promo-list" aria-label="Созданные промокоды">
                  <div className="promo-list-title"><span>ВСЕ КОДЫ</span><strong>{promoCodes.length}</strong></div>
                  {promoCodes.length === 0 ? (<p className="promo-empty">Пока нет созданных промокодов.</p>) : promoCodes.map((promo) => (<div className={`promo-code-row ${promo.redeemed ? "is-used" : ""}`} key={promo.id}>
                      <span><strong>{promo.code}</strong><small>{new Date(promo.createdAt).toLocaleDateString("ru-RU")}</small></span>
                      <span><strong>+{promo.amount.toLocaleString("ru-RU")}</strong><small>{promo.redeemed ? "ИСПОЛЬЗОВАН" : "ДОСТУПЕН"}</small></span>
                    </div>))}
                </div>)}
            </section></details>
            {account.isAdmin && <AdminCheatConsole code={cheatCode} message={cheatMessage} modes={[...(settings.suliman ? ["Бессмертие"] : []), ...(settings.yellow ? ["Без усталости"] : []), ...(runnerCheats.magnet ? ["Магнит"] : []), ...(runnerCheats.turbo ? ["Турбо"] : []), ...(boostUntil > clock ? ["Живчик"] : [])]} onChange={value => { setCheatCode(value); setCheatMessage(""); }} onSubmit={submitCheatCode} />}
            <details className="settings-fold"><summary>Дополнительно<span>＋</span></summary>
            {!account.isAdmin && <form className={`cheat-row ${settings.suliman || settings.yellow ? "is-active" : ""}`} onSubmit={(event) => {
                event.preventDefault();
                submitCheatCode();
            }}>
              <div>
                <strong>Чит-код</strong>
                <span>{settings.suliman || settings.yellow ? `Секретных режимов активно: ${Number(settings.suliman) + Number(settings.yellow)}` : "Введи секретное слово"}</span>
              </div>
              <label>
                <input type="text" value={cheatCode} placeholder="Код" autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="Чит-код" onChange={(event) => {
                setCheatCode(event.currentTarget.value);
                setCheatMessage("");
            }}/>
                <button type="submit">Применить</button>
              </label>
              {cheatMessage && <small role="status">{cheatMessage}</small>}
            </form>}
            <button className="settings-action" type="button" onClick={() => { setSettingsOpen(false); setTutorialStep(0); setTutorialOpen(true); }}>Повторить обучение <span>↗</span></button>
            {!resetConfirmOpen ? (<button className="settings-action danger-action" type="button" onClick={() => setResetConfirmOpen(true)}>Сбросить прогресс</button>) : (<div className="reset-confirm" role="alert">
                <p>Удалить баланс, сейф, усталость, рекорды и настройки?</p>
                <div><button type="button" onClick={() => setResetConfirmOpen(false)}>Отмена</button><button className="confirm-reset" type="button" onClick={resetProgress}>Сбросить прогресс</button></div>
              </div>)}
            </details>
            <p className="settings-section-title">Статистика</p>
            <div className="stats-line"><span>ЛУЧШАЯ СЕРИЯ <strong>{stats.bestStreak}</strong></span><span>ТАПОВ <strong>{stats.totalTaps}</strong></span><span>УКУСОВ <strong>{stats.totalBites}</strong></span></div>
          </section>
        </GameModal>)}

      <div className="red-flash" aria-hidden="true"/>
    </main>);
}
