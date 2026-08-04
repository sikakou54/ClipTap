import { formatByPattern } from './dateFormatter';

/**
 * @module dateHelpers
 * @description 日付・時刻処理ユーティリティ関数（モバイル・Web共通）
 *
 * このモジュールはClipTapアプリのシステム変数展開（{{今日}}、{{現在時刻}}等）で使用される
 * 日付・時刻処理関数を提供します。外部ライブラリに依存せず、ネイティブのDate APIのみを使用します。
 *
 * @remarks
 * - すべての日時操作はローカルタイムゾーンで動作します
 * - ISO形式の文字列はUTCとして解釈されます
 * - システム変数展開時に`VariableParser`から呼び出されます
 */

/**
 * 日付をカスタムフォーマットで文字列化
 *
 * @param date - フォーマット対象の日付（Dateオブジェクトまたは ISO 8601 文字列）
 * @param format - フォーマット文字列（デフォルト: 'yyyy/MM/dd'）
 *
 * @returns フォーマットされた日付文字列
 *
 * @remarks
 * サポートされるフォーマットプレースホルダー:
 * - `yyyy`: 4桁の年
 * - `MM`: 2桁の月（ゼロパディング）
 * - `dd`: 2桁の日（ゼロパディング）
 * - `HH`: 2桁の時（24時間形式、ゼロパディング）
 * - `mm`: 2桁の分（ゼロパディング）
 * - `ss`: 2桁の秒（ゼロパディング）
 *
 * すべての日時はローカルタイムゾーンで処理されます。
 */
export const formatDate = (
  date: Date | string,
  format: string = 'yyyy/MM/dd'
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatByPattern(d, format, 'en');
};

/**
 * 時刻のみをフォーマット（HH:mm形式）
 *
 * @param date - 時刻を取得する日付
 *
 * @returns HH:mm形式の時刻文字列（例: "15:30"）
 *
 * @remarks
 * 24時間形式で表示されます。
 * システム変数{{現在時刻}}の展開で使用されます。
 */
export const formatTime = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 現在のタイムスタンプをISO形式で取得
 *
 * @returns 現在時刻のISO 8601形式文字列（UTC）
 *
 * @remarks
 * データベースのcreatedAt/updatedAtフィールドで使用されます。
 * UTCタイムゾーンで返されます。
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * ユニークなIDを生成
 *
 * @returns 一意のID文字列（例: "1733045445123-0-a1b2c3d4e"）
 *
 * @remarks
 * タイムスタンプ + カウンター + ランダム文字列の組み合わせにより、
 * 同じミリ秒内に複数回呼び出されても一意性を保証します。
 *
 * データベースの一時的なIDや、重複を避けたい処理で使用されます。
 */
let idCounter = 0;
export const generateUniqueId = (): string => {
  return `${Date.now()}-${idCounter++}-${Math.random().toString(36).substring(2, 11)}`;
};
