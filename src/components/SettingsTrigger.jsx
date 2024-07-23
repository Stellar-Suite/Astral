import { Button } from "../@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from "../@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../@/components/ui/drawer";
import React from "react";
import { Settings } from "./Settings";
import { useDesktopCheck } from "../@/hooks/useMediaQuery";

export function SettingsTrigger(props) {
  let [open, setOpen] = React.useState(false);

  let isDesktop = useDesktopCheck();

  if (isDesktop) {
    return (
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogTrigger className={props.className}>
          {props.children || "Settings"}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader className={""}>
            <DialogTitle>Edit Settings</DialogTitle>
            <DialogDescription>
              These settings are specific to this session. Syncing is not yet
              implemented.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Settings />
            </div>
          </div>
          <DialogFooter className={""}>
            <DialogClose asChild>
              <Button type="submit">Save</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  } else {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="outline" className={props.className}>{props.children || "Settings"}</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>Edit Settings</DrawerTitle>
            <DrawerDescription>
            These settings are specific to this session. Syncing is not yet
            implemented.
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <Settings />
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }
}
