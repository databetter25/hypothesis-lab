import type { ComponentType } from 'react'
import type { LabState, ModuleId } from '../state/labState'
import type { Update } from './common'
import { PValueModule } from './PValueModule'
import { ErrorsModule } from './ErrorsModule'
import { PowerModule } from './PowerModule'
import { PDistModule } from './PDistModule'
import { NPModule } from './NPModule'
import { LRTModule } from './LRTModule'
import { ChiSqModule } from './ChiSqModule'
import { CIModule } from './CIModule'
import { TModule } from './TModule'
import { PitfallsModule } from './PitfallsModule'
import { MoreModule } from './MoreModule'

export const MODULE_COMPONENTS: Record<ModuleId, ComponentType<{ s: LabState; update: Update }>> = {
  pvalue: PValueModule,
  errors: ErrorsModule,
  power: PowerModule,
  pdist: PDistModule,
  np: NPModule,
  lrt: LRTModule,
  chisq: ChiSqModule,
  ci: CIModule,
  ttest: TModule,
  pitfalls: PitfallsModule,
  more: MoreModule,
}
