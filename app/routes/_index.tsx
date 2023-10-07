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
import type { FC } from "react";
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

const retiringHour = 22;
const startingHour = 6;
const readyHour = 8;

interface HourProps {
  hour: number;
  isPast?: boolean;
}
const Hour: FC<HourProps> = ({ hour, isPast }: HourProps) => {
  const nonPastColour =
    hour >= retiringHour || hour < readyHour ? "#0004" : "#0000";
  return (
    <div
      className="h-5"
      style={{
        color: "#555",
        borderTop: "solid #666 1px",
        boxSizing: "border-box",
        backgroundColor: isPast ? "gray" : nonPastColour,
      }}
    />
  );
};

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

  const dayAtStartingHour = day.add(startingHour, "hours");
  const nextDayStartingHour = dayAtStartingHour.add(1, "day");

  const eventsAsHours = compact(
    map(events, (ev) =>
      ev.startTime.isBetween(
        dayAtStartingHour,
        nextDayStartingHour,
        undefined,
        "[]",
      ) ||
      getEventEndTime(ev).isBetween(
        dayAtStartingHour,
        nextDayStartingHour,
        undefined,
        "[]",
      )
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
        backgroundColor: dayAtStartingHour.isBefore(
          dayjs().startOf("day").add(startingHour, "hours"),
        )
          ? "gray"
          : "red",
        boxSizing: "border-box",
      }}
    >
      <div className="h-8">
        {day.date() === 1 ? day.format("MMM D") : day.date()}
      </div>
      {detailed && (
        <div style={{ position: "relative" }}>
          {map(range(24), (hour) => (
            <Hour
              hour={(startingHour + hour) % 24}
              isPast={dayAtStartingHour
                .add(hour, "hours")
                .isBefore(dayjs().startOf("hour"))}
            />
          ))}

          {map(eventsAsHours, (ev) => (
            <div
              className="w-3 rounded-full"
              style={{
                overflow: "hidden",
                backgroundColor: "pink",
                height: `calc(20px * ${
                  (min([ev.end, 24 + startingHour]) ?? 0) -
                  (max([ev.start, startingHour]) ?? 0)
                })`,
                position: "absolute",
                right: 0,
                top: `calc(20px * ${clamp(ev.start - startingHour, 0, 24)})`,
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
    <div className="w-6 bg-slate-500 text-right text-xs">
      {focused && (
        <>
          <div className="h-8" />
          {range(24).map((hour) => {
            const moddedHour = (startingHour + hour) % 24;
            const isNextDay = startingHour + hour >= 24;
            return (
              <div key={moddedHour} className="h-5 text-slate-200">
                {isNextDay ? "+" : ""}
                {dayjs().startOf("day").add(moddedHour, "hours").format("HH")}
              </div>
            );
          })}
        </>
      )}
    </div>
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
    { startTime: dayjs().startOf("day").add(5, "hours"), length: 4 },
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
