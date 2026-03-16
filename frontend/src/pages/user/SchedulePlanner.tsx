import React from "react"

interface PlannerEvent {
  title: string
  time: string
  image?: string
}

interface PlannerDay {
  label: string
  date: number
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
  console.log("Selected Events:", selectedEvents)

  return (
    <aside className="w-[380px] hidden xl:flex flex-col gap-8">

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-6 sticky top-24">

        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">Schedule Planner</h3>
        </div>

        {/* Week grid */}
        <div className="grid grid-cols-7 gap-2">
{days.map((day, index) => {

  const today = new Date()

  const realDate = new Date(today)
  realDate.setDate(today.getDate() + index)

  const year = realDate.getFullYear()
  const month = String(realDate.getMonth() + 1).padStart(2, "0")
  const date = String(realDate.getDate()).padStart(2, "0")

  const dateKey = `${year}-${month}-${date}`

  const hasWorkout = eventsByDate[dateKey]?.length > 0
  const active = selectedDate === dateKey

  return (
    <div
      key={dateKey}
      onClick={() => onSelectDate(dateKey)}
      className="flex flex-col items-center gap-2 cursor-pointer"
    >
      <span className="text-[10px] font-bold text-slate-400 uppercase">
        {day.label}
      </span>

      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
        ${active
          ? "bg-primary text-slate-900 font-bold"
          : "hover:bg-slate-100 dark:hover:bg-slate-800"
        }`}
      >
        {realDate.getDate()}
      </div>

      <div
        className={`w-1.5 h-1.5 rounded-full
        ${hasWorkout
          ? "bg-primary"
          : "bg-slate-200 dark:bg-slate-700"
        }`}
      />
    </div>
  )
})}
        </div>

        {/* Weekly overview */}
        <div className="flex flex-col gap-4 mt-4">

          <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            Weekly Overview
          </h4>

          {selectedEvents.length === 0 ? (
            <div className="text-sm text-slate-400">
              No workouts scheduled
            </div>
          ) : (
selectedEvents.map((ev, i) => (
  <div
    key={i}
    className="group p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
  >

    {/* Image */}
    <img
      src={ev.image || "https://placehold.co/60x60"}
      className="w-10 h-10 rounded-lg object-cover"
    />

    {/* Text */}
    <div className="flex-1 overflow-hidden">
      <h5 className="text-xs font-semibold truncate group-hover:text-sm">
        {ev.title}
      </h5>

      <p className="text-[10px] text-slate-500">
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