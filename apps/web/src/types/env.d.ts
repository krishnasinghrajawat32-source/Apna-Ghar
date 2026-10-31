declare global {
  interface Process {
    env: {
      [key: string]: string | undefined;
      NODE_ENV?: 'development' | 'production' | 'test';
      NEXT_PUBLIC_API_URL?: string;
      NEXT_PUBLIC_APP_URL?: string;
      PORT?: string;
    };
  }
}

export {};
