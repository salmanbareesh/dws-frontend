import { Instagram, Facebook, Twitter, Linkedin, Youtube, Share2 } from 'lucide-react';

interface SocialIconProps {
  platform: string;
}

export function SocialIcon({ platform }: SocialIconProps) {
  const iconClass = "w-5 h-5";

  const platformLower = platform.toLowerCase();

  if (platformLower.includes('instagram')) {
    return <Instagram className={`${iconClass} text-pink-600`} />;
  }
  if (platformLower.includes('facebook')) {
    return <Facebook className={`${iconClass} text-blue-600`} />;
  }
  if (platformLower.includes('twitter') || platformLower.includes('x.com')) {
    return <Twitter className={`${iconClass} text-sky-500`} />;
  }
  if (platformLower.includes('linkedin')) {
    return <Linkedin className={`${iconClass} text-blue-700`} />;
  }
  if (platformLower.includes('youtube')) {
    return <Youtube className={`${iconClass} text-red-600`} />;
  }

  return <Share2 className={`${iconClass} text-slate-600`} />;
}
