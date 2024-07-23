import * as React from "react"
// adapted from  https://github.com/shadcn-ui/ui/pull/4092/files
export function useMediaQuery(query) {
  const [value, setValue] = React.useState(false)

  React.useEffect(() => {
    function onChange(event) {
      setValue(event.matches)
    }

    const result = matchMedia(query)
    result.addEventListener("change", onChange)
    setValue(result.matches)

    return () => result.removeEventListener("change", onChange)
  }, [query])

  return value
}

export function useDesktopCheck() {
  return useMediaQuery("(min-width: 768px)")
}