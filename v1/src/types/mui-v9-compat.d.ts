import type { FilledInputProps } from '@mui/material/FilledInput'
import type { InputProps as StandardInputProps } from '@mui/material/Input'
import type { OutlinedInputProps } from '@mui/material/OutlinedInput'
import type { SwitchBaseProps } from '@mui/material/internal/SwitchBase'
import type React from 'react'

declare module '@mui/material/TextField' {
  interface BaseTextFieldProps {
    /**
     * Compatibility bridge for legacy MUI TextField usage.
     * MUI v9 types prefer slotProps.input.
     */
    InputProps?: Partial<StandardInputProps | FilledInputProps | OutlinedInputProps>
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>
    InputLabelProps?: Record<string, unknown>
  }
}

declare module '@mui/material/Radio' {
  interface RadioProps {
    /**
     * Compatibility bridge for legacy MUI Radio usage.
     * MUI v9 types prefer slotProps.input.
     */
    inputProps?: SwitchBaseProps['inputProps']
  }
}

declare module '@mui/material/Grid' {
  interface GridBaseProps {
    /**
     * Compatibility bridge for the legacy Grid item API.
     * MUI v9 uses size instead of xs/sm/md/lg/xl.
     */
    item?: boolean
    xs?: boolean | 'auto' | number
    sm?: boolean | 'auto' | number
    md?: boolean | 'auto' | number
    lg?: boolean | 'auto' | number
    xl?: boolean | 'auto' | number
    flexGrow?: number
    justifyContent?: React.CSSProperties['justifyContent']
    marginBottom?: React.CSSProperties['marginBottom']
    display?: React.CSSProperties['display']
  }
}

declare module '@mui/material/Menu' {
  interface MenuProps {
    /**
     * Compatibility bridge for the legacy MenuListProps API.
     * MUI v9 types prefer slotProps.list.
     */
    MenuListProps?: Record<string, unknown>
  }
}

declare module '@mui/material/Autocomplete' {
  interface AutocompleteProps<
    Value,
    Multiple extends boolean | undefined,
    DisableClearable extends boolean | undefined,
    FreeSolo extends boolean | undefined,
    ChipComponent extends React.ElementType,
  > {
    /**
     * Compatibility bridge for the legacy renderTags API.
     * MUI v9 types prefer renderValue.
     */
    renderTags?: (value: Value[], getTagProps: (args: { index: number }) => Record<string, unknown>) => React.ReactNode
  }
}

declare module '@mui/system/Box/Box' {
  interface BoxOwnProps<Theme extends object = Record<string, unknown>> {
    position?: React.CSSProperties['position']
    top?: React.CSSProperties['top']
    bottom?: React.CSSProperties['bottom']
    left?: React.CSSProperties['left']
    right?: React.CSSProperties['right']
    height?: React.CSSProperties['height']
    color?: React.CSSProperties['color']
  }
}

declare module '@mui/system' {
  interface BoxOwnProps<Theme extends object = Record<string, unknown>> {
    position?: React.CSSProperties['position']
    top?: React.CSSProperties['top']
    bottom?: React.CSSProperties['bottom']
    left?: React.CSSProperties['left']
    right?: React.CSSProperties['right']
    height?: React.CSSProperties['height']
    color?: React.CSSProperties['color']
  }
}


