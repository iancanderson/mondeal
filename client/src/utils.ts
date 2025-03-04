import { PropertyColor } from "./types";

export function getRequiredSetSize(color: PropertyColor): number {
  switch (color) {
    case PropertyColor.BROWN:
    case PropertyColor.BLUE:
    case PropertyColor.UTILITY:
      return 2;
    case PropertyColor.RAILROAD:
      return 4;
    default:
      return 3;
  }
}
