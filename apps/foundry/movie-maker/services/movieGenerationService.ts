/**
 * Movie Generation Service
 * Handles progression from book → scenes → video
 */

import { Story, MovieGenerationProgress } from '../types';

export const movieGenerationService = {
  async generateMovie(
    story: Story,
    onProgress?: (progress: MovieGenerationProgress) => void
  ): Promise<string> {
    const totalScenes = story.scenes.length;

    return new Promise((resolve) => {
      let progress = 0;

      const tasks = [
        { label: 'Loading story data...', until: 8 },
        { label: 'Analyzing characters & settings...', until: 20 },
        { label: 'Generating scene visuals...', until: 65 },
        { label: 'Compositing scenes...', until: 82 },
        { label: 'Adding soundtrack & effects...', until: 94 },
        { label: 'Finalizing movie...', until: 100 },
      ];

      const interval = setInterval(() => {
        progress = Math.min(100, progress + 1.2);
        const currentScene = Math.floor((progress / 100) * totalScenes);

        const task = tasks.find(t => progress <= t.until) || tasks[tasks.length - 1];

        const status: MovieGenerationProgress['status'] =
          progress < 10 ? 'preparing' :
          progress < 22 ? 'analyzing' :
          progress < 82 ? 'generating' :
          progress < 96 ? 'processing' :
          progress < 100 ? 'finalizing' : 'complete';

        if (onProgress) {
          onProgress({
            storyId: story.id,
            currentScene: Math.min(currentScene, totalScenes),
            totalScenes,
            progress,
            status,
            estimatedTimeRemaining: Math.round(((100 - progress) / 1.2) * 500),
            currentTask: task.label,
          });
        }

        if (progress >= 100) {
          clearInterval(interval);
          resolve('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
        }
      }, 500);
    });
  },

  estimateGenerationTime(durationMinutes: number): number {
    // 1 min video ≈ 30 sec generation (mocked)
    return durationMinutes * 30;
  },
};
