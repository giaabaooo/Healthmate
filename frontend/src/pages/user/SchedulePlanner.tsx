import React from "react"

interface PlannerEvent {
  title: string
  time: string
  image?: string
}

interface PlannerDay {
  label: string
  date: number
  fullDateStr: string
}

interface Props {
  days: PlannerDay[]
  eventsByDate: Record<string, PlannerEvent[]>
  selectedDate: string
  onSelectDate: (date: string) => void
}

const SchedulePlanner = ({
  days,
  eventsByDate,
  selectedDate,
  onSelectDate,
}: Props) => {

  const selectedEvents = eventsByDate[selectedDate] || []

  return (
    <aside className="w-full xl:w-[380px] flex-shrink-0 flex flex-col gap-8">

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-6 lg:sticky lg:top-24">

        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">Schedule Planner</h3>
        </div>

        {/* 1. Dùng Flex justify-between thay vì Grid để tránh dính chữ */}
        <div className="flex items-center justify-between w-full">
          {days.map((day) => {
            const hasWorkout = eventsByDate[day.fullDateStr]?.length > 0;
            const active = selectedDate === day.fullDateStr;

            return (
              <button
                key={day.fullDateStr}
                onClick={() => onSelectDate(day.fullDateStr)}
                className="flex flex-col items-center gap-1.5 outline-none group"
              >
                <span className={`text-[11px] font-bold uppercase tracking-wider ${active ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}>
                  {day.label}
                </span>

                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all duration-300
                  ${active
                    ? "bg-primary text-slate-900 font-bold scale-110 shadow-md"
                    : "font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                  }`}
                >
                  {day.date}
                </div>

                <div
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 mt-1
                  ${hasWorkout
                    ? "bg-orange-500"
                    : "bg-transparent"
                  }`}
                />
              </button>
            )
          })}
        </div>

        {/* Weekly overview */}
        <div className="flex flex-col gap-4 mt-2 border-t border-slate-100 dark:border-slate-800 pt-6">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">
            Weekly Overview
          </h4>

          {selectedEvents.length === 0 ? (
            <div className="text-sm text-slate-500 italic p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
              No workouts scheduled
            </div>
          ) : (
            selectedEvents.map((ev, i) => (
              <div
                key={i}
                className="group p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-default"
              >
                {/* Image */}
                <img
                  src={ev.image || "https://placehold.co/60x60"}
                  alt={ev.title}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                />

                {/* Text */}
                <div className="flex-1 overflow-hidden">
                  <h5 className="text-sm font-bold truncate text-slate-900 dark:text-white">
                    {ev.title}
                  </h5>
                  <p className="text-[11px] font-bold text-slate-500 mt-0.5">
                    {ev.time}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </aside>
  )
}

export default SchedulePlanner