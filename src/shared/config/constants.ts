export const SHIFTS = [
  { id: '1', label: '1º Turno', window: '06:00–14:00' },
  { id: '2', label: '2º Turno', window: '14:00–22:00' },
  { id: '3', label: '3º Turno', window: '22:00–06:00' },
] as const

export const MACHINE_CODES = [
  'P01',
  'P02',
  'P03',
  'P04',
  'P05',
  'P06',
  'P07',
  'P08',
  'P09',
  'P10',
  'P11',
  'P12',
  'P14',
  'P16',
] as const

export const HOUR_SLOTS = [
  '06–07',
  '07–08',
  '08–09',
  '09–10',
  '10–11',
  '11–12',
  '12–13',
  '13–14',
] as const
