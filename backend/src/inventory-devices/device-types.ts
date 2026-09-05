// The 12 device-type tables in itms_inventech share no single schema —
// they fall into 3 column-shape families (see labelOf below) — so this
// whitelist is the single source of truth every device-type-aware piece
// of the inventory backend (service dispatch, controller param
// validation) is built from.
export const DEVICE_TYPE_SLUGS = [
  'desktops',
  'laptops',
  'cameras',
  'headsets',
  'printers',
  'splitters',
  'switchers',
  'ups',
  'others',
  'routers',
  'firewalls',
  'switches',
] as const;

export type DeviceTypeSlug = (typeof DEVICE_TYPE_SLUGS)[number];

export function isDeviceTypeSlug(value: string): value is DeviceTypeSlug {
  return (DEVICE_TYPE_SLUGS as readonly string[]).includes(value);
}

export interface UnifiedDevice {
  id: number;
  deviceType: DeviceTypeSlug;
  label: string;
  personnelId: number | null;
  divisionId: number | null;
  serialNo: string | null;
  isActive: boolean;
  createdDate: string | null;
  lastUpdateAt: string | null;
  raw: Record<string, any>;
}

// Builds the display label from whichever columns a given table actually
// has: desktops/laptops/others carry a device_name; the "simple" family
// (cameras, headsets, printers, splitters, switchers, ups) carries
// brand+model; the network-gear family (routers, firewalls, switches)
// carries manufacturer+model instead of brand.
export function normalizeDevice(deviceType: DeviceTypeSlug, row: Record<string, any>): UnifiedDevice {
  let label: string;

  if (deviceType === 'desktops' || deviceType === 'laptops' || deviceType === 'others') {
    label = row.device_name ?? `Unnamed ${deviceType.slice(0, -1)}`;
  } else if (deviceType === 'routers' || deviceType === 'firewalls' || deviceType === 'switches') {
    label = [row.manufacturer, row.model].filter(Boolean).join(' ') || `Unnamed ${deviceType.slice(0, -1)}`;
  } else {
    label = [row.brand, row.model].filter(Boolean).join(' ') || `Unnamed ${deviceType.slice(0, -1)}`;
  }

  // desktops/laptops/firewalls use `last_updated_at`; every other table
  // uses `last_update_at` — a genuine inconsistency in the source schema.
  const lastUpdateAt = row.last_updated_at ?? row.last_update_at ?? null;

  return {
    id: row.id,
    deviceType,
    label,
    personnelId: row.personnel_id ?? null,
    divisionId: row.division_id ?? null,
    // desktops/laptops don't have a `serial_no` column at all — theirs is
    // named `par_serial_no` (property-acknowledgment-receipt serial).
    serialNo: row.serial_no ?? row.par_serial_no ?? null,
    isActive: Boolean(row.is_active),
    createdDate: row.created_date ?? null,
    lastUpdateAt,
    raw: row,
  };
}
