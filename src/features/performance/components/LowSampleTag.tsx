import { LOW_SAMPLE_MIN } from '../lib/lowSample'

/** Next to an error rate computed from too few controls to compare (FR-37). */
export function LowSampleTag() {
  return (
    <span
      className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500"
      title={`Menos de ${LOW_SAMPLE_MIN} controles enviados: el porcentaje no es comparable`}
    >
      pocos datos
    </span>
  )
}
