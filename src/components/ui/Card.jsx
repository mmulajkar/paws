export default function Card({ children, className = '', as: Tag = 'div', ...props }) {
  return (
    <Tag className={`bg-white rounded-xl border border-stone-200 ${className}`} {...props}>
      {children}
    </Tag>
  );
}
