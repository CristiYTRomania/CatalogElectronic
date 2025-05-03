import * as React from "react";
import { Day } from "@progress/kendo-date-math";

import { IntlProvider, LocalizationProvider } from "@progress/kendo-react-intl";

import {
  Scheduler,
  TimelineView,
  DayView,
  WeekView,
  MonthView,
  AgendaView,
} from "@progress/kendo-react-scheduler";
import { SchedulerProportionalViewItem } from "@progress/kendo-react-scheduler";
import "@progress/kendo-date-math/tz/Europe/Bucharest";

function Orar() {
  return (
    <LocalizationProvider language="ro-RO">
      <IntlProvider>
        <Scheduler
          timezone="Europe/Bucharest"
          height={"85vh"}
          onDataChange={() => {}}
          data={[]}
          locale="ro RO"
          format={
            ("en-US",
            {
              hour12: false,
            })
          }
          view={"Week"}
          onViewChange={() => {}}
          workDayStart={"08:00"}
          allDay={false}
          workWeekStart={Day.Sunday}
          workWeekEnd={Day.Saturday}
          slotDuration={120}
          workDayEnd={"22:00"}
          startTime={"08:00"}
          majorTick={120}
          endTime={"22:00"}
          editable={
            true
              ? {
                  add: false,
                  drag: false,
                  edit: false,
                  remove: false,
                  resize: false,
                  select: true,
                }
              : {
                  add: true,
                  edit: true,
                  remove: true,
                  select: true,
                  drag: false,
                  resize: false,
                }
          }
          footer={() => <></>}
        >
          <DayView
            allDay={false}
            height={"100vh"}
            workWeekStart={Day.Saturday}
            workWeekEnd={Day.Saturday}
            workDayStart={"08:00"}
            viewItem={SchedulerProportionalViewItem}
            editable={
              true
                ? {
                    add: false,
                    drag: false,
                    edit: false,
                    remove: false,
                    resize: false,
                    select: true,
                  }
                : {
                    add: true,
                    edit: true,
                    remove: true,
                    select: true,
                    drag: false,
                    resize: false,
                  }
            }
            workDayEnd={"23:00"}
            slotDuration={120}
          />
          <WeekView
            allDay={false}
            height={"100vh"}
            workWeekStart={Day.Saturday}
            workWeekEnd={Day.Saturday}
            viewItem={SchedulerProportionalViewItem}
            editable={
              true
                ? {
                    add: false,
                    drag: false,
                    edit: false,
                    remove: false,
                    resize: false,
                    select: true,
                  }
                : {
                    add: true,
                    edit: true,
                    remove: true,
                    select: true,
                    drag: false,
                    resize: false,
                  }
            }
            workDayStart={"08:00"}
            slotDuration={120}
            workDayEnd={"23:00"}
          />
          <MonthView
            allDay={false}
            height={"100vh"}
            workWeekStart={Day.Saturday}
            workWeekEnd={Day.Saturday}
            workDayStart={"08:00"}
            editable={
              true
                ? {
                    add: false,
                    drag: false,
                    edit: false,
                    remove: false,
                    resize: false,
                    select: true,
                  }
                : {
                    add: true,
                    edit: true,
                    remove: true,
                    select: true,
                    drag: false,
                    resize: false,
                  }
            }
            workDayEnd={"23:00"}
            slotDuration={120}
          />
        </Scheduler>
      </IntlProvider>
    </LocalizationProvider>
  );
}

export default Orar;
