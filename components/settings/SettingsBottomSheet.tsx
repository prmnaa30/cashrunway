import React from 'react';
import { AppBottomSheet, AppBottomSheetProps } from '@/components/ui/AppBottomSheet';

export type SettingsBottomSheetProps = AppBottomSheetProps;

/**
 * Backward-compatible wrapper pointing directly to the unified AppBottomSheet.
 */
export function SettingsBottomSheet(props: SettingsBottomSheetProps) {
  return <AppBottomSheet {...props} />;
}
