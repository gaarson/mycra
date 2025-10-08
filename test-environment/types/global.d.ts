import * as React from 'react';

declare global {
  interface Window {
    deps: any
  }

  type errorType = {
    status: number,
    message: string,
  }
  type glob = {
    env?: {
      buildMode: '"test"',
      NODE_ENV: 'development' | 'production' | 'test',
      PUBLIC_URL: string,
      AIRBRAKE_PROJECT_ID: string | undefined,
      AIRBRAKE_PROJECT_KEY: string | undefined,
      GRAPHQL_SERVER_URL: string | undefined,
      STRIPE_API_KEY: string | undefined,
      DEFAULT_MAIL_FROM?: string
    }
  }
  const glob: glob;
}

declare module 'react' {
  interface HTMLAttributes<T> extends React.HTMLAttributes<T> {
    styleName?: string;
  }

  interface SVGAttributes<T> extends React.SVGAttributes<T> {
    styleName?: string;
  }
}

export {}
