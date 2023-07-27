import type { V2_MetaFunction } from "@remix-run/node";
import {
  clamp,
  compact,
  forEach,
  isNil,
  last,
  map,
  max,
  min,
  range,
  sortBy,
} from "lodash";
import type { CSSProperties, FC } from "react";
import { useState } from "react";
import moment from "moment";
import type { Moment } from "moment";

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
const Hour: FC<HourProps> = ({ hour, hourHeight }: HourProps) => (
  <div
    style={{
      color: "#555",
      height: hourHeight,
      borderTop: "solid #666 1px",
      boxSizing: "border-box",
      backgroundColor: hour >= 22 || hour < 8 ? "#0004" : "#0000",
    }}
  >
    {moment().startOf("day").add(hour, "hours").format("HH:mm")}
  </div>
);

type Event = { startTime: Moment; length: number };
const getEventEndTime = (event: Event) =>
  moment(event.startTime).add(event.length, "hours");

interface DayProps {
  date: Moment;
  detailed: boolean;
  events: Event[];
}
const Day: FC<DayProps> = ({ date, detailed, events }: DayProps) => {
  const day = moment(date).startOf("day");
  const dayIsOver = day.isBefore(moment().startOf("day"));

  const eventsAsHours = compact(
    map(events, (ev) =>
      day.isBetween(ev.startTime, getEventEndTime(ev), "days", "[]")
        ? {
            start: ev.startTime.diff(day, "hour", true),
            end: getEventEndTime(ev).diff(day, "hour", true),
          }
        : null
    )
  );

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

          {map(eventsAsHours, (ev) => (
            <div
              style={{
                overflow: "hidden",
                backgroundColor: "pink",
                height: `calc(3em * ${
                  (min([ev.end, 24]) ?? 0) - (max([ev.start, 0]) ?? 0)
                })`,
                position: "absolute",
                right: 0,
                top: `calc(3em * ${clamp(ev.start, 0, 24)})`,
                width: "calc(100vw / 14)",
                opacity: 0.5,
              }}
            >
              {ev.end - ev.start}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface WeekProps {
  weekStartDate: Moment;
  focused: boolean;
  events: Event[];
  onClick?: () => any;
}
const Week: FC<WeekProps> = ({
  weekStartDate,
  focused,
  events,
  onClick,
}: WeekProps) => (
  <div style={{ display: "flex", gap: 4 }} onClick={() => onClick?.()}>
    {map(range(7), (d) => (
      <Day
        key={`${moment(weekStartDate).toISOString()}-${d}`}
        date={moment(weekStartDate).add(d, "days")}
        detailed={focused}
        events={events}
      />
    ))}
  </div>
);

const numWeeks = 8;
export default function Index() {
  const events: Event[] = [
    { startTime: moment().startOf("day").subtract(0.5, "hours"), length: 1 },
    { startTime: moment().startOf("day").add(2, "hours"), length: 1 },
    { startTime: moment().startOf("day").add(0, "hours"), length: 1.5 },
  ];

  const flattenedEvents: Event[] = [];
  forEach(
    sortBy(events, (ev) => +moment(ev.startTime)),
    (ev) => {
      const lastFlattened = last(flattenedEvents);
      if (isNil(lastFlattened)) {
        flattenedEvents.push(ev);
        return true; // continue
      }

      if (ev.startTime.isSameOrBefore(getEventEndTime(lastFlattened))) {
        if (getEventEndTime(ev).isAfter(getEventEndTime(lastFlattened))) {
          lastFlattened.length = getEventEndTime(ev).diff(
            lastFlattened.startTime,
            "hours",
            true
          );
          return true; // continue
        }
      } else {
        flattenedEvents.push(ev);
        return true; //continue
      }
    }
  );

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}>
      {map(range(numWeeks), (week) => {
        return (
          <Week
            key={week}
            weekStartDate={moment().startOf("week").add(week, "weeks")}
            events={flattenedEvents}
            focused={week === selectedWeek}
            onClick={() => setSelectedWeek(week)}
          />
        );
      })}
    </div>
  );
}
