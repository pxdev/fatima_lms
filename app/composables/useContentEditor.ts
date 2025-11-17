export interface ContentAttributes {
  class?: string;
  position?: string;
  display?: string;

  [key: string]: string | undefined;
}

export function useContentEditor(attributes: ContentAttributes, mode?: string | boolean) {
  const classesManager = computed(() =>
    [mode && 'outline-1 outline-dashed', attributes.class, attributes.position, attributes.display].filter(Boolean),
  );

  return {
    classesManager,
  };
}
