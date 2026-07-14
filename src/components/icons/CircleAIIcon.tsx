import React from "react";
import Svg, { G, Rect } from "react-native-svg";

type CircleAIIconProps = {
  size?: number;
  color?: string;
};

export function CircleAIIcon({
  size = 26,
  color = "#172231",
}: CircleAIIconProps): React.ReactElement {
  const centre = 50;
  const segmentCount = 14;
  const segmentWidth = 9;
  const segmentHeight = 15;
  const ringRadius = 36;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityLabel="Circle AI"
    >
      <G>
        {Array.from({ length: segmentCount }).map((_, index) => {
          const angle = (360 / segmentCount) * index;

          return (
            <Rect
              key={index}
              x={centre - segmentWidth / 2}
              y={centre - ringRadius - segmentHeight / 2}
              width={segmentWidth}
              height={segmentHeight}
              rx={3.5}
              fill={color}
              transform={`rotate(${angle} ${centre} ${centre})`}
            />
          );
        })}
      </G>

      <Rect
        x={38}
        y={36.5}
        width={10}
        height={27}
        rx={3}
        fill={color}
      />

      <Rect
        x={52}
        y={36.5}
        width={10}
        height={27}
        rx={3}
        fill={color}
      />
    </Svg>
  );
}
