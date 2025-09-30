export enum MediaType {
  YouTube = 'YOUTUBE',
  Video = 'VIDEO',
  Audio = 'AUDIO',
  None = 'NONE'
}

export interface Segment {
  id: string;
  title: string;
  subtitle: string;
  mediaUrl: string;
  relatedLink: string;
}

export interface ConferencePlan {
  id: string;
  title: string;
  totalDurationMinutes: number;
  segments: Segment[];
}
