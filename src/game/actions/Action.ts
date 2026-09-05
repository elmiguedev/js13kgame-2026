export default interface Action<I, O> {
  execute(input: I): O;
}
