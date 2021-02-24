declare module 'wpt-runner' {
  export interface Reporter {
    startSuite(name: string): void;

    pass(message: string): void;

    fail(message: string): void;

    reportStack(stack: string): void;
  }

  export interface Options {
    rootURL?: string;
    setup?: (window: any) => void;
    filter?: (testPath: string, url: string) => boolean | PromiseLike<boolean>;
    reporter?: Reporter;
  }

  export default function wptRunner(testsPath: string, options?: Options): Promise<number>;
}
