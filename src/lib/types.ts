export interface ProgressItemTransformer {
  file: string;

  loaded: number;

  progress:
    | "progess"
    | "done"
    | "ready"
    | "complete"
    | "initiate"
    | "error"
    | "update"
    | "complete"
    | "abort";

  total: number;

  name: string;

  status: string;
}
