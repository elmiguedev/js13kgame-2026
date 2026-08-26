import Text from "./Text";

export interface TextFieldConfig {
  x: number;
  y: number;
  width: number;
  height?: number;
  value?: string;
  placeholder?: string;
  maxLength?: number;
  onSubmit?: (value: string) => void;
}

export default class TextField extends Text {
  readonly width: number;
  readonly height: number;
  readonly placeholder: string;
  readonly maxLength: number;
  value: string;
  focused = false;
  private readonly onSubmit: ((value: string) => void) | undefined;

  constructor({ x, y, width, height = 14, value = "", placeholder = "", maxLength = 32, onSubmit }: TextFieldConfig) {
    super({ x, y }, value || placeholder, {
      color: value ? "#ffffff" : "#777777",
      hitArea: { width, height },
    });
    this.width = width;
    this.height = height;
    this.value = value;
    this.placeholder = placeholder;
    this.maxLength = maxLength;
    this.onSubmit = onSubmit;
    this.onClick = () => this.focus();
  }

  override focus(): void {
    this.focused = true;
  }

  override blur(): void {
    this.focused = false;
  }

  override handleKey(key: string): void {
    if (!this.focused) {
      return;
    }

    if (key === "Backspace") {
      this.value = this.value.slice(0, -1);
    } else if (key === "Enter") {
      this.onSubmit?.(this.value);
    } else if (key.length === 1 && this.value.length < this.maxLength) {
      this.value += key;
    }
  }

  override render(context: CanvasRenderingContext2D): void {
    context.fillStyle = "#111111";
    context.fillRect(this.position.x, this.position.y, this.width, this.height);
    context.strokeStyle = this.focused ? "#ffffff" : "#555555";
    context.strokeRect(this.position.x, this.position.y, this.width, this.height);

    this.text = this.value || this.placeholder;
    this.color = this.value ? "#ffffff" : "#777777";
    context.save();
    context.translate(3, 3);
    super.render(context);
    context.restore();
  }
}
