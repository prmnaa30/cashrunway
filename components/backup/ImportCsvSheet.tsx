import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Layers, RefreshCw } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useTranslation } from '@/lib/i18n';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { AppSegmentedTabs } from '@/components/ui/AppSegmentedTabs';
import { useBackupStore } from '@/store/useBackupStore';
import { parseCsvContent, ParsedCsvResult } from '@/lib/backup/csvImporter';

interface ImportCsvSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function ImportCsvSheet({ visible, onClose }: ImportCsvSheetProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const { importCsvContent, isImporting } = useBackupStore();

  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParsedCsvResult | null>(null);
  const [strategy, setStrategy] = useState<'append' | 'replace'>('append');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handlePickDocument = async () => {
    try {
      setErrorMessage(null);
      setSuccessResult(null);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setSelectedFileName(asset.name);

      let textContent = '';
      if (asset.file) {
        textContent = await (asset.file as any).text();
      } else if (asset.uri) {
        try {
          const { File } = require('expo-file-system');
          const fileObj = new File(asset.uri);
          textContent = await fileObj.text();
        } catch {
          const FileSystem = require('expo-file-system');
          textContent = await FileSystem.readAsStringAsync(asset.uri);
        }
      }

      if (!textContent) {
        throw new Error('Failed to read CSV file contents.');
      }

      setFileContent(textContent);
      const parsed = parseCsvContent(textContent);
      setParseResult(parsed);

      if (parsed.rows.length === 0) {
        setErrorMessage(t('backupModals.csv.noDataError'));
      }
    } catch (err: any) {
      console.error('[ImportCsvSheet] Document picking error:', err);
      setErrorMessage(err.message || t('backupModals.csv.openError'));
    }
  };

  const handleExecuteImport = async () => {
    if (!fileContent) return;

    if (strategy === 'replace') {
      Alert.alert(
        t('backupModals.csv.strategyReplace'),
        t('backupModals.csv.strategyReplaceDesc'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'destructive',
            onPress: performImport,
          },
        ]
      );
    } else {
      await performImport();
    }
  };

  const performImport = async () => {
    if (!fileContent) return;
    try {
      setErrorMessage(null);
      const res = await importCsvContent(fileContent, strategy);
      setSuccessResult({ imported: res.imported, skipped: res.skipped });
    } catch (err: any) {
      setErrorMessage(err.message || t('backupModals.csv.importError'));
    }
  };

  const handleClose = () => {
    setSelectedFileName(null);
    setFileContent(null);
    setParseResult(null);
    setErrorMessage(null);
    setSuccessResult(null);
    onClose();
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={handleClose}
      title={t('backupModals.csv.title')}
      subtitle={t('backupModals.csv.subtitle')}
      maxHeight="90%"
      height="80%"
      minHeight={460}
    >
      <ScrollView className="flex-1 px-4 py-2" showsVerticalScrollIndicator={false}>
        {/* Step 1: Select CSV File */}
        <View className="mb-4">
          <Pressable
            onPress={handlePickDocument}
            disabled={isImporting}
            className="p-4 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-dashed border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70"
          >
            <View className="w-11 h-11 rounded-full bg-emerald-500/10 dark:bg-accent-champagne/15 items-center justify-center border border-emerald-600/20 dark:border-accent-champagne/20 mb-2">
              <FileSpreadsheet size={20} color={colors.tint} />
            </View>
            <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mb-1">
              {selectedFileName
                ? t('backupModals.csv.selectedFile', { name: selectedFileName })
                : t('backupModals.csv.selectFile')}
            </Text>
            <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
              {t('backupModals.csv.supportedFormats')}
            </Text>
          </Pressable>
        </View>

        {/* Step 2: File Overview */}
        {parseResult && parseResult.rows.length > 0 && (
          <View className="p-3.5 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border mb-4">
            <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mb-2">
              {t('backupModals.csv.previewTitle')}
            </Text>

            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
                {t('backupModals.csv.totalRows', { count: parseResult.totalRows })}
              </Text>
              <View className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-600/30">
                <Text className="text-[10px] font-bold text-emerald-800 dark:text-accent-champagne uppercase">
                  {parseResult.detectedFormat === 'cashrunway'
                    ? t('backupModals.csv.formatCashRunway')
                    : t('backupModals.csv.formatGeneric')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Step 3: Merge Strategy */}
        {parseResult && parseResult.rows.length > 0 && !successResult && (
          <View className="mb-4">
            <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mb-2">
              {t('backupModals.csv.strategyTitle')}
            </Text>

            <View className="mb-2">
              <AppSegmentedTabs<'append' | 'replace'>
                size="sm"
                value={strategy}
                onChange={setStrategy}
                options={[
                  { key: 'append', label: t('backupModals.csv.strategyAppendLabel') },
                  { key: 'replace', label: t('backupModals.csv.strategyReplaceLabel') },
                ]}
              />
            </View>

            <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary leading-4">
              {strategy === 'append'
                ? t('backupModals.csv.strategyAppendDesc')
                : t('backupModals.csv.strategyReplaceDesc')}
            </Text>
          </View>
        )}

        {/* Error message */}
        {errorMessage && (
          <View className="p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 mb-4 flex-row items-center">
            <AlertCircle size={16} color="#EF4444" className="mr-2" />
            <Text className="text-xs font-medium text-status-danger flex-1 ml-2">
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Success message */}
        {successResult && (
          <View className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-600/30 mb-4 flex-row items-center">
            <CheckCircle2 size={20} color={isDark ? '#34D399' : '#059669'} className="mr-2" />
            <View className="flex-1 ml-2">
              <Text className="text-xs font-bold text-emerald-800 dark:text-accent-champagne">
                {t('backupModals.csv.successTitle')}
              </Text>
              <Text className="text-[11px] text-emerald-700/90 dark:text-accent-champagne/80 mt-0.5">
                {t('backupModals.csv.successDesc', {
                  imported: successResult.imported,
                  skipped: successResult.skipped,
                })}
              </Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        {parseResult && parseResult.rows.length > 0 && (
          <Pressable
            onPress={successResult ? handleClose : handleExecuteImport}
            disabled={isImporting}
            className={`min-h-[48px] py-3.5 px-4 rounded-2xl items-center justify-center mb-6 flex-row active:opacity-80 ${
              successResult
                ? 'bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border'
                : 'bg-emerald-600 dark:bg-accent-brass'
            }`}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : successResult ? (
              <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                {t('common.close')}
              </Text>
            ) : (
              <>
                <Upload size={15} color="#FFFFFF" className="mr-2" />
                <Text className="text-xs font-bold text-white ml-2">
                  {t('backupModals.csv.importBtn')} ({parseResult.totalRows})
                </Text>
              </>
            )}
          </Pressable>
        )}
      </ScrollView>
    </AppBottomSheet>
  );
}
