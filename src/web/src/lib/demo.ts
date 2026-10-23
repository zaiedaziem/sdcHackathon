// Demo businesses and users. All names are fictional (synthetic data only).
// The real server has one owner, manager and staff login per business (docs/CONTRACT.md).

export type Business = 'minimart' | 'cafe'
export type Role = 'owner' | 'manager' | 'staff'

export const BUSINESSES: { id: Business; name: string; kind: string }[] = [
  { id: 'minimart', name: 'Kedai Runcit Maju', kind: 'Minimart' },
  { id: 'cafe', name: 'Kopi Sudut', kind: 'Cafe' },
]

export const DEMO_USERS: { role: Role; display_name: string; label: string; can: string }[] = [
  { role: 'owner', display_name: 'Puan Aisyah', label: 'Owner', can: 'Approves any order, changes settings' },
  { role: 'manager', display_name: 'Daniel', label: 'Manager', can: 'Approves orders up to RM 500' },
  { role: 'staff', display_name: 'Mei Ling', label: 'Staff', can: 'Views and runs the check only' },
]

export function businessName(id: Business): string {
  return BUSINESSES.find((b) => b.id === id)?.name ?? id
}

export function demoUser(role: Role) {
  return DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[0]
}
