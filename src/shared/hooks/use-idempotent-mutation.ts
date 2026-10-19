import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { createIdempotencyKey } from "@/lib/idempotency";
import type { MutationToastMeta } from "@/lib/query-meta";

interface IdempotentVariables<TInput> {
  input: TInput;
  idempotencyKey: string;
}

export interface IdempotentMutation<TInput, TResult, TError> extends Omit<
  UseMutationResult<TResult, TError, IdempotentVariables<TInput>>,
  "mutate" | "mutateAsync"
> {
  submit: (input: TInput) => void;
  submitAsync: (input: TInput) => Promise<TResult>;
}

export function useIdempotentMutation<
  TInput,
  TResult,
  TError = Error,
>(options: {
  mutationFn: (input: TInput, idempotencyKey: string) => Promise<TResult>;
  onSuccess?: (result: TResult, input: TInput) => void | Promise<void>;
  meta?: MutationToastMeta;
}): IdempotentMutation<TInput, TResult, TError> {
  const mutation = useMutation<TResult, TError, IdempotentVariables<TInput>>({
    mutationFn: (vars) => options.mutationFn(vars.input, vars.idempotencyKey),
    onSuccess: (result, vars) => options.onSuccess?.(result, vars.input),
    meta: options.meta,
  });

  const submit = (input: TInput) => {
    mutation.mutate({ input, idempotencyKey: createIdempotencyKey() });
  };

  const submitAsync = (input: TInput) =>
    mutation.mutateAsync({ input, idempotencyKey: createIdempotencyKey() });

  return { ...mutation, submit, submitAsync };
}
