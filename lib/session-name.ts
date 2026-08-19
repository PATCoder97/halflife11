const TIME_ZONE = "Asia/Ho_Chi_Minh";

export function formatShootingPeriodName(date: Date) {
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekday = value("weekday");
  const normalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);

  return `${normalizedWeekday} ${value("day")}/${value("month")}/${value("year")} - ${value("hour")}:${value("minute")}`;
}
