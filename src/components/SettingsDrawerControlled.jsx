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

export function SettingsDrawerControlled(props) {
  return (
    <Drawer open={props.open} onOpenChange={props.setOpen}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Settings</DrawerTitle>
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
