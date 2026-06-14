import { COLORS } from '../../design-system';

export default function GradientBackground({
  children,
  className = '',
  fullHeight = false,
}) {
  const heightClass = fullHeight
    ? 'h-full min-h-full'
    : 'min-h-screen';

  return (
    <div
      className={`relative overflow-x-hidden ${heightClass} ${className}`}
      style={{
        backgroundColor: COLORS.background,
        backgroundImage:
          'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(56, 189, 248, 0.04), transparent 55%)',
      }}
    >
      {children}
    </div>
  );
}
