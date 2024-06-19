import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn, unfuck } from "../../lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = unfuck(React.forwardRef(({ ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      props["className"]
    )}
    {...props} />
)))
TabsList.displayName = TabsPrimitive.List.displayName
TabsList.propTypes = {};

const TabsTrigger = unfuck(React.forwardRef(({ ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    value={props["value"]}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      props["className"]
    )}
    {...props} />
)))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName
const TabsContent = unfuck(React.forwardRef(({ ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    value={props["value"]}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      props["className"]
    )}
    {...props} />
)))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
