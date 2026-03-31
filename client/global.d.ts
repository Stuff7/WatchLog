interface ImportMeta {
  readonly env: {
    readonly BASE: string;
  };
}

declare module "*.sql" {
  const content: string;
  export default content;
}
