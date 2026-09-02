// Analytics abstraction layer

export type AnalyticsEvent =
  | 'game_start'
  | 'game_end'
  | 'tutorial_step'
  | 'tutorial_complete'
  | 'pause'
  | 'resume'
  | 'restart'
  | 'quit'
  | 'level_complete'
  | 'level_fail'
  | 'content_unlock'
  | 'skin_change';

class AnalyticsService {
  public logEvent(event: AnalyticsEvent, params: Record<string, string | number | boolean> = {}) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Analytics] ${event}:`, params);
    }
    // Can easily hook into external SDKs like Firebase Analytics, Mixpanel, etc.
  }
}

export const analytics = new AnalyticsService();
