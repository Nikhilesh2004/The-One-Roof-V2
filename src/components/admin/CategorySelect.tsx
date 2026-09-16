'use client'

import React, { useEffect, useState } from 'react'
import { FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

/**
 * The Category dropdown on a product, filled from the chosen Section.
 *
 * v1 had exactly this: pick "Home & Décor" and the second dropdown offers
 * Wall Clocks, Table Lights, Photo Frames. v2 shipped it as a plain text box,
 * which looks harmless and is not — "Wall clock" typed once and "Wall Clocks"
 * the next time become two separate groups, and nothing warns anybody.
 *
 * The list lives on the Section itself (Sections → Categories), so adding a
 * new kind of thing is done there and appears here, with no code change.
 *
 * The stored value is still plain text, which is what keeps this safe to
 * introduce: the 25 products that already carry a category keep working, and
 * so do search and the product page. If a saved value is no longer offered by
 * the section — renamed, or the section was changed — it is kept and shown as
 * "no longer in this section" rather than silently dropped on the next save.
 */
export const CategorySelect: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path })

  // The Section chosen on this same form, whatever it is right now.
  // Narrowed to a real id: the relationship holds either a bare id or a
  // populated document depending on how the form was loaded.
  const sectionId = useFormFields(([fields]): string | number | null => {
    const v = fields?.category?.value
    const id = typeof v === 'object' && v !== null ? (v as { id?: unknown }).id : v
    return typeof id === 'string' || typeof id === 'number' ? id : null
  })

  const [options, setOptions] = useState<string[]>([])
  const [state, setState] = useState<'idle' | 'loading' | 'failed'>('idle')

  useEffect(() => {
    if (!sectionId) {
      setOptions([])
      setState('idle')
      return
    }

    // A section change mid-request must not be overwritten by the older reply.
    let current = true
    setState('loading')

    fetch(`/api/categories/${sectionId}?depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((doc: { subCategories?: { name?: string }[] }) => {
        if (!current) return
        setOptions((doc.subCategories ?? []).map((s) => s.name ?? '').filter(Boolean))
        setState('idle')
      })
      .catch(() => {
        // Losing the list must never cost somebody their typing, so the field
        // falls back to a text box rather than going blank.
        if (current) setState('failed')
      })

    return () => {
      current = false
    }
  }, [sectionId])

  const label = typeof field?.label === 'string' ? field.label : 'Category'
  const description =
    typeof field?.admin?.description === 'string' ? field.admin.description : undefined

  const orphaned = Boolean(value) && options.length > 0 && !options.includes(value)

  return (
    <div className="field-type text">
      <FieldLabel htmlFor={`field-${path}`} label={label} />

      {state === 'failed' || (!sectionId && !value) || (Boolean(sectionId) && options.length === 0) ? (
        <input
          id={`field-${path}`}
          type="text"
          value={value ?? ''}
          onChange={(e) => setValue(e.target.value)}
          placeholder={sectionId ? 'e.g. Wall Clocks' : 'Choose a Section first'}
        />
      ) : (
        <select
          id={`field-${path}`}
          value={value ?? ''}
          onChange={(e) => setValue(e.target.value || null)}
          disabled={state === 'loading'}
        >
          <option value="">— none —</option>
          {orphaned && <option value={value}>{value} (no longer in this section)</option>}
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {description && <div className="field-description">{description}</div>}

      {!sectionId && (
        <div className="field-description">
          Pick a Section above and this becomes a list of that section&rsquo;s categories.
        </div>
      )}
      {Boolean(sectionId) && options.length === 0 && state === 'idle' && (
        <div className="field-description">
          This section has no categories yet. Add them under Sections, or type one here.
        </div>
      )}
      {state === 'failed' && (
        <div className="field-description">
          Could not load the list just now — type it instead, exactly as it is spelled elsewhere.
        </div>
      )}
    </div>
  )
}
