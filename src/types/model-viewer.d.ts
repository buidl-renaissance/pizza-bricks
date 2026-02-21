import "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          "ios-src"?: string;
          alt?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "camera-orbit"?: string;
          "auto-rotate"?: boolean;
          "camera-controls"?: boolean;
          style?: React.CSSProperties;
        },
        HTMLElement
      >;
    }
  }
}

export {};
