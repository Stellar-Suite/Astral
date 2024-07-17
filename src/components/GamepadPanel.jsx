import { unfuck } from "../@/lib/utils";
import { streamerClientManager } from "../client/streamer_client";
import React from "react";

// https://ui.shadcn.com/docs/components/table
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../@/components/ui/table"

export function GamepadPanel(props) {
  let sid = props.sid;
  return (
    <Table>
      <TableCaption>Gamepad configuration.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Gamepad</TableHead>
          <TableHead>ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Attached</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">1</TableCell>
          <TableCell>IDK</TableCell>
          <TableCell>Xbox 360</TableCell>
          <TableCell className="text-right">TODO</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}