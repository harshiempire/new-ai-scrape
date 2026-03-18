import { Play, Globe, Clock, Flag, HelpCircle, type LucideIcon } from "lucide-react";

/**
 * Registry mapping icon names (from backend) to Lucide React components
 * Add new icons here as new node types are created
 */
export const iconRegistry: Record<string, LucideIcon> = {
  Play,
  Globe,
  Clock,
  Flag,
};

/**
 * Get a Lucide icon component by name
 * Returns HelpCircle as fallback for unknown icons
 */
export function getIcon(name: string): LucideIcon {
  return iconRegistry[name] ?? HelpCircle;
}

/**
 * Structured color classes for node rendering
 */
interface ColorClasses {
  icon: string;
  text: string;
  border: string;
  selectedBorder: string;
}

const colorClassesMap: Record<string, ColorClasses> = {
  green: {
    icon: "text-green-600 fill-green-600",
    text: "text-green-900 dark:text-green-400",
    border: "border-green-300 dark:border-green-600",
    selectedBorder: "border-green-500 shadow-lg",
  },
  blue: {
    icon: "text-blue-500",
    text: "text-blue-900 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-600",
    selectedBorder: "border-blue-500 shadow-lg",
  },
  purple: {
    icon: "text-purple-600",
    text: "text-purple-900 dark:text-purple-400",
    border: "border-purple-300 dark:border-purple-600",
    selectedBorder: "border-purple-500 shadow-lg",
  },
  red: {
    icon: "text-red-600 fill-red-600",
    text: "text-red-900 dark:text-red-400",
    border: "border-red-300 dark:border-red-600",
    selectedBorder: "border-red-500 shadow-lg",
  },
  amber: {
    icon: "text-amber-600",
    text: "text-amber-900 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-600",
    selectedBorder: "border-amber-500 shadow-lg",
  },
  gray: {
    icon: "text-gray-600",
    text: "text-gray-900 dark:text-gray-400",
    border: "border-gray-300 dark:border-gray-600",
    selectedBorder: "border-gray-500 shadow-lg",
  },
};

const defaultColorClasses: ColorClasses = colorClassesMap.gray;

/**
 * Get structured color classes for a semantic color name
 */
export function getColorClasses(color: string): ColorClasses {
  return colorClassesMap[color] ?? defaultColorClasses;
}

