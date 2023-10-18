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
import { styled } from "styled-components";

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

export const meta: V2_MetaFunction = () => {
  return [{ title: "Lil Cal" }];
};

const colours = { past: "#555", default: "#2f59a7" };

const energy = 0.99;

const startingHour = 6;
const retiringHour = 22;
const readyHour = 8;

const exhaustionRate = 1 / 24;
const eventExhaustionRateMultiplier = 1.2;
// TODO realistically the multiplier follows some sigmoid

// returns a value between 0 and 1 representing the probability of being willing to do something at that hour.
// 0 is never, 1 is always. the value reduces linearly at a rate proportional to the energy level.
// for each hour during an event, the rate is multiplied by the eventExhaustionRateMultiplier
const availabilityFunction = (
  energy: number,
  events: Event[],
  hourSinceReady: number,
): number => {
  // TODO events exhaustion
  return max([energy - hourSinceReady * exhaustionRate, 0]) ?? 0;
};

const HourDiv = styled.div<{
  availability: number;
  isPast: boolean;
  isRetired: boolean;
}>`
  @keyframes availability-progress {
    0% {
      background-color: #6c4242;
    }

    50% {
      background-color: #9f8340;
    }

    100% {
      background-color: #53dd53;
    }
  }

  && {
    border-top: solid #666 1px;
    box-sizing: border-box;

    ${(props) => {
      if (props.isPast) return `background-color: ${colours.past};`;
      if (props.isRetired) return "background-color: #0004;";
      return `animation: 100s linear calc(-1s * ${props.availability * 100})
    paused availability-progress;`;
    }};
  }
`;

interface HourProps {
  hour: number;
  isPast?: boolean;
}
const Hour: FC<HourProps> = ({ hour, isPast }: HourProps) => {
  const displayHour = (startingHour + hour) % 24;
  return (
    <HourDiv
      isPast={isPast ?? false}
      isRetired={displayHour >= retiringHour || displayHour < readyHour}
      availability={availabilityFunction(
        energy,
        [],
        startingHour + hour - readyHour,
      )}
      className="h-5"
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

  const now = dayjs();
  const preciseNowHour = now.diff(day, "hour", true);
  const impreciseNowHour = now.diff(day, "hour");

  const clampedEventsAsHours = now.startOf("day").isAfter(day)
    ? []
    : compact(
        map(eventsAsHours, (ev) => {
          if (preciseNowHour > ev.end) return null;
          return {
            start: impreciseNowHour > ev.start ? impreciseNowHour : ev.start,
            end: ev.end,
          };
        }),
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
          ? colours.past
          : colours.default,
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
              hour={hour}
              isPast={dayAtStartingHour
                .add(hour, "hours")
                .isBefore(dayjs().startOf("hour"))}
            />
          ))}

          {map(clampedEventsAsHours, (ev) => (
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

interface CalendarProps {
  energy: number;
}

const temp = 20;
const Calendar: FC<CalendarProps> = ({ energy }) => {
  const events: Event[] = [
    {
      startTime: dayjs()
        .startOf("day")
        .add(temp, "hour")
        .subtract(0.5, "hours"),
      length: 1,
    },
    {
      startTime: dayjs().startOf("day").add(temp, "hour").add(2, "hours"),
      length: 1,
    },
    {
      startTime: dayjs().startOf("day").add(temp, "hour").add(0, "hours"),
      length: 1.5,
    },
    {
      startTime: dayjs().startOf("day").add(temp, "hour").add(5, "hours"),
      length: 4,
    },
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

const View = () => (
  <main>
    {/* <Battery energy={energy} /> */}
    <Calendar energy={energy} />
  </main>
);

export default function Index() {
  return (
    <div
      className="p-2"
      style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}
    >
      <ClientOnly>{() => <View />}</ClientOnly>
    </div>
  );
}
