/** Separates simulation time from the browser's variable render frame rate. */
export class FixedStepClock {
  readonly stepSeconds: number;
  readonly maxSteps: number;
  private accumulator = 0;
  public droppedSeconds = 0;
  public simulatedTicks = 0;

  constructor(hz = 60, maxSteps = 5) {
    if (!(hz > 0) || !(maxSteps >= 1)) throw new RangeError('Invalid clock settings');
    this.stepSeconds = 1 / hz;
    this.maxSteps = Math.floor(maxSteps);
  }

  /** Advance by real time in seconds. Stalls never create an unbounded catch-up loop. */
  advance(deltaSeconds: number, step: (dt: number) => void): { steps: number; alpha: number; dropped: number } {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) throw new RangeError('Invalid deltaSeconds');
    const capped = Math.min(deltaSeconds, 0.25);
    let dropped = deltaSeconds - capped;
    this.accumulator += capped;
    let steps = 0;
    // Tiny epsilon avoids different step counts under common refresh intervals.
    while (this.accumulator + 1e-10 >= this.stepSeconds && steps < this.maxSteps) {
      this.accumulator -= this.stepSeconds;
      steps++;
      this.simulatedTicks++;
      step(this.stepSeconds);
    }
    if (this.accumulator >= this.stepSeconds) {
      const discard = Math.floor((this.accumulator + 1e-10) / this.stepSeconds);
      const amount = discard * this.stepSeconds;
      this.accumulator -= amount;
      dropped += amount;
    }
    this.accumulator = Math.max(0, this.accumulator);
    this.droppedSeconds += dropped;
    return { steps, alpha: Math.min(1, this.accumulator / this.stepSeconds), dropped };
  }

  /** On blur/visibility loss, discard pending wall time and held input separately. */
  reset(): void {
    this.accumulator = 0;
  }
}
