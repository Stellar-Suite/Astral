import { Button } from "../@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogClose
} from "../@/components/ui/dialog";
import React from "react";
import { Settings } from "./Settings";

export function SettingsTrigger(props) {
  return (
    <Dialog>
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
}
