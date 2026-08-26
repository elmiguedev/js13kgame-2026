import type GameObject from "../Object";
import type Renderer from "../renderers/Renderer";

export default class EntityController {
  private readonly objects = new Map<string, GameObject>();

  add<T extends GameObject>(object: T): T {
    if (this.objects.has(object.id)) {
      throw new Error(`An object with id "${object.id}" already exists.`);
    }

    this.objects.set(object.id, object);
    return object;
  }

  get<T extends GameObject = GameObject>(id: string): T | undefined {
    return this.objects.get(id) as T | undefined;
  }

  remove(id: string): GameObject | undefined {
    const object = this.objects.get(id);
    this.objects.delete(id);
    object?.destroy();
    return object;
  }

  update(time: number, delta: number): void {
    for (const object of this.objects.values()) {
      object.update(time, delta);
    }
  }

  render(renderer: Renderer): void {
    for (const object of this.objects.values()) {
      renderer.render(object);
    }
  }

  destroy(): void {
    for (const object of this.objects.values()) {
      object.destroy();
    }

    this.objects.clear();
  }
}
