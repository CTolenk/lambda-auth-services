export interface UseCase<Input, Output> {
  execute(request: Input): Promise<Output>;
}
