/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_PUBLIC_SUPABASE_URL: string
    readonly VITE_PUBLIC_SUPABASE_ANON_KEY: string
    readonly VITE_PUBLIC_PROCESS_PDF_FUNCTION_URL?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'react-pdf/dist/esm/Page/AnnotationLayer.css' {
  const content: string;
  export default content;
}

declare module 'react-pdf/dist/esm/Page/TextLayer.css' {
  const content: string;
  export default content;
}

export {}