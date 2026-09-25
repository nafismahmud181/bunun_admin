'use client';

import { useState } from 'react';
import type { components } from '@/lib/api/schema';

export type Locations = components['schemas']['LocationTree'];
export type PickedArea = Locations[number]['districts'][number]['areas'][number];
const select = 'h-9 w-full rounded-md border bg-background px-2 text-sm';

/** Division → district → area dropdowns. Calls onChange with the chosen area (or null). */
export default function LocationPicker({
  locations,
  onChange,
}: {
  locations: Locations;
  onChange: (area: PickedArea | null) => void;
}) {
  const [divisionId, setDivisionId] = useState(0);
  const [districtId, setDistrictId] = useState(0);
  const [areaId, setAreaId] = useState(0);
  const division = locations.find((d) => d.id === divisionId);
  const district = division?.districts.find((d) => d.id === districtId);
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <select
        aria-label="Division"
        className={select}
        value={divisionId}
        onChange={(e) => {
          setDivisionId(Number(e.target.value));
          setDistrictId(0);
          setAreaId(0);
          onChange(null);
        }}
      >
        <option value={0}>Division</option>
        {locations.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <select
        aria-label="District"
        className={select}
        value={districtId}
        disabled={!division}
        onChange={(e) => {
          setDistrictId(Number(e.target.value));
          setAreaId(0);
          onChange(null);
        }}
      >
        <option value={0}>District</option>
        {division?.districts.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Area"
        className={select}
        value={areaId}
        disabled={!district}
        onChange={(e) => {
          const id = Number(e.target.value);
          setAreaId(id);
          onChange(district?.areas.find((a) => a.id === id) ?? null);
        }}
      >
        <option value={0}>Area / thana</option>
        {district?.areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
    </div>
  );
}
