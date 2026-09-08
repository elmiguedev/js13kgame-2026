export default class Dice {
  static throw(amount: number, size: number): number {
    let total = 0;
    for (let index = 0; index < amount; index += 1) {
      total += Math.floor(Math.random() * size) + 1;
    }
    return total;
  }
}
