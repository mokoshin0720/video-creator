import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const features = [
  { icon: "🎬", label: "コードで動画作成" },
  { icon: "⚛️", label: "Reactコンポーネント" },
  { icon: "🚀", label: "高品質レンダリング" },
];

const FeatureCard: React.FC<{
  icon: string;
  label: string;
  index: number;
}> = ({ icon, label, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const delay = index * Math.round(fps * 0.3);

  const entrance = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 120 },
  });

  const x = interpolate(entrance, [0, 1], [100, 0]);

  return (
    <div
      style={{
        opacity: entrance,
        transform: `translateX(${x}px)`,
      }}
      className="flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-2xl px-10 py-6"
    >
      <span className="text-5xl">{icon}</span>
      <span className="text-white text-3xl font-medium">{label}</span>
    </div>
  );
};

export const FeaturesScene: React.FC = () => {
  return (
    <AbsoluteFill className="bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
      <div className="flex flex-col gap-8">
        {features.map((f, i) => (
          <FeatureCard key={i} icon={f.icon} label={f.label} index={i} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
