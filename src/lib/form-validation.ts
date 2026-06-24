export type FieldErrors<T extends string> = Partial<Record<T, string>>;

/** Empty/whitespace check — message defaults to browser-ish copy for consistency. */
export function required(value: string | undefined | null, message = "Please fill out this field.") {
  if (!value?.trim()) return message;
  return undefined;
}

/** Lightweight email regex — good enough for client-side; Zod validates server-side. */
export function email(value: string | undefined | null) {
  if (!value?.trim()) return "Please enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return "Please enter a valid email address.";
  }
  return undefined;
}

/** Truthy if any field key is set — use before early-returning on submit. */
export function hasErrors<T extends string>(errors: FieldErrors<T>) {
  return Object.keys(errors).length > 0;
}
