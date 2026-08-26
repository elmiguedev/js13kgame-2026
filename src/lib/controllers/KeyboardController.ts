import Controller from "./Controller";

export const Keys = {
  ALT: "Alt",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  ARROW_UP: "ArrowUp",
  BACKSPACE: "Backspace",
  CONTROL: "Control",
  DELETE: "Delete",
  END: "End",
  ENTER: "Enter",
  ESCAPE: "Escape",
  HOME: "Home",
  PAGE_DOWN: "PageDown",
  PAGE_UP: "PageUp",
  SHIFT: "Shift",
  SPACE: " ",
  TAB: "Tab",
} as const;

export class Key {
  isDown = false;

  constructor(readonly value: string) {}

  get isUp(): boolean {
    return !this.isDown;
  }
}

export default class KeyboardController extends Controller {
  private readonly keys = new Map<string, Key>();
  private readonly keyPresses: string[] = [];

  addKey(value: string): Key {
    const normalizedValue = this.normalize(value);
    const existingKey = this.keys.get(normalizedValue);
    if (existingKey) {
      return existingKey;
    }

    const key = new Key(value);
    this.keys.set(normalizedValue, key);
    return key;
  }

  isKeyDown(value: string): boolean {
    return this.keys.get(this.normalize(value))?.isDown ?? false;
  }

  consumeKeyPresses(): string[] {
    return this.keyPresses.splice(0);
  }

  protected override onAttach(): void {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.reset);
  }

  protected override onDetach(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.reset);
    this.reset();
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.keyPresses.push(event.key);
    const key = this.keys.get(this.normalize(event.key));
    if (key) {
      key.isDown = true;
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const key = this.keys.get(this.normalize(event.key));
    if (key) {
      key.isDown = false;
    }
  };

  private readonly reset = (): void => {
    for (const key of this.keys.values()) {
      key.isDown = false;
    }
    this.keyPresses.length = 0;
  };

  private normalize(value: string): string {
    return value.toLowerCase();
  }
}
