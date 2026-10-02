export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatFullDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTimeShort(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  if (!name) return 'BS';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function parseTags(tagsStr: string): string[] {
  if (!tagsStr) return [];
  return tagsStr
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export const GENERATED_ASSETS = {
  heroBanner: '/src/assets/images/hero_community_platform_1790931121045.jpg',
  topicTech: '/src/assets/images/topic_tech_workspace_1790931136817.jpg',
  topicDesign: '/src/assets/images/topic_design_system_1790931150747.jpg',
  avatarMinh: '/src/assets/images/avatar_founder_minh_1790931162606.jpg',
  avatarLinh: '/src/assets/images/avatar_designer_linh_1790931174009.jpg',
};
