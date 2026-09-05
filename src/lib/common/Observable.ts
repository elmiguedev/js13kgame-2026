export type ObservableListener<T> = (value: T) => void;

export default class Observable<T> {
  private readonly listeners = new Set<ObservableListener<T>>();

  subscribe(listener: ObservableListener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(value: T): void {
    for (const listener of this.listeners) {
      listener(value);
    }
  }
}
