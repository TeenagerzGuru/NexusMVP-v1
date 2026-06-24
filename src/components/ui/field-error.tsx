"use client";

/** Animated validation bubble — parent Field positions it above the control. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="field-error" role="alert">
      <div className="field-error-bubble">
        <span className="field-error-icon" aria-hidden>
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <span className="field-error-text">{message}</span>
      </div>
      <div className="field-error-caret" aria-hidden />
    </div>
  );
}
