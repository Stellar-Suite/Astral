import { Button } from "../@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "../@/components/ui/dialog";
import React from "react";

export function Settings(props) {
  return (
    <Dialog>
      <DialogTrigger>{props.text || "Settings"}</DialogTrigger>
      <DialogContent>
        <DialogHeader className={""}>
          <DialogTitle>Edit Settings</DialogTitle>
          <DialogDescription>
            These settings are specific to this session. Syncing is not yet implemented.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
                
          </div>
        </div>
        <DialogFooter className={""}>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
