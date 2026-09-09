type WaveType = OscillatorType;

export default class SoundManager {
  private context: AudioContext | undefined;
  private musicTimer: number | undefined;
  private musicStep = 0;

  unlock(): void {
    const context = this.context ??= new AudioContext();
    if (context.state === "suspended") {
      void context.resume();
    }
  }

  move(): void {
    this.play(110, 0.03, "triangle", 0.02);
  }

  hit(): void {
    this.play(280, 0.06, "square", 0.05, 120);
  }

  damage(): void {
    this.play(100, 0.1, "sawtooth", 0.05, 60);
  }

  death(): void {
    this.play(180, 0.2, "sawtooth", 0.06, 45);
  }

  placeGem(): void {
    this.play(440, 0.12, "sine", 0.05, 660);
  }

  collectGem(): void {
    this.play(660, 0.08, "triangle", 0.04, 880);
  }

  openDoor(): void {
    this.play(260, 0.5, "sine", 0.06, 520);
    this.play(390, 0.7, "triangle", 0.04, 780);
  }

  startDungeonLoop(): void {
    if (!this.context || this.musicTimer !== undefined) {
      return;
    }

    this.playDungeonNote();
    this.musicTimer = window.setInterval(this.playDungeonNote, 750);
  }

  stopDungeonLoop(): void {
    if (this.musicTimer !== undefined) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = undefined;
    }
  }

  destroy(): void {
    this.stopDungeonLoop();
    void this.context?.close();
  }

  private readonly playDungeonNote = (): void => {
    const notes = [55, 65, 73, 49];
    this.play(notes[this.musicStep++ % notes.length]!, 0.6, "triangle", 0.015);
  };

  private play(frequency: number, duration: number, type: WaveType, volume: number, endFrequency = frequency): void {
    const context = this.context;
    if (!context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const time = context.currentTime;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, time + duration);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + duration);
  }
}
