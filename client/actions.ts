import type { Attachment } from "svelte/attachments";
import type { SvelteEvent } from "$/utils.ts";

export function numericInput(): Attachment<HTMLInputElement> {
  return (input) => {
    const keydown = (e: KeyboardEvent) => {
      if (
        (e.key >= "0" && e.key <= "9") ||
        [
          "Backspace",
          "Delete",
          "ArrowLeft",
          "ArrowRight",
          "ArrowDown",
          "ArrowUp",
          "Tab",
        ].includes(e.key)
      ) {
        return;
      }
      e.preventDefault();
    };

    const paste = (e: ClipboardEvent) => {
      const paste = e.clipboardData?.getData("text");
      if (paste && !/^\d*$/.test(paste)) {
        e.preventDefault();
      }
    };

    const drag = (e: DragEvent) => {
      const text = e.dataTransfer?.getData("text/plain");
      if (text && !/^\d*$/.test(text)) {
        e.preventDefault();
      }
    };

    const onFocus = () => input.select();

    input.setAttribute("type", "number");
    input.setAttribute("inputmode", "numeric");

    input.addEventListener("focus", onFocus);
    input.addEventListener("keydown", keydown);
    input.addEventListener("paste", paste);
    input.addEventListener("drop", drag);

    return () => {
      input.removeEventListener("focus", onFocus);
      input.removeEventListener("keydown", keydown);
      input.removeEventListener("paste", paste);
      input.removeEventListener("drop", drag);
    };
  };
}

export function dialogClickout(
  onCancel: () => void,
  cancel_key = "Escape",
): Attachment {
  return (el) => {
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");

    const keydown = (e: KeyboardEvent) => {
      if (e.key === cancel_key) onCancel();
    };

    const click = (e: MouseEvent) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.dataset.layer === "dialogs"
      ) {
        onCancel();
      }
    };

    document.body.addEventListener("keydown", keydown);
    document.body.addEventListener("click", click);

    return () => {
      document.body.removeEventListener("keydown", keydown);
      document.body.removeEventListener("click", click);
    };
  };
}

export function nonPassiveEvent<
  T extends keyof HTMLElementEventMap,
  E extends EventTarget = HTMLElement,
>(
  type: T,
  handler: (this: E, ev: SvelteEvent<HTMLElementEventMap[T], E>) => void,
): Attachment<E> {
  return (el) => {
    el.addEventListener(type, handler as EventListenerOrEventListenerObject, {
      passive: false,
    });

    return () => {
      el.removeEventListener(
        type,
        handler as EventListenerOrEventListenerObject,
      );
    };
  };
}
