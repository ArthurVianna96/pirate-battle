import { useRef, useEffect, type ReactNode, type KeyboardEvent } from 'react';

export function PauseModal({
  children,
  label = 'Paused game',
}: {
  children: ReactNode;
  label?: string;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);
  function trapFocus(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab') {
      return;
    }
    const controls = dialog.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), input',
    );
    if (!controls?.length) {
      return;
    }
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
  return (
    <div
      ref={dialog}
      className="pause-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={label}
      onKeyDown={trapFocus}
    >
      {children}
    </div>
  );
}
