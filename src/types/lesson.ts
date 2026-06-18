// ============================================
// Lesson Data Types
// ============================================

export type LessonDomain = 'Process' | 'People' | 'Business' | 'Business Environment';

// Base types for lesson index
export type Lesson = {
  id: string;
  title: string;
  description: string;
  duration: number;
  maxPoints: number;
  domain: LessonDomain;
  prerequisites: string[];
  thumbnail: string;
  locked: boolean;
  isPremium?: boolean;  // Marks lesson as premium-only content
};

export type LessonsIndex = {
  path: string;
  pathName: string;
  moduleName: string;
  lessons: Lesson[];
};

// ============================================
// Question Types
// ============================================

export type QuestionOption = {
  id: string;
  text: string;
  correct: boolean;
  whyWrong?: string;
};

export type CorrectFeedback = {
  text: string;
  character?: string;
  characterQuote?: string;
};

export type IncorrectFeedback = {
  useOptionSpecific?: boolean;
  text?: string;
  fallbackText?: string;
  character?: string;
  characterQuote?: string;
};

export type DragChip = {
  id: string;
  label: string;
  correctZone: string;
};

export type DropZone = {
  id: string;
  label: string;
  detail?: string;
  allowMultiple?: boolean;
};

export type KeywordScoring = Record<string, string[]>;

export type BaseQuestion = {
  q_id: string;
  question: string;
  points: number;
  explanation?: string;
  correctFeedback?: CorrectFeedback;
  incorrectFeedback?: IncorrectFeedback;
  retryHint?: string;
};

export type SingleSelectQuestion = BaseQuestion & {
  type: 'single_select';
  scenario_name?: string;
  situation?: string;
  options: QuestionOption[];
};

export type MultiSelectQuestion = BaseQuestion & {
  type: 'multi_select';
  scenario_name?: string;
  situation?: string;
  options: QuestionOption[];
  minSelections?: number;
  maxSelections?: number;
};

export type DragDropQuestion = BaseQuestion & {
  type: 'drag_drop';
  scenario_name?: string;
  situation?: string;
  chips: DragChip[];
  dropZones: DropZone[];
};

export type TextInputQuestion = BaseQuestion & {
  type: 'text_input';
  scenario_name?: string;
  situation?: string;
  placeholder?: string;
  minWords?: number;
  maxWords?: number;
  keywordScoring?: KeywordScoring;
};

export type Question =
  | SingleSelectQuestion
  | MultiSelectQuestion
  | DragDropQuestion
  | TextInputQuestion;

// ============================================
// Screen Content Types
// ============================================

// Hook Screen
export type FailureCard = {
  id: string;
  icon: string;
  title: string;
  summary: string;
  image: string;
  details: string;
};

export type CarouselConfig = {
  enabled: boolean;
  autoPlay?: boolean;
  showIndicators?: boolean;
  aspectRatio?: string;
};

export type CharacterQuote = {
  character: string;
  name: string;
  role: string;
  quote: string;
};

// Quick Navigation for Hook Screen (v1.3.2)
export type QuickNavTarget = 'challenge' | 'theory' | 'transfer' | 'practice';

export type QuickNavConfig = {
  enabled: boolean;
  links: QuickNavTarget[];
};

export type HookContent = {
  headline: string;
  intro: string;
  failure_cards?: FailureCard[];
  carousel?: CarouselConfig;
  character_quote?: CharacterQuote;
  learning_hook: string;
  quick_nav?: QuickNavConfig;
};

// Challenge Screen
export type ChallengeInteraction = {
  type: string;
  title: string;
  description: string;
  questions: Question[];
};

// Reason Screen (Teaching content)
export type DiagramInfo = {
  image: string;
  alt: string;
  caption?: string;
};

export type ReasonTab = {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  diagram?: DiagramInfo;
};

export type MicroTeach = {
  title: string;
  diagram?: DiagramInfo;
  tabs: ReasonTab[];
};

// Transfer Screen
export type TransferScenario = {
  title: string;
  images?: { src: string; alt: string; caption?: string }[];
  description: string;
  details?: string[];
};

export type TransferContent = {
  title: string;
  scenario: TransferScenario;
  questions: Question[];
};

// Wrap Screen
export type NextLesson = {
  id: string;
  title: string;
  description: string;
};

export type WrapContent = {
  title: string;
  summary: string;
  key_takeaways: string[];
  xp_earned: number;
  next_lesson?: NextLesson;
};

// Practice Screen
export type PracticeContent = {
  title: string;
  description: string;
  showTimer?: boolean;
  questions: Question[];
};

// ============================================
// Screen Types
// ============================================

export type HookScreen = {
  screen_number: number;
  screen_type: 'hook';
  duration: number;
  content: HookContent;
  cta?: string;
};

export type ChallengeScreen = {
  screen_number: number;
  screen_type: 'challenge';
  duration: number;
  interaction: ChallengeInteraction;
};

export type ReasonScreen = {
  screen_number: number;
  screen_type: 'reason';
  duration: number;
  microTeach: MicroTeach;
};

export type TransferScreen = {
  screen_number: number;
  screen_type: 'transfer';
  duration: number;
  content: TransferContent;
};

export type WrapScreen = {
  screen_number: number;
  screen_type: 'wrap';
  duration: number;
  content: WrapContent;
};

export type PracticeScreen = {
  screen_number: number;
  screen_type: 'practice';
  duration: number;
  content: PracticeContent;
};

export type LessonScreen =
  | HookScreen
  | ChallengeScreen
  | ReasonScreen
  | TransferScreen
  | WrapScreen
  | PracticeScreen;

export type ScreenType = LessonScreen['screen_type'];

// ============================================
// Full Lesson Data
// ============================================

export type LessonScoring = {
  totalPoints: number;
  challengePoints: number;
  transferPoints: number;
  practicePoints: number;
  masteryThreshold: number;
  passingThreshold: number;
};

export type LessonData = {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseName: string;
  pathId: string;
  pathName: string;
  domain: string;
  estimatedDuration: number;
  scoring: LessonScoring;
  learningObjectives: string[];
  characters: string[];
  screens: LessonScreen[];
};

// ============================================
// Lesson State Types (for Context)
// ============================================

export type ModalType = 'success' | 'retry' | 'reveal' | null;

export type ModalData = {
  title: string;
  points?: number;
  explanation?: string;
  hint?: string;
  feedbackText?: string;
  correctAnswer?: string;
  character?: string;
  characterQuote?: string;
  isLastQuestion?: boolean;
};

export type QuestionAnswer = {
  questionId: string;
  selectedOption?: string;
  selectedOptions?: string[];
  dropZoneAnswers?: Record<string, DragChip | DragChip[]>;
  textAnswer?: string;
};

export type LessonProgress = {
  lessonId: string;
  currentScreenIndex: number;
  answers: Record<string, QuestionAnswer>;
  attempts: Record<string, number>;
  disabledChoices: Record<string, string[]>;
  questionScores: Record<string, number>;
  completedQuestions: Set<string>;
  totalScore: number;
  elapsedTime: number;
  completed: boolean;
};
