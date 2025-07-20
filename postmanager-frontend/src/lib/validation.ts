import { VALIDATION_RULES } from '@/constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email) {
    errors.push('Email обязателен');
  } else if (!VALIDATION_RULES.EMAIL.test(email)) {
    errors.push('Некорректный формат email');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Пароль обязателен');
  } else if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    errors.push(`Пароль должен содержать минимум ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} символов`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];

  if (!name) {
    errors.push('Имя обязательно');
  } else if (name.length < VALIDATION_RULES.NAME_MIN_LENGTH) {
    errors.push(`Имя должно содержать минимум ${VALIDATION_RULES.NAME_MIN_LENGTH} символа`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateTitle = (title: string): ValidationResult => {
  const errors: string[] = [];

  if (!title) {
    errors.push('Заголовок обязателен');
  } else if (title.length < VALIDATION_RULES.TITLE_MIN_LENGTH) {
    errors.push(`Заголовок должен содержать минимум ${VALIDATION_RULES.TITLE_MIN_LENGTH} символа`);
  } else if (title.length > VALIDATION_RULES.TITLE_MAX_LENGTH) {
    errors.push(`Заголовок не должен превышать ${VALIDATION_RULES.TITLE_MAX_LENGTH} символов`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateDescription = (description?: string): ValidationResult => {
  const errors: string[] = [];

  if (description && description.length > VALIDATION_RULES.DESCRIPTION_MAX_LENGTH) {
    errors.push(`Описание не должно превышать ${VALIDATION_RULES.DESCRIPTION_MAX_LENGTH} символов`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): ValidationResult => {
  const errors: string[] = [];

  if (password !== confirmPassword) {
    errors.push('Пароли не совпадают');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Комплексная валидация форм
export const validateLoginForm = (email: string, password: string): ValidationResult => {
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);

  return {
    isValid: emailValidation.isValid && passwordValidation.isValid,
    errors: [...emailValidation.errors, ...passwordValidation.errors],
  };
};

export const validateRegisterForm = (
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): ValidationResult => {
  const nameValidation = validateName(name);
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const confirmPasswordValidation = validatePasswordConfirmation(password, confirmPassword);

  return {
    isValid:
      nameValidation.isValid &&
      emailValidation.isValid &&
      passwordValidation.isValid &&
      confirmPasswordValidation.isValid,
    errors: [
      ...nameValidation.errors,
      ...emailValidation.errors,
      ...passwordValidation.errors,
      ...confirmPasswordValidation.errors,
    ],
  };
};