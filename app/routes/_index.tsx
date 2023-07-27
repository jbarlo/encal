import type { V2_MetaFunction } from "@remix-run/node";
import { map, range } from "lodash";
import { CSSProperties, FC, useState } from "react";
import moment, { Moment } from "moment";

export const meta: V2_MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

interface HourProps {
  hour: number;
  hourHeight?: CSSProperties["height"];
}
const Hour: FC<HourProps> = ({ hour, hourHeight }: HourProps) => {
  return (
    <div
      style={{
        color: "#555",
        height: hourHeight,
        borderTop: "solid #666 1px",
        boxSizing: "border-box",
      }}
    >
      {moment().startOf("day").add(hour, "hours").format("HH:mm")}
    </div>
  );
};

interface DayProps {
  date: Moment;
  detailed: boolean;
}
const Day: FC<DayProps> = ({ date, detailed }: DayProps) => {
  const day = moment(date).startOf("day");
  const dayIsOver = day.isBefore(moment().startOf("day"));

  const events: { name: string; startHour: number; length: number }[] = [
    { name: "hello", startHour: 3, length: 2 },
    { name: "2", startHour: 2, length: 2 },
  ];

  return (
    <div
      style={{
        borderWidth: "1px",
        borderStyle: "groove",
        borderColor: "black",
        height: detailed ? undefined : 100,
        width: "calc(100vw / 7)",
        backgroundColor: dayIsOver ? "gray" : "red",
        boxSizing: "border-box",
      }}
    >
      {day.date() === 1 ? day.format("MMM D") : day.date()}
      {detailed && (
        <div style={{ position: "relative" }}>
          {map(range(24), (hour) => (
            <Hour hour={hour} hourHeight="3em" />
          ))}

          <div style={{ position: "absolute", top: 0 }}>
            {map(events, (ev) => (
              <div
                style={{
                  overflow: "hidden",
                  backgroundColor: "pink",
                  height: `calc(3em * ${ev.length})`,
                  position: "absolute",
                  right: 0,
                  top: `calc(3em * ${ev.startHour})`,
                  width: "calc(100vw / 14)",
                  opacity: 0.5,
                }}
              >
                {ev.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface WeekProps {
  weekStartDate: Moment;
  focused: boolean;
  onClick?: () => any;
}
const Week: FC<WeekProps> = ({
  weekStartDate,
  focused,
  onClick,
}: WeekProps) => {
  return (
    <div style={{ display: "flex", gap: 4 }} onClick={() => onClick?.()}>
      {map(range(7), (d) => (
        <Day date={moment(weekStartDate).add(d, "days")} detailed={focused} />
      ))}
    </div>
  );
};

const numWeeks = 8;
export default function Index() {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      {map(range(numWeeks), (week) => {
        return (
          <Week
            weekStartDate={moment().startOf("week").add(week, "weeks")}
            focused={week === selectedWeek}
            onClick={() => setSelectedWeek(week)}
          />
        );
      })}
    </div>
  );
}
