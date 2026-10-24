import { useEffect, useState } from 'react';

import { getApiBaseUrl } from '@/api/client';

type ProfileAvatarProps = {
  imageUrl?: string | null;
  name: string;
  className: string;
};

function resolveImageUrl(imageUrl: string) {
  try {
    return new URL(imageUrl, getApiBaseUrl() || window.location.origin).toString();
  } catch {
    return '';
  }
}

export function ProfileAvatar({ imageUrl, name, className }: ProfileAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();
  const src = imageUrl ? resolveImageUrl(imageUrl) : '';

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  return (
    <span className={`${className} profile-avatar`}>
      {src && !imageFailed ? (
        <img src={src} alt={`${name} profile`} onError={() => setImageFailed(true)} />
      ) : initials}
    </span>
  );
}
