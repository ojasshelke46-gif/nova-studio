export function generateSlots(): Date[] {
  const slots: Date[] = [];
  let day = new Date();
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() + 1); // start tomorrow

  let weekdays = 0;

  while (weekdays < 10) {
    const dow = day.getDay();
    if (dow >= 1 && dow <= 5) {
      for (let hour = 10; hour <= 16; hour++) {
        const slot = new Date(day);
        slot.setHours(hour, 0, 0, 0);
        slots.push(slot);
      }
      weekdays++;
    }
    day = new Date(day);
    day.setDate(day.getDate() + 1);
  }

  return slots;
}
