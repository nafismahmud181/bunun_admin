'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  addZoneAction,
  deleteZoneAction,
  setAreaZoneAction,
  setDistrictZoneAction,
  updateZoneAction,
} from '@/app/(dashboard)/settings/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { components } from '@/lib/api/schema';

type Zone = components['schemas']['AdminZone'];
type Locations = components['schemas']['LocationTree'];
const select = 'h-8 rounded-md border bg-background px-2 text-sm';

function ZoneRow({ zone }: { zone: Zone }) {
  const [name, setName] = useState(zone.name);
  const [fee, setFee] = useState(String(zone.fee));
  const [estimate, setEstimate] = useState(zone.estimate);
  const [pending, start] = useTransition();
  const dirty = name !== zone.name || Number(fee) !== zone.fee || estimate !== zone.estimate;
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(msg);
      else toast.error(r.error);
    });
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{zone.key}</TableCell>
      <TableCell>
        <Input className="h-8" value={name} onChange={(e) => setName(e.target.value)} aria-label="Zone name" />
      </TableCell>
      <TableCell>
        <Input
          className="h-8 w-24"
          type="number"
          min={0}
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          aria-label="Fee"
        />
      </TableCell>
      <TableCell>
        <Input
          className="h-8 w-32"
          value={estimate}
          onChange={(e) => setEstimate(e.target.value)}
          aria-label="Delivery time"
        />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {zone.key === 'outside-dhaka'
          ? 'default'
          : `${zone.areas} area${zone.areas === 1 ? '' : 's'}, ${zone.districts} district${zone.districts === 1 ? '' : 's'}`}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        {dirty && (
          <Button
            size="sm"
            disabled={pending}
            onClick={() => run(() => updateZoneAction(zone.key, { name, fee: Number(fee), estimate }), 'Zone saved')}
          >
            Save
          </Button>
        )}
        {zone.key !== 'outside-dhaka' && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => confirm(`Delete ${zone.name}?`) && run(() => deleteZoneAction(zone.key), 'Zone deleted')}
          >
            Delete
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function ZonesTable({ zones }: { zones: Zone[] }) {
  const [draft, setDraft] = useState({ key: '', name: '', fee: '', estimate: '' });
  const [pending, start] = useTransition();
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key</TableHead>
            <TableHead>Name (shown to shoppers)</TableHead>
            <TableHead>Fee ৳</TableHead>
            <TableHead>Delivery time</TableHead>
            <TableHead>Used by</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {zones.map((z) => (
            <ZoneRow key={`${z.key}-${z.name}-${z.fee}-${z.estimate}`} zone={z} />
          ))}
          <TableRow className="bg-muted/40">
            <TableCell>
              <Input
                className="h-8 w-32 font-mono text-xs"
                placeholder="dhaka-suburbs"
                value={draft.key}
                onChange={(e) => setDraft({ ...draft, key: e.target.value })}
                aria-label="New zone key"
              />
            </TableCell>
            <TableCell>
              <Input
                className="h-8"
                placeholder="Dhaka suburbs"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                aria-label="New zone name"
              />
            </TableCell>
            <TableCell>
              <Input
                className="h-8 w-24"
                type="number"
                min={0}
                value={draft.fee}
                onChange={(e) => setDraft({ ...draft, fee: e.target.value })}
                aria-label="New zone fee"
              />
            </TableCell>
            <TableCell>
              <Input
                className="h-8 w-32"
                placeholder="2–3 days"
                value={draft.estimate}
                onChange={(e) => setDraft({ ...draft, estimate: e.target.value })}
                aria-label="New zone delivery time"
              />
            </TableCell>
            <TableCell />
            <TableCell className="text-right">
              <Button
                size="sm"
                disabled={pending || !draft.key || !draft.name || draft.fee === '' || !draft.estimate}
                onClick={() =>
                  start(async () => {
                    const r = await addZoneAction({ ...draft, fee: Number(draft.fee) });
                    if (r.ok) {
                      toast.success('Zone added');
                      setDraft({ key: '', name: '', fee: '', estimate: '' });
                    } else toast.error(r.error);
                  })
                }
              >
                Add
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

/** Which zone each area of a district uses. An area without its own zone uses the district's. */
export function AreaZones({ locations, zones }: { locations: Locations; zones: Zone[] }) {
  const districts = locations
    .flatMap((dv) => dv.districts.map((d) => ({ ...d, division: dv.name })))
    .sort((a, b) => a.name.localeCompare(b.name));
  const [districtId, setDistrictId] = useState(47); // Dhaka
  const [pending, start] = useTransition();
  const district = districts.find((d) => d.id === districtId);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success('Delivery zone updated');
      else toast.error(r.error);
    });
  const zoneName = (key: string) => zones.find((z) => z.key === key)?.name ?? key;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className={select}
          value={districtId}
          onChange={(e) => setDistrictId(Number(e.target.value))}
          aria-label="District"
        >
          {districts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.division})
            </option>
          ))}
        </select>
        {district && district.areas.length > 0 && (
          <span className="text-sm text-muted-foreground">Set all areas to:</span>
        )}
        {district && (
          <select
            className={select}
            value=""
            disabled={pending}
            onChange={(e) =>
              e.target.value &&
              run(() =>
                setAreaZoneAction(
                  district.areas.map((a) => a.id),
                  e.target.value === '-' ? null : e.target.value,
                ),
              )
            }
            aria-label="Set all areas"
          >
            <option value="">Choose…</option>
            <option value="-">District default</option>
            {zones.map((z) => (
              <option key={z.key} value={z.key}>
                {z.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {district && (
        <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
          {district.areas.map((a) => (
            <li
              key={`${a.id}-${a.zone}`}
              className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-1 text-sm"
            >
              <span>{a.name}</span>
              <select
                className={`${select} w-52 shrink-0`}
                defaultValue={a.zone}
                disabled={pending}
                onChange={(e) => run(() => setAreaZoneAction([a.id], e.target.value))}
                aria-label={`Zone for ${a.name}`}
                title={zoneName(a.zone)}
              >
                {zones.map((z) => (
                  <option key={z.key} value={z.key}>
                    {z.name} (৳{z.fee})
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
      {district && (
        <p className="text-xs text-muted-foreground">
          To make a whole district one zone (including areas added later), set its default:{' '}
          <select
            className={select}
            defaultValue=""
            disabled={pending}
            onChange={(e) =>
              e.target.value &&
              run(() => setDistrictZoneAction(district.id, e.target.value === '-' ? null : e.target.value))
            }
            aria-label="District default zone"
          >
            <option value="">Choose…</option>
            <option value="-">Store default (outside Dhaka)</option>
            {zones.map((z) => (
              <option key={z.key} value={z.key}>
                {z.name}
              </option>
            ))}
          </select>
        </p>
      )}
    </div>
  );
}
