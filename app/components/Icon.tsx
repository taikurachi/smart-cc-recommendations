import Image from "next/image";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  alt?: string;
  color?: string;
}

export default function Icon({
  name,
  size = 24,
  className = "",
  alt,
  color,
}: IconProps) {
  const iconPath = `/${name}-icon.svg`;
  const iconAlt = alt || `${name} icon`;

  // Color mapping for common color names to CSS filter values
  const colorFilters: Record<string, string> = {
    green:
      "brightness(0) saturate(100%) invert(66%) sepia(33%) saturate(512%) hue-rotate(80deg) brightness(93%) contrast(86%)",
    white: "brightness(0) invert(1)",
    black: "brightness(0)",
  };

  const filterStyle =
    color && colorFilters[color.toLowerCase()]
      ? { filter: colorFilters[color.toLowerCase()] }
      : {};

  return (
    <Image
      src={iconPath}
      alt={iconAlt}
      width={size}
      height={size}
      className={className}
      style={filterStyle}
    />
  );
}
