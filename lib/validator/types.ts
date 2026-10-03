/**
 * Types for capsule schema v0 and v1 (see the app's SCHEMA.md).
 * Ported from entry/src/main/ets/core/CapsuleTypes.ets at the pinned upstream SHA.
 * Types only, no logic.
 */

export type Permission =
  | 'reminders'
  | 'notifications'
  | 'vibration'
  | 'motion'
  | 'location'
  | 'widget';

export type ComponentType =
  | 'text'
  | 'timer'
  | 'counter'
  | 'checklist'
  | 'number'
  | 'button'
  | 'display'
  | 'input'
  | 'list'
  | 'when'
  | 'row';

export type CounterSource = 'manual' | 'motion';

// One of: startTimer:<id> | pauseTimer:<id> | stopTimer:<id> | resetTimer:<id> | startAllTimers
// | increment:<id> | reset:<id> | notify:<text>
export type Action = string;

export interface TextComponent {
  type: ComponentType;
  text: string;
}

export interface TimerComponent {
  type: ComponentType;
  id: string;
  label: string;
  minutes: number;
}

export interface CounterComponent {
  type: ComponentType;
  id: string;
  label: string;
  source: CounterSource;
}

export interface ChecklistComponent {
  type: ComponentType;
  id: string;
  items: string[];
}

export interface NumberComponent {
  type: ComponentType;
  id: string;
  label: string;
}

export interface ButtonComponent {
  type: ComponentType;
  label: string;
  /** v0 action. In v1 the JSON may omit it when "do" is given; the validated capsule then has ''. */
  action: Action;
  do?: ButtonStep[];
  enabledIf?: string;
}

export type VarType = 'number' | 'text' | 'bool' | 'list';

export type Scalar = number | string | boolean;

/** A state or computed value. Lists hold scalars only. */
export type Value = Scalar | Scalar[];

export interface StateVar {
  type: VarType;
  initial: Value;
}

/** One button step: {set,to} | {push,value} | {pop} | {reset}. A plain string step is a v0 action. */
export interface StepObject {
  set?: string;
  to?: string;
  push?: string;
  value?: string;
  pop?: string;
  reset?: string;
}

export type ButtonStep = string | StepObject;

export interface DisplayComponent {
  type: ComponentType;
  /** Template: "{expr} ..." */
  text: string;
}

export type InputKind = 'number' | 'text';

export interface InputComponent {
  type: ComponentType;
  /** State var. */
  bind: string;
  kind: InputKind;
  label: string;
}

export interface ListComponent {
  type: ComponentType;
  /** State var of type list. */
  source: string;
}

export interface WhenComponent {
  type: ComponentType;
  /** Bool expression. */
  if: string;
  show: CapsuleComponent[];
}

export interface RowComponent {
  type: ComponentType;
  items: CapsuleComponent[];
}

export type CapsuleComponent =
  | TextComponent
  | TimerComponent
  | CounterComponent
  | ChecklistComponent
  | NumberComponent
  | ButtonComponent
  | DisplayComponent
  | InputComponent
  | ListComponent
  | WhenComponent
  | RowComponent;

export interface Capsule {
  /** 0 or 1. */
  schemaVersion: number;
  id: string;
  name: string;
  permissions: Permission[];
  ui: CapsuleComponent[];
  /** v1 */
  state?: Record<string, StateVar>;
  /** v1: name -> expression */
  computed?: Record<string, string>;
  /** v1.1 */
  triggers?: Trigger[];
}

/** v1.1: what starts a trigger. "time" = every day at `at` (HH:MM); "motion" = the user starts moving. */
export type TriggerKind = 'time' | 'motion';

export interface Trigger {
  on: TriggerKind;
  /** "HH:MM", only for "time". */
  at?: string;
  /** Same steps as a v1 button. */
  do: ButtonStep[];
  label?: string;
}

export const TRIGGER_KINDS: string[] = ['time', 'motion'];
export const MAX_TRIGGERS = 5;
export const MAX_TRIGGER_LABEL = 60;

export const PERMISSIONS: string[] = [
  'reminders',
  'notifications',
  'vibration',
  'motion',
  'location',
  'widget',
];

export const COMPONENT_TYPES: string[] = [
  'text',
  'timer',
  'counter',
  'checklist',
  'number',
  'button',
];

export const V1_COMPONENT_TYPES: string[] = ['display', 'input', 'list', 'when', 'row'];

export const MAX_SCHEMA_VERSION = 1;

export const COUNTER_SOURCES: string[] = ['manual', 'motion'];

export type ActionKind =
  | 'startTimer'
  | 'pauseTimer'
  | 'stopTimer'
  | 'resetTimer'
  | 'startAllTimers'
  | 'increment'
  | 'reset'
  | 'notify';

/** Actions that control one timer: their target must be a timer, and they need "reminders". */
export const TIMER_ACTIONS: string[] = ['startTimer', 'pauseTimer', 'stopTimer', 'resetTimer'];

/** A parsed action. `arg` is the target id (or the text for notify); empty for startAllTimers. */
export interface ParsedAction {
  kind: ActionKind;
  arg: string;
}

export interface ValidationResult {
  ok: boolean;
  /** Present only when ok. */
  capsule?: Capsule;
  /** Each prefixed with a JSON path, e.g. "$.ui[2].action: ..."; empty when ok. */
  errors: string[];
}

export type CapsuleOrigin = 'rules' | 'on-device' | 'cloud';
