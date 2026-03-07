export interface PhaseHint {
  labelKey: string;
  url?: string;
  urlLabel?: string;
}

export interface PhaseResolutionStep {
  labelKey: string;
  isBold?: boolean;
  isMono?: boolean;
}

export interface PhaseConfig {
  id: number;
  titleKey: string;
  badgeLabel: string;
  historyKey?: string;
  rules?: string[];
  hints: PhaseHint[];
  resolutionSteps: PhaseResolutionStep[];
}
