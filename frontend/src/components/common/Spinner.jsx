export default function Spinner({ size = 'md', className = '' }) {
  const px = { sm: 16, md: 28, lg: 44 }[size] ?? 28;
  const bw = { sm: 2, md: 2.5, lg: 3 }[size] ?? 2.5;

  return (
    <div
      className={className}
      style={{
        width: px, height: px,
        borderRadius: '50%',
        border: `${bw}px solid rgba(59,130,246,0.15)`,
        borderTopColor: '#3b82f6',
        animation: 'spin 0.65s linear infinite',
        display: 'inline-block',
        flexShrink: 0,
      }}
    />
  );
}
