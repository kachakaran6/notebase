import Image from 'next/image'

interface BrandLogoProps {
  size?: number
  className?: string
}

export function BrandLogo({ size = 26, className = '' }: BrandLogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-md overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/notebase.png"
        alt="Notebase Logo"
        width={size * 2}
        height={size * 2}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  )
}
