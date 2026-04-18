import DOMPurify from 'isomorphic-dompurify';

const SanitizedText = ({ text, as = 'span', style, className, ...props }) => {
  const sanitized = DOMPurify.sanitize(text || '', {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  const Component = as;
  return (
    <Component 
      className={className}
      style={style}
      {...props}
    >
      {sanitized}
    </Component>
  );
};

export const sanitizeHTML = (html) => {
  return DOMPurify.sanitize(html || '', {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'span'],
    ALLOWED_ATTR: [],
  });
};

export default SanitizedText;
