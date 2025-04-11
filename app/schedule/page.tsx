import { ScheduleViewEnhanced } from "@/components/schedule-view-enhanced"

export default function SchedulePage({
  searchParams,
}: { searchParams: { [key: string]: string | string[] | undefined } }) {
  return (
    <ScheduleViewEnhanced initialLocation={searchParams.location as string} initialTab={searchParams.tab as string} />
  )
}
