'use client'

import React, { useEffect, useState, type ChangeEvent } from 'react'
import { SelectInput, TextInput, useField, useFormFields } from '@payloadcms/ui'
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
 * It is drawn with Payload's own SelectInput and TextInput rather than a
 * bare <select>: an unstyled browser dropdown sat in the form as a small
 * grey box, nothing like the Section field right above it.
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

  const name = path.split('.').pop() ?? 'subCategory'
  const asText =
    state === 'failed' || (!sectionId && !value) || (Boolean(sectionId) && options.length === 0)

  return (
    <div className="field-type text">
      {asText ? (
        <TextInput
          path={path}
          label={label}
          value={value ?? ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          placeholder={sectionId ? 'e.g. Wall Clocks' : 'Choose a Section first'}
        />
      ) : (
        <SelectInput
          name={name}
          path={path}
          label={label}
          isClearable
          readOnly={state === 'loading'}
          placeholder={state === 'loading' ? 'Loading…' : 'Choose one'}
          value={value ?? ''}
          options={[
            // A value the section no longer offers is kept and labelled, not
            // dropped on the next save.
            ...(orphaned ? [{ label: `${value} (no longer in this section)`, value }] : []),
            ...options.map((o) => ({ label: o, value: o })),
          ]}
          onChange={(option) => {
            const picked = Array.isArray(option) ? option[0] : option
            setValue((picked?.value as string) || null)
          }}
        />
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
