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
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { ClientOnly } from "remix-utils";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

export const meta: V2_MetaFunction = () => {
  return [{ title: "Lil Cal" }];
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
    {dayjs().startOf("day").add(hour, "hours").format("HH:mm")}
  </div>
);

type Event = { startTime: Dayjs; length: number };
const getEventEndTime = (event: Event) =>
  dayjs(event.startTime).add(event.length, "hours");

interface DayProps {
  date: Dayjs;
  detailed: boolean;
  events: Event[];
}
const Day: FC<DayProps> = ({ date, detailed, events }: DayProps) => {
  const day = dayjs(date).startOf("day");
  const dayIsOver = day.isBefore(dayjs().startOf("day"));

  const eventsAsHours = compact(
    map(events, (ev) =>
      day.isBetween(ev.startTime, getEventEndTime(ev), "days", "[]")
        ? {
            start: ev.startTime.diff(day, "hour", true),
            end: getEventEndTime(ev).diff(day, "hour", true),
          }
        : null,
    ),
  );

  return (
    <div
      className="aspect-square"
      style={{
        borderWidth: "1px",
        borderStyle: "groove",
        borderColor: "black",
        flex: 1,
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface WeekProps {
  weekStartDate: Dayjs;
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
  <div style={{ display: "flex" }} onClick={() => onClick?.()}>
    {map(range(7), (d) => (
      <Day
        key={`${dayjs(weekStartDate).toISOString()}-${d}`}
        date={dayjs(weekStartDate).add(d, "days")}
        detailed={focused}
        events={events}
      />
    ))}
  </div>
);

const numWeeks = 8;
const Calendar: FC = () => {
  const events: Event[] = [
    { startTime: dayjs().startOf("day").subtract(0.5, "hours"), length: 1 },
    { startTime: dayjs().startOf("day").add(2, "hours"), length: 1 },
    { startTime: dayjs().startOf("day").add(0, "hours"), length: 1.5 },
  ];

  const flattenedEvents: Event[] = [];
  forEach(
    sortBy(events, (ev) => +dayjs(ev.startTime)),
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
            true,
          );
          return true; // continue
        }
      } else {
        flattenedEvents.push(ev);
        return true; //continue
      }
    },
  );

  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  return (
    <div className="w-10/12">
      {map(range(numWeeks), (week) => (
        <Week
          key={week}
          weekStartDate={dayjs().startOf("week").add(week, "weeks")}
          events={flattenedEvents}
          focused={week === selectedWeek}
          onClick={() => setSelectedWeek(week)}
        />
      ))}
    </div>
  );
};

export default function Index() {
  return (
    <div
      className="p-2"
      style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}
    >
      <ClientOnly>{() => <Calendar />}</ClientOnly>
    </div>
  );
}
