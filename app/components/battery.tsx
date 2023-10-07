import type { FC } from "react";
import { styled } from "styled-components";

const StyledDiv = styled.div<{ energy: number }>`
  @keyframes battery-progress {
    0% {
      background-color: #6c4242;
    }

    40% {
      background-color: #9f8340;
    }

    80% {
      background-color: green;
    }

    90% {
      background-color: green;
    }

    100% {
      background-color: #53dd53;
    }
  }

  && {
    height: 100%;
    width: ${(props) => 4 + props.energy * 100}%;
    background-color: #53dd53;
    border-radius: inherit;
    animation: 100s linear calc(-1s * ${(props) => props.energy * 100}) paused
      battery-progress;
  }
`;

export interface BatteryProps {
  energy: number;
}
const Battery: FC<BatteryProps> = ({ energy }: BatteryProps) => (
  <div
    className="aspect-21/10"
    style={{
      width: 100,
      boxSizing: "border-box",
      padding: 5,
      justifyContent: "end",
    }}
  >
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        position: "relative",
        justifyContent: "end",
      }}
    >
      <div
        style={{
          height: "40%",
          width: "100%",
          backgroundColor: "#222",
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          borderRadius: 4,
        }}
      />
      <div
        style={{
          height: "100%",
          width: "95%",
          backgroundColor: "#222",
          borderRadius: 10,
          zIndex: 1,
          boxSizing: "border-box",
          padding: "5%",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            borderRadius: 8,
            display: "flex",
            justifyContent: "end",
          }}
        >
          <StyledDiv energy={energy} />
        </div>
      </div>
    </div>
  </div>
);

export default Battery;
