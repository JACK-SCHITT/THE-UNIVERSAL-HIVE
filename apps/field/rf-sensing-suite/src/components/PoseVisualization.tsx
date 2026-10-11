import { useEffect, useRef } from 'react';
import { HumanPose } from '@/types/wifi-pose';

interface PoseVisualizationProps {
  poses: HumanPose[];
  showDenseRegions: boolean;
  showSkeleton: boolean;
}

export default function PoseVisualization({ poses, showDenseRegions, showSkeleton }: PoseVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with dark background
    ctx.fillStyle = '#0f0f0f';
    ctx.fillRect(0, 0, width, height);

    poses.forEach((pose) => {
      // Draw dense regions
      if (showDenseRegions) {
        pose.denseRegions.forEach((region) => {
          ctx.fillStyle = region.color + '40'; // Semi-transparent
          ctx.strokeStyle = region.color;
          ctx.lineWidth = 2;

          ctx.beginPath();
          region.uvCoordinates.forEach((coord, i) => {
            if (i === 0) {
              ctx.moveTo(coord[0], coord[1]);
            } else {
              ctx.lineTo(coord[0], coord[1]);
            }
          });
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Region label
          const centerX = region.uvCoordinates.reduce((sum, c) => sum + c[0], 0) / region.uvCoordinates.length;
          const centerY = region.uvCoordinates.reduce((sum, c) => sum + c[1], 0) / region.uvCoordinates.length;
          
          ctx.fillStyle = '#ffffff';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(region.id.toString(), centerX, centerY);
        });
      }

      // Draw skeleton
      if (showSkeleton) {
        const connections = [
          ['nose', 'neck'],
          ['neck', 'right_shoulder'],
          ['neck', 'left_shoulder'],
          ['right_shoulder', 'right_elbow'],
          ['right_elbow', 'right_wrist'],
          ['left_shoulder', 'left_elbow'],
          ['left_elbow', 'left_wrist'],
          ['neck', 'right_hip'],
          ['neck', 'left_hip'],
          ['right_hip', 'right_knee'],
          ['right_knee', 'right_ankle'],
          ['left_hip', 'left_knee'],
          ['left_knee', 'left_ankle']
        ];

        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        connections.forEach(([start, end]) => {
          const startPoint = pose.keypoints[start];
          const endPoint = pose.keypoints[end];

          if (startPoint && endPoint) {
            ctx.globalAlpha = Math.min(startPoint.confidence, endPoint.confidence);
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.lineTo(endPoint.x, endPoint.y);
            ctx.stroke();
          }
        });

        ctx.globalAlpha = 1;

        // Draw keypoints
        Object.values(pose.keypoints).forEach((kp) => {
          ctx.fillStyle = '#FF6B6B';
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
          ctx.fill();

          // Confidence ring
          ctx.strokeStyle = `rgba(255, 107, 107, ${kp.confidence})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 8, 0, 2 * Math.PI);
          ctx.stroke();
        });
      }

      // Bounding box
      ctx.strokeStyle = '#FFD93D';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        pose.boundingBox.x,
        pose.boundingBox.y,
        pose.boundingBox.width,
        pose.boundingBox.height
      );
      ctx.setLineDash([]);

      // Confidence label
      ctx.fillStyle = '#FFD93D';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(
        `${(pose.confidence * 100).toFixed(1)}%`,
        pose.boundingBox.x,
        pose.boundingBox.y - 8
      );
    });

  }, [poses, showDenseRegions, showSkeleton]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={400}
        className="w-full rounded-lg border border-gray-800 bg-[#0f0f0f]"
      />
      <div className="absolute top-4 left-4 bg-black/80 px-3 py-2 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-400">
          {poses.length} person{poses.length !== 1 ? 's' : ''} detected
        </p>
      </div>
    </div>
  );
}
