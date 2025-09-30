import React from 'react';

const iconProps = {
  className: "w-6 h-6",
  fill: "none",
  viewBox: "0 0 24 24",
  stroke: "currentColor",
  strokeWidth: 2
};

export const PlayIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3l14 9-14 9V3z" />
  </svg>
);

export const PauseIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
  </svg>
);

export const MuteIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
  </svg>
);

export const UnmuteIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5L6 9H2v6h4l5 4V5zM17.7 7.7a5 5 0 0 1 0 7.06M21.2 4.2a9 9 0 0 1 0 12.6" />
  </svg>
);

export const NextIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 4l8 8-8 8V4zM19 4v16" />
  </svg>
);

export const PrevIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 20l-8-8 8-8v16zM5 20V4" />
  </svg>
);

export const LinkIcon: React.FC = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path>
    </svg>
);

export const PrintIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7h10v6a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6" />
    <path d="M17 17h2a2 2 0 0 0 2 -2v-4a2 2 0 0 0 -2 -2h-14a2 2 0 0 0 -2 2v4a2 2 0 0 0 2 2h2" />
    <path d="M17 9v-4a2 2 0 0 0 -2 -2h-6a2 2 0 0 0 -2 2v4" />
    <rect x="7" y="13" width="10" height="8" rx="2" />
  </svg>
);

export const DownloadIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"></path>
    <polyline points="7 11 12 16 17 11"></polyline>
    <line x1="12" y1="4" x2="12" y2="16"></line>
  </svg>
);

export const UploadIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

export const StopIcon: React.FC = () => (
    <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    </svg>
);

export const SparklesIcon: React.FC = () => (
    <svg {...iconProps}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 22.5l-.648-1.938a3.375 3.375 0 00-2.456-2.456L11.25 18l1.938-.648a3.375 3.375 0 002.456-2.456L16.25 13.5l.648 1.938a3.375 3.375 0 002.456 2.456L21 18.75l-1.938.648a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
);

export const GoogleIcon: React.FC = () => (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.01,35.613,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
);

export const SignOutIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4 M10 17l5-5-5-5 M15 12H3" />
  </svg>
);

export const CloudUploadIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16.5v-11m-3.5 3.5l3.5-3.5 3.5 3.5" />
    <path d="M9 17.5H7.1a3.6 3.6 0 0 1-3.6-3.6 3.6 3.6 0 0 1 3.6-3.6h.4a4.8 4.8 0 0 1 9 0h.4a3.6 3.6 0 0 1 3.6 3.6 3.6 3.6 0 0 1-3.6 3.6H15" />
  </svg>
);

export const CloudDownloadIcon: React.FC = () => (
  <svg {...iconProps} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 16.5v-11m-3.5 3.5l3.5 3.5 3.5-3.5" />
    <path d="M9 17.5H7.1a3.6 3.6 0 0 0-3.6 3.6 3.6 3.6 0 0 0 3.6 3.6h9.8a3.6 3.6 0 0 0 3.6-3.6 3.6 3.6 0 0 0-3.6-3.6H15" />
  </svg>
);
