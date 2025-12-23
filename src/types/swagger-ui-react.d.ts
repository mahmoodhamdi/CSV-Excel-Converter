declare module 'swagger-ui-react' {
  import { ComponentType } from 'react';

  interface SwaggerUIProps {
    url?: string;
    spec?: object;
    docExpansion?: 'list' | 'full' | 'none';
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    displayOperationId?: boolean;
    filter?: boolean | string;
    maxDisplayedTags?: number;
    showExtensions?: boolean;
    showCommonExtensions?: boolean;
    supportedSubmitMethods?: string[];
    tryItOutEnabled?: boolean;
    validatorUrl?: string | null;
    withCredentials?: boolean;
    persistAuthorization?: boolean;
    displayRequestDuration?: boolean;
    syntaxHighlight?: {
      activate?: boolean;
      theme?: string;
    };
  }

  const SwaggerUI: ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
