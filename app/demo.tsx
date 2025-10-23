/**
 * デモ画面 - 全コンポーネントのショーケース
 */

import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../lib/themeSystem';
import { useAlert } from '../lib/providers/AlertProvider';
import { useToast } from '../lib/providers/ToastProvider';
import { useToggle } from '../lib/hooks';
import { validateEmail } from '../lib/utils';
import { NavigationHelpers } from '../lib/navigation/routeHelpers';
import ScreenContainer from '../components/layout/ScreenContainer';
import IconSectionHeader from '../components/layout/IconSectionHeader';
import CommonButton from '../components/common/CommonButton';
import CommonInput from '../components/common/CommonInput';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import DatePicker from '../components/pickers/DatePicker';
import TimePicker from '../components/pickers/TimePicker';
import DaysPicker from '../components/pickers/DaysPicker';
import NumberPicker from '../components/pickers/NumberPicker';
import SelectPicker from '../components/pickers/SelectPicker';

export default function DemoScreen() {
  const { colors, spacing } = useTheme();
  const { showAlert } = useAlert();
  const { showToast } = useToast();
  const [isLoading, { toggle: toggleLoading }] = useToggle(false);
  const [showEmpty, { toggle: toggleEmpty }] = useToggle(false);
  const [email, setEmail] = useState('');

  // Picker states
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [showDaysPicker, setShowDaysPicker] = useState(false);
  const [selectedNumber, setSelectedNumber] = useState(5);
  const [showNumberPicker, setShowNumberPicker] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showSelectPicker, setShowSelectPicker] = useState(false);
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([]);
  const [showMultiSelectPicker, setShowMultiSelectPicker] = useState(false);

  const selectOptions = [
    { label: 'オプション 1', value: 'option1' },
    { label: 'オプション 2', value: 'option2' },
    { label: 'オプション 3', value: 'option3' },
    { label: 'オプション 4', value: 'option4' },
  ];

  return (
    <ScreenContainer scrollable paddingBottom={100}>
      <View style={{ paddingVertical: spacing.lg }}>
        <CommonButton
          title="← ホームに戻る"
          onPress={NavigationHelpers.back}
          type="ghost"
          icon="arrow-back"
        />

        <Text style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: colors.text,
          marginTop: spacing.lg,
          marginBottom: spacing.md
        }}>
          コンポーネントデモ
        </Text>

        {/* ボタンセクション */}
        <IconSectionHeader
          icon="toggle-outline"
          title="ボタン"
        />
        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
          <CommonButton
            title="Primary Button"
            onPress={() => showToast({ message: 'Primary pressed!', type: 'info' })}
            type="primary"
            icon="checkmark"
          />
          <CommonButton
            title="Secondary Button"
            onPress={() => showToast({ message: 'Secondary pressed!', type: 'info' })}
            type="secondary"
          />
          <CommonButton
            title="Success Button"
            onPress={() => showToast({ message: 'Success!', type: 'success' })}
            type="success"
            icon="checkmark-circle"
          />
          <CommonButton
            title="Danger Button"
            onPress={() => showToast({ message: 'Danger!', type: 'error' })}
            type="danger"
            icon="trash"
          />
        </View>

        {/* インプットセクション */}
        <IconSectionHeader
          icon="create-outline"
          title="入力フィールド"
        />
        <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
          <CommonInput
            label="メールアドレス"
            type="email"
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            icon="mail-outline"
            validator={validateEmail}
            validateOnChange
          />
          <CommonInput
            label="パスワード"
            type="password"
            placeholder="••••••••"
            icon="lock-closed-outline"
          />
          <CommonInput
            label="メモ"
            type="multiline"
            placeholder="メモを入力..."
          />
        </View>

        {/* ピッカーセクション */}
        <IconSectionHeader
          icon="options-outline"
          title="ピッカーコンポーネント"
        />
        <View style={{ gap: spacing.md, marginBottom: spacing.xl }}>
          <DatePicker
            label="日付選択"
            value={selectedDate}
            onChange={setSelectedDate}
          />

          <View>
            <Text style={{ color: colors.text, marginBottom: spacing.xs, fontSize: 14, fontWeight: '500' }}>
              時刻選択
            </Text>
            <CommonButton
              title={`時刻: ${selectedTime}`}
              onPress={() => setShowTimePicker(true)}
              type="outline"
              icon="time-outline"
            />
          </View>

          <View>
            <Text style={{ color: colors.text, marginBottom: spacing.xs, fontSize: 14, fontWeight: '500' }}>
              曜日選択
            </Text>
            <CommonButton
              title={selectedDays.length > 0 ? `${selectedDays.length}日選択中` : '曜日を選択'}
              onPress={() => setShowDaysPicker(true)}
              type="outline"
              icon="calendar-outline"
            />
          </View>

          <View>
            <Text style={{ color: colors.text, marginBottom: spacing.xs, fontSize: 14, fontWeight: '500' }}>
              数値選択
            </Text>
            <CommonButton
              title={`数値: ${selectedNumber}`}
              onPress={() => setShowNumberPicker(true)}
              type="outline"
              icon="keypad-outline"
            />
          </View>

          <View>
            <Text style={{ color: colors.text, marginBottom: spacing.xs, fontSize: 14, fontWeight: '500' }}>
              単一選択
            </Text>
            <CommonButton
              title={selectedOption ? `選択: ${selectOptions.find(o => o.value === selectedOption)?.label}` : '選択してください'}
              onPress={() => setShowSelectPicker(true)}
              type="outline"
              icon="list-outline"
            />
          </View>

          <View>
            <Text style={{ color: colors.text, marginBottom: spacing.xs, fontSize: 14, fontWeight: '500' }}>
              複数選択
            </Text>
            <CommonButton
              title={selectedMultiple.length > 0 ? `${selectedMultiple.length}件選択中` : '選択してください'}
              onPress={() => setShowMultiSelectPicker(true)}
              type="outline"
              icon="checkmark-done-outline"
            />
          </View>
        </View>

        {/* Alert & Toastセクション */}
        <IconSectionHeader
          icon="notifications-outline"
          title="Alert & Toast"
        />
        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
          <CommonButton
            title="Show Alert"
            onPress={() => showAlert({
              title: 'アラート',
              message: 'これはアラートメッセージです',
              onConfirm: () => showToast({ message: '確認しました', type: 'success' })
            })}
            type="outline"
          />
          <CommonButton
            title="Show Toast Success"
            onPress={() => showToast({ message: '成功しました！', type: 'success' })}
            type="ghost"
          />
          <CommonButton
            title="Show Toast Error"
            onPress={() => showToast({ message: 'エラーが発生しました', type: 'error' })}
            type="ghost"
          />
        </View>

        {/* ローディング & Empty Stateセクション */}
        <IconSectionHeader
          icon="hourglass-outline"
          title="Loading & Empty State"
        />
        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
          <CommonButton
            title={isLoading ? "Hide Loading" : "Show Loading"}
            onPress={toggleLoading}
            type="outline"
          />
          {isLoading && <LoadingSpinner message="読み込み中..." />}

          <CommonButton
            title={showEmpty ? "Hide Empty State" : "Show Empty State"}
            onPress={toggleEmpty}
            type="outline"
          />
          {showEmpty && (
            <EmptyState
              icon="folder-open-outline"
              message="データがありません"
              description="新しいアイテムを追加してください"
              actionLabel="追加する"
              onActionPress={() => showToast({ message: '追加しました', type: 'success' })}
            />
          )}
        </View>
      </View>

      {/* Picker Modals */}
      <TimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        title="時刻を選択"
        value={selectedTime}
        onValueChange={(time) => {
          setSelectedTime(time);
          showToast({ message: `時刻を ${time} に設定しました`, type: 'success' });
        }}
      />

      <DaysPicker
        visible={showDaysPicker}
        onClose={() => setShowDaysPicker(false)}
        title="曜日を選択"
        value={selectedDays}
        onValueChange={(days) => {
          setSelectedDays(days);
          showToast({ message: `${days.length}日選択しました`, type: 'success' });
        }}
      />

      <NumberPicker
        visible={showNumberPicker}
        onClose={() => setShowNumberPicker(false)}
        title="数値を選択"
        value={selectedNumber}
        onValueChange={(num) => {
          setSelectedNumber(num);
          showToast({ message: `数値を ${num} に設定しました`, type: 'success' });
        }}
        min={1}
        max={20}
        step={1}
        unit="個"
      />

      <SelectPicker
        visible={showSelectPicker}
        onClose={() => setShowSelectPicker(false)}
        title="オプションを選択"
        options={selectOptions}
        value={selectedOption}
        onValueChange={(value) => {
          setSelectedOption(value as string);
          const label = selectOptions.find(o => o.value === value)?.label;
          showToast({ message: `${label} を選択しました`, type: 'success' });
        }}
      />

      <SelectPicker
        visible={showMultiSelectPicker}
        onClose={() => setShowMultiSelectPicker(false)}
        title="複数選択"
        options={selectOptions}
        value={selectedMultiple}
        onValueChange={(values) => {
          setSelectedMultiple(values as string[]);
          showToast({ message: `${(values as string[]).length}件選択しました`, type: 'success' });
        }}
        multiSelect
      />
    </ScreenContainer>
  );
}
