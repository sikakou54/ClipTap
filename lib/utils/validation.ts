/**
 * バリデーション関数
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateRequired = (value: string): ValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: false, error: '必須項目です' };
  }
  return { isValid: true };
};

export const validateEmail = (email: string): ValidationResult => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'メールアドレスを入力してください' };
  }
  if (!emailRegex.test(email)) {
    return { isValid: false, error: '有効なメールアドレスを入力してください' };
  }
  return { isValid: true };
};

export const validateMinLength = (value: string, minLength: number): ValidationResult => {
  if (value.length < minLength) {
    return { isValid: false, error: `${minLength}文字以上で入力してください` };
  }
  return { isValid: true };
};

export const validateMaxLength = (value: string, maxLength: number): ValidationResult => {
  if (value.length > maxLength) {
    return { isValid: false, error: `${maxLength}文字以内で入力してください` };
  }
  return { isValid: true };
};

export const validateNumeric = (value: string): ValidationResult => {
  if (!/^\d+$/.test(value)) {
    return { isValid: false, error: '数字のみ入力してください' };
  }
  return { isValid: true };
};

export const validateRange = (value: number, min: number, max: number): ValidationResult => {
  if (value < min || value > max) {
    return { isValid: false, error: `${min}〜${max}の範囲で入力してください` };
  }
  return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
  if (password.length < 8) {
    return { isValid: false, error: 'パスワードは8文字以上で入力してください' };
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { isValid: false, error: 'パスワードは大文字・小文字・数字を含めてください' };
  }
  return { isValid: true };
};
