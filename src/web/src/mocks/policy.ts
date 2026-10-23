// can(): who may do what. Mock-mode copy of the rules M5 enforces on the server
// (docs/CONTRACT.md "Permission rules"). The UI never relies on this for security.

import type { User } from '@/api'
import type { Business } from '@/lib/demo'
import { rm } from './decide'

export const MANAGER_LIMIT_RM = 500

export type Action = 'view' | 'run_check' | 'approve' | 'edit' | 'reject' | 'settings'

// `orderRm` is the value of the order being approved or edited.
export function can(
  user: User,
  action: Action,
  rec?: { business: Business },
  orderRm = 0,
): [boolean, string] {
  if (rec && rec.business !== user.business) {
    return [false, "You can't act on another business's data."]
  }
  if (action === 'view' || action === 'run_check') return [true, '']

  if (action === 'settings') {
    return user.role === 'owner' ? [true, ''] : [false, 'Only the Owner can change supplier terms.']
  }

  // approve, edit, reject
  if (user.role === 'staff') {
    return [false, "Staff can view recommendations but can't approve, edit or reject orders. Ask an Owner or Manager."]
  }
  if ((action === 'approve' || action === 'edit') && user.role === 'manager' && orderRm > MANAGER_LIMIT_RM) {
    return [
      false,
      `This order is ${rm(orderRm)}. Managers can approve up to ${rm(MANAGER_LIMIT_RM)}, so it needs the Owner.`,
    ]
  }
  return [true, '']
}
