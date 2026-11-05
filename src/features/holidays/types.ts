export type Holiday = {
  id: string
  /** Calendar date, YYYY-MM-DD. */
  date: string
  description: string | null
}

export type HolidayFormData = {
  date: string
  description: string
}
