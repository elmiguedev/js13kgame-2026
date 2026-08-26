import Controller from "./Controller";

export type SocketEvent =
  | { type: "open" }
  | { type: "id"; clientId: string }
  | { type: "connect"; clientId: string }
  | { type: "disconnect"; clientId: string }
  | { type: "message"; data: string }
  | { type: "close" }
  | { type: "error" };

export type SocketListener = (event: SocketEvent) => void;

export default class SocketController extends Controller {
  private socket: WebSocket | undefined;
  private readonly listeners = new Set<SocketListener>();

  constructor(private url?: string) {
    super();
  }

  get connected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  on(listener: SocketListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  send(data: string): boolean {
    if (!this.connected) {
      return false;
    }

    this.socket?.send(data);
    return true;
  }

  sendTo(clientId: string, data: string): boolean {
    return this.send(`@${clientId}|${data}`);
  }

  connect(url = this.url): void {
    if (!url) {
      throw new Error("A WebSocket URL is required.");
    }

    this.disconnect();
    this.url = url;
    this.socket = new WebSocket(url);
    this.socket.addEventListener("open", this.handleOpen);
    this.socket.addEventListener("message", this.handleMessage);
    this.socket.addEventListener("close", this.handleClose);
    this.socket.addEventListener("error", this.handleError);
  }

  disconnect(): void {
    if (!this.socket) {
      return;
    }

    this.socket.removeEventListener("open", this.handleOpen);
    this.socket.removeEventListener("message", this.handleMessage);
    this.socket.removeEventListener("close", this.handleClose);
    this.socket.removeEventListener("error", this.handleError);
    this.socket.close();
    this.socket = undefined;
  }

  protected override onAttach(): void {
    this.connect();
  }

  protected override onDetach(): void {
    this.disconnect();
  }

  destroy(): void {
    this.disconnect();
    this.listeners.clear();
  }

  private readonly handleOpen = (): void => {
    this.emit({ type: "open" });
  };

  private readonly handleMessage = (event: MessageEvent<string>): void => {
    if (typeof event.data !== "string") {
      return;
    }

    const [prefix, clientId] = [event.data[0], event.data.slice(1)];
    if (prefix === "@") {
      this.emit({ type: "id", clientId });
    } else if (prefix === "+") {
      this.emit({ type: "connect", clientId });
    } else if (prefix === "-") {
      this.emit({ type: "disconnect", clientId });
    } else {
      this.emit({ type: "message", data: event.data });
    }
  };

  private readonly handleClose = (): void => {
    this.emit({ type: "close" });
  };

  private readonly handleError = (): void => {
    this.emit({ type: "error" });
  };

  private emit(event: SocketEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
