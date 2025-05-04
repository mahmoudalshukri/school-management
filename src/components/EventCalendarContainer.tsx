export const dynamic = "force-dynamic";

import Image from "next/image";
import Calendar from "react-calendar";
import EventList from "./EventList";
import EventCalendar from "./EventCalendar";

const EventCalendarContainer = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const { date } = searchParams;

  return (
    <div className="bg-white p-4 rounded-md">
      <EventCalendar />
      <div className="flex justify-between items-center">
        <h1 className="text-lg font-semibold my-4">Events</h1>
        <Image src="/moreDark.png" alt="more icon" width={20} height={20} />
      </div>
      <div className="flex flex-col gap-4">
        <EventList dateParams={date} />
      </div>
    </div>
  );
};

export default EventCalendarContainer;
