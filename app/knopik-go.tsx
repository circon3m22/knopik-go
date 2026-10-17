"use client";
import {ArcadeEconomyContext} from "./arcade-economy-context";
import {arcadeSettlement} from "./arcade-economy";
import {useVisibleClock} from "./use-visible-clock";
import {setVisualAccessibility} from "./visual-accessibility";
import { defaultEndlessProgress } from "./endless-progress";
import type { NeighborhoodEngine } from "./neighborhood-engine";
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
import {ArcadeLibrary} from "./arcade-library";
import {ARCADE_DRINKS,type ArcadeDrink} from "./arcade-catalog";
import {CasinoGame} from "./casino-game";
import {createCasinoInventory,createCasinoStats,isCasinoKind,commitCasinoRound,doubleCasinoRound,settleCasinoRound,type CasinoKind,type CasinoLedger} from "./casino-engine";
import { MiniGamePanel, type MiniGameKind, type MiniGameStats, } from "./mini-game-panel";
import { resolveMiniGameBet } from "./mini-game-engine";
import { COSMETICS, THEMES, CLOTHING_UNLOCK_LEVELS, spendBalance, cosmeticFatigueMultiplier, cosmeticUpgradePrice, cosmeticEffect, themeMood, type CosmeticId, type ThemeId } from "./cosmetic-engine";
import { COMBAT_CLOTHING } from "./knopik-combat-equipment";
import {KNOPIK_SKINS,PAID_KNOPIK_SKINS,purchaseKnopikSkin,type KnopikSkin} from "./knopik-skins";
import { CosmeticArtwork, KnopikPortrait, ClothingArtwork } from "./cosmetic-artwork";
import { PixelDog, PixelScene, PixelLogo, type PotionKind } from "./pixel-artwork";
import { PixelBurst, PixelMoodEffects, PixelRestRing, PixelUltraEffects, PixelEyeLasers } from "./pixel-effects";
import { CaseArtwork, CoinArtwork, AuraCoinArtwork } from "./collectible-artwork";
import {TapPixelShield} from "./tap-pixel-shield";
import {ShopBalances} from "./shop-balances";
import {TapBalances} from "./tap-balances";
import {GameLaunch} from "./game-launch";
import {barDrinkBlock} from "./bar-drink-access";
import { BottomNavigation } from "./bottom-navigation";
import { VaultSwipe } from "./vault-swipe";
import { DrinkShelf } from "./drink-shelf";
import { ApartmentBottleShelf } from "./apartment-bottle-shelf";
import { WardrobeRoom,VaultRoom,AuraExchangeRoom } from "./home-room-panels";
import { LaboratoryRoom } from "./laboratory-panel";
import { defaultLaboratory,LAB_RECIPES,canBuyLabDrink,unlockAllLabRecipes,startLaboratoryBrew,careForBrew,claimLaboratoryBrew,harvestLaboratory,canHarvest,collectLaboratoryChest,collectLaboratoryIngredient,type LabMaterial,type LaboratoryProgress,type LabRecipeId,type LabSourceId } from "./laboratory-engine";
import type { KnopikEquipment } from "./knopik-equipment-state";
import {defaultCombatTraining,grantCombatTrainingKit,advanceCombatTraining,type CombatTraining} from "./adventure-training";
import { SAHUR_ATLAS_URL, SAHUR_GUN_ATLAS_URL } from "./sahur-sprite";
import { BuffShelfItem } from "./buff-shelf-item";
import { BUFF_CATALOG, buffStockLimit, emptyBuffStock, purchaseShelfBuff } from "./buff-shelf-engine";
import { DrinkGamePanel } from "./drink-game-panel";
import { LimeGame } from "./lime-game";
import { BrainrotGame } from "./brainrot-game";
import { LIME_MAX_SCORE, MEMORY_ROUNDS, BRAINROT_KINDS, createBrainrotInventory, createBrainrotStats, isBrainrotKind, commitDrinkRound, settleDrinkRound, type DrinkGameKind, type DrinkRoundLedger } from "./drink-game-engine";
import { GameModal } from "./game-modal";
import {resolveSkillWager,skillWagerPayout} from "./skill-wager-engine";
import { GameSettingsAccess } from "./game-settings-access";
import {graphicsModes,setGraphicsQuality,setVisualFpsLimit} from "./graphics-quality";
import {setFrameRatePosition,setFrameRateVisible} from "./frame-rate-visibility";
import { GamePreferences } from "./game-preferences";
import { CaseOpening, type CaseSequence } from "./case-opening";
import { ProgressRoad } from "./progress-road";
import { planProgressClaims,progressReward } from "./progress-engine";
import type { DailyCaseStatus } from "./daily-case";
import { RunnerGame } from "./runner-game";
import { RunnerBackdrop } from "./runner-backdrop";
import { CaseShop } from "./case-shop";
import type { RunnerResult } from "./runner-engine";
import { ADMIN_COMMANDS, AdminCheatConsole } from "./admin-cheats";
import { COLLECTION_CHEATS, BUFF_SAVE_FIELDS, grantCollectionCheat } from "./collection-cheats";
import { ShopLock } from "./shop-lock";
import { PitbullGame } from "./pitbull-game";
import { OfflineDownloadStatus } from "./offline-support";
import {CoopLobby} from "./coop-lobby";
import { AdventureGame } from "./adventure-game";
import { ActiveBalance } from "./active-balance";
import { burnActiveBalance } from "./adventure-economy";
import { NeighborhoodGame } from "./neighborhood-game";
import { defaultNeighborhoodProgress, type NeighborhoodProgress } from "./neighborhood-progress";
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
    runnerEntry?:boolean;
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
export function KnopikGoGame({ runnerEntry=false, account, initialSave, syncState, difficulty, promoCodes, onSave, onRetrySave, onRefreshPromoCodes, onUpdateDifficulty, onCreatePromoCode, onRedeemPromoCode, onGetDailyCase, onClaimDailyCase, onSignOut, }: KnopikGoGameProps) {
    const restoredSaveRef = useRef<SaveData | null>(null);
    const [dogState, setDogState] = useState<DogState>("calm");
    const [recoveryReason, setRecoveryReason] = useState<RecoveryReason>("rest");
    const [coins, setCoins] = useState<CoinState>({
        walletCoins: 0,
        streakCoins: 0,
    });
    const [vaultCoins, setVaultCoins] = useState(0);
    const [auraCoins,setAuraCoins]=useState(0);
    const auraCoinsRef=useRef(0);
    const updateAuraCoins=useCallback((value:number|((current:number)=>number))=>{const next=typeof value==="function"?value(auraCoinsRef.current):value;auraCoinsRef.current=next;setAuraCoins(next);},[]);
    const [ownedSkins,setOwnedSkins]=useState<KnopikSkin[]>(["classic"]),[activeSkin,setActiveSkin]=useState<KnopikSkin>("classic");
    const ownedSkinsRef=useRef<KnopikSkin[]>(["classic"]);
    const vaultCoinsRef = useRef(0);
    const [ownedCosmetics, setOwnedCosmetics] = useState<CosmeticId[]>([]);
    const [equippedCosmetic, setEquippedCosmetic] = useState<CosmeticId | null>(null);
    const [cosmeticLevels,setCosmeticLevels] = useState<Record<CosmeticId,number>>({'sky-boots':1,'ranger-hood':1,'hunter-armor':1,'raven-mask':1,'hunter-cloak':1,bandana:1,charm:1,goggles:1,cape:1});
    const cosmeticLevelsRef = useRef<Record<CosmeticId,number>>({'sky-boots':1,'ranger-hood':1,'hunter-armor':1,'raven-mask':1,'hunter-cloak':1,bandana:1,charm:1,goggles:1,cape:1});
    const cosmeticRef = useRef<CosmeticId | null>(null);
    const cosmeticOwnedRef = useRef<CosmeticId[]>([]);
    const [ownedThemes, setOwnedThemes] = useState<ThemeId[]>(["classic"]);
    const [arcadeProfit,setArcadeProfit]=useState(0);
    const arcadeProfitRef=useRef(0);
    const ultraUiStampRef=useRef(0);
    const [activeTheme, setActiveTheme] = useState<ThemeId>("classic");
    useEffect(()=>{document.documentElement.dataset.knopikTheme=activeTheme;},[activeTheme]);
    const themesOwnedRef = useRef<ThemeId[]>(["classic"]);
    const [endless,setEndless]=useState(defaultEndlessProgress);
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
    const [casinoInventory,setCasinoInventory]=useState(createCasinoInventory),[casinoStats,setCasinoStats]=useState(createCasinoStats);
    const [casinoGame,setCasinoGame]=useState<CasinoKind|null>(null),[casinoSession,setCasinoSession]=useState(0);
    const casinoLedgerRef=useRef<CasinoLedger|null>(null);
    const [arcadeOpen,setArcadeOpen]=useState(false),[labSelection,setLabSelection]=useState<LabRecipeId|undefined>();
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
    const [settings, setSettings] = useState<GameSettings>({cameraShake:true,contrastAim:false,graphicsQuality:"medium",fpsPosition:"bottom",
        sound: true,
        vibration: true,
        suliman: false,
        yellow: false,
        graphics: "auto",
        worldGraphics:"soft",
        fpsLimit:60,
        showFps:true,
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
    const [shopCategory, setShopCategory] = useState<"themes" | "clothes" | "skins" | "cases">("clothes");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [runnerOpen, setRunnerOpen] = useState(runnerEntry);
    const [streetEngine,setStreetEngine]=useState<NeighborhoodEngine|undefined>(undefined);
    const [worldResetEpoch,setWorldResetEpoch]=useState(0);
    const [adventureOpen, setAdventureOpen] = useState(false);
    const [coopOpen,setCoopOpen]=useState(false);
    useEffect(()=>{if(new URLSearchParams(window.location.search).has("coop"))setCoopOpen(true);},[]);
    const [launchStarted,setLaunchStarted]=useState(runnerEntry);
    const [computerOpen,setComputerOpen]=useState(false);
    const [fromComputer,setFromComputer]=useState(false);
    const [neighborhoodOpen, setNeighborhoodOpen] = useState(false);
    const [neighborhood, setNeighborhood] = useState<NeighborhoodProgress>(defaultNeighborhoodProgress);
    const [apartmentBarOpen, setApartmentBarOpen] = useState(false);
    const [homePanel,setHomePanel]=useState<"wardrobe"|"vault"|"laboratory"|"aura"|null>(null);
    const [homeFromStreet,setHomeFromStreet]=useState(false);
    const [laboratory,setLaboratory]=useState<LaboratoryProgress>(defaultLaboratory);
    const laboratoryRef=useRef(laboratory);
    const [combatTraining,setCombatTraining]=useState<CombatTraining>(defaultCombatTraining);
    const trainingRef=useRef(combatTraining);
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
    const miniLedgerRef=useRef<{kind:MiniGameKind;phase:"ready"|"playing"|"settled";bet:number}|null>(null);
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
    const particleTimersRef=useRef(new Map<number,ReturnType<typeof setTimeout>>());
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
    const settleArcade=useCallback((requested:number,stake=0)=>{
        const settled=arcadeSettlement(requested,stake,Math.min(Number.MAX_SAFE_INTEGER,coinsRef.current.walletCoins+stake+vaultCoinsRef.current),arcadeProfitRef.current);
        arcadeProfitRef.current+=settled.profit;setArcadeProfit(arcadeProfitRef.current);
        return settled.payout;
    },[]);
    const collectRunnerCoins = useCallback((amount: number) => {
        const earned = Math.max(0, Math.floor(amount));
        if (!earned) return;
        updateCoins(current => ({ ...current, walletCoins: Math.min(Number.MAX_SAFE_INTEGER, current.walletCoins + earned) }));
    }, [updateCoins]);
    const burnAdventureWallet = useCallback(() => {
        const lost = coinsRef.current.walletCoins;
        updateCoins(burnActiveBalance);
        return lost;
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
        const rawEarned = Math.min(maximum, Math.max(0, Math.floor(precise)));
        const earned = maximum===1000?settleArcade(rawEarned):rawEarned;
        bonusCarryRef.current =
            rawEarned >= maximum ? 0 : Math.max(0, precise - rawEarned);
        if (earned === 0)
            return 0;
        setBalancePulse((current) => current + 1);
        updateCoins((current) => ({
            walletCoins: current.walletCoins + earned,
            streakCoins: current.streakCoins + earned,
        }));
        return earned;
    }, [updateCoins,settleArcade]);
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
            updateAuraCoins(saved.auraCoins);ownedSkinsRef.current=saved.ownedSkins;setOwnedSkins(saved.ownedSkins);setActiveSkin(saved.activeSkin);
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
            arcadeProfitRef.current=saved.arcadeProfit;setArcadeProfit(saved.arcadeProfit);
            setFoodCount(saved.foodCount);
            setEndless(saved.endless);
            setStoryCompletedLevel(saved.storyCompletedLevel);
            setStoryWeaponTier(saved.storyWeaponTier);
            setNeighborhood(saved.neighborhood);
            laboratoryRef.current=saved.laboratory;setLaboratory(saved.laboratory);
            trainingRef.current=saved.combatTraining;setCombatTraining(saved.combatTraining);
            setHealCount(saved.healCount);
            setDrinkCount(saved.drinkCount);
            setPitbullCount(saved.pitbullCount);
            setColaCount(saved.colaCount);
            setTeaCount(saved.teaCount);
            setLimeCount(saved.limeCount);
            setMatchaCount(saved.matchaCount);
            setCasinoInventory(saved.casinoInventory);setCasinoStats(saved.casinoStats);
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

    }, [initialSave,updateAuraCoins]);
    useEffect(() => {
        settingsRef.current = settings;
        soundRef.current?.setEnabled(settings.sound);
        setFrameRateVisible(settings.showFps);
        setFrameRatePosition(settings.fpsPosition);
        setGraphicsQuality(settings.graphicsQuality);
        setVisualAccessibility({cameraShake:settings.cameraShake,contrastAim:settings.contrastAim});
        setVisualFpsLimit(settings.fpsLimit);
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
    useEffect(() => { boostUntilRef.current = boostUntil; }, [boostUntil]);
    useVisibleClock(() => {
        const now=Date.now();setClock(now);
        if(boostUntilRef.current&&now>=boostUntilRef.current){boostUntilRef.current=0;setBoostUntil(0);}
        if(fatigueUntilRef.current&&now>=fatigueUntilRef.current){
            fatigueUntilRef.current=0;setFatigueUntil(0);
            if(dogStateRef.current==='tired'){transitionTo('calm');resetSeries();}
        }
        setRiskFatigueUntil(current=>current&&current<=now?0:current);
    },1000,!!(boostUntil||fatigueUntil||riskFatigueUntil));
    const currentSave = useMemo<SaveData>(() => ({
        version: SAVE_VERSION,
        arcadeProfit,
        endless,
        laboratory,
        combatTraining,
        neighborhood,
        storyCheckpoint,
        storyCompletedLevel,
        storyWeaponTier,
        vaultCoins,
        auraCoins,ownedSkins,activeSkin,
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
        casinoInventory,casinoStats,
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
        endless,
        laboratory,
        combatTraining,
        neighborhood,
        fatigueUntil,
        storyCompletedLevel,
        storyWeaponTier,
        coins.walletCoins,
        arcadeProfit,
        boostUntil,
        foodCount,
        healCount,
        drinkCount,
        pitbullCount,
        colaCount,
        teaCount,
        limeCount,
        matchaCount,
        casinoInventory,casinoStats,
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
        auraCoins,ownedSkins,activeSkin,
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
    useEffect(() => () => {
        clearRoundTimers();
        for(const timer of particleTimersRef.current.values())clearTimeout(timer);
        particleTimersRef.current.clear();
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
        while(particleTimersRef.current.size>=9){const first=particleTimersRef.current.keys().next().value!;clearTimeout(particleTimersRef.current.get(first));particleTimersRef.current.delete(first);}
        const timer=setTimeout(()=>{particleTimersRef.current.delete(id);setParticles(current=>current.filter(particle=>particle.id!==id));},650);
        particleTimersRef.current.set(id,timer);
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
            if (ultraActiveRef.current && performance.now()-ultraUiStampRef.current>=33) {
                ultraUiStampRef.current=performance.now();
                setUltraCharge(Math.min(1, Math.max(0, (elapsed - ULTRA_VISUAL_DELAY_MS) /
                    (ULTRA_TAP_MIN_HOLD_MS - ULTRA_VISUAL_DELAY_MS))));
                setUltraPreview(elapsed >= ULTRA_TAP_MIN_HOLD_MS
                    ? arcadeSettlement(Math.min(1000,Math.floor(calculateUltraTapCoins(elapsed,ultraDeadlineRef.current,ultraTwoSecondRewardRef.current)*levelMultiplier(levelStateRef.current.level)*difficultyRewardMultiplier(difficultyRef.current))),0,coinsRef.current.walletCoins+vaultCoinsRef.current,arcadeProfitRef.current).payout
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
        const rawPayout = outcome.won
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
                const payout=mathematicallyWon?settleArcade(rawPayout,bet):0;
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
                        walletCoins: Math.min(Number.MAX_SAFE_INTEGER,current.walletCoins + payout),
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
        settleArcade,
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
        if (miniLedgerRef.current||casinoLedgerRef.current||drinkLedgerRef.current||shelfStockRef.current.pitbull < 1 ||
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
    const consumeAdventureSurge=useCallback(()=>{
        if(shelfStockRef.current.zhivchik<1)return false;
        shelfStockRef.current.zhivchik--;setDrinkCount(shelfStockRef.current.zhivchik);getSound().itemUse("drink");return true;
    },[getSound]);
    const collectAdventureBuff = useCallback((kind: AdventureLootBuff) => {
        if (shelfStockRef.current[kind] >= buffStockLimit(kind)) return false;
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
        if (miniLedgerRef.current || casinoLedgerRef.current || drinkLedgerRef.current || miniGame !== null || riskPhaseRef.current !== "normal" || holding || tutorialOpen)
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
    const startDrinkGame = useCallback((requestedBet:number=0) => {
        const ledger = drinkLedgerRef.current;
        if (!ledger || !Number.isSafeInteger(requestedBet) || requestedBet<0 || (mohawkEquipped&&requestedBet>coinsRef.current.walletCoins))
            return false;
        const bet=resolveSkillWager(coinsRef.current.walletCoins,requestedBet,mohawkEquipped);
        if (!commitDrinkRound(ledger, drinkInventoryRef.current[ledger.kind]))
            return false;
        ledger.bet=bet;
        if(bet>0)updateCoins(current=>({ ...current,walletCoins:current.walletCoins-bet,streakCoins:Math.max(0,current.streakCoins-bet) }));
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
    }, [mohawkEquipped,updateCoins]);
    const resolveDrinkGame = useCallback((kind: DrinkGameKind, requestedReward: number, requestedScore: number) => {
        const ledger = drinkLedgerRef.current;
        if (!ledger)
            return;
        const baseReward = settleDrinkRound(ledger, kind, requestedReward);
        if (baseReward === null) return;
        const score = Number.isFinite(requestedScore) ? Math.max(0, Math.floor(requestedScore)) : 0;
        const maximumScore=kind==="lime"?LIME_MAX_SCORE:kind==="matcha"?MEMORY_ROUNDS:1000;
        const payout=settleArcade(Math.min(Number.MAX_SAFE_INTEGER,baseReward+skillWagerPayout(ledger.bet??0,score,maximumScore)),ledger.bet??0);
        if (isBrainrotKind(kind)) setBrainrotStats(current => ({ ...current, [kind]: { ...current[kind], best: Math.max(current[kind].best, Math.min(1000, score)) } }));
        setDrinkGameStats(current => ({ ...current,
            limeBest: kind === "lime" ? Math.max(current.limeBest, Math.min(LIME_MAX_SCORE, score)) : current.limeBest,
            matchaBest: kind === "matcha" ? Math.max(current.matchaBest, Math.min(MEMORY_ROUNDS, score)) : current.matchaBest,
        }));
        if (payout > 0) {
            updateCoins(current => ({ ...current, walletCoins: Math.min(Number.MAX_SAFE_INTEGER,current.walletCoins + payout) }));
            setBalancePulse(current => current + 1);
            getSound().riskWin();
        }
        return payout;
    }, [getSound, updateCoins,settleArcade]);
    const closeDrinkGame = useCallback(() => {
        drinkLedgerRef.current = null;
        setDrinkGame(null);
    }, []);
    const replayDrinkGame=useCallback(()=>{
        const ledger=drinkLedgerRef.current;if(!ledger||ledger.phase!=="settled"||drinkInventoryRef.current[ledger.kind]<1)return;
        drinkLedgerRef.current={kind:ledger.kind,phase:"ready"};setDrinkSession(n=>n+1);
    },[]);
    const replayMiniGame=useCallback(()=>{
        const ledger=miniLedgerRef.current;if(!ledger||ledger.phase!=="settled"||dogStateRef.current!=="calm"||(!settingsRef.current.yellow&&fatigueUntilRef.current>Date.now())||shelfStockRef.current[ledger.kind==="slots"?"cocoa":"bergamot"]<1||coinsRef.current.walletCoins<1)return;
        miniLedgerRef.current={kind:ledger.kind,phase:"ready",bet:0};setMiniGameSession(n=>n+1);
    },[]);
    const openMiniGame = useCallback((kind: MiniGameKind) => {
        const itemCount = kind === "slots" ? colaCount : teaCount;
        if (itemCount < 1 ||
            miniLedgerRef.current!==null||casinoLedgerRef.current!==null||drinkLedgerRef.current!==null||miniGame !== null ||
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
        miniLedgerRef.current={kind,phase:"ready",bet:0};
        setMiniGameSession((current) => current + 1);
        setMiniGame(kind);
        getSound().itemUse("drink");
        vibrate([16, 24, 34], settingsRef.current.vibration);
    }, [colaCount, getSound, miniGame, showRiskNotice, teaCount]);
    const commitMiniGameBet = useCallback((kind: MiniGameKind, requestedBet: number) => {
        const ledger=miniLedgerRef.current;if(!ledger||ledger.kind!==kind||ledger.phase!=="ready")return false;
        const availableCoins = coinsRef.current.walletCoins;
        const bet = resolveMiniGameBet(availableCoins, requestedBet, mohawkEquipped);
        const itemKind = kind === "slots" ? "cocoa" : "bergamot";
        const hasItem = shelfStockRef.current[itemKind] > 0;
        if (!hasItem || bet < 1 || bet > availableCoins)
            return false;
        ledger.phase="playing";ledger.bet=bet;
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
        const ledger=miniLedgerRef.current;if(!ledger||ledger.kind!==kind||ledger.phase!=="playing")return;ledger.phase="settled";payout=settleArcade(payout,ledger.bet);
        if (payout > 0) {
            updateCoins((current) => ({
                ...current,
                walletCoins: Math.min(Number.MAX_SAFE_INTEGER,current.walletCoins + payout),
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
        return payout;
    }, [getSound, resetSeries, transitionTo, updateCoins,settleArcade]);
    const submitCheatCode = useCallback(() => {
        const normalizedCode = cheatCode.trim().toLowerCase();
        const [secretWord, amountToken, ...extraTokens] = normalizedCode.split(/\s+/);
        if (normalizedCode === "bulb") {
            const alreadyUnlocked = laboratoryRef.current.unlocked.length === LAB_RECIPES.length;
            const next = unlockAllLabRecipes(laboratoryRef.current);
            laboratoryRef.current = next;
            setLaboratory(next);
            setCheatCode("");
            setCheatMessage(alreadyUnlocked ? "Все напитки уже открыты" : "Все рецепты напитков разблокированы");
            getSound().safe();
            return;
        }
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
                    const next = Math.min(buffStockLimit(kind), stock[kind] + 1);
                    stock[kind] = next;
                    if (kind === "food") setFoodCount(next);
                    else if (kind === "heal") setHealCount(next);
                    else if (kind === "zhivchik") setDrinkCount(next);
                    else if (kind === "pitbull") setPitbullCount(next);
                    else if (kind === "cocoa") setColaCount(next);
                    else if (kind === "bergamot") setTeaCount(next);
                    else if (kind === "pepsi") setVitaPowerCount(next);
                    else if(isCasinoKind(kind))setCasinoInventory(current=>({...current,[kind]:next}));
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
                setColaCount(INVENTORY_LIMIT); setTeaCount(INVENTORY_LIMIT); setVitaPowerCount(buffStockLimit("pepsi"));
                setLimeCount(INVENTORY_LIMIT); setMatchaCount(INVENTORY_LIMIT);
                const premiumStock = { tralalero: INVENTORY_LIMIT, ballerina: INVENTORY_LIMIT, bombardiro: INVENTORY_LIMIT, verity: INVENTORY_LIMIT };
                setBrainrotInventory(premiumStock);setCasinoInventory(Object.fromEntries(Object.keys(createCasinoInventory()).map(k=>[k,INVENTORY_LIMIT])) as ReturnType<typeof createCasinoInventory>);
                drinkInventoryRef.current = { lime: INVENTORY_LIMIT, matcha: INVENTORY_LIMIT, ...premiumStock };
                finish("Добавлены 7 кейсов. Напитки и корм заполнены");
            } else if (secretWord === "godress") {
                setHatOwned(true); setMohawkOwned(true);
                setHatUpgradeTokens(current => Math.min(99, current + 5)); setMohawkUpgradeTokens(current => Math.min(99, current + 5));
                cosmeticOwnedRef.current = Object.keys(COSMETICS) as CosmeticId[]; setOwnedCosmetics(cosmeticOwnedRef.current);
                themesOwnedRef.current = Object.keys(THEMES) as ThemeId[]; setOwnedThemes(themesOwnedRef.current);
                finish("Вся коллекция открыта. Добавлены улучшения");
            } else if (secretWord === "gorest") {
                rest(); finish("Кнопик отдохнул");
            } else if (secretWord === "gospark") {
                triggerLevelBurst(); finish("Пиксельный салют!"); setSettingsOpen(false);
            } else if (secretWord === "gofxoff") {
                setRunnerCheats({ magnet: false, turbo: false });
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
        const auraReward=rewards.filter(r=>r.type==="aura").length;
        if(auraReward)updateAuraCoins(v=>Math.min(Number.MAX_SAFE_INTEGER,v+auraReward));
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
        setVitaPowerCount((current) => Math.min(buffStockLimit("pepsi"), current + buffAmount("shield")));
        const hatUpgrades = rewards.filter(reward => (reward.type === "upgrade" || reward.type === "item") && reward.kind === "hat").length;
        const mohawkUpgrades = rewards.filter(reward => (reward.type === "upgrade" || reward.type === "item") && reward.kind === "mohawk").length;
        if (hatUpgrades > 0) setHatUpgradeTokens(current => Math.min(99, current + hatUpgrades));
        if (mohawkUpgrades > 0) setMohawkUpgradeTokens(current => Math.min(99, current + mohawkUpgrades));
    }, [updateCoins,updateAuraCoins]);
    const claimLevelReward = useCallback((level: number,silent=false): string | null => {
        if (level > levelStateRef.current.level || level < 1 || claimedRewardsRef.current.includes(level)) return null;
        const reward = progressReward(level);
        if (reward.type === "case" && (reward.kind === "common" ? commonCases : bigCases) + reward.amount > 99) return null;
        if (reward.type === "buff") {
            const counts = { food: foodCount, drink: drinkCount, pitbull: pitbullCount, cola: colaCount, tea: teaCount, shield: vitaPowerCount };
            if (counts[reward.kind] + reward.amount > (reward.kind === "shield" ? buffStockLimit("pepsi") : INVENTORY_LIMIT)) return null;
        }
        claimedRewardsRef.current = [...claimedRewardsRef.current, level];
        setClaimedLevelRewards(claimedRewardsRef.current);
        let label = reward.label;
        if (reward.type === "case") {
            (reward.kind === "common" ? setCommonCases : setBigCases)(count => count + reward.amount);
        } else if (reward.type === "cosmetic") {
            label = `Предмет «${COSMETICS[reward.kind].name}» открыт в магазине`;
        } else if (reward.type === "item") {
            label = `${reward.kind === "hat" ? "Тюбетейка Хасбика" : "Ирокез"}: доступно в магазине`;
        } else if (reward.type === "theme") {
            // Reaching this level unlocks a purchase, never grants ownership for free.
            label = `Оформление «${THEMES[reward.kind].name}» открыто в магазине`;
        } else applyCaseRewards([reward]);
        if(!silent){getSound().levelUp();vibrate([20,28,45],settingsRef.current.vibration);}
        return reward.type === "theme" || reward.type === "cosmetic" || reward.type === "item" ? label : label + " получено";
    }, [applyCaseRewards, commonCases, bigCases, foodCount, drinkCount, pitbullCount, colaCount, teaCount, vitaPowerCount, getSound]);
    const claimAllLevelRewards=()=>{
        const plan=planProgressClaims(levelStateRef.current.level,claimedRewardsRef.current,{common:commonCases,big:bigCases,food:foodCount,drink:drinkCount,pitbull:pitbullCount,cola:colaCount,tea:teaCount,shield:vitaPowerCount});
        let count=0;for(const level of plan.levels)if(claimLevelReward(level,true))count++;
        if(count){getSound().levelUp();vibrate([20,28,45],settingsRef.current.vibration);}
        return count?`Получено наград: ${count}${plan.blocked.length?`. Осталось ${plan.blocked.length}: освободи место в запасе`:""}`:"Освободи место в запасе — награды сохранятся";
    };
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
        if (computerOpen) {
            if (holdingRef.current) stopHoldVisual("cancel");
            setShopOpen(index === 0);
            setSettingsOpen(index === 2);
            setResetConfirmOpen(false);
            return;
        }
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
    }, [resetSeries, stopHoldVisual, computerOpen]);
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
    const buyOrSelectSkin=useCallback((skin:KnopikSkin)=>{
        const result=purchaseKnopikSkin(ownedSkinsRef.current,auraCoinsRef.current,skin);
        if(!result){setShopMessage("Нужно 49 AURA для покупки скина");return;}
        ownedSkinsRef.current=result.ownedSkins;updateAuraCoins(result.auraCoins);setOwnedSkins(result.ownedSkins);setActiveSkin(result.activeSkin);
        setShopMessage(KNOPIK_SKINS[skin].name+" · скин выбран");getSound().purchase();
    },[getSound,updateAuraCoins]);
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
        if(kind!=="bandana"&&kind!=="charm")return;
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
            setShopMessage("Ирокез куплен и надет");
        }
        else {
            setMohawkEquipped((current) => {
                if (!current)
                    setHatEquipped(false);
                return !current;
            });
            setShopMessage(mohawkEquipped ? "Ирокез снят" : "Ирокез надет");
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
        if (riskPhaseRef.current !== "normal" || miniGame !== null || drinkGame !== null || casinoGame !== null || holdingRef.current || tutorialOpen || adventureOpen&&!apartmentBarOpen || homePanel!==null || neighborhoodOpen || runnerOpen) return false;
        const stock = shelfStockRef.current[kind];
        if(!canBuyLabDrink(laboratoryRef.current,kind)){showRiskNotice("Сначала приготовь напиток в лаборатории");return false;}
        if (stock >= buffStockLimit(kind)) { showRiskNotice(`В запасе уже ${buffStockLimit(kind)} штук`); return false; }
        const purchase = purchaseShelfBuff(kind, stock, coinsRef.current.walletCoins, vaultCoinsRef.current,laboratoryRef.current);
        if (!purchase) { showRiskNotice(`Нужно ${BUFF_CATALOG[kind].price.toLocaleString("ru-RU")} активных KC`); return false; }
        shelfStockRef.current[kind] = purchase.count;
        updateCoins(current => ({ ...current, walletCoins: purchase.walletCoins }));
        if (kind === "food") setFoodCount(purchase.count);
        else if (kind === "heal") setHealCount(purchase.count);
        else if (kind === "zhivchik") setDrinkCount(purchase.count);
        else if (kind === "pitbull") setPitbullCount(purchase.count);
        else if (kind === "cocoa") setColaCount(purchase.count);
        else if (kind === "bergamot") setTeaCount(purchase.count);
        else if (kind === "pepsi") setVitaPowerCount(purchase.count);
        else if(isCasinoKind(kind))setCasinoInventory(current=>({...current,[kind]:purchase.count}));
        else {
            drinkInventoryRef.current[kind] = purchase.count;
            if (kind === "lime") setLimeCount(purchase.count);
            else if (kind === "matcha") setMatchaCount(purchase.count);
            else setBrainrotInventory(current => ({ ...current, [kind]: purchase.count }));
        }
        getSound().purchase();
        vibrate(16, settingsRef.current.vibration);
        return true;
    }, [adventureOpen,apartmentBarOpen,homePanel, neighborhoodOpen, runnerOpen, drinkGame, casinoGame, getSound, miniGame, showRiskNotice, tutorialOpen, updateCoins]);
    const updateLaboratory=useCallback((next:LaboratoryProgress)=>{laboratoryRef.current=next;setLaboratory(next);},[]);
    const setCraftedStock=useCallback((kind:LabRecipeId,count:number)=>{
        shelfStockRef.current[kind]=count;
        if(isCasinoKind(kind))setCasinoInventory(current=>({...current,[kind]:count}));
        else if(kind==="pitbull")setPitbullCount(count);
        else if(kind==="cocoa")setColaCount(count);
        else if(kind==="bergamot")setTeaCount(count);
        else if(kind==="zhivchik")setDrinkCount(count);
        else if(kind==="pepsi")setVitaPowerCount(count);
        else if(kind==="heal")setHealCount(count);
        else {drinkInventoryRef.current[kind]=count;if(kind==="lime")setLimeCount(count);else if(kind==="matcha")setMatchaCount(count);else setBrainrotInventory(current=>({...current,[kind]:count}));}
    },[]);
    const openCasinoGame=useCallback((kind:CasinoKind)=>{
        if(miniLedgerRef.current||casinoLedgerRef.current||drinkLedgerRef.current||miniGame!==null||riskPhaseRef.current!=="normal"||holdingRef.current||tutorialOpen)return;
        if(barDrinkBlock(kind,shelfStockRef.current[kind],coinsRef.current.walletCoins,!settingsRef.current.yellow&&fatigueUntilRef.current>Date.now()||dogStateRef.current!=="calm",false))return;
        casinoLedgerRef.current={kind,phase:"ready",bet:0,doubled:false};setCasinoSession(n=>n+1);setCasinoGame(kind);resetSeries();getSound().itemUse("drink");
    },[miniGame,tutorialOpen,resetSeries,getSound]);
    const commitCasino=useCallback((kind:CasinoKind,bet:number)=>{
        const ledger=casinoLedgerRef.current;if(!ledger||ledger.kind!==kind||!commitCasinoRound(ledger,shelfStockRef.current[kind],coinsRef.current.walletCoins,bet))return false;
        setCraftedStock(kind,shelfStockRef.current[kind]-1);updateCoins(c=>({...c,walletCoins:c.walletCoins-bet,streakCoins:Math.max(0,c.streakCoins-bet)}));setCasinoStats(c=>({...c,[kind]:{...c[kind],plays:c[kind].plays+1}}));return true;
    },[setCraftedStock,updateCoins]);
    const doubleCasino=useCallback((kind:CasinoKind,bet:number)=>{
        const ledger=casinoLedgerRef.current;if(!ledger||ledger.kind!==kind||!doubleCasinoRound(ledger,coinsRef.current.walletCoins,bet))return false;
        updateCoins(c=>({...c,walletCoins:c.walletCoins-bet,streakCoins:Math.max(0,c.streakCoins-bet)}));return true;
    },[updateCoins]);
    const resolveCasino=useCallback((kind:CasinoKind,requested:number)=>{
        const ledger=casinoLedgerRef.current;if(!ledger)return;const raw=settleCasinoRound(ledger,kind,requested);if(raw===null)return;const amount=settleArcade(raw,ledger.bet);
        if(amount)updateCoins(c=>({...c,walletCoins:Math.min(Number.MAX_SAFE_INTEGER,c.walletCoins+amount)}));setCasinoStats(c=>({...c,[kind]:{...c[kind],wins:c[kind].wins+(amount>ledger.bet?1:0),best:Math.max(c[kind].best,amount)}}));
        return amount;
    },[updateCoins,settleArcade]);
    const closeCasino=useCallback(()=>{casinoLedgerRef.current=null;setCasinoGame(null);},[]);

    const startBrew=useCallback((id:LabRecipeId)=>{if(homePanel!=="laboratory"||(!adventureOpen&&!arcadeOpen))return false;const next=startLaboratoryBrew(laboratoryRef.current,id,Date.now(),shelfStockRef.current[id]);if(!next)return false;updateLaboratory(next);getSound().itemUse("drink");return true;},[homePanel,adventureOpen,arcadeOpen,updateLaboratory,getSound]);
    const careBrew=useCallback(()=>{if(homePanel!=="laboratory")return false;const next=careForBrew(laboratoryRef.current,Date.now());if(!next)return false;updateLaboratory(next);getSound().adventure("coin");return true;},[homePanel,updateLaboratory,getSound]);
    const claimBrew=useCallback(()=>{if(homePanel!=="laboratory"||!laboratoryRef.current.job)return false;const result=claimLaboratoryBrew(laboratoryRef.current,Date.now(),shelfStockRef.current[laboratoryRef.current.job.recipe]);if(!result)return false;setCraftedStock(result.recipe,result.stock);updateLaboratory(result.progress);getSound().unlock();return true;},[homePanel,setCraftedStock,updateLaboratory,getSound]);
    const gatherMaterial=useCallback((id:LabSourceId)=>{const next=harvestLaboratory(laboratoryRef.current,id,Date.now());if(!next)return false;updateLaboratory(next);return true;},[updateLaboratory]);
    const canGatherMaterial=useCallback((id:LabSourceId)=>canHarvest(laboratoryRef.current,id,Date.now()),[]);
    const collectLabChest=useCallback((level:number,room:number)=>{const next=collectLaboratoryChest(laboratoryRef.current,level,room);if(next)updateLaboratory(next);},[updateLaboratory]);
    const collectDungeonIngredient=useCallback((level:number,room:number,material:LabMaterial)=>{const next=collectLaboratoryIngredient(laboratoryRef.current,level,room,material);if(!next)return false;updateLaboratory(next);return true;},[updateLaboratory]);
    const applyWardrobe=useCallback((next:KnopikEquipment)=>{setMohawkEquipped(mohawkOwned&&next.mohawk);setHatEquipped(hatOwned&&next.hat&&!next.mohawk);cosmeticRef.current=next.accessory&&cosmeticOwnedRef.current.includes(next.accessory)?next.accessory:null;setEquippedCosmetic(cosmeticRef.current);getSound().adventure("door");},[hatOwned,mohawkOwned,getSound]);
    const giveCombatKit=useCallback(()=>{const result=grantCombatTrainingKit(trainingRef.current,shelfStockRef.current);if(!result)return;trainingRef.current=result.training;setCombatTraining(result.training);Object.assign(shelfStockRef.current,result.stock);setHealCount(result.stock.heal);setVitaPowerCount(result.stock.pepsi);setDrinkCount(result.stock.zhivchik);},[]);
    const progressCombatTraining=useCallback((step:number)=>{const next=advanceCombatTraining(trainingRef.current,step);trainingRef.current=next;setCombatTraining(next);},[]);
    const finishTutorial = useCallback(() => {
        setTutorialSeen(true);
        setTutorialOpen(false);
        setTutorialStep(0);
    }, []);
    const resetProgress = useCallback(() => {
        clearRoundTimers();
        stopHoldVisual("cancel");
        const defaults = createDefaultSave();
        // Reset every world, including the persistent street engine carried into Run.
        // Force fresh simulations even if a world was mounted before the reset.
        setStreetEngine(undefined);
        setNeighborhoodOpen(false);
        setNeighborhood(defaults.neighborhood);
        setHomeFromStreet(false);
        setWorldResetEpoch(epoch=>epoch+1);
        laboratoryRef.current=defaults.laboratory;setLaboratory(defaults.laboratory);trainingRef.current=defaults.combatTraining;setCombatTraining(defaults.combatTraining);setHomePanel(null);
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
        updateAuraCoins(0);ownedSkinsRef.current=["classic"];setOwnedSkins(["classic"]);setActiveSkin("classic");
        vaultCoinsRef.current = 0;
        setOwnedCosmetics([]);
        cosmeticLevelsRef.current = {'sky-boots':1,'ranger-hood':1,'hunter-armor':1,'raven-mask':1,'hunter-cloak':1,bandana:1,charm:1,goggles:1,cape:1};
        setCosmeticLevels(cosmeticLevelsRef.current);
        cosmeticOwnedRef.current = [];
        setEquippedCosmetic(null);
        cosmeticRef.current = null;
        setOwnedThemes(["classic"]);
        themesOwnedRef.current = ["classic"];
        setActiveTheme("classic");
        arcadeProfitRef.current=0;setArcadeProfit(0);
        setFoodCount(0);
        setEndless(defaultEndlessProgress());
        setStoryCompletedLevel(0);
        setStoryWeaponTier(0);
        setHealCount(0);
        setDrinkCount(0);
        setPitbullCount(0);
        setColaCount(0);
        setTeaCount(0);
        setLimeCount(0);
        setMatchaCount(0);
        setCasinoInventory(createCasinoInventory());setCasinoStats(createCasinoStats());setCasinoGame(null);casinoLedgerRef.current=null;setArcadeOpen(false);
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
        miniLedgerRef.current=null;setMiniGame(null);
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
        // Save the complete reset immediately; otherwise a stale cloud snapshot
        // or street visit may revive progress on the next app launch.
        localStorage.setItem(SAVE_KEY,JSON.stringify(defaults));
        onSave(defaults);
        void onRetrySave(); // Submit reset to the current account without waiting for debounce.
    }, [
        onSave,
        updateAuraCoins,
        onRetrySave,
        clearRoundTimers,
        resetSeries,
        stopHoldVisual,
        transitionRisk,
        transitionTo,
    ]);
    // A normal tap briefly sets `holding`; it must not toggle the vault button.
    const vaultLocked = runnerOpen || dogState !== "calm" || riskPhase !== "normal" || miniGame !== null || drinkGame !== null || casinoGame !== null;
    const isDogTired = !settings.yellow &&
        (dogState === "tired" ||
            (dogState === "recovering" && fatigueUntil > clock));
    const isDogResting = !settings.yellow && fatigueUntil > clock;
    const canFeedDog = isDogTired && foodCount > 0;
    const exchangeAura=useCallback(()=>{const c=coinsRef.current;if(c.walletCoins<1000)return;updateCoins(v=>({...v,walletCoins:v.walletCoins-1000}));updateAuraCoins(v=>Math.min(Number.MAX_SAFE_INTEGER,v+1));getSound().purchase();},[updateCoins,getSound,updateAuraCoins]);
    const canSave = !vaultLocked && coins.walletCoins >= 2;
    const saveAmount = Math.floor(coins.walletCoins / 2);
    const hatLocked = !hatOwned && levelState.level < CLOTHING_UNLOCK_LEVELS.hat;
    const mohawkLocked = !mohawkOwned && levelState.level < CLOTHING_UNLOCK_LEVELS.mohawk;
    const canBuyHat = hatOwned || (!hatLocked && vaultCoins >= HASBIK_HAT_PRICE);
    const canBuyMohawk = mohawkOwned || (!mohawkLocked && vaultCoins >= MOHAWK_PRICE);
    const boostSeconds = Math.max(0, Math.ceil((boostUntil - clock) / 1000));
    const selectedRiskMultiplier = Math.round(riskMultiplier(riskChance) * (mohawkEquipped ? MOHAWK_RISK_BONUS + (mohawkLevel - 1) * .02 : 1) * 100) / 100;
    const riskMode = riskPhase !== "normal";
    const canBuyShelfBuff = (kind: PotionKind, count: number) => canBuyLabDrink(laboratory,kind) && count < buffStockLimit(kind) && coins.walletCoins >= BUFF_CATALOG[kind].price && !holding && !tutorialOpen && !riskMode && miniGame === null && drinkGame === null && casinoGame === null;
    const navIndex = computerOpen ? (shopOpen ? 0 : settingsOpen ? 2 : 1) : shopOpen ? 0 : runnerOpen || adventureOpen || neighborhoodOpen ? 2 : 1;
    const pendingLevelRewards = Math.max(0, levelState.level - claimedLevelRewards.filter(level => level <= levelState.level).length);
    const isHappy = dogState === "calm" && seriesTaps >= 3 && averageInterval <= 360;
    useEffect(() => {
        shelfStockRef.current = { food: foodCount, heal: healCount, zhivchik: drinkCount, pitbull: pitbullCount, cocoa: colaCount, bergamot: teaCount, pepsi: vitaPowerCount, lime: limeCount, matcha: matchaCount, ...brainrotInventory, ...casinoInventory };
    }, [foodCount, healCount, drinkCount, pitbullCount, colaCount, teaCount, vitaPowerCount, limeCount, matchaCount, brainrotInventory,casinoInventory]);
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
        casinoGame !== null || arcadeOpen ||
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
    useEffect(() => {
        const pop = () => setRunnerOpen(window.location.pathname.replace(/\/$/, "").endsWith("/run"));
        window.addEventListener("popstate", pop);
        return () => window.removeEventListener("popstate", pop);
    }, []);
    const barDrinks=useMemo<ArcadeDrink[]>(()=>ARCADE_DRINKS,[ ]);
    const inGameSettings=adventureOpen||neighborhoodOpen||runnerOpen;
    const navigateSettings=(index:number)=>{
      if(index===2)return;
      if(holdingRef.current)stopHoldVisual("cancel");
      setSettingsOpen(false);setShopOpen(index===0);setComputerOpen(true);
      setAdventureOpen(false);setNeighborhoodOpen(false);setRunnerOpen(false);
      setHomePanel(null);setApartmentBarOpen(false);setResetConfirmOpen(false);
      window.history.replaceState(null,"",(process.env.NEXT_PUBLIC_BASE_PATH??"")+"/");
    };
    const settingsDialog=settingsOpen?<GameModal className={`modal-backdrop settings-backdrop pixel-game theme-${activeTheme}`} label="Настройки" onDismiss={() => setSettingsOpen(false)}>
          <div className="settings-page-layout">
          <section className="sheet settings-sheet go-settings-sheet" aria-label="Параметры игры">

            <div className="account-settings">
              <div className="account-summary">
                <span className="account-avatar" aria-hidden="true">{account.username.slice(0, 1).toUpperCase()}</span>
                <div>
                  <strong>{account.username}{account.isAdmin && <small className="settings-admin-badge">АДМИН</small>}</strong>
                  <span>{syncState === "saved" ? "Прогресс сохранён" : syncState === "saving" ? "Сохранение в облако…" : syncState === "offline" ? "Сохранено на телефоне · без сети" : syncState === "conflict" ? "Конфликт версий" : "Сохранено на устройстве · синхронизация позже"}</span>
                  {syncState === "error" && <button className="settings-sync-retry" type="button" onClick={() => void onRetrySave()}>Повторить синхронизацию</button>}
                </div>
              </div>
              <button className="settings-sign-out" type="button" disabled={accountPending} onClick={() => void signOutAccount()}>Выйти</button>
            </div>
            {!inGameSettings&&<button type="button" className="settings-action" onClick={()=>{getSound().unlock();setSettingsOpen(false);setCoopOpen(true);}}>Играть вдвоём <span>ОНЛАЙН</span></button>}
            <OfflineDownloadStatus/>
            <GamePreferences settings={settings} onChange={setSettings}/>
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
            {!inGameSettings && <details className="settings-fold"><summary>Дополнительно<span>＋</span></summary>
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
            </details>}
            <p className="settings-section-title">Статистика</p>
            <div className="stats-line"><span>ЛУЧШАЯ СЕРИЯ <strong>{stats.bestStreak}</strong></span><span>ТАПОВ <strong>{stats.totalTaps}</strong></span><span>УКУСОВ <strong>{stats.totalBites}</strong></span></div>
            {inGameSettings&&<button className="preferences-done" type="button" onClick={()=>setSettingsOpen(false)}>Вернуться к паузе</button>}
          </section>
          <BottomNavigation computer activeIndex={2} onSelect={navigateSettings} />
          </div>
        </GameModal>:null;
    const settingsAccess=useMemo(()=>({active:settingsOpen,open:()=>setSettingsOpen(true)}),[settingsOpen]);
    if(coopOpen)return <CoopLobby equipment={{skin:activeSkin,hat:hatOwned&&hatEquipped,mohawk:mohawkOwned&&mohawkEquipped,accessory:equippedCosmetic}} account={account} theme={activeTheme} fpsLimit={settings.fpsLimit} worldGraphics={graphicsModes(settings.graphicsQuality).world} onSound={kind=>getSound().adventure(kind)} onClose={()=>setCoopOpen(false)}/>;
    if(!launchStarted)return <GameLaunch onPlay={()=>{getSound().unlock();setLaunchStarted(true);}} onCoop={()=>{getSound().unlock();setCoopOpen(true);}}/>;
    if (runnerOpen) return <GameSettingsAccess.Provider value={settingsAccess}><main className="runner-isolated-page">
      <RunnerGame fromStreet={neighborhoodOpen} balance={coins.walletCoins} best={runnerStats.runnerBest} boostUntil={boostUntil}
        options={{skin:activeSkin,accessory:equippedCosmetic,night:(activeTheme==="night"||activeTheme==="observatory"), collar:equippedCosmetic==="charm", collarLevel:cosmeticLevels.charm, immortal:account.isAdmin&&settings.suliman, magnet:account.isAdmin&&runnerCheats.magnet, turbo:account.isAdmin&&runnerCheats.turbo, homeShield:vitaPowerShield}}
        graphics={graphicsModes(settings.graphicsQuality).runner} fpsLimit={settings.fpsLimit} vibration={settings.vibration} getSound={getSound} onCollect={collectRunnerCoins} onFinish={finishRunner} onHomeShieldUsed={consumeActiveShield}
        onClose={() => {
          setRunnerOpen(false);
          window.history.replaceState(null, "", (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + "/");
          if (!neighborhoodOpen) setAdventureOpen(true);
        }}/>
    </main>{settingsDialog}</GameSettingsAccess.Provider>;
    const barStock={food:foodCount,zhivchik:drinkCount,pepsi:vitaPowerCount,heal:healCount,pitbull:pitbullCount,cocoa:colaCount,bergamot:teaCount,lime:limeCount,matcha:matchaCount,...brainrotInventory,...casinoInventory};
    const apartmentShelf=<ApartmentBottleShelf>{barDrinks.map(kind=>{
      const count=barStock[kind]??0;
      const useReason=barDrinkBlock(kind,count,coins.walletCoins,isDogResting||dogState!=="calm",holding||tutorialOpen);
      return <BuffShelfItem variant="bar" key={kind} kind={kind} count={count} recipeLocked={!canBuyLabDrink(laboratory,kind)} useReason={useReason} canUse={!useReason} canBuy={canBuyShelfBuff(kind,count)} onUse={()=>{
        getSound().unlock();
        if(kind==="pitbull")activatePitbull();
        else if(kind==="cocoa")openMiniGame("slots");
        else if(kind==="bergamot")openMiniGame("mines");
        else if(isCasinoKind(kind))openCasinoGame(kind);
        else openDrinkGame(kind);
      }} onBuy={()=>buyShelfBuff(kind)}/>;
    })}</ApartmentBottleShelf>;
    const openComputer=()=>{
      setFromComputer(false);setComputerOpen(true);setAdventureOpen(false);setArcadeOpen(false);
      setShopOpen(false);setSettingsOpen(false);setRunnerOpen(false);
    };
    const leaveComputer=()=>{
      setShopOpen(false);setSettingsOpen(false);setComputerOpen(false);setArcadeOpen(false);
      setFromComputer(true);setHomeFromStreet(false);
      setAdventureOpen(true);
    };
    const returnToApartment = () => { setApartmentBarOpen(false); setHomePanel(null); setLabSelection(undefined);if(!arcadeOpen)setAdventureOpen(true); };
    return (<GameSettingsAccess.Provider value={settingsAccess}><ArcadeEconomyContext.Provider value={{wealth:coins.walletCoins+vaultCoins,profit:arcadeProfit}}><main className={`game-shell pixel-game theme-${activeTheme} state-${dogState} ${fatigueRatio > 0 ? "has-fatigue" : ""} ${holding ? "is-holding" : ""} ${ultraActive ? "ultra-active" : ""} ${biteFlash ? "bite-flash" : ""} ${paleCalm ? "pale-calm" : ""} ${dogState === "calm" && joyFrame > 0 ? "is-happy" : ""} ${isEmotionShifting ? "is-emotion-shifting" : ""} ${riskMode ? `risk-mode risk-${riskPhase}` : ""} ${riskPhase === "transition" && riskResult ? "risk-returning" : ""} ${riskShake > 0 ? `risk-shake-${riskShake % 2}` : ""} ${saveFlight ? "vault-celebrating" : ""}`} data-runner-open={runnerOpen ? "true" : undefined} data-state={dogState} data-hydrated={hydrated} data-theme-mood={backgroundMood} style={gameStyle} onPointerDownCapture={handleInterfacePress}>
      <link rel="preload" as="image" href={SAHUR_ATLAS_URL}/><link rel="preload" as="image" href={SAHUR_GUN_ATLAS_URL}/>
      <RunnerBackdrop frozen={runnerOpen || adventureOpen || neighborhoodOpen || apartmentBarOpen || arcadeOpen || casinoGame!==null || homePanel!==null}><div className="theme-decor" aria-hidden="true">
        <PixelScene theme={activeTheme} mood={backgroundMood}/><span className="skyline-tempo-tint" style={{opacity:backgroundBlue}}/>
      </div>
      <div className={`ultra-fire ${ultraFarming ? "is-farming" : ""}`} aria-hidden="true">
        {<PixelUltraEffects />}
        
      </div>
      <div className="game-motion-layer">
      <header className="app-header">
        <div className="top-bar">
          {computerOpen ? <button type="button" className="computer-exit" aria-label="Выйти из компьютера" title="Выйти из компьютера" onClick={leaveComputer}><svg viewBox="0 0 24 24" aria-hidden="true" shapeRendering="crispEdges"><path d="M4 4h5v5h6V4h5v5h-5v6h5v5h-5v-5H9v5H4v-5h5V9H4Z" fill="currentColor"/></svg></button> : <button className="account-identity" type="button" aria-label="Открыть аккаунт и настройки" onClick={() => {
            setShopOpen(false);
            setRunnerOpen(false);
            setSettingsOpen(true);
        }}>
              <span className="account-shortcut" aria-hidden="true">{account.username.slice(0, 1).toUpperCase()}</span>
              <strong>{account.username}</strong>
          </button>}
          <div className="wordmark brand-lockup" aria-label="Knopik GO">{<PixelLogo />}</div>
        </div>
        {!riskMode && <div className={`tap-quick-actions ${computerOpen ? "has-arcade" : ""}`}>
          {computerOpen && <button className="computer-arcade-shortcut tap-quick-button" type="button" onClick={()=>{stopHoldVisual("cancel");getSound().unlock();setArcadeOpen(true);}} aria-label="Открыть выбор напитков и игр">
            <span className="tap-quick-icon" aria-hidden="true"><svg viewBox="0 0 24 28" shapeRendering="crispEdges"><path d="M8 1h8v3h-1v5l4 4v13H5V13l4-4V4H8Z" fill="currentColor"/><path d="M11 4h2v6l4 4v10H7V14l4-4Z" fill="#fff1d1"/><path d="M8 16h8v7H8Z" fill="currentColor"/><path d="M9 13h2v5H9Z" fill="#fff1d1"/></svg></span>
            <span className="tap-quick-title">Напитки</span>
            <span className="tap-quick-detail" aria-hidden="true"><svg viewBox="0 0 16 16" shapeRendering="crispEdges"><path d="M5 3h3v3h3v4H8v3H5v-3h3V6H5Z" fill="currentColor"/></svg></span>
          </button>}
          <button type="button" className="progress-compact tap-quick-button" onClick={() => { getSound().unlock(); setProgressOpen(true); }} aria-label={`Путь прогресса. Уровень ${levelState.level}. Наград доступно: ${pendingLevelRewards}`}>
              <span className="progress-lvl tap-quick-icon"><small>LVL</small><strong>{levelState.level}</strong></span>
              <span className="progress-compact-title tap-quick-title">Прогресс</span>
              <span className={`progress-reward-button tap-quick-detail ${pendingLevelRewards ? "has-reward" : ""}`}><CaseArtwork kind="common"/>{pendingLevelRewards > 0 && <b>{pendingLevelRewards}</b>}</span>
          </button>
        </div>}
        {!riskMode && miniGame === null && drinkGame === null && casinoGame === null && <DrinkShelf className="main-quick-buffs">
          <BuffShelfItem kind="food" artwork={<QuickBuffArtwork kind="food"/>} count={foodCount} canUse={canFeedDog && !holding} canBuy={canBuyShelfBuff("food", foodCount)} onUse={feedDog} onBuy={() => buyShelfBuff("food")} />
          <BuffShelfItem kind="zhivchik" recipeLocked={!canBuyLabDrink(laboratory,"zhivchik")} artwork={<QuickBuffArtwork kind="zhivchik"/>} count={drinkCount} canUse={drinkCount > 0 && !holding} canBuy={canBuyShelfBuff("zhivchik", drinkCount)} active={boostSeconds > 0} status={boostSeconds > 0 ? `${boostSeconds}с` : undefined} onUse={activateDrink} onBuy={() => buyShelfBuff("zhivchik")} />
          <BuffShelfItem kind="pepsi" recipeLocked={!canBuyLabDrink(laboratory,"pepsi")} artwork={<QuickBuffArtwork kind="pepsi"/>} count={vitaPowerCount} canUse={vitaPowerCount > 0 && !vitaPowerShield && !holding} canBuy={canBuyShelfBuff("pepsi", vitaPowerCount)} active={vitaPowerShield} status={vitaPowerShield ? "✓" : undefined} onUse={activateVitaPower} onBuy={() => buyShelfBuff("pepsi")} />
          <BuffShelfItem kind="heal" recipeLocked={!canBuyLabDrink(laboratory,"heal")} artwork={<QuickBuffArtwork kind="heal"/>} count={healCount} canUse={false} canBuy={canBuyShelfBuff("heal", healCount)} onUse={() => {}} onBuy={() => buyShelfBuff("heal")} />
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
            {vitaPowerShield && <span className="vita-shield-ring" aria-hidden="true"><TapPixelShield/></span>}
            {shieldBreakVisible && <span className="vita-shield-break" aria-hidden="true">{<PixelBurst kind="tap" count={48}/>}</span>}
            <span className="dog-images" data-image-state={dogImageState}>
              {<PixelDog skin={activeSkin} ears outfit={{accessory:equippedCosmetic,hat:hatOwned&&hatEquipped,mohawk:mohawkOwned&&mohawkEquipped,hatBounce,mohawkSwing}} boosted={boostSeconds > 0} laserEyes={biteFlash} mood={dogImageState} joy={joyFrame} rage={showRageSequence ? rageFrame : 0}/>}
            </span>
            {biteFlash && <PixelEyeLasers portrait/>}
            <span className="dog-ears" aria-hidden="true">
              {hatOwned && hatEquipped && (<>
                  <span className="hat-hit-zone" onPointerDown={bounceHat} onPointerUp={(event) => event.stopPropagation()} onPointerCancel={(event) => event.stopPropagation()}/>
                </>)}
              {mohawkOwned && mohawkEquipped && (<>
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
          <TapBalances active={coins.walletCoins} aura={auraCoins} pulse={balancePulse}/>
          {riskMessage && <p className="risk-notice" key={`risk-notice-${riskShake}`}>{riskMessage}</p>}
          <VaultSwipe vault={vaultCoins} amount={saveFlight?.amount ?? saveAmount} disabled={!canSave || Boolean(saveFlight)} depositing={Boolean(saveFlight)} onTransfer={saveAllToVault}/>
        </div>
      </section>

      {!shopOpen&&!settingsOpen&&<BottomNavigation computer={computerOpen} activeIndex={navIndex} onSelect={clickNavigation} onPointerDown={handleNavigationDown} onPointerMove={handleNavigationMove}/>}
      </div>

      </RunnerBackdrop>
      {hydrated && adventureOpen && <AdventureGame onCoop={()=>{getSound().unlock();setCoopOpen(true);}} key={worldResetEpoch} endlessProgress={endless} onEndlessProgress={setEndless} combatTraining={combatTraining} onTrainingStep={progressCombatTraining} onTrainingKit={giveCombatKit} suspended={apartmentBarOpen||homePanel!==null||miniGame!==null||drinkGame!==null||casinoGame!==null||riskMode} fromStreet={homeFromStreet} fromComputer={fromComputer} vaultBalance={vaultCoins} barDrinks={barDrinks} brewing={!!laboratory.job} onHomePanel={setHomePanel} onLaboratoryChest={collectLabChest} onLaboratoryIngredient={collectDungeonIngredient} claimedIngredients={laboratory.chests} worldGraphics={graphicsModes(settings.graphicsQuality).world} fpsLimit={settings.fpsLimit} equipment={{skin:activeSkin,hat:hatOwned&&hatEquipped,mohawk:mohawkOwned&&mohawkEquipped,accessory:equippedCosmetic}} keepsakes={neighborhood} theme={activeTheme} immortal={settings.suliman} completedLevel={storyCompletedLevel} weaponTier={storyWeaponTier} onLevelComplete={level=>setStoryCompletedLevel(current=>Math.max(current,level))} onUnlockWeapon={tier=>setStoryWeaponTier(current=>Math.max(current,tier))} onCollect={collectRunnerCoins} onLootBuff={collectAdventureBuff} onAura={amount=>updateAuraCoins(v=>Math.min(Number.MAX_SAFE_INTEGER,v+amount))} checkpoint={storyCheckpoint} balance={coins.walletCoins} onDeath={burnAdventureWallet} healCount={healCount} shieldCount={vitaPowerCount} shieldActive={vitaPowerShield} surgeCount={drinkCount} onConsumeSurge={consumeAdventureSurge} onConsumeHeal={consumeAdventureHeal} onActivateShield={activateVitaPower} onShieldUsed={consumeActiveShield} onCheckpoint={value => { setStoryCheckpoint(current => Math.max(current, value)); if (value >= 3) setTutorialSeen(true); }} onClose={() => { setAdventureOpen(false); selectNavigation(1); }} onShop={() => { setAdventureOpen(false); selectNavigation(0); }} onComputer={openComputer} onRun={() => { setFromComputer(false);setAdventureOpen(false); setNeighborhoodOpen(true); }} onBar={() => { stopHoldVisual("cancel");setApartmentBarOpen(true); }} onSound={kind => getSound().adventure(kind)} />}
      {apartmentBarOpen && miniGame === null && drinkGame === null && casinoGame === null && !riskMode && <GameModal className={`adventure-bar pixel-game theme-${activeTheme}`} style={{"--bar-row-count":Math.ceil(barDrinks.length/3)} as CSSProperties} label="Бар Кнопика" onDismiss={returnToApartment}><header className="apartment-bar-header"><h2>Бар</h2><ActiveBalance amount={coins.walletCoins}/><button className="bar-close" type="button" aria-label="Закрыть бар и вернуться в комнату" onClick={returnToApartment}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h4v4h4v4H8V8H4Zm12 0h4v4h-4v4h-4V8h4ZM8 12h4v4H8v4H4v-4h4Zm4 0h4v4h4v4h-4v-4h-4Z" fill="currentColor"/></svg></button>{riskMessage&&<p className="bar-feedback" role="status">{riskMessage}</p>}</header>{apartmentShelf}</GameModal>}
      {riskMode && <PitbullGame skin={activeSkin} phase={riskPhase} chance={riskChance} bet={riskBetAmount} balance={coins.walletCoins} multiplier={selectedRiskMultiplier} payout={riskPayout} result={riskResult} rotation={riskRotation} spinNonce={riskSpinNonce} duration={RISK_SPIN_MS} canChooseBet={mohawkEquipped} message={riskMessage} onChance={chance => { setRiskChance(chance); getSound().riskTick(); vibrate(8, settingsRef.current.vibration); }} onBet={setRiskBetAmount} onSpin={startRiskSpin} onClose={() => { if (riskPhaseRef.current !== "selecting") return; transitionRisk("normal"); setRiskRotation(0); setRiskResult(null); setRiskMessage(""); }} />}
      {homePanel==="wardrobe"&&<WardrobeRoom theme={activeTheme} equipment={{skin:activeSkin,hat:hatOwned&&hatEquipped,mohawk:mohawkOwned&&mohawkEquipped,accessory:equippedCosmetic}} owned={[...(hatOwned?["hat" as const]:[]),...(mohawkOwned?["mohawk" as const]:[]),...ownedCosmetics]} onApply={applyWardrobe} onClose={returnToApartment}/>}
      {homePanel==="vault"&&<VaultRoom theme={activeTheme} balance={vaultCoins} wallet={coins.walletCoins} canDeposit={canSave} onDeposit={saveAllToVault} onClose={returnToApartment}/>}
      {homePanel==="aura"&&<AuraExchangeRoom theme={activeTheme} wallet={coins.walletCoins} aura={auraCoins} onExchange={exchangeAura} onClose={returnToApartment}/>}
      {homePanel==="laboratory"&&<LaboratoryRoom theme={activeTheme} progress={laboratory} initialRecipe={labSelection} stock={barStock} onStart={startBrew} onCare={careBrew} onClaim={claimBrew} onClose={returnToApartment}/>}
      {hydrated && neighborhoodOpen && <NeighborhoodGame key={worldResetEpoch} worldGraphics={graphicsModes(settings.graphicsQuality).world} fpsLimit={settings.fpsLimit} onGather={gatherMaterial} canHarvest={canGatherMaterial} resumeEngine={streetEngine} equipment={{skin:activeSkin,hat:hatOwned&&hatEquipped,mohawk:mohawkOwned&&mohawkEquipped,accessory:equippedCosmetic}} balance={coins.walletCoins} onDodgeSound={()=>getSound().adventure("dodge")} theme={activeTheme} progress={neighborhood} suspended={runnerOpen} onProgress={setNeighborhood} onHome={() => { setStreetEngine(undefined); setNeighborhoodOpen(false); setHomeFromStreet(true);setAdventureOpen(true); }} onRun={engine => { engine.pause();setStreetEngine(engine);getSound().unlock();window.history.pushState(null,"",(process.env.NEXT_PUBLIC_BASE_PATH??"")+"/run/");setRunnerOpen(true); }} onSound={() => getSound().adventure("door")} />}


      {progressOpen && <ProgressRoad level={levelState} claimed={claimedLevelRewards} onClaim={claimLevelReward} onClaimAll={claimAllLevelRewards} onGetDailyCase={onGetDailyCase} onClaimDailyCase={claimDailyReward} onClose={() => setProgressOpen(false)}/>}
      {arcadeOpen&&homePanel===null&&casinoGame===null&&drinkGame===null&&miniGame===null&&!riskMode&&<ArcadeLibrary shieldActive={vitaPowerShield} stock={barStock} laboratory={laboratory} balance={coins.walletCoins} resting={isDogResting||dogState!=="calm"} busy={holding||tutorialOpen} records={{pitbull:riskStats.wins,cocoa:miniGameStats.slotWins,bergamot:miniGameStats.mineWins,lime:drinkGameStats.limeBest,matcha:drinkGameStats.matchaBest,...Object.fromEntries(BRAINROT_KINDS.map(k=>[k,brainrotStats[k].best])),...Object.fromEntries(Object.entries(casinoStats).map(([k,s])=>[k,s.best]))}} onPlay={kind=>{getSound().unlock();if(isCasinoKind(kind))openCasinoGame(kind);else if(kind==="pitbull")activatePitbull();else if(kind==="cocoa")openMiniGame("slots");else if(kind==="bergamot")openMiniGame("mines");else openDrinkGame(kind);}} onBuy={buyShelfBuff} onBrew={id=>{setLabSelection(id);setHomePanel("laboratory");}} onUseBuff={id=>{if(id==="zhivchik")activateDrink();else activateVitaPower();}} onClose={()=>setArcadeOpen(false)}/>}
      {casinoGame&&<CasinoGame key={`${casinoGame}-${casinoSession}`} kind={casinoGame} skin={activeSkin} balance={coins.walletCoins} canChooseBet={mohawkEquipped} stats={casinoStats[casinoGame]} onCommit={commitCasino} onDouble={doubleCasino} onResolve={resolveCasino} onClose={closeCasino} onReplay={casinoInventory[casinoGame]>0&&coins.walletCoins>0?()=>{if(casinoLedgerRef.current?.phase!=="settled")return;casinoLedgerRef.current={kind:casinoGame,phase:"ready",bet:0,doubled:false};setCasinoSession(n=>n+1);}:undefined} onSound={cue=>getSound().casinoCue(casinoGame, cue)}/>}
      {drinkGame === "lime" && <LimeGame onReplay={limeCount>0?replayDrinkGame:undefined} key={`lime-${drinkSession}`} balance={coins.walletCoins} canChooseBet={mohawkEquipped} best={drinkGameStats.limeBest} onStart={startDrinkGame} onResolve={resolveDrinkGame} onClose={closeDrinkGame} onTick={() => getSound().riskTick()}/>}
      {drinkGame === "matcha" && <DrinkGamePanel onReplay={matchaCount>0?replayDrinkGame:undefined} key={`matcha-${drinkSession}`} kind="matcha" balance={coins.walletCoins} canChooseBet={mohawkEquipped} best={drinkGameStats.matchaBest} onStart={startDrinkGame} onResolve={resolveDrinkGame} onClose={closeDrinkGame} onTick={pad => pad === undefined ? getSound().riskTick() : getSound().memoryNote(pad)}/>}
      {drinkGame && isBrainrotKind(drinkGame) && <BrainrotGame onReplay={brainrotInventory[drinkGame]>0?replayDrinkGame:undefined} key={`${drinkGame}-${drinkSession}`} kind={drinkGame} balance={coins.walletCoins} canChooseBet={mohawkEquipped} best={brainrotStats[drinkGame].best} onStart={startDrinkGame} onResolve={resolveDrinkGame} onClose={closeDrinkGame} onSound={(kind, sound, lane) => getSound().brainrotCue(kind, sound, lane)}/>}

      {miniGame && (<MiniGamePanel onReplay={(miniGame==="slots"?colaCount:teaCount)>0&&!isDogResting&&dogState==="calm"&&coins.walletCoins>0?replayMiniGame:undefined} key={`${miniGame}-${miniGameSession}`} kind={miniGame} balance={coins.walletCoins} difficulty={difficultyWithBalancePenalty(difficulty, coins.walletCoins)} canChooseBet={mohawkEquipped} stats={miniGameStats} onCommitBet={commitMiniGameBet} onResolve={resolveMiniGame} onClose={() => {miniLedgerRef.current=null;setMiniGame(null);}} onTick={() => {
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

      {shopOpen && (<GameModal className={`modal-backdrop shop-backdrop pixel-game theme-${activeTheme}`} label="Магазин" onDismiss={()=>selectNavigation(1)}>
          <div className="shop-page-layout">
          <section className="sheet shop-sheet" aria-labelledby="shop-title">
            <div className="shop-hero-row">
              <div className="sheet-heading"><h2 id="shop-title">Магазин</h2></div>
              <ShopBalances vault={vaultCoins} aura={auraCoins}/>
            </div>

            <div className="shop-categories" role="tablist" aria-label="Разделы магазина">
              {(["clothes", "skins", "themes", "cases"] as const).map((category, index) => <button key={category} type="button" role="tab" className={shopCategory === category ? "active" : ""} aria-selected={shopCategory === category} tabIndex={shopCategory === category ? 0 : -1} onClick={() => setShopCategory(category)} onKeyDown={event => {
                    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                        event.preventDefault();
                        const next = event.key === "Home" ? 0 : event.key === "End" ? 3 : (index + (event.key === "ArrowRight" ? 1 : 3)) % 4;
                        setShopCategory((["clothes", "skins", "themes", "cases"] as const)[next]);
                        (event.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
                    }
                }}>{category === "clothes" ? "Одежда" : category === "skins" ? "Скины" : category === "themes" ? "ФОНЫ" : "Кейсы"}</button>)}
            </div>

            {shopMessage && <p className="purchase-message" role="status">{shopMessage}</p>}

            {shopCategory === "skins" && <div className="shop-skins-panel"><div className="shop-skins-intro"><strong>Скины Кнопика</strong><span>Один скин для тапалки, мира, Run и игры вдвоём</span></div><div className="shop-skins-grid">{PAID_KNOPIK_SKINS.map(skin=>{const item=KNOPIK_SKINS[skin],owned=ownedSkins.includes(skin),selected=activeSkin===skin;return <article key={skin} className={`shop-skin-card skin-${skin} ${selected?"selected":""}`}><div className="shop-skin-art"><PixelDog skin={skin} ears/>{selected&&<small>ВЫБРАН</small>}</div><h3>{item.name}</h3><p>{item.copy}</p><button type="button" className="shop-buy-button" disabled={selected||!owned&&auraCoins<item.price} onClick={()=>buyOrSelectSkin(skin)}>{selected?"Выбран":owned?"Надеть":<>Купить · {item.price} <AuraCoinArtwork/><span>AURA</span></>}</button>{!owned&&auraCoins<item.price&&<small className="shop-skin-shortfall">Нужно ещё {item.price-auraCoins} AURA</small>}</article>;})}</div><button type="button" className="shop-skin-classic" disabled={activeSkin==="classic"} onClick={()=>buyOrSelectSkin("classic")}>{activeSkin==="classic"?"Классический Кнопик выбран":"Вернуть классического Кнопика"}</button></div>}

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
                <p>Улучшает награду и удержание ультра-тапа. {COMBAT_CLOTHING.hat}</p>
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
                <h3>Ирокез</h3>
                <p>Улучшает коэффициенты и открывает выбор ставки. {COMBAT_CLOTHING.mohawk}</p>
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
            {(["bandana", "charm", "goggles", "cape", "ranger-hood", "hunter-armor", "raven-mask", "hunter-cloak"] as const).map(kind => {
                    const owned = ownedCosmetics.includes(kind);
                    const item = COSMETICS[kind];
                    const locked = !owned && levelState.level < item.unlockLevel;
                    return <article key={kind} className={`shop-card shop-product-card go-clothing-card ${locked ? "is-locked" : ""}`}>
                <span className="go-clothing-art"><CosmeticArtwork kind={kind}/>{locked && <ShopLock/>}</span>
                <div className="food-copy">{owned && (kind==="bandana"||kind==="charm") && <small>LVL {cosmeticLevels[kind]}/5</small>}<h3>{item.name}</h3><p>{cosmeticEffect(kind,cosmeticLevels[kind])}</p></div>
                <div className="clothing-actions">
                <button className="shop-buy-button clothing-equip-button" type="button" disabled={locked || (!owned && vaultCoins < item.price)} onClick={() => buyOrToggleCosmetic(kind)}>
                  {owned ? equippedCosmetic === kind ? "Снять" : "Надеть" : locked ? `Откроется на LVL ${item.unlockLevel}` : "Купить · " + item.price.toLocaleString("ru-RU")}
                </button>
                {(kind==="bandana"||kind==="charm")&&<button className="clothing-upgrade-button" type="button" disabled={!owned || cosmeticLevels[kind]>=5 || vaultCoins<cosmeticUpgradePrice(cosmeticLevels[kind])} onClick={()=>upgradeCosmetic(kind)}>{cosmeticLevels[kind]>=5?"Максимум":`Улучшить · ${cosmeticUpgradePrice(cosmeticLevels[kind]).toLocaleString("ru-RU")}`}</button>}
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
          <BottomNavigation computer={computerOpen} activeIndex={0} onSelect={index=>{navDidDragRef.current=false;clickNavigation(index);}}/>
          </div>
        </GameModal>)}

      {settingsDialog}

      <div className="red-flash" aria-hidden="true"/>
    </main></ArcadeEconomyContext.Provider></GameSettingsAccess.Provider>);
}
